import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../style/app_colors.dart';

class CustomAppBarWidget extends StatelessWidget
    implements PreferredSizeWidget {
  final String title;
  final bool canPop;
  final List<Widget>? actions;
  const CustomAppBarWidget(
      {super.key, required this.title, required this.canPop, this.actions});

  @override
  Widget build(BuildContext context) {
    return AppBar(
      toolbarHeight: 68.h,
      centerTitle: true,
      backgroundColor: Colors.white,
      leading: canPop
          ? IconButton(
              onPressed: () => context.pop(),
              icon: Icon(
                Icons.arrow_back_ios_new_outlined,
                color: AppColors.c1E1E1E,
                size: 16.sp,
              ),
            )
          : null,
      title: Text(
        title,
        style: TextStyle(
            color: AppColors.c1E1E1E,
            fontSize: 20.sp,
            fontWeight: FontWeight.w500),
      ),
      scrolledUnderElevation: 0,
      actions: actions,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(68);
}
