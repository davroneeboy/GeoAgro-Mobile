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
    // Валидация перед отправкой запроса
    final trimmedUsername = userNameC.text.trim();
    final trimmedPassword = passwordC.text.trim();
    
    if (trimmedUsername.isEmpty || trimmedPassword.isEmpty) {
      errorMessage = "Noto'g'ri foydalanuvchi nomi yoki parol";
      return false;
    }
    
    _setLoading(true);
    try {
      debugPrint("🔐 Login attempt for: $trimmedUsername");
      final response = await _appRepositoryImpl.login(
        username: trimmedUsername,
        password: trimmedPassword,
      );
      debugPrint("🔐 Login response status: ${response.statusCode}");
      debugPrint("🔐 Login response data: ${response.data}");

      if (response.statusCode == 200 || response.statusCode == 201) {
        final jsonData = response.data;

        _tokenModel = tokenModelFromJson(jsonEncode(jsonData));
        await _putTokensToStorage();

        username = trimmedUsername; // Сохраняем в глобальную переменную из setup.dart
        accessToken = _tokenModel.access;
        debugPrint("🔐 LoginVM: accessToken updated in memory. Length: ${accessToken?.length}");

        await Future.delayed(const Duration(milliseconds: 500));

        debugPrint("🚀 Login successful, now fetching user info...");
        await _fetchAndStoreUserInfo();
        debugPrint("✅ User info fetch completed");

        errorMessage = null;
        return true;
      } else if (response.statusCode == 401) {
        errorMessage = "Noto'g'ri foydalanuvchi nomi yoki parol";
        return false;
      } else {
        errorMessage = "Server ochib qolgan bo'lishi mumkin.";
        return false;
      }
    } catch (e) {
      debugPrint("❌ Login unexpected error: $e");
      errorMessage = "Internet yoki server bilan muammo yuz berdi.";
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> _putTokensToStorage() async {
    await AppStorage.$write(key: StorageKey.accessToken, value: _tokenModel.access);
    await AppStorage.$write(key: StorageKey.refreshToken, value: _tokenModel.refresh);
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
        final dId = decoded["district_id"];
        final uId = decoded["id"];
        debugPrint("🏘️ District ID from API: $dId");
        debugPrint("👤 User ID from API: $uId");

        if (uId is int && uId > 0) {
          await AppStorage.$writeInt(key: StorageKey.userId, value: uId);
          debugPrint("💾 Stored userId: $uId");
        }

        if (dId is int && dId > 0) {
          districtId = dId;
          await AppStorage.$writeInt(key: StorageKey.districtId, value: dId);
          debugPrint("💾 Stored districtId: $dId");
        }

        final userInfo = UserInfoModel.fromJson(decoded);
        if (userInfo.flutterVersion != null) {
          debugPrint("🔍 App version check: server=${userInfo.flutterVersion}");
        }

        await AppStorage.$writeBool(key: StorageKey.isSpecialUser, value: userInfo.isSpecialUser);
        debugPrint("💾 Stored isSpecialUser: ${userInfo.isSpecialUser}");

        if (userInfo.limitKm != null) {
          await AppStorage.$writeDouble(key: StorageKey.limitKm, value: userInfo.limitKm!);
          debugPrint("💾 Stored limitKm: ${userInfo.limitKm} km");
        } else {
          await AppStorage.$delete(key: StorageKey.limitKm);
          debugPrint("💾 limitKm is null, will use default 1 km");
        }
      }
    } catch (e) {
      debugPrint("❌ Error fetching user info: $e");
    }
  }
}
