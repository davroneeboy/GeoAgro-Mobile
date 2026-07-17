import "package:flutter/material.dart";
import "package:flutter_screenutil/flutter_screenutil.dart";

/// Максимальная ширина/высота, которую видит ScreenUtil при расчёте
/// .sp/.w/.h — выше этого предела реальный (более широкий) экран
/// планшета клэмпится, чтобы весь существующий .sp/.w/.h-код в
/// проекте (сотни мест, дизайн под designSize 375x812) не растягивался
/// пропорционально ширине экрана. 600x960 — примерно верхняя граница
/// compact/medium breakpoint (Responsive.compact = 600).
const double _kScreenUtilMaxWidth = 600;
const double _kScreenUtilMaxHeight = 960;

class CustomScreenUtil extends StatelessWidget {
  final Widget child;
  final bool enabledPreview;

  const CustomScreenUtil({
    required this.child,
    required this.enabledPreview,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final realSize = mediaQuery.size;
    final clampedSize = Size(
      realSize.width > _kScreenUtilMaxWidth
          ? _kScreenUtilMaxWidth
          : realSize.width,
      realSize.height > _kScreenUtilMaxHeight
          ? _kScreenUtilMaxHeight
          : realSize.height,
    );

    return MediaQuery(
      data: mediaQuery.copyWith(size: clampedSize),
      child: ScreenUtilInit(
        designSize: const Size(375, 812),
        minTextAdapt: true,
        splitScreenMode: true,
        child: child,
      ),
    );
  }
}
