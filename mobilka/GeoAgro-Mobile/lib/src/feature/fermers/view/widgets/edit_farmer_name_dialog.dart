import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:agro_employee_public/design_system/tokens/colors.dart' as design_colors;
import 'package:agro_employee_public/design_system/tokens/spacing.dart';
import 'package:agro_employee_public/design_system/tokens/typography.dart';
import 'package:agro_employee_public/src/core/widgets/custom_text_field.dart';
import 'package:agro_employee_public/design_system/tokens/adaptive_colors.dart';

class EditFarmerNameDialog extends StatefulWidget {
  final String currentName;
  final Function(String newName) onSave;
  final bool isLoading;

  const EditFarmerNameDialog({
    super.key,
    required this.currentName,
    required this.onSave,
    required this.isLoading,
  });

  @override
  State<EditFarmerNameDialog> createState() => _EditFarmerNameDialogState();
}

class _EditFarmerNameDialogState extends State<EditFarmerNameDialog> {
  late TextEditingController _nameController;
  final _formKey = GlobalKey<FormState>();
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.currentName);
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  void _handleSave() {
    final newName = _nameController.text.trim();
    if (newName.isEmpty) {
      setState(() {
        _errorMessage = "Fermer nomi bo'sh bo'lishi mumkin emas";
      });
      return;
    }
    
    if (newName.length < 2) {
      setState(() {
        _errorMessage = "Fermer nomi kamida 2 ta belgi bo'lishi kerak";
      });
      return;
    }
    
    // Проверка на кириллицу
    if (RegExp(r'[а-яА-ЯёЁ]').hasMatch(newName)) {
      setState(() {
        _errorMessage = "Fermer nomi faqat lotin harflaridan iborat bo'lishi kerak (kirill harflari qabul qilinmaydi)";
      });
      return;
    }
    
    // Проверка на наличие только латиницы и пробелов
    if (!RegExp(r'^[a-zA-Z\s]+$').hasMatch(newName)) {
      setState(() {
        _errorMessage = "Fermer nomi faqat lotin harflari va probellaridan iborat bo'lishi kerak";
      });
      return;
    }
    
    if (newName == widget.currentName) {
      Navigator.of(context).pop();
      return;
    }

    widget.onSave(newName);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: context.colors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16.r),
      ),
      title: Text(
        "Fermer nomini o'zgartirish",
        style: AppTypography.title(context).copyWith(
          color: context.colors.textPrimary,
          fontWeight: FontWeight.w700,
        ),
      ),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CustomTextField(
              controller: _nameController,
              label: "Fermer nomi",
              isRequired: true,
              enabled: !widget.isLoading,
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Z\s]')),
              ],
            ),
            if (_errorMessage != null) ...[
              SizedBox(height: AppSpacing.sm),
              Text(
                _errorMessage!,
                style: AppTypography.bodySmall(context).copyWith(
                  color: design_colors.AppColors.error,
                ),
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: widget.isLoading ? null : () => Navigator.of(context).pop(),
          child: Text(
            "Bekor qilish",
            style: AppTypography.body(context).copyWith(
              color: context.colors.textSecondary,
            ),
          ),
        ),
        FilledButton(
          onPressed: widget.isLoading ? null : _handleSave,
          style: FilledButton.styleFrom(
            backgroundColor: design_colors.AppColors.accentGreen,
            disabledBackgroundColor: design_colors.AppColors.accentGreen.withValues(alpha: 0.5),
          ),
          child: widget.isLoading
              ? SizedBox(
                  width: 20.w,
                  height: 20.h,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : Text(
                  "Saqlash",
                  style: AppTypography.body(context).copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
        ),
      ],
    );
  }
}
