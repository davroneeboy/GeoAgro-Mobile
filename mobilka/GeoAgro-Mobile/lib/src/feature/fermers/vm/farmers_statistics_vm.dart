import 'dart:convert';
import 'dart:developer';

import 'package:flutter/material.dart';

import '../../../data/model/farmer/farmer_statistics_model.dart';
import '../../../data/model/farmer/farmer_list_model.dart';
import '../../../data/repository/app_repository_impl.dart';

class FarmersStatisticsVm extends ChangeNotifier {
  bool isLoading = true;
  String? errorMessage;
  List<FarmerData>? statistics;
  int? districtId;
  


  final TextEditingController searchInnController = TextEditingController();
  bool isSearching = false;
  List<FarmerModel>? searchResults;
  String? searchErrorMessage;

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
          if (jsonData is Map<String, dynamic> && jsonData['results'] != null) {
            final resultsJson = jsonEncode(jsonData['results']);
            statistics = farmerStatisticsModelFromJson(resultsJson);
          } else {
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
          searchErrorMessage = "Ma'lumotlarni qayta ishlashda xatolik yuz berdi.";
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
