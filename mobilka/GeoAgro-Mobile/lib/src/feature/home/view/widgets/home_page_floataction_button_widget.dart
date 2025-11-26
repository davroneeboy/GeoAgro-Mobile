import 'package:flutter/material.dart';

import '../../../../../design_system/theme/colors.dart' as DesignColors;

class HomePageFloatactionButtonWidget extends StatelessWidget {
  final VoidCallback onPressed;
  const HomePageFloatactionButtonWidget({super.key, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton(
      heroTag: 'homeFab',
      backgroundColor: DesignColors.AppColors.primary,
      foregroundColor: Colors.white,
      elevation: 6,
      onPressed: onPressed,
      child: const Icon(Icons.add, size: 28),
    );
  }
}
