import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:agro_employee_public/src/core/routes/app_route_names.dart';
import 'package:agro_employee_public/src/core/setting/setup.dart';
import 'package:agro_employee_public/src/core/style/app_colors.dart';
import 'package:agro_employee_public/src/core/utils/date_utils.dart'
    as app_date;
import 'package:agro_employee_public/src/core/widgets/custom_card_widget.dart';
import 'package:agro_employee_public/src/data/model/plantation/plantations_list_model.dart';
import 'package:agro_employee_public/design_system/tokens/colors.dart'
    as DesignColors;
import 'package:agro_employee_public/design_system/tokens/radii.dart';
import 'package:agro_employee_public/design_system/tokens/spacing.dart';
import 'package:agro_employee_public/design_system/tokens/typography.dart';
import 'package:agro_employee_public/src/feature/home/vm/home_page_vm.dart';
import 'package:agro_employee_public/src/feature/home/view/pages/home_page.dart';

import '../widgets/delete_confirmation_dialog.dart';

class HomePageCardWidget extends StatelessWidget {
  final Result plantation;
  final bool showEditButton;
  final AutoDisposeChangeNotifierProvider<HomePageVm>?
      customProvider; // Fix type
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
    final matchesById =
        plantation.createdById != null && userId == plantation.createdById;
    final matchesByUsername = plantation.createdByUsername != null &&
        username != null &&
        plantation.createdByUsername == username;
    final isChecked = plantation.isChecked ?? false;
    final canEdit = showEditButton && (matchesById || matchesByUsername) && !isChecked;
    // return InkWell(
    //   onTap: onPressed,
    //   child: CustomCardWidget(
    final farmerName = plantation.farmerName ?? "Noma'lum fermer";
    final farmerInn = plantation.farmerInn?.toString() ?? null;
    final plantationId = plantation.id?.toString() ?? "N/A";
    final landType = yerTuri[plantation.landType] ?? "Noma'lum";
    final areaText = "${_formatNumber(plantation.totalArea)} ga";
    final chegaraAreaText = (plantation.chegaraArea != null && plantation.chegaraArea! > 0)
        ? "${plantation.chegaraArea!.toStringAsFixed(2)} ga"
        : null;
    final establishedYear = plantation.gardenEstablishedYear != null
        ? "${plantation.gardenEstablishedYear} yil"
        : null;
    final createdAt = plantation.createdAt != null
        ? _formatCreatedAt(plantation.createdAt!)
        : null;

