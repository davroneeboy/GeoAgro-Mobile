import 'package:flutter/material.dart';
import 'package:agro_employee_public/design_system/tokens/adaptive_colors.dart';
import '../../../design_system/tokens/radii.dart';

/// Modern card widget that adapts to light/dark theme.
///
/// Light: white surface + soft shadow (iOS style)
/// Dark: elevated surface + border
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
    final colors = context.colors;
    final radius = borderRadius ?? AppRadii.card;
    return Container(
      width: MediaQuery.of(context).size.width,
      decoration: BoxDecoration(
        color: backgroundColor ?? colors.surfaceVariant,
        borderRadius: BorderRadius.circular(radius),
        border: colors.cardBorder,
        boxShadow: colors.cardShadow,
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
