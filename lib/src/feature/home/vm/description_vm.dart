// import 'dart:developer';

// import 'package:agro_employee_public/src/data/model/plantation/plantation_model.dart';
// import 'package:flutter/material.dart';

// import '../../../data/repository/app_repository_impl.dart';

// class DescriptionVm extends ChangeNotifier {
//   bool isLoading = true;
//   String? errorMessage;
//   final AppRepositoryImpl _appRepositoryImpl = AppRepositoryImpl();

//   late PlantationModel plantationModel;

//   Future<void> getPlantationDescription(int id) async {
//     errorMessage = null;
//     _setLoading(true);

//     try {
//       final data = await _appRepositoryImpl.getPlantationDetail(id: id);
//       if (data == null) {
//         errorMessage = "Server bilan bog'liq xatolik yuzaga keldi.";
//       } else {
//         try {
//           plantationModel = plantationModelFromJson(data);
//           // log(data.toString());
//         } catch (jsonError) {
//           log("JSON Parsing Error: $jsonError");
//           errorMessage = "Ma'lumotni qayta ishlashda xatolik yuzaga keldi.";
//         }
//       }
//     } catch (networkError) {
//       log("Network Error: $networkError");
//       errorMessage = "Internet bilan bog'liq muammo yuzaga keldi.";
//     } finally {
//       _setLoading(false);
//     }
//   }

//   void _setLoading(bool loading) {
//     isLoading = loading;
//     notifyListeners();
//   }
// }
