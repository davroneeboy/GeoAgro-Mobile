import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../core/style/app_colors.dart';
import '../../../data/model/plantation/forme_map_model.dart';
import '../../../data/repository/app_repository_impl.dart';

class PlantationMapViewVm extends ChangeNotifier {
  final AppRepositoryImpl _repo = AppRepositoryImpl();
  final int plantationId;

  GoogleMapController? mapController;
  bool isLoading = false;
  String? errorMessage;

  RelatedPlantation? currentPlantation;
  List<RelatedPlantation> relatedPlantations = [];

  final Set<Polygon> polygons = {};
  final Set<Polyline> polylines = {};
  final Set<Marker> markers = {};
  final Set<Circle> circles = {};

  LatLng initialPosition = const LatLng(41.311081, 69.240562);
  
  bool _isDisposed = false;

  PlantationMapViewVm(this.plantationId);
  
  void _safeNotifyListeners() {
    if (!_isDisposed) {
      notifyListeners();
    }
  }

  void onMapCreated(GoogleMapController controller) {
    mapController = controller;
    _safeNotifyListeners();
  }

  /// Инициализирует карту с координатами из детальной информации о плантации
  /// для немедленного отображения полигона
  void initializeFromDetailData(Map<String, dynamic> jsonData) {
    try {
      debugPrint("[PlantationMapViewVm] initializeFromDetailData called");
      debugPrint("[PlantationMapViewVm] jsonData keys: ${jsonData.keys}");
      
      if (jsonData['coordinates'] != null && jsonData['coordinates'] is List) {
        final coordinates = jsonData['coordinates'] as List<dynamic>;
        debugPrint("[PlantationMapViewVm] Found ${coordinates.length} coordinates");
        
        if (coordinates.isEmpty) {
          debugPrint("[PlantationMapViewVm] Coordinates list is empty");
          return;
        }

        // Создаем RelatedPlantation из данных детальной информации
        final coords = <PlantationCoordinate>[];
        for (final coord in coordinates) {
          try {
            if (coord is Map<String, dynamic>) {
              final coordObj = PlantationCoordinate.fromJson(coord);
              coords.add(coordObj);
              debugPrint("[PlantationMapViewVm] Parsed coordinate: lat=${coordObj.latitude}, lng=${coordObj.longitude}");
            }
          } catch (e) {
            debugPrint("[PlantationMapViewVm] Error parsing coordinate: $e");
          }
        }

        if (coords.isEmpty) {
          debugPrint("[PlantationMapViewVm] No valid coordinates parsed");
          return;
        }

        final plantation = RelatedPlantation(
          id: jsonData['id'] as int? ?? plantationId,
          name: jsonData['name'] as String?,
          isChecked: jsonData['is_checked'] as bool? ?? false,
          isRejected: jsonData['is_rejected'] as bool? ?? false,
          coordinates: coords,
          fertilityScore: (jsonData['fertility_score'] as num?)?.toDouble() ?? 0.0,
          totalArea: (jsonData['total_area'] as num?)?.toDouble() ?? 0.0,
        );

        currentPlantation = plantation;
        relatedPlantations = [plantation];

        debugPrint("[PlantationMapViewVm] Initialized from detail data with ${coords.length} coordinates");
        debugPrint("[PlantationMapViewVm] Plantation ID: ${plantation.id}, Name: ${plantation.name}");

        _drawPlantationsOnMap();
        _centerMapOnCurrentPlantation();
        _safeNotifyListeners();
        
        // Дополнительное обновление после небольшой задержки
        Future.delayed(const Duration(milliseconds: 300), () {
          _safeNotifyListeners();
          debugPrint("[PlantationMapViewVm] Force update after initialization");
        });
      } else {
        debugPrint("[PlantationMapViewVm] No coordinates found in jsonData");
      }
    } catch (e, stackTrace) {
      debugPrint("[PlantationMapViewVm] Error initializing from detail data: $e");
      debugPrint("[PlantationMapViewVm] Stack trace: $stackTrace");
    }
  }

  Future<void> loadRelatedPlantations() async {
    if (_isDisposed) return;
    
    isLoading = true;
    errorMessage = null;
    _safeNotifyListeners();

    try {
      final loaded = await _loadFromRelatedEndpoint();
      if (_isDisposed) return;
      
      if (!loaded) {
        final fallbackLoaded = await _loadFromUserMap();
        if (_isDisposed) return;
        
        if (!fallbackLoaded) {
          errorMessage = "Ma'lumotlar topilmadi";
        }
      }

      isLoading = false;
      // Убеждаемся, что карта обновится после загрузки
      _safeNotifyListeners();
      
      // Дополнительное обновление после небольшой задержки для гарантии отображения
      Future.delayed(const Duration(milliseconds: 100), () {
        _safeNotifyListeners();
      });
    } catch (e) {
      if (_isDisposed) return;
      
      errorMessage = "Xatolik: $e";
      isLoading = false;
      _safeNotifyListeners();
    }
  }

