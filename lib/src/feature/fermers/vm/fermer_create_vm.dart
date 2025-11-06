import 'package:flutter/material.dart';

import '../../../core/setting/setup.dart';
import '../../../data/model/farmer/create_fermer_model.dart';
import '../../../data/repository/app_repository_impl.dart';

class FermerCreateVm extends ChangeNotifier {
  String? errorMessage;

  final AppRepositoryImpl _appRepositoryImpl = AppRepositoryImpl();

  TextEditingController name = TextEditingController();
  TextEditingController founderName = TextEditingController();
  TextEditingController directorName = TextEditingController();
  TextEditingController phoneNumber = TextEditingController();
  TextEditingController address = TextEditingController();
  TextEditingController inn = TextEditingController();
  TextEditingController establishedYear = TextEditingController();

  bool isLoading = false;

  void _setLoading(bool value) {
    isLoading = value;
    notifyListeners();
  }

  String? checkValidate() {
    if (name.text.length < 3) {
      return "Tashkilot nomi uzunligi eng kamidan 3 ta belgidan ko'p bo'lishi kerak.";
    }

    if (founderName.text.length < 3) {
      return "Asoschi ismi uzunligi eng kamidan 3 ta belgidan ko'p bo'lishi kerak.";
    }

    if (directorName.text.length < 3) {
      return "Rahbar ismi uzunligi eng kamidan 3 ta belgidan ko'p bo'lishi kerak.";
    }

    if (phoneNumber.text.length != 9) {
      return "Telefon raqam formati 997777777 ya'ni 9 ta sondan iborat bo'lishi zarur.";
    }

    if (address.text.isEmpty) {
      return "Adres bo'sh bo'lmasligi zarur.";
    }

    if (inn.text.length < 3) {
      return "INN mos kelmadi.";
    }

    if (establishedYear.text.length != 4) {
      return "Tashkilot yaratilgan yili 4(xonali) bolishi zarur";
    }

    if (int.parse(establishedYear.text.trim()) > DateTime.now().year) {
      return "Tashkilot yaratilgan yili hozigi yilga ${DateTime.now().year} teng yoki undan kichkina b'lishi zarur.";
    }

    return null;
  }

  Future<bool> createFermer() async {
    _setLoading(true);
    try {
      // Farmer Model ni yaratish
      CreateFermerModel fermerModel = CreateFermerModel(
        name: name.text.trim(),
        founderName: founderName.text.trim(),
        directorName: directorName.text.trim(),
        phoneNumber: phoneNumber.text.trim(),
        address: address.text.trim(),
        inn: inn.text.trim(),
        establishedYear: int.parse(establishedYear.text.trim()),
        district: "$districtId",
      );

      // API so‘rovi yuborish
      final response = await _appRepositoryImpl.postNewFermer(fermer: fermerModel);
      // Agar status code 200 yoki 201 bo‘lsa
      if (response.statusCode == 200 || response.statusCode == 201) {
        errorMessage = "Yangi fermer qo'shildi";
        return true;
      }
      // Agar status code 400 bo‘lsa
      else if (response.statusCode == 400) {
        errorMessage = "Bunday INN Mavjud";
        return false;
      }
      // Boshqa holatlar (masalan, server xatosi)
      else {
        errorMessage = "Server ochib qolgan bo'lishi mumkin.";
        return false;
      }
    } catch (e) {
      errorMessage = "Internet bilan bog'liq muammo yuzaga keldi.";
      return false;
    } finally {
      _setLoading(false);
    }
  }

  @override
  void dispose() {
    super.dispose();
    name.dispose();
    directorName.dispose();
    address.dispose();
    phoneNumber.dispose();
    inn.dispose();
    establishedYear.dispose();
  }
}
