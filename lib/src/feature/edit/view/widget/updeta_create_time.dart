import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:agro_employee_public/design_system/theme/colors.dart' as DesignColors;
import 'package:agro_employee_public/design_system/theme/typography.dart';

class UpdetaCreateTime extends StatelessWidget {
  final DateTime? serverDate;
  final void Function(DateTime) setSelectedDate;
  final ValueNotifier<DateTime?> _selectedDateNotifier;

  UpdetaCreateTime({
    super.key,
    required this.serverDate,
    required this.setSelectedDate,
  }) : _selectedDateNotifier = ValueNotifier(serverDate);

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
        final initialDate = _selectedDateNotifier.value ?? today;

        final pickedDate = await showDatePicker(
          context: context,
          initialDate: initialDate,
          firstDate: DateTime(1900),
          lastDate: DateTime.now(), // Ограничиваем до сегодняшнего дня
        );

        if (pickedDate != null) {
          _selectedDateNotifier.value = pickedDate;
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
        child: ValueListenableBuilder<DateTime?>(
          valueListenable: _selectedDateNotifier,
          builder: (context, selectedDate, _) {
            return Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  selectedDate != null
                      ? DateFormat('yyyy-MM-dd').format(selectedDate)
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
            );
          },
        ),
      ),
    );
  }
}