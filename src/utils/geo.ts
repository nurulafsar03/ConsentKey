/**
 * Geolocation & Haversine Distance Calculations
 */

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return Math.round(calculateDistanceKm(lat1, lon1, lat2, lon2) * 1000);
}

export function isInsideGeofence(
  memberLat: number,
  memberLng: number,
  fenceLat: number,
  fenceLng: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistanceMeters(memberLat, memberLng, fenceLat, fenceLng);
  return distance <= radiusMeters;
}

export function estimateTravelTimeMinutes(distanceKm: number, speedKmh = 30): number {
  if (distanceKm <= 0.05) return 1;
  const effectiveSpeed = Math.max(15, speedKmh);
  return Math.max(1, Math.round((distanceKm / effectiveSpeed) * 60));
}
