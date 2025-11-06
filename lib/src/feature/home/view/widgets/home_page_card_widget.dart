import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/routes/app_route_names.dart';
import '../../../../core/setting/setup.dart';
import '../../../../core/style/app_colors.dart';
import '../../../../core/widgets/custom_card_widget.dart';
import '../../../../core/widgets/custom_list_tile_widget.dart';
import '../../../../core/widgets/custom_driver.dart';
import '../../../../data/model/plantation/plantations_list_model.dart';
import '../../../../core/utils/date_utils.dart' as app_date;
import '../widgets/delete_confirmation_dialog.dart';
import '../../vm/home_page_vm.dart'; // Import HomePageVm
import '../pages/home_page.dart'; // Import to use homePageVM provider

class HomePageCardWidget extends StatelessWidget {
  final Result plantation;
  final bool showEditButton;
  final AutoDisposeChangeNotifierProvider<HomePageVm>? customProvider; // Fix type
  final VoidCallback? onDeleteSuccess; // Callback for successful deletion
  
  const HomePageCardWidget({
    super.key,
    required this.plantation,
    this.showEditButton = false,
    this.customProvider, // Optional custom provider
    this.onDeleteSuccess, // Optional callback
  });

  // void onDeleteButtonTap(BuildContext context) async {
  //   showDialog(
  //     context: context,
  //     barrierDismissible: false,
  //     builder: (BuildContext context) {
  //       return AlertDialog(
  //         backgroundColor: AppColors.white,
  //         title: Icon(Icons.info_sharp, color: AppColors.c28A745, size: 20.sp),
  //         content: Text(
  //           "Haqiqatdan o'chirib tashlamoqchimisiz",
  //           style: TextStyle(color: AppColors.c1E1E1E70, fontSize: 14.sp),
  //           textAlign: TextAlign.center,
  //         ),
  //         actionsAlignment: MainAxisAlignment.spaceEvenly,
  //         actions: [
  //           MaterialButton(
  //             minWidth: MediaQuery.of(context).size.width * 0.3,
  //             onPressed: () async {
  //               final result =
  //                   await vm.deletePlantation(id: plantation.id ?? 0);
  //               if (result && context.mounted) {
  //                 Utils.fireTopSnackBar(
  //                     vm.deletMessage ??
  //                         "Malumotlar o'chirish uchun yuborildi.",
  //                     AppColors.c28A745,
  //                     context);
  //                 context.pop();
  //               } else {
  //                 if (context.mounted) {
  //                   Utils.fireTopSnackBar(
  //                       vm.deletMessage ?? "Xatolik yuz berdi",
  //                       AppColors.cE60C0C,
  //                       context);
  //                   context.pop();
  //                 }
  //               }
  //             },
  //             color: AppColors.c28A745,
  //             shape: RoundedRectangleBorder(
  //                 borderRadius: BorderRadius.circular(8.r)),
  //             elevation: 0,
  //             highlightElevation: 0,
  //             child: Text(
  //               "Ha",
  //               style: TextStyle(color: AppColors.white, fontSize: 16.sp),
  //             ),
  //           ),
  //           MaterialButton(
  //             minWidth: MediaQuery.of(context).size.width * 0.3,
  //             onPressed: () {
  //               context.pop();
  //             },
  //             color: AppColors.cE60C0C,
  //             shape: RoundedRectangleBorder(
  //                 borderRadius: BorderRadius.circular(8.r)),
  //             elevation: 0,
  //             highlightElevation: 0,
  //             child: Text(
  //               "Yoq",
  //               style: TextStyle(color: AppColors.white, fontSize: 16.sp),
  //             ),
  //           ),
  //         ],
  //       );
  //     },
  //   );
  // }

