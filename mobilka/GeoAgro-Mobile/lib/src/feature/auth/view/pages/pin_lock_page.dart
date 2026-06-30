import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import 'package:agro_employee_public/design_system/tokens/adaptive_colors.dart';
import 'package:agro_employee_public/design_system/tokens/typography.dart';
import 'package:agro_employee_public/design_system/tokens/colors.dart'
    as design_colors;
import 'package:agro_employee_public/design_system/tokens/spacing.dart';

import '../../../../core/services/pin_service.dart';
import '../../../../core/services/biometric_service.dart';
import '../../../../core/storage/app_storage.dart';
import '../../../../core/routes/app_route_names.dart';
import '../../../../core/setting/setup.dart' as app_setup;
import '../../../../core/tools/assets.dart';
import '../../../../core/widgets/pin_input_widget.dart';

/// Lock screen shown on every cold/warm start when the user has configured
/// PIN or biometric protection. Biometric is auto-attempted on mount and
/// also available as a key in the keypad. Wrong PINs are rate-limited and
/// after [PinService.maxAttemptsBeforeLogout] consecutive failures the
/// user is force-logged out.
class PinLockPage extends StatefulWidget {
  const PinLockPage({super.key});

  @override
  State<PinLockPage> createState() => _PinLockPageState();
}

class _PinLockPageState extends State<PinLockPage> {
  final PinService _pinService = PinService.instance;
  final BiometricService _biometricService = BiometricService.instance;

