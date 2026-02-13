import 'package:flutter/material.dart';
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

/// Единый экран блокировки приложения.
///
/// Логика:
/// 1. Если биометрия включена → автоматически запускается при открытии.
/// 2. Пользователь всегда видит PIN-клавиатуру как fallback.
/// 3. Если биометрия не прошла / отменена → пользователь вводит PIN.
/// 4. Кнопка для повторного запуска биометрии (если включена).
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

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _init());
  }

  Future<void> _init() async {
    // Проверяем, доступна ли биометрия
    final biometricEnabled = app_setup.biometricEnabled;
    final isAvailable = await _biometricService.isBiometricAvailable();
    if (!mounted) return;
    setState(() {
      _biometricAvailable = biometricEnabled && isAvailable;
    });
    // Автоматически запускаем биометрию
    if (_biometricAvailable) {
      await _tryBiometric();
    }
  }

  /// Запускает биометрическую аутентификацию.
  Future<void> _tryBiometric() async {
    if (_isVerifying) return;
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
      // Биометрия прошла — идём домой
      context.go(AppRouteNames.home);
    } else if (result == null) {
      // Биометрия недоступна (убрали блокировку устройства)
      // Отключаем, но PIN остаётся — пользователь вводит PIN
      await _biometricService.setBiometricEnabled(false);
      app_setup.biometricEnabled = false;
      if (!mounted) return;
      setState(() {
        _biometricAvailable = false;
      });
    }
    // Если result == false → пользователь отменил или не прошёл,
    // пусть вводит PIN (уже отображается)
  }

  void _onDigitPressed(String digit) {
    if (_enteredPin.length >= PinService.pinLength || _isVerifying) return;
    setState(() {
      _enteredPin += digit;
      _errorMessage = null;
    });
    if (_enteredPin.length == PinService.pinLength) {
      _verifyPin();
    }
  }

  void _onBackspace() {
    if (_enteredPin.isEmpty || _isVerifying) return;
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
    } else {
      setState(() {
        _enteredPin = '';
        _isVerifying = false;
        _errorMessage = "Noto'g'ri PIN-kod";
      });
    }
  }

  Future<void> _logout() async {
    await _pinService.clearAuthMethod();
    await _biometricService.setBiometricEnabled(false);
    app_setup.biometricEnabled = false;
    app_setup.authMethod = AuthMethod.none;
    app_setup.appPinSet = false;
    await AppStorage.$deleteSecureTokens();
    if (!mounted) return;
    context.go(AppRouteNames.login);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      body: SafeArea(
        child: Container(
          width: double.infinity,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                context.colors.background,
                context.colors.surface,
              ],
            ),
          ),
          child: Column(
            children: [
              SizedBox(height: 40.h),
              // Логотип
              ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: Image.asset(
                  Assets.gerbImg,
                  height: 64.h,
                  fit: BoxFit.contain,
                ),
              ),
              SizedBox(height: 16.h),
              // Заголовок
              Text(
                "GeoAgro",
                style: AppTypography.headline2(context).copyWith(
                  fontSize: 24.sp,
                  fontWeight: FontWeight.w800,
                  color: context.colors.textPrimary,
                ),
              ),
              SizedBox(height: 6.h),
              Text(
                "PIN-kodni kiriting",
                style: AppTypography.bodySmall(context).copyWith(
                  fontSize: 15.sp,
                  color: context.colors.textSecondary,
                ),
              ),
              SizedBox(height: 24.h),
              // Ввод PIN
              PinInputWidget(
                pinLength: PinService.pinLength,
                currentLength: _enteredPin.length,
                onDigitPressed: _onDigitPressed,
                onBackspace: _onBackspace,
                errorMessage: _errorMessage,
                isLoading: _isVerifying,
              ),
              SizedBox(height: 16.h),
              // Кнопка биометрии (если доступна)
              if (_biometricAvailable)
                _buildBiometricButton(),
              const Spacer(),
              // Нижние кнопки
              Padding(
                padding: EdgeInsets.symmetric(horizontal: AppSpacing.xl),
                child: TextButton(
                  onPressed: _logout,
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.symmetric(vertical: 14.h),
                    minimumSize: Size(double.infinity, 48.h),
                  ),
                  child: Text(
                    "Boshqa akkaunt bilan kirish",
                    style: AppTypography.bodySmall(context).copyWith(
                      fontSize: 15.sp,
                      color: context.colors.textSecondary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
              SizedBox(height: 16.h),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBiometricButton() {
    return Semantics(
      label: "Barmoq izi yoki Face ID orqali kirish",
      button: true,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: _isVerifying ? null : _tryBiometric,
          borderRadius: BorderRadius.circular(12.r),
          child: Container(
            constraints: BoxConstraints(minHeight: 48.h),
            padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 12.h),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12.r),
              border: Border.all(
                color: design_colors.AppColors.accentGreen
                    .withValues(alpha: 0.4),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.fingerprint,
                  size: 22.sp,
                  color: design_colors.AppColors.accentGreen,
                ),
                SizedBox(width: 8.w),
                Text(
                  "Barmoq izi / Face ID",
                  style: TextStyle(
                    fontSize: 14.sp,
                    fontWeight: FontWeight.w600,
                    color: design_colors.AppColors.accentGreen,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
