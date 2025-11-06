import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/widgets/custom_input_label_widget.dart';
import '../../vm/login_vm.dart';
import '../../../../core/utils/utils.dart';
import '../widgets/login_input_widget.dart';
import '../../../../core/tools/assets.dart';
import '../../../../core/style/app_colors.dart';
import '../widgets/login_title_text_widget.dart';
import '../../../../core/widgets/main_button.dart';
import '../../../../core/routes/router_config.dart';
import '../../../../core/routes/app_route_names.dart';

// Riverpod provider
final loginPageVM = ChangeNotifierProvider.autoDispose<LoginVm>((ref) {
  return LoginVm();
});

class LoginPage extends ConsumerWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    LoginVm vm = ref.watch(loginPageVM);
    final loginVmNotifier = ref.read(loginPageVM.notifier);

    return Scaffold(
      backgroundColor: AppColors.cF7F7F7,
      body: SafeArea(
        child: Padding(
          padding: REdgeInsets.symmetric(horizontal: 16),
          child: SingleChildScrollView(
            child: Form(
              key: vm.formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  24.verticalSpace,
                  Image.asset(Assets.gerbImg, height: 100.h),
                  16.verticalSpace,
                  const LoginTitleTextWidget(),
                  62.verticalSpace,
                  Text(
                    "Tizimga Kirish",
                    style: TextStyle(fontSize: 24.sp, color: AppColors.black, fontWeight: FontWeight.w700),
                  ),
                  32.verticalSpace,
                  const CustomInputLabelWidget(text: "Foydalanuvchi nomi"),
                  12.verticalSpace,
                  LoginInputWidget(hintText: "Bekzod", textEditingController: vm.userNameC, validatorText: "Foydalanuvchi Nomi Togri Emas"),
                  16.verticalSpace,
                  const CustomInputLabelWidget(text: "Foydaluvchi paroli"),
                  12.verticalSpace,
                  LoginInputWidget(hintText: "s:t#3)ArWu", textEditingController: vm.passwordC, validatorText: "Parol Tog'ri Emas"),
                  140.verticalSpace,
                  MainButton2(
                    enableFeedback: !vm.isLoading,
                    onPressed: vm.isLoading
                        ? null
                        : () async {
                            FocusScope.of(context).unfocus();
                            if (vm.formKey.currentState!.validate()) {
                              final isSuccess = await loginVmNotifier.login();
                              if (isSuccess && context.mounted) {
                                Utils.fireTopSnackBar("Muvoffaqiyatli Tizimga Kirildi", AppColors.c28A745, context);
                                RouterConfigService.router.go(AppRouteNames.home);
                              } else if (context.mounted) {
                                Utils.fireTopSnackBar(vm.errorMessage ?? "Xatolik yuz berdi", AppColors.cE60C0C, context);
                              }
                            } else {
                              Utils.fireTopSnackBar("Iltimos, ma'lumotlarni to'g'ri kiriting.", AppColors.cE60C0C, context);
                            }
                          },
                    child: vm.isLoading
                        ? CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5)
                        : Text("Kirish", style: TextStyle(color: Colors.black, fontSize: 16.sp, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
