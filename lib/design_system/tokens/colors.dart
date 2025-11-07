import 'package:flutter/material.dart';

/// Color tokens for the application
/// Apple/Notion inspired - clean black/white palette
class AppColors {
  AppColors._();

  // ===== LIGHT THEME =====
  static const Color lightBackground = Color(0xFFFFFFFF); // Pure white
  static const Color lightSurface = Color(0xFFFAFAFA); // Slight gray
  static const Color lightTextPrimary = Color(0xFF000000); // Pure black
  static const Color lightTextSecondary = Color(0xFF666666); // Medium gray
  static const Color lightTextTertiary = Color(0xFF999999); // Light gray
  static const Color lightBorder = Color(0xFFE5E5E5); // Subtle border
  static const Color lightDivider = Color(0xFFF0F0F0); // Divider color
  
  // ===== DARK THEME =====
  static const Color darkBackground = Color(0xFF000000); // Pure black
  static const Color darkSurface = Color(0xFF1C1C1E); // Dark gray
  static const Color darkTextPrimary = Color(0xFFFFFFFF); // Pure white
  static const Color darkTextSecondary = Color(0xFF999999); // Light gray
  static const Color darkTextTertiary = Color(0xFF666666); // Medium gray
  static const Color darkBorder = Color(0xFF38383A); // Dark border
  static const Color darkDivider = Color(0xFF2C2C2E); // Dark divider
  
  // ===== ACCENT COLORS (iOS Blue) =====
  static const Color accentBlue = Color(0xFF007AFF); // iOS Blue
  static const Color accentBlueDark = Color(0xFF0A84FF); // iOS Blue Dark
  
  // ===== SEMANTIC COLORS =====
  static const Color success = Color(0xFF34C759); // iOS Green
  static const Color warning = Color(0xFFFF9500); // iOS Orange
  static const Color error = Color(0xFFFF3B30); // iOS Red
  static const Color info = Color(0xFF007AFF); // iOS Blue
  
  // ===== LEGACY COLORS (for backward compatibility) =====
  @Deprecated('Use theme colors instead')
  static const Color c1E1E1E = Color(0xFF1E1E1E);
  
  @Deprecated('Use theme colors instead')
  static const Color c28A745 = Color(0xFF28A745);
  
  @Deprecated('Use theme colors instead')
  static const Color cF7F7F7 = Color(0xFFF7F7F7);
}

