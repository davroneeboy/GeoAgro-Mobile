import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'package:agro_employee_public/design_system/theme/colors.dart'
    as DesignColors;
import 'package:agro_employee_public/design_system/theme/typography.dart';

class ProductivityIndicator extends StatelessWidget {
  final double value;
  final ValueChanged<double> onChanged;

  const ProductivityIndicator({
    super.key,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Banitet bali: ${value.toStringAsFixed(0)}",
          style: AppTypography.headlineSmall(context).copyWith(
            fontSize: 16.sp,
          ),
        ),
        Row(
          children: [
            Expanded(
              child: SliderTheme(
                data: SliderTheme.of(context).copyWith(
                  activeTrackColor: DesignColors.AppColors.primary,
                  inactiveTrackColor: theme.colorScheme.outlineVariant ??
                      theme.colorScheme.outline,
                  thumbColor: DesignColors.AppColors.primary,
                  overlayColor:
                      DesignColors.AppColors.primary.withOpacity(0.12),
                  trackHeight: 4,
                ),
                child: Slider(
                  value: value,
                  min: 1,
                  max: 100,
                  divisions: 100,
                  label: value.toStringAsFixed(0),
                  onChanged: onChanged,
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: 10.h),
      ],
    );
  }
}
