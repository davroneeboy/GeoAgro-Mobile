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

    // Автоматически запускаем аутентификацию при открытии
    WidgetsBinding.instance.addPostFrameCallback((_) => _authenticate());
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
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
    // Очищаем токены и флаг биометрии, чтобы не попасть в петлю
    await _biometricService.setBiometricEnabled(false);
    app_setup.biometricEnabled = false; // Синхронизируем глобальную переменную
    await AppStorage.$delete(key: StorageKey.accessToken);
    await AppStorage.$delete(key: StorageKey.refreshToken);
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

              // Лого
              ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: Image.asset(
                  Assets.gerbImg,
                  height: 100.h,
                  fit: BoxFit.contain,
                ),
              ),
              SizedBox(height: 24.h),

              // Название
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

              const Spacer(flex: 1),

              // Кнопка биометрии с пульсацией
              ScaleTransition(
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
                            .withOpacity(0.5),
                        width: 2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: design_colors.AppColors.accentGreen
                              .withOpacity(0.15),
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
              ),

              SizedBox(height: 20.h),

              // Текст подсказки
              Text(
                _isAuthenticating
                    ? "Kutilmoqda..."
                    : "Bosing — barmoq izi, PIN yoki parol",
                style: AppTypography.bodySmall(context).copyWith(
                  fontSize: 14.sp,
                  color: design_colors.AppColors.darkTextSecondary,
                ),
              ),

              // Ошибка
              if (_errorMessage != null) ...[
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

              const Spacer(flex: 2),

              // Кнопка "Войти с паролем" (переход на логин)
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
                      color: design_colors.AppColors.darkTextSecondary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
              SizedBox(height: 24.h),
            ],
          ),
        ),
      ),
    );
  }
}
