import 'dart:developer';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:agro_employee_public/firebase_options.dart';
import '../../data/model/fruits/fruit_model.dart';
import '../storage/app_storage.dart';
import '../../data/repository/app_repository_impl.dart';
import '../services/fcm_service.dart' show FcmService;
import '../../../localization/app_strings.dart' show AppLocalizedMaps;

/// Обработчик фоновых сообщений (должен быть top-level функцией)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  log('Handling background message: ${message.messageId}');
  log('Title: ${message.notification?.title}');
  log('Body: ${message.notification?.body}');
  log('Data: ${message.data}');
  // Здесь можно добавить логику обработки фоновых уведомлений
}

String? accessToken;
bool isBloc = false;
int districtId = 1;
int userId = 0;
String? username;
List<FruitModel> fruitList = [];

Future<void> setup() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  try {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
    log("Firebase initialized successfully");
    
    // Инициализируем FCM для push-уведомлений
    try {
      // Регистрируем обработчик фоновых сообщений
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
      
      // Инициализируем FCM сервис
      await FcmService().initialize();
      log("FCM service initialized successfully");
    } catch (e) {
      log("FCM initialization failed: $e");
      // Continue without FCM if it fails
    }
  } catch (e) {
    log("Firebase initialization failed: $e");
    // Continue without Firebase if it fails
  }
  
  try {
    // Initialize storage and migrate tokens if needed
    await AppStorage.initialize();
    
    accessToken = await AppStorage.$read(key: StorageKey.accessToken);
    isBloc = await AppStorage.$readBool(key: StorageKey.isBlocked) ?? false;
    username = await AppStorage.$read(key: StorageKey.username);
    final storedDistrict = await AppStorage.$readInt(key: StorageKey.districtId);
    if (storedDistrict != null && storedDistrict > 0) {
      districtId = storedDistrict;
      log("Loaded districtId from storage: $districtId");
    }
    final storedUserId = await AppStorage.$readInt(key: StorageKey.userId);
    if (storedUserId != null && storedUserId > 0) {
      userId = storedUserId;
      log("Loaded userId from storage: $userId");
    }
    // Ensure we have fresh user info from API if authenticated
    if (accessToken != null && (userId <= 0 || username == null || username!.isEmpty)) {
      try {
        final repo = AppRepositoryImpl();
        final userInfo = await repo.getUserInfo();
        if (userInfo != null) {
          final decoded = jsonDecode(userInfo);
          if (decoded is Map<String, dynamic>) {
            final apiUserId = decoded['id'];
            final apiUsername = decoded['username'];
            final apiDistrictId = decoded['district_id'];
            if (apiUserId is int && apiUserId > 0) {
              userId = apiUserId;
              await AppStorage.$writeInt(key: StorageKey.userId, value: apiUserId);
              log('Refreshed userId from API: $userId');
            }
            if (apiUsername is String && apiUsername.isNotEmpty) {
              username = apiUsername;
              await AppStorage.$write(key: StorageKey.username, value: apiUsername);
              log('Refreshed username from API: $username');
            }
            if (apiDistrictId is int && apiDistrictId > 0) {
              districtId = apiDistrictId;
              await AppStorage.$writeInt(key: StorageKey.districtId, value: apiDistrictId);
              log('Refreshed districtId from API: $districtId');
            }
            
            // Load is_specialuser and limit_km from API response
            final apiIsSpecialUser = decoded['is_specialuser'] ?? false;
            await AppStorage.$writeBool(key: StorageKey.isSpecialUser, value: apiIsSpecialUser);
            log('Refreshed isSpecialUser from API: $apiIsSpecialUser');
            
            final apiLimitKm = decoded['limit_km']?.toDouble();
            if (apiLimitKm != null) {
              await AppStorage.$writeDouble(key: StorageKey.limitKm, value: apiLimitKm);
              log('Refreshed limitKm from API: $apiLimitKm km');
            } else {
              await AppStorage.$delete(key: StorageKey.limitKm);
              log('limitKm is null, using default 1 km');
            }
          }
        }
      } catch (e) {
        log('Failed to refresh user info at setup: $e');
      }
    }
    log("Storage initialized successfully");
  } catch (e) {
    log("Storage initialization failed: $e");
    // Set default values if storage fails
    accessToken = null;
    isBloc = false;
  }
}

// Legacy constants - now using AppLocalizedMaps
// Keeping for backward compatibility during migration
// Note: Using getter methods instead of const to maintain compatibility
@Deprecated('Use AppLocalizedMaps.plantationTypes instead')
Map<int, String> get plantatiopnType => AppLocalizedMaps.plantationTypes;

@Deprecated('Use AppLocalizedMaps.issiqxonaTypes instead')
Map<int, String> get issiqxonaType => AppLocalizedMaps.issiqxonaTypes;

@Deprecated('Use AppLocalizedMaps.uzumTypes instead')
Map<int, String> get uzumType => AppLocalizedMaps.uzumTypes;

@Deprecated('Use AppLocalizedMaps.bogTypes instead')
Map<int, String> get bogType => AppLocalizedMaps.bogTypes;

@Deprecated('Use AppLocalizedMaps.bogSubtypes instead')
Map<int, String> get bogSubtype => AppLocalizedMaps.bogSubtypes;

@Deprecated('Use AppLocalizedMaps.yerTuri instead')
Map<int, String> get yerTuri => AppLocalizedMaps.yerTuri;

@Deprecated('Use AppLocalizedMaps.subsidyTypes instead')
Map<int, String> get subsidyType => AppLocalizedMaps.subsidyTypes;

@Deprecated('Use AppLocalizedMaps.regions instead')
Map<int, String> get region => AppLocalizedMaps.regions;
