// backend/services/operations/attendance/adapters/index.js
const geoAdapter = require('./geo.adapter');
const qrAdapter = require('./qr.adapter');
const faceAdapter = require('./face.adapter');
const biometricAdapter = require('./biometric.adapter');

module.exports = {
  geoAdapter,
  qrAdapter,
  faceAdapter,
  biometricAdapter,
};
