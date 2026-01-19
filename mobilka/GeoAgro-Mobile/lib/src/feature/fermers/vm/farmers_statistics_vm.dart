import 'dart:convert';
import 'dart:developer';

import 'package:flutter/material.dart';

import '../../../data/model/farmer/farmer_statistics_model.dart';
import '../../../data/model/farmer/farmer_list_model.dart';
import '../../../data/repository/app_repository_impl.dart';

class FarmersStatisticsVm extends ChangeNotifier {
  bool isLoading = false;
  String? errorMessage;
  List<FarmerData>? statistics;
  int? districtId;

  final TextEditingController searchInnController = TextEditingController();
  bool isSearching = false;
  List<FarmerModel>? searchResults;
  String? searchErrorMessage;

  final AppRepositoryImpl _appRepositoryImpl = AppRepositoryImpl();

  FarmersStatisticsVm();

  /// Инициализация (вызывается вручную при открытии страницы)
  Future<void> initialize() async {
    debugPrint("📊 FarmersStatisticsVM: initialize() called");
    if (districtId != null && statistics != null) {
      debugPrint("📊 FarmersStatisticsVM: Already initialized, skipping");
      return;
    }
    isLoading = true;
    notifyListeners();
    debugPrint("📊 FarmersStatisticsVM: Getting district ID...");
    await _getDistrictId();
    if (districtId != null) {
      debugPrint("📊 FarmersStatisticsVM: District ID found: $districtId");
      await fetchStatistics();
    } else {
      debugPrint("❌ FarmersStatisticsVM: District ID not found");
      errorMessage = "District ID topilmadi";
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _getDistrictId() async {
    try {
      debugPrint("📊 FarmersStatisticsVM: Calling getUserInfo API...");
      final userInfoData = await _appRepositoryImpl.getUserInfo();
      if (userInfoData != null) {
        debugPrint("📊 FarmersStatisticsVM: getUserInfo response received");
        final userInfo = jsonDecode(userInfoData);
        districtId = userInfo['district_id'];
        debugPrint("📊 FarmersStatisticsVM: District ID extracted: $districtId");
      } else {
        debugPrint("❌ FarmersStatisticsVM: getUserInfo returned null");
      }
    } catch (e) {
      debugPrint("❌ FarmersStatisticsVM: Error getting district ID: $e");
    }
  }

  Future<void> fetchStatistics() async {
    if (districtId == null) {
      debugPrint("❌ FarmersStatisticsVM: Cannot fetch statistics - districtId is null");
      return;
    }

    errorMessage = null;
    isLoading = true;
    notifyListeners();

    try {
      debugPrint("📊 FarmersStatisticsVM: Fetching statistics for district: $districtId");
      final data = await _appRepositoryImpl.getFarmersStatistics(
          districtId: districtId!);

      if (data == null) {
        debugPrint("❌ FarmersStatisticsVM: getFarmersStatistics returned null");
        errorMessage = "Server bilan bog'liq xatolik yuzaga keldi.";
      } else {
        debugPrint("✅ FarmersStatisticsVM: Statistics data received");
        try {
          final jsonData = jsonDecode(data);
          if (jsonData is Map<String, dynamic> && jsonData['results'] != null) {
            final resultsJson = jsonEncode(jsonData['results']);
            statistics = farmerStatisticsModelFromJson(resultsJson);
            debugPrint("✅ FarmersStatisticsVM: Parsed ${statistics?.length ?? 0} farmers");
          } else {
            statistics = farmerStatisticsModelFromJson(data);
            debugPrint("✅ FarmersStatisticsVM: Parsed ${statistics?.length ?? 0} farmers (direct)");
          }
        } catch (jsonError) {
          debugPrint("❌ FarmersStatisticsVM: JSON Parsing Error: $jsonError");
          debugPrint("Raw data: $data");
          errorMessage = "Ma'lumotlarni qayta ishlashda xatolik yuz berdi.";
        }
      }
    } catch (e) {
      debugPrint("❌ FarmersStatisticsVM: Error fetching statistics: $e");
      errorMessage = "Internet bilan bog'liq muammo yuzaga keldi.";
    } finally {
      isLoading = false;
      notifyListeners();
      debugPrint("📊 FarmersStatisticsVM: fetchStatistics completed");
    }
  }

  Future<void> refresh() async {
    await fetchStatistics();
  }

  Future<void> searchByInn() async {
    final innText = searchInnController.text.trim();
    if (innText.isEmpty) {
      searchErrorMessage = "INN kiriting";
      searchResults = null;
      notifyListeners();
      return;
    }

    try {
      final inn = int.tryParse(innText);
      if (inn == null) {
        searchErrorMessage = "Noto'g'ri INN formati";
        searchResults = null;
        notifyListeners();
        return;
      }

      isSearching = true;
      searchErrorMessage = null;
      notifyListeners();

      final data = await _appRepositoryImpl.searchFarmers(inn: inn);

      if (data == null) {
        searchErrorMessage = "Server bilan bog'liq xatolik yuzaga keldi.";
        searchResults = null;
      } else {
        try {
          final model = farmerListModelFromJson(data);
          if (model.results != null && model.results!.isNotEmpty) {
            searchResults = model.results;
            searchErrorMessage = null;
          } else {
            searchErrorMessage = "Bunday INN bo'yicha fermer topilmadi";
            searchResults = null;
          }
        } catch (jsonError) {
          log("JSON Parsing Error: $jsonError");
          log("Raw data: $data");
          searchErrorMessage =
              "Ma'lumotlarni qayta ishlashda xatolik yuz berdi.";
          searchResults = null;
        }
      }
    } catch (e) {
      log("Error searching by INN: $e");
      searchErrorMessage = "Internet bilan bog'liq muammo yuzaga keldi.";
      searchResults = null;
    } finally {
      isSearching = false;
      notifyListeners();
    }
  }

  void onSearchChanged(String value) {
    notifyListeners();
  }

  void clearSearch() {
    searchInnController.clear();
    searchResults = null;
    searchErrorMessage = null;
    notifyListeners();
  }

  @override
  void dispose() {
    searchInnController.dispose();
    super.dispose();
  }
}
