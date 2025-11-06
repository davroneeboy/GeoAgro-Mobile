import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class ProductivityIndicator extends StatelessWidget {
  final double value;
  final ValueChanged<double> onChanged;

  const ProductivityIndicator({
    super.key,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Banitet bali: ${value.toStringAsFixed(0)}",
          style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w500),
        ),
        Row(
          children: [
            Expanded(
              child: Slider(
                value: value,
                min: 1,
                max: 100,
                divisions: 100,
                label: value.toStringAsFixed(0),
                onChanged: onChanged,
              ),
            ),
          ],
        ),
        SizedBox(height: 10.h),
      ],
    );
  }
}
