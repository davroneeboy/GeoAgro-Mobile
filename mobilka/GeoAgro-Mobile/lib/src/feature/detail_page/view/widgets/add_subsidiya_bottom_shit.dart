import 'package:agro_employee_public/src/feature/detail_page/view/widgets/created_time_widget.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/setting/setup.dart';
import 'package:agro_employee_public/design_system/tokens/colors.dart'
    as DesignColors;
import 'package:agro_employee_public/design_system/tokens/adaptive_colors.dart';
import 'package:agro_employee_public/design_system/tokens/spacing.dart';
import 'package:agro_employee_public/design_system/tokens/typography.dart';
import 'package:agro_employee_public/design_system/tokens/radii.dart';

import '../../vm/detail_vm.dart';
import 'detail_dropdown_widget.dart';
import 'detail_text_fild_widget.dart';
import 'switch_card_widget.dart';

class AddSubsidiyaBottomShit extends ConsumerWidget {
  final DetailVM detailVm;

  const AddSubsidiyaBottomShit({super.key, required this.detailVm});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailVm = ref.watch(detailVM);
    final isEfficiency = ref.watch(detailVm.switchEfficiency);
    final textStyle = AppTypography.headlineMedium(context).copyWith(
      fontSize: 16.sp,
      fontWeight: FontWeight.w600,
      color: context.colors.textPrimary,
    );

    return Container(
      padding: EdgeInsets.only(
        left: AppSpacing.lg,
        right: AppSpacing.lg,
        top: AppSpacing.lg,
        bottom: (MediaQuery.of(context).padding.bottom > 0
                ? MediaQuery.of(context).padding.bottom
                : AppSpacing.lg) +
            AppSpacing.md,
      ),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(AppRadii.modal),
          topRight: Radius.circular(AppRadii.modal),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text("Subsidiya qo`shish va to`ldirish", style: textStyle),
          SizedBox(height: AppSpacing.lg.h),
          CreatedTime(
            selectedDate: detailVm.selectedDate3,
            setSelectedDate: detailVm.setSelectedDate3,
          ),
          CustomTextFieldWithLabel(
            controller: detailVm.subsidiyaContract,
            onTextChanged: detailVm.setSubsidiyaConract,
            hintText: "subsidiya shartnoma raqami kiriting",
            label: "Subsidiya shartnoma raqami",
          ),
          CustomTextFieldWithLabel(
            controller: detailVm.subsidiyaAmount,
            onTextChanged: detailVm.setSubsidiyaAmount,
            hintText: "ajratilgan subsidiya miqdori: so`m",
            keyboardType: TextInputType.number,
            label: "Ajratilgan subsidiya miqdori",
          ),
          DropdownWithLabel(
            items: subsidyType,
            hint: "subsidiya ajratilgan yo`nalish kiriting",
            selectedValue: detailVm.selectedSubsidyType,
            label: "Subsidiya ajratilgan yo`nalish",
            onChanged: (value) {
              detailVm.setSubsidyType(value);
            },
          ),
          SizedBox(height: AppSpacing.lg.h),
          CustomSwitchCard(
            label: "Subsidiya samaradormi",
            switchValue: isEfficiency,
            onChanged: (value) {
              ref.read(detailVm.switchEfficiency.notifier).state = value;
            },
          ),
          SizedBox(height: AppSpacing.lg.h),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              Expanded(
                child: FilledButton.tonal(
                  onPressed: () {
                    detailVm.resetSubsudy();
                    Navigator.pop(context);
                  },
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      vertical: AppSpacing.md,
                    ),
                    backgroundColor: Colors.red.withOpacity(0.15),
                    foregroundColor: Colors.red,
                  ),
                  child: Text(
                    "Bekor qilish",
                    style: AppTypography.labelLarge(context).copyWith(
                      color: Colors.red,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.lg),
              Expanded(
                child: FilledButton(
                  onPressed: () {
                    String? errorMessage;
                    if (detailVm.selectedDate3 == null) {
                      errorMessage = "Subsidiya ajratilgan yilni kiriting";
                    } else if (detailVm.subsidiyaContract.text.isEmpty) {
                      errorMessage = "Subsidiya shartnoma raqamini kiriting";
                    } else if (detailVm.subsidiyaAmount.text.isEmpty) {
                      errorMessage = "Ajratilgan subsidiya miqdorini kiriting";
                    } else if (detailVm.selectedSubsidyType == null) {
                      detailVm.direction == detailVm.selectedSubsidyType;
                      errorMessage = "Subsidiya turi tanalanmagan";
                    }
                    if (errorMessage != null) {
                      showDialog(
                        context: context,
                        builder: (context) => AlertDialog(
                          backgroundColor:
                              context.colors.surfaceVariant,
                          title: Text(
                            "Xatolik",
                            style: AppTypography.headlineMedium(context).copyWith(
                              color: context.colors.textPrimary,
                            ),
                          ),
                          content: Text(
                            errorMessage!,
                            style: AppTypography.bodyMedium(context).copyWith(
                              color: context.colors.textSecondary,
                            ),
                          ),
                          actions: [
                            TextButton(
                              onPressed: () {
                                Navigator.pop(context);
                              },
                              child: const Text("OK"),
                            ),
                          ],
                        ),
                      );
                      return;
                    }
                    detailVm.addSubsidiyaList(ref);
                    Navigator.pop(context);
                  },
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      vertical: AppSpacing.md,
                    ),
                    backgroundColor: DesignColors.AppColors.accentGreen,
                    foregroundColor: Colors.white,
                  ),
                  child: Text(
                    "Qo'shish",
                    style: AppTypography.labelLarge(context).copyWith(
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
