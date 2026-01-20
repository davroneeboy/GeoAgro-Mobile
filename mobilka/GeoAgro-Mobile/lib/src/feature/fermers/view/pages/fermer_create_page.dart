import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:agro_employee_public/design_system/tokens/colors.dart' as DesignColors;
import 'package:agro_employee_public/design_system/tokens/radii.dart';
import 'package:agro_employee_public/design_system/tokens/spacing.dart';
import '../../../../core/utils/utils.dart';
import '../../../../core/widgets/main_button.dart';
import '../../../../core/widgets/custom_text_field.dart';
import '../../vm/fermer_create_vm.dart';
import '../../../../core/widgets/custom_app_bar_widget.dart';
import '../../../../core/tools/uzbek_phone_formatter.dart';

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
                CustomTextField(
                  label: "Tashkilot nomi",
                  controller: vm.name,
                  hintText: "Firma nomi",
                  isRequired: true,
                  errorText: vm.nameError,
                  maxLength: 100,
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Z0-9\s]')),
                    LengthLimitingTextInputFormatter(100),
                  ],
                ),
                SizedBox(height: AppSpacing.md),
                CustomTextField(
                  label: "Asoschi",
                  controller: vm.founderName,
                  hintText: "Eshmatov Toshmat",
                  isRequired: true,
                  errorText: vm.founderNameError,
                  maxLength: 100,
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Zа-яА-ЯёЁўЎқҚғҒҳҲ\s]')),
                    LengthLimitingTextInputFormatter(100),
                  ],
                ),
                SizedBox(height: AppSpacing.md),
                CustomTextField(
                  label: "Rahbar",
                  controller: vm.directorName,
                  hintText: "Eshmatov Toshmet 2",
                  isRequired: true,
                  errorText: vm.directorNameError,
                  maxLength: 100,
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Zа-яА-ЯёЁўЎқҚғҒҳҲ\s]')),
                    LengthLimitingTextInputFormatter(100),
                  ],
                ),
                SizedBox(height: AppSpacing.md),
                CustomTextField(
                  label: "Telefon raqam",
                  controller: vm.phoneNumber,
                  hintText: "+998 90 123-45-67",
                  isRequired: true,
                  errorText: vm.phoneNumberError,
                  keyboardType: TextInputType.phone,
                  inputFormatters: [
                    UzbekPhoneFormatter(),
                  ],
                ),
                SizedBox(height: AppSpacing.md),
                CustomTextField(
                  label: "Manzil",
                  controller: vm.address,
                  hintText: "Orientir, manzil",
                  isRequired: true,
                  errorText: vm.addressError,
                  maxLength: 200,
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Zа-яА-ЯёЁўЎқҚғҒҳҲ0-9\s,.-]')),
                    LengthLimitingTextInputFormatter(200),
                  ],
                ),
                SizedBox(height: AppSpacing.md),
                CustomTextField(
                  label: "Yaratilgan yili",
                  controller: vm.establishedYear,
                  hintText: "2023",
                  isRequired: true,
                  errorText: vm.establishedYearError,
                  keyboardType: TextInputType.number,
                  maxLength: 4,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                  ],
                ),
                SizedBox(height: AppSpacing.md),
                CustomTextField(
                  label: "INN",
                  controller: vm.inn,
                  hintText: "302208505",
                  isRequired: true,
                  errorText: vm.innError,
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(9),
                  ],
                ),
                SizedBox(height: AppSpacing.xxl),
                MainButton(
                  text: "Fermer Qo'shish",
                  isLoading: vm.isLoading,
                  onTap: () async {
                    FocusScope.of(context).unfocus();
                    if (vm.validateAll()) {
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
                    } else {
                      Utils.fireTopSnackBar(
                        "Iltimos, barcha maydonlarni to'g'ri to'ldiring",
                        DesignColors.AppColors.error,
                        context,
                      );
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

}
