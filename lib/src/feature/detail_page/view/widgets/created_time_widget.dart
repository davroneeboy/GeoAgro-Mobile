import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

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
          color: Colors.white,
          border: Border.all(color: const Color(0x1E1E1E16)),
          borderRadius: BorderRadius.circular(8.r),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              selectedDate != null
                  ? DateFormat('yyyy-MM-dd').format(selectedDate!)
                  : "vaqtni kiriting...",
              style: TextStyle(fontSize: 16.sp),
            ),
            Icon(Icons.calendar_today, color: Colors.grey, size: 24.sp),
          ],
        ),
      ),
    );
  }
}
