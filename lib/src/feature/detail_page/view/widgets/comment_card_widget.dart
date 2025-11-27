import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../../data/model/comment/comment_model.dart';
import '../../../../core/style/app_colors.dart';
import '../../../../core/utils/date_formatter.dart';

/// Виджет для отображения одного комментария
class CommentCard extends StatelessWidget {
  final CommentModel comment;

  const CommentCard({
    Key? key,
    required this.comment,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isModeration = comment.isModeration;
    
    return Container(
      margin: EdgeInsets.only(bottom: 12.h),
      padding: EdgeInsets.all(12.w),
      decoration: BoxDecoration(
        color: isModeration 
          ? AppColors.c28A745.withOpacity(0.1)  // Зелёный фон для модератора
          : AppColors.white,
        border: Border.all(
          color: isModeration 
            ? AppColors.c28A745 
            : AppColors.c1E1E1E.withOpacity(0.2),
          width: 1,
        ),
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: автор и дата
          Row(
            children: [
              // Иконка модератора
              if (isModeration) ...[
                Icon(
                  Icons.verified_user,
                  size: 16.sp,
                  color: AppColors.c28A745,
                ),
                4.horizontalSpace,
              ],
              // Имя автора
              Expanded(
                child: Text(
                  comment.createdBy?.fullName ?? 'Noma\'lum',
                  style: TextStyle(
                    fontSize: 14.sp,
                    fontWeight: FontWeight.w600,
                    color: isModeration 
                      ? AppColors.c28A745 
                      : AppColors.c1E1E1E,
                  ),
                ),
              ),
              // Дата
              Text(
                DateFormatter.formatCommentDate(comment.createdAt),
                style: TextStyle(
                  fontSize: 12.sp,
                  color: AppColors.c1E1E1E70,
                ),
              ),
            ],
          ),
          8.verticalSpace,
          // Текст комментария
          Text(
            comment.body,
            style: TextStyle(
              fontSize: 14.sp,
              color: AppColors.c1E1E1E,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

