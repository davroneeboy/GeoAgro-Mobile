import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:agro_employee_public/design_system/tokens/adaptive_colors.dart';
import 'package:agro_employee_public/design_system/tokens/motion.dart';
import 'package:agro_employee_public/design_system/tokens/typography.dart';
import 'package:agro_employee_public/design_system/tokens/colors.dart'
    as design_colors;

/// Виджет ввода PIN-кода с цифровой клавиатурой и точками-индикаторами.
class PinInputWidget extends StatelessWidget {
  final int pinLength;
  final int currentLength;
  final ValueChanged<String> onDigitPressed;
  final VoidCallback onBackspace;
  final String? errorMessage;
  final bool isLoading;

  const PinInputWidget({
    super.key,
    this.pinLength = 4,
    required this.currentLength,
    required this.onDigitPressed,
    required this.onBackspace,
    this.errorMessage,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Индикаторы (точки)
        _buildDots(context),
        SizedBox(height: 12.h),
        // Сообщение об ошибке
        if (errorMessage != null)
          Padding(
            padding: EdgeInsets.only(bottom: 16.h),
            child: Text(
              errorMessage!,
              style: AppTypography.bodySmall(context).copyWith(
                fontSize: 13.sp,
                color: design_colors.AppColors.error,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        if (isLoading)
          Padding(
            padding: EdgeInsets.only(bottom: 16.h),
            child: SizedBox(
              width: 24.w,
              height: 24.w,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(
                  design_colors.AppColors.accentGreen,
                ),
              ),
            ),
          ),
        // Цифровая клавиатура
        _buildKeypad(context),
      ],
    );
  }

  Widget _buildDots(BuildContext context) {
    return Semantics(
      label: "$currentLength / $pinLength raqam kiritildi",
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(pinLength, (index) {
          final isFilled = index < currentLength;
          final hasError = errorMessage != null;
          return AnimatedContainer(
            duration: AppMotion.fast,
            margin: EdgeInsets.symmetric(horizontal: 10.w),
            width: 16.w,
            height: 16.w,
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
                        : context.colors.textSecondary),
                width: 2,
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
      ['', '0', 'back'],
    ];

    return Column(
      children: digits.map((row) {
        return Padding(
          padding: EdgeInsets.symmetric(vertical: 6.h),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: row.map((digit) {
              if (digit.isEmpty) {
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
                      size: 24.sp,
                      color: context.colors.textPrimary,
                    ),
                    onTap: onBackspace,
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
                  onTap: () => onDigitPressed(digit),
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
  }) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 12.w),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isLoading
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
              border: Border.all(
                color: context.colors.border.withValues(alpha: 0.3),
              ),
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}
