class BiometricAttendanceAdapter {
  verify() {
    return {
      verified: false,
      message: 'Browser-supplied biometric data cannot verify a fingerprint. Punch at the registered physical device and wait for its authenticated SDK sync event.',
    };
  }
}

module.exports = new BiometricAttendanceAdapter();
