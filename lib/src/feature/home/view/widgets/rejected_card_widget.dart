import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/style/app_colors.dart';
import '../../../../core/widgets/custom_card_widget.dart';
import '../../../../core/widgets/custom_driver.dart';
import '../../../../core/widgets/custom_list_tile_widget.dart';
import '../../../../data/model/plantation/plantations_list_model.dart';
import '../../../../core/setting/setup.dart';

class RejectedCardWidget extends StatelessWidget {
  final Result plantation;
  final VoidCallback onEdit;

  const RejectedCardWidget({super.key, required this.plantation, required this.onEdit});

  @override
  Widget build(BuildContext context) {
    final canEdit = (plantation.createdById != null && plantation.createdById == userId) ||
        (plantation.createdByUsername != null && username != null && plantation.createdByUsername == username);
    return CustomCardWidget(
      horizontal: 16,
      vertical: 16,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CustomListTileWidget(title: "Fermer", contextText: plantation.farmerName ?? "Noma'lum"),
          10.verticalSpace,
          const CustomDriver(),
          10.verticalSpace,
          CustomListTileWidget(title: "Yer maydoni", contextText: "${plantation.totalArea} ga"),
          10.verticalSpace,
          const CustomDriver(),
          10.verticalSpace,
          CustomListTileWidget(title: "ID", contextText: "${plantation.id ?? 'N/A'}"),
          10.verticalSpace,
          const CustomDriver(),
          10.verticalSpace,
          if ((plantation.comments?.isNotEmpty ?? false)) ...[
            const CustomDriver(),
            10.verticalSpace,
            Row(
              children: [
                Text(
                  "Tafsilot",
                  style: TextStyle(fontSize: 16.sp, color: AppColors.c1E1E1E, fontWeight: FontWeight.w600),
                ),
                16.horizontalSpace,
                Expanded(
                  child: Text(
                    plantation.comments!.first.body,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 15.sp, color: AppColors.c1E1E1E70, fontWeight: FontWeight.w500),
                  ),
                ),
              ],
            ),
          ],
          16.verticalSpace,
          if (canEdit)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.c28A745,
                  minimumSize: Size(double.infinity, 44.h),
                  padding: EdgeInsets.symmetric(horizontal: 12.w),
                ),
                onPressed: onEdit,
                child: Text("Tahrirlash", style: TextStyle(color: Colors.white, fontSize: 16.sp)),
              ),
            ),
        ],
      ),
    );
  }
}


