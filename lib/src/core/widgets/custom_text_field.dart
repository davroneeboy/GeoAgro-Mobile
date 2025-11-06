import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../style/app_colors.dart';

class CustomTextField extends StatelessWidget {
  final String? label;
  final TextEditingController controller;
  final ValueChanged<String>? onChanged;
  final String? hintText;
  final TextInputType? keyboardType;
  final bool isRequired;
  final String? errorText;
  final bool enabled;
  final int? maxLength;
  final List<TextInputFormatter>? inputFormatters;
  final TextInputAction? textInputAction;
  final VoidCallback? onTap;
  final bool readOnly;
  final Widget? suffixIcon;
  final Widget? prefixIcon;

  const CustomTextField({
    super.key,
    this.label,
    required this.controller,
    this.onChanged,
    this.hintText,
    this.keyboardType,
    this.isRequired = false,
    this.errorText,
    this.enabled = true,
    this.maxLength,
    this.inputFormatters,
    this.textInputAction,
    this.onTap,
    this.readOnly = false,
    this.suffixIcon,
    this.prefixIcon,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Row(
            children: [
              Text(
                label!,
                style: TextStyle(
                  fontSize: 16.sp,
                  fontWeight: FontWeight.w500,
                  color: Colors.black87,
                ),
              ),
              if (isRequired) ...[
                SizedBox(width: 4.w),
                Text(
                  '*',
                  style: TextStyle(
                    fontSize: 16.sp,
                    fontWeight: FontWeight.w500,
                    color: Colors.red,
                  ),
                ),
              ],
            ],
          ),
          SizedBox(height: 8.h),
        ],
        TextField(
          controller: controller,
          keyboardType: keyboardType ?? TextInputType.text,
          enabled: enabled,
          maxLength: maxLength,
          inputFormatters: inputFormatters,
          textInputAction: textInputAction,
          onTap: onTap,
          readOnly: readOnly,
          style: TextStyle(
            fontSize: 16.sp,
            color: enabled ? Colors.black87 : Colors.grey[600],
            fontWeight: FontWeight.w400,
          ),
          decoration: InputDecoration(
            fillColor: enabled ? Colors.white : Colors.grey[100],
            filled: true,
            hintText: hintText,
            hintStyle: TextStyle(
              fontSize: 16.sp,
              color: Colors.grey[500],
              fontWeight: FontWeight.w400,
            ),
            suffixIcon: suffixIcon,
            prefixIcon: prefixIcon,
            enabledBorder: OutlineInputBorder(
              borderSide: BorderSide(
                color: errorText != null 
                    ? Colors.red 
                    : AppColors.c1E1E1E16,
              ),
              borderRadius: BorderRadius.circular(8.r),
            ),
            focusedBorder: OutlineInputBorder(
              borderSide: BorderSide(
                color: errorText != null 
                    ? Colors.red 
                    : AppColors.c1E1E1E70,
              ),
              borderRadius: BorderRadius.circular(8.r),
            ),
            disabledBorder: OutlineInputBorder(
              borderSide: BorderSide(color: Colors.grey[300]!),
              borderRadius: BorderRadius.circular(8.r),
            ),
            errorBorder: OutlineInputBorder(
              borderSide: BorderSide(color: Colors.red),
              borderRadius: BorderRadius.circular(8.r),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderSide: BorderSide(color: Colors.red),
              borderRadius: BorderRadius.circular(8.r),
            ),
            contentPadding: REdgeInsets.symmetric(horizontal: 16, vertical: 12),
          ),
          onChanged: onChanged,
        ),
        if (errorText != null) ...[
          SizedBox(height: 4.h),
          Text(
            errorText!,
            style: TextStyle(
              fontSize: 12.sp,
              color: Colors.red,
            ),
          ),
        ],
      ],
    );
  }
}

// Специализированный виджет для номеров решений
class DecisionNumberField extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String>? onChanged;
  final String? errorText;
  final bool isRequired;

  const DecisionNumberField({
    super.key,
    required this.controller,
    this.onChanged,
    this.errorText,
    this.isRequired = false,
  });

  @override
  Widget build(BuildContext context) {
    return CustomTextField(
      label: "Qaror raqamini kiriting",
      controller: controller,
      onChanged: onChanged,
      hintText: "qaror raqami kiritilmagan",
      keyboardType: TextInputType.text, // Позволяет вводить цифры и символы
      isRequired: isRequired,
      errorText: errorText,
      maxLength: 50, // Ограничиваем длину
      suffixIcon: Icon(
        Icons.description,
        color: Colors.grey[500],
        size: 20.sp,
      ),
    );
  }
}

// Специализированный виджет для контрактных номеров
class ContractNumberField extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String>? onChanged;
  final String? errorText;
  final bool isRequired;

  const ContractNumberField({
    super.key,
    required this.controller,
    this.onChanged,
    this.errorText,
    this.isRequired = false,
  });

  @override
  Widget build(BuildContext context) {
    return CustomTextField(
      label: "Shartnoma raqamini kiriting",
      controller: controller,
      onChanged: onChanged,
      hintText: "shartnoma raqami kiritilmagan",
      keyboardType: TextInputType.text, // Позволяет вводить цифры и символы
      isRequired: isRequired,
      errorText: errorText,
      maxLength: 50, // Ограничиваем длину
      suffixIcon: Icon(
        Icons.assignment,
        color: Colors.grey[500],
        size: 20.sp,
      ),
    );
  }
}

// Специализированный виджет для числовых полей
class NumberField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final ValueChanged<String>? onChanged;
  final String? hintText;
  final String? errorText;
  final bool isRequired;
  final bool allowDecimal;
  final String? suffix;

  const NumberField({
    super.key,
    required this.label,
    required this.controller,
    this.onChanged,
    this.hintText,
    this.errorText,
    this.isRequired = false,
    this.allowDecimal = false,
    this.suffix,
  });

  @override
  Widget build(BuildContext context) {
    return CustomTextField(
      label: label,
      controller: controller,
      onChanged: onChanged,
      hintText: hintText,
      keyboardType: allowDecimal 
          ? const TextInputType.numberWithOptions(decimal: true)
          : TextInputType.number,
      isRequired: isRequired,
      errorText: errorText,
      inputFormatters: [
        if (!allowDecimal) FilteringTextInputFormatter.digitsOnly,
      ],
      suffixIcon: suffix != null 
          ? Padding(
              padding: REdgeInsets.only(right: 16),
              child: Text(
                suffix!,
                style: TextStyle(
                  fontSize: 16.sp,
                  color: Colors.grey[600],
                ),
              ),
            )
          : null,
    );
  }
} 