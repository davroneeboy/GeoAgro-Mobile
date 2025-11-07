import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../../core/routes/app_route_names.dart';
import '../../../../core/utils/utils.dart';
import '../../../../core/widgets/custom_app_bar_widget.dart';
import '../../vm/create_map_page_vm.dart';
import '../../../../core/style/app_colors.dart';
import '../widgets/create_map_page_button_widgets.dart';
import '../widgets/center_ruler_widget.dart';

final mapPageVM = ChangeNotifierProvider.autoDispose<CreateMapPageVm>((ref) {
  return CreateMapPageVm();
});

class CreateMapPage extends ConsumerStatefulWidget {
  final int farmerId;
  const CreateMapPage({super.key, required this.farmerId});

  @override
  ConsumerState<CreateMapPage> createState() => _CreateMapPageState();
}

class _CreateMapPageState extends ConsumerState<CreateMapPage> {
  @override
  void initState() {
    super.initState();
    log("${widget.farmerId}");
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final vm = ref.read(mapPageVM);
      vm.getCurrentLocation();
    });
  }

  @override
  Widget build(BuildContext context) {
    final vm = ref.watch(mapPageVM);
    return Scaffold(
      backgroundColor: AppColors.cF7F7F7,
      appBar: CustomAppBarWidget(
        title: "Xarita",
        canPop: true,
        actions: [
          IconButton(
            onPressed: () {
              if (vm.polylineCoordinates.length < 3) {
                Utils.fireTopSnackBar(
                    "Madyon to'gri kiritilmadi", AppColors.cE60C0C, context);
              } else {
                // Валидация координат с учетом limit_km (включает проверку currentLocation)
                final validationError = vm.validateCoordinatesWithLimit(
                    vm.polylineCoordinates, vm.currentLocation);
                if (validationError != null) {
                  Utils.fireTopSnackBar(validationError, AppColors.cE60C0C, context);
                } else if (vm.checkPolygonOverlap()) {
                  Utils.fireTopSnackBar(
                      "Plantatsiya boshqa plantatsiyalar ustiga chizilgan. Iltimos, boshqa joy tanlang",
                      AppColors.cE60C0C,
                      context);
                } else {
                final value = vm.cordinatesConverter();

                final model = {
                  "farmerId": widget.farmerId,
                  "coordinates": value,
                  "latLon": vm.polylineCoordinates,
                  "polygonArea": vm.polygonAreaHectares,
                };
                context.push(
                  "/${AppRouteNames.farmers}/${AppRouteNames.googleMaps}/${AppRouteNames.detailPage}",
                  extra: model,
                );
                }
              }
            },
            icon: Icon(
              Icons.done_rounded,
              color: AppColors.c1E1E1E,
              size: 16.sp,
            ),
          )
        ],
      ),
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: CameraPosition(
              target: vm.currentLocation ?? vm.uzbLatLng,
              zoom: 10,
            ),
            onMapCreated: vm.onMapCreated,
            mapType: MapType.satellite,
            zoomControlsEnabled: false,
            polylines: vm.polylines,
            polygons: {...vm.polygons, ...vm.nearbyPolygons}, // Объединяем полигоны пользователя и соседних плантаций
            markers: vm.markers,
            onTap: vm.onTap,
          ),
          
          // Legend for plantation statuses - moved to bottom left
          Positioned(
            bottom: 100,
            left: 16,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.9),
                borderRadius: BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Статус плантаций:',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _buildLegendItem('Проверена', Colors.green),
                  _buildLegendItem('Не проверена', Colors.orange),
                ],
              ),
            ),
          ),
          
          // Простое отображение площади в левом верхнем углу
          if (vm.drawingPoints.isNotEmpty && vm.drawingPoints.length >= 3)
            Positioned(
              top: 16,
              left: 16,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.9),
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Text(
                  '${vm.getPolygonArea().toStringAsFixed(2)} га',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
              ),
            ),
          
          // Отладочная информация о плантациях
          if (vm.userPlantations.isNotEmpty)
            Positioned(
              top: 60,
              left: 16,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.blue.withValues(alpha: 0.9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Плантаций: ${vm.userPlantations.length}, Полигонов: ${vm.nearbyPolygons.length}',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          
          // Индикатор загрузки плантаций
          if (vm.isLoadingNearby)
            Positioned(
              top: 16,
              right: 16,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.9),
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.blue),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Загрузка плантаций...',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          
          // Белая круглая линейка в центре экрана (всегда видна)
          CenterRulerWidget(isDrawingMode: vm.isDrawingMode),

          // Диалог с информацией о плантации
          if (vm.showPlantationDialog && vm.selectedPlantation != null)
            Container(
              color: Colors.black54,
              child: Center(
                child: Container(
                  margin: EdgeInsets.all(20),
                  padding: EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Информация о плантации',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          IconButton(
                            onPressed: vm.closePlantationDialog,
                            icon: Icon(Icons.close),
                          ),
                        ],
                      ),
                      SizedBox(height: 16),
                      _buildInfoRow('ID:', '${vm.selectedPlantation!.id}'),
                      _buildInfoRow('Фермер:', vm.selectedPlantation!.getDisplayFarmerName()),
                      _buildInfoRow('Площадь:', vm.selectedPlantation!.getDisplayArea()),
                      _buildInfoRow('Статус:', vm.selectedPlantation!.isChecked ? 'Проверена' : 'Не проверена'),
                      _buildInfoRow('Контуры:', vm.selectedPlantation!.getDisplayKonturNumbers()),
                      _buildInfoRow('Координат:', '${vm.selectedPlantation!.coordinates.length}'),
                      SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: vm.closePlantationDialog,
                          child: Text('Закрыть'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

        ],
      ),
      floatingActionButton: CreateMapPageButtonWidgets(vm: vm),
    );
  }

  Widget _buildLegendItem(String label, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.7),
              border: Border.all(color: color, width: 1),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.black87,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}
