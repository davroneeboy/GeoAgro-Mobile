import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:agro_employee_public/design_system/tokens/colors.dart' as DesignColors;
import 'package:agro_employee_public/design_system/tokens/radii.dart';
import 'package:agro_employee_public/design_system/tokens/spacing.dart';
import 'package:agro_employee_public/design_system/tokens/typography.dart';
import '../../../../core/utils/utils.dart';
import '../../../../core/widgets/main_button.dart';
import '../../vm/fermer_create_vm.dart';
import '../../../../core/widgets/custom_app_bar_widget.dart';
import '../widgets/fermer_create_page_input_widget.dart';

final fermerCreatePageVM =
    ChangeNotifierProvider.autoDispose<FermerCreateVm>((ref) {
  return FermerCreateVm();
});

class FermerCreatePage extends ConsumerStatefulWidget {
  const FermerCreatePage({super.key});

  @override
  ConsumerState<FermerCreatePage> createState() => _FermerCreatePageState();
}

class _FermerCreatePageState extends ConsumerState<FermerCreatePage> {
  @override
  Widget build(BuildContext context) {
    final vm = ref.watch(fermerCreatePageVM);
    return Scaffold(
      backgroundColor: DesignColors.AppColors.darkBackground,
      appBar: const CustomAppBarWidget(title: "Fermer Qo'shish", canPop: true),
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.lg,
          ),
          child: Container(
            width: double.infinity,
            padding: EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: DesignColors.AppColors.darkSurfaceVariant,
              borderRadius: BorderRadius.circular(AppRadii.card),
              border: Border.all(color: DesignColors.AppColors.darkBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildLabel(context, "Tashkilot nomi"),
                SizedBox(height: AppSpacing.sm),
                FermerCreatePageInputWidget(
                  hintText: "Firma nomi",
                  textEditingController: vm.name,
                ),
                SizedBox(height: AppSpacing.md),
                _buildLabel(context, "Asoschi"),
                SizedBox(height: AppSpacing.sm),
                FermerCreatePageInputWidget(
                  hintText: "Eshmatov Toshmat",
                  textEditingController: vm.founderName,
                ),
                SizedBox(height: AppSpacing.md),
                _buildLabel(context, "Rahbar"),
                SizedBox(height: AppSpacing.sm),
                FermerCreatePageInputWidget(
                  hintText: "Eshmatov Toshmet 2",
                  textEditingController: vm.directorName,
                ),
                SizedBox(height: AppSpacing.md),
                _buildLabel(context, "Telefon raqam"),
                SizedBox(height: AppSpacing.sm),
                FermerCreatePageInputWidget(
                  hintText: "+998 97 777 77 77",
                  textEditingController: vm.phoneNumber,
                  textInputType: TextInputType.phone,
                ),
                SizedBox(height: AppSpacing.md),
                _buildLabel(context, "Manzil"),
                SizedBox(height: AppSpacing.sm),
                FermerCreatePageInputWidget(
                  hintText: "Orientir, manzil",
                  textEditingController: vm.address,
                ),
                SizedBox(height: AppSpacing.md),
                _buildLabel(context, "Yaratilgan yili"),
                SizedBox(height: AppSpacing.sm),
                FermerCreatePageInputWidget(
                  hintText: "2023",
                  textEditingController: vm.establishedYear,
                  textInputType: TextInputType.number,
                  maxLength: 4,
                ),
                SizedBox(height: AppSpacing.md),
                _buildLabel(context, "INN"),
                SizedBox(height: AppSpacing.sm),
                FermerCreatePageInputWidget(
                  hintText: "302208505",
                  textEditingController: vm.inn,
                  textInputType: TextInputType.number,
                ),
                SizedBox(height: AppSpacing.xxl),
                MainButton(
                  text: "Fermer Qo'shish",
                  isLoading: vm.isLoading,
                  onTap: () async {
                    FocusScope.of(context).unfocus();
                    final errorMessage = vm.checkValidate();
                    if (errorMessage != null) {
                      Utils.fireTopSnackBar(
                        errorMessage,
                        DesignColors.AppColors.error,
                        context,
                      );
                    } else {
                      final result = await vm.createFermer();
                      if (!result && context.mounted) {
                        Utils.fireTopSnackBar(
                          vm.errorMessage ?? "Xatolik yuz berdi",
                          DesignColors.AppColors.error,
                          context,
                        );
                      } else if (result && context.mounted) {
                        Utils.fireTopSnackBar(
                          "Yangi Fermer Qo'shildi",
                          DesignColors.AppColors.accentGreen,
                          context,
                        );
                        context.pop(true);
                      }
                    }
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(BuildContext context, String text) {
    return Text(
      text,
      style: AppTypography.bodySmall(context).copyWith(
        color: DesignColors.AppColors.darkTextSecondary,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.2,
      ),
    );
  }
}
