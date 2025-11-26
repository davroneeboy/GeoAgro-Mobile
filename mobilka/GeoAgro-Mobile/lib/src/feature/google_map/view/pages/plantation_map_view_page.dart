import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../../core/widgets/custom_app_bar_widget.dart';
import '../../../../core/style/app_colors.dart';
import '../../../../../design_system/theme/colors.dart' as DesignColors;
import '../../vm/plantation_map_view_vm.dart';

final plantationMapViewVM = ChangeNotifierProvider.autoDispose.family<PlantationMapViewVm, int>((ref, id) {
  return PlantationMapViewVm(id);
});

class PlantationMapViewPage extends ConsumerStatefulWidget {
  final int plantationId;
  const PlantationMapViewPage({super.key, required this.plantationId});

  @override
  ConsumerState<PlantationMapViewPage> createState() => _PlantationMapViewPageState();
}

class _PlantationMapViewPageState extends ConsumerState<PlantationMapViewPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final vm = ref.read(plantationMapViewVM(widget.plantationId));
      vm.loadRelatedPlantations();
    });
  }

  @override
  Widget build(BuildContext context) {
    final vm = ref.watch(plantationMapViewVM(widget.plantationId));
    
    return Scaffold(
      backgroundColor: DesignColors.AppColors.darkBackground,
      appBar: const CustomAppBarWidget(
        title: "Xarita",
        canPop: true,
      ),
      body: vm.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.c28A745))
          : vm.errorMessage != null
              ? Center(
                  child: Padding(
                    padding: EdgeInsets.all(32.w),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.error_outline, size: 64.sp, color: AppColors.cE60C0C),
                        16.verticalSpace,
                        Text(
                          vm.errorMessage!,
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 16.sp, color: AppColors.c1E1E1E),
                        ),
                        24.verticalSpace,
                        ElevatedButton.icon(
                          onPressed: vm.loadRelatedPlantations,
                          icon: const Icon(Icons.refresh),
                          label: const Text("Qayta urinish"),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.c28A745,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : Stack(
                  children: [
                    GoogleMap(
                      initialCameraPosition: CameraPosition(
                        target: vm.initialPosition,
                        zoom: 14,
                      ),
                      onMapCreated: vm.onMapCreated,
                      mapType: MapType.satellite,
                      zoomControlsEnabled: false,
                      polygons: vm.polygons,
                      polylines: vm.polylines,
                      markers: vm.markers,
                    ),
                    
                    // Area and perimeter info overlay
                    if (vm.currentPlantation != null && vm.currentPlantation!.coordinates.isNotEmpty)
                      Positioned(
                        top: 16.h,
                        left: 16.w,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.9),
                                borderRadius: BorderRadius.circular(8.r),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black12,
                                    blurRadius: 4,
                                    offset: Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Text(
                                'Maydon: ${vm.currentPlantation!.totalArea?.toStringAsFixed(2) ?? 0} GA',
                                style: TextStyle(
                                  color: Colors.black,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16.sp,
                                ),
                              ),
                            ),
                            8.verticalSpace,
                            Container(
                              padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.9),
                                borderRadius: BorderRadius.circular(8.r),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black12,
                                    blurRadius: 4,
                                    offset: Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Text(
                                'Узунлик: ${vm.calculatePerimeter(vm.currentPlantation!.coordinates).toStringAsFixed(2)} м',
                                style: TextStyle(
                                  color: Colors.black,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16.sp,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    
                    // Legend at the bottom
                    Positioned(
                      bottom: 16.h,
                      left: 16.w,
                      child: Container(
                        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.9),
                          borderRadius: BorderRadius.circular(8.r),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black12,
                              blurRadius: 4,
                              offset: Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _buildLegendItem(
                              color: AppColors.c28A745,
                              label: "Тасдиқланган",
                            ),
                            16.horizontalSpace,
                            _buildLegendItem(
                              color: Colors.yellow.shade700,
                              label: "Тасдиқланмаган",
                            ),
                            16.horizontalSpace,
                            _buildLegendItem(
                              color: AppColors.cE60C0C,
                              label: "Рад этилган",
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildLegendItem({required Color color, required String label}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 16.w,
          height: 16.h,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        6.horizontalSpace,
        Text(
          label,
          style: TextStyle(
            fontSize: 14.sp,
            fontWeight: FontWeight.w500,
            color: AppColors.c1E1E1E,
          ),
        ),
      ],
    );
  }
}

