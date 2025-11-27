import 'package:intl/intl.dart';

/// Утилита для форматирования дат
class DateFormatter {
  const DateFormatter._();

  /// Форматирует дату в формат "27.11.2025, 03:52"
  static String formatCommentDate(DateTime dateTime) {
    final dateFormat = DateFormat('dd.MM.yyyy, HH:mm');
    return dateFormat.format(dateTime);
  }
  
  /// Относительное время ("2 daqiqa oldin", "Kecha")
  /// Опционально: можно использовать для более читаемого отображения
  static String relativeTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inMinutes < 1) return 'Hozir';
    if (difference.inMinutes < 60) return '${difference.inMinutes} daqiqa oldin';
    if (difference.inHours < 24) return '${difference.inHours} soat oldin';
    if (difference.inDays == 1) return 'Kecha';
    if (difference.inDays < 7) return '${difference.inDays} kun oldin';
    
    // Для дат старше 7 дней показываем полный формат
    return formatCommentDate(dateTime);
  }
}

