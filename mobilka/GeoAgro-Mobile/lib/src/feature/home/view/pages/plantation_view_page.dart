import 'dart:convert';

import 'package:agro_employee_public/design_system/components/cards.dart';
import 'package:agro_employee_public/design_system/templates/screen_shells.dart';
import 'package:agro_employee_public/design_system/theme/colors.dart'
    as DesignColors;
import 'package:agro_employee_public/design_system/theme/radius.dart';
import 'package:agro_employee_public/design_system/theme/spacing.dart';
import 'package:agro_employee_public/design_system/theme/typography.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../../core/setting/setup.dart';
import '../../../../core/routes/app_route_names.dart';
import '../../../../data/model/plantation/edit_plantation.dart';
import '../../../../data/model/plantation/comment_model.dart';
import '../../../../data/repository/app_repository_impl.dart';
import 'package:agro_employee_public/src/feature/google_map/vm/plantation_map_view_vm.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

final plantationViewVM = ChangeNotifierProvider.autoDispose
    .family<_PlantationViewVm, int>((ref, id) {
  return _PlantationViewVm(id);
});

final plantationMapMiniVM = ChangeNotifierProvider.autoDispose
    .family<PlantationMapViewVm, int>((ref, id) {
  final vm = PlantationMapViewVm(id);
  ref.onDispose(vm.dispose);
  return vm;
});

class _PlantationViewVm extends ChangeNotifier {
  final AppRepositoryImpl _repo = AppRepositoryImpl();
  final int plantationId;

  bool isLoading = true;
  String? errorMessage;
  EditPlantationModel? plantation;

  _PlantationViewVm(this.plantationId) {
    _loadPlantation();
  }

