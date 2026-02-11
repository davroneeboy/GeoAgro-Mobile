import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'package:agro_employee_public/design_system/tokens/colors.dart' as DesignColors;
import 'package:agro_employee_public/design_system/tokens/radii.dart';
import 'package:agro_employee_public/design_system/tokens/spacing.dart';
import 'package:agro_employee_public/design_system/tokens/typography.dart';
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
  }

  void _ensureDataLoaded() {
    if (!_hasLoaded) {
      _hasLoaded = true;
      _loadUserInfo();
      _loadPermissionsStatus();
    }
  }

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
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        return;
      }
    }
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          "Telegram bot ochilmadi. Ilovani o'rnatib, @geoagro_bot manzilini kiriting.",
          style: AppTypography.caption(context).copyWith(
            color: DesignColors.AppColors.darkTextPrimary,
          ),
        ),
        backgroundColor: DesignColors.AppColors.error,
      ),
    );
  }

  Future<void> _requestPermission({
    required bool currentStatus,
    required Future<bool> Function() requestFn,
    required void Function(bool) onResult,
    required String permissionName,
  }) async {
    if (currentStatus) return;
    final granted = await requestFn();
    if (!mounted) return;
    onResult(granted);
    if (!granted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("$permissionName ruxsati berilmadi"),
          backgroundColor: DesignColors.AppColors.error,
        ),
      );
    } else {
      await _loadPermissionsStatus();
    }
  }

  @override
  Widget build(BuildContext context) {
    _ensureDataLoaded();

    return Scaffold(
      backgroundColor: DesignColors.AppColors.darkBackground,
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
              style: AppTypography.body(context).copyWith(
                color: DesignColors.AppColors.error,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
      body: _isLoading
          ? Center(
              child: CircularProgressIndicator(
                color: DesignColors.AppColors.accentGreen,
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadUserInfo,
              color: DesignColors.AppColors.accentGreen,
              backgroundColor: DesignColors.AppColors.darkSurface,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.lg,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildProfileHeader(),
                    SizedBox(height: AppSpacing.xl.h),
                    _buildSectionTitle("Shaxsiy ma'lumotlar"),
                    SizedBox(height: AppSpacing.sm.h),
                    _buildPersonalInfoCard(),
                    SizedBox(height: AppSpacing.xl.h),
                    _buildSectionTitle("Ruxsatlar"),
                    SizedBox(height: AppSpacing.sm.h),
                    _buildPermissionsCard(),
                    SizedBox(height: AppSpacing.xl.h),
                    _buildSectionTitle("Qo'llab-quvvatlash"),
                    SizedBox(height: AppSpacing.sm.h),
                    _buildSupportCard(),
                    SizedBox(height: AppSpacing.xl.h),
                  ],
                ),
              ),
            ),
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PROFILE HEADER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Widget _buildProfileHeader() {
    if (_userInfo == null) {
      return _buildCard(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Column(
              children: [
                Icon(
                  Icons.person_outline,
                  size: 48.sp,
                  color: DesignColors.AppColors.darkTextSecondary,
                ),
                SizedBox(height: AppSpacing.md.h),
                Text(
                  "Ma'lumot topilmadi",
                  style: AppTypography.title(context).copyWith(
                    color: DesignColors.AppColors.darkTextPrimary,
                  ),
                ),
                SizedBox(height: AppSpacing.xs.h),
                Text(
                  "Profil ma'lumotlari yuklanmadi. Qayta urinib ko'ring.",
                  textAlign: TextAlign.center,
                  style: AppTypography.caption(context).copyWith(
                    color: DesignColors.AppColors.darkTextSecondary,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final initials = _initialsFromName(_userInfo!.displayName);

    return _buildCard(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 56.w,
              height: 56.w,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [
                    DesignColors.AppColors.accentGreen,
                    DesignColors.AppColors.accentGreenDark,
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              alignment: Alignment.center,
              child: Text(
                initials,
                style: TextStyle(
                  fontSize: 20.sp,
                  fontWeight: FontWeight.w700,
                  color: DesignColors.AppColors.darkTextPrimary,
                ),
              ),
            ),
            SizedBox(width: AppSpacing.lg.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _userInfo!.displayName.isNotEmpty
                        ? _userInfo!.displayName
                        : _userInfo!.username,
                    style: AppTypography.title(context).copyWith(
                      color: DesignColors.AppColors.darkTextPrimary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  if (_userInfo!.districtName.isNotEmpty) ...[
                    SizedBox(height: AppSpacing.xs.h),
                    Text(
                      _userInfo!.districtName,
                      style: AppTypography.caption(context).copyWith(
                        color: DesignColors.AppColors.darkTextSecondary,
                      ),
                    ),
                  ],
                  if (_userInfo!.phoneNumber.isNotEmpty) ...[
                    SizedBox(height: AppSpacing.xs.h),
                    Text(
                      _userInfo!.phoneNumber,
                      style: AppTypography.body(context).copyWith(
                        color: DesignColors.AppColors.darkTextPrimary,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PERSONAL INFO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Widget _buildPersonalInfoCard() {
    return _buildCard(
      child: Column(
        children: [
          _buildInfoRow(Icons.person_outline, "F.I.Sh",
              _userInfo?.displayName ?? "Ko'rsatilmagan"),
          _buildDivider(),
          _buildInfoRow(
              Icons.place_outlined,
              "Viloyat",
              _userInfo != null
                  ? (_regionNames[_userInfo!.regionId] ?? "Ko'rsatilmagan")
                  : "Ko'rsatilmagan"),
          _buildDivider(),
          _buildInfoRow(Icons.map_outlined, "Tuman",
              _userInfo?.districtName ?? "Ko'rsatilmagan"),
          _buildDivider(),
          _buildInfoRow(Icons.phone_outlined, "Telefon",
              _userInfo?.phoneNumber ?? "Ko'rsatilmagan"),
        ],
      ),
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PERMISSIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Widget _buildPermissionsCard() {
    return _buildCard(
      child: Column(
        children: [
          _buildPermissionRow(
            icon: Icons.camera_alt_outlined,
            title: "Kamera",
            isEnabled: _cameraPermission,
            onTap: () => _requestPermission(
              currentStatus: _cameraPermission,
              requestFn: _permissionsService.requestCameraPermission,
              onResult: (v) => setState(() => _cameraPermission = v),
              permissionName: "Kamera",
            ),
          ),
          _buildDivider(),
          _buildPermissionRow(
            icon: Icons.photo_library_outlined,
            title: "Galereya",
            isEnabled: _galleryPermission,
            onTap: () => _requestPermission(
              currentStatus: _galleryPermission,
              requestFn: _permissionsService.requestGalleryPermission,
              onResult: (v) => setState(() => _galleryPermission = v),
              permissionName: "Galereya",
            ),
          ),
          _buildDivider(),
          _buildPermissionRow(
            icon: Icons.location_on_outlined,
            title: "Geolokatsiya",
            isEnabled: _locationPermission,
            onTap: () => _requestPermission(
              currentStatus: _locationPermission,
              requestFn: _permissionsService.requestLocationPermission,
              onResult: (v) => setState(() => _locationPermission = v),
              permissionName: "Geolokatsiya",
            ),
          ),
          _buildDivider(),
          _buildPermissionRow(
            icon: Icons.notifications_outlined,
            title: "Bildirishnomalar",
            isEnabled: _notificationPermission,
            onTap: () => _requestPermission(
              currentStatus: _notificationPermission,
              requestFn: _permissionsService.requestNotificationPermission,
              onResult: (v) => setState(() => _notificationPermission = v),
              permissionName: "Bildirishnomalar",
            ),
          ),
        ],
      ),
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SUPPORT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Widget _buildSupportCard() {
    return _buildCard(
      onTap: _openTelegramBot,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        child: Row(
          children: [
            Icon(
              Icons.support_agent_outlined,
              color: DesignColors.AppColors.accentGreen,
              size: 24.sp,
            ),
            SizedBox(width: AppSpacing.md.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Telegram bot",
                    style: AppTypography.body(context).copyWith(
                      color: DesignColors.AppColors.darkTextPrimary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  SizedBox(height: 2.h),
                  Text(
                    "Taklif va shikoyatlar uchun @geoagro_bot",
                    style: AppTypography.caption(context).copyWith(
                      color: DesignColors.AppColors.darkTextSecondary,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.north_east,
              color: DesignColors.AppColors.darkTextSecondary,
              size: 18.sp,
            ),
          ],
        ),
      ),
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // REUSABLE BUILDERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: AppTypography.title(context).copyWith(
        color: DesignColors.AppColors.darkTextPrimary,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  Widget _buildCard({required Widget child, VoidCallback? onTap}) {
    final container = Container(
      decoration: BoxDecoration(
        color: DesignColors.AppColors.darkSurfaceVariant,
        borderRadius: BorderRadius.circular(AppRadii.card),
        border: Border.all(color: DesignColors.AppColors.darkBorder),
      ),
      child: child,
    );
    if (onTap != null) {
      return Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppRadii.card),
          child: container,
        ),
      );
    }
    return container;
  }

  Widget _buildDivider() {
    return Divider(
      height: 1,
      thickness: 1,
      color: DesignColors.AppColors.darkBorder,
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      child: Row(
        children: [
          Icon(icon, size: 20.sp, color: DesignColors.AppColors.accentGreen),
          SizedBox(width: AppSpacing.md.w),
          Expanded(
            flex: 4,
            child: Text(
              label,
              style: AppTypography.caption(context).copyWith(
                color: DesignColors.AppColors.darkTextSecondary,
              ),
            ),
          ),
          SizedBox(width: AppSpacing.md.w),
          Expanded(
            flex: 6,
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: AppTypography.body(context).copyWith(
                color: DesignColors.AppColors.darkTextPrimary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPermissionRow({
    required IconData icon,
    required String title,
    required bool isEnabled,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: isEnabled ? null : onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        child: Row(
          children: [
            Icon(icon, size: 20.sp, color: DesignColors.AppColors.accentGreen),
            SizedBox(width: AppSpacing.md.w),
            Expanded(
              child: Text(
                title,
                style: AppTypography.body(context).copyWith(
                  color: DesignColors.AppColors.darkTextPrimary,
                ),
              ),
            ),
            if (_isLoadingPermissions)
              SizedBox(
                width: 20.sp,
                height: 20.sp,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: DesignColors.AppColors.accentGreen,
                ),
              )
            else
              Icon(
                isEnabled ? Icons.check_circle : Icons.circle_outlined,
                color: isEnabled
                    ? DesignColors.AppColors.accentGreen
                    : DesignColors.AppColors.darkTextSecondary,
                size: 24.sp,
              ),
          ],
        ),
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
