import "package:flutter/material.dart";
import "package:flutter_screenutil/flutter_screenutil.dart";

/// Базовый дизайн-размер — во сколько раз screenWidth/designSize.width
/// масштабирует все .sp/.w/.h в проекте.
const Size _kBaseDesignSize = Size(375, 812);

/// Выше этой физической ширины экрана designSize.width растягивается
/// вместе с реальным экраном (см. _effectiveDesignSize) — так
/// scaleWidth (screenWidth / designSize.width) перестаёт расти после
/// этого порога вместо продолжения линейного роста, и весь
/// существующий .sp/.w/.h-код в проекте (сотни мест, задуман под
/// designSize 375x812) не раздувается на планшете.
///
/// ВАЖНО: flutter_screenutil (эта версия, 5.9.3) берёт физический
/// размер экрана напрямую через View.maybeOf(context) внутри самого
/// ScreenUtilInit — НЕ через BuildContext.dependOnInheritedWidgetOfExactType
/// (MediaQuery.of). Обёртка MediaQuery вокруг/внутри ScreenUtilInit
/// поэтому не оказывает на scale-расчёт никакого эффекта — единственный
/// рычаг влияния на масштаб есть designSize, отсюда его динамический
/// пересчёт вместо клэмпа MediaQuery.
const double _kWideScreenThreshold = 600;

class CustomScreenUtil extends StatelessWidget {
  final Widget child;
  final bool enabledPreview;

  const CustomScreenUtil({
    required this.child,
    required this.enabledPreview,
    super.key,
  });

  Size _effectiveDesignSize(BuildContext context) {
    // Тот же физический размер, что использует ScreenUtilInit внутри
    // себя (View.maybeOf) — MediaQuery здесь читается только чтобы
    // получить актуальную ширину экрана ДО того, как ScreenUtilInit
    // построится, не для влияния на его внутренний расчёт.
    final width = MediaQuery.of(context).size.width;
    if (width <= _kWideScreenThreshold) {
      return _kBaseDesignSize;
    }
    final ratio = width / _kWideScreenThreshold;
    return Size(
      _kBaseDesignSize.width * ratio,
      _kBaseDesignSize.height * ratio,
    );
  }

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: _effectiveDesignSize(context),
      minTextAdapt: true,
      splitScreenMode: true,
      child: child,
    );
  }
}
