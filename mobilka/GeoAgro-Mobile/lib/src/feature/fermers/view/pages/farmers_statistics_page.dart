import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import 'package:agro_employee_public/src/core/routes/app_route_names.dart';
import 'package:agro_employee_public/src/core/widgets/custom_app_bar_widget.dart';
import 'package:agro_employee_public/src/core/widgets/custom_text_field.dart';
import 'package:agro_employee_public/src/core/widgets/error_state_widget.dart';
import 'package:agro_employee_public/src/core/widgets/loading_widget.dart' hide EmptyStateWidget;
import 'package:agro_employee_public/src/data/model/farmer/farmer_statistics_model.dart';
import 'package:agro_employee_public/src/core/widgets/empty_state_widget.dart';
import 'package:agro_employee_public/src/data/model/farmer/farmer_list_model.dart';
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
      return SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: SizedBox(
          height: MediaQuery.of(context).size.height * 0.7,
          child: const EmptyStateWidget(
            subMessage: "Ma'lumotlarni yangilash uchun pastga torting",
          ),
        ),
      );
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
          const _SearchSection(),
          SizedBox(height: AppSpacing.lg),
          if (vm.searchResults != null) ...[
            _SearchResultsList(vm: vm),
          ] else ...[
            _OverviewHeader(statistics: statistics),
            SizedBox(height: AppSpacing.sectionSpacing),
            _SummaryGrid(statistics: statistics),
            SizedBox(height: AppSpacing.sectionSpacing),
            _FarmersList(statistics: statistics),
          ],
        ],
      ),
    );
  }
}

