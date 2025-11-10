import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'package:agro_employee_public/design_system/tokens/colors.dart'
    as DesignColors;
import 'package:agro_employee_public/design_system/theme/radius.dart';
import 'package:agro_employee_public/design_system/theme/spacing.dart';
import 'package:agro_employee_public/design_system/theme/typography.dart';

class CustomTextFieldWithLabel extends StatelessWidget {
  final String? label;
  final TextEditingController controller;
  final ValueChanged<String> onTextChanged;
  final String hintText;
  final TextInputType? keyboardType;
  final List<TextInputFormatter>? inputFormatters;

  const CustomTextFieldWithLabel({
    super.key,
    this.label,
    required this.controller,
    required this.onTextChanged,
    required this.hintText,
    this.keyboardType,
    this.inputFormatters,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;
    final fillColor = isDark
        ? DesignColors.AppColors.darkSurfaceVariant
        : colorScheme.surfaceVariant;
    final outlineColor = isDark
        ? DesignColors.AppColors.darkBorder
        : colorScheme.outlineVariant ?? colorScheme.outline;
    final hintColor = isDark
        ? DesignColors.AppColors.darkTextTertiary
        : colorScheme.onSurfaceVariant;
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
              ),
            ),
          ),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          inputFormatters: inputFormatters,
          style: AppTypography.input(context).copyWith(fontSize: 14.sp),
          decoration: InputDecoration(
            hintText: hintText,
            filled: true,
            fillColor: fillColor,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.inputPaddingHorizontal,
              vertical: AppSpacing.inputPaddingVertical,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.input),
              borderSide: BorderSide(
                color: outlineColor,
                width: 1.2,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.input),
              borderSide: BorderSide(
                color: isDark
                    ? DesignColors.AppColors.accentGreen
                    : colorScheme.primary,
                width: 1.6,
              ),
            ),
            hintStyle: AppTypography.bodyMedium(context).copyWith(
              fontSize: 14.sp,
              color: hintColor,
            ),
          ),
          onChanged: onTextChanged,
        ),
        SizedBox(height: AppSpacing.formFieldGap.h),
      ],
    );
  }
}
