import '../../../../data/model/plantation/new_plantation_model.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../../../design_system/theme/colors.dart' as DesignColors;
import '../../../../../design_system/theme/typography.dart';

class AddFruitArea extends StatelessWidget {
  final List<FruitArea> selectedDetails;
  final List<FruitArea>? selectedDetails2;

  final void Function(int) removeDetailAt;

  const AddFruitArea({
    super.key,
    required this.selectedDetails,
    required this.removeDetailAt,
    this.selectedDetails2,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final backgroundColor = isDark
        ? DesignColors.AppColors.darkSurface
        : Colors.white;
    final borderColor = isDark
        ? DesignColors.AppColors.darkOutline
        : Colors.grey.shade300;
    final textColor = isDark
        ? DesignColors.AppColors.darkOnSurface
        : Colors.black;
    
    return Column(
      children: [
        SizedBox(height: 10.h),
        selectedDetails.isEmpty
            ? SizedBox.shrink()
            : SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: List.generate(
                    selectedDetails.length,
                    (index) {
                  final detail = selectedDetails[index];
                  final detail2 = selectedDetails2?[index];
                  return Container(
                    margin: EdgeInsets.only(right: 12.w),
                    constraints: BoxConstraints(
                      maxWidth: 280.w,
                      minWidth: 200.w,
                    ),
                    child: Stack(
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            color: backgroundColor,
                            borderRadius: BorderRadius.circular(12.r),
                            border: Border.all(
                              color: borderColor,
                              width: 1,
                            ),
                          ),
                          padding: EdgeInsets.all(12.w),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              SizedBox(height: 8.h),
                              _buildRow(
                                context,
                                "Meva turi:",
                                detail2?.fruitName ?? detail2?.fruit?.toString() ?? "",
                                textColor,
                              ),
                              SizedBox(height: 6.h),
                              _buildRow(
                                context,
                                "Meva navi:",
                                detail2?.varietyName ?? detail2?.variety?.toString() ?? "",
                                textColor,
                              ),
                              if (detail.iqtisodiysamarasiz == true) ...[
                                SizedBox(height: 6.h),
                                _buildRow(
                                  context,
                                  "Iqtisodiy samarasiz maydon:",
                                  detail.economicInefficientArea?.toString() ?? "0.0",
                                  textColor,
                                ),
                              ] else ...[
                                SizedBox(height: 6.h),
                                _buildRow(
                                  context,
                                  "Payvand turi:",
                                  detail2?.rootstockName ?? detail2?.rootstock?.toString() ?? "",
                                  textColor,
                                ),
                                SizedBox(height: 6.h),
                                _buildRow(
                                  context,
                                  "Ekinlagan yil:",
                                  detail.plantedYear ?? "",
                                  textColor,
                                ),
                                SizedBox(height: 6.h),
                                _buildRow(
                                  context,
                                  "Maydon:",
                                  detail.area.toString(),
                                  textColor,
                                ),
                                SizedBox(height: 6.h),
                                _buildRow(
                                  context,
                                  "Ko'chat sxemasi:",
                                  detail.schema ?? "",
                                  textColor,
                                ),
                                SizedBox(height: 6.h),
                                _buildRow(
                                  context,
                                  "Meva maydoni ximoya to`siq bilan o`ralganmi:",
                                  detail.fenced == true ? 'Ha' : 'Yoq',
                                  textColor,
                                ),
                                SizedBox(height: 6.h),
                                _buildRow(
                                  context,
                                  "Kutilayotgan hosil miqdori: T",
                                  detail.weight == null
                                      ? '—'
                                      : detail.weight.toString(),
                                  textColor,
                                ),
                              ],
                              SizedBox(height: 8.h),
                            ],
                          ),
                        ),
                        Positioned(
                          right: 4.w,
                          top: 4.h,
                          child: Material(
                            color: Colors.transparent,
                            child: InkWell(
                              onTap: () => removeDetailAt(index),
                              borderRadius: BorderRadius.circular(20),
                              child: Container(
                                padding: EdgeInsets.all(4.w),
                                decoration: BoxDecoration(
                                  color: Colors.red.withOpacity(0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  Icons.close,
                                  color: Colors.red,
                                  size: 16.sp,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                    },
                  ),
                ),
              ),
        SizedBox(height: 16.h),
      ],
    );
  }

  Widget _buildRow(BuildContext context, String label, String? value, Color textColor) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Flexible(
          flex: 2,
          child: Text(
            label,
            style: AppTypography.bodyMedium(context).copyWith(
              fontSize: 12.sp,
              fontWeight: FontWeight.w500,
              color: textColor,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        SizedBox(width: 8.w),
        Flexible(
          flex: 3,
          child: Text(
            value != null && value.isNotEmpty ? value : "Noma'lum",
            textAlign: TextAlign.end,
            style: AppTypography.bodyMedium(context).copyWith(
              fontSize: 12.sp,
              color: textColor.withOpacity(0.8),
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
