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

  @override
  void initState() {
    super.initState();
    _loadUserInfo();
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
                      title: "Ilova sozlamalari",
                      padding: EdgeInsets.zero,
                    ),
                    SizedBox(height: AppSpacing.sm.h),
                    AppCardFilled(
                      padding: EdgeInsets.all(AppSpacing.lg),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(AppSpacing.md),
                            decoration: BoxDecoration(
                              color: Theme.of(context)
                                  .colorScheme
                                  .primaryContainer,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.watch_later_outlined,
                              color: Theme.of(context)
                                  .colorScheme
                                  .onPrimaryContainer,
                            ),
                          ),
                          SizedBox(width: AppSpacing.lg),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  "Tez kunda",
                                  style: AppTypography.headlineMedium(context)
                                      .copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                SizedBox(height: AppSpacing.xs),
                                Text(
                                  "Ilova sozlamalari bo‘limi tez orada ishga tushiriladi.",
                                  style: AppTypography.bodyMedium(context)
                                      .copyWith(
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onSurfaceVariant,
                                  ),
                                ),
                              ],
                            ),
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
                      child: Column(
                        children: [
                          AppListTile(
                            title: "Telegram bot",
                            subtitle: "@geoagro_bot",
                            leading: const Icon(Icons.support_agent_outlined),
                            trailing: const Icon(Icons.north_east),
                            onTap: _openTelegramBot,
                          ),
                          const Divider(height: 1),
                          AppListTile(
                            title: "Fikr bildirish",
                            subtitle: "Taklif va shikoyatlar",
                            leading: const Icon(Icons.chat_bubble_outline),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () {},
                          ),
                        ],
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
                if ((userInfo!.districtName ?? '').isNotEmpty)
                  Text(
                    userInfo!.districtName!,
                    style: AppTypography.bodyMedium(context).copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                if ((userInfo!.phoneNumber ?? '').isNotEmpty) ...[
                  SizedBox(height: AppSpacing.xs.h),
                  Text(
                    userInfo!.phoneNumber!,
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