  Future<void> _loadPlantation() async {
    try {
      isLoading = true;
      errorMessage = null;
      notifyListeners();

      final data = await _repo.getPlantationDetail(id: plantationId);
      if (data == null) {
        errorMessage = "Ma'lumotlar topilmadi";
      } else {
        plantation = editPlantationModelFromJson(data);
      }
    } catch (e) {
      errorMessage = "Xatolik yuz berdi: $e";
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void retry() => _loadPlantation();
}

class PlantationViewPage extends ConsumerStatefulWidget {
  final int id;
  const PlantationViewPage({super.key, required this.id});

  @override
  ConsumerState<PlantationViewPage> createState() => _PlantationViewPageState();
}

class _PlantationViewPageState extends ConsumerState<PlantationViewPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Перезагружаем данные плантации при открытии страницы
      ref.read(plantationViewVM(widget.id)).retry();
      // Перезагружаем координаты для карты
      ref.read(plantationMapMiniVM(widget.id)).loadRelatedPlantations();
    });
  }

  /// Пытается инициализировать карту с координатами из детальной информации
  Future<void> _tryInitializeMapFromDetail(int? plantationId) async {
    if (plantationId == null) {
      debugPrint("[PlantationViewPage] Plantation ID is null");
      return;
    }
    
    try {
      debugPrint("[PlantationViewPage] Trying to initialize map from detail for ID: $plantationId");
      final repo = AppRepositoryImpl();
      final data = await repo.getPlantationDetail(id: plantationId);
      if (data != null) {
        debugPrint("[PlantationViewPage] Got detail data, length: ${data.length}");
        final jsonData = jsonDecode(data);
        debugPrint("[PlantationViewPage] Parsed JSON, keys: ${jsonData.keys}");
        
        if (jsonData['coordinates'] != null) {
          debugPrint("[PlantationViewPage] Coordinates found in response");
          final mapVm = ref.read(plantationMapMiniVM(widget.id));
          mapVm.initializeFromDetailData(jsonData);
        } else {
          debugPrint("[PlantationViewPage] No coordinates in detail response");
        }
      } else {
        debugPrint("[PlantationViewPage] Detail data is null");
      }
    } catch (e, stackTrace) {
      debugPrint("[PlantationViewPage] Error initializing map from detail: $e");
      debugPrint("[PlantationViewPage] Stack trace: $stackTrace");
    }
  }

  Widget _buildSummaryHighlights(
    BuildContext context,
    List<_InfoEntry> entries,
  ) {
    if (entries.isEmpty) return const SizedBox.shrink();

    return Row(
      children: [
        for (int i = 0; i < entries.length; i++) ...[
          Expanded(
            child: Container(
              margin: EdgeInsets.only(
                right: i == entries.length - 1 ? 0 : AppSpacing.md,
              ),
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.16),
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (entries[i].icon != null) ...[
                    Icon(
                      entries[i].icon,
                      size: 18,
                      color: Colors.white.withOpacity(0.85),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                  ],
                  Text(
                    entries[i].label,
                    style: AppTypography.bodySmall(context).copyWith(
                      color: Colors.white.withOpacity(0.72),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    entries[i].value,
                    style: AppTypography.bodyLarge(context).copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }

  String _formatNumber(dynamic value) {
    if (value == null) return "0";
    if (value is double) {
      return value == value.toInt().toDouble()
          ? value.toInt().toString()
          : value.toStringAsFixed(2);
    }
    if (value is int) {
      return value.toString();
    }
    return value.toString();
  }

  Widget _buildCommentsList(BuildContext context, List<Comment> comments, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ...comments.map((comment) => _buildCommentCard(context, comment, isDark)),
        SizedBox(height: 16.h),
        _buildAddCommentButton(context),
      ],
    );
  }

  Widget _buildCommentCard(BuildContext context, Comment comment, bool isDark) {
    final theme = Theme.of(context);
    String formattedDate = '';
    try {
      final date = DateTime.parse(comment.createdAt);
      formattedDate = DateFormat('dd.MM.yyyy HH:mm').format(date);
    } catch (e) {
      formattedDate = comment.createdAt;
    }

    return Container(
      margin: EdgeInsets.only(bottom: 12.h),
      padding: EdgeInsets.all(16.h),
      decoration: BoxDecoration(
        color: isDark
            ? DesignColors.AppColors.darkSurface
            : DesignColors.AppColors.lightSurface,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(
          color: isDark
              ? DesignColors.AppColors.darkOutline
              : DesignColors.AppColors.lightOutline,
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (comment.isModeration)
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
                  decoration: BoxDecoration(
                    color: Colors.orange.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(4.r),
                  ),
                  child: Text(
                    "Moderatsiya",
                    style: TextStyle(
                      fontSize: 11.sp,
                      color: Colors.orange,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              if (comment.isModeration) SizedBox(width: 8.w),
              Expanded(
                child: Text(
                  formattedDate,
                  style: AppTypography.bodySmall(context).copyWith(
                    fontSize: 12.sp,
                    color: isDark
                        ? DesignColors.AppColors.darkOnSurfaceVariant
                        : theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
            ],
          ),
          if (comment.createdBy != null) ...[
            SizedBox(height: 4.h),
            Text(
              comment.createdBy!.fullName,
              style: AppTypography.bodySmall(context).copyWith(
                fontSize: 12.sp,
                color: isDark
                    ? DesignColors.AppColors.darkOnSurfaceVariant
                    : theme.colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
          SizedBox(height: 8.h),
          Text(
            comment.body,
            style: AppTypography.bodyMedium(context).copyWith(
              fontSize: 14.sp,
              color: isDark
                  ? DesignColors.AppColors.darkOnSurface
                  : DesignColors.AppColors.lightOnSurface,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddCommentButton(BuildContext context) {
    return Consumer(
      builder: (context, ref, child) {
        final vm = ref.watch(plantationViewVM(widget.id));
        return _AddCommentWidget(plantationId: widget.id, vm: vm);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final detailVm = ref.watch(plantationViewVM(widget.id));
    final mapVm = ref.watch(plantationMapMiniVM(widget.id));

    final isLoading = detailVm.isLoading;
    final hasError = detailVm.errorMessage != null;
    final plantation = detailVm.plantation;
    final statusData = _resolveStatus(
      mapVm.currentPlantation,
      Theme.of(context).colorScheme,
    );

    Widget? summaryCard;
    List<_InfoEntry> baseEntries = const [];
    List<DetailSection> sections = const [];

    if (!isLoading && !hasError && plantation != null) {
      // Пытаемся использовать координаты из детальной информации для немедленного отображения
      if (mapVm.currentPlantation == null && !mapVm.isLoading) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          // Пытаемся получить координаты из ответа API детальной информации
          _tryInitializeMapFromDetail(plantation.id);
          
          // Также загружаем координаты через стандартный endpoint, если инициализация не удалась
          Future.delayed(const Duration(milliseconds: 500), () {
            if (mapVm.currentPlantation == null && !mapVm.isLoading) {
              mapVm.loadRelatedPlantations();
            }
          });
        });
      }
      
      baseEntries = _buildBaseEntries(context, plantation, mapVm);
      summaryCard = _buildSummaryCard(
        context: context,
        plantation: plantation,
        mapVm: mapVm,
        statusData: statusData,
      );
      sections = _buildDetailSections(
        context: context,
        plantation: plantation,
        mapVm: mapVm,
        baseEntries: baseEntries,
        statusData: statusData,
      );
    }

    return DetailScreenShell(
      title: "Plantatsiya ma'lumotlari",
      isLoading: isLoading,
      hasError: hasError,
      errorMessage: detailVm.errorMessage,
      onRetry: detailVm.retry,
      summaryCard: summaryCard,
      sections: sections.isEmpty ? null : sections,
    );
  }

  List<_InfoEntry> _buildBaseEntries(
    BuildContext context,
    EditPlantationModel plantation,
    PlantationMapViewVm mapVm,
  ) {
    final entries = <_InfoEntry>[
      if (plantation.id != null)
        _InfoEntry(
          "Plantatsiya ID",
          plantation.id.toString(),
          Icons.badge_outlined,
        ),
      if (plantation.gardenEstablishedYear != null)
        _InfoEntry(
          "Bog' tashkil topgan yil",
          plantation.gardenEstablishedYear.toString(),
          Icons.calendar_month_outlined,
        ),
      if (plantation.plantationType != null)
        _InfoEntry(
          "Plantatsiya turi",
          plantatiopnType[plantation.plantationType] ?? "Noma'lum",
          Icons.category_outlined,
        ),
      if (_resolveTypeChoiceLabel(plantation) != null)
        _InfoEntry(
          "Yo'nalish",
          _resolveTypeChoiceLabel(plantation)!,
          Icons.style_outlined,
        ),
      if (_resolveSubtypeLabel(plantation) != null)
        _InfoEntry(
          "Subtype",
          _resolveSubtypeLabel(plantation)!,
          Icons.bubble_chart_outlined,
        ),
      _InfoEntry(
        "Umumiy maydon",
        "${_formatNumber(plantation.totalArea)} GA",
        Icons.square_foot_outlined,
      ),
      _InfoEntry(
        "Sug'oriladigan maydon",
        "${_formatNumber(plantation.irrigationArea)} GA",
        Icons.water_drop_outlined,
      ),
      _InfoEntry(
        "Bo'sh maydon",
        "${_formatNumber(plantation.emptyArea)} GA",
        Icons.crop_square_outlined,
      ),
      _InfoEntry(
        "Yaroqsiz maydon",
        "${_formatNumber(plantation.notUsableArea)} GA",
        Icons.block_outlined,
      ),
      if (plantation.landType != null)
        _InfoEntry(
          "Yer turi",
          yerTuri[plantation.landType] ?? "Noma'lum",
          Icons.terrain_outlined,
        ),
      if (plantation.fertilityScore != null)
        _InfoEntry(
          "Banitet bali",
          plantation.fertilityScore!.toStringAsFixed(1),
          Icons.leaderboard_outlined,
        ),
      _InfoEntry(
        "Unumdormi",
        plantation.isFertile == true ? "Ha" : "Yo'q",
        plantation.isFertile == true
            ? Icons.check_circle
            : Icons.cancel_outlined,
      ),
      if (plantation.irrigationSystemsCount != null)
        _InfoEntry(
          "Sug'orish tizimlari",
          plantation.irrigationSystemsCount.toString(),
          Icons.precision_manufacturing_outlined,
        ),
    ];

    return entries;
  }

  Widget _buildSummaryCard({
    required BuildContext context,
    required EditPlantationModel plantation,
    required PlantationMapViewVm mapVm,
    required MapEntry<String, Color> statusData,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final name = mapVm.currentPlantation?.name?.trim();
    final title = (name != null && name.isNotEmpty)
        ? name
        : "Plantatsiya #${plantation.id ?? widget.id}";

    final descriptionParts = <String>[];
    final typeLabel = plantatiopnType[plantation.plantationType];
    if (typeLabel != null) descriptionParts.add(typeLabel);
    final direction = _resolveTypeChoiceLabel(plantation);
    if (direction != null) descriptionParts.add(direction);
    if (plantation.gardenEstablishedYear != null) {
      descriptionParts.add("${plantation.gardenEstablishedYear} yil");
    }

    final highlightEntries = <_InfoEntry>[
      _InfoEntry(
        "Umumiy maydon",
        "${_formatNumber(plantation.totalArea)} GA",
        Icons.square_foot_outlined,
      ),
      _InfoEntry(
        "Sug'oriladigan maydon",
        "${_formatNumber(plantation.irrigationArea)} GA",
        Icons.water_drop_outlined,
      ),
      if (mapVm.currentPlantation?.coordinates.isNotEmpty ?? false)
        _InfoEntry(
          "Koordinatalar",
          mapVm.currentPlantation!.coordinates.length.toString(),
          Icons.straighten_outlined,
        ),
    ];

    final gradientColors = isDark
        ? [
            DesignColors.AppColors.primaryDark.withOpacity(0.9),
            DesignColors.AppColors.primary.withOpacity(0.75),
          ]
        : [
            DesignColors.AppColors.primary,
            DesignColors.AppColors.primaryDark,
          ];

    return AppCardElevated(
      padding: EdgeInsets.zero,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: gradientColors,
          ),
          borderRadius: BorderRadius.circular(AppRadius.card),
        ),
        padding: const EdgeInsets.all(AppSpacing.cardPadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: AppTypography.displaySmall(context).copyWith(
                          color: Colors.white,
                        ),
                      ),
                      if (descriptionParts.isNotEmpty) ...[
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          descriptionParts.join(" • "),
                          style: AppTypography.bodyMedium(context).copyWith(
                            color: Colors.white.withOpacity(0.72),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.md,
                    vertical: AppSpacing.xs,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.18),
                    borderRadius: BorderRadius.circular(AppRadius.button),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.verified, size: 18, color: Colors.white),
                      const SizedBox(width: AppSpacing.xs),
                      Text(
                        statusData.key,
                        style: AppTypography.bodyMedium(context).copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            _buildSummaryHighlights(context, highlightEntries),
          ],
        ),
      ),
    );
  }

  List<DetailSection> _buildDetailSections({
    required BuildContext context,
    required EditPlantationModel plantation,
    required PlantationMapViewVm mapVm,
    required List<_InfoEntry> baseEntries,
    required MapEntry<String, Color> statusData,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final sections = <DetailSection>[
      DetailSection(
        title: "Xarita va holat",
        icon: Icons.map_outlined,
        content: _buildMapCard(
          context: context,
          plantation: plantation,
          mapVm: mapVm,
          statusData: statusData,
        ),
      ),
      DetailSection(
        title: "Asosiy ma'lumotlar",
        icon: Icons.info_outline,
        content: _buildMetricsCard(context, baseEntries),
      ),
    ];

    if (plantation.trellises?.isNotEmpty == true) {
      sections.add(
        DetailSection(
          title: "Shpaller",
          icon: Icons.account_tree_outlined,
          content: _buildGroupedCard(
            context,
            plantation.trellises!
                .map((trellis) => [
                      _InfoEntry(
                        "Shpaller turi",
                        _resolveTrellisType(trellis.trellisType),
                        Icons.account_tree_outlined,
                      ),
                      _InfoEntry(
                        "Maydon",
                        "${_formatNumber(trellis.trellisInstalledArea)} GA",
                        Icons.square_foot_outlined,
                      ),
                      if (trellis.trellisCount != null)
                        _InfoEntry(
                          "Soni",
                          trellis.trellisCount.toString(),
                          Icons.countertops_outlined,
                        ),
                    ])
                .toList(),
          ),
        ),
      );
    }

    if (plantation.reservoirs?.isNotEmpty == true) {
      sections.add(
        DetailSection(
          title: "Suv havzalari",
          icon: Icons.water_outlined,
          content: _buildGroupedCard(
            context,
            plantation.reservoirs!
                .map((reservoir) => [
                      _InfoEntry(
                        "Hovuz turi",
                        _resolveReservoirType(reservoir.reservoirType),
                        Icons.pool_outlined,
                      ),
                      _InfoEntry(
                        "Hajm",
                        "${reservoir.reservoirVolume ?? 0} m³",
                        Icons.opacity_outlined,
                      ),
                    ])
                .toList(),
          ),
        ),
      );
    }

    if (plantation.investments?.isNotEmpty == true) {
      sections.add(
        DetailSection(
          title: "Investitsiyalar",
          icon: Icons.account_balance_wallet_outlined,
          content: _buildGroupedCard(
            context,
            plantation.investments!
                .map((investment) => [
                      _InfoEntry(
                        "Turi",
                        investment.investType == 1 ? "Mahalliy" : "Xorijiy",
                        Icons.flag_outlined,
                      ),
                      _InfoEntry(
                        "Miqdor",
                        "${_formatNumber(investment.investmentAmount)} UZS",
                        Icons.attach_money_outlined,
                      ),
                    ])
                .toList(),
          ),
        ),
      );
    }

    if (plantation.subsidies?.isNotEmpty == true) {
      sections.add(
        DetailSection(
          title: "Subsidiyalar",
          icon: Icons.card_giftcard_outlined,
          content: _buildGroupedCard(
            context,
            plantation.subsidies!
                .map((subsidy) => [
                      if (subsidy.year != null)
                        _InfoEntry(
                          "Yil",
                          subsidy.year.toString(),
                          Icons.event_outlined,
                        ),
                      if (subsidy.contractNumber != null)
                        _InfoEntry(
                          "Shartnoma raqami",
                          subsidy.contractNumber!,
                          Icons.description_outlined,
                        ),
                      _InfoEntry(
                        "Miqdor",
                        "${_formatNumber(subsidy.amount)} UZS",
                        Icons.payments_outlined,
                      ),
                      _InfoEntry(
                        "Samaradorlik",
                        subsidy.efficiency == true ? "Ha" : "Yo'q",
                        subsidy.efficiency == true
                            ? Icons.check_circle_outline
                            : Icons.cancel_outlined,
                      ),
                    ])
                .toList(),
          ),
        ),
      );
    }

    // Добавляем секцию с комментариями, если они есть
    if (plantation.comments != null && plantation.comments!.isNotEmpty) {
      sections.add(
        DetailSection(
          title: "Izohlar",
          icon: Icons.comment_outlined,
          content: _buildCommentsList(context, plantation.comments!, isDark),
        ),
      );
    }

    if (plantation.fruitAreas?.isNotEmpty == true) {
      // Проверяем, есть ли экономически неэффективные зоны
      final inefficientFruits = plantation.fruitAreas!
          .where((fruit) => fruit.iqtisodiysamarasiz == true)
          .toList();
      final hasInefficientAreas = inefficientFruits.isNotEmpty;
      final totalInefficientArea = inefficientFruits
          .fold<double>(
            0.0,
            (sum, fruit) => sum + (fruit.economicInefficientArea ?? 0.0),
          );

      sections.add(
        DetailSection(
          title: "Mevali hududlar",
          icon: Icons.eco_outlined,
          content: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildGroupedCard(
                context,
                plantation.fruitAreas!
                    .map((fruit) => [
                          _InfoEntry(
                            "Meva",
                            fruit.fruitName ?? "Noma'lum",
                            Icons.eco_outlined,
                          ),
                          if (fruit.varietyName != null)
                            _InfoEntry(
                              "Nav",
                              fruit.varietyName!,
                              Icons.local_florist_outlined,
                            ),
                          if (fruit.rootstockName != null)
                            _InfoEntry(
                              "Podvoy",
                              fruit.rootstockName!,
                              Icons.grass_outlined,
                            ),
                          _InfoEntry(
                            "Maydon",
                            "${_formatNumber(fruit.area)} GA",
                            Icons.square_foot_outlined,
                          ),
                          if (fruit.plantedYear != null)
                            _InfoEntry(
                              "Ekilgan yil",
                              fruit.plantedYear.toString(),
                              Icons.date_range_outlined,
                            ),
                          if (fruit.schema != null && fruit.schema!.isNotEmpty)
                            _InfoEntry(
                              "Ekilish sxemasi",
                              fruit.schema!,
                              Icons.grid_view_outlined,
                            ),
                          if (fruit.kochatSoni != null)
                            _InfoEntry(
                              "Ko'chat soni",
                              fruit.kochatSoni.toString(),
                              Icons.spa_outlined,
                            ),
                        ])
                    .toList(),
              ),
              if (hasInefficientAreas) ...[
                const SizedBox(height: AppSpacing.lg),
                _buildInefficientAreaCard(context, totalInefficientArea),
              ],
            ],
          ),
        ),
      );
    }

    if (plantation.images?.isNotEmpty == true) {
      sections.add(
        DetailSection(
          title: "Fotogalereya",
          icon: Icons.photo_library_outlined,
          content: _buildImagesCard(context, plantation.images!),
        ),
      );
    }

    if (sections.isEmpty) {
      sections.add(
        DetailSection(
          title: "Ma'lumotlar",
          icon: Icons.info_outline,
          content: _buildMetricsCard(context, baseEntries),
        ),
      );
    }

    // Add action buttons section
    sections.add(
      DetailSection(
        title: "Harakatlar",
        icon: Icons.settings_outlined,
        content: _buildActionButtons(context, plantation, mapVm),
      ),
    );

    return sections;
  }

  MapEntry<String, Color> _resolveStatus(
    RelatedPlantation? plantation,
    ColorScheme scheme,
  ) {
    if (plantation == null) {
      return MapEntry("Ma'lumot yo'q", scheme.onSurfaceVariant);
    }
    if (plantation.isRejected == true) {
      return MapEntry("Rad etilgan", DesignColors.AppColors.error);
    }
    if (plantation.isChecked == true) {
      return MapEntry("Tasdiqlangan", DesignColors.AppColors.success);
    }
    return MapEntry("Ko'rib chiqilmoqda", DesignColors.AppColors.warning);
  }

  Widget _buildMapCard({
    required BuildContext context,
    required EditPlantationModel plantation,
    required PlantationMapViewVm mapVm,
    required MapEntry<String, Color> statusData,
  }) {
    // Пересчитываем площадь из координат, как и периметр
    final calculatedArea = mapVm.currentPlantation != null &&
            mapVm.currentPlantation!.coordinates.isNotEmpty
        ? mapVm.calculateArea(mapVm.currentPlantation!.coordinates)
        : null;
    final perimeter = mapVm.currentPlantation == null
        ? null
        : mapVm.calculatePerimeter(mapVm.currentPlantation!.coordinates);

    final metrics = <_InfoEntry>[
      _InfoEntry(
        "Holat",
        statusData.key,
        Icons.verified_outlined,
        statusData.value,
      ),
      _InfoEntry(
        "Chegara maydon",
        calculatedArea != null && calculatedArea > 0
            ? "${calculatedArea.toStringAsFixed(2)} GA"
            : "${_formatNumber(plantation.totalArea)} GA",
        Icons.landscape_outlined,
      ),
      if (perimeter != null && perimeter > 0)
        _InfoEntry(
          "Perimetr",
          "${perimeter.toStringAsFixed(2)} m",
          Icons.timeline_outlined,
        ),
      if (mapVm.currentPlantation?.coordinates.isNotEmpty ?? false)
        _InfoEntry(
          "Nuqtalar",
          mapVm.currentPlantation!.coordinates.length.toString(),
          Icons.straighten_outlined,
        ),
    ];

    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.cardPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildMiniMap(context, mapVm, statusData),
          const SizedBox(height: AppSpacing.lg),
          _buildInfoGrid(context, metrics),
          // Блок координат убран по запросу пользователя
        ],
      ),
    );
  }

  Widget _buildMiniMap(
    BuildContext context,
    PlantationMapViewVm mapVm,
    MapEntry<String, Color> statusData,
  ) {
    final borderRadius = BorderRadius.circular(AppRadius.card);
    final colorScheme = Theme.of(context).colorScheme;

    if (mapVm.isLoading) {
      return ClipRRect(
        borderRadius: borderRadius,
        child: Container(
          height: 220,
          color: colorScheme.surfaceVariant,
          alignment: Alignment.center,
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(colorScheme.primary),
          ),
        ),
      );
    }

    if (mapVm.errorMessage != null) {
      return ClipRRect(
        borderRadius: borderRadius,
        child: Container(
          height: 220,
          color: colorScheme.surfaceVariant,
          alignment: Alignment.center,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.map_outlined,
                  size: 36, color: colorScheme.onSurfaceVariant),
              const SizedBox(height: AppSpacing.sm),
              Text(
                mapVm.errorMessage!,
                textAlign: TextAlign.center,
                style: AppTypography.bodySmall(context),
              ),
              const SizedBox(height: AppSpacing.md),
              FilledButton.tonal(
                onPressed: mapVm.loadRelatedPlantations,
                child: const Text("Qayta urinish"),
              ),
            ],
          ),
        ),
      );
    }

    final hasGeometry = mapVm.polygons.isNotEmpty ||
        mapVm.polylines.isNotEmpty ||
        mapVm.markers.isNotEmpty ||
        mapVm.circles.isNotEmpty;

    if (!hasGeometry) {
      return ClipRRect(
        borderRadius: borderRadius,
        child: Container(
          height: 220,
          color: colorScheme.surfaceVariant,
          alignment: Alignment.center,
          child: Text(
            "Koordinatalar topilmadi",
            style: AppTypography.bodyMedium(context),
          ),
        ),
      );
    }

    return ClipRRect(
      borderRadius: borderRadius,
      child: SizedBox(
        height: 220,
        child: _MapGestureHandler(
          child: GoogleMap(
            onMapCreated: mapVm.onMapCreated,
            initialCameraPosition: CameraPosition(
              target: mapVm.initialPosition,
              zoom: 15,
            ),
            mapType: MapType.satellite,
            polygons: mapVm.polygons,
            polylines: mapVm.polylines,
            markers: mapVm.markers,
            circles: mapVm.circles,
            zoomControlsEnabled: true,
            myLocationButtonEnabled: false,
            myLocationEnabled: false,
            mapToolbarEnabled: false,
            rotateGesturesEnabled: true,
            tiltGesturesEnabled: true,
            scrollGesturesEnabled: true,
            zoomGesturesEnabled: true,
            liteModeEnabled: false,
            buildingsEnabled: false,
            trafficEnabled: false,
          ),
        ),
      ),
    );
  }

  // Метод _buildCoordinateSection удален по запросу пользователя

  Widget _buildActionButtons(
    BuildContext context,
    EditPlantationModel plantation,
    PlantationMapViewVm mapVm,
  ) {
    final colorScheme = Theme.of(context).colorScheme;
    final isChecked = mapVm.currentPlantation?.isChecked ?? false;

    return Row(
      children: [
        Expanded(
          child: FilledButton.icon(
            onPressed: isChecked
                ? null
                : () {
                    if (plantation.id != null) {
                      context.go(
                        "${AppRouteNames.home}${AppRouteNames.editPage}",
                        extra: plantation.id,
                      );
                    }
                  },
            icon: const Icon(Icons.edit_outlined, size: 20),
            label: const Text("Tahrirlash"),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(
                vertical: AppSpacing.lg,
              ),
            ),
          ),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: FilledButton.tonalIcon(
            onPressed: () => _handleDelete(context, plantation, mapVm),
            icon: const Icon(Icons.delete_outline, size: 20),
            label: const Text("O'chirish"),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(
                vertical: AppSpacing.lg,
              ),
              backgroundColor: colorScheme.errorContainer,
              foregroundColor: colorScheme.onErrorContainer,
            ),
          ),
        ),
      ],
    );
  }

  void _handleDelete(
    BuildContext context,
    EditPlantationModel plantation,
    PlantationMapViewVm mapVm,
  ) {
    final isChecked = mapVm.currentPlantation?.isChecked ?? false;
    
    // Показываем диалог подтверждения для всех плантаций
    if (!isChecked) {
      // Для неподтвержденных плантаций - простой диалог подтверждения
      _showSimpleDeleteConfirmation(context, plantation);
    } else {
      // Если плантация подтверждена, показываем диалог с запросом на удаление
      _showDeleteConfirmation(context, plantation);
    }
  }

  void _showSimpleDeleteConfirmation(
    BuildContext context,
    EditPlantationModel plantation,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        icon: const Icon(Icons.warning_amber_rounded, size: 48),
        iconColor: Theme.of(context).colorScheme.error,
        title: const Text("Plantatsiyani o'chirish"),
        content: const Text(
          "Haqiqatan ham bu plantatsiyani o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text("Bekor qilish"),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(context).pop();
              _deletePlantation(context, plantation.id);
            },
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text("O'chirish"),
          ),
        ],
      ),
    );
  }

  void _showDeleteConfirmation(
    BuildContext context,
    EditPlantationModel plantation,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        icon: const Icon(Icons.warning_amber_rounded, size: 48),
        iconColor: Theme.of(context).colorScheme.error,
        title: const Text("Plantatsiyani o'chirish"),
        content: Text(
          "Haqiqatan ham bu plantatsiyani o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.",
          style: AppTypography.bodyMedium(context),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text("Bekor qilish"),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(context).pop();
              _deletePlantation(context, plantation.id);
            },
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text("O'chirish"),
          ),
        ],
      ),
    );
  }

  Future<void> _deletePlantation(BuildContext context, int? plantationId) async {
    if (plantationId == null) return;

    try {
      // TODO: Implement actual delete API call
      // final repo = AppRepositoryImpl();
      // await repo.deletePlantation(id: plantationId);
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Plantatsiya muvaffaqiyatli o'chirildi"),
            backgroundColor: DesignColors.AppColors.success,
          ),
        );
        Navigator.of(context).pop(); // Go back to previous screen
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Xatolik: $e"),
            backgroundColor: DesignColors.AppColors.error,
          ),
        );
      }
    }
  }

  // Метод _buildCoordinateChip удален по запросу пользователя

  Widget _buildMetricsCard(
    BuildContext context,
    List<_InfoEntry> entries,
  ) {
    if (entries.isEmpty) {
      return AppCardFilled(
        padding: const EdgeInsets.all(AppSpacing.cardPadding),
        child: Text(
          "Ma'lumot yo'q",
          style: AppTypography.bodyMedium(context),
        ),
      );
    }

    return AppCardFilled(
      padding: const EdgeInsets.all(AppSpacing.cardPadding),
      child: _buildInfoGrid(context, entries),
    );
  }

  Widget _buildGroupedCard(
    BuildContext context,
    List<List<_InfoEntry>> groups,
  ) {
    if (groups.isEmpty) {
      return AppCardFilled(
        padding: const EdgeInsets.all(AppSpacing.cardPadding),
        child: Text(
          "Ma'lumot yo'q",
          style: AppTypography.bodyMedium(context),
        ),
      );
    }

    return AppCardFilled(
      padding: const EdgeInsets.all(AppSpacing.cardPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ...groups.asMap().entries.map((entry) {
            final index = entry.key;
            final items = entry.value;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (index > 0) const Divider(height: 32),
                _buildInfoGrid(context, items),
              ],
            );
          }),
        ],
      ),
    );
  }

  Widget _buildImagesCard(BuildContext context, List<String> images) {
    if (images.isEmpty) {
      return AppCard(
        padding: const EdgeInsets.all(AppSpacing.cardPadding),
        child: Text(
          "Rasmlar mavjud emas",
          style: AppTypography.bodyMedium(context),
        ),
      );
    }

    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.cardPadding),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: images.length,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: AppSpacing.md,
          mainAxisSpacing: AppSpacing.md,
        ),
        itemBuilder: (context, index) {
          final imageUrl = images[index];
          return ClipRRect(
            borderRadius: BorderRadius.circular(AppRadius.sm),
            child: GestureDetector(
              onTap: () => _showImageDialog(context, imageUrl),
              child: Ink.image(
                image: NetworkImage(imageUrl),
                fit: BoxFit.cover,
                child: Container(
                  color: Colors.black.withOpacity(0.04),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildInefficientAreaCard(
    BuildContext context,
    double totalInefficientArea,
  ) {
    return AppCardFilled(
      padding: const EdgeInsets.all(AppSpacing.cardPadding),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: DesignColors.AppColors.warning.withOpacity(0.12),
          borderRadius: BorderRadius.circular(AppRadius.sm),
          border: Border.all(
            color: DesignColors.AppColors.warning.withOpacity(0.3),
            width: 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              Icons.warning_amber_rounded,
              color: DesignColors.AppColors.warning,
              size: 24,
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Iqtisodiy samarasiz maydon",
                    style: AppTypography.bodyMedium(context).copyWith(
                      fontWeight: FontWeight.w600,
                      color: DesignColors.AppColors.warning,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    "${_formatNumber(totalInefficientArea)} GA",
                    style: AppTypography.headlineSmall(context).copyWith(
                      fontWeight: FontWeight.w700,
                      color: DesignColors.AppColors.warning,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoGrid(BuildContext context, List<_InfoEntry> entries) {
    final effectiveEntries =
        entries.where((entry) => entry.value.trim().isNotEmpty).toList();

    if (effectiveEntries.isEmpty) return const SizedBox.shrink();

    return LayoutBuilder(
      builder: (context, constraints) {
        final isTwoColumn = constraints.maxWidth > 360;
        final tileWidth = isTwoColumn
            ? (constraints.maxWidth - AppSpacing.md) / 2
            : constraints.maxWidth;

        return Wrap(
          spacing: AppSpacing.md,
          runSpacing: AppSpacing.md,
          children: effectiveEntries.map((entry) {
            return SizedBox(
              width: tileWidth,
              child: _InfoTile(entry: entry),
            );
          }).toList(),
        );
      },
    );
  }

  String? _resolveTypeChoiceLabel(EditPlantationModel plantation) {
    final typeChoice = plantation.types?.typeChoice;
    if (typeChoice == null) return null;

    switch (plantation.plantationType ?? plantation.types?.plantationType) {
      case 1:
        return bogType[typeChoice];
      case 2:
        return uzumType[typeChoice];
      case 3:
        return issiqxonaType[typeChoice];
      default:
        return null;
    }
  }

  String? _resolveSubtypeLabel(EditPlantationModel plantation) {
    final subtype = plantation.types?.subtype;
    if (subtype == null) return null;
    if ((plantation.plantationType ?? plantation.types?.plantationType) == 1) {
      return bogSubtype[subtype];
    }
    return null;
  }

  String _resolveTrellisType(int? trellisType) {
    switch (trellisType) {
      case 1:
        return "Temir shpaller";
      case 2:
        return "Beton shpaller";
      default:
        return "Noma'lum";
    }
  }

  String _resolveReservoirType(int? type) {
    switch (type) {
      case 1:
        return "Beton suv havzasi";
      case 2:
        return "Qoplamali suv havzasi";
      default:
        return "Noma'lum";
    }
  }

  void _showImageDialog(BuildContext context, String imageUrl) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Stack(
          alignment: Alignment.center,
          children: [
            InteractiveViewer(
              child: Image.network(
                imageUrl,
                fit: BoxFit.contain,
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return Container(
                    width: 240,
                    height: 240,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(AppRadius.modal),
                    ),
                    child: const CircularProgressIndicator(color: Colors.white),
                  );
                },
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    width: 240,
                    height: 240,
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(AppRadius.modal),
                    ),
                    alignment: Alignment.center,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.broken_image,
                            size: 48, color: Colors.white),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          "Rasm yuklanmadi",
                          style: AppTypography.bodyMedium(context).copyWith(
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Positioned(
              top: 16,
              right: 16,
              child: IconButton(
                onPressed: () => Navigator.of(context).pop(),
                style: IconButton.styleFrom(
                  backgroundColor: Colors.black54,
                ),
                icon: const Icon(Icons.close, color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoEntry {
  final String label;
  final String value;
  final IconData? icon;
  final Color? statusColor;

  const _InfoEntry(
    this.label,
    this.value, [
    this.icon,
    this.statusColor,
  ]);
}

class _InfoTile extends StatelessWidget {
  final _InfoEntry entry;

  const _InfoTile({required this.entry});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;
    final accentColor = entry.statusColor ?? colorScheme.primary;
    final backgroundColor = Color.lerp(
          colorScheme.surfaceVariant,
          colorScheme.surface,
          isDark ? 0.15 : 0.55,
        ) ??
        colorScheme.surfaceVariant;
    final labelStyle = AppTypography.bodySmall(context).copyWith(
      fontWeight: FontWeight.w500,
      color: colorScheme.onSurfaceVariant,
    );
    final valueStyle = AppTypography.bodyLarge(context).copyWith(
      fontSize: 16,
      fontWeight: FontWeight.w700,
      color: entry.statusColor ?? colorScheme.onSurface,
    );

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(AppRadius.sm),
        border: Border.all(
          color: colorScheme.outline.withOpacity(isDark ? 0.4 : 0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (entry.icon != null) ...[
                Container(
                  padding: const EdgeInsets.all(AppSpacing.xs),
                  decoration: BoxDecoration(
                    color: accentColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(AppRadius.chip),
                  ),
                  child: Icon(entry.icon, size: 16, color: accentColor),
                ),
                const SizedBox(width: AppSpacing.sm),
              ],
              Expanded(
                child: Text(
                  entry.label,
                  style: labelStyle,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            entry.value,
            style: valueStyle,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _MapGestureHandler extends StatefulWidget {
  final Widget child;

  const _MapGestureHandler({required this.child});

  @override
  State<_MapGestureHandler> createState() => _MapGestureHandlerState();
}

class _MapGestureHandlerState extends State<_MapGestureHandler> {
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onVerticalDragStart: (_) {
        // Блокируем вертикальные жесты, чтобы они не передавались родительскому ScrollView
      },
      onVerticalDragUpdate: (_) {
        // Блокируем вертикальные жесты
      },
      onVerticalDragEnd: (_) {
        // Блокируем вертикальные жесты
      },
      behavior: HitTestBehavior.translucent,
      child: widget.child,
    );
  }
}

class _AddCommentWidget extends ConsumerStatefulWidget {
  final int plantationId;
  final _PlantationViewVm vm;

  const _AddCommentWidget({
    required this.plantationId,
    required this.vm,
  });

  @override
  ConsumerState<_AddCommentWidget> createState() => _AddCommentWidgetState();
}

class _AddCommentWidgetState extends ConsumerState<_AddCommentWidget> {
  final TextEditingController _commentController = TextEditingController();
  bool _isAdding = false;

  Future<void> _addComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty || _isAdding) return;

    setState(() {
      _isAdding = true;
    });

    try {
      final repo = AppRepositoryImpl();
      final response = await repo.addPlantationComment(
        plantationId: widget.plantationId,
        body: text,
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        _commentController.clear();
        // Перезагружаем данные плантации для обновления списка комментариев
        widget.vm.retry();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text("Izoh muvaffaqiyatli qo'shildi"),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text("Xatolik yuz berdi"),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Xatolik: $e"),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isAdding = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: EdgeInsets.all(16.h),
      decoration: BoxDecoration(
        color: isDark
            ? DesignColors.AppColors.darkSurface
            : DesignColors.AppColors.lightSurface,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(
          color: isDark
              ? DesignColors.AppColors.darkOutline
              : DesignColors.AppColors.lightOutline,
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Yangi izoh qo'shish",
            style: AppTypography.headlineSmall(context).copyWith(
              fontSize: 16.sp,
            ),
          ),
          SizedBox(height: 12.h),
          TextField(
            controller: _commentController,
            maxLines: 3,
            keyboardType: TextInputType.multiline,
            textInputAction: TextInputAction.newline,
            inputFormatters: [
              FilteringTextInputFormatter.allow(RegExp(r'[\s\S]')),
            ],
            style: AppTypography.input(context).copyWith(
              fontSize: 14.sp,
              color: isDark
                  ? DesignColors.AppColors.darkOnBackground
                  : DesignColors.AppColors.lightOnBackground,
            ),
            decoration: InputDecoration(
              hintText: "Izoh kiriting...",
              filled: true,
              fillColor: isDark
                  ? DesignColors.AppColors.darkSurfaceVariant
                  : DesignColors.AppColors.lightSurfaceVariant,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.inputPaddingHorizontal,
                vertical: AppSpacing.inputPaddingVertical,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AppRadius.input),
                borderSide: BorderSide(
                      color: isDark
                          ? DesignColors.AppColors.darkOutline
                          : DesignColors.AppColors.lightOutline,
                  width: 1.2,
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AppRadius.input),
                borderSide: BorderSide(
                  color: isDark
                      ? DesignColors.AppColors.primary
                      : theme.colorScheme.primary,
                  width: 1.6,
                ),
              ),
              hintStyle: AppTypography.bodyMedium(context).copyWith(
                fontSize: 14.sp,
                color: isDark
                    ? DesignColors.AppColors.darkOnSurfaceVariant
                    : theme.colorScheme.onSurfaceVariant,
              ),
              isDense: true,
            ),
          ),
          SizedBox(height: 12.h),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isAdding ? null : _addComment,
              style: ElevatedButton.styleFrom(
                backgroundColor: DesignColors.AppColors.primary,
                foregroundColor: Colors.white,
                padding: EdgeInsets.symmetric(vertical: 12.h),
              ),
              child: _isAdding
                  ? SizedBox(
                      width: 20.w,
                      height: 20.h,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : Text(
                      "Qo'shish",
                      style: TextStyle(fontSize: 14.sp),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