  Future<bool> _loadFromRelatedEndpoint() async {
    debugPrint("[PlantationMapViewVm] Loading related map for $plantationId");
    final response = await _repo.getRelatedPlantationsMap(plantationId);
    if (response == null) return false;
    debugPrint(
        "[PlantationMapViewVm] related-map raw: ${response.substring(0, response.length > 200 ? 200 : response.length)}...");

    final data = jsonDecode(response) as Map<String, dynamic>;
    final results = data['results'] as List<dynamic>? ?? [];
    debugPrint(
        "[PlantationMapViewVm] related-map results length: ${results.length}");
    if (results.isEmpty) return false;

    relatedPlantations = results
        .map((e) => RelatedPlantation.fromJson(e as Map<String, dynamic>))
        .toList();

    currentPlantation = relatedPlantations.firstWhere(
      (p) => p.id == plantationId,
      orElse: () => relatedPlantations.first,
    );

    debugPrint(
        "[PlantationMapViewVm] Related map loaded. Total: ${relatedPlantations.length}. Current: ${currentPlantation?.id}");
    debugPrint(
        "[PlantationMapViewVm] Current plantation coordinates: ${currentPlantation?.coordinates.length ?? 0}");

    _drawPlantationsOnMap();
    _centerMapOnCurrentPlantation();
    
    // Дополнительное обновление для гарантии отображения полигона
    Future.delayed(const Duration(milliseconds: 200), () {
      _safeNotifyListeners();
    });
    
    return true;
  }

  Future<bool> _loadFromUserMap() async {
    debugPrint(
        "[PlantationMapViewVm] Fallback to user plantations map for $plantationId");
    final response = await _repo.getUserPlantationsForMap();
    if (response == null) return false;

    final plantations = formeMapModelFromJson(response);
    if (plantations.isEmpty) return false;

    FormeMapPlantation? current;
    for (final plantation in plantations) {
      if (plantation.id == plantationId) {
        current = plantation;
        break;
      }
    }

    if (current == null) return false;

    relatedPlantations =
        plantations.map((p) => RelatedPlantation.fromFormeMap(p)).toList();
    currentPlantation = RelatedPlantation.fromFormeMap(current);

    debugPrint(
        "[PlantationMapViewVm] Fallback map loaded. Current plantation id: ${currentPlantation?.id}");

    _drawPlantationsOnMap();
    _centerMapOnCurrentPlantation();
    
    // Дополнительное обновление для гарантии отображения полигона
    Future.delayed(const Duration(milliseconds: 200), () {
      _safeNotifyListeners();
    });
    
    return true;
  }

  void _drawPlantationsOnMap() {
    polygons.clear();
    polylines.clear();
    markers.clear();
    circles.clear();

    debugPrint("[PlantationMapViewVm] Drawing ${relatedPlantations.length} plantations on map");

    for (final plantation in relatedPlantations) {
      if (plantation.coordinates.isEmpty) {
        debugPrint("[PlantationMapViewVm] Plantation ${plantation.id} has no coordinates");
        continue;
      }

      debugPrint("[PlantationMapViewVm] Plantation ${plantation.id} has ${plantation.coordinates.length} coordinates");

      final seen = <String>{};
      final points = <LatLng>[];
      for (final coord in plantation.coordinates) {
        final point = LatLng(coord.latitude, coord.longitude);
        final key =
            '${coord.latitude.toStringAsFixed(6)}_${coord.longitude.toStringAsFixed(6)}';
        if (seen.add(key)) {
          points.add(point);
        }
      }
      if (points.isEmpty) continue;

      final color = _getPlantationColor(plantation);
      final isCurrent = plantation.id == plantationId;

      if (points.length >= 3) {
        final polygonPoints = [...points];
        if (polygonPoints.first != polygonPoints.last) {
          polygonPoints.add(polygonPoints.first);
        }

        polygons.add(
          Polygon(
            polygonId: PolygonId('polygon_${plantation.id}'),
            points: polygonPoints,
            fillColor: isCurrent
                ? color.withValues(alpha: 0.35)
                : color.withValues(alpha: 0.2),
            // Для текущей плантации обводка желтая, для остальных - цвет по статусу
            strokeColor: isCurrent ? Colors.yellow : color,
            strokeWidth: isCurrent ? 4 : 2,
          ),
        );

        polylines.add(
          Polyline(
            polylineId: PolylineId('polyline_${plantation.id}'),
            points: polygonPoints,
            // Для текущей плантации линия желтая, для остальных - цвет по статусу
            color: isCurrent ? Colors.yellow : color,
            width: isCurrent ? 4 : 2,
          ),
        );
      } else if (points.length == 2) {
        polylines.add(
          Polyline(
            polylineId: PolylineId('polyline_${plantation.id}'),
            points: points,
            // Для текущей плантации линия желтая, для остальных - цвет по статусу
            color: isCurrent ? Colors.yellow : color,
            width: isCurrent ? 4 : 2,
          ),
        );
      } else if (isCurrent) {
        circles.add(
          Circle(
            circleId: CircleId('circle_${plantation.id}'),
            center: points.first,
            fillColor: color.withValues(alpha: 0.25),
            // Для текущей плантации обводка желтая
            strokeColor: Colors.yellow,
            strokeWidth: 4,
            radius: 25,
          ),
        );
      }

      // Маркеры убраны по запросу пользователя
    }

    debugPrint("[PlantationMapViewVm] Total polygons: ${polygons.length}, polylines: ${polylines.length}, markers: ${markers.length}, circles: ${circles.length}");
    
    // Принудительно обновляем карту после отрисовки полигонов
    _safeNotifyListeners();
    
    // Дополнительное обновление после небольшой задержки для гарантии отображения
    Future.delayed(const Duration(milliseconds: 300), () {
      if (!_isDisposed && (polygons.isNotEmpty || polylines.isNotEmpty || markers.isNotEmpty)) {
        _safeNotifyListeners();
        debugPrint("[PlantationMapViewVm] Force update after drawing polygons");
      }
    });
  }

