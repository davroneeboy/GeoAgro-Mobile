import 'package:flutter/material.dart';
import '../../../data/model/farmer/farmer_plantation_model.dart';
import '../../../data/repository/app_repository_impl.dart';
import 'dart:convert';

class FarmerPlantationsVm extends ChangeNotifier {
  final AppRepositoryImpl _appRepositoryImpl = AppRepositoryImpl();
  
  List<FarmerPlantation> _plantations = [];
  bool _isLoading = false;
  String? _errorMessage;
  int _farmerInn = 0;

  List<FarmerPlantation> get plantations => _plantations;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  int get farmerInn => _farmerInn;

  Future<void> getFarmerPlantations({required int farmerInn}) async {
    _farmerInn = farmerInn;
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    debugPrint('FarmerPlantationsVm: Loading plantations for farmer INN: $farmerInn');

    try {
      final response = await _appRepositoryImpl.getFarmerPlantations(farmerInn: farmerInn);
      
      debugPrint('FarmerPlantationsVm: API response received: ${response != null ? 'success' : 'null'}');
      
      if (response != null) {
        final data = jsonDecode(response);
        debugPrint('FarmerPlantationsVm: Parsed data: $data');
        final farmerPlantationResponse = FarmerPlantationResponse.fromJson(data);
        _plantations = farmerPlantationResponse.results;
        debugPrint('FarmerPlantationsVm: Loaded ${_plantations.length} plantations');
      } else {
        _errorMessage = "Ma'lumotlar yuklanmadi";
        debugPrint('FarmerPlantationsVm: No data received from API');
      }
    } catch (e) {
      _errorMessage = "Xatolik yuz berdi: ${e.toString()}";
      debugPrint('FarmerPlantationsVm: Error loading plantations: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearPlantations() {
    _plantations.clear();
    _errorMessage = null;
    notifyListeners();
  }
}
