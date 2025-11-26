import 'package:dotted_line/dotted_line.dart';
import 'package:flutter/material.dart';

import '../style/app_colors.dart';

class CustomDriver extends StatelessWidget {
  const CustomDriver({super.key});

  @override
  Widget build(BuildContext context) {
    return const DottedLine(
      dashColor: AppColors.c1E1E1E16,
      lineThickness: 1.0,
      dashLength: 4.0,
      dashGapLength: 3.0,
    );
  }
}
