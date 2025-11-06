import 'package:flutter/material.dart';

import '../../../../core/style/app_colors.dart';

class HomePageFloatactionButtonWidget extends StatelessWidget {
  final VoidCallback onPressed;
  const HomePageFloatactionButtonWidget({super.key, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton(
      heroTag: 'homeFab',
      backgroundColor: AppColors.white,
      foregroundColor: AppColors.c1E1E1E,
      onPressed: onPressed,
      child: const Icon(Icons.add),
    );
  }
}
