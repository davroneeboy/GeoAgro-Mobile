class NotificationItem {
  final int id;
  final String type;
  final String title;
  final String message;
  final String priority;
  final bool isRead;
  final DateTime createdAt;
  final DateTime? readAt;
  final Map<String, dynamic>? data;

  NotificationItem({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.priority,
    required this.isRead,
    required this.createdAt,
    this.readAt,
    this.data,
  });

  factory NotificationItem.fromJson(Map<String, dynamic> json) => NotificationItem(
        id: json['id'] as int,
        type: json['type'] as String? ?? '',
        title: json['title'] as String? ?? '',
        message: json['message'] as String? ?? '',
        priority: json['priority'] as String? ?? 'normal',
        isRead: json['is_read'] as bool? ?? false,
        createdAt: DateTime.tryParse(json['created_at'] as String? ?? '') ?? DateTime.now(),
        readAt: (json['read_at'] as String?) != null ? DateTime.tryParse(json['read_at'] as String) : null,
        data: json['data'] is Map<String, dynamic> ? json['data'] as Map<String, dynamic> : null,
      );
}

class NotificationsResponse {
  final List<NotificationItem> notifications;
  final int unreadCount;
  final bool hasMore;
  final int totalCount;

  NotificationsResponse({
    required this.notifications,
    required this.unreadCount,
    required this.hasMore,
    required this.totalCount,
  });

  factory NotificationsResponse.fromJson(Map<String, dynamic> json) => NotificationsResponse(
        notifications: (json['notifications'] as List<dynamic>? ?? [])
            .map((e) => NotificationItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        unreadCount: json['unread_count'] as int? ?? 0,
        hasMore: json['has_more'] as bool? ?? false,
        totalCount: json['total_count'] as int? ?? 0,
      );
}

