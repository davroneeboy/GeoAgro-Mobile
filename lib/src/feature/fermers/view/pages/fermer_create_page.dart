import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/style/app_colors.dart';
import '../../../../core/utils/utils.dart';
import '../../../../core/widgets/custom_input_label_widget.dart';
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
      appBar: const CustomAppBarWidget(title: "Fermer Qo'shish", canPop: true),
      body: Padding(
        padding: EdgeInsets.symmetric(horizontal: 14),
        child: SingleChildScrollView(
          child: Padding(
            padding: REdgeInsets.symmetric(horizontal: 16, vertical: 20),
            child: Column(
              children: [
                CustomInputLabelWidget(text: "Tashkilot Nomi"),
                6.verticalSpace,
                FermerCreatePageInputWidget(
                    hintText: "Firma nomi", textEditingController: vm.name),
                10.verticalSpace,
                CustomInputLabelWidget(text: "Asoschi"),
                6.verticalSpace,
                FermerCreatePageInputWidget(
                    hintText: "Eshmatov Toshmat",
                    textEditingController: vm.founderName),
                10.verticalSpace,
                CustomInputLabelWidget(text: "Rahbar"),
                6.verticalSpace,
                FermerCreatePageInputWidget(
                    hintText: "Eshmatov Toshmet 2",
                    textEditingController: vm.directorName),
                10.verticalSpace,
                CustomInputLabelWidget(text: "Telefon raqam"),
                6.verticalSpace,
                FermerCreatePageInputWidget(
                    hintText: "947777777",
                    textEditingController: vm.phoneNumber,
                    textInputType: TextInputType.phone),
                10.verticalSpace,
                CustomInputLabelWidget(text: "Adress"),
                6.verticalSpace,
                FermerCreatePageInputWidget(
                    hintText: "Orinter, manzil",
                    textEditingController: vm.address),
                10.verticalSpace,
                CustomInputLabelWidget(text: "Yaratilgan Yili"),
                6.verticalSpace,
                FermerCreatePageInputWidget(
                    hintText: "2023",
                    textEditingController: vm.establishedYear,
                    textInputType: TextInputType.number,
                    maxLength: 4),
                10.verticalSpace,
                CustomInputLabelWidget(text: "Inn"),
                6.verticalSpace,
                FermerCreatePageInputWidget(
                    hintText: "12345678",
                    textEditingController: vm.inn,
                    textInputType: TextInputType.number),
                26.verticalSpace,
                MainButton(
                  text: "Fermer Qo'shish",
                  isLoading: vm.isLoading,
                  onTap: () async {
                    FocusScope.of(context).unfocus();
                    String? errorMessage = vm.checkValidate();
                    if (errorMessage != null) {
                      Utils.fireTopSnackBar(
                          errorMessage, AppColors.cE60C0C, context);
                    } else {
                      final result = await vm.createFermer();
                      if (!result && context.mounted) {
                        Utils.fireTopSnackBar(
                            vm.errorMessage ?? "Xatolik Yuz berdi",
                            AppColors.cE60C0C,
                            context);
                      } else if (result && context.mounted) {
                        Utils.fireTopSnackBar("Yangi Fermer Qo'shildi",
                            AppColors.c28A745, context);
                        context.pop(true);
                      }
                    }
                  },
                ),

                // MainButton(
                //   text: "Fermerni Qo'shish",
                //   onTap: () async {
                //     String? errorMessage = vm.checkValidate();
                //     if (errorMessage != null) {
                //       Utils.fireTopSnackBar(errorMessage, AppColors.cE60C0C, context);
                //     } else {
                //       final result = await vm.createFermer();
                //       if (!result && context.mounted) {
                //         Utils.fireTopSnackBar(vm.errorMessage ?? "Xatolik Yuz berdi", AppColors.cE60C0C, context);
                //       } else if (result && context.mounted) {
                //         Utils.fireTopSnackBar("Yangi Fermer Qo'shildi", AppColors.c28A745, context);
                //         context.pop(true);
                //       }
                //     }
                //   },
                // ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
