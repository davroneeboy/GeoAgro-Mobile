import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:lottie/lottie.dart';

import 'package:agro_employee_public/src/core/routes/app_route_names.dart';
import 'package:agro_employee_public/src/core/widgets/custom_app_bar_widget.dart';
import 'package:agro_employee_public/src/core/widgets/custom_text_field.dart';
import 'package:agro_employee_public/src/core/widgets/error_state_widget.dart';
import 'package:agro_employee_public/src/data/model/farmer/farmer_list_model.dart';
import 'package:agro_employee_public/design_system/tokens/colors.dart' as DesignColors;
import 'package:agro_employee_public/design_system/tokens/radii.dart';
import 'package:agro_employee_public/design_system/tokens/spacing.dart';
import 'package:agro_employee_public/design_system/tokens/typography.dart';
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
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Убеждаемся, что данные загружаются при открытии страницы
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final vm = ref.read(fermerPageVM);
      // Инициализируем ViewModel, если еще не инициализирован
      vm.initialize();
      // Загружаем данные, если список пуст и не идет загрузка
      if (vm.fermersList.isEmpty && !vm.isLoading && !vm.isFetchingMore && vm.errorMessage == null) {
        vm.getFermers(isLoadMore: false);
      }
    });
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      final vm = ref.read(fermerPageVM);
      if (vm.canLoad && !vm.isFetchingMore && !vm.isLoading && vm.searchResults == null) {
        vm.getFermers(isLoadMore: true);
      }
    }
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
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
        appBar: CustomAppBarWidget(
        title: "Fermerlar",
        canPop: true,
        actions: [
          IconButton(
            onPressed: () async {
              final result = await context.push<bool?>(
                "/${AppRouteNames.farmers}/${AppRouteNames.createFarmers}",
              );
              if (result == true && mounted) {
                await ref.read(fermerPageVM).getFermers(isLoadMore: false);
              }
            },
            icon: Icon(
              Icons.person_add_rounded,
              color: DesignColors.AppColors.accentGreen,
              size: 24.sp,
            ),
            tooltip: "Yangi Fermer Qo'shish",
          ),
        ],
      ),
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
        appBar: CustomAppBarWidget(
          title: "Fermerlar",
          canPop: true,
          actions: [
            IconButton(
              onPressed: () async {
                final result = await context.push<bool?>(
                  "/${AppRouteNames.farmers}/${AppRouteNames.createFarmers}",
                );
                if (result == true && mounted) {
                  await ref.read(fermerPageVM).getFermers(isLoadMore: false);
                }
              },
              icon: Icon(
                Icons.person_add_rounded,
                color: DesignColors.AppColors.accentGreen,
                size: 24.sp,
              ),
              tooltip: "Yangi Fermer Qo'shish",
            ),
          ],
        ),
        body: ErrorStateWidget(
            errorMessage: vm.errorMessage ?? "Kutilmagan javob qaytdo",
            onTap: () => vm.getFermers()),
      );
    }

    // Loaded state
    return Scaffold(
      backgroundColor: DesignColors.AppColors.darkBackground,
      appBar: CustomAppBarWidget(
        title: "Fermerni tanlang",
        canPop: true,
        actions: [
          IconButton(
            onPressed: () async {
              final result = await context.push<bool?>(
                "/${AppRouteNames.farmers}/${AppRouteNames.createFarmers}",
              );
              if (result == true && mounted) {
                await vm.getFermers(isLoadMore: false);
              }
            },
            icon: Icon(
              Icons.person_add_rounded,
              color: DesignColors.AppColors.accentGreen,
              size: 24.sp,
            ),
            tooltip: "Yangi Fermer Qo'shish",
          ),
        ],
      ),
      body: Padding(
        padding: REdgeInsets.symmetric(horizontal: 14),
        child: RefreshIndicator(
          onRefresh: () async {
            await vm.getFermers(isLoadMore: false);
          },
          color: DesignColors.AppColors.accentGreen,
          backgroundColor: DesignColors.AppColors.darkSurface,
          child: SingleChildScrollView(
            controller: _scrollController,
            physics: const AlwaysScrollableScrollPhysics(),
            child: Column(
              children: [
                // Search Section
                _SearchSection(),
                SizedBox(height: AppSpacing.lg),
                
                // Show search results or regular list
                if (vm.searchResults != null) ...[
                  _SearchResultsList(vm: vm),
                ] else ...[
                  vm.fermersList.isEmpty
                      ? Center(
                          child: Padding(
                            padding: EdgeInsets.all(AppSpacing.xl),
                            child: Text(
                              "Sizning hududingizga doir hech qanday fermer yoq",
                              style: TextStyle(
                                fontSize: 18.sp,
                                color: DesignColors.AppColors.darkTextPrimary,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        )
                      : _FarmersList(vm: vm),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SearchSection extends ConsumerWidget {
  const _SearchSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vm = ref.watch(fermerPageVM);
    
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
                child: ValueListenableBuilder<TextEditingValue>(
                  valueListenable: vm.searchInnController,
                  builder: (context, value, child) {
                    return CustomTextField(
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
                      suffixIcon: value.text.isNotEmpty
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
                      onChanged: (newValue) {
                        ref.read(fermerPageVM.notifier).onSearchChanged(newValue);
                      },
                      onSubmitted: (value) {
                        if (value.isNotEmpty && !vm.isSearching) {
                          vm.searchByInn();
                        }
                      },
                    );
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
  final FermerVm vm;

  const _SearchResultsList({required this.vm});

  @override
  Widget build(BuildContext context) {
    if (vm.searchResults == null || vm.searchResults!.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Qidiruv natijalari",
          style: AppTypography.title(context).copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        SizedBox(height: AppSpacing.md),
        ...vm.searchResults!.map((farmer) {
          return Padding(
            padding: EdgeInsets.only(bottom: AppSpacing.md),
            child: FermerPageCardWidget(
              onPressed: () {
                context.push(
                  "/${AppRouteNames.farmers}/${AppRouteNames.googleMaps}",
                  extra: farmer.id,
                );
              },
              fermerModel: farmer,
            ),
          );
        }).toList(),
      ],
    );
  }
}

class _FarmersList extends StatelessWidget {
  final FermerVm vm;

  const _FarmersList({
    required this.vm,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ...List.generate(
          vm.fermersList.length + (vm.isFetchingMore ? 1 : 0),
          (index) {
            if (index == vm.fermersList.length) {
              return Padding(
                padding: REdgeInsets.all(16.0),
                child: Center(
                  child: CircularProgressIndicator(
                    color: DesignColors.AppColors.accentGreen,
                  ),
                ),
              );
            }

            final farmer = vm.fermersList[index];
            return Padding(
              padding: EdgeInsets.only(bottom: AppSpacing.md),
              child: FermerPageCardWidget(
                onPressed: () {
                  context.push(
                    "/${AppRouteNames.farmers}/${AppRouteNames.googleMaps}",
                    extra: farmer.id,
                  );
                },
                fermerModel: farmer,
              ),
            );
          },
        ),
      ],
    );
  }
}
