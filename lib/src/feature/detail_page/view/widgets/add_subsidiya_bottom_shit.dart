import 'package:agro_employee_public/src/feature/detail_page/view/widgets/created_time_widget.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/setting/setup.dart';

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
    var textStyle = TextStyle(
        fontSize: 16.sp, color: Colors.black, fontWeight: FontWeight.bold);

    return Padding(
      padding: REdgeInsets.all(16.0),
      child: Column(
        children: [
          Text("Subsidiya qo`shish va to`ldirish", style: textStyle),
          SizedBox(height: 10.h),
          CreatedTime(
            selectedDate: detailVm.selectedDate3,
            setSelectedDate: detailVm.setSelectedDate3,
          ),
          Padding(
            padding: REdgeInsets.only(top: 10),
            child: CustomTextFieldWithLabel(
              controller: detailVm.subsidiyaContract,
              onTextChanged: detailVm.setSubsidiyaConract,
              hintText: "subsidiya shartnoma raqami kiriting",
              label: "Subsidiya shartnoma raqami",
            ),
          ),
          Padding(
            padding: REdgeInsets.only(top: 10),
            child: CustomTextFieldWithLabel(
              controller: detailVm.subsidiyaAmount,
              onTextChanged: detailVm.setSubsidiyaAmount,
              hintText: "ajratilgan subsidiya miqdori: so`m",
              keyboardType: TextInputType.number,
              label: "Ajratilgan subsidiya miqdori",
            ),
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
          SizedBox(height: 10.h),
          CustomSwitchCard(
            label: "Subsidiya samaradormi",
            switchValue: isEfficiency,
            onChanged: (value) {
              ref.read(detailVm.switchEfficiency.notifier).state = value;
            },
          ),
          SizedBox(height: 10.h),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              Expanded(
                child: Padding(
                  padding: EdgeInsets.only(bottom: MediaQuery.of(context).padding.bottom > 0 ? MediaQuery.of(context).padding.bottom : 16),
                  child: ElevatedButton(
                    onPressed: () {
                      detailVm.resetSubsudy();
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                    ),
                    child: Text("Bekor qilish",
                        style:
                            TextStyle(fontSize: 14.sp, color: Colors.white)),
                  ),
                ),
              ),
              SizedBox(width: 16),
              Expanded(
                child: Padding(
                  padding: EdgeInsets.only(bottom: MediaQuery.of(context).padding.bottom > 0 ? MediaQuery.of(context).padding.bottom : 16),
                  child: ElevatedButton(
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
                      detailVm.addSubsidiyaList(ref);
                      Navigator.pop(context);
                    },
                    style:
                        ElevatedButton.styleFrom(backgroundColor: Colors.green),
                    child: Text("   Qo‘shish   ",
                        style:
                            TextStyle(fontSize: 14.sp, color: Colors.white)),
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
