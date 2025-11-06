import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../style/app_colors.dart';

class MainButton extends StatelessWidget {
  final String text;
  final bool? isLoading;
  final VoidCallback onTap;
  const MainButton({
    super.key,
    required this.text,
    required this.onTap,
    this.isLoading,
  });

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottomPadding > 0 ? bottomPadding : 16),
      child: MaterialButton(
        height: 50.h,
        onPressed: onTap,
        elevation: 0,
        highlightElevation: 0,
        color: Colors.white,
        minWidth: MediaQuery.of(context).size.width,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10.r),
          side: const BorderSide(color: AppColors.c28A745, width: 1),
        ),
        child: isLoading == true
            ? SizedBox(
                height: 20.h,
                width: 20.h,
                child: const CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.c28A745),
                ),
              )
            : Text(
                text,
                style: TextStyle(
                  fontSize: 14.sp,
                  fontWeight: FontWeight.w500,
                  color: AppColors.c28A745,
                  fontFamily: "Inter-Mediums",
                ),
              ),
      ),
    );
  }
}

class MainButton2 extends StatelessWidget {
  final Widget child;
  final VoidCallback? onPressed;
  final bool enableFeedback;
  const MainButton2({super.key, required this.enableFeedback, required this.onPressed, required this.child});

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottomPadding > 0 ? bottomPadding : 16),
      child: MaterialButton(
        enableFeedback: enableFeedback,
        height: 50.h,
        onPressed: onPressed,
        elevation: 0,
        highlightElevation: 0,
        color: Colors.white,
        disabledColor: AppColors.cF2F3F2,
        minWidth: MediaQuery.of(context).size.width,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10.r),
          side: const BorderSide(color: AppColors.c28A745, width: 1),
        ),
        child: child,
      ),
    );
  }
}
