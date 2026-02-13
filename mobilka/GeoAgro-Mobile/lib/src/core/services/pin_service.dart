import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Сервис для управления in-app PIN-кодом.
///
/// PIN хранится в виде SHA-256 хеша в зашифрованном хранилище.
/// Используется как fallback, когда на устройстве нет блокировки экрана.
class PinService {
  PinService._();
  static final PinService instance = PinService._();

  static const String _pinHashKey = 'app_pin_hash';
  static const String _authMethodKey = 'auth_method';
  static const int pinLength = 4;

  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  // ─── Хеширование ────────────────────────────────────────

  /// Генерирует SHA-256 хеш для PIN-кода.
  String _hashPin(String pin) {
    final bytes = utf8.encode(pin);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  // ─── Установка PIN ──────────────────────────────────────

  /// Устанавливает новый PIN-код.
  Future<void> setPin(String pin) async {
    final hash = _hashPin(pin);
    await _secureStorage.write(key: _pinHashKey, value: hash);
    debugPrint('PinService: PIN установлен');
  }

  /// Удаляет сохранённый PIN-код.
  Future<void> removePin() async {
    await _secureStorage.delete(key: _pinHashKey);
    debugPrint('PinService: PIN удалён');
  }

  // ─── Проверка PIN ───────────────────────────────────────

  /// Проверяет введённый PIN-код.
  /// Возвращает `true` если PIN совпадает.
  Future<bool> verifyPin(String pin) async {
    final storedHash = await _secureStorage.read(key: _pinHashKey);
    if (storedHash == null) return false;
    final inputHash = _hashPin(pin);
    return storedHash == inputHash;
  }

  /// Проверяет, установлен ли PIN-код.
  Future<bool> isPinSet() async {
    final hash = await _secureStorage.read(key: _pinHashKey);
    return hash != null && hash.isNotEmpty;
  }

  // ─── Метод аутентификации ───────────────────────────────

  /// Сохраняет выбранный метод аутентификации.
  /// 'device' — блокировка устройства (биометрия/PIN устройства).
  /// 'app_pin' — встроенный PIN-код приложения.
  Future<void> setAuthMethod(AuthMethod method) async {
    await _secureStorage.write(
      key: _authMethodKey,
      value: method.name,
    );
    debugPrint('PinService: authMethod=${method.name}');
  }

  /// Читает сохранённый метод аутентификации.
  Future<AuthMethod> getAuthMethod() async {
    final value = await _secureStorage.read(key: _authMethodKey);
    if (value == null) return AuthMethod.none;
    return AuthMethod.values.firstWhere(
      (m) => m.name == value,
      orElse: () => AuthMethod.none,
    );
  }

  /// Сбрасывает метод аутентификации.
  Future<void> clearAuthMethod() async {
    await _secureStorage.delete(key: _authMethodKey);
    await removePin();
    debugPrint('PinService: auth method и PIN очищены');
  }
}

/// Метод аутентификации при запуске приложения.
enum AuthMethod {
  /// Не настроен — пропускаем экран блокировки.
  none,

  /// Блокировка устройства (биометрия, PIN устройства, пароль).
  device,

  /// Встроенный PIN-код приложения.
  appPin,
}
