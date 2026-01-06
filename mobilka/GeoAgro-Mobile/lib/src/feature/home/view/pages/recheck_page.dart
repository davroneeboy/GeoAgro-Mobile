import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/style/app_colors.dart';
import '../../../../../design_system/theme/colors.dart' as DesignColors;
import '../../../../core/widgets/custom_app_bar_widget.dart';
import '../../../../core/widgets/search_bar_widget.dart';
import '../../../../core/routes/app_route_names.dart';
import '../../../../core/server/api/api.dart';
import '../../../../core/server/api/api_constants.dart';
import '../../../../core/widgets/empty_state_widget.dart';
import '../../../../data/model/plantation/plantations_list_model.dart';
import '../../../../core/widgets/error_state_widget.dart';
import '../../../../data/repository/app_repository_impl.dart';
import '../widgets/home_page_card_widget.dart';
import '../../vm/home_page_vm.dart';

final sharedHomePageVM = ChangeNotifierProvider.autoDispose<HomePageVm>((ref) {
  return HomePageVm(AppRepositoryImpl());
});

final rejectedPageVM = ChangeNotifierProvider.autoDispose<_RejectedVm>((ref) {
  return _RejectedVm();
});

class _RejectedVm extends ChangeNotifier {
  bool isLoading = true;
  String? errorMessage;
  int currentPage = 1;
  bool canLoadNext = true;
  bool isFetchingMore = false;
  final List<Result> list = [];
  String? _searchQuery;
  bool get isSearching => (_searchQuery?.isNotEmpty ?? false);

  _RejectedVm() {
    fetch();
  }

  Future<void> fetch({bool isLoadMore = false, String? search}) async {
    if ((!canLoadNext && isLoadMore) || (isLoadMore && isFetchingMore)) return;
    if (isLoadMore && (_searchQuery?.isNotEmpty ?? false)) return;
    
    if (search != _searchQuery && !isLoadMore) {
      _searchQuery = search;
    }

    errorMessage = null;
    if (!isLoadMore) {
      currentPage = 1;
      canLoadNext = true;
      list.clear();
      isLoading = true;
    } else {
      isFetchingMore = true;
    }
    notifyListeners();

    try {
      final query = ApiParams.pageWithSearchParams(page: currentPage, search: _searchQuery);
      final data = await ApiService.get(ApiConst.apiPlantationsFormeRejected, query);
      if (data == null) {
        errorMessage = "Server bilan bog'liq xatolik yuzaga keldi.";
      } else {
        final model = PlantationsListModel.fromJson(jsonDecode(data));
        final incomingItems = model.results ?? [];

        list.addAll(incomingItems);

        debugPrint("REJECTED PAGE $currentPage: Added ${incomingItems.length} plantations (search: $_searchQuery)");
        debugPrint("Total plantations: ${list.length}");

        currentPage++;
        canLoadNext = model.next != null;
      }
    } catch (e) {
      errorMessage = "Internet bilan bog'liq muammo yuzaga keldi.";
    } finally {
      isFetchingMore = false;
      isLoading = false;
      notifyListeners();
    }
  }
}

class RecheckPage extends ConsumerStatefulWidget {
  const RecheckPage({super.key});

  @override
  ConsumerState<RecheckPage> createState() => _RecheckPageState();
}

class _RecheckPageState extends ConsumerState<RecheckPage> {
  late ScrollController _scrollController;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final vm = ref.watch(rejectedPageVM);

    if (vm.isLoading) {
      return Scaffold(
        appBar: CustomAppBarWidget(
          title: "Qayta ko'rishga",
          canPop: true,
          actions: [
            SearchBarWidget(
              key: const ValueKey('recheck_search'),
              onSearchChanged: (query) {
                vm.fetch(isLoadMore: false, search: query.isEmpty ? null : query);
              },
            ),
          ],
        ),
        body: Center(child: CircularProgressIndicator(color: AppColors.c28A745)),
      );
    }
    if (vm.errorMessage != null) {
      return Scaffold(
        appBar: CustomAppBarWidget(
          title: "Qayta ko'rishga",
          canPop: true,
          actions: [
            SearchBarWidget(
              key: const ValueKey('recheck_search'),
              onSearchChanged: (query) {
                vm.fetch(isLoadMore: false, search: query.isEmpty ? null : query);
              },
            ),
          ],
        ),
        body: ErrorStateWidget(
          errorMessage: vm.errorMessage ?? "Kutilmagan javob",
          onTap: () => vm.fetch(isLoadMore: false),
        ),
      );
    }

    return Scaffold(
      appBar: CustomAppBarWidget(
        title: "Qayta ko'rishga",
        canPop: true,
        actions: [
          SearchBarWidget(
            key: const ValueKey('recheck_search'),
            onSearchChanged: (query) {
              vm.fetch(isLoadMore: false, search: query.isEmpty ? null : query);
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await vm.fetch(isLoadMore: false);
        },
        color: AppColors.c28A745,
        backgroundColor: DesignColors.AppColors.darkBackground,
        child: vm.list.isEmpty
            ? LayoutBuilder(
                builder: (context, constraints) => SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  child: SizedBox(
                    height: constraints.maxHeight,
                    child: const EmptyStateWidget(
                      message: "Rad etilgan plantatsiyalar topilmadi",
                      subMessage: "Ma'lumotlarni yangilash uchun pastga torting",
                    ),
                  ),
                ),
              )
            : ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                controller: _scrollController,
                separatorBuilder: (_, __) => 16.verticalSpace,
                padding: REdgeInsets.symmetric(horizontal: 16, vertical: 20),
                itemCount: vm.list.length + ((vm.canLoadNext && !vm.isSearching) ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == vm.list.length && !vm.isSearching) {
                    return Container(
                      margin: REdgeInsets.symmetric(vertical: 16),
                      child: ElevatedButton(
                        onPressed: vm.isFetchingMore ? null : () {
                          vm.fetch(isLoadMore: true);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.c28A745,
                          foregroundColor: Colors.white,
                          padding: REdgeInsets.symmetric(vertical: 16, horizontal: 32),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: vm.isFetchingMore
                            ? Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  SizedBox(
                                    width: 20.w,
                                    height: 20.h,
                                    child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2,
                                    ),
                                  ),
                                  8.horizontalSpace,
                                  Text("Yuklanmoqda...", style: TextStyle(fontSize: 16.sp)),
                                ],
                              )
                            : Text("Qolganlarini ko'rish", style: TextStyle(fontSize: 16.sp)),
                      ),
                    );
                  }
                  final plantation = vm.list[index];
                  return InkWell(
                    onTap: () {
                      if (plantation.id != null) {
                        context.go("${AppRouteNames.home}${AppRouteNames.plantationView}", extra: plantation.id);
                      }
                    },
                    child: HomePageCardWidget(
                      plantation: plantation,
                      showEditButton: true,
                      customProvider: sharedHomePageVM,
                      onDeleteSuccess: () {
                        ref.read(rejectedPageVM.notifier).fetch();
                      },
                    ),
                  );
                },
              ),
      ),
    );
  }
}


