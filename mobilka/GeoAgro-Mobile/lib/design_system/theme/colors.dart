import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const Color primary = Color(0xFF16A34A);
  static const Color primaryDark = Color(0xFF0F7A36);
  static const Color primaryLight = Color(0xFF34D399);
  static const Color primaryContainer = Color(0xFFD1FAE5);
  static const Color primaryContainerDark = Color(0xFF0F4A2B);

  static const Color lightBackground = Color(0xFFF2F2F7); // iOS system gray 6
  static const Color lightSurface = Color(0xFFFFFFFF); // White
  static const Color lightSurfaceVariant = Color(0xFFFFFFFF); // White cards
  static const Color lightSurfaceElevated = Color(0xFFFFFFFF); // White
  static const Color lightOnBackground = Color(0xFF1C1C1E); // iOS label
  static const Color lightOnSurface = Color(0xFF1C1C1E); // iOS label
  static const Color lightOnSurfaceVariant = Color(0xFF8E8E93); // iOS tertiary label
  static const Color lightOutline = Color(0xFFD1D1D6); // iOS gray 4
  static const Color lightOutlineVariant = Color(0xFFE5E5EA); // iOS separator

  static const Color darkBackground = Color(0xFF021024); // Deep Navy Blue
  static const Color darkSurface = Color(0xFF3F433F);
  static const Color darkSurfaceVariant = Color(0xFF4A4E4A);
  static const Color darkSurfaceElevated = Color(0xFF555955);
  static const Color darkOnBackground = Color(0xFFE6E3DC);
  static const Color darkOnSurface = Color(0xFFE6E3DC);
  static const Color darkOnSurfaceVariant = Color(0xFFCBC8C0);
  static const Color darkOutline = Color(0xFF5A5E5A);
  static const Color darkOutlineVariant = Color(0xFF4E524E);

  static const Color success = Color(0xFF16A34A);
  static const Color successLight = Color(0xFF34D399);
  static const Color successDark = Color(0xFF0F7A36);

  static const Color error = Color(0xFFDC2626);
  static const Color errorLight = Color(0xFFF87171);
  static const Color errorDark = Color(0xFFB91C1C);

  static const Color warning = Color(0xFFF59E0B);
  static const Color warningLight = Color(0xFFFBBF24);
  static const Color warningDark = Color(0xFFD97706);

  static const Color info = Color(0xFF3B82F6);
  static const Color infoLight = Color(0xFF60A5FA);
  static const Color infoDark = Color(0xFF2563EB);

  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF000000);

  static Color withOpacity(Color color, double opacity) {
    return color.withOpacity(opacity);
  }

  static Color lightOverlay(double opacity) => lightOnBackground.withOpacity(opacity);
  static Color darkOverlay(double opacity) => darkOnBackground.withOpacity(opacity);

  static const Color accentGreen = primary;
  static const Color darkTextPrimary = darkOnBackground;
  static const Color darkTextSecondary = darkOnSurfaceVariant;
  static const Color darkTextTertiary = darkOnSurfaceVariant;
  static const Color darkBorder = darkOutline;
  static const Color darkDivider = darkOutlineVariant;
  static const Color darkHighlight = darkSurfaceElevated;
}
