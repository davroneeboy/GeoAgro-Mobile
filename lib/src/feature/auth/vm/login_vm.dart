import 'dart:convert';

import 'package:flutter/material.dart';

import '../../../core/storage/app_storage.dart';
import '../../../data/model/token/token_model.dart';
import '../../../data/model/user/user_info_model.dart';
import '../../../data/repository/app_repository_impl.dart';
import '../../../core/setting/setup.dart';

class LoginVm extends ChangeNotifier {
  TextEditingController userNameC = TextEditingController();
  TextEditingController passwordC = TextEditingController();

  final formKey = GlobalKey<FormState>();
  final AppRepositoryImpl _appRepositoryImpl = AppRepositoryImpl();
  late TokenModel _tokenModel;

  String? errorMessage;
  bool isLoading = false;

  void _setLoading(bool value) {
    isLoading = value;
    notifyListeners();
  }

  Future<bool> login() async {
    _setLoading(true);
    try {
      // API so‘rovi yuborish
      debugPrint("🔐 Login attempt for: ${userNameC.text.trim()}");
      final response = await _appRepositoryImpl.login(
        username: userNameC.text.trim(),
        password: passwordC.text.trim(),
      );
      debugPrint("🔐 Login response status: ${response.statusCode}");
      debugPrint("🔐 Login response data: ${response.data}");

      // Agar status code 200 yoki 201 bo‘lsa
      if (response.statusCode == 200 || response.statusCode == 201) {
        final jsonData = response.data;

        // Token modelini yaratish va saqlash
        _tokenModel = tokenModelFromJson(jsonEncode(jsonData));
        _putTokensToStorage();

        // Update in-memory username immediately for this session
        username = userNameC.text.trim();

        // Fetch current user info and store districtId
        debugPrint("🚀 Login successful, now fetching user info...");
        await _fetchAndStoreUserInfo();
        debugPrint("✅ User info fetch completed");

        // Xato xabarni tozalash va true qaytarish
        errorMessage = null;
        return true;
      }
      // Agar status code 401 bo‘lsa
      else if (response.statusCode == 401) {
        errorMessage = "Bunday foydalanuvchi yo'q.";
        return false;
      }
      // Boshqa holatlar (masalan, server xatosi)
      else {
        errorMessage = "Server ochib qolgan bo'lishi mumkin.";
        return false;
      }
    } catch (e) {
      // Kutilmagan xatoliklar uchun
      debugPrint("❌ Login unexpected error: $e");
      errorMessage = "Internet yoki server bilan muammo yuz berdi.";
      return false;
    } finally {
      // Foydalanuvchini xabardor qilish
      _setLoading(false);
    }
  }

  void _putTokensToStorage() {
    AppStorage.$write(key: StorageKey.accessToken, value: _tokenModel.access);
    AppStorage.$write(key: StorageKey.refreshToken, value: _tokenModel.refresh);
  }

  Future<void> _fetchAndStoreUserInfo() async {
    debugPrint("🔍 Starting getUserInfo request...");
    
    try {
      debugPrint("📡 Calling getUserInfo API...");
      final userInfoJson = await _appRepositoryImpl.getUserInfo();
      
      if (userInfoJson == null) {
        debugPrint("❌ getUserInfo returned null");
        return;
      }
      
      debugPrint("✅ getUserInfo response received: $userInfoJson");
      final decoded = jsonDecode(userInfoJson);
      debugPrint("🔍 Decoded user info: $decoded");
      
      if (decoded is Map<String, dynamic>) {
        // API returns district_id directly, not nested in location
        final dId = decoded["district_id"];
        final uId = decoded["id"];
        debugPrint("🏘️ District ID from API: $dId");
        debugPrint("👤 User ID from API: $uId");

        // Store userId first
        if (uId is int && uId > 0) {
          await AppStorage.$writeInt(key: StorageKey.userId, value: uId);
          debugPrint("💾 Stored userId: $uId");
        }

        if (dId is int && dId > 0) {
          districtId = dId;
          await AppStorage.$writeInt(key: StorageKey.districtId, value: dId);
          debugPrint("💾 Stored districtId: $dId");
        }
        
        // Проверяем версию приложения и сохраняем специальные поля
        final userInfo = UserInfoModel.fromJson(decoded);
        if (userInfo.flutterVersion != null) {
          debugPrint("🔍 App version check: server=${userInfo.flutterVersion}");
          // Версия будет проверена в drawer при первом открытии
        }
        
        // Сохраняем is_specialuser
        await AppStorage.$writeBool(key: StorageKey.isSpecialUser, value: userInfo.isSpecialUser);
        debugPrint("💾 Stored isSpecialUser: ${userInfo.isSpecialUser}");
        
        // Сохраняем limit_km (если не null)
        if (userInfo.limitKm != null) {
          await AppStorage.$writeDouble(key: StorageKey.limitKm, value: userInfo.limitKm!);
          debugPrint("💾 Stored limitKm: ${userInfo.limitKm} km");
        } else {
          // Если null, удаляем старое значение (будет использован дефолт 1 км)
          await AppStorage.$delete(key: StorageKey.limitKm);
          debugPrint("💾 limitKm is null, will use default 1 km");
        }
      }
    } catch (e) {
      debugPrint("❌ Error fetching user info: $e");
    }
  }
}
