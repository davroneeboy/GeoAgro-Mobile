import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/services/biometric_service.dart';
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

  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.1).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    WidgetsBinding.instance.addPostFrameCallback((_) => _checkAndAuthenticate());
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  /// Проверяет доступность блокировки перед аутентификацией.
  /// Если пользователь убрал PIN/пароль — пропускаем экран с предупреждением.
  Future<void> _checkAndAuthenticate() async {
    final availability = await _biometricService.checkAvailability();
    if (!mounted) return;
    switch (availability) {
      case BiometricAvailability.available:
        await _authenticate();
        break;
      case BiometricAvailability.securityRemoved:
        // Пользователь убрал блокировку с устройства — отключаем и пропускаем
        await _biometricService.setBiometricEnabled(false);
        app_setup.biometricEnabled = false;
        if (!mounted) return;
        _showSecurityRemovedSnackBar();
        context.go(AppRouteNames.home);
        break;
      case BiometricAvailability.noSecuritySetup:
        // Устройство не защищено — не должно попасть сюда, но на всякий случай
        await _biometricService.setBiometricEnabled(false);
        app_setup.biometricEnabled = false;
        if (!mounted) return;
        context.go(AppRouteNames.home);
        break;
    }
  }

  void _showSecurityRemovedSnackBar() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text(
          "Qurilma qulfi olib tashlangan. Iltimos, sozlamalarda qulfni qayta o'rnating.",
        ),
        backgroundColor: design_colors.AppColors.error,
        duration: const Duration(seconds: 4),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  Future<void> _authenticate() async {
    if (_isAuthenticating) return;
    setState(() {
      _isAuthenticating = true;
      _errorMessage = null;
    });
    final success = await _biometricService.authenticate(
      reason: "Ilovaga kirish uchun qurilma qulfini ishlating",
    );
    if (!mounted) return;
    if (success) {
      context.go(AppRouteNames.home);
    } else {
      setState(() {
        _isAuthenticating = false;
        _errorMessage = "Autentifikatsiya amalga oshmadi";
      });
    }
  }

  Future<void> _logout() async {
    await _biometricService.setBiometricEnabled(false);
    app_setup.biometricEnabled = false;
    await AppStorage.$deleteSecureTokens();
    if (!mounted) return;
    context.go(AppRouteNames.login);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: design_colors.AppColors.darkBackground,
      body: SafeArea(
        child: Container(
          width: double.infinity,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                design_colors.AppColors.darkBackground,
                design_colors.AppColors.darkSurface,
              ],
            ),
          ),
          child: Column(
            children: [
              const Spacer(flex: 2),
              _buildLogo(),
              SizedBox(height: 24.h),
              _buildTitle(),
              const Spacer(flex: 1),
              _buildAuthButton(),
              SizedBox(height: 20.h),
              _buildHintText(),
              if (_errorMessage != null) _buildErrorSection(),
              const Spacer(flex: 2),
              _buildLogoutButton(),
              SizedBox(height: 24.h),
            ],
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
            color: design_colors.AppColors.darkTextPrimary,
          ),
        ),
        SizedBox(height: 8.h),
        Text(
          "Ilovaga kirish uchun\nqurilma qulfini ishlating",
          textAlign: TextAlign.center,
          style: AppTypography.bodySmall(context).copyWith(
            fontSize: 15.sp,
            color: design_colors.AppColors.darkTextSecondary,
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
            color: design_colors.AppColors.darkSurfaceVariant,
            border: Border.all(
              color: design_colors.AppColors.accentGreen
                  .withValues(alpha: 0.5),
              width: 2,
            ),
            boxShadow: [
              BoxShadow(
                color: design_colors.AppColors.accentGreen
                    .withValues(alpha: 0.15),
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
        color: design_colors.AppColors.darkTextSecondary,
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
            color: design_colors.AppColors.darkTextSecondary,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }
}
