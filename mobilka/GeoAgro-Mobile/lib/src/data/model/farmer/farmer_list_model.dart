// To parse this JSON data, do
//
//     final farmerListModel = farmerListModelFromJson(jsonString);

import 'dart:convert';

FarmerListModel farmerListModelFromJson(String str) => FarmerListModel.fromJson(json.decode(str));

String farmerListModelToJson(FarmerListModel data) => json.encode(data.toJson());

class FarmerListModel {
    int? count;
    String? next;
    String? previous;
    List<FarmerModel>? results;

    FarmerListModel({
        this.count,
        this.next,
        this.previous,
        this.results,
    });

    factory FarmerListModel.fromJson(Map<String, dynamic> json) => FarmerListModel(
        count: json["count"],
        next: json["next"],
        previous: json["previous"],
        results: json["results"] == null ? [] : List<FarmerModel>.from(json["results"]!.map((x) => FarmerModel.fromJson(x))),
    );

    Map<String, dynamic> toJson() => {
        "count": count,
        "next": next,
        "previous": previous,
        "results": results == null ? [] : List<FarmerModel>.from(results!.map((x) => x.toJson())),
    };
}

class FarmerModel {
    int? id;
    String? name;
    String? founderName;
    String? directorName;
    String? phoneNumber;
    String? address;
    String? email;
    int? inn;
    int? establishedYear;
    int? district;

    FarmerModel({
        this.id,
        this.name,
        this.founderName,
        this.directorName,
        this.phoneNumber,
        this.address,
        this.email,
        this.inn,
        this.establishedYear,
        this.district,
    });

    factory FarmerModel.fromJson(Map<String, dynamic> json) => FarmerModel(
        id: json["id"],
        name: json["name"],
        founderName: json["founder_name"],
        directorName: json["director_name"],
        phoneNumber: json["phone_number"],
        address: json["address"],
        email: json["email"],
        inn: json["inn"],
        establishedYear: json["established_year"],
        district: json["district"],
    );

    Map<String, dynamic> toJson() => {
        "id": id,
        "name": name,
        "founder_name": founderName,
        "director_name": directorName,
        "phone_number": phoneNumber,
        "address": address,
        "email": email,
        "inn": inn,
        "established_year": establishedYear,
        "district": district,
    };
}
