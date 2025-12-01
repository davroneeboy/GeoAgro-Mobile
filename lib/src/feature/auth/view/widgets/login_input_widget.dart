import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/style/app_colors.dart';

class LoginInputWidget extends StatelessWidget {
  final String hintText;
  final String validatorText;
  final TextEditingController textEditingController;
  const LoginInputWidget({super.key, required this.hintText, required this.textEditingController, required this.validatorText});

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
      validator: (value) {
        if (value!.isNotEmpty) {
          return null;
        } else {
          return validatorText;
        }
      },
      style:  TextStyle(color: AppColors.black, fontSize: 16.sp, fontWeight: FontWeight.w500),
      cursorColor: AppColors.black,
      decoration: InputDecoration(
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
        errorBorder: OutlineInputBorder(
          borderSide: const BorderSide(color: AppColors.cFF0000),
          borderRadius: BorderRadius.circular(8.r),
        ),
        border: OutlineInputBorder(
          borderSide: const BorderSide(color: AppColors.c1E1E1E70),
          borderRadius: BorderRadius.circular(8.r),
        ),
        hintText: hintText,
        hintStyle:  TextStyle(color: AppColors.c1E1E1E50, fontSize: 16.sp),
      ),
    );
  }
}
