import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:agro_employee_public/design_system/tokens/adaptive_colors.dart';
import 'package:agro_employee_public/design_system/tokens/typography.dart';
import '../../../../core/services/pin_service.dart';
import '../../../../core/services/biometric_service.dart';
import '../../../../core/routes/app_route_names.dart';
import '../../../../core/setting/setup.dart' as app_setup;
import '../../../../core/tools/assets.dart';
import '../../../../core/widgets/pin_input_widget.dart';

/// Экран обязательной установки PIN-кода.
///
/// Флоу:
/// 1. Ввод 4-значного PIN
/// 2. Подтверждение PIN
/// 3. Если устройство поддерживает биометрию — предложение использовать её
/// 4. Переход на главную
class PinSetupPage extends StatefulWidget {
  const PinSetupPage({super.key});

  @override
  State<PinSetupPage> createState() => _PinSetupPageState();
}

class _PinSetupPageState extends State<PinSetupPage> {
  final PinService _pinService = PinService.instance;
  final BiometricService _biometricService = BiometricService.instance;

  String _enteredPin = '';
  String _firstPin = '';
  bool _isConfirmStep = false;
  String? _errorMessage;

  void _onDigitPressed(String digit) {
    if (_enteredPin.length >= PinService.pinLength) return;
    setState(() {
      _enteredPin += digit;
      _errorMessage = null;
    });
    if (_enteredPin.length == PinService.pinLength) {
      _handlePinComplete();
    }
  }

  void _onBackspace() {
    if (_enteredPin.isEmpty) return;
    setState(() {
      _enteredPin = _enteredPin.substring(0, _enteredPin.length - 1);
      _errorMessage = null;
    });
  }

  Future<void> _handlePinComplete() async {
    if (!_isConfirmStep) {
      // Шаг 1: запоминаем первый ввод → переходим к подтверждению
      setState(() {
        _firstPin = _enteredPin;
        _enteredPin = '';
        _isConfirmStep = true;
      });
    } else {
      // Шаг 2: подтверждение
      if (_enteredPin == _firstPin) {
        // PIN совпал — сохраняем
        await _pinService.setPin(_enteredPin);
        await _pinService.setAuthMethod(AuthMethod.appPin);
        app_setup.appPinSet = true;
        app_setup.authMethod = AuthMethod.appPin;
        if (!mounted) return;
        // Шаг 3: предлагаем биометрию
        await _offerBiometric();
      } else {
        // Не совпал — начинаем заново
        setState(() {
          _enteredPin = '';
          _errorMessage = "PIN mos kelmadi. Qaytadan kiriting";
          _isConfirmStep = false;
          _firstPin = '';
        });
      }
    }
  }

  /// После установки PIN — предлагаем включить биометрию (если есть).
  Future<void> _offerBiometric() async {
    final isAvailable = await _biometricService.isBiometricAvailable();
    if (!mounted) return;

    if (isAvailable) {
      // Есть Touch ID / Face ID / PIN устройства — спрашиваем
      final wantsBiometric = await showDialog<bool>(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          title: const Text("Tez kirish"),
          content: const Text(
            "Barmoq izi yoki yuz tanish orqali ilovaga tez kirmoqchimisiz?\n\n"
            "Agar tanlamasangiz, har safar PIN-kod kiritishingiz kerak bo'ladi.",
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text("Yo'q, faqat PIN"),
            ),
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text("Ha, yoqish"),
            ),
          ],
        ),
      );
      if (!mounted) return;

      if (wantsBiometric == true) {
        // Пробная аутентификация — убеждаемся, что работает
        final testResult = await _biometricService.authenticate(
          reason: "Biometrik tez kirishni tekshirish",
        );
        if (testResult) {
          await _biometricService.setBiometricEnabled(true);
          app_setup.biometricEnabled = true;
          debugPrint("PinSetup: биометрия включена");
        }
      }
    }

    // В любом случае идём домой
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
          child: Column(
            children: [
              const Spacer(flex: 1),
              // Логотип
              ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: Image.asset(
                  Assets.gerbImg,
                  semanticLabel: "GeoAgro gerbi",
                  height: 72.h,
                  fit: BoxFit.contain,
                ),
              ),
              SizedBox(height: 20.h),
              // Заголовок
              Text(
                _isConfirmStep ? "PIN-kodni tasdiqlang" : "PIN-kod o'rnating",
                style: AppTypography.headline2(context).copyWith(
                  fontSize: 22.sp,
                  fontWeight: FontWeight.w700,
                  color: context.colors.textPrimary,
                ),
              ),
              SizedBox(height: 8.h),
              Text(
                _isConfirmStep
                    ? "PIN-kodni qaytadan kiriting"
                    : "Ilova xavfsizligi uchun 4 raqamli\nPIN-kod yarating",
                textAlign: TextAlign.center,
                style: AppTypography.bodySmall(context).copyWith(
                  fontSize: 14.sp,
                  color: context.colors.textSecondary,
                  height: 1.4,
                ),
              ),
              SizedBox(height: 32.h),
              // Ввод PIN
              PinInputWidget(
                pinLength: PinService.pinLength,
                currentLength: _enteredPin.length,
                onDigitPressed: _onDigitPressed,
                onBackspace: _onBackspace,
                errorMessage: _errorMessage,
              ),
              const Spacer(flex: 2),
              SizedBox(height: 16.h),
            ],
          ),
        ),
      ),
    );
  }
}
