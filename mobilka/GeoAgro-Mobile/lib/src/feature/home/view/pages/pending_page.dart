import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/style/app_colors.dart';
import 'package:agro_employee_public/design_system/tokens/adaptive_colors.dart';
import '../../../../core/widgets/custom_app_bar_widget.dart';
import '../../../../core/widgets/error_state_widget.dart';
import '../../../../core/widgets/search_bar_widget.dart';
import '../../../../data/model/plantation/plantations_list_model.dart';
import '../../../../core/server/api/api.dart';
import '../../../../core/server/api/api_constants.dart';
import '../../../../core/routes/app_route_names.dart';
import '../../../../core/widgets/empty_state_widget.dart';
import '../../../../data/repository/app_repository_impl.dart';
import '../widgets/home_page_card_widget.dart';
import '../../vm/home_page_vm.dart';

// Shared HomePageVM provider for deletion functionality
final sharedHomePageVM = ChangeNotifierProvider.autoDispose<HomePageVm>((ref) {
  return HomePageVm(AppRepositoryImpl());
});

final pendingPageVM = ChangeNotifierProvider.autoDispose<_PendingVm>((ref) {
  return _PendingVm();
});

class _PendingVm extends ChangeNotifier {
  bool isLoading = true;
  bool isFetchingMore = false;
  String? errorMessage;
  final List<Result> list = [];
  int currentPage = 1;
  bool canLoadNext = true;
  String? _searchQuery;
  bool get isSearching => (_searchQuery?.isNotEmpty ?? false);

  _PendingVm() {
    fetch();
  }

  Future<void> fetch({bool isLoadMore = false, String? search}) async {
    if ((!canLoadNext && isLoadMore) || (isLoadMore && isFetchingMore)) return;
    if (isLoadMore && (_searchQuery?.isNotEmpty ?? false)) return; // disable pagination while searching
    
    // If search query changed, reset pagination
    if (search != _searchQuery && !isLoadMore) {
      _searchQuery = search;
    }
    
    errorMessage = null;
    if (!isLoadMore) {
      isLoading = true;
      currentPage = 1;
      canLoadNext = true;
      list.clear();
    } else {
      isFetchingMore = true;
    }
    notifyListeners();

    try {
      final query = ApiParams.pageWithSearchParams(page: currentPage, search: _searchQuery);
      final data = await ApiService.get(ApiConst.apiPlantationsPending, query);
      if (data == null) {
        errorMessage = "Server bilan bog'liq xatolik yuzaga keldi.";
      } else {
        final model = PlantationsListModel.fromJson(jsonDecode(data));
        final incomingItems = model.results ?? [];
        
        list.addAll(incomingItems);
        
        // Сортируем по дате создания (новые сверху)
        list.sort((a, b) {
          if (a.createdAt == null && b.createdAt == null) return 0;
          if (a.createdAt == null) return 1;
          if (b.createdAt == null) return -1;
          
          final dateA = DateTime.tryParse(a.createdAt!);
          final dateB = DateTime.tryParse(b.createdAt!);
          
          if (dateA == null && dateB == null) return 0;
          if (dateA == null) return 1;
          if (dateB == null) return -1;
          
          return dateB.compareTo(dateA); // Новые сверху
        });
        
        debugPrint("PENDING PAGE $currentPage: Added ${incomingItems.length} plantations (search: $_searchQuery)");
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

  // Keep loadMore for backwards compatibility
  Future<void> loadMore() async {
    await fetch(isLoadMore: true);
  }
}

class PendingPage extends ConsumerStatefulWidget {
  const PendingPage({super.key});

  @override
  ConsumerState<PendingPage> createState() => _PendingPageState();
}

class _PendingPageState extends ConsumerState<PendingPage> {
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
    final vm = ref.watch(pendingPageVM);

    if (vm.isLoading) {
      return Scaffold(
        appBar: CustomAppBarWidget(
          title: "Ko'rib chiqilmoqda",
          canPop: true,
          actions: [
            SearchBarWidget(
              key: const ValueKey('pending_search'),
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
          title: "Ko'rib chiqilmoqda",
          canPop: true,
          actions: [
            SearchBarWidget(
              key: const ValueKey('pending_search'),
              onSearchChanged: (query) {
                vm.fetch(isLoadMore: false, search: query.isEmpty ? null : query);
              },
            ),
          ],
        ),
        body: ErrorStateWidget(
          errorMessage: vm.errorMessage ?? "Kutilmagan javob",
          onTap: () => ref.read(pendingPageVM.notifier).fetch(),
        ),
      );
    }

    return Scaffold(
      appBar: CustomAppBarWidget(
        title: "Ko'rib chiqilmoqda",
        canPop: true,
        actions: [
          SearchBarWidget(
            key: const ValueKey('pending_search'),
            onSearchChanged: (query) {
              vm.fetch(isLoadMore: false, search: query.isEmpty ? null : query);
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.read(pendingPageVM.notifier).fetch(),
        color: AppColors.c28A745,
        backgroundColor: context.colors.background,
        child: vm.list.isEmpty
            ? LayoutBuilder(
                builder: (context, constraints) => SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  child: SizedBox(
                    height: constraints.maxHeight,
                    child: const EmptyStateWidget(
                      message: "Ko'rib chiqilayotgan plantatsiyalar topilmadi",
                      subMessage: "Ma'lumotlarni yangilash uchun pastga torting",
                    ),
                  ),
                ),
              )
            : ListView.separated(
                controller: _scrollController,
                physics: const AlwaysScrollableScrollPhysics(),
                separatorBuilder: (_, __) => 16.verticalSpace,
                padding: REdgeInsets.symmetric(horizontal: 16, vertical: 20),
                itemCount: vm.list.length + ((vm.canLoadNext && !vm.isSearching) ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == vm.list.length && !vm.isSearching) {
                    // Кнопка "Qolganlarini ko'rish"
                    return Container(
                      margin: REdgeInsets.symmetric(vertical: 16),
                      child: ElevatedButton(
                        onPressed: vm.isFetchingMore ? null : () {
                          vm.loadMore();
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.c28A745,
                          foregroundColor: Colors.white,
                          padding: REdgeInsets.symmetric(vertical: 16, horizontal: 32),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
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
                      customProvider: sharedHomePageVM, // Use shared provider for deletion
                      onDeleteSuccess: () {
                        // Обновляем список после успешного удаления
                        ref.read(pendingPageVM.notifier).fetch();
                      },
                    ),
                  );
                },
              ),
      ),
    );
  }
}


