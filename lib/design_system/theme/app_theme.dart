import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../tokens/colors.dart';
import '../tokens/spacing.dart';
import '../tokens/radii.dart';

/// Main theme configuration
class AppTheme {
  AppTheme._();

  /// Light theme - Apple/Notion inspired
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    colorScheme: const ColorScheme.light(
      primary: AppColors.accentBlue,
      onPrimary: Colors.white,
      secondary: AppColors.accentBlue,
      onSecondary: Colors.white,
      error: AppColors.error,
      onError: Colors.white,
      surface: AppColors.lightSurface,
      onSurface: AppColors.lightTextPrimary,
      onSurfaceVariant: AppColors.lightTextSecondary,
      background: AppColors.lightBackground,
      onBackground: AppColors.lightTextPrimary,
      outline: AppColors.lightBorder,
    ),
    
    scaffoldBackgroundColor: AppColors.lightBackground,
    
    // AppBar theme
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.lightBackground,
      foregroundColor: AppColors.lightTextPrimary,
      elevation: 0,
      centerTitle: false,
      systemOverlayStyle: SystemUiOverlayStyle.dark,
      titleTextStyle: TextStyle(
        color: AppColors.lightTextPrimary,
        fontSize: 17,
        fontWeight: FontWeight.w600,
      ),
    ),
    
    // Card theme
    cardTheme: CardTheme(
      color: AppColors.lightSurface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadii.card),
        side: const BorderSide(color: AppColors.lightBorder, width: 1),
      ),
      margin: const EdgeInsets.all(AppSpacing.xs),
    ),
    
    // Input decoration theme
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.lightSurface,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadii.input),
        borderSide: const BorderSide(color: AppColors.lightBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadii.input),
        borderSide: const BorderSide(color: AppColors.lightBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadii.input),
        borderSide: const BorderSide(color: AppColors.accentBlue, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadii.input),
        borderSide: const BorderSide(color: AppColors.error),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.md,
      ),
    ),
    
    // Button themes
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.accentBlue,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.button),
        ),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.accentBlue,
        side: const BorderSide(color: AppColors.accentBlue),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.button),
        ),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppColors.accentBlue,
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    
    // Divider theme
    dividerTheme: const DividerThemeData(
      color: AppColors.lightDivider,
      thickness: 1,
      space: 1,
    ),
    
    // Floating action button theme
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: AppColors.accentBlue,
      foregroundColor: Colors.white,
      elevation: 2,
    ),
    
    // Bottom navigation bar theme
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: AppColors.lightSurface,
      selectedItemColor: AppColors.accentBlue,
      unselectedItemColor: AppColors.lightTextSecondary,
      elevation: 8,
    ),
  );

  /// Dark theme - Apple/Notion inspired
  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: const ColorScheme.dark(
      primary: AppColors.accentBlueDark,
      onPrimary: Colors.white,
      secondary: AppColors.accentBlueDark,
      onSecondary: Colors.white,
      error: AppColors.error,
      onError: Colors.white,
      surface: AppColors.darkSurface,
      onSurface: AppColors.darkTextPrimary,
      onSurfaceVariant: AppColors.darkTextSecondary,
      background: AppColors.darkBackground,
      onBackground: AppColors.darkTextPrimary,
      outline: AppColors.darkBorder,
    ),
    
    scaffoldBackgroundColor: AppColors.darkBackground,
    
    // AppBar theme
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.darkBackground,
      foregroundColor: AppColors.darkTextPrimary,
      elevation: 0,
      centerTitle: false,
      systemOverlayStyle: SystemUiOverlayStyle.light,
      titleTextStyle: TextStyle(
        color: AppColors.darkTextPrimary,
        fontSize: 17,
        fontWeight: FontWeight.w600,
      ),
    ),
    
    // Card theme
    cardTheme: CardTheme(
      color: AppColors.darkSurface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadii.card),
        side: const BorderSide(color: AppColors.darkBorder, width: 1),
      ),
      margin: const EdgeInsets.all(AppSpacing.xs),
    ),
    
    // Input decoration theme
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.darkSurface,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadii.input),
        borderSide: const BorderSide(color: AppColors.darkBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadii.input),
        borderSide: const BorderSide(color: AppColors.darkBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadii.input),
        borderSide: const BorderSide(color: AppColors.accentBlueDark, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadii.input),
        borderSide: const BorderSide(color: AppColors.error),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.md,
      ),
    ),
    
    // Button themes
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.accentBlueDark,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.button),
        ),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.accentBlueDark,
        side: const BorderSide(color: AppColors.accentBlueDark),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.button),
        ),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppColors.accentBlueDark,
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    
    // Divider theme
    dividerTheme: const DividerThemeData(
      color: AppColors.darkDivider,
      thickness: 1,
      space: 1,
    ),
    
    // Floating action button theme
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: AppColors.accentBlueDark,
      foregroundColor: Colors.white,
      elevation: 2,
    ),
    
    // Bottom navigation bar theme
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: AppColors.darkSurface,
      selectedItemColor: AppColors.accentBlueDark,
      unselectedItemColor: AppColors.darkTextSecondary,
      elevation: 8,
    ),
  );
}

