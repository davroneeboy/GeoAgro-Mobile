import 'dart:math';

/// Общая геометрия для проверок "точка рядом с полигоном" — используется и
/// при создании плантации (рисование полигона на карте), и при
/// редактировании (сверка GPS с уже сохранёнными координатами). Работает
/// с голыми lat/lng, а не с каким-то одним типом координат (LatLng из
/// google_maps_flutter, собственный Coordinate и т.д.), чтобы не тянуть
/// зависимость на пакет карт туда, где полигон не рисуется.
class GeoUtils {
  const GeoUtils._();

  static double _degreesToRadians(double degrees) => degrees * pi / 180;

  /// Расстояние между двумя точками по большому кругу, в метрах.
  static double haversineMeters(
      double lat1, double lng1, double lat2, double lng2) {
    const earthRadius = 6371000.0;
    final dLat = _degreesToRadians(lat2 - lat1);
    final dLng = _degreesToRadians(lng2 - lng1);
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_degreesToRadians(lat1)) *
            cos(_degreesToRadians(lat2)) *
            sin(dLng / 2) *
            sin(dLng / 2);
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return earthRadius * c;
  }

  /// Точка внутри полигона (ray casting). `polygon` — список [lat, lng]
  /// пар в порядке обхода контура.
  static bool isPointInPolygon(
      double lat, double lng, List<(double, double)> polygon) {
    var inside = false;
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      final (latI, lngI) = polygon[i];
      final (latJ, lngJ) = polygon[j];
      if (((latI > lat) != (latJ > lat)) &&
          (lng < (lngJ - lngI) * (lat - latI) / (latJ - latI) + lngI)) {
        inside = !inside;
      }
    }
    return inside;
  }

  /// Минимальное расстояние (в метрах) от точки до любой вершины полигона.
  static double minDistanceToPolygon(
      double lat, double lng, List<(double, double)> polygon) {
    var minDistance = double.infinity;
    for (final (pLat, pLng) in polygon) {
      final d = haversineMeters(lat, lng, pLat, pLng);
      if (d < minDistance) minDistance = d;
    }
    return minDistance;
  }
}
