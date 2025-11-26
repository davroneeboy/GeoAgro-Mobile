/// Border radius tokens
/// Apple/Notion inspired - subtle rounded corners
class AppRadii {
  AppRadii._();

  static const double none = 0.0;
  static const double sm = 8.0;   // Small (buttons, inputs)
  static const double md = 12.0;  // Medium (cards)
  static const double lg = 16.0;  // Large (modals, sheets)
  static const double xl = 24.0;  // Extra large (special cases)
  static const double full = 9999.0; // Full circle

  // Specific use cases
  static const double button = sm;
  static const double input = sm;
  static const double card = md;
  static const double modal = lg;
}