    return CustomCardWidget(
      horizontal: AppSpacing.lg,
      vertical: AppSpacing.lg,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      farmerName,
                      style: AppTypography.title(context).copyWith(
                        fontSize: 20.sp,
                        fontWeight: FontWeight.w700,
                        color: DesignColors.AppColors.darkTextPrimary,
                        height: 1.2,
                      ),
                      overflow: TextOverflow.ellipsis,
                      maxLines: 2,
                    ),
                    if (farmerInn != null) ...[
                      SizedBox(height: AppSpacing.xs),
                      Text(
                        "ИНН: $farmerInn",
                        style: AppTypography.bodySmall(context).copyWith(
                          color: DesignColors.AppColors.darkTextSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                    ],
                    SizedBox(height: AppSpacing.xs),
                    if (createdAt != null)
                      Text(
                        "Qo'shilgan: $createdAt",
                        style: AppTypography.bodySmall(context).copyWith(
                          color: DesignColors.AppColors.darkTextTertiary,
                        ),
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  _IdBadge(context: context, id: plantationId),
                  SizedBox(height: AppSpacing.xs),
                  _StatusBadge(context: context, plantation: plantation),
                ],
              ),
            ],
          ),
          SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: AppSpacing.md,
            runSpacing: AppSpacing.sm,
            children: [
              _InfoChip(
                context: context,
                icon: Icons.eco_outlined,
                label: "Yer turi",
                value: landType,
              ),
              _InfoChip(
                context: context,
                icon: Icons.square_foot_outlined,
                label: "Maydon",
                value: areaText,
              ),
              if (chegaraAreaText != null)
                _InfoChip(
                  context: context,
                  icon: Icons.border_color_outlined,
                  label: "Chegara maydon",
                  value: chegaraAreaText,
                ),
              if (establishedYear != null)
                _InfoChip(
                  context: context,
                  icon: Icons.calendar_month_outlined,
                  label: "Bog tashkil topgan yil",
                  value: establishedYear,
                ),
            ],
          ),
          if ((plantation.moderationComments?.isNotEmpty ?? false)) ...[
            SizedBox(height: AppSpacing.lg),
            _ModerationNote(
              context: context,
              messages: plantation.moderationComments!
                  .map((comment) => comment.text ?? '')
                  .where((text) => text.isNotEmpty)
                  .toList(),
            ),
          ],
          SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Expanded(
                child: FilledButton.tonal(
                  onPressed: plantation.id == null
                      ? null
                      : () => context.go(
                            "${AppRouteNames.home}${AppRouteNames.plantationView}",
                            extra: plantation.id,
                          ),
                  style: FilledButton.styleFrom(
                    padding: EdgeInsets.symmetric(vertical: 14.h),
                  ),
                  child: const Text("Ko'rish"),
                ),
              ),
              if (canEdit) ...[
                SizedBox(width: 12.w),
                Expanded(
                  child: FilledButton(
                    onPressed: () {
                      if (plantation.id != null) {
                        context.go(
                          "${AppRouteNames.home}${AppRouteNames.editPage}",
                          extra: plantation.id,
                        );
                      }
                    },
                    style: FilledButton.styleFrom(
                      padding: EdgeInsets.symmetric(vertical: 14.h),
                      backgroundColor: AppColors.c28A745,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text("Tahrirlash"),
                  ),
                ),
                // Показываем кнопку удаления только для неподтвержденных плантаций
                if (!isChecked) ...[
                  SizedBox(width: 12.w),
                  Expanded(
                    child: FilledButton(
                      onPressed: plantation.id == null
                          ? null
                          : () => _handleDelete(
                                context,
                                plantation.id!,
                                plantation.isChecked ?? false,
                              ),
                      style: FilledButton.styleFrom(
                        padding: EdgeInsets.symmetric(vertical: 14.h),
                        backgroundColor: AppColors.cE60C0C,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text("O'chirish"),
                    ),
                  ),
                ],
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _IdBadge({required BuildContext context, required String id}) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: DesignColors.AppColors.darkSurfaceVariant,
        borderRadius: BorderRadius.circular(AppRadii.sm),
        border: Border.all(color: DesignColors.AppColors.darkBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            "ID",
            style: AppTypography.caption(context).copyWith(
              color: DesignColors.AppColors.darkTextTertiary,
              letterSpacing: 0.4,
            ),
          ),
          Text(
            id,
            style: AppTypography.bodySmall(context).copyWith(
              color: DesignColors.AppColors.darkTextPrimary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _StatusBadge({required BuildContext context, required Result plantation}) {
    Color statusColor;
    
    // Отладочная информация
    debugPrint('_StatusBadge for plantation ${plantation.id}: isChecked=${plantation.isChecked} (type: ${plantation.isChecked.runtimeType}), isRejected=${plantation.isRejected} (type: ${plantation.isRejected.runtimeType})');
    
    // Проверяем сначала isRejected, потом isChecked
    if (plantation.isRejected == true) {
      statusColor = DesignColors.AppColors.error;
      debugPrint('  -> Status: Rad etilgan (red)');
    } else if (plantation.isChecked == true) {
      statusColor = DesignColors.AppColors.success;
      debugPrint('  -> Status: Tasdiqlangan (green)');
    } else {
      statusColor = DesignColors.AppColors.warning;
      debugPrint('  -> Status: Ko\'rib chiqilmoqda (yellow)');
    }

    return Container(
      width: 12.w,
      height: 12.w,
      decoration: BoxDecoration(
        color: statusColor,
        shape: BoxShape.circle,
        border: Border.all(
          color: DesignColors.AppColors.darkBorder,
          width: 1,
        ),
      ),
    );
  }

  Widget _InfoChip({
    required BuildContext context,
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: DesignColors.AppColors.darkSurfaceVariant,
        borderRadius: BorderRadius.circular(AppRadii.sm),
        border: Border.all(color: DesignColors.AppColors.darkBorder),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 16.sp,
            color: DesignColors.AppColors.accentGreen,
          ),
          SizedBox(width: AppSpacing.sm),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: AppTypography.caption(context).copyWith(
                  color: DesignColors.AppColors.darkTextTertiary,
                  letterSpacing: 0.3,
                ),
              ),
              SizedBox(height: AppSpacing.xs / 2),
              Text(
                value,
                style: AppTypography.bodySmall(context).copyWith(
                  color: DesignColors.AppColors.darkTextPrimary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _ModerationNote({
    required BuildContext context,
    required List<String> messages,
  }) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: DesignColors.AppColors.warning.withOpacity(0.08),
        borderRadius: BorderRadius.circular(AppRadii.sm),
        border: Border.all(
          color: DesignColors.AppColors.warning.withOpacity(0.3),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.info_outline,
            size: 18.sp,
            color: DesignColors.AppColors.warning,
          ),
          SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Tafsilot",
                  style: AppTypography.bodySmall(context).copyWith(
                    fontWeight: FontWeight.w600,
                    color: DesignColors.AppColors.darkTextPrimary,
                  ),
                ),
                SizedBox(height: AppSpacing.xs),
                ...messages.map((message) {
                  return Padding(
                    padding: EdgeInsets.only(bottom: AppSpacing.xs),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "• ",
                          style: AppTypography.bodySmall(context).copyWith(
                            color: DesignColors.AppColors.darkTextSecondary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Expanded(
                          child: Text(
                            message,
                            style: AppTypography.bodySmall(context).copyWith(
                              color: DesignColors.AppColors.darkTextSecondary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatCreatedAt(String raw) {
    try {
      final dt = DateTime.parse(raw);
      if (raw.contains('+05:00')) {
        final localTime = dt.add(const Duration(hours: 5));
        return app_date.DateUtils.formatDateTime(localTime);
      } else if (raw.contains('+')) {
        final timezoneMatch = RegExp(r'\+(\d{2}):(\d{2})').firstMatch(raw);
        if (timezoneMatch != null) {
          final hours = int.parse(timezoneMatch.group(1)!);
          final minutes = int.parse(timezoneMatch.group(2)!);
          final offset = Duration(hours: hours, minutes: minutes);
          final localTime = dt.add(offset);
          return app_date.DateUtils.formatDateTime(localTime);
        }
      }
      return app_date.DateUtils.formatDateTime(dt);
    } catch (_) {
      return raw;
    }
  }

  // Вспомогательная функция для форматирования чисел без .0
  String _formatNumber(dynamic value) {
    if (value == null) return "0.00";
    if (value is double) {
      return value.toStringAsFixed(2);
    }
    if (value is int) {
      return value.toDouble().toStringAsFixed(2);
    }
    // Попытка преобразовать в число
    try {
      final numValue = double.parse(value.toString());
      return numValue.toStringAsFixed(2);
    } catch (e) {
      return value.toString();
    }
  }

  void _handleDelete(BuildContext context, int plantationId, bool isChecked) {
    // Если плантация подтверждена, нельзя удалять
    if (isChecked) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text("Tasdiqlangan plantatsiyani o'chirib bo'lmaydi."),
          backgroundColor: AppColors.cE60C0C,
          duration: const Duration(seconds: 3),
        ),
      );
      return;
    }
    
    // Для неподтвержденных плантаций - простой диалог подтверждения
    _showSimpleDeleteConfirmation(context, plantationId);
  }

  void _showSimpleDeleteConfirmation(BuildContext context, int plantationId) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          icon: const Icon(Icons.warning_amber_rounded, size: 48),
          iconColor: Theme.of(context).colorScheme.error,
          title: const Text("Plantatsiyani o'chirish"),
          content: const Text(
            "Haqiqatan ham bu plantatsiyani o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.",
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text("Bekor qilish"),
            ),
            FilledButton(
              onPressed: () {
                Navigator.of(context).pop();
                _deletePlantationDirectly(context, plantationId);
              },
              style: FilledButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.error,
              ),
              child: const Text("O'chirish"),
            ),
          ],
        );
      },
    );
  }

  void _deletePlantationDirectly(BuildContext context, int plantationId) async {
    return showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return Consumer(
          builder: (context, ref, child) {
            final provider = customProvider ?? homePageVM;
            final vm = ref.watch(provider.notifier);
            
            // Удаляем плантацию
            Future.microtask(() async {
              try {
                final result = await vm.deletePlantation(id: plantationId);
                
                if (context.mounted) {
                  Navigator.of(context).pop();
                }
                
                if (result && context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(vm.deletMessage ?? "Plantatsiya muvaffaqiyatli o'chirildi"),
                      backgroundColor: AppColors.c28A745,
                      duration: const Duration(seconds: 3),
                    ),
                  );
                  // Вызываем callback для обновления списка
                  onDeleteSuccess?.call();
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
                if (context.mounted) {
                  Navigator.of(context).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text("Kutilmagan xatolik: ${e.toString()}"),
                      backgroundColor: AppColors.cE60C0C,
                      duration: const Duration(seconds: 3),
                    ),
                  );
                }
              }
            });
            
            return const Center(
              child: CircularProgressIndicator(),
            );
          },
        );
      },
    );
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
                  final result = await vm.deletePlantationPermanently(
                      id: plantationId, reason: reason);

                  // Закрываем диалог только после завершения операции
                  if (context.mounted) {
                    Navigator.of(context).pop();
                  }

                  if (result && context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(vm.deletMessage ??
                            "O'chirish so'rovi moderatsiyaga yuborildi"),
                        backgroundColor: AppColors.c28A745,
                        duration: const Duration(seconds: 3),
                      ),
                    );
                    onDeleteSuccess?.call(); // Call the callback
                  } else if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                            vm.deletMessage ?? "O'chirishda xatolik yuz berdi"),
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
