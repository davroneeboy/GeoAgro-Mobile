import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'package:agro_employee_public/design_system/tokens/colors.dart'
    as DesignColors;
import 'package:agro_employee_public/design_system/tokens/spacing.dart';
import 'package:agro_employee_public/design_system/tokens/typography.dart';
import 'package:agro_employee_public/design_system/tokens/radii.dart';

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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          SizedBox(height: 16.h),
          Text(
            label!,
            style: AppTypography.headlineSmall(context).copyWith(
              fontSize: 16.sp,
              color: DesignColors.AppColors.darkTextPrimary,
            ),
          ),
          SizedBox(height: 10.h),
        ],
        DropdownButtonFormField<int>(
          value: selectedValue,
          style: AppTypography.input(context).copyWith(
            fontSize: 14.sp,
            color: DesignColors.AppColors.darkTextPrimary,
          ),
          icon: Icon(
            Icons.keyboard_arrow_down_rounded,
            size: 24.sp,
            color: DesignColors.AppColors.darkTextSecondary,
          ),
          decoration: InputDecoration(
            hintText: hint ?? "Turni tanlang",
            filled: true,
            fillColor: DesignColors.AppColors.darkSurfaceVariant,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.inputPaddingHorizontal,
              vertical: AppSpacing.inputPaddingVertical,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadii.input),
              borderSide: BorderSide(
                color: DesignColors.AppColors.darkBorder,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadii.input),
              borderSide: BorderSide(
                color: DesignColors.AppColors.accentGreen,
                width: 1.6,
              ),
            ),
          ),
          dropdownColor: DesignColors.AppColors.darkSurface,
          borderRadius: BorderRadius.circular(AppRadii.input),
          onChanged: onChanged,
          items: items.entries
              .map(
                (entry) => DropdownMenuItem<int>(
                  value: entry.key,
                  child: Text(
                    entry.value,
                    style: AppTypography.bodyLarge(context).copyWith(
                      fontSize: 14.sp,
                      color: DesignColors.AppColors.darkTextPrimary,
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
