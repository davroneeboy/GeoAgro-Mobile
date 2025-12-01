import 'dart:convert';

List<FarmerData> farmerStatisticsModelFromJson(String str) {
  final List<dynamic> jsonList = json.decode(str);
  return jsonList.map((e) => FarmerData.fromJson(e as Map<String, dynamic>)).toList();
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
    this.lastAddedPlantations,
  });

  factory FarmerData.fromJson(Map<String, dynamic> json) => FarmerData(
    id: json["farmer_id"] ?? json["id"],
    inn: json["farmer_inn"] ?? json["inn"] ?? json["farmer_id"] ?? json["id"],
    name: json["farmer_name"] ?? json["name"],
    totalPlantations: json["total_plantations"],
    approvedPlantations: json["approved_plantations"],
    rejectedPlantations: json["rejected_plantations"],
    pendingPlantations: json["pending_plantations"],
    totalArea: json["total_area"]?.toDouble(),
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
    "last_added_plantations": lastAddedPlantations,
  };
}
