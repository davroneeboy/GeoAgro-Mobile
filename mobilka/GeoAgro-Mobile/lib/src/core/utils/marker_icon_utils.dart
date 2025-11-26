import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class MarkerIconUtils {
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
    final ByteData? data = await image.toByteData(format: ui.ImageByteFormat.png);
    
    return BitmapDescriptor.bytes(data!.buffer.asUint8List());
  }
}
