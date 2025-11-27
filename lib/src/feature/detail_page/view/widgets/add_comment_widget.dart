import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../../core/style/app_colors.dart';

/// Виджет для добавления нового комментария
class AddCommentWidget extends StatefulWidget {
  final Future<bool> Function(String body) onSubmit;
  final VoidCallback? onCancel;

  const AddCommentWidget({
    Key? key,
    required this.onSubmit,
    this.onCancel,
  }) : super(key: key);

  @override
  State<AddCommentWidget> createState() => _AddCommentWidgetState();
}

class _AddCommentWidgetState extends State<AddCommentWidget> {
  final _controller = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isSubmitting = false;
  
  static const int _minLength = 3;
  static const int _maxLength = 500;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isSubmitting = true);
    
    try {
      final success = await widget.onSubmit(_controller.text.trim());
      
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Izoh qo\'shildi'),
            backgroundColor: AppColors.c28A745,
            duration: Duration(seconds: 2),
          ),
        );
        _controller.clear();
        widget.onCancel?.call();
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Xatolik yuz berdi'),
            backgroundColor: AppColors.cFF0000,
            duration: Duration(seconds: 2),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: AppColors.white,
        border: Border.all(color: AppColors.c1E1E1E.withOpacity(0.2)),
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Izoh yozish',
              style: TextStyle(
                fontSize: 16.sp,
                fontWeight: FontWeight.w600,
                color: AppColors.c1E1E1E,
              ),
            ),
            12.verticalSpace,
            TextFormField(
              controller: _controller,
              maxLines: 5,
              minLines: 3,
              maxLength: _maxLength,
              enabled: !_isSubmitting,
              decoration: InputDecoration(
                hintText: 'Izohingizni yozing...',
                hintStyle: TextStyle(
                  fontSize: 14.sp,
                  color: AppColors.c1E1E1E70,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.r),
                  borderSide: BorderSide(color: AppColors.c1E1E1E.withOpacity(0.2)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.r),
                  borderSide: BorderSide(color: AppColors.c28A745, width: 2),
                ),
                errorBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.r),
                  borderSide: BorderSide(color: AppColors.cFF0000, width: 1),
                ),
                counterStyle: TextStyle(fontSize: 12.sp),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Izoh bo\'sh bo\'lishi mumkin emas';
                }
                if (value.trim().length < _minLength) {
                  return 'Kamida $_minLength ta belgi kiriting';
                }
                return null;
              },
            ),
            16.verticalSpace,
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isSubmitting ? null : widget.onCancel,
                    style: OutlinedButton.styleFrom(
                      minimumSize: Size(double.infinity, 44.h),
                      side: BorderSide(color: AppColors.c1E1E1E.withOpacity(0.3)),
                    ),
                    child: Text(
                      'Bekor qilish',
                      style: TextStyle(fontSize: 14.sp),
                    ),
                  ),
                ),
                12.horizontalSpace,
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isSubmitting ? null : _handleSubmit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.c28A745,
                      minimumSize: Size(double.infinity, 44.h),
                    ),
                    child: _isSubmitting
                        ? SizedBox(
                            width: 20.w,
                            height: 20.h,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Text(
                            'Yuborish',
                            style: TextStyle(
                              fontSize: 14.sp,
                              color: Colors.white,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

