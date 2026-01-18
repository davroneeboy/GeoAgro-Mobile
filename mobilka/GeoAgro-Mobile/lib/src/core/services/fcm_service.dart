import 'dart:developer';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../storage/app_storage.dart';

/// Сервис для работы с Firebase Cloud Messaging
class FcmService {
  static final FcmService _instance = FcmService._internal();
  factory FcmService() => _instance;
  FcmService._internal();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  
  String? _fcmToken;
  String? get fcmToken => _fcmToken;

  /// Инициализация FCM
  Future<void> initialize() async {
    try {
      // Запрашиваем разрешения на уведомления
      NotificationSettings settings = await _messaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      log('FCM Permission status: ${settings.authorizationStatus}');

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        log('User granted permission for notifications');
      } else if (settings.authorizationStatus == AuthorizationStatus.provisional) {
        log('User granted provisional permission');
      } else {
        log('User declined or has not accepted permission');
        return;
      }

      // Получаем FCM token
      await _getFcmToken();

      // Настраиваем обработчики уведомлений
      _setupMessageHandlers();

      // Обрабатываем уведомление, которое открыло приложение
      RemoteMessage? initialMessage = await _messaging.getInitialMessage();
      if (initialMessage != null) {
        _handleNotification(initialMessage);
      }

      log('FCM initialized successfully');
    } catch (e) {
      log('FCM initialization failed: $e');
    }
  }

  /// Получить FCM token
  Future<void> _getFcmToken() async {
    try {
      _fcmToken = await _messaging.getToken();
      if (_fcmToken != null) {
        log('FCM Token: $_fcmToken');
        await _saveTokenToStorage();
        await _sendTokenToServer();
        
        // Слушаем обновления token
        _messaging.onTokenRefresh.listen((newToken) {
          log('FCM Token refreshed: $newToken');
          _fcmToken = newToken;
          _saveTokenToStorage();
          _sendTokenToServer();
        });
      }
    } catch (e) {
      log('Error getting FCM token: $e');
    }
  }

  /// Сохранить token в локальное хранилище
  Future<void> _saveTokenToStorage() async {
    if (_fcmToken != null) {
      await AppStorage.$write(key: StorageKey.fcmToken, value: _fcmToken!);
    }
  }

  /// Отправить token на сервер
  Future<void> _sendTokenToServer() async {
    if (_fcmToken == null) return;
    
    try {
      // TODO: Добавить API endpoint для отправки FCM token
      // await _repository.updateFcmToken(_fcmToken!);
      log('FCM token ready to send to server: $_fcmToken');
    } catch (e) {
      log('Error sending FCM token to server: $e');
    }
  }

  /// Настроить обработчики сообщений
  void _setupMessageHandlers() {
    // Уведомления когда приложение на переднем плане
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      log('Received foreground message: ${message.messageId}');
      _handleNotification(message);
    });

    // Уведомления когда приложение в фоне и пользователь нажимает на уведомление
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      log('Notification opened app: ${message.messageId}');
      _handleNotification(message);
    });
  }

  /// Обработать уведомление
  void _handleNotification(RemoteMessage message) {
    log('Handling notification: ${message.messageId}');
    log('Title: ${message.notification?.title}');
    log('Body: ${message.notification?.body}');
    log('Data: ${message.data}');
    
    // Здесь можно добавить логику навигации или обновления UI
    // Например, обновить список уведомлений или перейти на страницу уведомлений
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
    } catch (e) {
      log('Error deleting FCM token: $e');
    }
  }
}
