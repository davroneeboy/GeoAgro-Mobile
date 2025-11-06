import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routes/app_route_names.dart';
import '../../../../core/style/app_colors.dart';
import '../../../../core/widgets/custom_app_bar_widget.dart';
import '../../../../core/widgets/error_state_widget.dart';
import '../../../../core/widgets/loading_widget.dart';
import '../../../../data/model/farmer/farmer_statistics_model.dart';
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
      body: RefreshIndicator(
        onRefresh: () => vm.refresh(),
        color: AppColors.c28A745,
        backgroundColor: AppColors.cF7F7F7,
        child: _buildBody(vm),
      ),
    );
  }

  Widget _buildBody(FarmersStatisticsVm vm) {
    if (vm.isLoading) {
      return const LoadingWidget();
    }

    if (vm.errorMessage != null) {
      return ErrorStateWidget(
        errorMessage: vm.errorMessage!,
        onTap: () => vm.refresh(),
      );
    }

    if (vm.statistics == null || vm.statistics!.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.analytics_outlined,
              size: 80.sp,
              color: AppColors.c28A745,
            ),
            16.verticalSpace,
            Text(
              "Statistika ma'lumotlari topilmadi",
              style: TextStyle(
                fontSize: 18.sp,
                color: AppColors.c1E1E1E,
              ),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: REdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSummaryCards(vm.statistics!),
          24.verticalSpace,
          _buildFarmersList(vm.statistics!),
        ],
      ),
    );
  }

  Widget _buildSummaryCards(List<FarmerData> statistics) {
    final totalFarmers = statistics.length;
    final totalPlantations = statistics.fold<int>(0, (sum, farmer) => sum + (farmer.totalPlantations ?? 0));
    final totalApprovedPlantations = statistics.fold<int>(0, (sum, farmer) => sum + (farmer.approvedPlantations ?? 0));
    final totalPendingPlantations = statistics.fold<int>(0, (sum, farmer) => sum + (farmer.pendingPlantations ?? 0));
    final totalArea = statistics.fold<double>(0.0, (sum, farmer) => sum + (farmer.totalArea ?? 0));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Umumiy statistika",
          style: TextStyle(
            fontSize: 20.sp,
            fontWeight: FontWeight.bold,
            color: AppColors.c1E1E1E,
          ),
        ),
        16.verticalSpace,
                            GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 1.2, // Делаю карточки более квадратными, как нижние
                      children: [
            _buildSummaryCard(
              "Fermerlar",
              "$totalFarmers",
              Icons.people,
              AppColors.c28A745,
            ),
            _buildSummaryCard(
              "Plantatsiyalar",
              "$totalPlantations",
              Icons.agriculture,
              AppColors.cFF6B35,
            ),
            _buildSummaryCard(
              "Tasdiqlangan",
              "$totalApprovedPlantations",
              Icons.check_circle,
              AppColors.c4CAF50,
            ),

          ],
        ),
        16.verticalSpace,
        Row(
          children: [
            Expanded(
              child: _buildAreaCard(
                "Umumiy maydon",
                "${totalArea.toStringAsFixed(1)} ga",
                Icons.landscape,
                AppColors.c8BC34A,
              ),
            ),
            12.horizontalSpace,
            Expanded(
              child: _buildSummaryCard(
                "Ko'rib chiqilmoqda",
                "$totalPendingPlantations",
                Icons.pending,
                AppColors.cFF9800,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSummaryCard(String title, String value, IconData icon, Color color) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: REdgeInsets.all(12), // Точно такой же padding как в нижних карточках
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 28.sp, // Точно такой же размер как в нижних карточках
              color: color,
            ),
            6.verticalSpace, // Точно такой же отступ как в нижних карточках
            Text(
              value,
              style: TextStyle(
                fontSize: 18.sp, // Точно такой же размер как в нижних карточках
                fontWeight: FontWeight.bold,
                color: AppColors.c1E1E1E,
              ),
            ),
            2.verticalSpace, // Точно такой же отступ как в нижних карточках
            Text(
              title,
              style: TextStyle(
                fontSize: 11.sp, // Точно такой же размер как в нижних карточках
                color: AppColors.c666666,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAreaCard(String title, String value, IconData icon, Color color) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: REdgeInsets.all(12), // Уменьшаю с 16 до 12
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 28.sp, // Уменьшаю с 32 до 28
              color: color,
            ),
            6.verticalSpace, // Уменьшаю с 8 до 6
            Text(
              value,
              style: TextStyle(
                fontSize: 18.sp, // Уменьшаю с 20 до 18
                fontWeight: FontWeight.bold,
                color: AppColors.c1E1E1E,
              ),
            ),
            2.verticalSpace, // Уменьшаю с 4 до 2
            Text(
              title,
              style: TextStyle(
                fontSize: 11.sp,
                color: AppColors.c666666,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFarmersList(List<FarmerData> statistics) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Fermerlar ro'yxati",
          style: TextStyle(
            fontSize: 20.sp,
            fontWeight: FontWeight.bold,
            color: AppColors.c1E1E1E,
          ),
        ),
        16.verticalSpace,
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: statistics.length,
          separatorBuilder: (_, __) => 12.verticalSpace,
          itemBuilder: (context, index) {
            final farmer = statistics[index];
            return _buildFarmerCard(farmer, context);
          },
        ),
      ],
    );
  }

  Widget _buildFarmerCard(FarmerData farmer, BuildContext context) {
    return GestureDetector(
      onTap: () {
        // Navigate to farmer plantations page
        final farmerInn = farmer.id ?? 0;
        final farmerName = farmer.name ?? 'Fermer';
        final route = "/${AppRouteNames.farmers}/${AppRouteNames.farmerPlantations}?inn=$farmerInn&name=${Uri.encodeComponent(farmerName)}";
        
        debugPrint('FarmersStatisticsPage: Navigating to farmer plantations: $route');
        context.push(route);
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Padding(
          padding: REdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      farmer.name ?? "N/A",
                      style: TextStyle(
                        fontSize: 16.sp,
                        fontWeight: FontWeight.bold,
                        color: AppColors.c1E1E1E,
                      ),
                    ),
                  ),
                  // Add navigation indicator
                  Icon(
                    Icons.arrow_forward_ios,
                    size: 16.sp,
                    color: AppColors.c28A745,
                  ),
                ],
              ),
              16.verticalSpace,
              Row(
                children: [
                  Expanded(
                    child: _buildFarmerStat(
                      "Plantatsiyalar",
                      "${farmer.totalPlantations ?? 0}",
                      Icons.agriculture,
                    ),
                  ),
                  Expanded(
                    child: _buildFarmerStat(
                      "Tasdiqlangan",
                      "${farmer.approvedPlantations ?? 0}",
                      Icons.check_circle,
                    ),
                  ),
                ],
              ),
              12.verticalSpace,
              Row(
                children: [
                  Expanded(
                    child: _buildFarmerStat(
                      "Umumiy maydon",
                      "${farmer.totalArea?.toStringAsFixed(1) ?? 0} ga",
                      Icons.landscape,
                    ),
                  ),
                  Expanded(
                    child: _buildFarmerStat(
                      "Ko'rib chiqilmoqda",
                      "${farmer.pendingPlantations ?? 0}",
                      Icons.pending,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFarmerStat(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(
          icon,
          size: 16.sp,
          color: AppColors.c28A745,
        ),
        8.horizontalSpace,
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: TextStyle(
                  fontSize: 14.sp,
                  fontWeight: FontWeight.bold,
                  color: AppColors.c1E1E1E,
                ),
              ),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11.sp,
                  color: AppColors.c666666,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }


}
