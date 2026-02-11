import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
    as DesignColors;
import '../../../../core/services/biometric_service.dart';
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
    });
  }

  /// Автоматически включает блокировку устройства после логина.
  ///
  /// Если устройство поддерживает — делает пробную аутентификацию
  /// и только при успехе включает блокировку.
  /// Если устройство не защищено — показывает предупреждение.
  Future<void> _checkBiometricOffer() async {
    if (!app_setup.shouldOfferBiometric) return;
    app_setup.shouldOfferBiometric = false;
    final biometricService = BiometricService.instance;
    // Уже включена — пропускаем
    final alreadyEnabled = await biometricService.isBiometricEnabled();
    if (alreadyEnabled) return;
    // Проверяем поддержку устройства
    final availability = await biometricService.checkAvailability();
    if (!mounted) return;
    switch (availability) {
      case BiometricAvailability.available:
        // Пробная аутентификация — убеждаемся, что пользователь может пройти
        final testResult = await biometricService.authenticate(
          reason: "Qurilma qulfini tekshirish",
        );
        if (testResult) {
          await biometricService.setBiometricEnabled(true);
          app_setup.biometricEnabled = true;
          debugPrint("Блокировка устройства включена после пробной аутентификации");
        } else {
          debugPrint("Пробная аутентификация не пройдена, блокировка не включена");
        }
        break;
      case BiometricAvailability.noSecuritySetup:
        // Устройство не защищено — показываем предупреждение
        debugPrint("Устройство не защищено, показываем предупреждение");
        if (mounted) {
          await biometricService.showSetupSecurityDialog(context);
        }
        break;
      case BiometricAvailability.securityRemoved:
        // Маловероятно после логина, но обрабатываем
        debugPrint("Блокировка была убрана с устройства");
        break;
    }
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
            // Загружаем данные для вкладки при переключении
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
              color: DesignColors.AppColors.accentGreen,
              backgroundColor: DesignColors.AppColors.darkSurface,
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
