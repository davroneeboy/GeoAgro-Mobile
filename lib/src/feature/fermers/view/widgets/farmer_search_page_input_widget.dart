import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/style/app_colors.dart';

class FarmerSearchPageInputWidget extends StatelessWidget {
  final TextEditingController textEditingController;
  const FarmerSearchPageInputWidget({
    super.key,
    required this.textEditingController,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: textEditingController,
      onTapOutside: (event) {
        FocusScope.of(context).unfocus();
      },
      onEditingComplete: () {
        FocusScope.of(context).unfocus();
      },
      style: TextStyle(
        color: AppColors.c1E1E1E90,
        fontSize: 14.sp,
        fontWeight: FontWeight.w500,
      ),
      cursorColor: AppColors.c1E1E1E90,
      keyboardType: TextInputType.number,
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
        hintText: "",
        hintStyle: TextStyle(color: AppColors.c1E1E1E20, fontSize: 14.sp),
      ),
    );
  }
}
