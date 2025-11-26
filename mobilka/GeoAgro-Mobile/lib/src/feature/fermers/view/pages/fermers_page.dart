import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:lottie/lottie.dart';

import 'package:agro_employee_public/src/core/routes/app_route_names.dart';
import 'package:agro_employee_public/src/core/widgets/custom_app_bar_widget.dart';
import 'package:agro_employee_public/src/core/widgets/error_state_widget.dart';
import 'package:agro_employee_public/src/core/widgets/main_button.dart';
import 'package:agro_employee_public/src/data/model/farmer/farmer_list_model.dart';
import 'package:agro_employee_public/design_system/tokens/colors.dart' as DesignColors;
import 'package:agro_employee_public/src/feature/fermers/vm/fermer_vm.dart';

import '../widgets/fermer_page_card_widget.dart';

final fermerPageVM = ChangeNotifierProvider<FermerVm>((ref) {
  return FermerVm();
});

// final fermerPageVM = ChangeNotifierProvider.autoDispose<FermerVm>((ref) {
//   final vm = FermerVm();
//   ref.onDispose(() {
//     vm.dispose();
//   });
//   return vm;
// });

class FermersPage extends ConsumerStatefulWidget {
  const FermersPage({super.key});

  @override
  ConsumerState<FermersPage> createState() => _FermersPageState();
}

class _FermersPageState extends ConsumerState<FermersPage> {
  late ScrollController _scrollController;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();

    // ScrollListener
    _scrollController.addListener(() {
      final vm = ref.read(fermerPageVM);
      if (_scrollController.position.pixels ==
              _scrollController.position.maxScrollExtent &&
          !vm.isFetchingMore) {
        vm.getFermers(isLoadMore: true);
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final vm = ref.watch(fermerPageVM);
    // loading state
    if (vm.isLoading) {
      return Scaffold(
        backgroundColor: DesignColors.AppColors.darkBackground,
        appBar: CustomAppBarWidget(title: "Fermerlar", canPop: true),
        body: Center(
          child: Lottie.asset(
            'assets/lotties/search.json',
            width: 300.w,
            height: 300.h,
            fit: BoxFit.contain,
          ),
        ),
      );
    }

    // error state
    if (vm.errorMessage != null) {
      return Scaffold(
        backgroundColor: DesignColors.AppColors.darkBackground,
        appBar: const CustomAppBarWidget(title: "Fermerlar", canPop: true),
        body: ErrorStateWidget(
            errorMessage: vm.errorMessage ?? "Kutilmagan javob qaytdo",
            onTap: () => vm.getFermers()),
      );
    }

    // Loaded state
    return Scaffold(
      backgroundColor: DesignColors.AppColors.darkBackground,
      appBar:
          CustomAppBarWidget(title: "Fermerni tanlang", canPop: true, actions: [
        IconButton(
          onPressed: () {
            context.push(
                "/${AppRouteNames.farmers}/${AppRouteNames.searchFarmers}");
          },
          icon: Icon(
            CupertinoIcons.search,
            color: DesignColors.AppColors.darkTextPrimary,
            size: 16.sp,
          ),
        )
      ]),
      body: vm.fermersList.isEmpty
          ? Center(
              child: Text(
                "Sizning hududingizga doir hech qanday fermer yoq",
                style: TextStyle(fontSize: 18.sp, color: DesignColors.AppColors.darkTextPrimary),
                textAlign: TextAlign.center,
              ),
            )
          : Padding(
              padding: REdgeInsets.symmetric(horizontal: 14),
              child: RefreshIndicator(
                onRefresh: () async {
                  await vm.getFermers(isLoadMore: false);
                },
                color: DesignColors.AppColors.accentGreen,
                backgroundColor: DesignColors.AppColors.darkSurface,
                child: Column(
                  children: [
                    vm.fermersList.isNotEmpty
                        ? Expanded(
                            child: ListView.separated(
                              controller: _scrollController,
                              separatorBuilder: (_, __) => 16.verticalSpace,
                              padding: REdgeInsets.symmetric(
                                  horizontal: 16, vertical: 20),
                              itemCount: vm.fermersList.length +
                                  (vm.isFetchingMore ? 1 : 0),
                              itemBuilder: (context, index) {
                                //  add loading
                                if (index == vm.fermersList.length) {
                                  return Padding(
                                    padding: REdgeInsets.all(16.0),
                                    child: Center(
                                      child: CircularProgressIndicator(
                                          color: DesignColors.AppColors.accentGreen),
                                    ),
                                  );
                                }

                                FarmerModel farmer = vm.fermersList[index];
                                return FermerPageCardWidget(
                                  onPressed: () {
                                    context.push(
                                        "/${AppRouteNames.farmers}/${AppRouteNames.googleMaps}",
                                        extra: farmer.id);
                                  },
                                  fermerModel: farmer,
                                );
                              },
                            ),
                          )
                        : Expanded(
                            child: Text(
                              "Baza hech qanday fermer yoq",
                              style: TextStyle(fontSize: 14.sp),
                            ),
                          ),
                    Padding(
                      padding:
                          REdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: MainButton(
                        text: "Yangi Fermer Qo'shish",
                        onTap: () async {
                          final result = await context.push<bool?>(
                            "/${AppRouteNames.farmers}/${AppRouteNames.createFarmers}",
                          );
                          if (result == true) {
                            await vm.getFermers(isLoadMore: false);
                          }
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
