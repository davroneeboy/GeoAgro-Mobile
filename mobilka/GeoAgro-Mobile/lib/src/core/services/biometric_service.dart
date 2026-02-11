import 'package:flutter/foundation.dart';
import 'package:local_auth/local_auth.dart';
import '../storage/app_storage.dart';

/// Сервис биометрической аутентификации.
///
/// Проверяет наличие биометрии (отпечаток/Face ID) или PIN/пароля устройства
/// и выполняет аутентификацию через системный диалог.
class BiometricService {
  BiometricService._();
  static final BiometricService instance = BiometricService._();

  final LocalAuthentication _auth = LocalAuthentication();

  // ─── Проверки ─────────────────────────────────────────────

  /// Проверяет, поддерживает ли устройство биометрию или пароль экрана.
  Future<bool> isDeviceSupported() async {
    try {
      return await _auth.isDeviceSupported();
    } catch (e) {
      debugPrint('❌ BiometricService.isDeviceSupported error: $e');
      return false;
    }
  }

  /// Проверяет, есть ли зарегистрированные биометрические данные (отпечатки и т.д.).
  Future<bool> canCheckBiometrics() async {
    try {
      return await _auth.canCheckBiometrics;
    } catch (e) {
      debugPrint('❌ BiometricService.canCheckBiometrics error: $e');
      return false;
    }
  }

  /// Возвращает список доступных типов биометрии.
  Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      return await _auth.getAvailableBiometrics();
    } catch (e) {
      debugPrint('❌ BiometricService.getAvailableBiometrics error: $e');
      return [];
    }
  }

  /// Комбинированная проверка: устройство поддерживает И есть хотя бы один
  /// способ аутентификации (биометрия или PIN/пароль).
  Future<bool> isBiometricAvailable() async {
    final deviceSupported = await isDeviceSupported();
    final canCheck = await canCheckBiometrics();
    debugPrint('🔐 BiometricService: deviceSupported=$deviceSupported, canCheck=$canCheck');
    return deviceSupported || canCheck;
  }

  // ─── Аутентификация ───────────────────────────────────────

  /// Запускает системный диалог аутентификации.
  ///
  /// [reason] — текст, который увидит пользователь в диалоге.
  /// Возвращает `true` при успешной аутентификации.
  Future<bool> authenticate({
    String reason = 'Ilovaga kirish uchun qurilma qulfini ishlating',
  }) async {
    try {
      final result = await _auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false, // разрешаем PIN/пароль как fallback
          useErrorDialogs: true,
        ),
      );
      debugPrint('🔐 BiometricService.authenticate result: $result');
      return result;
    } catch (e) {
      debugPrint('❌ BiometricService.authenticate error: $e');
      return false;
    }
  }

  // ─── Настройки (Storage) ──────────────────────────────────

  /// Включена ли биометрия пользователем.
  Future<bool> isBiometricEnabled() async {
    return await AppStorage.$readBool(key: StorageKey.biometricEnabled) ?? false;
  }

  /// Сохранить состояние: включена/выключена биометрическая блокировка.
  Future<void> setBiometricEnabled(bool value) async {
    await AppStorage.$writeBool(key: StorageKey.biometricEnabled, value: value);
  }
}
