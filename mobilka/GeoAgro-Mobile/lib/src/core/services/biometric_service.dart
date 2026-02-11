import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:local_auth/local_auth.dart';
import '../storage/app_storage.dart';

/// Результат проверки доступности биометрии / блокировки устройства.
enum BiometricAvailability {
  /// Устройство поддерживает и готово к аутентификации.
  available,
  /// На устройстве нет ни пароля, ни биометрии.
  noSecuritySetup,
  /// Ранее было включено, но пользователь убрал блокировку с устройства.
  securityRemoved,
}

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
      debugPrint('BiometricService.isDeviceSupported error: $e');
      return false;
    }
  }

  /// Проверяет, есть ли зарегистрированные биометрические данные (отпечатки и т.д.).
  Future<bool> canCheckBiometrics() async {
    try {
      return await _auth.canCheckBiometrics;
    } catch (e) {
      debugPrint('BiometricService.canCheckBiometrics error: $e');
      return false;
    }
  }

  /// Возвращает список доступных типов биометрии.
  Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      return await _auth.getAvailableBiometrics();
    } catch (e) {
      debugPrint('BiometricService.getAvailableBiometrics error: $e');
      return [];
    }
  }

  /// Комбинированная проверка: устройство поддерживает И есть хотя бы один
  /// способ аутентификации (биометрия или PIN/пароль).
  Future<bool> isBiometricAvailable() async {
    final deviceSupported = await isDeviceSupported();
    final canCheck = await canCheckBiometrics();
    debugPrint('BiometricService: deviceSupported=$deviceSupported, canCheck=$canCheck');
    return deviceSupported || canCheck;
  }

  /// Расширенная проверка доступности с учётом текущего состояния.
  ///
  /// Возвращает [BiometricAvailability] — позволяет отличить
  /// «не поддерживается» от «поддержка была, но пользователь убрал блокировку».
  Future<BiometricAvailability> checkAvailability() async {
    final isAvailable = await isBiometricAvailable();
    if (isAvailable) return BiometricAvailability.available;
    final wasEnabled = await isBiometricEnabled();
    if (wasEnabled) return BiometricAvailability.securityRemoved;
    return BiometricAvailability.noSecuritySetup;
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
      debugPrint('BiometricService.authenticate result: $result');
      return result;
    } catch (e) {
      debugPrint('BiometricService.authenticate error: $e');
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

  // ─── Проверка перед критическим действием ───────────────────

  /// Запрашивает аутентификацию перед критическим действием
  /// (удаление, сохранение изменений и т.д.).
  ///
  /// [context] — нужен для показа предупреждения, если блокировка недоступна.
  /// Возвращает `true` если пользователь прошёл аутентификацию
  /// или подтвердил действие через диалог-предупреждение.
  Future<bool> confirmCriticalAction({
    required BuildContext context,
    String reason = 'Amalni tasdiqlash uchun qurilma qulfini ishlating',
  }) async {
    final availability = await checkAvailability();
    switch (availability) {
      case BiometricAvailability.available:
        return await authenticate(reason: reason);
      case BiometricAvailability.securityRemoved:
        // Блокировка была включена, но пользователь убрал PIN/пароль
        // Показываем предупреждение и требуем подтверждение
        return await _showSecurityWarningDialog(context);
      case BiometricAvailability.noSecuritySetup:
        // Устройство не защищено — показываем предупреждение
        return await _showNoSecurityDialog(context);
    }
  }

  /// Диалог-предупреждение: блокировка убрана с устройства.
  Future<bool> _showSecurityWarningDialog(BuildContext context) async {
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text("Xavfsizlik ogohlantirishi"),
        content: const Text(
          "Qurilmangizdan qulf (PIN/parol/barmoq izi) olib tashlangan. "
          "Iltimos, qurilma sozlamalarida qulfni qayta o'rnating.\n\n"
          "Amalni bajarishni davom ettirasizmi?",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text("Bekor qilish"),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text("Davom etish"),
          ),
        ],
      ),
    );
    return result ?? false;
  }

  /// Диалог-предупреждение: на устройстве нет защиты.
  Future<bool> _showNoSecurityDialog(BuildContext context) async {
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text("Qurilma himoyalanmagan"),
        content: const Text(
          "Qurilmangizda qulf o'rnatilmagan (PIN, parol yoki barmoq izi). "
          "Xavfsizlik uchun qurilma sozlamalarida qulf o'rnating.\n\n"
          "Amalni bajarishni davom ettirasizmi?",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text("Bekor qilish"),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text("Davom etish"),
          ),
        ],
      ),
    );
    return result ?? false;
  }

  /// Показывает диалог о необходимости установить блокировку экрана.
  /// Используется на главном экране после логина.
  Future<void> showSetupSecurityDialog(BuildContext context) async {
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text("Qurilma himoyasi talab qilinadi"),
        content: const Text(
          "Ilova xavfsiz ishlashi uchun qurilmangizda qulf o'rnatilishi kerak "
          "(PIN, parol, grafik kalit yoki barmoq izi).\n\n"
          "Iltimos, qurilma sozlamalariga o'ting va qulfni o'rnating.",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text("Tushundim"),
          ),
        ],
      ),
    );
  }
}
