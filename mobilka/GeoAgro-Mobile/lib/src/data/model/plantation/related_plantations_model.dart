import 'dart:convert';

RelatedPlantationsModel relatedPlantationsModelFromJson(String str) =>
    RelatedPlantationsModel.fromJson(json.decode(str));

String relatedPlantationsModelToJson(RelatedPlantationsModel data) =>
    json.encode(data.toJson());

class RelatedPlantationsModel {
  final int count;
  final List<RelatedPlantation> results;

  RelatedPlantationsModel({
    required this.count,
    required this.results,
  });

  factory RelatedPlantationsModel.fromJson(Map<String, dynamic> json) =>
      RelatedPlantationsModel(
        count: json["count"] ?? 0,
        results: json["results"] == null
            ? []
            : List<RelatedPlantation>.from(
                json["results"].map((x) => RelatedPlantation.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "count": count,
        "results": List<dynamic>.from(results.map((x) => x.toJson())),
      };
}

class RelatedPlantation {
  final int id;
  final String? name;
  final bool isChecked;
  final bool? isRejected;
  final List<PlantationCoordinate> coordinates;
  final double fertilityScore;
  final double totalArea;

  RelatedPlantation({
    required this.id,
    this.name,
    required this.isChecked,
    this.isRejected,
    required this.coordinates,
    required this.fertilityScore,
    required this.totalArea,
  });

  factory RelatedPlantation.fromJson(Map<String, dynamic> json) =>
      RelatedPlantation(
        id: json["id"] ?? 0,
        name: json["name"],
        isChecked: json["is_checked"] ?? false,
        isRejected: json["is_rejected"] as bool? ?? false,
        coordinates: json["coordinates"] == null
            ? []
            : List<PlantationCoordinate>.from(
                json["coordinates"].map((x) => PlantationCoordinate.fromJson(x))),
        fertilityScore: (json["fertility_score"] ?? 0.0).toDouble(),
        totalArea: (json["total_area"] ?? 0.0).toDouble(),
      );

  Map<String, dynamic> toJson() => {
        "id": id,
        "name": name,
        "is_checked": isChecked,
        "is_rejected": isRejected,
        "coordinates": List<dynamic>.from(coordinates.map((x) => x.toJson())),
        "fertility_score": fertilityScore,
        "total_area": totalArea,
      };

  // Получить цвет статуса для отображения на карте
  int getStatusColor() {
    if (isRejected == true) {
      return 0xFFFF3B30; // Красный - отклонено
    } else if (isChecked) {
      return 0xFF28a745; // Зеленый - проверено
    } else {
      return 0xFFffc107; // Желтый - ожидает проверки
    }
  }

  // Получить название статуса
  String getStatusName() {
    if (isRejected == true) {
      return 'Rad etilgan';
    } else if (isChecked) {
      return 'Tasdiqlangan';
    } else {
      return 'Ko\'rib chiqilmoqda';
    }
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

  factory PlantationCoordinate.fromJson(Map<String, dynamic> json) =>
      PlantationCoordinate(
        id: json["id"] ?? 0,
        latitude: (json["latitude"] ?? 0.0).toDouble(),
        longitude: (json["longitude"] ?? 0.0).toDouble(),
      );

  Map<String, dynamic> toJson() => {
        "id": id,
        "latitude": latitude,
        "longitude": longitude,
      };
}
