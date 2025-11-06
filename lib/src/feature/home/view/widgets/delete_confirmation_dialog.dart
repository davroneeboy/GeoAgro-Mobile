import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/style/app_colors.dart';

class DeleteConfirmationDialog extends StatefulWidget {
  final Function(String reason) onConfirm; // Changed to accept reason
  final VoidCallback onCancel;
  final bool isDeleting; // Added loading state parameter

  const DeleteConfirmationDialog({
    super.key,
    required this.onConfirm,
    required this.onCancel,
    this.isDeleting = false, // Default to false
  });

  @override
  State<DeleteConfirmationDialog> createState() => _DeleteConfirmationDialogState();
}

class _DeleteConfirmationDialogState extends State<DeleteConfirmationDialog> {
  final TextEditingController _reasonController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _reasonController.addListener(() {
      setState(() {}); // Rebuild to enable/disable button
    });
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16.r),
      ),
      title: Text(
        "O'chirishni tasdiqlash",
        style: TextStyle(
          fontSize: 18.sp,
          fontWeight: FontWeight.w600,
          color: AppColors.c1E1E1E,
        ),
        textAlign: TextAlign.center,
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Bog'ni o'chirishni tasdiqlaysizmi?",
            style: TextStyle(
              fontSize: 16.sp,
              color: AppColors.c1E1E1E,
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 16.h),
          Text(
            "O'chirish sababi:",
            style: TextStyle(
              fontSize: 14.sp,
              fontWeight: FontWeight.w500,
              color: AppColors.c1E1E1E,
            ),
          ),
          SizedBox(height: 8.h),
          TextField(
            controller: _reasonController,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: "Sababni kiriting...",
              hintStyle: TextStyle(
                fontSize: 14.sp,
                color: AppColors.c1E1E1E70,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8.r),
                borderSide: BorderSide(color: AppColors.c1E1E1E20),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8.r),
                borderSide: BorderSide(color: AppColors.c28A745, width: 2),
              ),
              contentPadding: EdgeInsets.all(12.h),
            ),
            style: TextStyle(
              fontSize: 14.sp,
              color: AppColors.c1E1E1E,
            ),
          ),
        ],
      ),
      actions: [
        Row(
          children: [
            Expanded(
              child: MaterialButton(
                height: 48.h,
                onPressed: widget.isDeleting ? null : widget.onCancel, // Disable during deletion
                elevation: 0,
                highlightElevation: 0,
                color: AppColors.cE60C0C, // Red color for Yo'q
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10.r),
                ),
                child: Text(
                  "Yo'q",
                  style: TextStyle(
                    fontSize: 16.sp,
                    fontWeight: FontWeight.w500,
                    color: Colors.white, // White text for red button
                  ),
                ),
              ),
            ),
            SizedBox(width: 12.w),
            Expanded(
              child: MaterialButton(
                height: 48.h,
                onPressed: widget.isDeleting || _reasonController.text.trim().isEmpty 
                    ? null 
                    : () => widget.onConfirm(_reasonController.text.trim()), // Pass reason
                elevation: 0,
                highlightElevation: 0,
                color: AppColors.c28A745, // Green color for Ha
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10.r),
                ),
                child: widget.isDeleting
                    ? SizedBox(
                        height: 20.h,
                        width: 20.h,
                        child: const CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Text(
                        "Ha",
                        style: TextStyle(
                          fontSize: 16.sp,
                          fontWeight: FontWeight.w500,
                          color: Colors.white,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ],
      actionsPadding: REdgeInsets.all(16),
    );
  }
}
