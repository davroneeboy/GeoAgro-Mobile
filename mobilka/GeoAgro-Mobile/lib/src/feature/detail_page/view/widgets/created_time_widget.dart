import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:agro_employee_public/design_system/theme/colors.dart' as DesignColors;
import 'package:agro_employee_public/design_system/theme/typography.dart';

class CreatedTime extends StatelessWidget {
  final DateTime? selectedDate;
  final void Function(DateTime) setSelectedDate;

  const CreatedTime({
    super.key,
    required this.selectedDate,
    required this.setSelectedDate,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final backgroundColor = isDark
        ? DesignColors.AppColors.darkSurface
        : Colors.white;
    final borderColor = isDark
        ? DesignColors.AppColors.darkOutline
        : const Color(0x1E1E1E16);
    final textColor = isDark
        ? DesignColors.AppColors.darkOnSurface
        : Colors.black;
    final hintColor = isDark
        ? DesignColors.AppColors.darkOnSurfaceVariant
        : Colors.grey;
    
    return GestureDetector(
      onTap: () async {
        final today = DateTime.now();
        final initialDate = selectedDate ?? today;
        final lastDate = today; // Ограничиваем до сегодняшнего дня
        final adjustedInitialDate =
            initialDate.isAfter(lastDate) ? lastDate : initialDate;
        final pickedDate = await showDatePicker(
          context: context,
          initialDate: adjustedInitialDate,
          firstDate: DateTime(1900),
          lastDate: lastDate,
        );
        if (pickedDate != null) {
          setSelectedDate(pickedDate);
        }
      },
      child: Container(
        padding: REdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: backgroundColor,
          border: Border.all(color: borderColor),
          borderRadius: BorderRadius.circular(8.r),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              selectedDate != null
                  ? DateFormat('yyyy-MM-dd').format(selectedDate!)
                  : "vaqtni kiriting...",
              style: AppTypography.bodyLarge(context).copyWith(
                fontSize: 16.sp,
                color: selectedDate != null ? textColor : hintColor,
              ),
            ),
            Icon(
              Icons.calendar_today,
              color: hintColor,
              size: 24.sp,
            ),
          ],
        ),
      ),
    );
  }
}
