import 'dart:developer';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:agro_employee_public/firebase_options.dart';
import '../../data/model/fruits/fruit_model.dart';
import '../storage/app_storage.dart';
import '../../data/repository/app_repository_impl.dart';

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
  } catch (e) {
    log("Firebase initialization failed: $e");
    // Continue without Firebase if it fails
  }
  
  try {
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

const Map<int, String> plantatiopnType = {
  1: "Bog`",
  2: "Uzumzor",
  3: "Issiqxona",
};

const Map<int, String> issiqxonaType = {
  1: "Mahalliy",
  2: "Zamonaviy",
};

const Map<int, String> uzumType = {
  1: "Xo`raki",
  2: "Kishmish bop",
  3: "Sanoat bop (vino bop)"
};

const Map<int, String> bogType = {
  1: "Intensiv",
  2: "Mahalliy",
};

const Map<int, String> bogSubtype = {
  1: "Pakana",
  2: "Yarim pakana",
};

 

const Map<int, String> yerTuri = {
  1: "Lalmi",
  2: "Tog`oldi",
  3: "Adir",
  4: "Suvli maydon",
};

const Map<int, String> subsidyType = {
  1: "Limon",
  2: "Shpalier",
  3: "Ko`chat",
  4: "Quduq",
  5: "Tomchilatib",
  6: "Muqobilenergiya",
};

const Map<int, String> region = {
  1: 'Tashkent',
  2: 'Andijan',
  3: 'Bukhara',
  4: 'Fergana',
  5: 'Jizzakh',
  6: 'Kashkadarya',
  7: 'Navoi',
  8: 'Namangan',
  9: 'Samarkand',
  10: 'Sirdarya',
  11: 'Surkhandarya',
  12: 'Karakalpakstan',
};
