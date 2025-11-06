import 'package:flutter/material.dart';

import '../../core/style/app_colors.dart';

class BlockedPage extends StatelessWidget {
  const BlockedPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.cE60C0C,
      body: Center(
        child: Text(
          "The application has been blocked",
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.white, fontSize: 40, fontWeight: FontWeight.w500), 
        ),
      ),
    );
  }
}
