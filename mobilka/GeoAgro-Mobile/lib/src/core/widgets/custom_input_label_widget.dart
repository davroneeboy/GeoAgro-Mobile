import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../style/app_colors.dart';

class CustomInputLabelWidget extends StatelessWidget {
  final String text;
  const CustomInputLabelWidget({super.key, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.max,
      mainAxisAlignment: MainAxisAlignment.start,
      children: [Text(text, style: TextStyle(fontSize: 16.sp, color: AppColors.c1E1E1E, fontWeight: FontWeight.w500))],
    );
  }
}
