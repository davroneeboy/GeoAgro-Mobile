import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routes/app_route_names.dart';
import '../../../../core/style/app_colors.dart';
import '../../../../core/widgets/custom_app_bar_widget.dart';
import '../../../../core/widgets/main_button.dart';
import '../../../../data/model/farmer/farmer_list_model.dart';
import 'package:agro_employee_public/design_system/tokens/colors.dart' as DesignColors;
import '../../vm/farmer_search_vm.dart';
import '../widgets/farmer_search_page_input_widget.dart';
import '../widgets/fermer_page_card_widget.dart';

final farmerSearchPageVm =
    ChangeNotifierProvider.autoDispose<FarmerSearchVm>((ref) {
  return FarmerSearchVm();
});

class FarmerSearchPage extends ConsumerWidget {
  const FarmerSearchPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vm = ref.watch(farmerSearchPageVm);
    return Scaffold(
      backgroundColor: DesignColors.AppColors.darkBackground,
      appBar: CustomAppBarWidget(
          title: "Fermerni Inn Bo'yicha Qidirish", canPop: true),
      body: Padding(
        padding: REdgeInsets.symmetric(horizontal: 16, vertical: 20),
        child: Column(
          children: [
            FarmerSearchPageInputWidget(
              textEditingController: vm.textEditingController,
            ),
            10.verticalSpace,
            Expanded(
              child: vm.farmersList.isNotEmpty
                  ? ListView.builder(
                      itemCount: vm.farmersList.length,
                      itemBuilder: (_, i) {
                        FarmerModel farmer = vm.farmersList[i];
                        return FermerPageCardWidget(
                          onPressed: () {
                            context.pushReplacement(
                                "/${AppRouteNames.farmers}/${AppRouteNames.googleMaps}",
                                extra: farmer.id);
                          },
                          fermerModel: farmer,
                        );
                      },
                    )
                  : Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.search,
                            size: 120.sp,
                            color: DesignColors.AppColors.accentGreen,
                          ),
                          SizedBox(height: 24.h),
                          Text(
                            vm.errorMessage ??
                                "Hozirda hech qanday farmer qidirilmagan",
                            style: TextStyle(
                                color: DesignColors.AppColors.darkTextPrimary,
                                fontSize: 14.sp,
                                fontWeight: FontWeight.w500),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
            ),
            10.verticalSpace,
            MainButton2(
              enableFeedback: !vm.isLoading,
              onPressed: vm.isLoading
                  ? null
                  : () async {
                      FocusScope.of(context).unfocus();
                      vm.searchFarmers();
                    },
              child: vm.isLoading
                  ? SizedBox(
                      width: 24.h,
                      height: 24.w,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2.5,
                      ),
                    )
                  : Text(
                      "Qidirish",
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 14.sp,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.6,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
