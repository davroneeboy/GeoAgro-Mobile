import 'package:agro_employee_public/src/core/style/app_colors.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:agro_employee_public/design_system/theme/colors.dart' as DesignColors;
import 'package:agro_employee_public/design_system/theme/typography.dart';

class CustomSwitchCard extends StatelessWidget {
  final String label;
  final bool switchValue;
  final Function(bool) onChanged;
  final List<Widget> childWidgets;

  const CustomSwitchCard({
    super.key,
    required this.label,
    required this.switchValue,
    required this.onChanged,
    this.childWidgets = const [],
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final backgroundColor = isDark
        ? DesignColors.AppColors.darkSurface
        : AppColors.white;
    final borderColor = isDark
        ? DesignColors.AppColors.darkOutline
        : Colors.grey;
    final textColor = isDark
        ? DesignColors.AppColors.darkOnSurface
        : Colors.black;
    
    return Column(
      children: [
        Container(
          padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: backgroundColor,
            border: Border.all(color: borderColor, width: 1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  style: AppTypography.bodyLarge(context).copyWith(
                    fontSize: 16.sp,
                    fontWeight: FontWeight.w500,
                    color: textColor,
                  ),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 2,
                ),
              ),
              Switch(
                value: switchValue,
                onChanged: onChanged,
                activeColor: DesignColors.AppColors.primary,
                activeTrackColor: DesignColors.AppColors.primary.withOpacity(0.5),
                inactiveThumbColor: isDark
                    ? DesignColors.AppColors.darkOnSurfaceVariant
                    : Colors.grey.shade400,
                inactiveTrackColor: isDark
                    ? DesignColors.AppColors.darkSurfaceVariant
                    : Colors.grey.shade300,
              ),
            ],
          ),
        ),
        if (switchValue) ...childWidgets,
      ],
    );
  }
}