  String _enteredPin = '';
  String? _errorMessage;
  bool _isVerifying = false;
  bool _biometricAvailable = false;
  Duration _remainingLockout = Duration.zero;
  Timer? _lockoutTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _init());
  }

  @override
  void dispose() {
    _lockoutTimer?.cancel();
    super.dispose();
  }

  Future<void> _init() async {
    await _refreshLockout();
    final biometricEnabled = app_setup.biometricEnabled;
    final isAvailable = await _biometricService.isBiometricAvailable();
    if (!mounted) return;
    setState(() {
      _biometricAvailable = biometricEnabled && isAvailable;
    });
    if (_biometricAvailable && _remainingLockout == Duration.zero) {
      await _tryBiometric();
    }
  }

  Future<void> _refreshLockout() async {
    final remaining = await _pinService.getRemainingLockout();
    if (!mounted) return;
    setState(() => _remainingLockout = remaining);
    _lockoutTimer?.cancel();
    if (remaining > Duration.zero) {
      _lockoutTimer = Timer.periodic(const Duration(seconds: 1), (_) async {
        final next = await _pinService.getRemainingLockout();
        if (!mounted) {
          _lockoutTimer?.cancel();
          return;
        }
        setState(() => _remainingLockout = next);
        if (next == Duration.zero) {
          _lockoutTimer?.cancel();
          setState(() => _errorMessage = null);
        }
      });
    }
  }

  Future<void> _tryBiometric() async {
    if (_isVerifying || _remainingLockout > Duration.zero) return;
    setState(() {
      _isVerifying = true;
      _errorMessage = null;
    });

    final result = await _biometricService.safeAuthenticate(
      reason: "Ilovaga kirish uchun",
    );
    if (!mounted) return;
    setState(() => _isVerifying = false);

    if (result == true) {
      context.go(AppRouteNames.home);
    } else if (result == null) {
      await _biometricService.setBiometricEnabled(false);
      app_setup.biometricEnabled = false;
      if (!mounted) return;
      setState(() => _biometricAvailable = false);
    }
  }

  void _onDigitPressed(String digit) {
    if (_enteredPin.length >= PinService.pinLength ||
        _isVerifying ||
        _remainingLockout > Duration.zero) {
      return;
    }
    setState(() {
      _enteredPin += digit;
      _errorMessage = null;
    });
    if (_enteredPin.length == PinService.pinLength) {
      _verifyPin();
    }
  }

  void _onBackspace() {
    if (_enteredPin.isEmpty ||
        _isVerifying ||
        _remainingLockout > Duration.zero) {
      return;
    }
    setState(() {
      _enteredPin = _enteredPin.substring(0, _enteredPin.length - 1);
      _errorMessage = null;
    });
  }

  Future<void> _verifyPin() async {
    setState(() => _isVerifying = true);
    final isCorrect = await _pinService.verifyPin(_enteredPin);
    if (!mounted) return;

    if (isCorrect) {
      context.go(AppRouteNames.home);
      return;
    }

    final tooManyFails = await _pinService.hasExceededLogoutThreshold();
    if (tooManyFails) {
      await _forceLogout();
      return;
    }

    final attempts = await _pinService.getFailedAttempts();
    final remaining = PinService.maxAttemptsBeforeLockout -
        (attempts % PinService.maxAttemptsBeforeLockout);
    final justLocked = await _pinService.isLockedOut();
    if (!mounted) return;
    setState(() {
      _enteredPin = '';
      _isVerifying = false;
      if (justLocked) {
        _errorMessage = "Juda ko'p urinishlar. Biroz kuting.";
      } else {
        _errorMessage = remaining <= 2
            ? "Noto'g'ri PIN. $remaining ta urinish qoldi"
            : "Noto'g'ri PIN-kod";
      }
    });
    if (justLocked) await _refreshLockout();
  }

  Future<void> _forceLogout() async {
    await _pinService.clearAuthMethod();
    await _biometricService.setBiometricEnabled(false);
    await AppStorage.clearAllData();
    app_setup.accessToken = null;
    app_setup.userId = 0;
    app_setup.districtId = 1;
    app_setup.username = null;
    app_setup.biometricEnabled = false;
    app_setup.authMethod = AuthMethod.none;
    app_setup.appPinSet = false;
    HapticFeedback.heavyImpact();
    if (!mounted) return;
    context.go(AppRouteNames.login);
  }

  Future<void> _logoutByButton() async {
    await _pinService.clearAuthMethod();
    await _biometricService.setBiometricEnabled(false);
    app_setup.biometricEnabled = false;
    app_setup.authMethod = AuthMethod.none;
    app_setup.appPinSet = false;
    await AppStorage.$deleteSecureTokens();
    if (!mounted) return;
    context.go(AppRouteNames.login);
  }

  String _formatLockout(Duration d) {
    final m = d.inMinutes;
    final s = d.inSeconds % 60;
    if (m > 0) return "${m}m ${s.toString().padLeft(2, '0')}s";
    return "${s}s";
  }

  @override
  Widget build(BuildContext context) {
    final cs = context.colors;
    final lockedOut = _remainingLockout > Duration.zero;

    return Scaffold(
      backgroundColor: cs.background,
      body: SafeArea(
        child: Stack(
          children: [
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      cs.background,
                      cs.surface.withValues(alpha: 0.85),
                    ],
                  ),
                ),
              ),
            ),
            Column(
              children: [
                SizedBox(height: 48.h),
                _buildHeader(cs),
                SizedBox(height: 32.h),
                _buildLockoutBanner(cs, lockedOut),
                Expanded(
                  child: Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16.w),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        PinInputWidget(
                          pinLength: PinService.pinLength,
                          currentLength: _enteredPin.length,
                          onDigitPressed: _onDigitPressed,
                          onBackspace: _onBackspace,
                          errorMessage: lockedOut ? null : _errorMessage,
                          isLoading: _isVerifying,
                          onBiometricPressed: _tryBiometric,
                          biometricEnabled: _biometricAvailable,
                          keypadDisabled: lockedOut,
                        ),
                      ],
                    ),
                  ),
                ),
                _buildFooter(cs),
                SizedBox(height: 12.h),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(AdaptiveColors cs) {
    return Column(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Image.asset(
            Assets.gerbImg,
            semanticLabel: "GeoAgro gerbi",
            height: 96.h,
            fit: BoxFit.contain,
          ),
        ),
        SizedBox(height: 18.h),
        Text(
          "GeoAgro",
          style: AppTypography.headline2(context).copyWith(
            fontSize: 30.sp,
            fontWeight: FontWeight.w800,
            color: cs.textPrimary,
            letterSpacing: -0.4,
          ),
        ),
        SizedBox(height: 6.h),
        Text(
          "PIN-KOD",
          style: TextStyle(
            fontSize: 11.sp,
            fontWeight: FontWeight.w600,
            letterSpacing: 2.5,
            color: cs.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildLockoutBanner(AdaptiveColors cs, bool lockedOut) {
    return AnimatedSize(
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeOut,
      child: lockedOut
          ? Padding(
              padding: EdgeInsets.symmetric(horizontal: 24.w),
              child: Container(
                padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
                decoration: BoxDecoration(
                  color: design_colors.AppColors.error.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(14.r),
                  border: Border.all(
                    color:
                        design_colors.AppColors.error.withValues(alpha: 0.25),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.lock_clock_outlined,
                      size: 20.sp,
                      color: design_colors.AppColors.error,
                    ),
                    SizedBox(width: 10.w),
                    Expanded(
                      child: Text(
                        "Juda ko'p noto'g'ri urinish. "
                        "${_formatLockout(_remainingLockout)} kuting.",
                        style: AppTypography.bodySmall(context).copyWith(
                          fontSize: 13.sp,
                          color: cs.textPrimary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            )
          : const SizedBox.shrink(),
    );
  }

  Widget _buildFooter(AdaptiveColors cs) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: AppSpacing.xl),
      child: TextButton(
        onPressed: _logoutByButton,
        style: TextButton.styleFrom(
          padding: EdgeInsets.symmetric(vertical: 12.h),
          minimumSize: Size(double.infinity, 44.h),
        ),
        child: Text(
          "Boshqa akkaunt bilan kirish",
          style: TextStyle(
            fontSize: 13.sp,
            color: cs.textTertiary,
            fontWeight: FontWeight.w500,
            decoration: TextDecoration.underline,
            decorationColor: cs.textTertiary.withValues(alpha: 0.4),
          ),
        ),
      ),
    );
  }
}
