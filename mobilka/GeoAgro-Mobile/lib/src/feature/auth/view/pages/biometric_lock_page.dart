import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:agro_employee_public/design_system/tokens/adaptive_colors.dart';
import 'package:agro_employee_public/design_system/tokens/motion.dart';

import '../../../../core/services/biometric_service.dart';
import '../../../../core/services/pin_service.dart';
import '../../../../core/storage/app_storage.dart';
import '../../../../core/setting/setup.dart' as app_setup;
import '../../../../core/routes/app_route_names.dart';
import '../../../../core/tools/assets.dart';
import '../../../../../design_system/tokens/colors.dart' as design_colors;
import '../../../../../design_system/tokens/typography.dart';
import '../../../../../design_system/tokens/spacing.dart';

/// Экран блокировки, отображается при повторном запуске приложения
/// если пользователь ранее включил биометрическую аутентификацию.
class BiometricLockPage extends StatefulWidget {
  const BiometricLockPage({super.key});

  @override
  State<BiometricLockPage> createState() => _BiometricLockPageState();
}

class _BiometricLockPageState extends State<BiometricLockPage>
    with SingleTickerProviderStateMixin {
  final BiometricService _biometricService = BiometricService.instance;
  bool _isAuthenticating = false;
  String? _errorMessage;
  int _failedAttempts = 0;
  static const int _maxFailedAttempts = 3;

  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: AppMotion.shimmer,
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.1).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    WidgetsBinding.instance
        .addPostFrameCallback((_) => _checkAndAuthenticate());
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  /// Проверяет доступность блокировки перед аутентификацией.
  /// Если пользователь убрал PIN/пароль — отключаем биометрию и пропускаем.
  Future<void> _checkAndAuthenticate() async {
    final availability = await _biometricService.checkAvailability();
    if (!mounted) return;
    switch (availability) {
      case BiometricAvailability.available:
        await _authenticate();
        break;
      case BiometricAvailability.securityRemoved:
      case BiometricAvailability.noSecuritySetup:
        // Блокировка убрана или не была → предлагаем установить PIN
        await _offerPinFallback();
        break;
    }
  }

  /// Предлагает пользователю установить in-app PIN вместо блокировки устройства.
  Future<void> _offerPinFallback() async {
    if (!mounted) return;
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text("Qurilma qulfi topilmadi"),
        content: const Text(
          "Qurilmangizdan qulf (PIN/parol/barmoq izi) olib tashlangan.\n\n"
          "Ilova xavfsizligi uchun 4 raqamli PIN-kod o'rnatishni xohlaysizmi?",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text("O'tkazib yuborish"),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text("PIN o'rnatish"),
          ),
        ],
      ),
    );
    if (!mounted) return;
    if (result == true) {
      // Сбрасываем device-метод и отправляем на установку PIN
      await PinService.instance.clearAuthMethod();
      await _biometricService.setBiometricEnabled(false);
      app_setup.biometricEnabled = false;
      app_setup.authMethod = AuthMethod.none;
      if (!mounted) return;
      context.go(AppRouteNames.pinSetup);
    } else {
      await _disableBiometricAndGoHome(null);
    }
  }

  /// Отключает биометрию и перенаправляет на главную страницу.
  Future<void> _disableBiometricAndGoHome(String? snackBarMessage) async {
    await PinService.instance.clearAuthMethod();
    await _biometricService.setBiometricEnabled(false);
    app_setup.biometricEnabled = false;
    app_setup.authMethod = AuthMethod.none;
    if (!mounted) return;
    if (snackBarMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(snackBarMessage),
          backgroundColor: design_colors.AppColors.error,
          duration: const Duration(seconds: 4),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      );
    }
    context.go(AppRouteNames.home);
  }

  Future<void> _authenticate() async {
    if (_isAuthenticating) return;
    setState(() {
      _isAuthenticating = true;
      _errorMessage = null;
    });

    // Безопасная аутентификация — null означает, что невозможно
    final result = await _biometricService.safeAuthenticate(
      reason: "Ilovaga kirish uchun qurilma qulfini ishlating",
    );

    if (!mounted) return;

    if (result == null) {
      // Аутентификация невозможна (нет блокировки) — отключаем
      await _disableBiometricAndGoHome(
        "Qurilma qulfi mavjud emas. Biometrik qulf o'chirildi.",
      );
      return;
    }

    if (result) {
      // Успешно — идём на главную
      context.go(AppRouteNames.home);
    } else {
      // Не прошёл — увеличиваем счётчик
      _failedAttempts++;
      setState(() {
        _isAuthenticating = false;
        if (_failedAttempts >= _maxFailedAttempts) {
          _errorMessage =
              "Autentifikatsiya $_failedAttempts marta amalga oshmadi";
        } else {
          _errorMessage = "Autentifikatsiya amalga oshmadi";
        }
      });
    }
  }

  Future<void> _logout() async {
    await PinService.instance.clearAuthMethod();
    await _biometricService.setBiometricEnabled(false);
    app_setup.biometricEnabled = false;
    app_setup.authMethod = AuthMethod.none;
    await AppStorage.$deleteSecureTokens();
    if (!mounted) return;
    context.go(AppRouteNames.login);
  }

  /// Пропустить биометрию (доступно после N неудачных попыток).
  Future<void> _skipBiometric() async {
    await PinService.instance.clearAuthMethod();
    await _biometricService.setBiometricEnabled(false);
    app_setup.biometricEnabled = false;
    app_setup.authMethod = AuthMethod.none;
    if (!mounted) return;
    context.go(AppRouteNames.home);
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
          // Column со Spacer-ами не помещалась по высоте на низком
          // landscape-экране (тот же класс overflow-бага, что был на
          // pin_lock_page.dart) — заменена на прокручиваемый контент,
          // центрированный на нормальной высоте через MainAxisAlignment
          // внутри LayoutBuilder-измеренного минимума высоты.
          child: LayoutBuilder(
            builder: (context, constraints) => SingleChildScrollView(
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight),
                child: IntrinsicHeight(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildLogo(),
                      SizedBox(height: 24.h),
                      _buildTitle(),
                      SizedBox(height: 16.h),
                      _buildAuthButton(),
                      SizedBox(height: 20.h),
                      _buildHintText(),
                      if (_errorMessage != null) _buildErrorSection(),
                      SizedBox(height: 16.h),
                      _buildLogoutButton(),
                      SizedBox(height: 24.h),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLogo() {
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: Image.asset(
        Assets.gerbImg,
        semanticLabel: "GeoAgro gerbi",
        height: 100.h,
        fit: BoxFit.contain,
      ),
    );
  }

  Widget _buildTitle() {
    return Column(
      children: [
        Text(
          "GeoAgro",
          style: AppTypography.headline2(context).copyWith(
            fontSize: 28.sp,
            fontWeight: FontWeight.w800,
            color: context.colors.textPrimary,
          ),
        ),
        SizedBox(height: 8.h),
        Text(
          "Ilovaga kirish uchun\nqurilma qulfini ishlating",
          textAlign: TextAlign.center,
          style: AppTypography.bodySmall(context).copyWith(
            fontSize: 15.sp,
            color: context.colors.textSecondary,
            height: 1.5,
          ),
        ),
      ],
    );
  }

  Widget _buildAuthButton() {
    return ScaleTransition(
      scale: _pulseAnimation,
      child: GestureDetector(
        onTap: _isAuthenticating ? null : _authenticate,
        child: Container(
          width: 88.w,
          height: 88.w,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: context.colors.surfaceVariant,
            border: Border.all(
              color: design_colors.AppColors.accentGreen.withValues(alpha: 0.5),
              width: 2,
            ),
            boxShadow: [
              BoxShadow(
                color:
                    design_colors.AppColors.accentGreen.withValues(alpha: 0.15),
                blurRadius: 24,
                spreadRadius: 4,
              ),
            ],
          ),
          child: _isAuthenticating
              ? Center(
                  child: SizedBox(
                    width: 32.w,
                    height: 32.w,
                    child: CircularProgressIndicator(
                      strokeWidth: 3,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        design_colors.AppColors.accentGreen,
                      ),
                    ),
                  ),
                )
              : Icon(
                  Icons.lock_open_rounded,
                  size: 48.sp,
                  color: design_colors.AppColors.accentGreen,
                ),
        ),
      ),
    );
  }

  Widget _buildHintText() {
    return Text(
      _isAuthenticating
          ? "Kutilmoqda..."
          : "Bosing — barmoq izi, PIN yoki parol",
      style: AppTypography.bodySmall(context).copyWith(
        fontSize: 14.sp,
        color: context.colors.textSecondary,
      ),
    );
  }

  Widget _buildErrorSection() {
    return Column(
      children: [
        SizedBox(height: 12.h),
        Text(
          _errorMessage!,
          style: AppTypography.bodySmall(context).copyWith(
            fontSize: 13.sp,
            color: design_colors.AppColors.error,
          ),
        ),
        SizedBox(height: 8.h),
        TextButton(
          onPressed: _authenticate,
          child: Text(
            "Qaytadan urinish",
            style: TextStyle(
              fontSize: 14.sp,
              color: design_colors.AppColors.accentGreen,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        // После N неудачных попыток — кнопка "Пропустить"
        if (_failedAttempts >= _maxFailedAttempts) ...[
          SizedBox(height: 4.h),
          TextButton(
            onPressed: _skipBiometric,
            child: Text(
              "Qulfni o'tkazib yuborish",
              style: TextStyle(
                fontSize: 13.sp,
                color: context.colors.textSecondary,
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildLogoutButton() {
    return Padding(
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
    );
  }
}
