import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../../core/style/app_colors.dart';

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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null)
          Padding(
            padding: REdgeInsets.only(bottom: 8.h),
            child: Text(
              label!,
              style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w500),
            ),
          ),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          inputFormatters: inputFormatters,
          style: TextStyle(
            fontSize: 14.sp, // Matnning ichki o‘lchamini belgilash
            color: Colors.black,
            fontWeight: FontWeight.w400,
          ),
          decoration: InputDecoration(
            fillColor: Colors.white,
            filled: true,
            labelText: hintText,
            labelStyle: TextStyle(
              fontSize: 14.sp,
              color: Colors.grey,
              fontWeight: FontWeight.w400,
            ),
            hintStyle: TextStyle(
              fontSize: 14.sp,
              color: Colors.black,
              fontWeight: FontWeight.w400,
            ),
            enabledBorder: OutlineInputBorder(
              borderSide: const BorderSide(color: AppColors.c1E1E1E16),
              borderRadius: BorderRadius.circular(8.r),
            ),
            focusedBorder: OutlineInputBorder(
              borderSide: const BorderSide(color: AppColors.c1E1E1E70),
              borderRadius: BorderRadius.circular(8.r),
            ),
            border: OutlineInputBorder(
              borderSide: const BorderSide(color: AppColors.c1E1E1E70),
              borderRadius: BorderRadius.circular(8.r),
            ),
          ),
          onChanged: onTextChanged,
        ),
      ],
    );
  }
}
