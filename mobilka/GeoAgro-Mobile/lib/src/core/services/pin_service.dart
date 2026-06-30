import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// In-app PIN management. PIN is stored as a SHA-256 hash in the
/// encrypted secure-storage. The service also tracks consecutive failed
/// attempts so the lock screen can throttle and eventually force a
/// logout — without this a stolen device could brute-force the 4-digit
/// PIN in seconds.
class PinService {
  PinService._();
  static final PinService instance = PinService._();

  static const String _pinHashKey = 'app_pin_hash';
  static const String _authMethodKey = 'auth_method';
  static const String _failedAttemptsKey = 'pin_failed_attempts';
  static const String _lockUntilKey = 'pin_lock_until_ms';
  static const int pinLength = 4;

  /// Wrong PINs allowed in a row before the keypad enters a timed lockout.
  static const int maxAttemptsBeforeLockout = 5;

  /// Wrong PINs allowed in total before the user is force-logged out.
  static const int maxAttemptsBeforeLogout = 10;

  /// First lockout window in seconds. Each additional cycle doubles it
  /// (30s → 60s → 120s → ...).
  static const int baseLockoutSeconds = 30;

  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage();

  // ─── Hashing ───────────────────────────────────────────

  String _hashPin(String pin) {
    final bytes = utf8.encode(pin);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  // ─── Setup ─────────────────────────────────────────────

  Future<void> setPin(String pin) async {
    final hash = _hashPin(pin);
    await _secureStorage.write(key: _pinHashKey, value: hash);
    await _resetFailedAttempts();
    debugPrint('PinService: PIN установлен');
  }

  Future<void> removePin() async {
    await _secureStorage.delete(key: _pinHashKey);
    await _resetFailedAttempts();
    debugPrint('PinService: PIN удалён');
  }

  // ─── Verification ──────────────────────────────────────

  /// Returns true if [pin] matches the stored hash. Failed attempts are
  /// recorded, successful attempts reset the counter.
  Future<bool> verifyPin(String pin) async {
    final storedHash = await _secureStorage.read(key: _pinHashKey);
    if (storedHash == null) return false;
    final ok = storedHash == _hashPin(pin);
    if (ok) {
      await _resetFailedAttempts();
    } else {
      await _registerFailedAttempt();
    }
    return ok;
  }

  Future<bool> isPinSet() async {
    final hash = await _secureStorage.read(key: _pinHashKey);
    return hash != null && hash.isNotEmpty;
  }

  // ─── Rate limiting ─────────────────────────────────────

  Future<int> getFailedAttempts() async {
    final raw = await _secureStorage.read(key: _failedAttemptsKey);
    return int.tryParse(raw ?? '') ?? 0;
  }

  /// Remaining lockout window, or [Duration.zero] if not locked out.
  Future<Duration> getRemainingLockout() async {
    final raw = await _secureStorage.read(key: _lockUntilKey);
    final until = int.tryParse(raw ?? '');
    if (until == null) return Duration.zero;
    final nowMs = DateTime.now().millisecondsSinceEpoch;
    if (nowMs >= until) {
      await _secureStorage.delete(key: _lockUntilKey);
      return Duration.zero;
    }
    return Duration(milliseconds: until - nowMs);
  }

  Future<bool> isLockedOut() async =>
      (await getRemainingLockout()) > Duration.zero;

  /// True after [maxAttemptsBeforeLogout] consecutive failures. Caller
  /// must perform the actual logout — this is just a signal.
  Future<bool> hasExceededLogoutThreshold() async {
    return (await getFailedAttempts()) >= maxAttemptsBeforeLogout;
  }

  Future<void> _resetFailedAttempts() async {
    await _secureStorage.delete(key: _failedAttemptsKey);
    await _secureStorage.delete(key: _lockUntilKey);
  }

  Future<void> _registerFailedAttempt() async {
    final next = (await getFailedAttempts()) + 1;
    await _secureStorage.write(
      key: _failedAttemptsKey,
      value: next.toString(),
    );
    if (next % maxAttemptsBeforeLockout == 0) {
      final cycle = (next ~/ maxAttemptsBeforeLockout) - 1;
      final seconds = baseLockoutSeconds * (1 << cycle);
      final until =
          DateTime.now().add(Duration(seconds: seconds)).millisecondsSinceEpoch;
      await _secureStorage.write(
        key: _lockUntilKey,
        value: until.toString(),
      );
      debugPrint(
          'PinService: locked out for ${seconds}s after $next failed attempts');
    }
  }

  // ─── Auth method ───────────────────────────────────────

  /// Persists the chosen auth method.
  /// `device` — OS lock (biometric / device PIN / pattern).
  /// `appPin` — in-app PIN code.
  Future<void> setAuthMethod(AuthMethod method) async {
    await _secureStorage.write(key: _authMethodKey, value: method.name);
    debugPrint('PinService: authMethod=${method.name}');
  }

  Future<AuthMethod> getAuthMethod() async {
    final value = await _secureStorage.read(key: _authMethodKey);
    if (value == null) return AuthMethod.none;
    return AuthMethod.values.firstWhere(
      (m) => m.name == value,
      orElse: () => AuthMethod.none,
    );
  }

  Future<void> clearAuthMethod() async {
    await _secureStorage.delete(key: _authMethodKey);
    await removePin();
    debugPrint('PinService: auth method и PIN очищены');
  }
}

/// Auth method that gates the app on launch.
enum AuthMethod {
  /// Not configured — skip the lock screen.
  none,

  /// OS-level lock (biometric, device PIN/password).
  device,

  /// In-app PIN code.
  appPin,
}
