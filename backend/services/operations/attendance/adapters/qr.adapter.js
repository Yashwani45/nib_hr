// backend/services/operations/attendance/adapters/qr.adapter.js
const crypto = require('crypto');

class QrAttendanceAdapter {
  constructor() {
    // In-memory cache for consumed single-use nonces with automatic TTL purge
    this.consumedNonces = new Map();
    setInterval(() => this.cleanupNonces(), 60000); // Purge every 60s
  }

  getSecretKey(settings = {}) {
    return settings?.secretKey || process.env.QR_ATTENDANCE_SECRET || process.env.ACCESS_TOKEN_SECRET || 'qr_attendance_master_secret_key_2026';
  }

  cleanupNonces() {
    const now = Date.now();
    for (const [nonce, expiresAt] of this.consumedNonces.entries()) {
      if (now > expiresAt) {
        this.consumedNonces.delete(nonce);
      }
    }
  }

  /**
   * Generates a tamper-proof, opaque HMAC-SHA256 dynamic QR token for an individual employee badge.
   * @param {Object} params - { companyCode, employeeId, type, rotationSeconds }
   * @param {Object} settings - Method settings
   * @returns {Object} { token, expiresAt, rotationSeconds }
   */
  generateToken({ companyCode, employeeId, type = 'EMPLOYEE_BADGE', rotationSeconds = 60 }, settings = {}) {
    const ttl = parseInt(rotationSeconds || settings?.rotationSeconds || 60, 10);
    const secretKey = this.getSecretKey(settings);
    const now = Date.now();
    const expiresAt = now + ttl * 1000;
    const nonce = crypto.randomBytes(16).toString('hex');

    const payload = {
      org: String(companyCode).toLowerCase(),
      companyCode: String(companyCode).toLowerCase(),
      emp: employeeId ? String(employeeId) : null,
      type,
      ts: now,
      exp: expiresAt,
      nonce,
      v: 1,
    };

    const payloadStr = JSON.stringify(payload);
    const encodedPayload = Buffer.from(payloadStr, 'utf8').toString('base64url');
    const signature = crypto.createHmac('sha256', secretKey).update(encodedPayload).digest('base64url');

    return {
      token: `${encodedPayload}.${signature}`,
      expiresAt: new Date(expiresAt).toISOString(),
      rotationSeconds: ttl,
    };
  }

