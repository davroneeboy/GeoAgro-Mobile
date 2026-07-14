import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class MarkerIconUtils {
  /// Синяя стрелка-указатель направления юзера на карте (поворачивается
  /// по heading через `Marker.rotation`). Раньше грузилась из
  /// assets/images/user_arrow.png, но тот файл оказался битым (1 байт,
  /// не PNG) — rootBundle.load читал его "успешно", BitmapDescriptor.bytes
  /// не валидирует содержимое на Dart-стороне, и краш вылезал только
  /// глубоко в нативном слое Google Maps при рендере маркера, необрабатываемо
  /// из Dart. Генерация тем же canvas-путём, что и createRulerIcon ниже,
  /// убирает зависимость от asset-файла вообще.
  static Future<BitmapDescriptor> createUserArrowIcon() async {
    final ui.PictureRecorder pictureRecorder = ui.PictureRecorder();
    final Canvas canvas = Canvas(pictureRecorder);

    const double size = 64.0;
    final double center = size / 2;

    // Белая обводка стрелки (контрастна на любом фоне карты).
    final Paint outlinePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    // Синяя заливка стрелки — стандартный цвет "текущее местоположение".
    final Paint fillPaint = Paint()
      ..color = const Color(0xFF2196F3)
      ..style = PaintingStyle.fill;

    // Стрелка направлена вверх (0° = север), поворот делает Marker.rotation.
    Path arrowPath(double scale) {
      final path = Path();
      path.moveTo(center, center - 24 * scale);
      path.lineTo(center + 16 * scale, center + 20 * scale);
      path.lineTo(center, center + 10 * scale);
      path.lineTo(center - 16 * scale, center + 20 * scale);
      path.close();
      return path;
    }

    canvas.drawPath(arrowPath(1.15), outlinePaint);
    canvas.drawPath(arrowPath(1.0), fillPaint);

    final ui.Picture picture = pictureRecorder.endRecording();
    final ui.Image image = await picture.toImage(size.toInt(), size.toInt());
    final ByteData? data =
        await image.toByteData(format: ui.ImageByteFormat.png);
    if (data == null) {
      throw StateError('Failed to encode user arrow icon to PNG bytes');
    }
    return BitmapDescriptor.bytes(data.buffer.asUint8List());
  }

  static Future<BitmapDescriptor> createRulerIcon() async {
    final ui.PictureRecorder pictureRecorder = ui.PictureRecorder();
    final Canvas canvas = Canvas(pictureRecorder);

    // Размер иконки
    const double size = 60.0;
    const double strokeWidth = 3.0;

    // Рисуем белый круг
    final Paint circlePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    // Рисуем черную обводку
    final Paint strokePaint = Paint()
      ..color = Colors.black
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth + 2.0;

    final double center = size / 2;
    final double radius = (size - strokeWidth) / 2;

    // Сначала рисуем черную обводку
    canvas.drawCircle(Offset(center, center), radius + 1, strokePaint);

    // Затем белый круг
    canvas.drawCircle(Offset(center, center), radius, circlePaint);

    // Рисуем крестик в центре
    final Paint crossPaint = Paint()
      ..color = Colors.black
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    const double crossSize = 8.0;
    // Горизонтальная линия
    canvas.drawLine(
      Offset(center - crossSize, center),
      Offset(center + crossSize, center),
      crossPaint,
    );
    // Вертикальная линия
    canvas.drawLine(
      Offset(center, center - crossSize),
      Offset(center, center + crossSize),
      crossPaint,
    );

    final ui.Picture picture = pictureRecorder.endRecording();
    final ui.Image image = await picture.toImage(
      size.toInt(),
      size.toInt(),
    );
    final ByteData? data =
        await image.toByteData(format: ui.ImageByteFormat.png);

    return BitmapDescriptor.bytes(data!.buffer.asUint8List());
  }
}
