// backend/services/operations/attendance/adapters/face.adapter.js
const { compareDescriptors, cosineSimilarity } = require('../../../core/faceRecognition.service');

/**
 * Pluggable Face Recognition & Liveness Provider
 */
class LocalVisionProvider {
  /**
   * Checks liveness telemetry and frame sanity checks.
   */
  checkLiveness(facePayload = {}) {
    // Client-side eye aspect ratio / blink challenge or head rotation score
    if (facePayload.livenessScore !== undefined) {
      return parseFloat(facePayload.livenessScore) >= 0.65;
    }
    // Verify frame freshness (timestamp within 60 seconds)
    if (facePayload.timestamp) {
      const ageMs = Math.abs(Date.now() - new Date(facePayload.timestamp).getTime());
      if (ageMs > 60000) return false;
    }
    // Verify valid frame data exists
    if (facePayload.image || facePayload.selfieUrl) {
      const img = facePayload.image || facePayload.selfieUrl;
      return typeof img === 'string' && img.length > 50;
    }
    return true;
  }

  async verify(employeeId, facePayload = {}, settings = {}) {
    const minScore = parseFloat(settings.minConfidenceScore || settings.similarityThreshold || 0.90);
    const maxDist = parseFloat(settings.maxDistance || settings.maxEuclideanDistance || 0.42);
    const requireLiveness = settings.livenessRequired !== false;

    // 1. Check Anti-Spoofing / Liveness
    if (requireLiveness) {
      const isLive = this.checkLiveness(facePayload);
      if (!isLive) {
        return {
          verified: false,
          confidenceScore: 0.2,
          provider: 'local-vision',
          livenessVerified: false,
          message: 'Face liveness check failed. Live webcam verification with active blink/movement required.',
        };
      }
    }

    // 2. Strict Biometric Vector Embedding Comparison
    if (facePayload.embedding && facePayload.enrolledEmbedding) {
      const comparison = compareDescriptors(facePayload.embedding, facePayload.enrolledEmbedding, {
        similarityThreshold: minScore,
        maxEuclideanDistance: maxDist,
      });

      return {
        verified: comparison.matched,
        confidenceScore: comparison.similarity,
        distance: comparison.distance,
        provider: 'local-vision',
        livenessVerified: true,
        message: comparison.matched
          ? `Face recognized successfully (${(comparison.similarity * 100).toFixed(1)}% match).`
          : `Face match failed: Live face does not match the registered face for this employee. Attendance rejected.`,
      };
    }

    // If enrolled embedding is present, vector matching is strictly mandatory
    if (facePayload.enrolledEmbedding) {
      return {
        verified: false,
        confidenceScore: 0,
        provider: 'local-vision',
        livenessVerified: false,
        message: 'Face descriptor embedding missing from live capture. Please look directly into the camera.',
      };
    }

    return {
      verified: false,
      confidenceScore: 0,
      provider: 'local-vision',
      livenessVerified: false,
      message: 'Face capture data missing. Provide live frame descriptor embeddings.',
    };
  }
}

class FaceAttendanceAdapter {
  constructor() {
    this.providers = {
      'local-vision': new LocalVisionProvider(),
    };
  }

  registerProvider(name, providerInstance) {
    this.providers[name] = providerInstance;
  }

  async verify(employeeId, facePayload = {}, settings = {}) {
    const providerName = settings.provider || 'local-vision';
    const provider = this.providers[providerName] || this.providers['local-vision'];

    return await provider.verify(employeeId, facePayload, settings);
  }
}

module.exports = new FaceAttendanceAdapter();
