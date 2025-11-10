import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import 'package:agro_employee_public/src/core/routes/app_route_names.dart';
import 'package:agro_employee_public/src/core/widgets/custom_app_bar_widget.dart';
import 'package:agro_employee_public/src/core/widgets/error_state_widget.dart';
import 'package:agro_employee_public/src/core/widgets/loading_widget.dart';
import 'package:agro_employee_public/src/data/model/farmer/farmer_statistics_model.dart';
import 'package:agro_employee_public/design_system/tokens/colors.dart' as DesignColors;
import 'package:agro_employee_public/design_system/tokens/radii.dart';
import 'package:agro_employee_public/design_system/tokens/spacing.dart';
import 'package:agro_employee_public/design_system/tokens/typography.dart';
import '../../vm/farmers_statistics_vm.dart';

final farmersStatisticsVM = ChangeNotifierProvider.autoDispose<FarmersStatisticsVm>((ref) {
  return FarmersStatisticsVm();
});

class FarmersStatisticsPage extends ConsumerWidget {
  const FarmersStatisticsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vm = ref.watch(farmersStatisticsVM);

    return Scaffold(
      appBar: const CustomAppBarWidget(
        title: "Fermerlar kesimida statistika",
        canPop: true,
      ),
      body: Container(
        color: DesignColors.AppColors.darkBackground,
        child: RefreshIndicator(
          onRefresh: () => vm.refresh(),
          color: DesignColors.AppColors.accentGreen,
          backgroundColor: DesignColors.AppColors.darkSurface,
          child: _BodyContent(vm: vm),
        ),
      ),
    );
  }
}

class _BodyContent extends StatelessWidget {
  final FarmersStatisticsVm vm;

  const _BodyContent({required this.vm});

  @override
  Widget build(BuildContext context) {
    if (vm.isLoading) {
      return const LoadingWidget();
    }

    if (vm.errorMessage != null) {
      return ErrorStateWidget(
        errorMessage: vm.errorMessage!,
        onTap: vm.refresh,
      );
    }

    final statistics = vm.statistics;
    if (statistics == null || statistics.isEmpty) {
      return _EmptyState();
    }

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: EdgeInsets.symmetric(
        horizontal: AppSpacing.screenPadding,
        vertical: AppSpacing.lg,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _OverviewHeader(statistics: statistics),
          SizedBox(height: AppSpacing.sectionSpacing),
          _SummaryGrid(statistics: statistics),
          SizedBox(height: AppSpacing.sectionSpacing),
          _FarmersList(statistics: statistics),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: DesignColors.AppColors.darkSurface,
              borderRadius: BorderRadius.circular(AppRadii.lg),
              border: Border.all(color: DesignColors.AppColors.darkBorder),
            ),
            child: Icon(
              Icons.analytics_outlined,
              size: 42.sp,
              color: DesignColors.AppColors.darkTextSecondary,
            ),
          ),
          SizedBox(height: AppSpacing.md),
          Text(
            "Statistika ma'lumotlari topilmadi",
            style: AppTypography.body(context).copyWith(
              color: DesignColors.AppColors.darkTextSecondary,
              fontWeight: FontWeight.w600,
            ),
          ),
          SizedBox(height: AppSpacing.sm),
          Text(
            "Ma'lumotlarni yangilash uchun pastga torting",
            style: AppTypography.caption(context).copyWith(
              color: DesignColors.AppColors.darkTextTertiary,
            ),
          ),
        ],
      ),
    );
  }
}

class _OverviewHeader extends StatelessWidget {
  final List<FarmerData> statistics;

  const _OverviewHeader({required this.statistics});