  Color _getPlantationColor(RelatedPlantation plantation) {
    if (plantation.isChecked == true) {
      return AppColors.c28A745; // Green - approved
    } else if (plantation.isRejected == true) {
      return AppColors.cE60C0C; // Red - rejected
    } else {
      // Если оба false - значит на модерации (Ko'rib chiqilmoqda)
      return const Color(0xFFF59E0B); // Warning color - pending (желтый)
    }
  }

  void _centerMapOnCurrentPlantation() {
    if (currentPlantation == null ||
        currentPlantation!.coordinates.isEmpty) {
      debugPrint("[PlantationMapViewVm] Cannot center map: currentPlantation is null or has no coordinates");
      return;
    }

    final coords = currentPlantation!.coordinates;
    debugPrint("[PlantationMapViewVm] Centering map on ${coords.length} coordinates");
    
    double minLat = coords.first.latitude;
    double maxLat = coords.first.latitude;
    double minLng = coords.first.longitude;
    double maxLng = coords.first.longitude;

    for (final coord in coords) {
      if (coord.latitude < minLat) minLat = coord.latitude;
      if (coord.latitude > maxLat) maxLat = coord.latitude;
      if (coord.longitude < minLng) minLng = coord.longitude;
      if (coord.longitude > maxLng) maxLng = coord.longitude;
    }

    final center = LatLng(
      (minLat + maxLat) / 2,
      (minLng + maxLng) / 2,
    );

    debugPrint("[PlantationMapViewVm] Map center: lat=${center.latitude}, lng=${center.longitude}");
    debugPrint("[PlantationMapViewVm] Bounds: minLat=$minLat, maxLat=$maxLat, minLng=$minLng, maxLng=$maxLng");

    // Обновляем initialPosition сразу для немедленного отображения
    initialPosition = center;
    _safeNotifyListeners();

    final bounds = LatLngBounds(
      southwest: LatLng(minLat, minLng),
      northeast: LatLng(maxLat, maxLng),
    );

    // Центрируем карту после небольшой задержки, чтобы карта успела инициализироваться
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mapController == null) {
        debugPrint("[PlantationMapViewVm] Map controller is null, cannot center");
        return;
      }
      
      debugPrint("[PlantationMapViewVm] Animating camera to center");
      
