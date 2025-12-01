import 'dart:convert';
import 'dart:developer';

import 'package:flutter/material.dart';

import '../../../data/model/farmer/farmer_statistics_model.dart';
import '../../../data/repository/app_repository_impl.dart';

class FarmersStatisticsVm extends ChangeNotifier {
  bool isLoading = true;
  String? errorMessage;
  List<FarmerData>? statistics;
  int? districtId;

  final AppRepositoryImpl _appRepositoryImpl = AppRepositoryImpl();

  FarmersStatisticsVm() {
    _initialize();
  }

  Future<void> _initialize() async {
    await _getDistrictId();
    if (districtId != null) {
      await fetchStatistics();
    } else {
      errorMessage = "District ID topilmadi";
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _getDistrictId() async {
    try {
      final userInfoData = await _appRepositoryImpl.getUserInfo();
      if (userInfoData != null) {
        final userInfo = jsonDecode(userInfoData);
        districtId = userInfo['district_id'];
        log("District ID: $districtId");
      }
    } catch (e) {
      log("Error getting district ID: $e");
    }
  }

  Future<void> fetchStatistics() async {
    if (districtId == null) return;
    
    errorMessage = null;
    isLoading = true;
    notifyListeners();

    try {
      final data = await _appRepositoryImpl.getFarmersStatistics(districtId: districtId!);
      
      if (data == null) {
        errorMessage = "Server bilan bog'liq xatolik yuzaga keldi.";
      } else {
        try {
          final jsonData = jsonDecode(data);
          // API теперь возвращает {count: X, results: [...]}
          if (jsonData is Map<String, dynamic> && jsonData['results'] != null) {
            final resultsJson = jsonEncode(jsonData['results']);
            statistics = farmerStatisticsModelFromJson(resultsJson);
          } else {
            // Fallback на старый формат, если он еще используется
            statistics = farmerStatisticsModelFromJson(data);
          }
        } catch (jsonError) {
          log("JSON Parsing Error: $jsonError");
          log("Raw data: $data");
          errorMessage = "Ma'lumotlarni qayta ishlashda xatolik yuz berdi.";
        }
      }
    } catch (e) {
      log("Error fetching statistics: $e");
      errorMessage = "Internet bilan bog'liq muammo yuzaga keldi.";
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refresh() async {
    await fetchStatistics();
  }
}
