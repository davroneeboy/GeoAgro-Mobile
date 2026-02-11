import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:agro_employee_public/design_system/tokens/colors.dart' as DesignColors;
import 'package:agro_employee_public/design_system/tokens/typography.dart';

class GenericDropWidget<T> extends StatelessWidget {
  final String labelText;
  final List<T> items;
  final T? selectedItem;
  final bool isLoading;
  final Function(T?) onChanged;
  final String Function(T) itemLabel;

  const GenericDropWidget({
    super.key,
    required this.labelText,
    required this.items,
    required this.selectedItem,
    required this.isLoading,
    required this.onChanged,
    required this.itemLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          labelText,
          style: AppTypography.bodyLarge(context).copyWith(
            fontSize: 16.sp,
            fontWeight: FontWeight.w500,
            color: DesignColors.AppColors.darkTextPrimary,
          ),
        ),
        Container(
          height: 50.h,
          width: MediaQuery.of(context).size.width * 0.3,
          padding: REdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: DesignColors.AppColors.darkSurface,
            borderRadius: BorderRadius.circular(8.r),
            border: Border.all(color: DesignColors.AppColors.darkBorder),
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              DropdownButtonHideUnderline(
                child: DropdownButton<T>(
                  isExpanded: true,
                  value: selectedItem,
                  dropdownColor: DesignColors.AppColors.darkSurface,
                  style: AppTypography.bodyLarge(context).copyWith(
                    fontSize: 14.sp,
                    color: DesignColors.AppColors.darkTextPrimary,
                  ),
                  hint: Text(
                    "Tanlang:",
                    style: AppTypography.bodyMedium(context).copyWith(
                      color: DesignColors.AppColors.darkTextSecondary,
                      fontSize: 12.sp,
                    ),
                  ),
                  icon: Icon(
                    Icons.keyboard_arrow_down,
                    color: DesignColors.AppColors.darkTextPrimary,
                  ),
                  items: items.map((T item) {
                    return DropdownMenuItem<T>(
                      value: item,
                      child: Text(
                        itemLabel(item),
                        style: AppTypography.bodyLarge(context).copyWith(
                          fontSize: 14.sp,
                          color: DesignColors.AppColors.darkTextPrimary,
                        ),
                      ),
                    );
                  }).toList(),
                  onChanged: onChanged,
                ),
              ),
              if (isLoading)
                SizedBox(
                  height: 10.h,
                  width: 10.h,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: DesignColors.AppColors.accentGreen,
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}
