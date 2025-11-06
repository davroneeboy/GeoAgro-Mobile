import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:lottie/lottie.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../../../core/routes/app_route_names.dart';
import '../../../../core/style/app_colors.dart';
import '../../../../core/widgets/error_state_widget.dart';
import '../../../../core/widgets/search_bar_widget.dart';
import '../../../../data/model/plantation/plantations_list_model.dart';
import '../../../../data/repository/app_repository_impl.dart';
import '../../../../core/widgets/custom_app_bar_widget.dart';
import '../widgets/home_page_floataction_button_widget.dart';
import '../widgets/home_drower.dart';
import '../widgets/home_page_card_widget.dart';
import '../../vm/home_page_vm.dart';

final homePageVM = ChangeNotifierProvider.autoDispose<HomePageVm>((ref) {
  return HomePageVm(AppRepositoryImpl());
});

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  late ScrollController _scrollController;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    
    // Данные загружаются автоматически в конструкторе HomePageVm
    // Не нужно вызывать здесь, чтобы избежать лишних rebuilds
  }

  // Метод для обновления списка извне (например, после создания плантации)
  void refreshPlantationsList() {
    ref.read(homePageVM).getPlantationsModel(isLoadMore: false);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final vm = ref.watch(homePageVM);
    
    return _buildContent(vm);
  }
  
  Widget _buildContent(HomePageVm vm) {
    if (vm.isLoading) {
      return Scaffold(
        backgroundColor: Colors.white,
        appBar: CustomAppBarWidget(
          title: "Ma`lumotlar yuklanmoqda",
          canPop: false,
          actions: [
            SearchBarWidget(
              key: const ValueKey('home_search'),
              onSearchChanged: (query) {
                vm.getPlantationsModel(isLoadMore: false, search: query.isEmpty ? null : query);
              },
            ),
            IconButton(
              onPressed: () {
                context.go("${AppRouteNames.home}${AppRouteNames.natificationPage}");
              },
              icon: Icon(Icons.notifications_none),
            ),
          ],
        ),
        body: Center(child: Lottie.asset('assets/lotties/search.json', width: 300.w, height: 300.h, fit: BoxFit.contain)),
      );
    }
    if (vm.errorMessage != null) {
      return Scaffold(
        appBar: CustomAppBarWidget(
          title: "Kutilmagan xatolik",
          canPop: false,
          actions: [
            SearchBarWidget(
              key: const ValueKey('home_search'),
              onSearchChanged: (query) {
                vm.getPlantationsModel(isLoadMore: false, search: query.isEmpty ? null : query);
              },
            ),
            IconButton(
              onPressed: () {
                context.go("${AppRouteNames.home}${AppRouteNames.natificationPage}");
              },
              icon: Icon(Icons.notifications_none),
            ),
          ],
        ),
        body: ErrorStateWidget(errorMessage: vm.errorMessage ?? "Kutilmagan javob qaytdi", onTap: () => vm.getPlantationsModel(isLoadMore: false)),
      );
    }
    return Scaffold(
      appBar: CustomAppBarWidget(
        title: "GEO Agro",
        canPop: false,
        actions: [
          SearchBarWidget(
            key: const ValueKey('home_search'),
            onSearchChanged: (query) {
              vm.getPlantationsModel(isLoadMore: false, search: query.isEmpty ? null : query);
            },
          ),
          Stack(
            children: [
              IconButton(
                onPressed: () {
                  context.go("${AppRouteNames.home}${AppRouteNames.natificationPage}");
                },
                icon: Icon(Icons.notifications_none),
              ),
              // Badge placeholder: will be updated when we wire unread count into HomePage VM if needed
            ],
          ),
        ],
      ),
      drawer: HomeDrawer(),
      floatingActionButton: HomePageFloatactionButtonWidget(onPressed: () {
        context.go("${AppRouteNames.home}${AppRouteNames.farmers}");
      }),
      body: vm.plantationsList.isEmpty
          ? RefreshIndicator(
              onRefresh: () async {
                await vm.getPlantationsModel(isLoadMore: false);
              },
              color: AppColors.c28A745,
              backgroundColor: AppColors.cF7F7F7,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: SizedBox(
                    height: MediaQuery.of(context).size.height * 0.7,
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SvgPicture.asset('assets/svg/last_transaction.svg', fit: BoxFit.contain),
                          16.verticalSpace,
                          Text(
                            maxLines: 2,
                            "Sizning hududingizga doir \n hech qanday Bog', Issiqxona, Uzumzor yoq",
                            style: TextStyle(fontSize: 18.sp, color: AppColors.c1E1E1E),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    )),
              ),
            )
          : RefreshIndicator(
              onRefresh: () async {
                await vm.getPlantationsModel(isLoadMore: false);
              },
              color: AppColors.c28A745,
              backgroundColor: AppColors.cF7F7F7,
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                controller: _scrollController,
                separatorBuilder: (_, __) => 16.verticalSpace,
                padding: REdgeInsets.symmetric(horizontal: 16, vertical: 20),
                itemCount: vm.plantationsList.length + ((vm.canLoadNext && !vm.isSearching) ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == vm.plantationsList.length && !vm.isSearching) {
                    // Кнопка "Qolganlarini ko'rish"
                    return Container(
                      margin: REdgeInsets.symmetric(vertical: 16),
                      child: ElevatedButton(
                        onPressed: vm.isFetchingMore ? null : () {
                          vm.getPlantationsModel(isLoadMore: true);
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
                  Result plantation = vm.plantationsList[index];
                  return Padding(
                    padding: REdgeInsets.symmetric(horizontal: 4),
                    child: HomePageCardWidget(
                      plantation: plantation,
                      showEditButton: true,
                    ),
                  );
                },
              ),
            ),
    );
  }
}
