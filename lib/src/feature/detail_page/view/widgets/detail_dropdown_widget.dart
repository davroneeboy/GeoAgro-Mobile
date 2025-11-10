import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'package:agro_employee_public/design_system/theme/colors.dart'
    as DesignColors;
import 'package:agro_employee_public/design_system/theme/spacing.dart';
import 'package:agro_employee_public/design_system/theme/typography.dart';
import 'package:agro_employee_public/design_system/theme/radius.dart';

class DropdownWithLabel extends StatelessWidget {
  final String? label;
  final String? hint;
  final Map<int, String> items;
  final int? selectedValue;
  final void Function(int?) onChanged;

  const DropdownWithLabel({
    super.key,
    this.label,
    this.hint,
    required this.items,
    required this.selectedValue,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          SizedBox(height: 16.h),
          Text(
            label!,
            style: AppTypography.headlineSmall(context).copyWith(
              fontSize: 16.sp,
            ),
          ),
          SizedBox(height: 10.h),
        ],
        DropdownButtonFormField<int>(
          value: selectedValue,
          style: AppTypography.input(context).copyWith(fontSize: 14.sp),
          icon: Icon(
            Icons.keyboard_arrow_down_rounded,
            size: 24.sp,
            color: colorScheme.onSurfaceVariant,
          ),
          decoration: InputDecoration(
            hintText: hint ?? "Turni tanlang",
            filled: true,
            fillColor: colorScheme.surfaceVariant,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.inputPaddingHorizontal,
              vertical: AppSpacing.inputPaddingVertical,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.input),
              borderSide: BorderSide(
                color: colorScheme.outlineVariant ?? colorScheme.outline,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.input),
              borderSide: const BorderSide(
                color: DesignColors.AppColors.primary,
                width: 1.6,
              ),
            ),
          ),
          dropdownColor: colorScheme.surface,
          borderRadius: BorderRadius.circular(AppRadius.input),
          onChanged: onChanged,
          items: items.entries
              .map(
                (entry) => DropdownMenuItem<int>(
                  value: entry.key,
                  child: Text(
                    entry.value,
                    style: AppTypography.bodyLarge(context).copyWith(
                      fontSize: 14.sp,
                      color: colorScheme.onSurface,
                    ),
                  ),
                ),
              )
              .toList(),
        ),
        SizedBox(height: AppSpacing.formFieldGap.h),
      ],
    );
  }
}
