import 'package:agro_employee_public/src/feature/edit/vm/edit_vm.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/setting/setup.dart';
import '../../../../core/style/app_colors.dart';
import '../../../detail_page/view/widgets/detail_dropdown_widget.dart';
import '../../../detail_page/view/widgets/detail_text_fild_widget.dart';
import '../../../detail_page/view/widgets/switch_card_widget.dart';

class EditSubsidyBottomShit extends ConsumerWidget {
  final EditVM viewModel;

  const EditSubsidyBottomShit({super.key, required this.viewModel});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vm = ref.watch(editVm);
    final isEfficiency = ref.watch(switchEfficiency);
    var textStyle = TextStyle(
        fontSize: 16.sp, color: Colors.black, fontWeight: FontWeight.bold);

    return Padding(
      padding: REdgeInsets.all(16.0),
      child: Column(
        children: [
          Text("Subsidiya qo`shish va to`ldirish", style: textStyle),
          SizedBox(height: 10.h),
          Padding(
            padding: REdgeInsets.only(top: 10),
            child: CustomTextFieldWithLabel(
              controller: vm.subsidiyaYear,
              onTextChanged: vm.setSubsidiya,
              hintText: "subsidiya ajratilgan kiriting",
              keyboardType: TextInputType.number,
              label: "Subsidiya ajratilgan yil",
            ),
          ),
          Padding(
            padding: REdgeInsets.only(top: 10),
            child: CustomTextFieldWithLabel(
              controller: vm.subsidiyaContract,
              onTextChanged: vm.setSubsidiyaContract,
              hintText: "subsidiya shartnoma raqami kiriting",
              label: "Subsidiya shartnoma raqami",
            ),
          ),
          Padding(
            padding: REdgeInsets.only(top: 10),
            child: CustomTextFieldWithLabel(
              controller: vm.subsidiyaAmount,
              onTextChanged: vm.setSubsidiyaAmount,
              hintText: "ajratilgan subsidiya miqdori: so`m",
              keyboardType: TextInputType.number,
              label: "Ajratilgan subsidiya miqdori",
            ),
          ),
          DropdownWithLabel(
            items: subsidyType,
            hint: "subsidiya ajratilgan yo`nalish kiriting",
            selectedValue: vm.selectedEnergy,
            label: "Subsidiya ajratilgan yo`nalish",
            onChanged: (value) {
              vm.setEnergy(value);
            },
          ),
          SizedBox(height: 10.h),
          CustomSwitchCard(
            label: "Subsidiya samaradormi",
            switchValue: isEfficiency,
            onChanged: (value) {
              ref.read(switchEfficiency.notifier).state = value;
            },
          ),
          SizedBox(height: 10.h),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              ElevatedButton(
                onPressed: () {
                  vm.resetSubsudy();
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                ),
                child: Text("Bekor qilish",
                    style: TextStyle(fontSize: 14.sp, color: AppColors.black)),
              ),
              ElevatedButton(
                  onPressed: () {
                    String? errorMessage;
                    if (vm.subsidiyaYear.text.isEmpty) {
                      errorMessage = "Subsidiya ajratilgan yilni kiriting";
                    } else if (vm.subsidiyaContract.text.isEmpty) {
                      errorMessage = "Subsidiya shartnoma raqamini kiriting";
                    } else if (vm.subsidiyaAmount.text.isEmpty) {
                      errorMessage = "Ajratilgan subsidiya miqdorini kiriting";
                    } else if (vm.selectedEnergy == null) {
                      errorMessage = "Subsidiya turi tanalanmagan";
                    }
                    if (errorMessage != null) {
                      showDialog(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: Text("Xatolik",
                              style: TextStyle(fontSize: 14.sp)),
                          content: Text(errorMessage!,
                              style: TextStyle(fontSize: 12.sp)),
                          actions: [
                            TextButton(
                                onPressed: () {
                                  Navigator.pop(context);
                                },
                                child: Text("OK",
                                    style: TextStyle(fontSize: 12.sp))),
                          ],
                        ),
                      );
                      return;
                    }
                    vm.addSubsidiyaList(ref);
                    Navigator.pop(context);
                  },
                  style:
                      ElevatedButton.styleFrom(backgroundColor: Colors.green),
                  child: Text("   Qo‘shish   ",
                      style:
                          TextStyle(fontSize: 14.sp, color: AppColors.black))),
            ],
          ),
        ],
      ),
    );
  }
}
