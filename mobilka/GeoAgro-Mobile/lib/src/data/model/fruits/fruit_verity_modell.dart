import 'dart:convert';

List<FruitVarietyModel> fruitVarietyModelFromJson(String str) =>
    List<FruitVarietyModel>.from(
        json.decode(str).map((x) => FruitVarietyModel.fromJson(x)));

String fruitVarietyModelToJson(List<FruitVarietyModel> data) =>
    json.encode(List<dynamic>.from(data.map((x) => x.toJson())));

class FruitVarietyModel {
  int id;
  String name;
  int fruit;

  FruitVarietyModel({
    required this.id,
    required this.name,
    required this.fruit,
  });

  FruitVarietyModel copyWith({
    int? id,
    String? name,
    int? fruit,
  }) =>
      FruitVarietyModel(
        id: id ?? this.id,
        name: name ?? this.name,
        fruit: fruit ?? this.fruit,
      );

  factory FruitVarietyModel.fromJson(Map<String, dynamic> json) =>
      FruitVarietyModel(
        id: json["id"],
        name: json["name"],
        fruit: json["fruit"],
      );

  Map<String, dynamic> toJson() => {
        "id": id,
        "name": name,
        "fruit": fruit,
      };
}
