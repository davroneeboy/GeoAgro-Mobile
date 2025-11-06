import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/style/app_colors.dart';

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
            style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w500),
          ),
          SizedBox(height: 10.h),
        ],
        Container(
          padding: REdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(8.r),
            border: Border.all(color: AppColors.c1E1E1E16),
          ),
          child: DropdownButton<int>(
            dropdownColor: AppColors.cF7F7F7,
            value: selectedValue,
            hint: Text(
              selectedValue != null
                  ? items[selectedValue!]!
                  : (hint ?? "Turni tanlang"),
              style: TextStyle(color: Colors.grey, fontSize: 14.sp),
            ),
            isExpanded: true,
            underline: const SizedBox(),
            icon: Icon(Icons.keyboard_arrow_down_rounded,
                size: 24.sp, color: Colors.grey),
            onChanged: onChanged,
            items: items.entries.map((entry) {
              return DropdownMenuItem<int>(
                value: entry.key,
                child: Text(
                  entry.value,
                  style: TextStyle(fontSize: 14.sp, color: Colors.black),
                ),
              );
            }).toList(),
          ),
        ),
        SizedBox(height: 16.h),
      ],
    );
  }
}
