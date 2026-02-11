import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:agro_employee_public/design_system/tokens/adaptive_colors.dart';
import '../../../design_system/tokens/typography.dart';

/// Modern app bar with dark theme
class CustomAppBarWidget extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final bool canPop;
  final List<Widget>? actions;
  final VoidCallback? onBackPressed; // Кастомный обработчик для кнопки назад
  
  const CustomAppBarWidget({
    super.key,
    required this.title,
    required this.canPop,
    this.actions,
    this.onBackPressed, // Опциональный параметр
  });

  @override
  Widget build(BuildContext context) {
    return AppBar(
      toolbarHeight: 68.h,
      centerTitle: true,
      backgroundColor: context.colors.background,
      elevation: 0,
      leading: canPop
          ? IconButton(
              onPressed: onBackPressed ?? () => context.pop(), // Используем кастомный обработчик или стандартный pop
              icon: Icon(
                Icons.arrow_back_ios_new_rounded,
                color: context.colors.textPrimary,
                size: 18.sp,
              ),
            )
          : null,
      title: Text(
        title,
        style: AppTypography.headline3(context).copyWith(
          color: context.colors.textPrimary,
          fontSize: 18.sp,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.2,
        ),
      ),
      scrolledUnderElevation: 0,
      actions: actions,
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(
          height: 1,
          color: context.colors.border,
        ),
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(69);
}