  @override
  Widget build(BuildContext context) {
    // Determine if current user is creator
    final matchesById = plantation.createdById != null && userId == plantation.createdById;
    final matchesByUsername = plantation.createdByUsername != null && username != null && plantation.createdByUsername == username;
    final canEdit = showEditButton && (matchesById || matchesByUsername);
    // return InkWell(
    //   onTap: onPressed,
    //   child: CustomCardWidget(
    return CustomCardWidget(
      horizontal: 16,
      vertical: 16,
      child: Column(
        children: [
          CustomListTileWidget(
            title: "Hudud",
            contextText: "${plantation.district?.name}",
          ),
          12.verticalSpace,
          const CustomDriver(),
          12.verticalSpace,
          CustomListTileWidget(
            title: "Fermer",
            contextText: plantation.farmerName ?? "Noma'lum",
          ),
          12.verticalSpace,
          const CustomDriver(),
          12.verticalSpace,
          CustomListTileWidget(
            title: "Yer turi",
            contextText: yerTuri[plantation.landType] ?? "Noma'lum",
          ),
          12.verticalSpace,
          const CustomDriver(),
          12.verticalSpace,
          CustomListTileWidget(
            title: "Yer maydoni",
            contextText: "${_formatNumber(plantation.totalArea)} ga",
          ),
          12.verticalSpace,
          const CustomDriver(),
          12.verticalSpace,
          CustomListTileWidget(
            title: "ID",
            contextText: "${plantation.id ?? 'N/A'}",
          ),
          12.verticalSpace,
          const CustomDriver(),
          12.verticalSpace,
          CustomListTileWidget(
            title: "Bog tashkil topgan yil",
            contextText: "${plantation.gardenEstablishedYear} yil",
          ),
          12.verticalSpace,
          const CustomDriver(),
          12.verticalSpace,
          if (plantation.createdAt != null)
            CustomListTileWidget(
              title: "Qo'shilgan vaqt",
              contextText: _formatCreatedAt(plantation.createdAt!),
            ),
          12.verticalSpace,
          if ((plantation.moderationComments?.isNotEmpty ?? false)) ...[
            const CustomDriver(),
            12.verticalSpace,
          ],
          if ((plantation.moderationComments?.isNotEmpty ?? false)) ...[
            Row(
              children: [
                Text(
                  "Tafsilot",
                  style: TextStyle(fontSize: 16.sp, color: AppColors.c1E1E1E, fontWeight: FontWeight.w600),
                ),
                16.horizontalSpace,
                Expanded(
                  child: Text(
                    plantation.moderationComments!.first.text ?? '',
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 15.sp, color: AppColors.c1E1E1E70, fontWeight: FontWeight.w500),
                  ),
                ),
              ],
            ),
            12.verticalSpace,
          ],
          24.verticalSpace,
          if (canEdit)
            Row(
              children: [
                Expanded(
                  child: MaterialButton(
                    height: 48.h,
                    onPressed: () {
                      if (plantation.id != null) {
                        context.go("${AppRouteNames.home}${AppRouteNames.editPage}", extra: plantation.id);
                      }
                    },
                    elevation: 0,
                    highlightElevation: 0,
                    color: AppColors.c28A745,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10.r),
                    ),
                    child: Text(
                      "Tahrirlash",
                      style: TextStyle(
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w500,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: MaterialButton(
                    height: 48.h,
                    onPressed: () {
                      _showDeleteConfirmation(context, plantation.id!);
                    },
                    elevation: 0,
                    highlightElevation: 0,
                    color: AppColors.cE60C0C,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10.r),
                    ),
                    child: Text(
                      "O'chirish",
                      style: TextStyle(
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w500,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ],
            ),
        ],
      ),
      // ),
    );
  }

  

  String _formatCreatedAt(String raw) {
    try {
      // Парсим дату с учетом часового пояса
      final dt = DateTime.parse(raw);
      
      // Если дата содержит часовой пояс (+05:00), то DateTime.parse() конвертирует в UTC
      // Нам нужно восстановить оригинальное время, добавив смещение часового пояса
      if (raw.contains('+05:00')) {
        // Добавляем 5 часов к UTC времени, чтобы получить оригинальное время
        final localTime = dt.add(Duration(hours: 5));
        return app_date.DateUtils.formatDateTime(localTime);
      } else if (raw.contains('+')) {
        // Для других часовых поясов извлекаем смещение
        final timezoneMatch = RegExp(r'\+(\d{2}):(\d{2})').firstMatch(raw);
        if (timezoneMatch != null) {
          final hours = int.parse(timezoneMatch.group(1)!);
          final minutes = int.parse(timezoneMatch.group(2)!);
          final offset = Duration(hours: hours, minutes: minutes);
          final localTime = dt.add(offset);
          return app_date.DateUtils.formatDateTime(localTime);
        }
      }
      
      // Если нет часового пояса, используем как есть
      return app_date.DateUtils.formatDateTime(dt);
    } catch (_) {
      return raw;
    }
  }

  // Вспомогательная функция для форматирования чисел без .0
  String _formatNumber(dynamic value) {
    if (value == null) return "0";
    if (value is double) {
      return value == value.toInt().toDouble() ? value.toInt().toString() : value.toString();
    }
    if (value is int) {
      return value.toString();
    }
    return value.toString();
  }

  void _showDeleteConfirmation(BuildContext context, int plantationId) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return Consumer(
          builder: (context, ref, child) {
            // Use custom provider if provided, otherwise use default homePageVM
            final provider = customProvider ?? homePageVM;
            final vm = ref.watch(provider.notifier);
            final isDeleting = ref.watch(provider).isDeleting;
            
            return DeleteConfirmationDialog(
              onConfirm: (String reason) async {
                // НЕ закрываем диалог сразу - ждем завершения операции
                try {
                  final result = await vm.deletePlantationPermanently(id: plantationId, reason: reason);
                  
                  // Закрываем диалог только после завершения операции
                  if (context.mounted) {
                    Navigator.of(context).pop();
                  }
                  
                  if (result && context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(vm.deletMessage ?? "O'chirish so'rovi moderatsiyaga yuborildi"),
                        backgroundColor: AppColors.c28A745,
                        duration: const Duration(seconds: 3),
                      ),
                    );
                    onDeleteSuccess?.call(); // Call the callback
                  } else if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(vm.deletMessage ?? "O'chirishda xatolik yuz berdi"),
                        backgroundColor: AppColors.cE60C0C,
                        duration: const Duration(seconds: 3),
                      ),
                    );
                  }
                } catch (e) {
                  // Закрываем диалог даже при ошибке
                  if (context.mounted) {
                    Navigator.of(context).pop();
                  }
                  
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text("Kutilmagan xatolik: ${e.toString()}"),
                        backgroundColor: AppColors.cE60C0C,
                        duration: const Duration(seconds: 3),
                      ),
                    );
                  }
                }
              },
              onCancel: () {
                Navigator.of(context).pop();
              },
              isDeleting: isDeleting, // Pass loading state
            );
          },
        );
      },
    );
  }
}

