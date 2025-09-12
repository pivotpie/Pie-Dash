// utils/mapUtils.ts
export class MapUtils {
  static calculateCenter(points: { latitude: number; longitude: number }[]): [number, number] {
    if (points.length === 0) return [25.2048, 55.2708]; // Dubai default

    const latSum = points.reduce((sum, point) => sum + point.latitude, 0);
    const lngSum = points.reduce((sum, point) => sum + point.longitude, 0);

    return [latSum / points.length, lngSum / points.length];
  }

  static calculateBounds(points: { latitude: number; longitude: number }[]): [[number, number], [number, number]] {
    if (points.length === 0) return [[25.1, 55.1], [25.3, 55.4]];

    const lats = points.map(p => p.latitude);
    const lngs = points.map(p => p.longitude);

    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    ];
  }

  static haversineDistance(
    coord1: [number, number], 
    coord2: [number, number]
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(coord2[0] - coord1[0]);
    const dLng = this.toRad(coord2[1] - coord1[1]);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(coord1[0])) * Math.cos(this.toRad(coord2[0])) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(value: number): number {
    return value * Math.PI / 180;
  }
}