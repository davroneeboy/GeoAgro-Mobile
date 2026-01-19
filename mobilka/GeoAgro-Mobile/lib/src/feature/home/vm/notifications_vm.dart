import 'dart:convert';

import 'package:flutter/material.dart';

import '../../../data/model/notification/notification_models.dart';
import '../../../data/repository/app_repository_impl.dart';

class NotificationsVm extends ChangeNotifier {
  final AppRepositoryImpl _repo;

  NotificationsVm(this._repo);

  final List<NotificationItem> notifications = [];
  bool isLoading = false;
  bool isFetchingMore = false;
  String? errorMessage;
  int limit = 20;
  int offset = 0;
  bool hasMore = true;
  int unreadCount = 0;

  Future<void> refresh({bool unreadOnly = false}) async {
    errorMessage = null;
    isLoading = true;
    notifications.clear();
    offset = 0;
    hasMore = true;
    notifyListeners();

    try {
      final data = await _repo.getNotifications(limit: limit, offset: offset, unreadOnly: unreadOnly);
      if (data == null) {
        errorMessage = "Server bilan bog'liq xatolik yuzaga keldi.";
      } else {
        final jsonData = jsonDecode(data) as Map<String, dynamic>;
        final resp = NotificationsResponse.fromJson(jsonData);
        notifications.addAll(resp.notifications);
        unreadCount = resp.unreadCount;
        hasMore = resp.hasMore;
        offset += resp.notifications.length;
      }
    } catch (_) {
      errorMessage = "Internet bilan bog'liq muammo yuzaga keldi.";
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchMore() async {
    if (!hasMore || isFetchingMore) return;
    isFetchingMore = true;
    notifyListeners();
    try {
      final data = await _repo.getNotifications(limit: limit, offset: offset);
      if (data != null) {
        final jsonData = jsonDecode(data) as Map<String, dynamic>;
        final resp = NotificationsResponse.fromJson(jsonData);
        notifications.addAll(resp.notifications);
        hasMore = resp.hasMore;
        offset += resp.notifications.length;
      }
    } finally {
      isFetchingMore = false;
      notifyListeners();
    }
  }

  Future<void> markAllAsRead() async {
    final data = await _repo.markNotificationsAsRead(markAll: true);
    if (data != null) {
      for (var i = 0; i < notifications.length; i++) {
        notifications[i] = NotificationItem(
          id: notifications[i].id,
          type: notifications[i].type,
          title: notifications[i].title,
          message: notifications[i].message,
          priority: notifications[i].priority,
          isRead: true,
          createdAt: notifications[i].createdAt,
          readAt: notifications[i].readAt ?? DateTime.now(),
          data: notifications[i].data,
        );
      }
      unreadCount = 0;
      notifyListeners();
    }
  }

  Future<void> markAsRead(int id) async {
    final data = await _repo.markNotificationAsRead(id: id);
    if (data != null) {
      final idx = notifications.indexWhere((e) => e.id == id);
      if (idx != -1) {
        final item = notifications[idx];
        notifications[idx] = NotificationItem(
          id: item.id,
          type: item.type,
          title: item.title,
          message: item.message,
          priority: item.priority,
          isRead: true,
          createdAt: item.createdAt,
          readAt: item.readAt ?? DateTime.now(),
          data: item.data,
        );
        unreadCount = (unreadCount - 1).clamp(0, 1 << 31);
        notifyListeners();
      }
    }
  }

  Future<void> delete(int id) async {
    final data = await _repo.deleteNotification(id: id);
    if (data != null) {
      notifications.removeWhere((e) => e.id == id);
      notifyListeners();
    }
  }

  /// Загрузить счетчик непрочитанных уведомлений
  Future<void> loadUnreadCount() async {
    try {
      final data = await _repo.getUnreadNotificationsCount();
      if (data != null) {
        final jsonData = jsonDecode(data) as Map<String, dynamic>;
        unreadCount = jsonData['unread_count'] as int? ?? 0;
        notifyListeners();
      }
    } catch (e) {
      // Игнорируем ошибки при загрузке счетчика
    }
  }
}

