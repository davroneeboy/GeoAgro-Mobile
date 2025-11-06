import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/style/app_colors.dart';
import '../../../../data/model/farmer/farmer_plantation_model.dart';

class FarmerPlantationCard extends StatelessWidget {
  final FarmerPlantation plantation;
  final VoidCallback? onTap;

  const FarmerPlantationCard({
    super.key,
    required this.plantation,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.all(16.w),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12.r),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: Offset(0, 2),
            ),
          ],
          border: Border.all(
            color: plantation.isChecked 
                ? AppColors.c28A745 
                : Colors.grey.withValues(alpha: 0.2),
            width: plantation.isChecked ? 2 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with name and status
            Row(
              children: [
                Expanded(
                  child: Text(
                    plantation.name,
                    style: TextStyle(
                      fontSize: 16.sp,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                ),
                if (plantation.isChecked)
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
                    decoration: BoxDecoration(
                      color: AppColors.c28A745,
                      borderRadius: BorderRadius.circular(12.r),
                    ),
                    child: Text(
                      "Tasdiqlangan",
                      style: TextStyle(
                        fontSize: 12.sp,
                        color: Colors.white,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
              ],
            ),
            
            SizedBox(height: 12.h),
            
            // Stats row
            Row(
              children: [
                // Fertility score
                Expanded(
                  child: _buildStatItem(
                    icon: Icons.eco,
                    label: "Unumdorlik",
                    value: "${plantation.fertilityScore.toStringAsFixed(1)}%",
                    color: AppColors.c28A745,
                  ),
                ),
                
                SizedBox(width: 12.w),
                
                // Total area
                Expanded(
                  child: _buildStatItem(
                    icon: Icons.landscape,
                    label: "Maydon",
                    value: "${plantation.totalArea.toStringAsFixed(1)} ga",
                    color: Colors.blue,
                  ),
                ),
              ],
            ),
            
            SizedBox(height: 12.h),
            
            // Coordinates count
            Row(
              children: [
                Icon(
                  Icons.location_on,
                  size: 16.sp,
                  color: Colors.grey[600],
                ),
                SizedBox(width: 4.w),
                Text(
                  "${plantation.coordinates.length} ta koordinata",
                  style: TextStyle(
                    fontSize: 12.sp,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: EdgeInsets.all(8.w),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: Column(
        children: [
          Icon(
            icon,
            size: 20.sp,
            color: color,
          ),
          SizedBox(height: 4.h),
          Text(
            value,
            style: TextStyle(
              fontSize: 12.sp,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 10.sp,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }
}
