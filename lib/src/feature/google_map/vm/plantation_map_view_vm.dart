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
      final loaded = await _loadFromRelatedEndpoint();
      if (!loaded) {
        final fallbackLoaded = await _loadFromUserMap();
        if (!fallbackLoaded) {
          errorMessage = "Ma'lumotlar topilmadi";
        }
      }

      isLoading = false;
      notifyListeners();
    } catch (e) {
      errorMessage = "Xatolik: $e";
      isLoading = false;
      notifyListeners();
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

    _drawPlantationsOnMap();
    _centerMapOnCurrentPlantation();
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
    return true;
  }

  void _drawPlantationsOnMap() {
    polygons.clear();
    polylines.clear();
    markers.clear();
    circles.clear();

    for (final plantation in relatedPlantations) {
      if (plantation.coordinates.isEmpty) continue;

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
            strokeColor: color,
            strokeWidth: isCurrent ? 3 : 2,
          ),
        );

        polylines.add(
          Polyline(
            polylineId: PolylineId('polyline_${plantation.id}'),
            points: polygonPoints,
            color: color,
            width: isCurrent ? 3 : 2,
          ),
        );
      } else if (points.length == 2) {
        polylines.add(
          Polyline(
            polylineId: PolylineId('polyline_${plantation.id}'),
            points: points,
            color: color,
            width: isCurrent ? 3 : 2,
          ),
        );
      } else if (isCurrent) {
        circles.add(
          Circle(
            circleId: CircleId('circle_${plantation.id}'),
            center: points.first,
            fillColor: color.withValues(alpha: 0.25),
            strokeColor: color,
            strokeWidth: 2,
            radius: 25,
          ),
        );
      }

      if (isCurrent) {
        for (int i = 0; i < points.length; i++) {
          markers.add(
            Marker(
              markerId: MarkerId('marker_${plantation.id}_$i'),
              position: points[i],
              icon: BitmapDescriptor.defaultMarkerWithHue(
                BitmapDescriptor.hueAzure,
              ),
              infoWindow: InfoWindow(
                title: plantation.name ?? 'ID: ${plantation.id}',
                snippet:
                    "Maydon: ${plantation.totalArea?.toStringAsFixed(2) ?? '0'} ga",
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
      if ((maxLat - minLat).abs() < 0.0001 &&
          (maxLng - minLng).abs() < 0.0001) {
        mapController?.animateCamera(
          CameraUpdate.newLatLngZoom(center, 17),
        );
      } else {
        mapController?.animateCamera(
          CameraUpdate.newLatLngBounds(bounds, 50),
        );
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
