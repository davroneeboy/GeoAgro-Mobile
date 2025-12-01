import 'package:flutter/material.dart';

import '../../../data/model/farmer/farmer_list_model.dart';
import '../../../data/repository/app_repository_impl.dart';

class FarmerSearchVm extends ChangeNotifier {
  bool isLoading = false;

  String? errorMessage;
  List<FarmerModel> farmersList = [];

  final AppRepositoryImpl _appRepositoryImpl = AppRepositoryImpl();

  TextEditingController textEditingController = TextEditingController();

  void _setLoading(bool value) {
    isLoading = value;
    notifyListeners();
  }

  Future<void> searchFarmers() async {
    farmersList = [];
    if (textEditingController.text.trim().isNotEmpty) {
      try {
        _setLoading(true);
        int inn = int.parse(textEditingController.text.trim());
        final data = await _appRepositoryImpl.searchFarmers(inn: inn);

        if (data != null) {
          try {
            final model = farmerListModelFromJson(data);

            if (model.results!.isNotEmpty) {
              farmersList = model.results!;
            }

            errorMessage = "Bunday inn boyicha farmer topilmadi";
          } catch (e) {
            errorMessage = "Malumotlarni qayta ishlashda muammo yuzaga keldi";
          }
        }

        errorMessage = 'Servar bilan muammo yuzaga keldi';
      } catch (e) {
        errorMessage = "Internet bilan aloqa yaxshi emas";
      } finally {
        _setLoading(false);
      }
    }

    errorMessage = "Inn kiriting! Inn bo'sh bolmasligi zarur";
    notifyListeners();
    return;
  }

  @override
  void dispose() {
    super.dispose();
    textEditingController.dispose();
  }
}
