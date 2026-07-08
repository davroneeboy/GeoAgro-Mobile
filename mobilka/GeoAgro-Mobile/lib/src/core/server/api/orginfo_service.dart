import 'package:dio/dio.dart';
import 'package:html/dom.dart';
import 'package:html/parser.dart' show parse;
import 'package:l/l.dart';

class OrginfoResult {
  final String name;
  final String address;

  OrginfoResult({required this.name, required this.address});
}

/// Скрейпит публичную страницу поиска orginfo.uz по ИНН организации.
/// У orginfo.uz нет официального API — используется парсинг HTML.
/// Данные неофициальные (сам сайт это указывает), проверять на бэкенде.
class OrginfoService {
  static Dio? _dio;

  static Dio get _client {
    _dio ??= Dio(
      BaseOptions(
        baseUrl: 'https://orginfo.uz',
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        validateStatus: (status) => status != null && status < 500,
      ),
    );
    return _dio!;
  }

  static String _collapseWhitespace(String input) =>
      input.replaceAll(RegExp(r'\s+'), ' ').trim();

  /// Бросает [OrginfoParseException], если разметка orginfo.uz поменялась
  /// (страница отдалась, но ожидаемых карточек в ней нет) — сигнал сломанного парсера,
  /// в отличие от штатного "организация не найдена" (null).
  static Future<OrginfoResult?> lookupByInn(String inn) async {
    final Response response;
    try {
      response = await _client.get(
        '/ru/search/organizations/',
        queryParameters: {'q': inn},
      );
    } catch (e) {
      l.e('OrginfoService: network error for INN $inn: $e');
      rethrow;
    }

    if (response.statusCode != 200 || response.data is! String) {
      l.e('OrginfoService: unexpected response for INN $inn, '
          'status=${response.statusCode}');
      throw OrginfoParseException(
          'orginfo.uz javob bermadi (status: ${response.statusCode})');
    }

    final rawHtml = response.data as String;

    // Пустая выдача — организация правда не найдена, а не поломка парсера
    if (!rawHtml.contains('search-tab')) {
      l.e('OrginfoService: response for INN $inn does not look like '
          'a search page — markup may have changed');
      throw OrginfoParseException(
          "orginfo.uz sahifa tuzilishi o'zgargan bo'lishi mumkin");
    }

    final document = parse(rawHtml);

    // Страница также содержит login/register-модалки, которые тоже
    // используют .card-body > h*.card-title (h4/h5, "Войти" и т.п.) —
    // результат поиска отличается тегом h6 без text-center, так что
    // ищем именно его, а не первый попавшийся .card-title.
    final Element? titleEl =
        document.querySelector('.card-body > h6.card-title');
    if (titleEl == null) return null;

    final cardBody = titleEl.parent;
    final addressEl = cardBody?.querySelector('.text-body-tertiary');
    if (addressEl == null) {
      l.w('OrginfoService: title matched but address did not for INN $inn — '
          'markup may have partially changed');
    }

    return OrginfoResult(
      name: _collapseWhitespace(titleEl.text),
      address: _collapseWhitespace(addressEl?.text ?? ''),
    );
  }
}

/// Парсер сломан (вёрстка orginfo.uz изменилась) — отличается от "ничего не найдено".
class OrginfoParseException implements Exception {
  final String message;
  OrginfoParseException(this.message);

  @override
  String toString() => message;
}