class _SearchSection extends ConsumerWidget {
  const _SearchSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vm = ref.watch(farmersStatisticsVM);
    
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: DesignColors.AppColors.darkSurfaceVariant,
        borderRadius: BorderRadius.circular(AppRadii.card),
        border: Border.all(color: DesignColors.AppColors.darkBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: CustomTextField(
                  controller: vm.searchInnController,
                  hintText: "INN bo'yicha qidirish",
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  textInputAction: TextInputAction.search,
                  prefixIcon: Icon(
                    Icons.search,
                    color: DesignColors.AppColors.darkTextSecondary,
                    size: 20.sp,
                  ),
                  suffixIcon: vm.searchInnController.text.isNotEmpty
                      ? IconButton(
                          icon: Icon(
                            Icons.clear,
                            color: DesignColors.AppColors.darkTextSecondary,
                            size: 20.sp,
                          ),
                          onPressed: () {
                            vm.clearSearch();
                          },
                        )
                      : null,
                  onChanged: (value) {
                    ref.read(farmersStatisticsVM.notifier).onSearchChanged(value);
                  },
                ),
              ),
              SizedBox(width: AppSpacing.md),
              FilledButton.icon(
                onPressed: vm.isSearching ? null : vm.searchByInn,
                icon: vm.isSearching
                    ? SizedBox(
                        width: 16.sp,
                        height: 16.sp,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            DesignColors.AppColors.darkTextPrimary,
                          ),
                        ),
                      )
                    : Icon(
                        Icons.search,
                        size: 18.sp,
                      ),
                label: Text(
                  "Qidirish",
                  style: AppTypography.bodySmall(context),
                ),
                style: FilledButton.styleFrom(
                  backgroundColor: DesignColors.AppColors.accentGreen,
                  foregroundColor: DesignColors.AppColors.darkTextPrimary,
                  padding: EdgeInsets.symmetric(
                    horizontal: AppSpacing.lg,
                    vertical: AppSpacing.md,
                  ),
                ),
              ),
            ],
          ),
          if (vm.searchErrorMessage != null) ...[
            SizedBox(height: AppSpacing.sm),
            Text(
              vm.searchErrorMessage!,
              style: AppTypography.caption(context).copyWith(
                color: DesignColors.AppColors.error,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _SearchResultsList extends StatelessWidget {
  final FarmersStatisticsVm vm;

  const _SearchResultsList({required this.vm});

  @override
  Widget build(BuildContext context) {
    if (vm.searchResults == null || vm.searchResults!.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: DesignColors.AppColors.darkSurfaceVariant,
          borderRadius: BorderRadius.circular(AppRadii.card),
          border: Border.all(color: DesignColors.AppColors.darkBorder),
        ),
        child: Center(
          child: Column(
            children: [
              Icon(
                Icons.search_off,
                size: 48.sp,
                color: DesignColors.AppColors.darkTextSecondary,
              ),
              SizedBox(height: AppSpacing.md),
              Text(
                "Fermer topilmadi",
                style: AppTypography.body(context).copyWith(
                  color: DesignColors.AppColors.darkTextSecondary,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              "Qidiruv natijalari",
              style: AppTypography.title(context).copyWith(
                color: DesignColors.AppColors.darkTextPrimary,
                fontWeight: FontWeight.w700,
              ),
            ),
            TextButton.icon(
              onPressed: vm.clearSearch,
              icon: Icon(
                Icons.close,
                size: 18.sp,
                color: DesignColors.AppColors.darkTextSecondary,
              ),
              label: Text(
                "Tozalash",
                style: AppTypography.bodySmall(context).copyWith(
                  color: DesignColors.AppColors.darkTextSecondary,
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: AppSpacing.md),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: vm.searchResults!.length,
          separatorBuilder: (_, __) => SizedBox(height: AppSpacing.md),
          itemBuilder: (context, index) {
            final farmer = vm.searchResults![index];
            return _SearchResultCard(farmer: farmer);
          },
        ),
      ],
    );
  }
}

class _SearchResultCard extends StatelessWidget {
  final FarmerModel farmer;

  const _SearchResultCard({required this.farmer});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        final farmerId = farmer.id ?? 0;
        final farmerInn = farmer.inn ?? farmer.id ?? 0;
        final farmerName = farmer.name ?? 'Fermer';
        final route =
            "/${AppRouteNames.farmers}/${AppRouteNames.farmerPlantations}?id=$farmerId&inn=$farmerInn&name=${Uri.encodeComponent(farmerName)}";
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
                        if (farmer.inn != null) ...[
                          SizedBox(height: AppSpacing.xs),
                          Text(
                            "INN: ${farmer.inn}",
                            style: AppTypography.caption(context).copyWith(
                              color: DesignColors.AppColors.darkTextTertiary,
                            ),
                          ),
                        ],
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
              if (farmer.phoneNumber != null || farmer.address != null) ...[
                SizedBox(height: AppSpacing.md),
                Divider(
                  color: DesignColors.AppColors.darkDivider.withOpacity(0.6),
                  height: 1,
                ),
                SizedBox(height: AppSpacing.md),
                if (farmer.phoneNumber != null)
                  Padding(
                    padding: EdgeInsets.only(bottom: AppSpacing.xs),
                    child: Row(
                      children: [
                        Icon(
                          Icons.phone,
                          size: 16.sp,
                          color: DesignColors.AppColors.darkTextSecondary,
                        ),
                        SizedBox(width: AppSpacing.sm),
                        Text(
                          farmer.phoneNumber!,
                          style: AppTypography.bodySmall(context).copyWith(
                            color: DesignColors.AppColors.darkTextSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                if (farmer.address != null)
                  Row(
                    children: [
                      Icon(
                        Icons.location_on,
                        size: 16.sp,
                        color: DesignColors.AppColors.darkTextSecondary,
                      ),
                      SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Text(
                          farmer.address!,
                          style: AppTypography.bodySmall(context).copyWith(
                            color: DesignColors.AppColors.darkTextSecondary,
                          ),
                        ),
                      ),
                    ],
                  ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// _EmptyState removed


class _OverviewHeader extends StatelessWidget {
  final List<FarmerData> statistics;

  const _OverviewHeader({required this.statistics});

  @override
  Widget build(BuildContext context) {
    final totalFarmers = statistics.length;
    final uzumzorArea = statistics.fold<double>(
      0.0,
      (sum, farmer) => sum + (farmer.uzumzorArea ?? 0),
    );
    final bogArea = statistics.fold<double>(
      0.0,
      (sum, farmer) => sum + (farmer.bogArea ?? 0),
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
            "Fermerlar soni: $totalFarmers",
            style: AppTypography.bodySmall(context).copyWith(
              color: DesignColors.AppColors.darkTextSecondary,
            ),
          ),
          SizedBox(height: AppSpacing.xs),
          Text(
            "Uzumzor maydoni: ${uzumzorArea.toStringAsFixed(1)} ga • Bog maydoni: ${bogArea.toStringAsFixed(1)} ga",
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
    final uzumzorArea = statistics.fold<double>(
      0.0,
      (sum, farmer) => sum + (farmer.uzumzorArea ?? 0.0),
    );
    final bogArea = statistics.fold<double>(
      0.0,
      (sum, farmer) => sum + (farmer.bogArea ?? 0.0),
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
        onTap: () {
          context.push("${AppRouteNames.home}${AppRouteNames.approvedPage}");
        },
      ),
      _SummaryItem(
        title: "Ko'rib chiqilmoqda",
        value: "$pendingPlantations",
        icon: Icons.pending_actions_outlined,
        accent: const Color(0xFFFBBF24),
        onTap: () {
          context.push("${AppRouteNames.home}${AppRouteNames.pendingPage}");
        },
      ),
      _SummaryItem(
        title: "Rad etilgan",
        value: "$rejectedPlantations",
        icon: Icons.highlight_off_outlined,
        accent: const Color(0xFFF87171),
        onTap: () {
          context.push("${AppRouteNames.home}${AppRouteNames.recheckPage}");
        },
      ),
      _SummaryItem(
        title: "Uzumzor maydoni",
        value: "${uzumzorArea.toStringAsFixed(1)} ga",
        icon: Icons.landscape_outlined,
        accent: const Color(0xFF38E3A8),
      ),
      _SummaryItem(
        title: "Bog maydoni",
        value: "${bogArea.toStringAsFixed(1)} ga",
        icon: Icons.park_outlined,
        accent: const Color(0xFF10B981),
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
  final VoidCallback? onTap;

  const _SummaryItem({
    required this.title,
    required this.value,
    required this.icon,
    required this.accent,
    this.onTap,
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
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: item.onTap,
          borderRadius: BorderRadius.circular(AppRadii.card),
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
        final farmerInn = farmer.inn ?? farmer.id ?? 0;
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
                              ? "Oxirgi qo'shilgan: ${_formatDate(farmer.lastAddedPlantations!)}"
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
                    label: "Uzumzor maydoni",
                    value: "${(farmer.uzumzorArea ?? 0).toStringAsFixed(1)} ga",
                    icon: Icons.landscape_outlined,
                  ),
                  _MetricPill(
                    label: "Bog maydoni",
                    value: "${(farmer.bogArea ?? 0).toStringAsFixed(1)} ga",
                    icon: Icons.park_outlined,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(String dateString) {
    try {
      // Парсим ISO 8601 формат (например: 2025-10-18T07:24:03.910158Z)
      final date = DateTime.parse(dateString);
      // Форматируем в читаемый формат: dd.MM.yyyy HH:mm
      return DateFormat('dd.MM.yyyy HH:mm').format(date);
    } catch (e) {
      // Если не удалось распарсить, возвращаем исходную строку
      return dateString;
    }
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
