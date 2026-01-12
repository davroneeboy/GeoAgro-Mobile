import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:agro_employee_public/design_system/tokens/colors.dart'
    as DesignColors;
import 'package:agro_employee_public/design_system/tokens/radii.dart';
import 'package:agro_employee_public/design_system/tokens/spacing.dart';
import 'package:agro_employee_public/design_system/tokens/typography.dart';
import 'package:agro_employee_public/src/data/model/farmer/farmer_list_model.dart';
import 'package:agro_employee_public/src/feature/fermers/view/widgets/edit_farmer_name_dialog.dart';
import 'package:agro_employee_public/src/feature/fermers/view/pages/fermers_page.dart';
import 'package:agro_employee_public/src/feature/fermers/vm/fermer_vm.dart';

class FermerPageCardWidget extends ConsumerWidget {
  final FarmerModel fermerModel;
  final VoidCallback onPressed;
  const FermerPageCardWidget(
      {super.key, required this.onPressed, required this.fermerModel});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GestureDetector(
      onTap: () {
        debugPrint(
          'FermerPageCardWidget: Card tapped for farmer: ${fermerModel.name}',
        );
        onPressed();
      },
      child: Container(
        width: double.infinity,
        padding: EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: DesignColors.AppColors.darkSurfaceVariant,
          borderRadius: BorderRadius.circular(AppRadii.card),
          border: Border.all(
            color: DesignColors.AppColors.darkBorder,
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.18),
              blurRadius: 18,
              offset: const Offset(0, 14),
              spreadRadius: -12,
            ),
          ],
        ),
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
                      GestureDetector(
                        onTap: () {
                          _showEditNameDialog(context, ref);
                        },
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                fermerModel.name ?? "Noma'lum fermer",
                                style: AppTypography.title(context).copyWith(
                                  fontSize: 20.sp,
                                  fontWeight: FontWeight.w700,
                                  color: DesignColors.AppColors.darkTextPrimary,
                                  height: 1.25,
                                ),
                              ),
                            ),
                            SizedBox(width: AppSpacing.xs),
                            Icon(
                              Icons.edit_outlined,
                              size: 18.sp,
                              color: DesignColors.AppColors.accentGreen,
                            ),
                          ],
                        ),
                      ),
                      SizedBox(height: AppSpacing.xs.h),
                      if (fermerModel.inn != null ||
                          fermerModel.id != null) ...[
                        Wrap(
                          spacing: AppSpacing.sm.w,
                          runSpacing: 0,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            if (fermerModel.inn != null)
                              _InnChip(
                                inn: fermerModel.inn.toString(),
                              ),
                            if (fermerModel.id != null)
                              _IdLabel(
                                id: fermerModel.id!.toString(),
                              ),
                          ],
                        ),
                        SizedBox(height: AppSpacing.sm.h),
                      ],
                      Text(
                        fermerModel.address?.isNotEmpty == true
                            ? fermerModel.address!
                            : "Manzil ma'lum emas",
                        style: AppTypography.bodySmall(context).copyWith(
                          color: DesignColors.AppColors.darkTextTertiary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            SizedBox(height: AppSpacing.md.h),
            Divider(
              height: 1,
              color: DesignColors.AppColors.darkDivider.withOpacity(0.6),
            ),
            SizedBox(height: AppSpacing.sm.h),
            Wrap(
              spacing: AppSpacing.md.w,
              runSpacing: AppSpacing.sm.h,
              children: [
                _InfoPill(
                  icon: Icons.badge_outlined,
                  title: "Direktor",
                  value: fermerModel.directorName?.isNotEmpty == true
                      ? fermerModel.directorName!
                      : "Ko'rsatilmagan",
                ),
                _InfoPill(
                  icon: Icons.account_balance_outlined,
                  title: "Asoschi",
                  value: fermerModel.founderName?.isNotEmpty == true
                      ? fermerModel.founderName!
                      : "Ko'rsatilmagan",
                ),
                if (fermerModel.phoneNumber?.isNotEmpty == true)
                  _InfoPill(
                    icon: Icons.phone_outlined,
                    title: "Telefon",
                    value: fermerModel.phoneNumber!,
                  ),
                if (fermerModel.establishedYear != null)
                  _InfoPill(
                    icon: Icons.calendar_month_outlined,
                    title: "Tashkil topgan yil",
                    value: fermerModel.establishedYear.toString(),
                  ),
              ],
            ),
            SizedBox(height: AppSpacing.md.h),
          ],
        ),
      ),
    );
  }

  void _showEditNameDialog(BuildContext context, WidgetRef ref) {
    final vm = ref.read(fermerPageVM);
    final currentName = fermerModel.name ?? "";
    
    showDialog(
      context: context,
      builder: (dialogContext) => EditFarmerNameDialog(
        currentName: currentName,
        isLoading: vm.isUpdating,
        onSave: (newName) async {
          final success = await vm.updateFarmerName(
            id: fermerModel.id!,
            newName: newName,
          );
          
          if (dialogContext.mounted) {
            if (success) {
              Navigator.of(dialogContext).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text("Fermer nomi muvaffaqiyatli yangilandi"),
                  backgroundColor: DesignColors.AppColors.success,
                  duration: const Duration(seconds: 2),
                ),
              );
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(vm.updateErrorMessage ?? "Xatolik yuz berdi"),
                  backgroundColor: DesignColors.AppColors.error,
                  duration: const Duration(seconds: 3),
                ),
              );
            }
          }
        },
      ),
    );
  }
}

class _InfoPill extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;

  const _InfoPill({
    required this.icon,
    required this.title,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: DesignColors.AppColors.darkSurface,
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
          SizedBox(width: AppSpacing.sm.w),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title,
                style: AppTypography.caption(context).copyWith(
                  color: DesignColors.AppColors.darkTextTertiary,
                  letterSpacing: 0.3,
                ),
              ),
              SizedBox(height: AppSpacing.xs / 2),
              Text(
                value,
                style: AppTypography.bodySmall(context).copyWith(
                  color: DesignColors.AppColors.darkTextSecondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _InnChip extends StatelessWidget {
  final String inn;

  const _InnChip({required this.inn});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: DesignColors.AppColors.accentGreen.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppRadii.lg),
        border: Border.all(
          color: DesignColors.AppColors.accentGreen.withOpacity(0.4),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            "INN",
            style: AppTypography.caption(context).copyWith(
              color: DesignColors.AppColors.accentGreen,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
            ),
          ),
          SizedBox(width: AppSpacing.xs),
          Text(
            inn,
            style: AppTypography.bodySmall(context).copyWith(
              color: DesignColors.AppColors.darkTextPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _IdLabel extends StatelessWidget {
  final String id;

  const _IdLabel({required this.id});

  @override
  Widget build(BuildContext context) {
    return Text(
      "ID $id",
      style: AppTypography.bodySmall(context).copyWith(
        color: DesignColors.AppColors.darkTextTertiary,
        fontWeight: FontWeight.w500,
      ),
    );
  }
}