  /**
   * Generates a dynamic, signed Company QR code displayed on the office screen/kiosk.
   * Multiple employees can scan this rotating QR code during its rotation window.
   */
  async generateCompanyToken({ companyCode, companyName, rotationSeconds = 60 }, settings = {}) {
    const ttl = parseInt(rotationSeconds || settings?.rotationSeconds || 60, 10);
    const secretKey = this.getSecretKey(settings);
    const now = Date.now();
    const expiresAt = now + ttl * 1000;
    const nonce = crypto.randomBytes(16).toString('hex');

    const payload = {
      type: 'COMPANY_QR',
      purpose: 'ATTENDANCE_PUNCH',
      org: String(companyCode).toLowerCase(),
      companyCode: String(companyCode).toLowerCase(),
      companyName: companyName || companyCode,
      ts: now,
      exp: expiresAt,
      nonce,
      v: 1,
    };

    const payloadStr = JSON.stringify(payload);
    const encodedPayload = Buffer.from(payloadStr, 'utf8').toString('base64url');
    const signature = crypto.createHmac('sha256', secretKey).update(encodedPayload).digest('base64url');
    const token = `${encodedPayload}.${signature}`;

    let qrDataUrl = '';
    try {
      const QRCode = require('qrcode');
      qrDataUrl = await QRCode.toDataURL(token, {
        errorCorrectionLevel: 'H',
        width: 450,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
    } catch (qrErr) {
      console.warn('[QR Gen Error]', qrErr.message);
    }

    return {
      companyCode: String(companyCode).toLowerCase(),
      companyName: companyName || companyCode,
      token,
      qrDataUrl,
      rotationSeconds: ttl,
      expiresAt: new Date(expiresAt).toISOString(),
      expiresAtTimestamp: expiresAt,
      status: 'ACTIVE',
    };
  }

  /**
   * Verifies a dynamic QR token presented during punch (both Employee Badge and Company QR).
   * @param {string} tokenString - The `${encodedPayload}.${signature}` token
   * @param {string} callerCompany - Company identifier from the request / employee
   * @param {string} callerEmployeeId - Employee ID from the request
   * @param {Object} settings - Method settings
   * @returns {Object} verification result
   */
  verify(tokenString, callerCompany, callerEmployeeId, settings = {}) {
    if (!tokenString || typeof tokenString !== 'string') {
      return {
        verified: false,
        message: 'Invalid QR code. QR token payload is required.',
      };
    }

    const parts = tokenString.trim().split('.');
    if (parts.length !== 2) {
      return {
        verified: false,
        message: 'Malformed QR code token structure.',
      };
    }

    const [encodedPayload, signature] = parts;
    const secretKey = this.getSecretKey(settings);

    // 1. Verify HMAC Signature
    const expectedSignature = crypto.createHmac('sha256', secretKey).update(encodedPayload).digest('base64url');
    if (
      signature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      return {
        verified: false,
        message: 'Tampered QR code. Cryptographic signature mismatch.',
      };
    }

    // 2. Decode and parse payload
    let payload;
    try {
      const decodedJson = Buffer.from(encodedPayload, 'base64url').toString('utf8');
      payload = JSON.parse(decodedJson);
    } catch (e) {
      return {
        verified: false,
        message: 'Invalid QR code payload format.',
      };
    }

    const now = Date.now();

    // 3. Expiration Check (allowing 10s clock skew window)
    if (payload.exp && now > payload.exp + 10000) {
      return {
        verified: false,
        message: 'QR code expired. Please scan the current live QR code from the screen.',
      };
    }

    // 4. Revocation Check (if Admin revoked past QR tokens)
    if (settings?.lastRevokedAt) {
      const revokedMs = new Date(settings.lastRevokedAt).getTime();
      if (payload.ts && payload.ts <= revokedMs) {
        return {
          verified: false,
          message: 'This Company QR code was revoked by the Administrator. Please scan the newly generated QR code from the screen.',
        };
      }
    }

    // 5. Replay Attack Prevention
    // For Company QR: Replay is checked per employee (so multiple employees can scan the same rotating code,
    // but the same employee cannot scan the same token twice).
    const replayKey = (payload.type === 'COMPANY_QR' && callerEmployeeId)
      ? `${payload.nonce}:${callerEmployeeId}`
      : payload.nonce;

    if (this.consumedNonces.has(replayKey)) {
      return {
        verified: false,
        message: 'Replay detected. You have already used this dynamic QR code token. Please scan the fresh QR code on the display.',
      };
    }

    // 6. Tenant & Company Isolation Check
    const tokenOrg = String(payload.org || payload.companyCode || '').toLowerCase().trim();
    const currentOrg = String(callerCompany || '').toLowerCase().trim();

    if (tokenOrg && currentOrg) {
      const matchExact = tokenOrg === currentOrg;
      const matchSub = currentOrg.includes(tokenOrg) || tokenOrg.includes(currentOrg);
      if (!matchExact && !matchSub) {
        return {
          verified: false,
          message: `Cross-company QR rejected. This QR belongs to ${tokenOrg.toUpperCase()}, but your account is registered under ${currentOrg.toUpperCase()}.`,
        };
      }
    }

    // 7. Employee Badge Check (only for employee-specific badges)
    if (payload.type === 'EMPLOYEE_BADGE' && payload.emp && callerEmployeeId) {
      if (String(payload.emp) !== String(callerEmployeeId)) {
        return {
          verified: false,
          message: 'QR code does not match the active authenticated employee profile.',
        };
      }
    }

    // Mark nonce as consumed until its expiration (+15s skew margin) ONLY after all validation checks pass!
    this.consumedNonces.set(replayKey, (payload.exp || now + 60000) + 15000);

    return {
      verified: true,
      message: 'Company QR Attendance token verified successfully.',
      payload,
    };
  }
}

module.exports = new QrAttendanceAdapter();
