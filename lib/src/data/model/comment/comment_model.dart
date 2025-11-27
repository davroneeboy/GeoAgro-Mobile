import 'dart:convert';

/// Модель комментария для плантации
class CommentModel {
  final int id;
  final String body;
  final DateTime createdAt;
  final CommentAuthor? createdBy;
  final bool isModeration;
  // image и action игнорируем (legacy поля из старого API)

  CommentModel({
    required this.id,
    required this.body,
    required this.createdAt,
    this.createdBy,
    required this.isModeration,
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) => CommentModel(
        id: json["id"] as int,
        body: json["body"] as String,
        createdAt: DateTime.parse(json["created_at"] as String),
        createdBy: json["created_by"] != null
            ? CommentAuthor.fromJson(json["created_by"] as Map<String, dynamic>)
            : null,
        isModeration: json["is_moderation"] as bool? ?? false,
      );

  Map<String, dynamic> toJson() => {
        "id": id,
        "body": body,
        "created_at": createdAt.toIso8601String(),
        "created_by": createdBy?.toJson(),
        "is_moderation": isModeration,
      };

  @override
  String toString() =>
      'CommentModel(id: $id, body: $body, createdAt: $createdAt, createdBy: $createdBy, isModeration: $isModeration)';
}

/// Автор комментария
class CommentAuthor {
  final int id;
  final String username;
  final String firstName;
  final String lastName;

  CommentAuthor({
    required this.id,
    required this.username,
    required this.firstName,
    required this.lastName,
  });

  /// Полное имя (firstName + lastName)
  String get fullName {
    final name = '$firstName $lastName'.trim();
    return name.isNotEmpty ? name : username;
  }

  factory CommentAuthor.fromJson(Map<String, dynamic> json) => CommentAuthor(
        id: json["id"] as int,
        username: json["username"] as String,
        firstName: json["first_name"] as String? ?? '',
        lastName: json["last_name"] as String? ?? '',
      );

  Map<String, dynamic> toJson() => {
        "id": id,
        "username": username,
        "first_name": firstName,
        "last_name": lastName,
      };

  @override
  String toString() =>
      'CommentAuthor(id: $id, username: $username, fullName: $fullName)';
}

