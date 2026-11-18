// backend/services/operations/attendance/adapters/geo.adapter.js
/**
 * Haversine formula calculation for Geofenced Attendance verification.
 */
class GeoAttendanceAdapter {
  /**
   * Calculates the great-circle distance between two points on the Earth's surface (in meters).
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius of Earth in meters
    const toRad = (angle) => (angle * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const radLat1 = toRad(lat1);
    const radLat2 = toRad(lat2);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(radLat1) * Math.cos(radLat2) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  }

  /**
   * Verifies if employee coordinates fall within any active geofence location for their company.
   * @param {Object} coords - { latitude, longitude, accuracy }
   * @param {Object} settings - Method settings containing `locations` array
   * @returns {Object} verification outcome
   */
  verify(coords, settings = {}) {
    if (!coords || coords.latitude === undefined || coords.longitude === undefined) {
      return {
        verified: false,
        message: 'Invalid geolocation coordinates. Latitude and Longitude are required.',
      };
    }

    const userLat = parseFloat(coords.latitude);
    const userLon = parseFloat(coords.longitude);
    const accuracy = parseFloat(coords.accuracy || 0);

    if (isNaN(userLat) || isNaN(userLon)) {
      return {
        verified: false,
        message: 'Geolocation coordinates must be valid numbers.',
      };
    }

    const locations = Array.isArray(settings?.locations) ? settings.locations.filter(l => l.isActive !== false) : [];

    // Fallback if no specific locations configured: standard default office coordinates or permissive
    if (locations.length === 0) {
      return {
        verified: true,
        distanceMeters: 0,
        matchedLocation: 'Default Corporate Office',
        allowedRadius: 1000,
        message: 'No specific office geofence configured. Default office zone accepted.',
        latitude: userLat,
        longitude: userLon,
        accuracy,
      };
    }

    let closestDistance = Infinity;
    let closestLocation = null;

    for (const loc of locations) {
      const locLat = parseFloat(loc.latitude);
      const locLon = parseFloat(loc.longitude);
      const radiusMeters = parseFloat(loc.radiusMeters || loc.radius || 500);

      if (isNaN(locLat) || isNaN(locLon)) continue;

      const dist = this.calculateDistance(userLat, userLon, locLat, locLon);

      if (dist < closestDistance) {
        closestDistance = dist;
        closestLocation = loc;
      }

      // Check if inside boundary
      if (dist <= radiusMeters) {
        return {
          verified: true,
          distanceMeters: Math.round(dist),
          matchedLocation: loc.name || 'Authorized Office Location',
          allowedRadius: radiusMeters,
          message: `Location verified at ${loc.name || 'Office'} (${Math.round(dist)}m from center).`,
          latitude: userLat,
          longitude: userLon,
          accuracy,
        };
      }
    }

    const roundedDistance = Math.round(closestDistance);
    const allowedRadius = closestLocation ? parseFloat(closestLocation.radiusMeters || 500) : 500;
    const locationName = closestLocation?.name || 'Office';

    return {
      verified: false,
      distanceMeters: roundedDistance,
      matchedLocation: locationName,
      allowedRadius: allowedRadius,
      message: `Outside geofence zone: You are ${roundedDistance}m away from ${locationName}. Maximum allowed radius is ${allowedRadius}m.`,
      latitude: userLat,
      longitude: userLon,
      accuracy,
    };
  }
}

module.exports = new GeoAttendanceAdapter();
