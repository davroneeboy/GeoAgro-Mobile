import 'dart:async';
import 'dart:developer';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';

import '../routes/app_route_names.dart';
import '../routes/router_config.dart';
import '../storage/app_storage.dart';

/// Сервис для работы с Firebase Cloud Messaging
class FcmService {
  static final FcmService _instance = FcmService._internal();
  factory FcmService() => _instance;
  FcmService._internal();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  StreamSubscription<String>? _tokenRefreshSub;
  StreamSubscription<RemoteMessage>? _onMessageSub;
  StreamSubscription<RemoteMessage>? _onMessageOpenedSub;

  bool _initialized = false;
  int? _pendingPlantationId;
  Future<void> Function()? _onUnreadRefreshRequested;

  String? _fcmToken;
  String? get fcmToken => _fcmToken;

  /// Коллбэк обновления unread badge (подключается из UI).
  void setUnreadRefreshCallback(Future<void> Function()? callback) {
    _onUnreadRefreshRequested = callback;
  }

  /// Инициализация FCM
  Future<void> initialize() async {
    if (_initialized) return;

    try {
      final settings = await _messaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      log('FCM Permission status: ${settings.authorizationStatus}');

      if (settings.authorizationStatus == AuthorizationStatus.denied) {
        log('User declined notification permission');
        return;
      }

      await _getFcmToken();
      _setupMessageHandlers();

      final initialMessage = await _messaging.getInitialMessage();
      if (initialMessage != null) {
        _handleNotification(initialMessage, openedFromTap: true);
      }

      _initialized = true;
      log('FCM initialized successfully');
      debugPrint('FCM: initialized');
    } catch (e) {
      log('FCM initialization failed: $e');
      debugPrint('FCM: initialization failed: $e');
    }
  }

  /// Получить и локально сохранить FCM token. Раньше здесь же токен
  /// синхронизировался с бэкендом (/api/device-tokens/), но этот
  /// эндпоинт не существует — backend-регистрация убрана, retry-логика
  /// вместе с ней (нечего больше ретраить).
  Future<void> _getFcmToken() async {
    try {
      _fcmToken = await _messaging.getToken();
      if (_fcmToken == null || _fcmToken!.isEmpty) {
        debugPrint('FCM: getToken returned null/empty');
        return;
      }

      log('FCM Token: $_fcmToken');
      debugPrint('FCM: token acquired');
      await _saveTokenToStorage();

      _tokenRefreshSub?.cancel();
      _tokenRefreshSub = _messaging.onTokenRefresh.listen((newToken) async {
        log('FCM Token refreshed: $newToken');
        _fcmToken = newToken;
        await _saveTokenToStorage();
      });
    } catch (e) {
      log('Error getting FCM token: $e');
      debugPrint('FCM: error getting token: $e');
    }
  }

  /// Сохранить token в локальное хранилище
  Future<void> _saveTokenToStorage() async {
    if (_fcmToken == null || _fcmToken!.isEmpty) return;
    await AppStorage.$write(key: StorageKey.fcmToken, value: _fcmToken!);
  }

  /// Настроить обработчики сообщений
  void _setupMessageHandlers() {
    _onMessageSub?.cancel();
    _onMessageOpenedSub?.cancel();

    _onMessageSub = FirebaseMessaging.onMessage.listen((message) {
      log('Received foreground message: ${message.messageId}');
      _handleNotification(message, openedFromTap: false);
    });

    _onMessageOpenedSub =
        FirebaseMessaging.onMessageOpenedApp.listen((message) {
      log('Notification opened app: ${message.messageId}');
      _handleNotification(message, openedFromTap: true);
    });
  }

  /// Обработать уведомление
  void _handleNotification(RemoteMessage message,
      {required bool openedFromTap}) {
    log('Handling notification: ${message.messageId}');
    log('Title: ${message.notification?.title}');
    log('Body: ${message.notification?.body}');
    log('Data: ${message.data}');

    // Обновляем badge при входящем push
    _refreshUnreadBadge();

    if (!openedFromTap) return;

    final plantationIdRaw = message.data['plantation_id'];
    final plantationId = int.tryParse(plantationIdRaw?.toString() ?? '');
    if (plantationId == null || plantationId <= 0) return;

    _navigateToPlantation(plantationId);
  }

  Future<void> _refreshUnreadBadge() async {
    try {
      await _onUnreadRefreshRequested?.call();
    } catch (e) {
      log('Failed to refresh unread badge: $e');
    }
  }

  void _navigateToPlantation(int plantationId) {
    final navContext = parentNavigatorKey.currentContext;
    if (navContext == null) {
      _pendingPlantationId = plantationId;
      return;
    }

    navContext.go(
      "${AppRouteNames.home}${AppRouteNames.plantationView}",
      extra: plantationId,
    );
    _pendingPlantationId = null;
  }

  /// Вызывайте после появления UI, чтобы обработать отложенный deep-link из push.
  void flushPendingNavigation() {
    final pendingId = _pendingPlantationId;
    if (pendingId == null) return;
    _navigateToPlantation(pendingId);
  }

  /// Подписаться на топик
  Future<void> subscribeToTopic(String topic) async {
    try {
      await _messaging.subscribeToTopic(topic);
      log('Subscribed to topic: $topic');
    } catch (e) {
      log('Error subscribing to topic $topic: $e');
    }
  }

  /// Отписаться от топика
  Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await _messaging.unsubscribeFromTopic(topic);
      log('Unsubscribed from topic: $topic');
    } catch (e) {
      log('Error unsubscribing from topic $topic: $e');
    }
  }

  /// Удалить token (при выходе из аккаунта)
  Future<void> deleteToken() async {
    try {
      await _messaging.deleteToken();
      _fcmToken = null;
      await AppStorage.$delete(key: StorageKey.fcmToken);
      log('FCM token deleted');
      debugPrint('FCM: token deleted locally');
    } catch (e) {
      log('Error deleting FCM token: $e');
      debugPrint('FCM: error deleting token: $e');
    }
  }
}
