import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';

import '../../../../data/model/farmer/farmer_plantation_model.dart';
import '../../../../../design_system/theme/colors.dart' as DesignColors;
import '../../../../../design_system/theme/spacing.dart';
import '../../../../../design_system/theme/radius.dart';
import '../../../../../design_system/theme/typography.dart';

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
        padding: EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: DesignColors.AppColors.darkSurface,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(
            color: plantation.isChecked 
                ? DesignColors.AppColors.primary 
                : (plantation.isRejected == true
                    ? DesignColors.AppColors.error
                    : (!plantation.isChecked && plantation.isRejected != true
                        ? DesignColors.AppColors.warning
                        : DesignColors.AppColors.darkOutline)),
            width: (plantation.isChecked || plantation.isRejected == true || (!plantation.isChecked && plantation.isRejected != true)) ? 2 : 1,
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
                    plantation.name ?? 'Plantatsiya',
                    style: AppTypography.headlineLarge(context).copyWith(
                      fontWeight: FontWeight.w700,
                      color: DesignColors.AppColors.darkOnBackground,
                    ),
                  ),
                ),
                // Показываем статус в зависимости от isChecked и isRejected
                if (plantation.isChecked)
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
                    decoration: BoxDecoration(
                      color: DesignColors.AppColors.primary,
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                    child: Text(
                      "Tasdiqlangan",
                      style: AppTypography.labelSmall(context).copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  )
                else if (plantation.isRejected == true)
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
                    decoration: BoxDecoration(
                      color: DesignColors.AppColors.error,
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                    child: Text(
                      "Rad etilgan",
                      style: AppTypography.labelSmall(context).copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  )
                else
                  // Если оба false - значит на модерации
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
                    decoration: BoxDecoration(
                      color: DesignColors.AppColors.warning,
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                    child: Text(
                      "Ko'rib chiqilmoqda",
                      style: AppTypography.labelSmall(context).copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
              ],
            ),
            
            SizedBox(height: AppSpacing.md),
            
            // Stats row
            Row(
              children: [
                // Fertility score
                Expanded(
                  child: _buildStatItem(
                    context: context,
                    icon: Icons.eco,
                    label: "Unumdorlik",
                    value: "${(plantation.fertilityScore ?? 0.0).toStringAsFixed(1)}%",
                    color: DesignColors.AppColors.primary,
                  ),
                ),
                
                SizedBox(width: AppSpacing.md),
                
                // Total area
                Expanded(
                  child: _buildStatItem(
                    context: context,
                    icon: Icons.landscape,
                    label: "Maydon",
                    value: "${plantation.totalArea.toStringAsFixed(1)} ga",
                    color: DesignColors.AppColors.info,
                  ),
                ),
              ],
            ),
            
            SizedBox(height: AppSpacing.md),
            
            // Additional info row
            Wrap(
              spacing: AppSpacing.md,
              runSpacing: AppSpacing.sm,
              children: [
                // Coordinates count
                if (plantation.coordinates.isNotEmpty)
                  _buildInfoChip(
                    context: context,
                    icon: Icons.location_on,
                    label: "${plantation.coordinates.length} ta koordinata",
                    color: DesignColors.AppColors.darkOnSurfaceVariant,
                  ),
                
                // District
                if (plantation.districtName != null)
                  _buildInfoChip(
                    context: context,
                    icon: Icons.map,
                    label: plantation.districtName!,
                    color: DesignColors.AppColors.darkOnSurfaceVariant,
                  ),
                
                // Year established
                if (plantation.gardenEstablishedYear != null)
                  _buildInfoChip(
                    context: context,
                    icon: Icons.calendar_today,
                    label: "Yil: ${plantation.gardenEstablishedYear}",
                    color: DesignColors.AppColors.darkOnSurfaceVariant,
                  ),
                
                // Is fertile
                if (plantation.isFertile == true)
                  _buildInfoChip(
                    context: context,
                    icon: Icons.agriculture,
                    label: "Unumdor",
                    color: DesignColors.AppColors.primary,
                  ),
              ],
            ),
            
            // ID
              Padding(
                padding: EdgeInsets.only(top: AppSpacing.sm),
              child: Row(
                children: [
                  Icon(
                    Icons.tag,
                    size: 14.sp,
                    color: DesignColors.AppColors.darkOnSurfaceVariant,
                  ),
                  SizedBox(width: AppSpacing.xs),
                  Text(
                    "ID: ${plantation.id}",
                    style: AppTypography.labelSmall(context).copyWith(
                      color: DesignColors.AppColors.darkOnSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            
            // Created by
            if (plantation.createdBy != null)
              Padding(
                padding: EdgeInsets.only(top: AppSpacing.xs),
                child: Row(
                  children: [
                    Icon(
                      Icons.person,
                      size: 14.sp,
                      color: DesignColors.AppColors.darkOnSurfaceVariant,
                    ),
                    SizedBox(width: AppSpacing.xs),
                    Expanded(
                      child: Text(
                        "Yaratgan: ${plantation.createdBy!.fullName} (${plantation.createdBy!.username})",
                        style: AppTypography.labelSmall(context).copyWith(
                          color: DesignColors.AppColors.darkOnSurfaceVariant,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            
            // Created date
            if (plantation.createdAt != null)
              Padding(
                padding: EdgeInsets.only(top: AppSpacing.xs),
                child: Row(
                  children: [
                    Icon(
                      Icons.access_time,
                      size: 14.sp,
                      color: DesignColors.AppColors.darkOnSurfaceVariant,
                    ),
                    SizedBox(width: AppSpacing.xs),
                    Text(
                      "Yaratilgan: ${_formatDate(plantation.createdAt!)}",
                      style: AppTypography.labelSmall(context).copyWith(
                        color: DesignColors.AppColors.darkOnSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            
            // Moderated at
            if (plantation.moderatedAt != null)
              Padding(
                padding: EdgeInsets.only(top: AppSpacing.xs),
                child: Row(
                  children: [
                    Icon(
                      Icons.verified,
                      size: 14.sp,
                      color: DesignColors.AppColors.primary,
                    ),
                    SizedBox(width: AppSpacing.xs),
                    Text(
                      "Tasdiqlangan: ${_formatDate(plantation.moderatedAt!)}",
                      style: AppTypography.labelSmall(context).copyWith(
                        color: DesignColors.AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
            
            // Status info
            Padding(
              padding: EdgeInsets.only(top: AppSpacing.xs),
              child: Row(
                children: [
                  Icon(
                    plantation.isChecked 
                        ? Icons.check_circle 
                        : (plantation.isRejected == true 
                            ? Icons.cancel 
                            : Icons.schedule),
                    size: 14.sp,
                    color: plantation.isChecked 
                        ? DesignColors.AppColors.primary 
                        : (plantation.isRejected == true 
                            ? DesignColors.AppColors.error 
                            : DesignColors.AppColors.warning),
                  ),
                  SizedBox(width: AppSpacing.xs),
                  Expanded(
                    child: Text(
                      plantation.isChecked 
                          ? "Tasdiqlangan" 
                          : (plantation.isRejected == true 
                              ? "Rad etilgan" 
                              : "Ko'rib chiqilmoqda"),
                      style: AppTypography.labelSmall(context).copyWith(
                        color: plantation.isChecked 
                            ? DesignColors.AppColors.primary 
                            : (plantation.isRejected == true 
                                ? DesignColors.AppColors.error 
                                : DesignColors.AppColors.warning),
                      ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
  
  String _formatDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      final formatter = DateFormat('dd.MM.yyyy HH:mm');
      return formatter.format(date);
    } catch (e) {
      return dateString;
    }
  }
  
  Widget _buildInfoChip({
    required BuildContext context,
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          size: 14.sp,
          color: color,
        ),
        SizedBox(width: AppSpacing.xs),
        Text(
          label,
          style: AppTypography.labelSmall(context).copyWith(
            color: color,
          ),
        ),
      ],
    );
  }

  Widget _buildStatItem({
    required BuildContext context,
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: EdgeInsets.all(AppSpacing.sm),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(AppRadius.sm),
        border: Border.all(
          color: color.withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          Icon(
            icon,
            size: 24.sp,
            color: color,
          ),
          SizedBox(height: AppSpacing.xs),
          Text(
            value,
            style: AppTypography.bodyLarge(context).copyWith(
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
          Text(
            label,
            style: AppTypography.labelSmall(context).copyWith(
              color: DesignColors.AppColors.darkOnSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
