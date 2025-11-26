// import 'dart:developer';

// import 'package:flutter/material.dart';
// import 'package:agro_employee_public/src/data/model/farmer/farmer_list_model.dart';

// // import '../../../data/model/farmer/fermer_model.dart';
// import '../../../data/repository/app_repository_impl.dart';

// class FermerVm extends ChangeNotifier {
//   bool isLoading = true;
//   bool canLoad = true;
//   bool isFetchingMore = false;

//   int currentPage = 1;
//   String? errorMessage;
//   List<FermerModel> fermersList = [];

//   final AppRepositoryImpl _appRepositoryImpl = AppRepositoryImpl();

//   FermerVm() {
//     getFermers();
//   }

//   void _setLoading(bool value) {
//     isLoading = value;
//     notifyListeners();
//   }

//   void _setFetchingMore(bool value) {
//     isFetchingMore = value;
//     notifyListeners();
//   }

//   Future<void> getFermers({bool isLoadMore = false}) async {
//     if (!canLoad || (isLoadMore && isFetchingMore)) return; // Agar yuklash mumkin bo'lmasa, qaytib chiq
//     errorMessage = null;

//     if (!isLoadMore) {
//       currentPage = 1; // Sahifa raqamini boshidan boshlash
//       canLoad = true; // Qaytadan yuklash imkonini yoqish
//       fermersList.clear(); // Roʻyxatni tozalash
//       _setLoading(true);
//     } else {
//       _setFetchingMore(true);
//     }

//     try {
//       final data = await _appRepositoryImpl.getFermersList(page: currentPage);

//       if (data == null) {
//         errorMessage = "Server bilan bog'liq xatolik yuzaga keldi.";
//         canLoad = true;
//       } else {
//         try {
//           final model = farmerListModelFromJson(data);
//           fermersList.addAll(model.results ?? []);
//           currentPage++;
//           canLoad = model.next != null; // Agar `next` mavjud bo'lmasa, yuklashni to'xtatish
//         } catch (jsonError) {
//           log("Json Parsing Error $jsonError");
//           errorMessage = "Ma'lumotlarni qayta ishlashda xatolik yuz berdi.";
//           canLoad = false;
//         }
//       }
//     } catch (e) {
//       errorMessage = "Internet bilan bog'liq muammo yuzaga keldi.";
//       canLoad = true;
//     } finally {
//       if (isLoadMore) {
//         _setFetchingMore(false);
//       } else {
//         _setLoading(false);
//       }
//     }
//   }
// }

import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:agro_employee_public/src/data/model/farmer/farmer_list_model.dart';

import '../../../data/repository/app_repository_impl.dart';

class FermerVm extends ChangeNotifier {
  bool isLoading = true; // Umumiy yuklanish holati
  bool canLoad = true; // Qo'shimcha yuklashga ruxsat flagi
  bool isFetchingMore = false; // Cheksiz skroll uchun yuklanish flagi

  int currentPage = 1; // Joriy sahifa
  String? errorMessage; // Xatolik xabari
  List<FarmerModel> fermersList = []; // Fermerlar ro'yxati

  final AppRepositoryImpl _appRepositoryImpl = AppRepositoryImpl();

  FermerVm() {
    getFermers();
  }

  void _setLoading(bool value) {
    isLoading = value;
    notifyListeners();
  }

  void _setFetchingMore(bool value) {
    isFetchingMore = value;
    notifyListeners();
  }

  Future<void> getFermers({bool isLoadMore = false}) async {
    if ((!canLoad && isLoadMore) || (isLoadMore && isFetchingMore)) return; // Yuklash mumkinligini tekshirish
    errorMessage = null;

    if (!isLoadMore) {
      currentPage = 1; // Sahifani boshidan boshlash
      canLoad = true; // Keyingi yuklash uchun ruxsat berish
      fermersList.clear(); // Ro'yxatni tozalash
      _setLoading(true);
    } else {
      _setFetchingMore(true);
    }

    try {
      // Ma'lumotlarni olish
      final data = await _appRepositoryImpl.getFermersList(page: currentPage);

      if (data == null) {
        errorMessage = "Server bilan bog'liq xatolik yuzaga keldi.";
        canLoad = false; // Qo'shimcha yuklashni to'xtatish
      } else {
        try {
          final model = farmerListModelFromJson(data);

          if (model.results != null) {
            fermersList.addAll(model.results!); // Ro'yxatni to'ldirish
            currentPage++; // Sahifa raqamini oshirish
            canLoad = model.next != null; // `next` mavjudligini tekshirish
          } else {
            canLoad = false; // Ma'lumot yo'q bo'lsa, yuklashni to'xtatish
          }
        } catch (jsonError) {
          log("JSON Parsing Error: $jsonError");
          errorMessage = "Ma'lumotlarni qayta ishlashda xatolik yuz berdi.";
          canLoad = false;
        }
      }
    } catch (e) {
      errorMessage = "Internet bilan bog'liq muammo yuzaga keldi.";
      canLoad = false; // Qo'shimcha yuklashni to'xtatish
    } finally {
      if (isLoadMore) {
        _setFetchingMore(false); // Qo'shimcha yuklanishni o'chirish
      } else {
        _setLoading(false); // Umumiy yuklanishni o'chirish
      }
    }
  }
}
