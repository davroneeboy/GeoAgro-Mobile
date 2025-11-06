import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:agro_employee_public/src/core/storage/app_storage.dart';
import 'package:agro_employee_public/src/core/routes/app_route_names.dart';
import 'package:agro_employee_public/src/core/setting/setup.dart';
import 'package:agro_employee_public/src/core/version/version_check_service.dart';
import 'package:agro_employee_public/src/data/model/user/user_info_model.dart';
import 'package:agro_employee_public/src/data/repository/app_repository_impl.dart';

class HomeDrawer extends ConsumerStatefulWidget {
  const HomeDrawer({super.key});

  @override
  ConsumerState<HomeDrawer> createState() => _HomeDrawerState();
}

class _HomeDrawerState extends ConsumerState<HomeDrawer> {
  UserInfoModel? userInfo;
  bool isLoading = true;
  String? currentAppVersion;
  final AppRepositoryImpl _appRepositoryImpl = AppRepositoryImpl();

  @override
  void initState() {
    super.initState();
    _loadUserInfo();
    _loadCurrentVersion();
  }

  Future<void> _loadCurrentVersion() async {
    final version = await VersionCheckService.getCurrentVersionForDisplay();
    setState(() {
      currentAppVersion = version;
    });
  }

  Future<void> _loadUserInfo() async {
    try {
      final data = await _appRepositoryImpl.getUserInfo();
      if (data != null) {
        final jsonData = jsonDecode(data);
        setState(() {
          userInfo = UserInfoModel.fromJson(jsonData);
          isLoading = false;
        });
        
        // Проверяем версию после загрузки user info
        if (userInfo?.flutterVersion != null && mounted) {
          await VersionCheckService.checkVersionAndShowUpdateDialog(
            context, 
            userInfo!.flutterVersion,
          );
        }
      } else {
        setState(() {
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return FractionallySizedBox(
      widthFactor: 0.75,
      child: Drawer(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      children: [
                        _buildDrawerHeader(),
                        // Информация о пользователе
                        if (userInfo != null) ...[
                          Padding(
                            padding: EdgeInsets.symmetric(horizontal: 16.sp, vertical: 8.sp),
                            child: _buildUserInfoCard(),
                          ),
                          8.verticalSpace,
                        ],
                        Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16.sp),
                          child: _buildDrawerButton(
                            icon: Icons.refresh,
                            label: "Qayta kurishga",
                            onPressed: () {
                              context.go("${AppRouteNames.home}${AppRouteNames.recheckPage}");
                            },
                          ),
                        ),
                        Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16.sp),
                          child: _buildDrawerButton(
                            icon: Icons.timelapse_outlined,
                            label: "Ko'rib chiqilmoqda",
                            onPressed: () {
                              context.go("${AppRouteNames.home}${AppRouteNames.pendingPage}");
                            },
                          ),
                        ),
                        Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16.sp),
                          child: _buildDrawerButton(
                            icon: Icons.verified_outlined,
                            label: "Tasdiqlangan",
                            onPressed: () {
                              context.go("${AppRouteNames.home}${AppRouteNames.approvedPage}");
                            },
                          ),
                        ),
                        Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16.sp),
                          child: _buildDrawerButton(
                            icon: Icons.analytics,
                            label: "Fermerlar statistikasi",
                            onPressed: () {
                              context.go("${AppRouteNames.home}${AppRouteNames.farmers}/${AppRouteNames.farmersStatistics}");
                            },
                          ),
                        ),
                        Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16.sp),
                          child: _buildDrawerButton(
                            icon: Icons.support_agent,
                            label: "Qo'llab-quvvatlash",
                            onPressed: () {
                              _openTelegramBot();
                            },
                          ),
                        ),
                        16.verticalSpace,
                      ],
                    ),
                  ),
                ),
                Divider(height: 1, thickness: 1, color: Colors.grey[300]),
                Padding(
                  padding: EdgeInsets.only(bottom: 8.sp, top: 8.sp),
                  child: Center(
                    child: Text(
                      'geoAgro v${currentAppVersion ?? "2.2.1"}',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 12.sp,
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: EdgeInsets.all(16.sp),
                  child: _buildDrawerButton(
                    icon: Icons.logout,
                    label: "Chiqish",
                    onPressed: () async {
                      await AppStorage.clearAllData();
                      accessToken = null;
                      if (context.mounted) {
                        context.go(AppRouteNames.login);
                      }
                    },
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildDrawerHeader() {
    return DrawerHeader(
      decoration: BoxDecoration(
        image: DecorationImage(
          image: const AssetImage('assets/images/drower.png'),
          fit: BoxFit.cover,
          colorFilter: ColorFilter.mode(
            Colors.black.withAlpha((0.5 * 255).toInt()),
            BlendMode.darken,
          ),
        ),
      ),
      child: Center(
        child: Text(
          'GEO AGRO',
          style: TextStyle(
            color: Colors.white,
            fontSize: 28.sp,
            fontStyle: FontStyle.italic,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildUserInfoCard() {
    return Card(
      elevation: 2.0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10.sp),
      ),
      child: Padding(
        padding: EdgeInsets.all(16.sp),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.person, size: 20.sp, color: Colors.grey[600]),
                8.horizontalSpace,
                Text(
                  'Mening ma\'lumotlarim',
                  style: TextStyle(
                    fontSize: 16.sp,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            12.verticalSpace,
            if (userInfo != null) ...[
              _buildInfoRow('Ism', userInfo!.displayName),
              8.verticalSpace,
              _buildInfoRow('Hudud', userInfo!.districtName),
              8.verticalSpace,
              _buildInfoRow('Telefon', userInfo!.phoneNumber),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 60.sp,
          child: Text(
            '$label:',
            style: TextStyle(
              fontSize: 14.sp,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        8.horizontalSpace,
        Expanded(
          child: Text(
            value.isNotEmpty ? value : 'Kiritilmagan',
            style: TextStyle(
              fontSize: 14.sp,
              fontWeight: FontWeight.w400,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDrawerButton({
    required IconData icon,
    required String label,
    required VoidCallback onPressed,
  }) {
    return Padding(
      padding: EdgeInsets.all(5.sp),
      child: ElevatedButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, size: 20.sp),
        label: Text(label, style: TextStyle(fontSize: 14.sp)),
        style: ElevatedButton.styleFrom(
          minimumSize: Size(double.infinity, 45.h),
        ),
      ),
    );
  }

  Future<void> _openTelegramBot() async {
    // Различные способы открытия Telegram бота для Android
    final telegramUrls = [
      'tg://resolve?domain=geoagro_bot',           // Прямое открытие в Telegram приложении
      'https://t.me/geoagro_bot',                  // Веб-версия Telegram
      'intent://t.me/geoagro_bot#Intent;scheme=tg;package=org.telegram.messenger;end', // Android Intent для Telegram
      'intent://t.me/geoagro_bot#Intent;scheme=tg;package=org.telegram.plus;end',      // Android Intent для Telegram Plus
    ];
    
    bool success = false;
    
    for (final url in telegramUrls) {
      try {
        final uri = Uri.parse(url);
        
        // Проверяем, можем ли мы открыть этот URL
        if (await canLaunchUrl(uri)) {
          await launchUrl(
            uri, 
            mode: LaunchMode.externalApplication,
            webViewConfiguration: const WebViewConfiguration(
              enableJavaScript: false,
              enableDomStorage: false,
            ),
          );
          success = true;
          break;
        }
      } catch (e) {
        // Продолжаем пробовать следующий URL
        continue;
      }
    }
    
    // Если ни один способ не сработал, показываем ошибку
    if (!success) {
      _showTelegramError();
    }
  }
  
  void _showTelegramError() {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Telegram botiga kirishda xatolik yuz berdi'),
              SizedBox(height: 4),
              Text('Telegram ilovasini o\'rnating va qo\'lda kiriting:', 
                   style: TextStyle(fontSize: 12)),
              SizedBox(height: 2),
              Text('@geoagro_bot', 
                   style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ],
          ),
          backgroundColor: Colors.orange,
          duration: Duration(seconds: 8),
          action: SnackBarAction(
            label: 'Kopiya qilish',
            textColor: Colors.white,
            onPressed: () {
              // Копируем имя бота в буфер обмена
              Clipboard.setData(ClipboardData(text: '@geoagro_bot'));
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('@geoagro_bot nusxa olindi!'),
                  duration: Duration(seconds: 2),
                  backgroundColor: Colors.green,
                ),
              );
            },
          ),
        ),
      );
    }
  }
}
