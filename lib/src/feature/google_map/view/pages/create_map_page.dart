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
import 'package:agro_employee_public/design_system/theme/colors.dart'
    as DesignColors;
import 'package:agro_employee_public/design_system/theme/radius.dart';
import 'package:agro_employee_public/design_system/theme/spacing.dart';
import 'package:agro_employee_public/design_system/theme/typography.dart';

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
      backgroundColor: DesignColors.AppColors.darkBackground,
      appBar: CustomAppBarWidget(
        title: "Xarita",
        canPop: true,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: FilledButton.icon(
              onPressed: () {
                if (vm.polylineCoordinates.length < 3) {
                  Utils.fireTopSnackBar(
                      "Madyon to'gri kiritilmadi", AppColors.cE60C0C, context);
                } else {
                  // Валидация координат с учетом limit_km (включает проверку currentLocation)
                  final validationError = vm.validateCoordinatesWithLimit(
                      vm.polylineCoordinates, vm.currentLocation);
                  if (validationError != null) {
                    Utils.fireTopSnackBar(
                        validationError, AppColors.cE60C0C, context);
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
              icon: const Icon(Icons.arrow_forward_rounded, size: 20),
              label: const Text("Keyingi"),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.md,
                ),
                backgroundColor: DesignColors.AppColors.primary,
                foregroundColor: Colors.white,
              ),
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
            polygons: {
              ...vm.polygons,
              ...vm.nearbyPolygons
            }, // Объединяем полигоны пользователя и соседних плантаций
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
            Positioned(
              top: 24,
              left: 16,
              right: 16,
              child: Material(
                color: Colors.transparent,
                child: Container(
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surface,
                    borderRadius: BorderRadius.circular(AppRadius.card),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.25),
                        blurRadius: 20,
                        offset: const Offset(0, 12),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(AppSpacing.sm),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  DesignColors.AppColors.primary,
                                  DesignColors.AppColors.primaryDark,
                                ],
                              ),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.map_outlined,
                              color: Colors.white,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: AppSpacing.md),
                          Expanded(
                            child: Text(
                              vm.selectedPlantation!
                                      .getDisplayFarmerName()
                                      .trim()
                                      .isNotEmpty
                                  ? vm.selectedPlantation!
                                      .getDisplayFarmerName()
                                  : 'Plantatsiya #${vm.selectedPlantation!.id}',
                              style: AppTypography.headlineMedium(context)
                                  .copyWith(fontWeight: FontWeight.w700),
                            ),
                          ),
                          IconButton(
                            onPressed: vm.closePlantationDialog,
                            icon: const Icon(Icons.close),
                            splashRadius: 20,
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Wrap(
                        spacing: AppSpacing.md,
                        runSpacing: AppSpacing.sm,
                        children: [
                          _buildChip(
                            context,
                            label: 'ID',
                            value: '${vm.selectedPlantation!.id}',
                            icon: Icons.numbers,
                          ),
                          _buildChip(
                            context,
                            label: 'Maydon',
                            value: vm.selectedPlantation!.getDisplayArea(),
                            icon: Icons.landscape_outlined,
                          ),
                          _buildChip(
                            context,
                            label: 'Status',
                            value: vm.selectedPlantation!.isChecked
                                ? 'Tekshirilgan'
                                : 'Tekshirilmagan',
                            icon: vm.selectedPlantation!.isChecked
                                ? Icons.verified_outlined
                                : Icons.hourglass_bottom_outlined,
                            color: vm.selectedPlantation!.isChecked
                                ? DesignColors.AppColors.success
                                : DesignColors.AppColors.warning,
                          ),
                          if (vm.selectedPlantation!
                              .getDisplayKonturNumbers()
                              .trim()
                              .isNotEmpty)
                            _buildChip(
                              context,
                              label: 'Kontur',
                              value: vm.selectedPlantation!
                                  .getDisplayKonturNumbers(),
                              icon: Icons.schema_outlined,
                            ),
                          _buildChip(
                            context,
                            label: 'Nuqtalar',
                            value:
                                '${vm.selectedPlantation!.coordinates.length} ta',
                            icon: Icons.straighten_outlined,
                          ),
                        ],
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

  Widget _buildChip(
    BuildContext context, {
    required String label,
    required String value,
    required IconData icon,
    Color? color,
  }) {
    final scheme = Theme.of(context).colorScheme;
    final accent = color ?? scheme.primary;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: accent.withOpacity(0.12),
        borderRadius: BorderRadius.circular(AppRadius.chip),
        border: Border.all(color: accent.withOpacity(0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: accent),
          const SizedBox(width: AppSpacing.xs),
          Text(
            '$label: ',
            style: AppTypography.bodySmall(context).copyWith(
              color: accent,
              fontWeight: FontWeight.w600,
            ),
          ),
          Flexible(
            child: Text(
              value,
              style: AppTypography.bodySmall(context).copyWith(
                color: scheme.onSurface,
                fontWeight: FontWeight.w600,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRowNew(
    BuildContext context,
    String label,
    String value,
    IconData icon, {
    Color? statusColor,
  }) {
    final colorScheme = Theme.of(context).colorScheme;
    final accentColor = statusColor ?? DesignColors.AppColors.primary;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: accentColor.withOpacity(0.08),
        borderRadius: BorderRadius.circular(AppRadius.sm),
        border: Border.all(color: accentColor.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.xs),
            decoration: BoxDecoration(
              color: accentColor.withOpacity(0.15),
              borderRadius: BorderRadius.circular(AppRadius.chip),
            ),
            child: Icon(icon, size: 18, color: accentColor),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: AppTypography.bodySmall(context).copyWith(
                    color: colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: AppTypography.bodyMedium(context).copyWith(
                    color: colorScheme.onSurface,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
