
class FarmerPlantationResponse {
  final int count;
  final List<FarmerPlantation> results;

  FarmerPlantationResponse({
    required this.count,
    required this.results,
  });

  factory FarmerPlantationResponse.fromJson(Map<String, dynamic> json) {
    return FarmerPlantationResponse(
      count: json['count'] ?? 0,
      results: (json['results'] as List<dynamic>?)
          ?.map((item) => FarmerPlantation.fromJson(item))
          .toList() ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'count': count,
      'results': results.map((item) => item.toJson()).toList(),
    };
  }
}

class FarmerPlantation {
  final int id;
  final String name;
  final bool isChecked;
  final List<Coordinate> coordinates;
  final double fertilityScore;
  final double totalArea;

  FarmerPlantation({
    required this.id,
    required this.name,
    required this.isChecked,
    required this.coordinates,
    required this.fertilityScore,
    required this.totalArea,
  });

  factory FarmerPlantation.fromJson(Map<String, dynamic> json) {
    return FarmerPlantation(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      isChecked: json['is_checked'] ?? false,
      coordinates: (json['coordinates'] as List<dynamic>?)
          ?.map((item) => Coordinate.fromJson(item))
          .toList() ?? [],
      fertilityScore: (json['fertility_score'] ?? 0.0).toDouble(),
      totalArea: (json['total_area'] ?? 0.0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'is_checked': isChecked,
      'coordinates': coordinates.map((item) => item.toJson()).toList(),
      'fertility_score': fertilityScore,
      'total_area': totalArea,
    };
  }
}

class Coordinate {
  final int id;
  final double latitude;
  final double longitude;

  Coordinate({
    required this.id,
    required this.latitude,
    required this.longitude,
  });

  factory Coordinate.fromJson(Map<String, dynamic> json) {
    return Coordinate(
      id: json['id'] ?? 0,
      latitude: (json['latitude'] ?? 0.0).toDouble(),
      longitude: (json['longitude'] ?? 0.0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'latitude': latitude,
      'longitude': longitude,
    };
  }
}
