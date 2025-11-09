import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../vm/login_vm.dart';
import '../../../../core/utils/utils.dart';
import '../../../../core/tools/assets.dart';
import '../widgets/modern_login_input_widget.dart';
import '../widgets/modern_login_button.dart';
import '../../../../core/routes/router_config.dart';
import '../../../../core/routes/app_route_names.dart';
import '../../../../../design_system/tokens/colors.dart' as DesignColors;
import '../../../../../design_system/tokens/spacing.dart';
import '../../../../../design_system/tokens/typography.dart';

// Riverpod provider
final loginPageVM = ChangeNotifierProvider.autoDispose<LoginVm>((ref) {
  return LoginVm();
});

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage>
    with TickerProviderStateMixin {
  late AnimationController _fadeController;
  late AnimationController _slideController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  late FocusNode _usernameFocus;
  late FocusNode _passwordFocus;

  @override
  void initState() {
    super.initState();
    _usernameFocus = FocusNode();
    _passwordFocus = FocusNode();

    // Fade animation
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );

    // Slide animation
    _slideController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.1),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _slideController,
      curve: Curves.easeOutCubic,
    ));

    // Start animations
    _fadeController.forward();
    _slideController.forward();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _slideController.dispose();
    _usernameFocus.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  Future<void> _openTelegramBot() async {
    final telegramUrls = [
      'tg://resolve?domain=geoagro_bot',
      'https://t.me/geoagro_bot',
      'intent://t.me/geoagro_bot#Intent;scheme=tg;package=org.telegram.messenger;end',
      'intent://t.me/geoagro_bot#Intent;scheme=tg;package=org.telegram.plus;end',
    ];

    bool success = false;

    for (final url in telegramUrls) {
      try {
        final uri = Uri.parse(url);
        if (await canLaunchUrl(uri)) {
          await launchUrl(
            uri,
            mode: LaunchMode.externalApplication,
            webViewConfiguration: const WebViewConfiguration(
              enableJavaScript: false,
              enableDomStorage: false,
            ),
          );
          success = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text("Telegram botni ochishda xatolik yuz berdi"),
          backgroundColor: DesignColors.AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    LoginVm vm = ref.watch(loginPageVM);
    final loginVmNotifier = ref.read(loginPageVM.notifier);

    return Scaffold(
      backgroundColor: DesignColors.AppColors.darkBackground,
      body: SafeArea(
        child: Stack(
          children: [
            // Background gradient
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    DesignColors.AppColors.darkBackground,
                    DesignColors.AppColors.darkSurface,
                  ],
                ),
              ),
            ),
            // Main content
            FadeTransition(
              opacity: _fadeAnimation,
              child: SlideTransition(
                position: _slideAnimation,
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: Padding(
                    padding: EdgeInsets.symmetric(
                      horizontal: AppSpacing.xl,
                      vertical: AppSpacing.xxl,
                    ),
                    child: Form(
                      key: vm.formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          SizedBox(height: 20.h),
                          // Logo section
                          _buildLogoSection(),
                          SizedBox(height: 48.h),
                          // Title section
                          _buildTitleSection(),
                          SizedBox(height: 48.h),
                          // Form fields
                          _buildFormFields(vm, loginVmNotifier),
                          SizedBox(height: 32.h),
                          // Login button
                          _buildLoginButton(vm, loginVmNotifier),
                          SizedBox(height: 24.h),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
            // Help button
            _buildHelpButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildLogoSection() {
    return Column(
      children: [
        // Logo with subtle shadow
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: Image.asset(
              Assets.gerbImg,
              height: 120.h,
              fit: BoxFit.contain,
            ),
          ),
        ),
        SizedBox(height: 20.h),
        // Agency name
        Text(
          "Qishloq xo'jaligi vazirligi\nhuzuridagi",
          textAlign: TextAlign.center,
          style: AppTypography.bodySmall(context).copyWith(
            fontSize: 13.sp,
            fontWeight: FontWeight.w500,
            color: DesignColors.AppColors.darkTextSecondary,
            height: 1.5,
            letterSpacing: 0.2,
          ),
        ),
        SizedBox(height: 4.h),
        Text(
          "Agrosanoatni rivojlantirish agentligi",
          textAlign: TextAlign.center,
          style: AppTypography.title(context).copyWith(
            fontSize: 16.sp,
            fontWeight: FontWeight.w700,
            color: DesignColors.AppColors.darkTextPrimary,
            height: 1.4,
          ),
        ),
      ],
    );
  }

  Widget _buildTitleSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Tizimga Kirish",
          style: AppTypography.headline2(context).copyWith(
            fontSize: 32.sp,
            fontWeight: FontWeight.w800,
            color: DesignColors.AppColors.darkTextPrimary,
            height: 1.2,
            letterSpacing: -0.5,
          ),
        ),
        SizedBox(height: 8.h),
        Text(
          "Davom etish uchun ma'lumotlaringizni kiriting",
          style: AppTypography.bodySmall(context).copyWith(
            fontSize: 15.sp,
            color: DesignColors.AppColors.darkTextSecondary,
            height: 1.4,
          ),
        ),
      ],
    );
  }

  Widget _buildFormFields(LoginVm vm, LoginVm loginVmNotifier) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Username field
        ModernLoginInputWidget(
          label: "Foydalanuvchi nomi",
          hintText: "Username",
          controller: vm.userNameC,
          focusNode: _usernameFocus,
          textInputAction: TextInputAction.next,
          onSubmitted: () {
            _usernameFocus.unfocus();
            FocusScope.of(context).requestFocus(_passwordFocus);
          },
          validator: (value) {
            if (value == null || value.isEmpty) {
              return "Foydalanuvchi nomi kiritilishi shart";
            }
            return null;
          },
        ),
        SizedBox(height: 24.h),
        // Password field
        ModernLoginInputWidget(
          label: "Parol",
          hintText: "Password",
          controller: vm.passwordC,
          focusNode: _passwordFocus,
          obscureText: true,
          textInputAction: TextInputAction.done,
          onSubmitted: () {
            _passwordFocus.unfocus();
            if (vm.formKey.currentState!.validate()) {
              loginVmNotifier.login();
            }
          },
          validator: (value) {
            if (value == null || value.isEmpty) {
              return "Parol kiritilishi shart";
            }
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildLoginButton(LoginVm vm, LoginVm loginVmNotifier) {
    return ModernLoginButton(
      text: "Kirish",
      isLoading: vm.isLoading,
      isEnabled: !vm.isLoading,
      onPressed: () async {
        FocusScope.of(context).unfocus();
        if (vm.formKey.currentState!.validate()) {
          final isSuccess = await loginVmNotifier.login();
          if (isSuccess && mounted) {
            Utils.fireTopSnackBar(
              "Muvoffaqiyatli Tizimga Kirildi",
              DesignColors.AppColors.success,
              context,
            );
            RouterConfigService.router.go(AppRouteNames.home);
          } else if (mounted) {
            Utils.fireTopSnackBar(
              vm.errorMessage ?? "Xatolik yuz berdi",
              DesignColors.AppColors.error,
              context,
            );
          }
        } else {
          Utils.fireTopSnackBar(
            "Iltimos, ma'lumotlarni to'g'ri kiriting.",
            DesignColors.AppColors.error,
            context,
          );
        }
      },
    );
  }

  Widget _buildHelpButton() {
    return Positioned(
      top: 0,
      right: 0,
      child: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(16.w),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: _openTelegramBot,
              borderRadius: BorderRadius.circular(20.r),
              child: Container(
                width: 44.w,
                height: 44.h,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.08),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Icon(
                  Icons.help_outline_rounded,
                  size: 22.sp,
                  color: DesignColors.AppColors.accentGreen,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
