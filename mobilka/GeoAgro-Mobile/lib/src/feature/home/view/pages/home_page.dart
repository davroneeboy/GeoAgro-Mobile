import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:lottie/lottie.dart';

import '../../../../core/routes/app_route_names.dart';
import '../../../../core/widgets/error_state_widget.dart';
import '../../../../core/widgets/empty_state_widget.dart';
import '../../../../core/widgets/search_bar_widget.dart';
import '../../../../data/model/plantation/plantations_list_model.dart';
import '../../../../data/repository/app_repository_impl.dart';
import '../../../../core/widgets/custom_app_bar_widget.dart';
import '../../../fermers/view/pages/fermers_page.dart'
    show FermersPage, fermerPageVM;
import '../../../fermers/view/pages/farmers_statistics_page.dart'
    show FarmersStatisticsPage, farmersStatisticsVM;
import '../../../profile/view/pages/profile_settings_page.dart';
import '../widgets/home_page_floataction_button_widget.dart';
import '../widgets/home_drower.dart';
import '../widgets/home_page_card_widget.dart';
import '../../vm/home_page_vm.dart';
import '../pages/natification_page.dart' show notificationsVM;
import 'package:agro_employee_public/design_system/tokens/colors.dart'
    as design_colors;
import 'package:agro_employee_public/design_system/tokens/adaptive_colors.dart';
import '../../../../core/services/pin_service.dart';
import '../../../../core/setting/setup.dart' as app_setup;

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
    // Загружаем данные только для главной вкладки при первой загрузке
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadTabData(0); // Загружаем данные для главной вкладки
      _checkBiometricOffer(); // Предлагаем биометрию после логина
      ref.read(notificationsVM).startPolling();
    });
  }

  /// Проверяет, установлен ли PIN. Если нет — отправляет на обязательную установку.
  ///
  /// Эта проверка работает как страховка для случаев,
  /// когда пользователь попал на home без PIN (обратная совместимость,
  /// обновление приложения и т.д.).
  Future<void> _checkBiometricOffer() async {
    // Если PIN уже установлен — ничего делать не нужно
    final hasPinSet = await PinService.instance.isPinSet();
    if (hasPinSet) return;
    // Если нет токена — не нужно (пользователь не авторизован)
    if (app_setup.accessToken == null) return;
    if (!mounted) return;
    // PIN не установлен — отправляем на обязательную установку
    context.go(AppRouteNames.pinSetup);
  }

  void refreshPlantationsList() {
    ref.read(homePageVM).getPlantationsModel(isLoadMore: false);
  }

  /// Загрузить данные для конкретной вкладки
  void _loadTabData(int index) {
    switch (index) {
      case 0: // Главная страница
        final vm = ref.read(homePageVM);
        if (vm.plantationsList.isEmpty && !vm.isLoading) {
          vm.getPlantationsModel(isLoadMore: false);
        }
        ref.read(notificationsVM).loadUnreadCount();
        break;
      case 1: // Фермеры
        final fermerVm = ref.read(fermerPageVM);
        if (fermerVm.fermersList.isEmpty &&
            !fermerVm.isLoading &&
            !fermerVm.isFetchingMore) {
          fermerVm.getFermers(isLoadMore: false);
        }
        break;
      case 2: // Статистика
        final statsVm = ref.read(farmersStatisticsVM);
        if (statsVm.statistics == null && !statsVm.isLoading) {
          statsVm.initialize();
        }
        break;
      case 3: // Профиль
        // Профиль загружает данные при первом построении виджета
        break;
    }
  }

  @override
  void dispose() {
    ref.read(notificationsVM).stopPolling();
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
      backgroundColor: context.colors.background,
      body: IndexedStack(
        index: _selectedIndex,
        children: tabs,
      ),
      bottomNavigationBar: Container(
        margin: EdgeInsets.only(left: 12.w, right: 12.w, bottom: 12.h),
        decoration: BoxDecoration(
          color: context.colors.surfaceVariant,
          borderRadius: BorderRadius.circular(24.r),
          border: context.colors.cardBorder,
          boxShadow: [
            BoxShadow(
              color: Colors.black
                  .withValues(alpha: context.colors.isDark ? 0.08 : 0.06),
              blurRadius: context.colors.isDark ? 24 : 16,
              offset: const Offset(0, 4),
            ),
            if (!context.colors.isDark)
              const BoxShadow(
                color: Color(0x08000000),
                blurRadius: 1,
                offset: Offset(0, 0),
              ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24.r),
          child: NavigationBarTheme(
            data: NavigationBarThemeData(
              backgroundColor: Colors.transparent,
              surfaceTintColor: Colors.transparent,
              indicatorColor:
                  design_colors.AppColors.accentGreen.withValues(alpha: 0.12),
              indicatorShape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16.r),
              ),
              labelTextStyle: WidgetStateProperty.resolveWith(
                (states) => TextStyle(
                  fontSize: 12.sp,
                  fontWeight: states.contains(WidgetState.selected)
                      ? FontWeight.w600
                      : FontWeight.w500,
                  color: states.contains(WidgetState.selected)
                      ? design_colors.AppColors.accentGreen
                      : context.colors.textTertiary,
                ),
              ),
              iconTheme: WidgetStateProperty.resolveWith(
                (states) => IconThemeData(
                  size: 22.sp,
                  color: states.contains(WidgetState.selected)
                      ? design_colors.AppColors.accentGreen
                      : context.colors.textTertiary,
                ),
              ),
              elevation: 0,
            ),
            child: NavigationBar(
              height: 64,
              selectedIndex: _selectedIndex,
              onDestinationSelected: (index) {
                setState(() {
                  _selectedIndex = index;
                });
                _loadTabData(index);
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
        ),
      ),
    );
  }

  Widget _buildContent(HomePageVm vm) {
    if (vm.isLoading) {
      return Scaffold(
        backgroundColor: context.colors.background,
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
        backgroundColor: context.colors.background,
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
          Consumer(
            builder: (context, ref, child) {
              final notificationsVm = ref.watch(notificationsVM);
              final unreadCount = notificationsVm.unreadCount;
              return Stack(
                children: [
                  IconButton(
                    onPressed: () {
                      context.go(
                          "${AppRouteNames.home}${AppRouteNames.natificationPage}");
                    },
                    icon: Icon(Icons.notifications_none),
                  ),
                  if (unreadCount > 0)
                    Positioned(
                      right: 8,
                      top: 8,
                      child: Container(
                        padding: EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                        constraints: BoxConstraints(
                          minWidth: 16,
                          minHeight: 16,
                        ),
                        child: Text(
                          unreadCount > 99 ? '99+' : '$unreadCount',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              );
            },
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
              color: design_colors.AppColors.accentGreen,
              backgroundColor: context.colors.surface,
              child: LayoutBuilder(
                builder: (context, constraints) => SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  child: SizedBox(
                    height: constraints.maxHeight,
                    child: const EmptyStateWidget(
                      message:
                          "Sizning hududingizga doir \n hech qanday Bog', Issiqxona, Uzumzor yoq",
                      subMessage:
                          "Ma'lumotlarni yangilash uchun pastga torting",
                    ),
                  ),
                ),
              ),
            )
          : RefreshIndicator(
              onRefresh: () async {
                await vm.getPlantationsModel(isLoadMore: false);
              },
              color: design_colors.AppColors.accentGreen,
              backgroundColor: context.colors.surface,
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                controller: _scrollController,
                separatorBuilder: (_, __) => 16.verticalSpace,
                padding: REdgeInsets.symmetric(horizontal: 16, vertical: 20),
                itemCount: vm.plantationsList.length +
                    ((vm.canLoadNext && !vm.isSearching) ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == vm.plantationsList.length && !vm.isSearching) {
                    return Container(
                      margin: REdgeInsets.symmetric(vertical: 16),
                      child: ElevatedButton(
                        onPressed: vm.isFetchingMore
                            ? null
                            : () {
                                vm.getPlantationsModel(isLoadMore: true);
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: design_colors.AppColors.accentGreen,
                          foregroundColor: Colors.white,
                          padding: REdgeInsets.symmetric(
                              vertical: 16, horizontal: 32),
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
