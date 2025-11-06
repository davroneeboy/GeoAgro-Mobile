import 'package:agro_employee_public/src/core/style/app_colors.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class CustomSwitchCard extends StatelessWidget {
  final String label;
  final bool switchValue;
  final Function(bool) onChanged;
  final List<Widget> childWidgets;

  const CustomSwitchCard({
    super.key,
    required this.label,
    required this.switchValue,
    required this.onChanged,
    this.childWidgets = const [],
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.white,
            border: Border.all(color: Colors.grey, width: 1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w500),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 2,
                ),
              ),
              Switch(
                value: switchValue,
                onChanged: onChanged,
              ),
            ],
          ),
        ),
        if (switchValue) ...childWidgets,
      ],
    );
  }
}
