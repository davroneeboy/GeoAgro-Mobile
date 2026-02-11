import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:agro_employee_public/design_system/tokens/colors.dart' as DesignColors;
import 'package:agro_employee_public/design_system/tokens/typography.dart';

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
          color: DesignColors.AppColors.darkSurface,
          border: Border.all(color: DesignColors.AppColors.darkBorder),
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
                color: selectedDate != null
                    ? DesignColors.AppColors.darkTextPrimary
                    : DesignColors.AppColors.darkTextSecondary,
              ),
            ),
            Icon(
              Icons.calendar_today,
              color: DesignColors.AppColors.darkTextSecondary,
              size: 24.sp,
            ),
          ],
        ),
      ),
    );
  }
}
