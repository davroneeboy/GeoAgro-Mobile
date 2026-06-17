import 'package:flutter/material.dart';

/// Color tokens for the application
/// Dark theme by default with #16A34A green accent
class AppColors {
  AppColors._();

  // ===== DARK THEME (DEFAULT) =====
  static const Color darkBackground = Color(0xFF021024); // Deep Navy Blue
  static const Color darkSurface = Color(0xFF051933); // Navy surface
  static const Color darkSurfaceVariant =
      Color(0xFF1E293B); // Slate-800 (cards)
  static const Color darkTextPrimary = Color(0xFFF9FAFB); // Slate-50
  static const Color darkTextSecondary = Color(0xFFE2E8F0); // Slate-200
  static const Color darkTextTertiary = Color(0xFF94A3B8); // Slate-400
  static const Color darkBorder = Color(0xFF2D3A4D); // Subtle navy-slate border
  static const Color darkDivider = Color(0xFF27324A); // Navy divider
  static const Color darkSurfaceElevated =
      Color(0xFF283548); // Chips on cards (slightly lighter)
  static const Color darkMuted = Color(0xFF334155); // Slate-700
  static const Color darkHighlight = Color(0xFF0B1120); // Deep navy

  // ===== ACCENT COLOR (Green #16A34A) =====
  static const Color accentGreen = Color(0xFF16A34A); // Primary accent
  static const Color accentGreenLight =
      Color(0xFF34D399); // Tailwind emerald-400
  static const Color accentGreenDark =
      Color(0xFF0F7A36); // Tailwind emerald-800

  // ===== SEMANTIC COLORS =====
  static const Color success = Color(0xFF16A34A); // Same as accent
  static const Color warning = Color(0xFFFF9500); // iOS Orange
  static const Color error = Color(0xFFFF3B30); // iOS Red
  static const Color info = Color(0xFF007AFF); // iOS Blue

  // ===== CHART / STATISTICS COLORS =====
  static const Color chartBlue = Color(0xFF38BDF8); // Sky-400
  static const Color chartRed = Color(0xFFF87171); // Red-400
  static const Color chartTeal = Color(0xFF06B6D4); // Cyan-500
  static const Color chartPurple = Color(0xFF8B5CF6); // Violet-500
  static const Color chartEmerald = Color(0xFF10B981); // Emerald-500
  static const Color chartMint = Color(0xFF38E3A8); // Custom mint

  // ===== LEGACY COLORS (for backward compatibility - will be deprecated) =====
  @Deprecated('Use darkTextPrimary instead')
  static const Color white = Color(0xFFFFFFFF);

  @Deprecated('Use darkBackground instead')
  static const Color black = Color(0xFF000000);

  @Deprecated('Use accentGreen instead')
  static const Color c28A745 = Color(0xFF28A745);

  @Deprecated('Use error instead')
  static const Color cE60C0C = Color(0xFFE60C0C);

  @Deprecated('Use darkSurface instead')
  static const Color cF7F7F7 = Color(0xFFF7F7F7);

  @Deprecated('Use darkTextPrimary instead')
  static const Color c1E1E1E = Color(0xFF1E1E1E);

  // Legacy opacity variants (keeping for compatibility)
  static const Color c1E1E1E06 = Color.fromRGBO(30, 30, 30, 0.06);
  static const Color c1E1E1E10 = Color.fromRGBO(30, 30, 30, 0.1);
  static const Color c1E1E1E16 = Color.fromRGBO(30, 30, 30, 0.16);
  static const Color c1E1E1E20 = Color.fromRGBO(30, 30, 30, 0.2);
  static const Color c1E1E1E40 = Color.fromRGBO(30, 30, 30, 0.4);
  static const Color c1E1E1E50 = Color.fromRGBO(30, 30, 30, 0.5);
  static const Color c1E1E1E70 = Color.fromRGBO(30, 30, 30, 0.7);
  static const Color c1E1E1E80 = Color.fromRGBO(30, 30, 30, 0.8);
  static const Color c1E1E1E90 = Color.fromRGBO(30, 30, 30, 0.9);

  // Additional legacy colors for statistics
  static const Color cFF0000 = Color(0xFFFF0000);
  static const Color cFF000080 = Color.fromRGBO(255, 0, 0, 0.8);
  static const Color cFF6B35 = Color(0xFFFF6B35);
  static const Color c4CAF50 = Color(0xFF4CAF50);
  static const Color c2196F3 = Color(0xFF2196F3);
  static const Color c8BC34A = Color(0xFF8BC34A);
  static const Color cFF9800 = Color(0xFFFF9800);
  static const Color cFF5722 = Color(0xFFFF5722);
  static const Color cF44336 = Color(0xFFF44336);
  static const Color c666666 = Color(0xFF666666);
  static const Color c475569 = Color(0xFF475569);
  static const Color cF2F3F2 = Color.fromARGB(255, 192, 192, 192);
  static const Color cF1F5F9 = Color.fromRGBO(241, 145, 149, 1);
  static const Color c186C757D = Color.fromRGBO(108, 117, 125, 0.1);
  static const Color c28A74510 = Color.fromRGBO(40, 167, 69, 0.1);
  static const Color c28A74540 = Color.fromRGBO(40, 167, 69, 0.4);
  static const Color c28A74580 = Color.fromRGBO(40, 167, 69, 0.8);
  static const Color cE60C0C02 = Color.fromRGBO(230, 12, 12, 0.2);

  // ===== LIGHT THEME =====
  static const Color lightBackground = Color(0xFFF2F2F7); // iOS system gray 6
  static const Color lightSurface = Color(0xFFFFFFFF); // White
  static const Color lightSurfaceVariant = Color(0xFFFFFFFF); // White cards
  static const Color lightTextPrimary = Color(0xFF1C1C1E); // iOS label
  static const Color lightTextSecondary =
      Color(0xFF3C3C43); // iOS secondary label
  static const Color lightTextTertiary =
      Color(0xFF8E8E93); // iOS tertiary label
  static const Color lightBorder = Color(0xFFE5E5EA); // iOS separator
  static const Color lightDivider = Color(0xFFC6C6C8); // iOS opaque separator
  static const Color lightSurfaceElevated = Color(0xFFFFFFFF); // White
  static const Color lightMuted = Color(0xFFD1D1D6); // iOS gray 4
  static const Color lightHighlight = Color(0xFFE5E5EA); // iOS gray 5

  // iOS Blue (for accents in some areas)
  static const Color accentBlue = Color(0xFF007AFF);
  static const Color accentBlueDark = Color(0xFF0A84FF);
}
