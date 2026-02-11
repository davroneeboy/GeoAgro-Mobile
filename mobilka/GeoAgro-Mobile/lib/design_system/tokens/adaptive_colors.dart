import 'package:flutter/material.dart';
import 'colors.dart';

/// Theme-aware color accessor.
///
/// Usage: `context.colors.background` instead of `AppColors.darkBackground`.
/// Automatically selects the correct palette based on current [Brightness].
class AdaptiveColors {
  final bool isDark;

  AdaptiveColors.of(BuildContext context)
      : isDark = Theme.of(context).brightness == Brightness.dark;

  // ─── Backgrounds ──────────────────────────────────────────
  Color get background =>
      isDark ? AppColors.darkBackground : AppColors.lightBackground;
  Color get surface =>
      isDark ? AppColors.darkSurface : AppColors.lightSurface;
  Color get surfaceVariant =>
      isDark ? AppColors.darkSurfaceVariant : AppColors.lightSurfaceVariant;
  Color get surfaceElevated =>
      isDark ? AppColors.darkSurfaceElevated : AppColors.lightSurfaceElevated;
  Color get highlight =>
      isDark ? AppColors.darkHighlight : AppColors.lightHighlight;

  // ─── Text ─────────────────────────────────────────────────
  Color get textPrimary =>
      isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
  Color get textSecondary =>
      isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
  Color get textTertiary =>
      isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary;

  // ─── Borders & Dividers ───────────────────────────────────
  Color get border =>
      isDark ? AppColors.darkBorder : AppColors.lightBorder;
  Color get divider =>
      isDark ? AppColors.darkDivider : AppColors.lightDivider;
  Color get muted =>
      isDark ? AppColors.darkMuted : AppColors.lightMuted;
}

/// Extension on [BuildContext] for convenient access to [AdaptiveColors].
///
/// ```dart
/// // Before:
/// color: design_colors.AppColors.darkBackground
/// // After:
/// color: context.colors.background
/// ```
extension AdaptiveColorsExtension on BuildContext {
  AdaptiveColors get colors => AdaptiveColors.of(this);
}
