import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:lottie/lottie.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../../../core/routes/app_route_names.dart';
import '../../../../core/widgets/error_state_widget.dart';
import '../../../../core/widgets/search_bar_widget.dart';
import '../../../../data/model/plantation/plantations_list_model.dart';
import '../../../../data/repository/app_repository_impl.dart';
import '../../../../core/widgets/custom_app_bar_widget.dart';
import '../../../fermers/view/pages/fermers_page.dart';
import '../../../fermers/view/pages/farmers_statistics_page.dart';
import '../../../profile/view/pages/profile_settings_page.dart';
import '../widgets/home_page_floataction_button_widget.dart';
import '../widgets/home_drower.dart';
import '../widgets/home_page_card_widget.dart';
import '../../vm/home_page_vm.dart';
import 'package:agro_employee_public/design_system/tokens/colors.dart'
    as DesignColors;

final homePageVM = ChangeNotifierProvider.autoDispose<HomePageVm>((ref) {
  return HomePageVm(AppRepositoryImpl());
});

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  int _selectedIndex = 0;
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

    final tabs = <Widget>[
      _buildContent(vm),
      const FermersPage(),
      const FarmersStatisticsPage(),
      const ProfileSettingsPage(),
    ];

    return Scaffold(
      backgroundColor: DesignColors.AppColors.darkBackground,
      body: IndexedStack(
        index: _selectedIndex,
        children: tabs,
      ),
      bottomNavigationBar: NavigationBarTheme(
        data: NavigationBarThemeData(
          backgroundColor: DesignColors.AppColors.darkSurfaceVariant,
          indicatorColor: DesignColors.AppColors.accentGreen.withOpacity(0.16),
          labelTextStyle: MaterialStateProperty.resolveWith(
            (states) => TextStyle(
              fontWeight: states.contains(MaterialState.selected)
                  ? FontWeight.w600
                  : FontWeight.w500,
              color: states.contains(MaterialState.selected)
                  ? DesignColors.AppColors.darkTextPrimary
                  : DesignColors.AppColors.darkTextTertiary,
            ),
          ),
          iconTheme: MaterialStateProperty.resolveWith(
            (states) => IconThemeData(
              color: states.contains(MaterialState.selected)
                  ? DesignColors.AppColors.accentGreen
                  : DesignColors.AppColors.darkTextSecondary.withOpacity(0.7),
            ),
          ),
          elevation: 12,
        ),
        child: NavigationBar(
          height: 70,
          selectedIndex: _selectedIndex,
          onDestinationSelected: (index) {
            setState(() {
              _selectedIndex = index;
            });
          },
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home_rounded),
              label: "Uy",
            ),
            NavigationDestination(
              icon: Icon(Icons.agriculture_outlined),
              selectedIcon: Icon(Icons.agriculture),
              label: "Fermerlar",
            ),
            NavigationDestination(
              icon: Icon(Icons.bar_chart_outlined),
              selectedIcon: Icon(Icons.bar_chart),
              label: "Statistika",
            ),
            NavigationDestination(
              icon: Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person),
              label: "Profil",
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(HomePageVm vm) {
    if (vm.isLoading) {
      return Scaffold(
        backgroundColor: DesignColors.AppColors.darkBackground,
        appBar: CustomAppBarWidget(
          title: "Ma`lumotlar yuklanmoqda",
          canPop: false,
          actions: [
            SearchBarWidget(
              key: const ValueKey('home_search'),
              onSearchChanged: (query) {
                vm.getPlantationsModel(
                    isLoadMore: false, search: query.isEmpty ? null : query);
              },
            ),
            IconButton(
              onPressed: () {
                context.go(
                    "${AppRouteNames.home}${AppRouteNames.natificationPage}");
              },
              icon: Icon(Icons.notifications_none),
            ),
          ],
        ),
        body: Center(
            child: Lottie.asset('assets/lotties/search.json',
                width: 300.w, height: 300.h, fit: BoxFit.contain)),
      );
    }
    if (vm.errorMessage != null) {
      return Scaffold(
        backgroundColor: DesignColors.AppColors.darkBackground,
        appBar: CustomAppBarWidget(
          title: "Kutilmagan xatolik",
          canPop: false,
          actions: [
            SearchBarWidget(
              key: const ValueKey('home_search'),
              onSearchChanged: (query) {
                vm.getPlantationsModel(
                    isLoadMore: false, search: query.isEmpty ? null : query);
              },
            ),
            IconButton(
              onPressed: () {
                context.go(
                    "${AppRouteNames.home}${AppRouteNames.natificationPage}");
              },
              icon: Icon(Icons.notifications_none),
            ),
          ],
        ),
        body: ErrorStateWidget(
            errorMessage: vm.errorMessage ?? "Kutilmagan javob qaytdi",
            onTap: () => vm.getPlantationsModel(isLoadMore: false)),
      );
    }
    return Scaffold(
      appBar: CustomAppBarWidget(
        title: "Uy sahifasi",
        canPop: false,
        actions: [
          SearchBarWidget(
            key: const ValueKey('home_search'),
            onSearchChanged: (query) {
              vm.getPlantationsModel(
                  isLoadMore: false, search: query.isEmpty ? null : query);
            },
          ),
          Stack(
            children: [
              IconButton(
                onPressed: () {
                  context.go(
                      "${AppRouteNames.home}${AppRouteNames.natificationPage}");
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
              color: DesignColors.AppColors.accentGreen,
              backgroundColor: DesignColors.AppColors.darkSurface,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: SizedBox(
                    height: MediaQuery.of(context).size.height * 0.7,
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SvgPicture.asset('assets/svg/last_transaction.svg',
                              fit: BoxFit.contain),
                          16.verticalSpace,
                          Text(
                            maxLines: 2,
                            "Sizning hududingizga doir \n hech qanday Bog', Issiqxona, Uzumzor yoq",
                            style: TextStyle(
                                fontSize: 18.sp,
                                color: DesignColors.AppColors.darkTextPrimary),
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
              color: DesignColors.AppColors.accentGreen,
              backgroundColor: DesignColors.AppColors.darkSurface,
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                controller: _scrollController,
                separatorBuilder: (_, __) => 16.verticalSpace,
                padding: REdgeInsets.symmetric(horizontal: 16, vertical: 20),
                itemCount: vm.plantationsList.length +
                    ((vm.canLoadNext && !vm.isSearching) ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == vm.plantationsList.length && !vm.isSearching) {
                    // Кнопка "Qolganlarini ko'rish"
                    return Container(
                      margin: REdgeInsets.symmetric(vertical: 16),
                      child: ElevatedButton(
                        onPressed: vm.isFetchingMore
                            ? null
                            : () {
                                vm.getPlantationsModel(isLoadMore: true);
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: DesignColors.AppColors.accentGreen,
                          foregroundColor: Colors.white,
                          padding: REdgeInsets.symmetric(
                              vertical: 16, horizontal: 32),
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
                                  Text("Yuklanmoqda...",
                                      style: TextStyle(fontSize: 16.sp)),
                                ],
                              )
                            : Text("Qolganlarini ko'rish",
                                style: TextStyle(fontSize: 16.sp)),
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
