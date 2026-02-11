import 'package:flutter/material.dart';
import 'package:agro_employee_public/design_system/tokens/adaptive_colors.dart';
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
        color: backgroundColor ?? context.colors.surface,
        borderRadius: BorderRadius.circular(borderRadius ?? AppRadii.card),
        border: Border.all(
          color: context.colors.border,
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