      if ((maxLat - minLat).abs() < 0.0001 &&
          (maxLng - minLng).abs() < 0.0001) {
        // Одна точка - используем зум
        mapController?.animateCamera(
          CameraUpdate.newLatLngZoom(center, 17),
        );
        debugPrint("[PlantationMapViewVm] Centered on single point with zoom 17");
      } else {
        // Несколько точек - используем bounds
        mapController?.animateCamera(
          CameraUpdate.newLatLngBounds(bounds, 80),
        );
        debugPrint("[PlantationMapViewVm] Centered on bounds with padding 80");
      }
    });
  }

  double calculatePerimeter(List<PlantationCoordinate> coordinates) {
    if (coordinates.length < 2) return 0.0;

    double perimeter = 0.0;
    for (int i = 0; i < coordinates.length - 1; i++) {
      perimeter += _calculateDistance(
        LatLng(coordinates[i].latitude, coordinates[i].longitude),
        LatLng(coordinates[i + 1].latitude, coordinates[i + 1].longitude),
      );
    }

    // Close the loop
    if (coordinates.isNotEmpty) {
      perimeter += _calculateDistance(
        LatLng(coordinates.last.latitude, coordinates.last.longitude),
        LatLng(coordinates.first.latitude, coordinates.first.longitude),
      );
    }

    return perimeter;
  }

  double calculateArea(List<PlantationCoordinate> coordinates) {
    if (coordinates.length < 3) return 0.0;

    // Конвертируем PlantationCoordinate в LatLng
    final points = coordinates.map((c) => LatLng(c.latitude, c.longitude)).toList();

    // Используем формулу площади Гаусса для сферических координат
    double area = 0.0;
    int n = points.length;

    // Если полигон замкнут (последняя точка = первой), убираем дублирующую точку
    List<LatLng> cleanPoints = List<LatLng>.from(points);
    if (cleanPoints.length > 3 &&
        cleanPoints.first.latitude == cleanPoints.last.latitude &&
        cleanPoints.first.longitude == cleanPoints.last.longitude) {
      cleanPoints.removeLast();
      n = cleanPoints.length;
    }

    for (int i = 0; i < n; i++) {
      int j = (i + 1) % n;
      area += cleanPoints[i].longitude * cleanPoints[j].latitude;
      area -= cleanPoints[j].longitude * cleanPoints[i].latitude;
    }
    area = area.abs() / 2.0;

    // Переводим квадратные градусы в квадратные метры
    double avgLat =
        cleanPoints.map((p) => p.latitude).reduce((a, b) => a + b) / n;
    const double meterPerDegreeLat = 111320.0; // метры на градус широты
    double meterPerDegreeLng =
        111320.0 * cos(avgLat * pi / 180); // метры на градус долготы

    area = area * meterPerDegreeLat * meterPerDegreeLng;

    // Конвертируем из квадратных метров в гектары (1 га = 10,000 м²)
    return area / 10000.0;
  }

  double _calculateDistance(LatLng start, LatLng end) {
    const double earthRadius = 6371000; // meters
    double dLat = _degreesToRadians(end.latitude - start.latitude);
    double dLng = _degreesToRadians(end.longitude - start.longitude);
    double a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_degreesToRadians(start.latitude)) *
            cos(_degreesToRadians(end.latitude)) *
            sin(dLng / 2) *
            sin(dLng / 2);
    double c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return earthRadius * c;
  }

  double _degreesToRadians(double degrees) {
    return degrees * pi / 180;
  }

  @override
  void dispose() {
    _isDisposed = true;
    mapController?.dispose();
    super.dispose();
  }
}

class RelatedPlantation {
  final int id;
  final String? name;
  final bool? isChecked;
  final bool? isRejected;
  final List<PlantationCoordinate> coordinates;
  final double? fertilityScore;
  final double? totalArea;

  RelatedPlantation({
    required this.id,
    this.name,
    this.isChecked,
    this.isRejected,
    required this.coordinates,
    this.fertilityScore,
    this.totalArea,
  });

  factory RelatedPlantation.fromJson(Map<String, dynamic> json) {
    final coordsList = json['coordinates'] as List<dynamic>? ?? [];
    return RelatedPlantation(
      id: json['id'] as int,
      name: json['name'] as String?,
      isChecked: json['is_checked'] as bool?,
      isRejected: json['is_rejected'] as bool?,
      coordinates: coordsList
          .map((e) => PlantationCoordinate.fromJson(e as Map<String, dynamic>))
          .toList(),
      fertilityScore: (json['fertility_score'] as num?)?.toDouble(),
      totalArea: (json['total_area'] as num?)?.toDouble(),
    );
  }

  factory RelatedPlantation.fromFormeMap(FormeMapPlantation plantation) {
    return RelatedPlantation(
      id: plantation.id,
      name: plantation.farmerName,
      isChecked: plantation.isChecked,
      isRejected: false,
      coordinates: plantation.coordinates
          .asMap()
          .entries
          .map(
            (entry) => PlantationCoordinate(
              id: entry.key,
              latitude: entry.value.latitude,
              longitude: entry.value.longitude,
            ),
          )
          .toList(),
      fertilityScore: null,
      totalArea: plantation.totalArea,
    );
  }
}

class PlantationCoordinate {
  final int id;
  final double latitude;
  final double longitude;

  PlantationCoordinate({
    required this.id,
    required this.latitude,
    required this.longitude,
  });

  factory PlantationCoordinate.fromJson(Map<String, dynamic> json) {
    return PlantationCoordinate(
      id: json['id'] as int,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
    );
  }
}