  @override
  Widget build(BuildContext context) {
    final totalFarmers = statistics.length;
    final totalArea = statistics.fold<double>(
      0.0,
      (sum, farmer) => sum + (farmer.totalArea ?? 0),
    );

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            DesignColors.AppColors.darkHighlight,
            DesignColors.AppColors.darkSurfaceVariant,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppRadii.lg),
        border: Border.all(color: DesignColors.AppColors.darkBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.35),
            blurRadius: 32,
            offset: const Offset(0, 24),
            spreadRadius: -24,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Fermerlar kesimida statistika",
            style: AppTypography.headline3(context).copyWith(
              color: DesignColors.AppColors.darkTextPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
          SizedBox(height: AppSpacing.sm),
          Text(
            "Fermerlar soni: $totalFarmers • Umumiy maydon: ${totalArea.toStringAsFixed(1)} ga",
            style: AppTypography.bodySmall(context).copyWith(
              color: DesignColors.AppColors.darkTextSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryGrid extends StatelessWidget {
  final List<FarmerData> statistics;

  const _SummaryGrid({required this.statistics});

  @override
  Widget build(BuildContext context) {
    final totalPlantations = statistics.fold<int>(
      0,
      (sum, farmer) => sum + (farmer.totalPlantations ?? 0),
    );
    final approvedPlantations = statistics.fold<int>(
      0,
      (sum, farmer) => sum + (farmer.approvedPlantations ?? 0),
    );
    final pendingPlantations = statistics.fold<int>(
      0,
      (sum, farmer) => sum + (farmer.pendingPlantations ?? 0),
    );
    final rejectedPlantations = statistics.fold<int>(
      0,
      (sum, farmer) => sum + (farmer.rejectedPlantations ?? 0),
    );
    final totalArea = statistics.fold<double>(
      0.0,
      (sum, farmer) => sum + (farmer.totalArea ?? 0.0),
    );

    final items = [
      _SummaryItem(
        title: "Jami plantatsiyalar",
        value: "$totalPlantations",
        icon: Icons.eco_outlined,
        accent: DesignColors.AppColors.accentGreen,
      ),
      _SummaryItem(
        title: "Tasdiqlangan",
        value: "$approvedPlantations",
        icon: Icons.verified_outlined,
        accent: const Color(0xFF38BDF8),
      ),
      _SummaryItem(
        title: "Ko'rib chiqilmoqda",
        value: "$pendingPlantations",
        icon: Icons.pending_actions_outlined,
        accent: const Color(0xFFFBBF24),
      ),
      _SummaryItem(
        title: "Rad etilgan",
        value: "$rejectedPlantations",
        icon: Icons.highlight_off_outlined,
        accent: const Color(0xFFF87171),
      ),
      _SummaryItem(
        title: "Umumiy maydon",
        value: "${totalArea.toStringAsFixed(1)} ga",
        icon: Icons.landscape_outlined,
        accent: const Color(0xFF38E3A8),
      ),
    ];

    return GridView.builder(
      shrinkWrap: true,
      itemCount: items.length,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: AppSpacing.md,
        crossAxisSpacing: AppSpacing.md,
        childAspectRatio: 1.25,
      ),
      itemBuilder: (context, index) => _SummaryCard(item: items[index]),
    );
  }
}

class _SummaryItem {
  final String title;
  final String value;
  final IconData icon;
  final Color accent;

  const _SummaryItem({
    required this.title,
    required this.value,
    required this.icon,
    required this.accent,
  });
}

class _SummaryCard extends StatelessWidget {
  final _SummaryItem item;

  const _SummaryCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: DesignColors.AppColors.darkSurfaceVariant,
        borderRadius: BorderRadius.circular(AppRadii.card),
        border: Border.all(color: DesignColors.AppColors.darkBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 18,
            offset: const Offset(0, 12),
            spreadRadius: -12,
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.sm),
              decoration: BoxDecoration(
                color: item.accent.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(
                item.icon,
                color: item.accent,
                size: 22.sp,
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.value,
                  style: AppTypography.headline3(context).copyWith(
                    fontSize: 22.sp,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                SizedBox(height: AppSpacing.xs),
                Text(
                  item.title,
                  style: AppTypography.caption(context).copyWith(
                    color: DesignColors.AppColors.darkTextTertiary,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _FarmersList extends StatelessWidget {
  final List<FarmerData> statistics;

  const _FarmersList({required this.statistics});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Fermerlar ro'yxati",
          style: AppTypography.title(context).copyWith(
            color: DesignColors.AppColors.darkTextPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
        SizedBox(height: AppSpacing.md),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: statistics.length,
          separatorBuilder: (_, __) => SizedBox(height: AppSpacing.md),
          itemBuilder: (context, index) => _FarmerCard(farmer: statistics[index]),
        ),
      ],
    );
  }
}

class _FarmerCard extends StatelessWidget {
  final FarmerData farmer;

  const _FarmerCard({required this.farmer});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        final farmerId = farmer.id ?? 0;
        final farmerInn = farmer.inn ?? farmer.id ?? 0; // Используем inn, если есть, иначе id
        final farmerName = farmer.name ?? 'Fermer';
        final route =
            "/${AppRouteNames.farmers}/${AppRouteNames.farmerPlantations}?id=$farmerId&inn=$farmerInn&name=${Uri.encodeComponent(farmerName)}";

        debugPrint('FarmersStatisticsPage: Navigating to farmer plantations: $route');
        debugPrint('FarmersStatisticsPage: farmerId=$farmerId, farmerInn=$farmerInn');
        context.push(route);
      },
      child: Container(
        decoration: BoxDecoration(
          color: DesignColors.AppColors.darkSurfaceVariant,
          borderRadius: BorderRadius.circular(AppRadii.card),
          border: Border.all(color: DesignColors.AppColors.darkBorder),
        ),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
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
                          farmer.name ?? "Noma'lum fermer",
                          style: AppTypography.title(context).copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        SizedBox(height: AppSpacing.xs),
                        Text(
                          farmer.lastAddedPlantations?.isNotEmpty == true
                              ? "Oxirgi qo'shilgan: ${farmer.lastAddedPlantations}"
                              : "Yangilangan ma'lumot mavjud emas",
                          style: AppTypography.caption(context).copyWith(
                            color: DesignColors.AppColors.darkTextTertiary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    Icons.arrow_forward_ios_rounded,
                    size: 16.sp,
                    color: DesignColors.AppColors.darkTextTertiary,
                  ),
                ],
              ),
              SizedBox(height: AppSpacing.md),
              Divider(
                color: DesignColors.AppColors.darkDivider.withOpacity(0.6),
                height: 1,
              ),
              SizedBox(height: AppSpacing.md),
              Wrap(
                spacing: AppSpacing.lg,
                runSpacing: AppSpacing.sm,
                children: [
                  _MetricPill(
                    label: "Plantatsiyalar",
                    value: "${farmer.totalPlantations ?? 0}",
                    icon: Icons.forest_outlined,
                  ),
                  _MetricPill(
                    label: "Tasdiqlangan",
                    value: "${farmer.approvedPlantations ?? 0}",
                    icon: Icons.check_circle_outlined,
                  ),
                  _MetricPill(
                    label: "Ko'rib chiqilmoqda",
                    value: "${farmer.pendingPlantations ?? 0}",
                    icon: Icons.schedule_outlined,
                  ),
                  _MetricPill(
                    label: "Rad etilgan",
                    value: "${farmer.rejectedPlantations ?? 0}",
                    icon: Icons.highlight_off_outlined,
                  ),
                  _MetricPill(
                    label: "Umumiy maydon",
                    value: "${(farmer.totalArea ?? 0).toStringAsFixed(1)} ga",
                    icon: Icons.straighten_outlined,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MetricPill extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _MetricPill({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: DesignColors.AppColors.darkSurface,
        borderRadius: BorderRadius.circular(AppRadii.sm),
        border: Border.all(color: DesignColors.AppColors.darkBorder),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 16.sp,
            color: DesignColors.AppColors.accentGreen,
          ),
          SizedBox(width: AppSpacing.sm),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                value,
                style: AppTypography.bodySmall(context).copyWith(
                  color: DesignColors.AppColors.darkTextPrimary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                label,
                style: AppTypography.caption(context).copyWith(
                  color: DesignColors.AppColors.darkTextTertiary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
