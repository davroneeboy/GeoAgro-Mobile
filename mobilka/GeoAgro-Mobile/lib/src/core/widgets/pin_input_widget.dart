import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:agro_employee_public/design_system/tokens/adaptive_colors.dart';
import 'package:agro_employee_public/design_system/tokens/motion.dart';
import 'package:agro_employee_public/design_system/tokens/typography.dart';
import 'package:agro_employee_public/design_system/tokens/colors.dart'
    as design_colors;

/// PIN keypad with dot indicators, optional biometric trigger in the
/// bottom-left key slot, and a shake animation on error.
class PinInputWidget extends StatefulWidget {
  final int pinLength;
  final int currentLength;
  final ValueChanged<String> onDigitPressed;
  final VoidCallback onBackspace;
  final String? errorMessage;
  final bool isLoading;

  /// When non-null, the bottom-left key slot becomes a biometric tap.
  final VoidCallback? onBiometricPressed;
  final bool biometricEnabled;

  /// When true the whole keypad is dimmed and ignores taps. The dots and
  /// error message keep rendering so the lockout countdown is visible.
  final bool keypadDisabled;

  const PinInputWidget({
    super.key,
    this.pinLength = 4,
    required this.currentLength,
    required this.onDigitPressed,
    required this.onBackspace,
    this.errorMessage,
    this.isLoading = false,
    this.onBiometricPressed,
    this.biometricEnabled = false,
    this.keypadDisabled = false,
  });

  @override
  State<PinInputWidget> createState() => _PinInputWidgetState();
}

class _PinInputWidgetState extends State<PinInputWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _shake;
  late final Animation<double> _shakeAnim;

  @override
  void initState() {
    super.initState();
    _shake = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 380),
    );
    _shakeAnim = CurvedAnimation(parent: _shake, curve: Curves.elasticOut);
  }

  @override
  void didUpdateWidget(covariant PinInputWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.errorMessage != null &&
        widget.errorMessage != oldWidget.errorMessage) {
      HapticFeedback.heavyImpact();
      _shake.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _shake.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        AnimatedBuilder(
          animation: _shakeAnim,
          builder: (context, child) {
            final t = _shakeAnim.value;
            final dx = 12 * (1 - t) * (t < 0.5 ? 1 : -1);
            return Transform.translate(
              offset: Offset(dx, 0),
              child: child,
            );
          },
          child: _buildDots(context),
        ),
        SizedBox(height: 12.h),
        SizedBox(
          height: 28.h,
          child: AnimatedSwitcher(
            duration: AppMotion.fast,
            child: widget.isLoading
                ? SizedBox(
                    key: const ValueKey('loading'),
                    width: 22.w,
                    height: 22.w,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        design_colors.AppColors.accentGreen,
                      ),
                    ),
                  )
                : widget.errorMessage != null
                    ? Text(
                        widget.errorMessage!,
                        key: ValueKey(widget.errorMessage),
                        style: AppTypography.bodySmall(context).copyWith(
                          fontSize: 13.sp,
                          color: design_colors.AppColors.error,
                          fontWeight: FontWeight.w500,
                        ),
                        textAlign: TextAlign.center,
                      )
                    : const SizedBox.shrink(key: ValueKey('empty')),
          ),
        ),
        SizedBox(height: 8.h),
        _buildKeypad(context),
      ],
    );
  }

  Widget _buildDots(BuildContext context) {
    return Semantics(
      label: "${widget.currentLength} / ${widget.pinLength} raqam kiritildi",
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(widget.pinLength, (index) {
          final isFilled = index < widget.currentLength;
          final hasError = widget.errorMessage != null;
          return AnimatedContainer(
            duration: AppMotion.fast,
            margin: EdgeInsets.symmetric(horizontal: 12.w),
            width: 18.w,
            height: 18.w,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isFilled
                  ? (hasError
                      ? design_colors.AppColors.error
                      : design_colors.AppColors.accentGreen)
                  : Colors.transparent,
              border: Border.all(
                color: hasError
                    ? design_colors.AppColors.error
                    : (isFilled
                        ? design_colors.AppColors.accentGreen
                        : context.colors.textSecondary.withValues(alpha: 0.4)),
                width: 1.8,
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildKeypad(BuildContext context) {
    final digits = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['bio', '0', 'back'],
    ];

    return Column(
      children: digits.map((row) {
        return Padding(
          padding: EdgeInsets.symmetric(vertical: 6.h),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: row.map((digit) {
              if (digit == 'bio') {
                if (widget.onBiometricPressed != null &&
                    widget.biometricEnabled) {
                  return Semantics(
                    label: "Barmoq izi yoki Face ID",
                    button: true,
                    child: _buildKeyButton(
                      context,
                      child: Icon(
                        Icons.fingerprint,
                        size: 28.sp,
                        color: design_colors.AppColors.accentGreen,
                      ),
                      onTap: () {
                        HapticFeedback.selectionClick();
                        widget.onBiometricPressed!();
                      },
                      borderless: true,
                    ),
                  );
                }
                return SizedBox(width: 80.w, height: 64.h);
              }
              if (digit == 'back') {
                return Semantics(
                  label: "O'chirish",
                  button: true,
                  child: _buildKeyButton(
                    context,
                    child: Icon(
                      Icons.backspace_outlined,
                      size: 22.sp,
                      color: context.colors.textPrimary,
                    ),
                    onTap: widget.onBackspace,
                    borderless: true,
                  ),
                );
              }
              return Semantics(
                label: digit,
                button: true,
                child: _buildKeyButton(
                  context,
                  child: Text(
                    digit,
                    style: TextStyle(
                      fontSize: 28.sp,
                      fontWeight: FontWeight.w500,
                      color: context.colors.textPrimary,
                    ),
                  ),
                  onTap: () => widget.onDigitPressed(digit),
                ),
              );
            }).toList(),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildKeyButton(
    BuildContext context, {
    required Widget child,
    required VoidCallback onTap,
    bool borderless = false,
  }) {
    final disabled = widget.isLoading || widget.keypadDisabled;
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 12.w),
      child: Opacity(
        opacity: disabled ? 0.35 : 1,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: disabled
                ? null
                : () {
                    HapticFeedback.lightImpact();
                    onTap();
                  },
            borderRadius: BorderRadius.circular(40.r),
            child: Container(
              width: 64.w,
              height: 64.h,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: borderless
                    ? null
                    : Border.all(
                        color: context.colors.border.withValues(alpha: 0.3),
                      ),
              ),
              child: child,
            ),
          ),
        ),
      ),
    );
  }
}
