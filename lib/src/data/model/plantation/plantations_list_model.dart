import 'dart:convert';
import '../comment/comment_model.dart';

PlantationsListModel plantationsListModelFromJson(String str) => PlantationsListModel.fromJson(json.decode(str));

String plantationsListModelToJson(PlantationsListModel data) => json.encode(data.toJson());

class PlantationsListModel {
  final int? count;
  final String? next;
  final String? previous;
  final List<Result>? results;

  PlantationsListModel({
    this.count,
    this.next,
    this.previous,
    this.results,
  });

  factory PlantationsListModel.fromJson(Map<String, dynamic> json) => PlantationsListModel(
        count: json["count"],
        next: json["next"],
        previous: json["previous"],
        results: json["results"] == null ? [] : List<Result>.from(json["results"]!.map((x) => Result.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "count": count,
        "next": next,
        "previous": previous,
        "results": results == null ? [] : List<dynamic>.from(results!.map((x) => x.toJson())),
      };
}

// class Result {
//   final int? id;
//   final int? gardenEstablishedYear;
//   final String? districtName;
//   final String? regionName;
//   final double? totalArea;
//   final bool? isDeleting;
//   final bool? isChecked;
//   final dynamic prevData;

//   Result({
//     this.id,
//     this.gardenEstablishedYear,
//     this.districtName,
//     this.regionName,
//     this.totalArea,
//     this.isDeleting,
//     this.isChecked,
//     this.prevData,
//   });

//   factory Result.fromJson(Map<String, dynamic> json) => Result(
//         id: json["id"],
//         gardenEstablishedYear: json["garden_established_year"],
//         districtName: json["district_name"],
//         regionName: json["region_name"],
//         totalArea: json["total_area"],
//         isDeleting: json["is_deleting"],
//         isChecked: json["is_checked"],
//         prevData: json["prev_data"],
//       );

//   Map<String, dynamic> toJson() => {
//         "id": id,
//         "garden_established_year": gardenEstablishedYear,
//         "district_name": districtName,
//         "region_name": regionName,
//         "total_area": totalArea,
//         "is_deleting": isDeleting,
//         "is_checked": isChecked,
//         "prev_data": prevData,
//       };
// }

class Result {
  int? id;
  District? district;
  int? farmer;
  String? farmerName; // Добавляем имя фермера
  int? gardenEstablishedYear;
  double? totalArea;
  int? landType;
  bool? isFertile;
  String? createdAt;
  bool? isChecked;
  List<CommentModel>? comments;
  int? createdById;
  String? createdByUsername;

  Result({
    this.id,
    this.district,
    this.farmer,
    this.farmerName,
    this.gardenEstablishedYear,
    this.totalArea,
    this.landType,
    this.isFertile,
    this.createdAt,
    this.isChecked,
    this.comments,
    this.createdById,
    this.createdByUsername,
  });

  factory Result.fromJson(Map<String, dynamic> json) {
    List<CommentModel>? comments;
    try {
      if (json["comments"] != null && json["comments"] is List) {
        final list = json["comments"] as List<dynamic>;
        if (list.isNotEmpty) {
          comments = list
              .map((x) {
                try {
                  return CommentModel.fromJson(x as Map<String, dynamic>);
                } catch (e) {
                  return null;
                }
              })
              .whereType<CommentModel>()
              .toList();
        }
      }
    } catch (e) {
      // If parsing fails, just leave it as null
      comments = null;
    }

    return Result(
      id: json["id"],
      district: json["district"] == null ? null : District.fromJson(json["district"]),
      farmer: json["farmer"],
      farmerName: json["farmer_name"],
      gardenEstablishedYear: json["garden_established_year"],
      totalArea: json["total_area"]?.toDouble(),
      landType: json["land_type"],
      isFertile: json["is_fertile"],
      createdAt: json["created_at"],
      isChecked: json["is_checked"],
      comments: comments,
      createdById: (json["created_by"] is Map<String, dynamic>) ? json["created_by"]["id"] as int? : null,
      createdByUsername: (json["created_by"] is Map<String, dynamic>) ? json["created_by"]["username"] as String? : null,
    );
  }

  Map<String, dynamic> toJson() => {
        "id": id,
        "district": district?.toJson(),
        "farmer": farmer,
        "farmer_name": farmerName, // Добавляем в JSON
        "garden_established_year": gardenEstablishedYear,
        "total_area": totalArea,
        "land_type": landType,
        "is_fertile": isFertile,
        "created_at": createdAt,
        "is_checked": isChecked,
        "comments": comments == null
            ? null
            : List<dynamic>.from(comments!.map((x) => x.toJson())),
        "created_by": {
          "id": createdById,
          "username": createdByUsername,
        },
      };
}

class District {
  String? name;
  int? region;

  District({
    this.name,
    this.region,
  });

  factory District.fromJson(Map<String, dynamic> json) => District(
        name: json["name"],
        region: json["region"],
      );

  Map<String, dynamic> toJson() => {
        "name": name,
        "region": region,
      };
}
