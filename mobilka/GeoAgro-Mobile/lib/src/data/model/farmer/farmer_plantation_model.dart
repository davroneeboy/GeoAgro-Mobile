
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
  final String? name;
  final bool isChecked;
  final bool? isRejected;
  final List<Coordinate> coordinates;
  final double fertilityScore;
  final double totalArea;
  final int? gardenEstablishedYear;
  final int? landType;
  final bool? isFertile;
  final String? createdAt;
  final String? districtName;
  final int? farmer;
  final String? farmerName;

  FarmerPlantation({
    required this.id,
    this.name,
    required this.isChecked,
    this.isRejected,
    required this.coordinates,
    required this.fertilityScore,
    required this.totalArea,
    this.gardenEstablishedYear,
    this.landType,
    this.isFertile,
    this.createdAt,
    this.districtName,
    this.farmer,
    this.farmerName,
  });

  factory FarmerPlantation.fromJson(Map<String, dynamic> json) {
    // Парсим district
    String? districtName;
    if (json['district'] != null) {
      if (json['district'] is Map<String, dynamic>) {
        districtName = json['district']['name'] as String?;
      }
    }

    return FarmerPlantation(
      id: json['id'] ?? 0,
      name: json['name'] ?? json['farmer_name'] ?? 'Plantatsiya',
      isChecked: json['is_checked'] ?? false,
      isRejected: json['is_rejected'] ?? false,
      coordinates: (json['coordinates'] as List<dynamic>?)
          ?.map((item) => Coordinate.fromJson(item))
          .toList() ?? [],
      fertilityScore: (json['fertility_score'] ?? 0.0).toDouble(),
      totalArea: (json['total_area'] ?? 0.0).toDouble(),
      gardenEstablishedYear: json['garden_established_year'] as int?,
      landType: json['land_type'] as int?,
      isFertile: json['is_fertile'] as bool?,
      createdAt: json['created_at'] as String?,
      districtName: districtName,
      farmer: json['farmer'] as int?,
      farmerName: json['farmer_name'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'is_checked': isChecked,
      'is_rejected': isRejected,
      'coordinates': coordinates.map((item) => item.toJson()).toList(),
      'fertility_score': fertilityScore,
      'total_area': totalArea,
      'garden_established_year': gardenEstablishedYear,
      'land_type': landType,
      'is_fertile': isFertile,
      'created_at': createdAt,
      'district': districtName != null ? {'name': districtName} : null,
      'farmer': farmer,
      'farmer_name': farmerName,
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
