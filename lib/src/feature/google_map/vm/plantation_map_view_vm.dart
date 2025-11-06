import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../core/style/app_colors.dart';
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

  LatLng initialPosition = const LatLng(41.311081, 69.240562);

  PlantationMapViewVm(this.plantationId);

  void onMapCreated(GoogleMapController controller) {
    mapController = controller;
    notifyListeners();
  }

  Future<void> loadRelatedPlantations() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _repo.getRelatedPlantationsMap(plantationId);
      
      if (response == null) {
        errorMessage = "Ma'lumotlar topilmadi";
        isLoading = false;
        notifyListeners();
        return;
      }

      final data = jsonDecode(response) as Map<String, dynamic>;
      final results = data['results'] as List<dynamic>?;

      if (results == null || results.isEmpty) {
        errorMessage = "Hech qanday plantatsiya topilmadi";
        isLoading = false;
        notifyListeners();
        return;
      }

      relatedPlantations = results
          .map((e) => RelatedPlantation.fromJson(e as Map<String, dynamic>))
          .toList();

      // Find current plantation
      currentPlantation = relatedPlantations.firstWhere(
        (p) => p.id == plantationId,
        orElse: () => relatedPlantations.first,
      );

      _drawPlantationsOnMap();
      _centerMapOnCurrentPlantation();

      isLoading = false;
      notifyListeners();
    } catch (e) {
      errorMessage = "Xatolik: $e";
      isLoading = false;
      notifyListeners();
    }
  }

  void _drawPlantationsOnMap() {
    polygons.clear();
    polylines.clear();
    markers.clear();

    for (final plantation in relatedPlantations) {
      if (plantation.coordinates.isEmpty) continue;

      final points = plantation.coordinates
          .map((c) => LatLng(c.latitude, c.longitude))
          .toList();

      // Close polygon if not already closed
      if (points.isNotEmpty && 
          (points.first.latitude != points.last.latitude ||
           points.first.longitude != points.last.longitude)) {
        points.add(points.first);
      }

      final color = _getPlantationColor(plantation);
      final isCurrent = plantation.id == plantationId;

      // Draw filled polygon
      polygons.add(
        Polygon(
          polygonId: PolygonId('polygon_${plantation.id}'),
          points: points,
          fillColor: isCurrent 
              ? color.withValues(alpha: 0.35)
              : color.withValues(alpha: 0.2),
          strokeColor: color,
          strokeWidth: isCurrent ? 3 : 2,
        ),
      );

      // Draw polyline (border)
      polylines.add(
        Polyline(
          polylineId: PolylineId('polyline_${plantation.id}'),
          points: points,
          color: color,
          width: isCurrent ? 3 : 2,
        ),
      );

      // Add markers for polygon vertices (only for current plantation)
      if (isCurrent) {
        for (int i = 0; i < points.length - 1; i++) {
          markers.add(
            Marker(
              markerId: MarkerId('marker_${plantation.id}_$i'),
              position: points[i],
              icon: BitmapDescriptor.defaultMarkerWithHue(
                BitmapDescriptor.hueBlue,
              ),
              infoWindow: InfoWindow(
                title: plantation.name ?? 'ID: ${plantation.id}',
                snippet: 'Площадь: ${plantation.totalArea?.toStringAsFixed(2) ?? 0} га',
              ),
            ),
          );
        }
      }
    }

    notifyListeners();
  }

  Color _getPlantationColor(RelatedPlantation plantation) {
    if (plantation.isChecked == true) {
      return AppColors.c28A745; // Green - approved
    } else if (plantation.isRejected == true) {
      return AppColors.cE60C0C; // Red - rejected
    } else {
      return Colors.yellow.shade700; // Yellow - pending
    }
  }

  void _centerMapOnCurrentPlantation() {
    if (currentPlantation == null || 
        currentPlantation!.coordinates.isEmpty ||
        mapController == null) {
      return;
    }

    final coords = currentPlantation!.coordinates;
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

    initialPosition = center;

    final bounds = LatLngBounds(
      southwest: LatLng(minLat, minLng),
      northeast: LatLng(maxLat, maxLng),
    );

    Future.delayed(const Duration(milliseconds: 300), () {
      mapController?.animateCamera(
        CameraUpdate.newLatLngBounds(bounds, 50),
      );
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

