import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/style/app_colors.dart';
import '../../../../../design_system/theme/colors.dart' as DesignColors;
import '../../vm/create_map_page_vm.dart';

class CreateMapPageButtonWidgets extends StatelessWidget {
  final CreateMapPageVm vm;
  const CreateMapPageButtonWidgets({super.key, required this.vm});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Кнопка "Мое местоположение" - приближать на локацию пользователя
        FloatingActionButton(
          heroTag: 'mapFab_location',
          backgroundColor: DesignColors.AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 6,
          onPressed: () async {
            await vm.getCurrentLocation();
          },
          child: vm.isLoading
              ? Center(
                  child: Padding(
                    padding: REdgeInsets.all(4),
                    child: const CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2.5,
                    ),
                  ),
                )
              : const Icon(Icons.my_location, size: 24),
        ),
        const SizedBox(height: 10),
        // Кнопка "Добавить точку" - всегда доступна для добавления точек
        FloatingActionButton(
          heroTag: 'mapFab_add_point',
          backgroundColor: Colors.blue,
          foregroundColor: Colors.white,
          onPressed: () {
            vm.addPointAtRulerPosition();
          },
          child: const Icon(Icons.add),
        ),
        const SizedBox(height: 10),
        // Кнопка "Отменить последнюю точку" - возвращать чертеж на шаг назад
        if (vm.drawingPoints.isNotEmpty)
          FloatingActionButton(
            heroTag: 'mapFab_undo',
            backgroundColor: DesignColors.AppColors.darkSurface,
            foregroundColor: AppColors.c1E1E1E,
            onPressed: () {
              vm.removeLastPoint();
            },
            child: const Icon(Icons.undo),
          ),
      ],
    );
  }
}