import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lottie/lottie.dart';

import '../../../../core/widgets/custom_app_bar_widget.dart';
import '../../../../core/widgets/error_state_widget.dart';
import '../../../../core/style/app_colors.dart';
import '../widgets/farmer_plantation_card.dart';
import '../../vm/farmer_plantations_vm.dart';

final farmerPlantationsVm = ChangeNotifierProvider.autoDispose<FarmerPlantationsVm>((ref) {
  return FarmerPlantationsVm();
});

class FarmerPlantationsPage extends ConsumerStatefulWidget {
  final int farmerInn;
  final String farmerName;

  const FarmerPlantationsPage({
    super.key,
    required this.farmerInn,
    required this.farmerName,
  });

  @override
  ConsumerState<FarmerPlantationsPage> createState() => _FarmerPlantationsPageState();
}

class _FarmerPlantationsPageState extends ConsumerState<FarmerPlantationsPage> {
  @override
  void initState() {
    super.initState();
    // Load farmer plantations when page initializes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(farmerPlantationsVm.notifier).getFarmerPlantations(widget.farmerInn);
    });
  }

  @override
  Widget build(BuildContext context) {
    final vm = ref.watch(farmerPlantationsVm);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBarWidget(
        title: "Fermer plantatsiyalari",
        canPop: true,
      ),
      body: _buildContent(context, ref, vm),
    );
  }

  Widget _buildContent(BuildContext context, WidgetRef ref, FarmerPlantationsVm vm) {
    if (vm.isLoading) {
      return Center(
        child: Lottie.asset(
          'assets/lotties/search.json',
          width: 300.w,
          height: 300.h,
          fit: BoxFit.contain,
        ),
      );
    }

    if (vm.errorMessage != null) {
      return ErrorStateWidget(
        errorMessage: vm.errorMessage ?? "Kutilmagan xatolik",
        onTap: () => ref.read(farmerPlantationsVm.notifier).getFarmerPlantations(widget.farmerInn),
      );
    }

    if (vm.plantations.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Lottie.asset(
              'assets/lotties/no_result.json',
              width: 200.w,
              height: 200.h,
              fit: BoxFit.contain,
            ),
            SizedBox(height: 16.h),
            Text(
              "Bu fermerda plantatsiya yo'q",
              style: TextStyle(
                fontSize: 16.sp,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        // Header with farmer info
        Container(
          width: double.infinity,
          padding: EdgeInsets.all(16.w),
          margin: EdgeInsets.all(16.w),
          decoration: BoxDecoration(
            color: AppColors.c28A745.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12.r),
            border: Border.all(color: AppColors.c28A745.withValues(alpha: 0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.farmerName,
                style: TextStyle(
                  fontSize: 18.sp,
                  fontWeight: FontWeight.bold,
                  color: AppColors.c28A745,
                ),
              ),
              SizedBox(height: 8.h),
              Text(
                "Jami ${vm.plantations.length} ta plantatsiya",
                style: TextStyle(
                  fontSize: 14.sp,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
        
        // Plantations list
        Expanded(
          child: ListView.builder(
            padding: EdgeInsets.symmetric(horizontal: 16.w),
            itemCount: vm.plantations.length,
            itemBuilder: (context, index) {
              final plantation = vm.plantations[index];
              return Padding(
                padding: EdgeInsets.only(bottom: 12.h),
                child: FarmerPlantationCard(
                  plantation: plantation,
                  onTap: () {
                    // Navigate to plantation detail
                    // context.go("/plantation/${plantation.id}");
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
