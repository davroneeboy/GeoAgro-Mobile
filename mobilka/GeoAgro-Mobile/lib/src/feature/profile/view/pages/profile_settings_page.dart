import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:agro_employee_public/design_system/components/cards.dart';
import 'package:agro_employee_public/design_system/components/list_tiles.dart';
import 'package:agro_employee_public/design_system/components/empty_state.dart';
import 'package:agro_employee_public/design_system/theme/spacing.dart';
import 'package:agro_employee_public/design_system/theme/typography.dart';
import 'package:agro_employee_public/design_system/tokens/colors.dart'
    as DesignTokens;
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:agro_employee_public/src/core/routes/app_route_names.dart';
import 'package:agro_employee_public/src/core/storage/app_storage.dart';
import 'package:agro_employee_public/src/core/widgets/custom_app_bar_widget.dart';
import 'package:agro_employee_public/src/core/services/permissions_service.dart';
import 'package:agro_employee_public/src/data/model/user/user_info_model.dart';
import 'package:agro_employee_public/src/data/repository/app_repository_impl.dart';

class ProfileSettingsPage extends StatefulWidget {
  const ProfileSettingsPage({super.key});

  @override
  State<ProfileSettingsPage> createState() => _ProfileSettingsPageState();
}

class _ProfileSettingsPageState extends State<ProfileSettingsPage> {
  UserInfoModel? _userInfo;
  bool _isLoading = true;

  // Статусы разрешений
  bool _cameraPermission = false;
  bool _galleryPermission = false;
  bool _locationPermission = false;
  bool _notificationPermission = false;
  bool _isLoadingPermissions = false;

  final _permissionsService = PermissionsService();

  static const _telegramBotUri = 'https://t.me/geoagro_bot';

  static const Map<int, String> _regionNames = {
    1: 'Toshkent',
    2: 'Andijon',
    3: 'Buxoro',
    4: 'Fargʻona',
    5: 'Jizzax',
    6: 'Qashqadaryo',
    7: 'Navoiy',
    8: 'Namangan',
    9: 'Samarqand',
    10: 'Sirdaryo',
    11: 'Surxondaryo',
    12: 'Qoraqalpogʻiston',
    13: 'Xorazm',
  };

  final _repository = AppRepositoryImpl();

  bool _hasLoaded = false;

  @override
  void initState() {
    super.initState();
    // Не загружаем данные сразу, только при первом открытии вкладки
  }

  void _ensureDataLoaded() {
    if (!_hasLoaded) {
      _hasLoaded = true;
      _loadUserInfo();
      _loadPermissionsStatus();
    }
  }

  /// Загрузить статусы всех разрешений
  Future<void> _loadPermissionsStatus() async {
    setState(() => _isLoadingPermissions = true);
    try {
      final statuses = await _permissionsService.getAllPermissionsStatus();
      setState(() {
        _cameraPermission = statuses['camera'] ?? false;
        _galleryPermission = statuses['gallery'] ?? false;
        _locationPermission = statuses['location'] ?? false;
        _notificationPermission = statuses['notifications'] ?? false;
        _isLoadingPermissions = false;
      });
    } catch (e) {
      setState(() => _isLoadingPermissions = false);
    }
  }

  Future<void> _loadUserInfo() async {
    setState(() => _isLoading = true);

    try {
      final response = await _repository.getUserInfo();
      if (!mounted) return;

      if (response != null) {
        final decoded = jsonDecode(response);
        if (decoded is Map<String, dynamic>) {
          setState(() {
            _userInfo = UserInfoModel.fromJson(decoded);
            _isLoading = false;
          });
          return;
        }
      }

      setState(() {
        _userInfo = null;
        _isLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _userInfo = null;
        _isLoading = false;
      });
    }
  }

  Future<void> _openTelegramBot() async {
    final uriCandidates = [
      Uri.parse('tg://resolve?domain=geoagro_bot'),
      Uri.parse(_telegramBotUri),
    ];

    for (final uri in uriCandidates) {
      if (await canLaunchUrl(uri)) {
        await launchUrl(
          uri,
          mode: LaunchMode.externalApplication,
        );
        return;
      }
    }

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          "Telegram bot ochilmadi. Ilovani o'rnatib, @geoagro_bot manzilini kiriting.",
          style: AppTypography.bodySmall(context).copyWith(
            color: Theme.of(context).colorScheme.onError,
          ),
        ),
        backgroundColor: Theme.of(context).colorScheme.error,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Загружаем данные только при первом построении виджета (когда вкладка становится видимой)
    _ensureDataLoaded();

