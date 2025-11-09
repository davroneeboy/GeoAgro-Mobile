import 'package:flutter/material.dart';

/// Design System Color Tokens
/// 
/// Two themes with Material 3 semantic colors:
/// - Light: #F9F6EE background (warm off-white)
/// - Dark: #353935 background (muted dark gray-green)
/// - Primary accent: #16A34A (emerald green)
class AppColors {
  AppColors._();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PRIMARY / ACCENT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /// Primary accent color (emerald green)
  static const Color primary = Color(0xFF16A34A);
  
  /// Pressed/hover state (darker green)
  static const Color primaryDark = Color(0xFF0F7A36);
  
  /// Light variant for subtle highlights
  static const Color primaryLight = Color(0xFF34D399);
  
  /// Very light variant for backgrounds
  static const Color primaryContainer = Color(0xFFD1FAE5);
  
  /// Dark container for dark theme
  static const Color primaryContainerDark = Color(0xFF0F4A2B);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LIGHT THEME
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /// Background (warm off-white)
  static const Color lightBackground = Color(0xFFF9F6EE);
  
  /// Surface (cards, sheets)
  static const Color lightSurface = Color(0xFFFFFBF5);
  
  /// Surface variant (subtle differentiation)
  static const Color lightSurfaceVariant = Color(0xFFF5F2E8);
  
  /// Elevated surface (raised cards)
  static const Color lightSurfaceElevated = Color(0xFFFFFFFF);
  
  /// Primary text
  static const Color lightOnBackground = Color(0xFF1C1B1A);
  
  /// Secondary text
  static const Color lightOnSurface = Color(0xFF3E3E3C);
  
  /// Tertiary text (muted)
  static const Color lightOnSurfaceVariant = Color(0xFF706F6C);
  
  /// Outline/borders
  static const Color lightOutline = Color(0xFFE0DED9);
  
  /// Dividers
  static const Color lightOutlineVariant = Color(0xFFEBE8E2);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DARK THEME
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /// Background (muted dark gray-green)
  static const Color darkBackground = Color(0xFF353935);
  
  /// Surface (cards, sheets) - tonal, not pure black
  static const Color darkSurface = Color(0xFF3F433F);
  
  /// Surface variant (more elevated)
  static const Color darkSurfaceVariant = Color(0xFF4A4E4A);
  
  /// Elevated surface (highest elevation)
  static const Color darkSurfaceElevated = Color(0xFF555955);
  
  /// Primary text
  static const Color darkOnBackground = Color(0xFFE6E3DC);
  
  /// Secondary text
  static const Color darkOnSurface = Color(0xFFE6E3DC);
  
  /// Tertiary text (muted)
  static const Color darkOnSurfaceVariant = Color(0xFFCBC8C0);
  
  /// Outline/borders
  static const Color darkOutline = Color(0xFF5A5E5A);
  
  /// Dividers
  static const Color darkOutlineVariant = Color(0xFF4E524E);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SEMANTIC COLORS (shared across themes)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /// Success (same as primary)
  static const Color success = Color(0xFF16A34A);
  static const Color successLight = Color(0xFF34D399);
  static const Color successDark = Color(0xFF0F7A36);
  
  /// Error
  static const Color error = Color(0xFFDC2626);
  static const Color errorLight = Color(0xFFF87171);
  static const Color errorDark = Color(0xFFB91C1C);
  
  /// Warning
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningLight = Color(0xFFFBBF24);
  static const Color warningDark = Color(0xFFD97706);
  
  /// Info
  static const Color info = Color(0xFF3B82F6);
  static const Color infoLight = Color(0xFF60A5FA);
  static const Color infoDark = Color(0xFF2563EB);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FIXED COLORS (for badges, chips, etc.)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /// Pure white (use sparingly)
  static const Color white = Color(0xFFFFFFFF);
  
  /// Pure black (use sparingly)
  static const Color black = Color(0xFF000000);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // OPACITY HELPERS (for overlays, shadows)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static Color withOpacity(Color color, double opacity) {
    return color.withOpacity(opacity);
  }
  
  /// Light theme overlay (for disabled states, etc.)
  static Color lightOverlay(double opacity) => lightOnBackground.withOpacity(opacity);
  
  /// Dark theme overlay
  static Color darkOverlay(double opacity) => darkOnBackground.withOpacity(opacity);
}

