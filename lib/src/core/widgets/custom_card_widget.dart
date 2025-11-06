import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../style/app_colors.dart';

class CustomCardWidget extends StatelessWidget {
  final Widget child;
  final double horizontal;
  final double vertical;
  const CustomCardWidget({super.key, required this.horizontal, required this.vertical, required this.child});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: MediaQuery.of(context).size.width,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(14.r),
          border: Border.all(
            color: AppColors.c1E1E1E06,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Padding(
          padding: REdgeInsets.symmetric(horizontal: horizontal, vertical: vertical),
          child: child,
        ),
      ),
    );
  }
}