    final spacing = EdgeInsets.symmetric(
      horizontal: AppSpacing.lg,
      vertical: AppSpacing.lg,
    );

    return Scaffold(
      backgroundColor: DesignTokens.AppColors.darkBackground,
      appBar: CustomAppBarWidget(
        title: "Profil",
        canPop: false,
        actions: [
          TextButton(
            onPressed: () async {
              await AppStorage.clearAllData();
              if (context.mounted) {
                context.go(AppRouteNames.login);
              }
            },
            child: Text(
              "Chiqish",
              style: AppTypography.bodyMedium(context).copyWith(
                color: Theme.of(context).colorScheme.error,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadUserInfo,
              color: Theme.of(context).colorScheme.primary,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: spacing,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _ProfileHeader(userInfo: _userInfo),
                    SizedBox(height: AppSpacing.xl.h),
                    AppSectionHeader(
                      title: "Shaxsiy ma'lumotlar",
                      padding: EdgeInsets.zero,
                    ),
                    SizedBox(height: AppSpacing.sm.h),
                    AppCardFilled(
                      padding: EdgeInsets.zero,
                      child: Column(
                        children: [
                          AppKeyValueTile(
                            label: "F.I.Sh",
                            value: _userInfo?.displayName ?? "Ko'rsatilmagan",
                            icon: Icons.person_outline,
                            padding: EdgeInsets.symmetric(
                              horizontal: AppSpacing.lg,
                              vertical: AppSpacing.md,
                            ),
                          ),
                          const Divider(height: 1),
                          AppKeyValueTile(
                            label: "Viloyat",
                            value: _userInfo != null
                                ? (_regionNames[_userInfo!.regionId] ??
                                    "Ko'rsatilmagan")
                                : "Ko'rsatilmagan",
                            icon: Icons.place_outlined,
                            padding: EdgeInsets.symmetric(
                              horizontal: AppSpacing.lg,
                              vertical: AppSpacing.md,
                            ),
                          ),
                          const Divider(height: 1),
                          AppKeyValueTile(
                            label: "Tuman",
                            value: _userInfo?.districtName ?? "Ko'rsatilmagan",
                            icon: Icons.map_outlined,
                            padding: EdgeInsets.symmetric(
                              horizontal: AppSpacing.lg,
                              vertical: AppSpacing.md,
                            ),
                          ),
                          const Divider(height: 1),
                          AppKeyValueTile(
                            label: "Telefon",
                            value: _userInfo?.phoneNumber ?? "Ko'rsatilmagan",
                            icon: Icons.phone_outlined,
                            padding: EdgeInsets.symmetric(
                              horizontal: AppSpacing.lg,
                              vertical: AppSpacing.md,
                            ),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(height: AppSpacing.xl.h),
                    AppSectionHeader(
                      title: "Ruxsatlar",
                      padding: EdgeInsets.zero,
                    ),
                    SizedBox(height: AppSpacing.sm.h),
                    AppCardFilled(
                      padding: EdgeInsets.zero,
                      child: Column(
                        children: [
                          _PermissionTile(
                            title: "Kamera",
                            icon: Icons.camera_alt_outlined,
                            isEnabled: _cameraPermission,
                            isLoading: _isLoadingPermissions,
                            onTap: () async {
                              if (!_cameraPermission) {
                                final granted = await _permissionsService
                                    .requestCameraPermission();
                                if (mounted) {
                                  setState(() => _cameraPermission = granted);
                                  if (!granted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content:
                                            Text("Kamera ruxsati berilmadi"),
                                        backgroundColor:
                                            Theme.of(context).colorScheme.error,
                                      ),
                                    );
                                  } else {
                                    await _loadPermissionsStatus();
                                  }
                                }
                              }
                            },
                          ),
                          const Divider(height: 1),
                          _PermissionTile(
                            title: "Galereya",
                            icon: Icons.photo_library_outlined,
                            isEnabled: _galleryPermission,
                            isLoading: _isLoadingPermissions,
                            onTap: () async {
                              if (!_galleryPermission) {
                                final granted = await _permissionsService
                                    .requestGalleryPermission();
                                if (mounted) {
                                  setState(() => _galleryPermission = granted);
                                  if (!granted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content:
                                            Text("Galereya ruxsati berilmadi"),
                                        backgroundColor:
                                            Theme.of(context).colorScheme.error,
                                      ),
                                    );
                                  } else {
                                    await _loadPermissionsStatus();
                                  }
                                }
                              }
                            },
                          ),
                          const Divider(height: 1),
                          _PermissionTile(
                            title: "Geolokatsiya",
                            icon: Icons.location_on_outlined,
                            isEnabled: _locationPermission,
                            isLoading: _isLoadingPermissions,
                            onTap: () async {
                              if (!_locationPermission) {
                                final granted = await _permissionsService
                                    .requestLocationPermission();
                                if (mounted) {
                                  setState(() => _locationPermission = granted);
                                  if (!granted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(
                                            "Geolokatsiya ruxsati berilmadi"),
                                        backgroundColor:
                                            Theme.of(context).colorScheme.error,
                                      ),
                                    );
                                  } else {
                                    await _loadPermissionsStatus();
                                  }
                                }
                              }
                            },
                          ),
                          const Divider(height: 1),
                          _PermissionTile(
                            title: "Bildirishnomalar",
                            icon: Icons.notifications_outlined,
                            isEnabled: _notificationPermission,
                            isLoading: _isLoadingPermissions,
                            onTap: () async {
                              if (!_notificationPermission) {
                                final granted = await _permissionsService
                                    .requestNotificationPermission();
                                if (mounted) {
                                  setState(
                                      () => _notificationPermission = granted);
                                  if (!granted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(
                                            "Bildirishnomalar ruxsati berilmadi"),
                                        backgroundColor:
                                            Theme.of(context).colorScheme.error,
                                      ),
                                    );
                                  } else {
                                    await _loadPermissionsStatus();
                                  }
                                }
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                    SizedBox(height: AppSpacing.xl.h),
                    AppSectionHeader(
                      title: "Qo'llab-quvvatlash",
                      padding: EdgeInsets.zero,
                    ),
                    SizedBox(height: AppSpacing.sm.h),
                    AppCardFilled(
                      padding: EdgeInsets.zero,
                      child: AppListTile(
                        title: "Telegram bot",
                        subtitle: "Taklif va shikoyatlar uchun @geoagro_bot",
                        leading: const Icon(Icons.support_agent_outlined),
                        trailing: const Icon(Icons.north_east),
                        onTap: _openTelegramBot,
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  final UserInfoModel? userInfo;

  const _ProfileHeader({required this.userInfo});

  @override
  Widget build(BuildContext context) {
    if (userInfo == null) {
      return const AppEmptyState(
        iconData: Icons.person_outline,
        title: "Ma'lumot topilmadi",
        description: "Profil ma'lumotlari yuklanmadi. Qayta urinib ko'ring.",
      );
    }

    final initials = _initialsFromName(userInfo!.displayName);

    return AppCardElevated(
      padding: EdgeInsets.all(AppSpacing.lg),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 56.w,
            height: 56.w,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [
                  DesignTokens.AppColors.accentGreen,
                  DesignTokens.AppColors.accentGreenDark,
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            alignment: Alignment.center,
            child: Text(
              initials,
              style: AppTypography.displaySmall(context).copyWith(
                color: Theme.of(context).colorScheme.onPrimary,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          SizedBox(width: AppSpacing.lg.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  userInfo!.displayName.isNotEmpty
                      ? userInfo!.displayName
                      : userInfo!.username,
                  style: AppTypography.headlineMedium(context).copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                SizedBox(height: AppSpacing.xs.h),
                if (userInfo!.districtName.isNotEmpty)
                  Text(
                    userInfo!.districtName,
                    style: AppTypography.bodyMedium(context).copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                if (userInfo!.phoneNumber.isNotEmpty) ...[
                  SizedBox(height: AppSpacing.xs.h),
                  Text(
                    userInfo!.phoneNumber,
                    style: AppTypography.bodyMedium(context),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _initialsFromName(String name) {
    if (name.trim().isEmpty) return "UZ";
    final parts = name.trim().split(' ');
    if (parts.length == 1) {
      return parts.first.characters.take(2).toString().toUpperCase();
    }
    return (parts.first.characters.first + parts.last.characters.first)
        .toUpperCase();
  }
}

class _PermissionTile extends StatelessWidget {
  final String title;
  final IconData icon;
  final bool isEnabled;
  final bool isLoading;
  final VoidCallback onTap;

  const _PermissionTile({
    required this.title,
    required this.icon,
    required this.isEnabled,
    required this.isLoading,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return AppListTile(
      leading: Icon(icon),
      title: title,
      trailing: isLoading
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : isEnabled
              ? Icon(
                  Icons.check_circle,
                  color: Theme.of(context).colorScheme.primary,
                  size: 24,
                )
              : Icon(
                  Icons.circle_outlined,
                  color: DesignTokens.AppColors.darkTextSecondary,
                  size: 24,
                ),
      onTap: isEnabled ? null : onTap,
    );
  }
}
