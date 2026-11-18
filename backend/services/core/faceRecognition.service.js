// backend/services/core/faceRecognition.service.js

/**
 * Calculates Euclidean distance between two 128D descriptor vectors.
 * Lower distance means higher similarity.
 * @param {Array<number>} vec1 
 * @param {Array<number>} vec2 
 * @returns {number} distance
 */
function euclideanDistance(vec1, vec2) {
  if (!Array.isArray(vec1) || !Array.isArray(vec2) || vec1.length !== vec2.length) {
    throw new Error('Descriptors must be numeric arrays of the same length');
  }
  let sum = 0;
  for (let i = 0; i < vec1.length; i++) {
    const diff = vec1[i] - vec2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Calculates Cosine Similarity between two 128D descriptor vectors.
 * Higher value (up to 1.0) means higher similarity.
 * @param {Array<number>} vec1 
 * @param {Array<number>} vec2 
 * @returns {number} cosine similarity score (0.0 to 1.0)
 */
function cosineSimilarity(vec1, vec2) {
  if (!Array.isArray(vec1) || !Array.isArray(vec2) || vec1.length !== vec2.length) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    normA += vec1[i] * vec1[i];
    normB += vec2[i] * vec2[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Computes element-wise average vector from multiple sample descriptors.
 * @param {Array<Array<number>>} descriptors 
 * @returns {Array<number>} averaged 128D descriptor
 */
function averageEmbedding(descriptors) {
  if (!Array.isArray(descriptors) || descriptors.length === 0) {
    return [];
  }
  const len = descriptors[0].length;
  const avg = new Array(len).fill(0);
  for (const desc of descriptors) {
    for (let i = 0; i < len; i++) {
      avg[i] += desc[i];
    }
  }
  for (let i = 0; i < len; i++) {
    avg[i] /= descriptors.length;
  }
  return avg;
}

/**
 * Compares live descriptor against enrolled descriptor data (which can be a single vector or array of sample vectors).
 * @param {Array<number>} liveDescriptor 
 * @param {Array<number> | Array<Array<number>> | object} enrolledData 
 * @param {object} options { similarityThreshold: 0.82, maxEuclideanDistance: 0.45 }
 * @returns {object} { matched: boolean, similarity: number, distance: number }
 */
function compareDescriptors(liveDescriptor, enrolledData, options = {}) {
  // Strict Face-API / FaceNet biometric thresholds:
  // Same person has Euclidean distance <= 0.42 and Cosine similarity >= 0.90
  // Different individuals have distance > 0.50 (often 0.60 - 0.85)
  const maxDistance = parseFloat(options.maxEuclideanDistance || options.maxDistance || 0.42);
  const similarityThreshold = parseFloat(options.similarityThreshold || options.minConfidenceScore || 0.90);

  let enrolledVectors = [];

  if (Array.isArray(enrolledData)) {
    // Could be a single vector [0.1, 0.2, ...] or array of vectors [[...], [...]]
    if (typeof enrolledData[0] === 'number') {
      enrolledVectors.push(enrolledData);
    } else if (Array.isArray(enrolledData[0])) {
      enrolledVectors = enrolledData;
    }
  } else if (typeof enrolledData === 'object' && enrolledData !== null) {
    if (Array.isArray(enrolledData.embedding)) {
      enrolledVectors.push(enrolledData.embedding);
    }
    if (Array.isArray(enrolledData.samples)) {
      enrolledVectors.push(...enrolledData.samples);
    }
  }

  if (enrolledVectors.length === 0) {
    return { matched: false, similarity: 0, distance: 1, message: 'Invalid enrolled embedding format.' };
  }

  let maxSimilarity = -1;
  let minDistance = Infinity;

  for (const vector of enrolledVectors) {
    if (vector.length === liveDescriptor.length) {
      const sim = cosineSimilarity(liveDescriptor, vector);
      const dist = euclideanDistance(liveDescriptor, vector);
      if (sim > maxSimilarity) maxSimilarity = sim;
      if (dist < minDistance) minDistance = dist;
    }
  }

  // Strict match: Distance must be within strict tolerance AND similarity must be high
  const isMatched = minDistance <= maxDistance && maxSimilarity >= similarityThreshold;

  return {
    matched: isMatched,
    similarity: parseFloat(maxSimilarity.toFixed(4)),
    distance: minDistance === Infinity ? 1 : parseFloat(minDistance.toFixed(4)),
    threshold: similarityThreshold,
    maxDistance
  };
}

/**
 * Compares a live face descriptor against all active enrolled employee profiles for an organization.
 * Returns the best matching employee profile.
 * @param {Array<number>} liveDescriptor 
 * @param {Array<object>} enrolledProfiles 
 * @param {object} options 
 * @returns {object|null} best match result or null if no match meets threshold
 */
function findBestMatchInOrg(liveDescriptor, enrolledProfiles = [], options = {}) {
  const threshold = parseFloat(options.similarityThreshold || options.minConfidenceScore || 0.90);
  const maxDistance = parseFloat(options.maxEuclideanDistance || options.maxDistance || 0.42);
  let bestMatch = null;
  let highestSimilarity = 0;

  for (const profile of enrolledProfiles) {
    let rawEmbedding = profile.face_embedding || profile.faceEmbedding;
    if (typeof rawEmbedding === 'string') {
      try {
        rawEmbedding = JSON.parse(rawEmbedding);
      } catch (e) {}
    }

    const comparison = compareDescriptors(liveDescriptor, rawEmbedding, {
      similarityThreshold: threshold,
      maxEuclideanDistance: maxDistance,
    });
    if (comparison.matched && comparison.similarity > highestSimilarity && comparison.distance <= maxDistance) {
      highestSimilarity = comparison.similarity;
      bestMatch = {
        profile,
        employeeId: profile.employee_id || profile.employeeId,
        similarity: comparison.similarity,
        distance: comparison.distance,
        employeeName: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.employeeName || profile.employee_name || 'Employee',
        employeeCode: profile.employeeCode || profile.employeeId || 'EMP001'
      };
    }
  }

  return bestMatch;
}

module.exports = {
  euclideanDistance,
  cosineSimilarity,
  averageEmbedding,
  compareDescriptors,
  findBestMatchInOrg
};
