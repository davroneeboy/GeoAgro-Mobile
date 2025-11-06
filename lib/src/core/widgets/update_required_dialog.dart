import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:url_launcher/url_launcher.dart';

import '../style/app_colors.dart';

class UpdateRequiredDialog extends StatelessWidget {
  final String currentVersion;
  final String requiredVersion;

  const UpdateRequiredDialog({
    super.key,
    required this.currentVersion,
    required this.requiredVersion,
  });

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false, // Запрещаем закрытие диалога
      child: AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16.r),
        ),
        title: Row(
          children: [
            Icon(
              Icons.system_update,
              color: Colors.orange,
              size: 28.sp,
            ),
            12.horizontalSpace,
            Expanded(
              child: Text(
                "Dastur eski",
                style: TextStyle(
                  fontSize: 18.sp,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Yangilang",
              style: TextStyle(
                fontSize: 16.sp,
                fontWeight: FontWeight.w600,
                color: AppColors.c1E1E1E,
              ),
            ),
            16.verticalSpace,
            Text(
              "Ilovangizning yangi versiyasi mavjud. Eng so'nggi funksiyalar va xavfsizlik yangilanishlaridan foydalanish uchun ilovani yangilang.",
              style: TextStyle(
                fontSize: 14.sp,
                color: AppColors.c666666,
                height: 1.4,
              ),
            ),
            16.verticalSpace,
            Container(
              padding: REdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.cF7F7F7,
                borderRadius: BorderRadius.circular(8.r),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "Joriy versiya:",
                        style: TextStyle(
                          fontSize: 12.sp,
                          color: AppColors.c666666,
                        ),
                      ),
                      Text(
                        "v$currentVersion",
                        style: TextStyle(
                          fontSize: 12.sp,
                          fontWeight: FontWeight.w600,
                          color: Colors.red,
                        ),
                      ),
                    ],
                  ),
                  4.verticalSpace,
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "Kerakli versiya:",
                        style: TextStyle(
                          fontSize: 12.sp,
                          color: AppColors.c666666,
                        ),
                      ),
                      Text(
                        "v$requiredVersion",
                        style: TextStyle(
                          fontSize: 12.sp,
                          fontWeight: FontWeight.w600,
                          color: AppColors.c28A745,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              // Можно добавить логику для отложенного обновления
              // Пока что просто закрываем диалог
              Navigator.of(context).pop();
            },
            child: Text(
              "Keyinroq",
              style: TextStyle(
                fontSize: 14.sp,
                color: AppColors.c666666,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () => _openAppStore(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.c28A745,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8.r),
              ),
              padding: REdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
            child: Text(
              "Yangilash",
              style: TextStyle(
                fontSize: 14.sp,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _openAppStore(BuildContext context) async {
    try {
      // Для Android - Google Play Store
      const androidUrl = 'https://play.google.com/store/apps/details?id=uz.luxa.geoagro';
      
      final Uri url = Uri.parse(androidUrl);
      
      if (await canLaunchUrl(url)) {
        await launchUrl(url, mode: LaunchMode.externalApplication);
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text("App Store'ni ochishda xatolik yuz berdi"),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Xatolik: $e"),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
