import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../style/app_colors.dart';

class CustomListTileWidget extends StatelessWidget {
  final String title;
  final String contextText;
  const CustomListTileWidget({super.key, required this.title, required this.contextText});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 4,
          child: Text(
            title,
            style: TextStyle(
              fontSize: 15.sp,
              color: AppColors.c1E1E1E,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.2,
            ),
          ),
        ),
        12.horizontalSpace,
        Expanded(
          flex: 6,
          child: Text(
            contextText,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: AppColors.c1E1E1E70,
              fontWeight: FontWeight.w500,
              fontSize: 15.sp,
              height: 1.3,
            ),
            textAlign: TextAlign.left,
          ),
        )
      ],
    );
  }
}
