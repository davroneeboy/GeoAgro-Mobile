import 'dart:convert';

List<FarmerData> farmerStatisticsModelFromJson(String str) {
  final List<dynamic> jsonList = json.decode(str);
  return jsonList
      .map((e) => FarmerData.fromJson(e as Map<String, dynamic>))
      .toList();
}

String farmerStatisticsModelToJson(List<FarmerData> data) =>
    json.encode(data.map((e) => e.toJson()).toList());

class FarmerData {
  final int? id;
  final int? inn;
  final String? name;
  final int? totalPlantations;
  final int? approvedPlantations;
  final int? rejectedPlantations;
  final int? pendingPlantations;
  final double? totalArea;
  final double? uzumzorArea;
  final double? bogArea;
  final String? lastAddedPlantations;

  FarmerData({
    this.id,
    this.inn,
    this.name,
    this.totalPlantations,
    this.approvedPlantations,
    this.rejectedPlantations,
    this.pendingPlantations,
    this.totalArea,
    this.uzumzorArea,
    this.bogArea,
    this.lastAddedPlantations,
  });

  static int? _parseInt(dynamic v) {
    if (v is int) return v;
    if (v is String) return int.tryParse(v);
    return null;
  }

  factory FarmerData.fromJson(Map<String, dynamic> json) => FarmerData(
        id: _parseInt(json["farmer_id"]) ?? _parseInt(json["id"]),
        inn: _parseInt(json["farmer_inn"]) ??
            _parseInt(json["inn"]) ??
            _parseInt(json["farmer_id"]) ??
            _parseInt(json["id"]),
        name: json["farmer_name"] ?? json["name"],
        totalPlantations: json["total_plantations"],
        approvedPlantations: json["approved_plantations"],
        rejectedPlantations: json["rejected_plantations"],
        pendingPlantations: json["pending_plantations"],
        totalArea: json["total_area"]?.toDouble(),
        uzumzorArea: json["uzumzor_area"]?.toDouble(),
        bogArea: json["bog_area"]?.toDouble(),
        lastAddedPlantations: json["last_added_plantations"],
      );

  Map<String, dynamic> toJson() => {
        "farmer_id": id,
        "farmer_inn": inn,
        "farmer_name": name,
        "total_plantations": totalPlantations,
        "approved_plantations": approvedPlantations,
        "rejected_plantations": rejectedPlantations,
        "pending_plantations": pendingPlantations,
        "total_area": totalArea,
        "uzumzor_area": uzumzorArea,
        "bog_area": bogArea,
        "last_added_plantations": lastAddedPlantations,
      };
}
