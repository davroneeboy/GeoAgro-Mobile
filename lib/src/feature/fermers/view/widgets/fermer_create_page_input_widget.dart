import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/style/app_colors.dart';

class FermerCreatePageInputWidget extends StatelessWidget {
  final String hintText;
  final TextEditingController textEditingController;
  final TextInputType textInputType;
  final int? maxLength;
  const FermerCreatePageInputWidget({
    super.key,
    required this.hintText,
    required this.textEditingController,
    this.textInputType = TextInputType.text,
    this.maxLength,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: textEditingController,
      onTapOutside: (event) {
        FocusScope.of(context).unfocus();
      },
      onEditingComplete: () {
        log(textEditingController.text);
        FocusScope.of(context).nextFocus();
      },
      style: TextStyle(
          color: AppColors.c1E1E1E90,
          fontSize: 14.sp,
          fontWeight: FontWeight.w500),
      cursorColor: AppColors.c1E1E1E90,
      keyboardType: textInputType,
      maxLength: maxLength,
      decoration: InputDecoration(
        filled: true,
        fillColor: AppColors.white,
        counterText: '',
        contentPadding: REdgeInsets.only(top: 8, bottom: 8, left: 16),
        enabledBorder: OutlineInputBorder(
          borderSide: const BorderSide(color: AppColors.c1E1E1E16),
          borderRadius: BorderRadius.circular(8.r),
        ),
        disabledBorder: OutlineInputBorder(
          borderSide: const BorderSide(color: AppColors.c1E1E1E70),
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
        hintText: hintText,
        hintStyle: TextStyle(color: AppColors.c1E1E1E20, fontSize: 14.sp),
      ),
    );
  }
}
