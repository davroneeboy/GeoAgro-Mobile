import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../../core/widgets/custom_driver.dart';
import '../../../../core/widgets/custom_list_tile_widget.dart';
import '../../../../data/model/farmer/farmer_list_model.dart';

class FermerPageCardWidget extends StatelessWidget {
  final FarmerModel fermerModel;
  final VoidCallback onPressed;
  const FermerPageCardWidget({super.key, required this.onPressed, required this.fermerModel});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        debugPrint('FermerPageCardWidget: Card tapped for farmer: ${fermerModel.name}');
        onPressed();
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14.r),
          border: Border.all(
            color: Colors.grey.withValues(alpha: 0.2),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 16.h),
          child: Column(
            children: [
              CustomListTileWidget(title: "Tashkilot Nomi", contextText: fermerModel.name ?? "Unknow"),
              10.verticalSpace,
              const CustomDriver(),
              10.verticalSpace,
              CustomListTileWidget(title: "Asoschi", contextText: fermerModel.founderName ?? "Unknow"),
              10.verticalSpace,
              const CustomDriver(),
              10.verticalSpace,
              CustomListTileWidget(title: "INN", contextText: fermerModel.inn.toString()),
            ],
          ),
        ),
      ),
    );
  }
}
