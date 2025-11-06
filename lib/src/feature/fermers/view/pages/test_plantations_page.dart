import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../../core/widgets/custom_app_bar_widget.dart';

class TestPlantationsPage extends StatelessWidget {
  final int farmerInn;
  final String farmerName;

  const TestPlantationsPage({
    super.key,
    required this.farmerInn,
    required this.farmerName,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBarWidget(
        title: "Test Plantations",
        canPop: true,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.check_circle,
              size: 100.sp,
              color: Colors.green,
            ),
            SizedBox(height: 20.h),
            Text(
              'Navigation successful!',
              style: TextStyle(
                fontSize: 24.sp,
                fontWeight: FontWeight.bold,
                color: Colors.green,
              ),
            ),
            SizedBox(height: 20.h),
            Text(
              'Farmer: $farmerName',
              style: TextStyle(
                fontSize: 18.sp,
                color: Colors.black87,
              ),
            ),
            SizedBox(height: 10.h),
            Text(
              'INN: $farmerInn',
              style: TextStyle(
                fontSize: 16.sp,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
