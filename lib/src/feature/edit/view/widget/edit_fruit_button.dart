import 'package:agro_employee_public/src/feature/edit/view/widget/edit_fruit_bottom_shit.dart';
import 'package:agro_employee_public/src/feature/edit/vm/edit_vm.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class EditFruitButton extends ConsumerWidget {
  const EditFruitButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var textStyle = TextStyle(fontSize: 16.sp, color: Colors.black);
    var text = Text(
      "Maydon haqida ma'lumotlar",
      style: textStyle,
    );
    return MaterialButton(
      height: 56.h,
      minWidth: MediaQuery.of(context).size.width,
      color: Colors.white,
      padding: REdgeInsets.symmetric(horizontal: 20.w),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8.r),
        side: BorderSide(color: Colors.grey, width: 1),
      ),
      onPressed: () async {
        final vm = ref.read(editVm);
        // Reset switch and form values before opening
        ref.read(switchFenced.notifier).state = false;
        vm.resetFields(ref);

        await vm.getFruit();
        if (!context.mounted) return;
        await showModalBottomSheet(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(
              top: Radius.circular(16.r),
            ),
          ),
          backgroundColor: Colors.white,
          context: context,
          isScrollControlled: true,
          builder: (context) {
            return FractionallySizedBox(
                heightFactor: 0.9, child: EditFruitBottomShit(viewModelm: vm));
          },
        );

        // If sheet dismissed (tap outside or drag), clear values and switch
        ref.read(switchFenced.notifier).state = false;
        vm.resetFields(ref);
      },
      child: text,
    );
  }
}
