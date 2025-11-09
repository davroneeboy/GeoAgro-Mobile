import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../design_system/tokens/colors.dart' as DesignColors;
import '../../../design_system/tokens/radii.dart';

/// Modern card widget with dark theme
class CustomCardWidget extends StatelessWidget {
  final Widget child;
  final double horizontal;
  final double vertical;
  final Color? backgroundColor;
  final double? borderRadius;
  
  const CustomCardWidget({
    super.key,
    required this.horizontal,
    required this.vertical,
    required this.child,
    this.backgroundColor,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: MediaQuery.of(context).size.width,
      decoration: BoxDecoration(
        color: backgroundColor ?? DesignColors.AppColors.darkSurface,
        borderRadius: BorderRadius.circular(borderRadius ?? AppRadii.card),
        border: Border.all(
          color: DesignColors.AppColors.darkBorder,
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: horizontal,
          vertical: vertical,
        ),
        child: child,
      ),
    );
  }
}
