import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'package:agro_employee_public/design_system/tokens/colors.dart'
    as design_colors;
import 'package:agro_employee_public/design_system/tokens/adaptive_colors.dart';
import 'package:agro_employee_public/design_system/tokens/radii.dart';
import 'package:agro_employee_public/design_system/tokens/spacing.dart';
import 'package:agro_employee_public/design_system/tokens/typography.dart';

class CustomTextFieldWithLabel extends StatelessWidget {
  final String? label;
  final TextEditingController controller;
  final ValueChanged<String> onTextChanged;
  final String hintText;
  final TextInputType? keyboardType;
  final List<TextInputFormatter>? inputFormatters;
  final String? suffixText;

  const CustomTextFieldWithLabel({
    super.key,
    this.label,
    required this.controller,
    required this.onTextChanged,
    required this.hintText,
    this.keyboardType,
    this.inputFormatters,
    this.suffixText,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null)
          Padding(
            padding: REdgeInsets.only(bottom: 8.h),
            child: Text(
              label!,
              style: AppTypography.headlineSmall(context).copyWith(
                fontSize: 16.sp,
                color: context.colors.textPrimary,
              ),
            ),
          ),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          inputFormatters: inputFormatters,
          style: AppTypography.input(context).copyWith(
            fontSize: 14.sp,
            color: context.colors.textPrimary,
          ),
          decoration: InputDecoration(
            hintText: hintText,
            filled: true,
            fillColor: context.colors.surfaceVariant,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.inputPaddingHorizontal,
              vertical: AppSpacing.inputPaddingVertical,
            ),
            suffixText: suffixText,
            suffixStyle: AppTypography.bodyLarge(context).copyWith(
              fontSize: 14.sp,
              color: design_colors.AppColors.darkTextSecondary,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadii.input),
              borderSide: BorderSide(
                color: context.colors.isDark
                    ? context.colors.border
                    : context.colors.border.withValues(alpha: 0.5),
                width: 1.2,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadii.input),
              borderSide: BorderSide(
                color: design_colors.AppColors.accentGreen,
                width: 1.6,
              ),
            ),
            hintStyle: AppTypography.bodySmall(context).copyWith(
              fontSize: 14.sp,
              color: context.colors.textTertiary,
            ),
          ),
          onChanged: onTextChanged,
        ),
        SizedBox(height: AppSpacing.formFieldGap.h),
      ],
    );
  }
}
