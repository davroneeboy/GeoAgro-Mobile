import 'dart:convert';
import 'dart:developer' as p;
import 'dart:io';

import 'package:agro_employee_public/src/core/setting/setup.dart';
import 'package:agro_employee_public/src/data/model/fruits/fruit_model.dart';
import 'package:agro_employee_public/src/data/model/fruits/fruit_rootstocks_model.dart';
import 'package:agro_employee_public/src/data/model/fruits/fruit_verity_modell.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:l/l.dart';

import '../../../data/model/plantation/new_plantation_model.dart';
import '../../../data/repository/app_repository_impl.dart';
import '../../../core/storage/app_storage.dart';
import '../../../core/utils/sanitization_utils.dart';
import '../../../core/utils/utils.dart';
import '../../../../design_system/theme/colors.dart' as DesignColors;

final detailVM = ChangeNotifierProvider.autoDispose<DetailVM>((ref) {
  return DetailVM();
});

class DetailVM extends ChangeNotifier {
  bool postLoading = false;
  final AppRepositoryImpl _appRepositoryImpl = AppRepositoryImpl();
  
  // Вспомогательная функция для форматирования чисел без .0
  String formatNumber(dynamic value) {
    if (value == null) return "0";
    if (value is double) {
      return value == value.toInt().toDouble() ? value.toInt().toString() : value.toString();
    }
    if (value is int) {
      return value.toString();
    }
    return value.toString();
  }
  
  String _norm(String v) => v.replaceAll(',', '.');
  String _onlyDigitsDot(String v) => v.replaceAll(RegExp(r'[^0-9.]'), '');
  String _onlyAlphaNum(String v) => v.replaceAll(RegExp(r'[^0-9a-zA-Z]'), '');

  TextEditingController notUsableArea = TextEditingController();
  TextEditingController emptyArea = TextEditingController();
  TextEditingController konturInputController = TextEditingController();
  TextEditingController tomchiSystemsArea = TextEditingController();
  TextEditingController tomchiSystemsCount = TextEditingController();
  TextEditingController investmentMahhalliyAmount = TextEditingController();
  TextEditingController investmentXorijiyAmount = TextEditingController();
  TextEditingController subsidiyaContract = TextEditingController();
  TextEditingController subsidiyaAmount = TextEditingController();
  TextEditingController trellisTemirInstalledArea = TextEditingController();
  TextEditingController trellisTemirCount = TextEditingController();
  TextEditingController trellisBetonInstalledArea = TextEditingController();
  TextEditingController trellisBetonCount = TextEditingController();
  TextEditingController reservoirsQoplamaliVolume = TextEditingController();
  TextEditingController reservoirsBetonliVolume = TextEditingController();
  
  // Списки для хранения нескольких резервуаров каждого типа
  final List<TextEditingController> reservoirsBetonliVolumes = [];
  final List<TextEditingController> reservoirsQoplamaliVolumes = [];
  
  // Инициализация: добавляем один контроллер по умолчанию
  void initializeReservoirs() {
    if (reservoirsBetonliVolumes.isEmpty) {
      reservoirsBetonliVolumes.add(reservoirsBetonliVolume);
    }
    if (reservoirsQoplamaliVolumes.isEmpty) {
      reservoirsQoplamaliVolumes.add(reservoirsQoplamaliVolume);
    }
  }
  
  // Методы для управления списками резервуаров
  void addBetonReservoir() {
    reservoirsBetonliVolumes.add(TextEditingController());
    notifyListeners();
  }
  
  void removeBetonReservoir(int index) {
    // Всегда оставляем хотя бы один контроллер
    if (index >= 0 && index < reservoirsBetonliVolumes.length && reservoirsBetonliVolumes.length > 1) {
      final controller = reservoirsBetonliVolumes[index];
      // Если это основной контроллер, заменяем его на следующий
      if (controller == reservoirsBetonliVolume) {
        if (reservoirsBetonliVolumes.length > 1) {
          final nextController = reservoirsBetonliVolumes[1];
          // Копируем значение из следующего контроллера
          reservoirsBetonliVolume.text = nextController.text;
          // Удаляем следующий контроллер вместо основного
          nextController.dispose();
          reservoirsBetonliVolumes.removeAt(1);
        }
      } else {
        // Удаляем дополнительный контроллер
        controller.dispose();
        reservoirsBetonliVolumes.removeAt(index);
      }
      notifyListeners();
    }
  }
  
  void addQoplamaliReservoir() {
    reservoirsQoplamaliVolumes.add(TextEditingController());
    notifyListeners();
  }
  
  void removeQoplamaliReservoir(int index) {
    // Всегда оставляем хотя бы один контроллер
    if (index >= 0 && index < reservoirsQoplamaliVolumes.length && reservoirsQoplamaliVolumes.length > 1) {
      final controller = reservoirsQoplamaliVolumes[index];
      // Если это основной контроллер, заменяем его на следующий
      if (controller == reservoirsQoplamaliVolume) {
        if (reservoirsQoplamaliVolumes.length > 1) {
          final nextController = reservoirsQoplamaliVolumes[1];
          // Копируем значение из следующего контроллера
          reservoirsQoplamaliVolume.text = nextController.text;
          // Удаляем следующий контроллер вместо основного
          nextController.dispose();
          reservoirsQoplamaliVolumes.removeAt(1);
        }
      } else {
        // Удаляем дополнительный контроллер
        controller.dispose();
        reservoirsQoplamaliVolumes.removeAt(index);
      }
      notifyListeners();
    }
  }
  
  TextEditingController cultivatedArea = TextEditingController();
  TextEditingController sxema1 = TextEditingController();
  TextEditingController sxema2 = TextEditingController();
  double unumdorlikValue = 50;
  DateTime? _selectedDate;
  DateTime? _selectedDate2;
  DateTime? _selectedDate3;
  List<FruitModel> fruitList = [];
  List<FruitVarietyModel> fruitVerityList = [];
  List<FruitRootstocksModel> fruitRootList = [];
  FruitModel? selectedFruit;
  FruitVarietyModel? selectedFruitVariety;
  FruitRootstocksModel? selectedFruitRoot;
  final Map<int, File?> _imageFiles = {};
  final ImagePicker _picker = ImagePicker();
  bool _isSpecialUser = false; // Флаг специального пользователя
  bool get isSpecialUser => _isSpecialUser; // Геттер для проверки специального пользователя
  final switchTomchi = StateProvider<bool>((ref) => false);
  final switchFenced = StateProvider<bool>((ref) => false);
  final switchIsFertile = StateProvider<bool>((ref) => false);
  final switchSubsidiya = StateProvider<bool>((ref) => false);
  final switchEfficiency = StateProvider<bool>((ref) => false);
  final switchTrellis = StateProvider<bool>((ref) => false);
  final switchTrellisBeton = StateProvider<bool>((ref) => false);
  final switchTrellisTemir = StateProvider<bool>((ref) => false);
  final switchReservoir = StateProvider<bool>((ref) => false);
  final switchReservoirsBeton = StateProvider<bool>((ref) => false);
  final switchReservoirsQoplamali = StateProvider<bool>((ref) => false);
  final switchInvestmentXorjiy = StateProvider<bool>((ref) => false);
  final switchInvestmentMahhalliy = StateProvider<bool>((ref) => false);
  final switchIqtisodiy = StateProvider<bool>((ref) => false);
  TextEditingController economicInefficientAreaController = TextEditingController();
  DateTime? get selectedDate => _selectedDate;
  DateTime? get selectedDate2 => _selectedDate2;
  DateTime? get selectedDate3 => _selectedDate3;
  File? getImageFile(int cardId) => _imageFiles[cardId];
  
  /// Удаляет изображение по индексу
  void removeImage(int cardId) {
    _imageFiles.remove(cardId);
    notifyListeners();
  }
  
  bool isLoading = false;
  bool isLoading2 = false;
  List<FruitArea> selectedDetails = [];
  List<FruitArea> selectedFruitVerityRoot = [];
  List<Subsidy> selectedSubsidy = [];
  List<String> konturNumbers = [];
  int farmerId = 0;
  int direction = 0;
  List<Coordinate> coordinates = [];
  double? polygonArea; // Площадь полигона в гектарах
  Map<String, double> userLocation = {
    'latitude': 41.311081,
    'longitude': 69.240562,
  }; // Текущее местоположение пользователя для user_location (всегда установлено)
  TextEditingController tonnaController = TextEditingController();
  TextEditingController commentsController = TextEditingController();

  String? errorMessage;
  Future<bool> createPt(WidgetRef ref) async {
    // Защита от множественных вызовов
    if (postLoading) {
      debugPrint('createPt: Already in progress, ignoring duplicate call');
      return false;
    }
    
    postLoading = true;
    notifyListeners();
    late String tomchiArea;
    late String tomchiCount;
    late String investmentMahhalliy;
    late String investmentXorjiy;
    List<Subsidy> mockSubsidies = [];
    List<Trellis> mockTrellises = [];
    List<Reservoir> mockReservoir = [];
    List<Investment> mockInvestments = [];
    List<FruitArea> mockFruitArea = [];
    final bool isTomchilab = ref.watch(switchTomchi);
    final bool isUnumdormi = ref.watch(switchIsFertile);
    final bool isInvestmentMahhalliy = ref.watch(switchInvestmentMahhalliy);
    final bool isInvestmentXorijiy = ref.watch(switchInvestmentXorjiy);
    final bool isSubsidiya = ref.watch(switchSubsidiya);
    final bool isSubsidiyaSamaradormi = ref.watch(switchEfficiency);
    final bool isShpaller = ref.watch(switchTrellis);
    final bool isShpallerTemir = ref.watch(switchTrellisTemir);
    final bool isShpallerBeton = ref.watch(switchTrellisBeton);
    final bool hovuz = ref.watch(switchReservoir);
    final bool hovuzBeton = ref.watch(switchReservoirsBeton);
    final bool hovuzQoplamali = ref.watch(switchReservoirsQoplamali);

    // Tomchi tizimi
    if (isTomchilab) {
      tomchiArea = tomchiSystemsArea.text.trim();
      tomchiCount = tomchiSystemsCount.text.trim();
    } else {
      tomchiArea = "0";
      tomchiCount = "0";
    }
    // Investitsiya qiymatlari: butun sonlar, maskani olib tashlaymiz
    String digitsOnly(String v) => v.replaceAll(RegExp(r'[^0-9]'), '');
    investmentMahhalliy =
        isInvestmentMahhalliy ? digitsOnly(investmentMahhalliyAmount.text.trim()) : "0";
    investmentXorjiy =
        isInvestmentXorijiy ? digitsOnly(investmentXorijiyAmount.text.trim()) : "0";
    mockInvestments = [
      if (isInvestmentMahhalliy)
        Investment(
          investType: "1",
          investmentAmount: (int.tryParse(investmentMahhalliy) ?? 0).toDouble(),
        ),
      if (isInvestmentXorijiy)
        Investment(
          investType: "2",
          investmentAmount: (int.tryParse(investmentXorjiy) ?? 0).toDouble(),
        ),
    ];
    // Subsidiya ro'yxati
    if (isSubsidiya) {
      mockSubsidies = selectedSubsidy.map((dateil) {
        return Subsidy(
          year: dateil.year,
          contractNumber: dateil.contractNumber,
          direction: dateil.direction,
          amount: dateil.amount,
          efficiency: isSubsidiyaSamaradormi,
        );
      }).toList();
    }

    // Shpaller logikasi
    if (isShpaller) {
      if (isShpallerTemir) {
        mockTrellises.add(
          Trellis(
            trellisType: 2,
            trellisCount: int.tryParse(trellisTemirCount.text.trim()) ?? 0,
            trellisInstalledArea:
                double.tryParse(trellisTemirInstalledArea.text.trim()) ?? 0.0,
          ),
        );
      }
      if (isShpallerBeton) {
        mockTrellises.add(
          Trellis(
            trellisType: 1,
            trellisCount: int.tryParse(trellisBetonCount.text.trim()) ?? 0,
            trellisInstalledArea:
                double.tryParse(trellisBetonInstalledArea.text.trim()) ?? 0.0,
          ),
        );
      }
    }
    // Hovuz logikasi - используем списки для поддержки нескольких резервуаров
    if (hovuz) {
      if (hovuzBeton) {
        // Инициализируем список, если он пуст
        if (reservoirsBetonliVolumes.isEmpty) {
          initializeReservoirs();
        }
        // Добавляем все бетонные резервуары
        for (final controller in reservoirsBetonliVolumes) {
          final volume = int.tryParse(controller.text.trim()) ?? 0;
          if (volume > 0) {
            mockReservoir.add(Reservoir(
              reservoirType: "1",
              reservoirVolume: volume,
            ));
          }
        }
      }
      if (hovuzQoplamali) {
        // Инициализируем список, если он пуст
        if (reservoirsQoplamaliVolumes.isEmpty) {
          initializeReservoirs();
        }
        // Добавляем все покрытые резервуары
        for (final controller in reservoirsQoplamaliVolumes) {
          final volume = int.tryParse(controller.text.trim()) ?? 0;
          if (volume > 0) {
            mockReservoir.add(
              Reservoir(
                reservoirType: "2",
                reservoirVolume: volume,
              ),
            );
          }
        }
      }
    }

    mockFruitArea = selectedDetails.map((detail) {
      return FruitArea(
        fruit: detail.fruit,
        variety: detail.variety,
        rootstock: detail.rootstock,
        plantedYear: detail.plantedYear,
        area: detail.area,
        schema: detail.schema,
        weight: detail.weight,
        fenced: detail.fenced,
        iqtisodiysamarasiz: detail.iqtisodiysamarasiz,
        economicInefficientArea: detail.economicInefficientArea,
      );
    }).toList();

    try {
       var mockGarden = Garden(
        gardenEstablishedYear: "${_selectedDate?.year.toString() ?? 0}",
        district: "$districtId",
        farmer: "$farmerId",
        emptyArea: _onlyDigitsDot(_norm(emptyArea.text.trim())),
        irrigationArea: tomchiArea,
        fertilityScore: unumdorlikValue.toString(),
        landType: selectedYerType.toString(),
        notUsableArea: _onlyDigitsDot(_norm(notUsableArea.text.trim())),
        irrigationSystemsCount: tomchiCount,
        isFertile: isUnumdormi,
        types: Types(
          plantationType: selectedPlantationType,
          typeChoice: selectedPlantationType == 1
              ? selectedBogType
              : selectedPlantationType == 2
                  ? selectedUzumType
                  : selectedPlantationType == 3
                      ? selectedIssiqxonaType
                      : null,
          subtype: selectedPlantationType == 1 ? selectedBogSubtype : null,
        ),
        investments: mockInvestments,
        coordinates: coordinates,
        subsidies: mockSubsidies,
        trellises: mockTrellises,
        reservoirs: mockReservoir,
        fruitAreas: mockFruitArea,
      );
      final jsonData = mockGarden.toJson();
      // Send kontur numbers as-is (alphanumeric), already sanitized by input formatter
      jsonData['kontur_number'] = konturNumbers;
      // Убеждаемся, что comments не отправляется в теле запроса создания плантации
      // Комментарий будет отправлен отдельным запросом после создания
      jsonData.remove('comments');
      jsonData.remove('moderation_comment');
      // Добавляем user_location (всегда валиден, так как передается из карты)
      p.log("🔍 DetailVM createPt: START - userLocation value: $userLocation");
      p.log("🔍 DetailVM createPt: userLocation type: ${userLocation.runtimeType}");
      p.log("🔍 DetailVM createPt: userLocation keys: ${userLocation.keys.toList()}");
      p.log("🔍 DetailVM createPt: userLocation['latitude']: ${userLocation['latitude']}");
      p.log("🔍 DetailVM createPt: userLocation['longitude']: ${userLocation['longitude']}");
      try {
        final lat = (userLocation['latitude'] as num).toDouble();
        final lng = (userLocation['longitude'] as num).toDouble();
        p.log("🔍 DetailVM createPt: Parsed lat: $lat, lng: $lng");
        
        p.log("🔍 DetailVM: Parsed coordinates - lat: $lat, lng: $lng");
        
        // Валидация координат
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          // Отправляем user_location как массив с одним элементом, согласно документации API
          // Формат: user_location[0][latitude] и user_location[0][longitude]
          jsonData['user_location'] = [
            {
              'latitude': lat,
              'longitude': lng,
            }
          ];
          p.log("✅ DetailVM: user_location added as array: ${jsonData['user_location']}");
          p.log("✅ DetailVM: user_location in jsonData type: ${jsonData['user_location'].runtimeType}");
        } else {
          p.log("❌ DetailVM: Invalid coordinates: lat=$lat, lng=$lng, not adding user_location");
          p.log("❌ DetailVM: Validation failed - lat range: ${lat >= -90 && lat <= 90}, lng range: ${lng >= -180 && lng <= 180}");
        }
      } catch (e, stackTrace) {
        p.log("❌ DetailVM: Error parsing user_location: $e");
        p.log("❌ DetailVM: Stack trace: $stackTrace");
      }
      List<String> images = [];
      for (var mapEntry in _imageFiles.entries) {
        images.add(mapEntry.value!.path);
      }
      p.log("📦 DetailVM: Full JSON body before sending:");
      p.log("📦 DetailVM: ${jsonEncode(jsonData)}");
      p.log("📦 DetailVM: user_location in jsonData: ${jsonData['user_location']}");
      if (jsonData['user_location'] != null) {
        p.log("📦 DetailVM: user_location type: ${jsonData['user_location'].runtimeType}");
      }
      final response = await _appRepositoryImpl.postCreatePlantationWithImages(
          body: jsonData, image: images);
      if (response.statusCode == 200 || response.statusCode == 201) {
        // Если был введен комментарий, добавляем его после создания плантации
        final rawCommentsText = commentsController.text.trim();
        if (rawCommentsText.isNotEmpty) {
          // Санитизация комментария для защиты от XSS
          final commentsText = SanitizationUtils.sanitizeComment(rawCommentsText);
          try {
            // Получаем ID созданной плантации из ответа
            dynamic responseData = response.data;
            int? plantationId;
            
            // Если responseData - строка, пытаемся распарсить её как JSON
            if (responseData is String) {
              try {
                responseData = jsonDecode(responseData);
              } catch (e) {
                p.log("⚠️ DetailVM: Failed to parse responseData as JSON: $e");
              }
            }
            
            if (responseData is Map<String, dynamic>) {
              plantationId = responseData['id'] as int?;
            }
            
            if (plantationId != null) {
              p.log("✅ DetailVM: Extracted plantation ID: $plantationId, adding comment...");
              p.log("📤 DetailVM: Sending comment with isModeration: false");
              p.log("📤 DetailVM: Comment text: $commentsText");
              final commentResponse = await _appRepositoryImpl.addPlantationComment(
                plantationId: plantationId,
                body: commentsText,
                isModeration: false, // Явно указываем, что это обычный комментарий при создании
              );
              p.log("📥 DetailVM: Comment response status: ${commentResponse.statusCode}");
              p.log("📥 DetailVM: Comment response data: ${commentResponse.data}");
              if (commentResponse.statusCode != 200 && commentResponse.statusCode != 201) {
                p.log("⚠️ DetailVM: Failed to add comment (status: ${commentResponse.statusCode}), but plantation was created");
              } else {
                p.log("✅ DetailVM: Comment added successfully");
                // Проверяем, не дублируется ли комментарий в moderation_comment
                if (commentResponse.data is Map<String, dynamic>) {
                  final responseData = commentResponse.data as Map<String, dynamic>;
                  if (responseData.containsKey('moderation_comment')) {
                    final modComments = responseData['moderation_comment'];
                    if (modComments is List && modComments.isNotEmpty) {
                      p.log("⚠️ DetailVM: WARNING - Comment was duplicated in moderation_comment by server!");
                      p.log("⚠️ DetailVM: This is a server-side issue - server automatically syncs comments to moderation_comment");
                    }
                  }
                }
              }
            } else {
              p.log("⚠️ DetailVM: Could not extract plantation ID from response to add comment. Response data: $responseData");
            }
          } catch (e, stackTrace) {
            p.log("⚠️ DetailVM: Error adding comment: $e");
            p.log("⚠️ DetailVM: Stack trace: $stackTrace");
            // Не прерываем процесс, плантация уже создана
          }
        }
        errorMessage = 'Muvaffaqiyatli yaratildi';
        return true;
      } else if (response.statusCode == 400) {
        dynamic responseData = response.data;
        p.log("Response Data type: ${responseData.runtimeType}");
        p.log("Response Data: $responseData");
        
        // Если responseData - строка, пытаемся распарсить её как JSON
        if (responseData is String) {
          try {
            final decoded = jsonDecode(responseData);
            responseData = decoded;
            p.log("Parsed responseData type: ${responseData.runtimeType}");
            p.log("Parsed responseData: $responseData");
          } catch (e) {
            p.log("Failed to parse responseData as JSON: $e");
            // Если не удалось распарсить, используем строку как сообщение об ошибке
            errorMessage = responseData;
            return false;
          }
        }
        
        // Пытаемся извлечь детальное сообщение об ошибке
        String? detailedError;
        
        // Безопасная проверка и приведение к Map
        Map<String, dynamic>? errorMap;
        if (responseData is Map) {
          try {
            errorMap = Map<String, dynamic>.from(responseData);
          } catch (e) {
            p.log("Failed to convert responseData to Map: $e");
            errorMap = null;
          }
        }
        
        if (errorMap != null) {
          // Проверяем различные форматы ошибок от сервера
          if (errorMap['subsidies'] != null) {
            errorMessage = "Subsidiya raqamlari notog`ri yoki oldin ro'yxatdan o'tgan";
            return false;
          } else if (errorMap['message'] != null) {
            detailedError = errorMap['message'].toString();
          } else if (errorMap['error'] != null) {
            final errorValue = errorMap['error'];
            if (errorValue is String) {
              detailedError = errorValue;
            } else if (errorValue is Map) {
              try {
                final nestedErrorMap = Map<String, dynamic>.from(errorValue);
                if (nestedErrorMap['non_field_errors'] != null) {
                  final errors = nestedErrorMap['non_field_errors'];
                  if (errors is List && errors.isNotEmpty) {
                    detailedError = errors[0].toString();
                  }
                } else if (nestedErrorMap['message'] != null) {
                  detailedError = nestedErrorMap['message'].toString();
                }
              } catch (e) {
                p.log("Failed to process nested error map: $e");
              }
            }
          } else if (errorMap['non_field_errors'] != null) {
            final errors = errorMap['non_field_errors'];
            if (errors is List && errors.isNotEmpty) {
              detailedError = errors[0].toString();
            }
          } else {
            // Ищем первое текстовое сообщение об ошибке в любом поле
            for (var entry in errorMap.entries) {
              if (entry.value is String && entry.value.toString().isNotEmpty) {
                detailedError = entry.value.toString();
                break;
              } else if (entry.value is List && (entry.value as List).isNotEmpty) {
                detailedError = (entry.value as List)[0].toString();
                break;
              }
            }
          }
        } else if (responseData is String) {
          // Если это просто строка, используем её как сообщение об ошибке
          detailedError = responseData;
        }
        
        errorMessage = detailedError ?? "Yaratishda xatolik yuz berdi";
        p.log("Error message: $errorMessage");
        return false;
      } else {
        errorMessage = "Server bilan bog'liq muammo yuz berdi";
        p.log("Something went wrong: ${response.statusCode}");
        return false;
      }
    } catch (e) {
      errorMessage = "Internet bilan bog'liq muammo yuzaga keldi.";
      p.log("Error: ${e.toString()}");
      return false;
    } finally {
      postLoading = false;
      notifyListeners();
    }
  }

  void addKonturNumber() {
    final value = _onlyAlphaNum(konturInputController.text.trim());
    if (value.isEmpty) return;
    konturNumbers.add(value);
    konturInputController.clear();
    notifyListeners();
  }

  void removeKonturAt(int index) {
    if (index < 0 || index >= konturNumbers.length) return;
    konturNumbers.removeAt(index);
    notifyListeners();
  }

  String? validateFields(WidgetRef ref) {
    final isTomchiEnabled = ref.watch(switchTomchi);
    final isSubsidiya = ref.watch(switchSubsidiya);
    final isShpaller = ref.watch(switchTrellis);
    final isShpallerTemir = ref.watch(switchTrellisTemir);
    final isShpallerBeton = ref.watch(switchTrellisBeton);
    final isReservoir = ref.watch(switchReservoir);
    final isReservoirBeton = ref.watch(switchReservoirsBeton);
    final isReservoirQoplamali = ref.watch(switchReservoirsQoplamali);
    final isInvitsitsiyaXorijiy = ref.watch(switchInvestmentXorjiy);
    final isInvitsitsiyaMaxalliy = ref.watch(switchInvestmentMahhalliy);

    if (_selectedDate == null) {
      return 'Vaqt tanlanmagan, vaqtni to`ldiring';
    }
    
    if (selectedPlantationType == null) {
      return 'Plantatsiya turi tanlanmagan, tanlovni bajaring';
    }
    if (selectedPlantationType == 1) {
      if (selectedBogType == null) {
        return 'Bog turi tanlanmagan, tanlovni bajaring';
      }
    }
    if (selectedPlantationType == 2) {
      if (selectedUzumType == null) {
        return 'Uzum turi tanlanmagan, tanlovni bajaring';
      }
    }
    if (selectedPlantationType == 3) {
      if (selectedIssiqxonaType == null) {
        return 'Issiqxona turi tanlanmagan, tanlovni bajaring';
      }
    }
    if (selectedYerType == null) {
      return 'Yer turi tanlanmagan, tanlovni bajaring';
    }

    if (notUsableArea.text.trim().isEmpty ||
        double.tryParse(_norm(notUsableArea.text.trim())) == null) {
      return 'Foydalanishga yaroqsiz yerlar noto‘g‘ri yoki bo‘sh, to‘ldiring';
    }
    if ((double.tryParse(_norm(notUsableArea.text.trim())) ?? 0) < 0) {
      return 'Foydalanishga yaroqsiz maydon manfiy bo\'lishi mumkin emas';
    }

    if (emptyArea.text.trim().isEmpty ||
        double.tryParse(_norm(emptyArea.text.trim())) == null) {
      return "Ochiq maydon noto'g'ri yoki bo'sh, to'ldiring";
    }
    if ((double.tryParse(_norm(emptyArea.text.trim())) ?? 0) < 0) {
      return "Ochiq maydon manfiy bo'lishi mumkin emas";
    }
    // Kontur raqami majburiy: kamida bitta qiymat (harflar/raqamlar) bo'lishi shart
    final konturForValidation = konturNumbers
        .map((e) => e.trim())
        .where((e) => e.isNotEmpty)
        .toList();
    if (konturForValidation.isEmpty) {
      return 'Kontur raqami kamida bittasi kiritilishi shart';
    }
    if (isInvitsitsiyaXorijiy) {
      if (investmentXorijiyAmount.text.trim().isEmpty ||
          int.tryParse(investmentXorijiyAmount.text.trim().replaceAll(RegExp(r'[^0-9]'), '')) == null) {
        return 'Xorjiy ajratilgan investitsiyani noto‘g‘ri yoki bo‘sh, to‘ldiring';
      }
    }
    if (isInvitsitsiyaMaxalliy) {
      if (investmentMahhalliyAmount.text.trim().isEmpty ||
          int.tryParse(investmentMahhalliyAmount.text.trim().replaceAll(RegExp(r'[^0-9]'), '')) == null) {
        return 'Maxalliy ajratilgan investitsiyani noto‘g‘ri yoki bo‘sh, to‘ldiring';
      }
    }
    if (!isInvitsitsiyaXorijiy && !isInvitsitsiyaMaxalliy) {
      return 'Investitsiya turini tanlash majburiy';
    }
    if (isTomchiEnabled) {
      if (tomchiSystemsCount.text.trim().isEmpty ||
          int.tryParse(tomchiSystemsCount.text.trim()) == null &&
              tomchiSystemsArea.text.trim().isEmpty ||
          double.tryParse(tomchiSystemsArea.text.trim()) == null) {
        return 'Tomchilab sug‘orish tizimlari soni yoki maydoni noto‘g‘ri yoki bo‘sh, to‘ldiring';
      }
    }

    if (isSubsidiya) {
      if (selectedSubsidy.isEmpty) {
        return 'Subsidiya ma`lumotlari noto‘g‘ri yoki bo‘sh, to‘ldiring';
      }
    }
    if (isShpaller) {
      if (isShpallerTemir) {
        if (trellisTemirInstalledArea.text.trim().isEmpty ||
            double.tryParse(trellisTemirInstalledArea.text.trim()) == null ||
            trellisTemirCount.text.trim().isEmpty ||
            int.tryParse(trellisTemirCount.text.trim()) == null) {
          return 'Temir shpaller soni yoki maydoni noto‘g‘ri yoki bo‘sh, to‘ldiring';
        }
      }
      if (isShpallerBeton) {
        if (trellisBetonInstalledArea.text.trim().isEmpty ||
            double.tryParse(trellisBetonInstalledArea.text.trim()) == null ||
            trellisBetonCount.text.trim().isEmpty ||
            int.tryParse(trellisBetonCount.text.trim()) == null) {
          return 'Beton shpaller soni  yoki maydoni noto‘g‘ri yoki bo‘sh, to‘ldiring';
        }
      }
      if (!isShpallerBeton && !isShpallerTemir) {
        return 'Shpaller turi tanlanmagan, tanlovni bajaring';
      }
    }
    if (isReservoir) {
      if (!isReservoirBeton && !isReservoirQoplamali) {
        return 'Suv havzasining turi tanlanmagan, tanlovni bajaring';
      }
      if (isReservoirBeton) {
        // Инициализируем список, если он пуст
        if (reservoirsBetonliVolumes.isEmpty) {
          initializeReservoirs();
        }
        // Проверяем все бетонные резервуары
        for (int i = 0; i < reservoirsBetonliVolumes.length; i++) {
          final controller = reservoirsBetonliVolumes[i];
          if (controller.text.trim().isEmpty ||
              double.tryParse(controller.text.trim()) == null) {
            return "Beton suv havzasi hajmi (${i + 1}) noto'g'ri yoki bo'sh, to'ldiring";
          }
        }
      }
      if (isReservoirQoplamali) {
        // Инициализируем список, если он пуст
        if (reservoirsQoplamaliVolumes.isEmpty) {
          initializeReservoirs();
        }
        // Проверяем все покрытые резервуары
        for (int i = 0; i < reservoirsQoplamaliVolumes.length; i++) {
          final controller = reservoirsQoplamaliVolumes[i];
          if (controller.text.trim().isEmpty ||
              double.tryParse(controller.text.trim()) == null) {
            return "Qoplamali suv havzasi hajmi (${i + 1}) noto'g'ri yoki bo'sh, to'ldiring";
          }
        }
      }
    }
    if (selectedDetails.isEmpty) {
      return 'Meva maydoni tanlanmagan, tanlovni bajaring';
    }
    
    // Проверка разницы между площадью полигона и общей площадью плантации (не более 15%)
    if (polygonArea != null && polygonArea! > 0) {
      final totalArea = getTotalArea(ref);
      if (totalArea > 0) {
        // Вычисляем разницу в процентах
        final difference = ((polygonArea! - totalArea).abs() / polygonArea!) * 100;
        p.log("🔍 DetailVM validateFields: polygonArea = $polygonArea, totalArea = $totalArea, difference = ${difference.toStringAsFixed(2)}%");
        
        if (difference > 15.0) {
          return 'Poligon maydoni va kiritilgan maydon o\'rtasidagi farq 15% dan oshib ketdi. Farq: ${difference.toStringAsFixed(1)}%. Iltimos, ma\'lumotlarni tekshiring.';
        }
      }
    }
    
    // Динамическая проверка количества фотографий
    final minPhotosRequired = calculateMinimumPhotosRequired(ref);
    final uploadedImagesCount = _imageFiles.values.where((file) => file != null).length;
    
    if (uploadedImagesCount < minPhotosRequired) {
      return 'Kamida $minPhotosRequired ta rasm yuklash kerak. Hozir: $uploadedImagesCount ta.\n${getPhotoRequirementDetails(ref)}';
    }
    
    return null;
  }

  void addSelectedDetail(WidgetRef ref) {
    final isIqtisodiy = ref.read(switchIqtisodiy);
    p.log('[detail] addSelectedDetail: isIqtisodiy = $isIqtisodiy');
    // print('[detail] addSelectedDetail: isIqtisodiy = $isIqtisodiy');

    if (selectedFruit == null || selectedFruitVariety == null) {
      // print('[detail] addSelectedDetail: selectedFruit or selectedFruitVariety is null');
      return;
    }

    // Экономически неэффективная площадь
    if (isIqtisodiy) {
      // print('[detail] addSelectedDetail: Processing iqtisodiy mode');
      final econ = double.tryParse(
              economicInefficientAreaController.text.trim().replaceAll(',', '.')) ??
          0.0;

      final fa = FruitArea(
        fruit: selectedFruit?.id,
        variety: selectedFruitVariety?.id,
        rootstock: null, // Всегда null для iqtisodiy=true (поле скрыто в UI)
        fruitName: selectedFruit?.name,
        varietyName: selectedFruitVariety?.name,
        rootstockName: null,
        plantedYear: null,
        area: 0.0,
        schema: null,
        weight: null,
        fenced: null,
        iqtisodiysamarasiz: true,
        economicInefficientArea: econ,
      );
      p.log('[detail] addSelectedDetail (iqtisodiy=true): ${fa.toJson()}');
      selectedFruitVerityRoot.add(fa);
      selectedDetails.add(fa);
      _resetFieldsInternal();
      notifyListeners();
      return;
    }

    // Обычная посадка
    // print('[detail] addSelectedDetail: Processing normal mode');
    if (selectedDate2 != null &&
        cultivatedArea.text.isNotEmpty &&
        sxema1.text.isNotEmpty &&
        sxema2.text.isNotEmpty) {
      // print('[detail] addSelectedDetail: Normal mode validation passed');
      final year = selectedDate2!.year.toString();
      final fa = FruitArea(
        fruit: selectedFruit?.id,
        variety: selectedFruitVariety?.id,
        rootstock: selectedFruitRoot?.id,
        fruitName: selectedFruit?.name,
        varietyName: selectedFruitVariety?.name,
        rootstockName: selectedFruitRoot?.name,
        plantedYear: year,
        area: double.tryParse(cultivatedArea.text.trim().replaceAll(',', '.')) ??
            0.0,
        schema: "${sxema1.text}X${sxema2.text}",
        weight: tonnaController.text.trim().isEmpty
            ? null
            : double.tryParse(tonnaController.text.trim().replaceAll(',', '.')) ??
                0.0,
        fenced: ref.read(switchFenced),
        iqtisodiysamarasiz: false,
      );
      p.log('[detail] addSelectedDetail (iqtisodiy=false): ${fa.toJson()}');
      selectedFruitVerityRoot.add(fa);
      selectedDetails.add(fa);
      _resetFieldsInternal();
      notifyListeners();
    } else {
      // print('[detail] addSelectedDetail: Normal mode validation failed');
    }
  }

  void addSubsidiyaList(WidgetRef ref) {
    selectedSubsidy.add(Subsidy(
      year: _selectedDate3?.year.toString() ?? "0",
      contractNumber: subsidiyaContract.text.trim(),
      amount: double.tryParse(subsidiyaAmount.text.trim()) ?? 0.0,
      direction: _selectedSubsidyType,
      efficiency: ref.watch(switchEfficiency),
    ));
    resetSubsudy();
    notifyListeners();
  }

  void resetSubsudy() {
    _selectedDate3 = null;
    subsidiyaContract.clear();
    subsidiyaAmount.clear();
    notifyListeners();
  }

  void _resetFieldsInternal() {
    selectedFruit = null;
    selectedFruitVariety = null;
    selectedFruitRoot = null;
    _selectedDate2 = null;
    cultivatedArea.clear();
    sxema1.clear();
    sxema2.clear();
    tonnaController.clear();
    economicInefficientAreaController.clear();
    notifyListeners();
  }

  void resetFields(WidgetRef ref) {
    _resetFieldsInternal();
    ref.read(switchIqtisodiy.notifier).state = false;
    ref.read(switchFenced.notifier).state = false;
  }

  /// Загрузить информацию о пользователе (isSpecialUser) из storage
  Future<void> loadUserInfo() async {
    _isSpecialUser = await AppStorage.$readBool(key: StorageKey.isSpecialUser) ?? false;
    p.log('🔍 Loaded isSpecialUser: $_isSpecialUser');
  }

  /// Показать диалог выбора источника изображения (Camera/Gallery)
  Future<void> showImagePicker(BuildContext context, int cardId) async {
    // Загружаем информацию о пользователе перед показом диалога
    await loadUserInfo();
    
    final ImageSource? source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.camera_alt),
                title: const Text('Camera'),
                onTap: () => Navigator.pop(context, ImageSource.camera),
              ),
              // Показываем опцию Gallery только для специальных пользователей
              if (_isSpecialUser) ...[
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.photo_library),
                  title: const Text('Gallery'),
                  onTap: () => Navigator.pop(context, ImageSource.gallery),
                ),
              ],
            ],
          ),
        );
      },
    );

    if (source != null) {
      await pickImage(cardId: cardId, source: source, context: context);
    }
  }
  
  /// Выбрать изображение из галереи
  Future<void> pickImageFromGallery(int cardId, {BuildContext? context}) async {
    await pickImage(cardId: cardId, source: ImageSource.gallery, context: context);
  }
  
  /// Сфотографировать изображение
  Future<void> pickImageFromCamera(int cardId, {BuildContext? context}) async {
    await pickImage(cardId: cardId, source: ImageSource.camera, context: context);
  }

  /// Calculates minimum required photos based on plantation type, fruits count, and land type
  /// 
  /// Logic:
  /// - Base: 1 photo for any plantation
  /// - +1 photo for each added fruit
  /// - +1 photo if land type is Lalmi (unirrigated/yaroqsiz)
  int calculateMinimumPhotosRequired([WidgetRef? ref]) {
    int minPhotos = 1; // Base photo for plantation
    
    // Add 1 photo for each fruit
    minPhotos += selectedDetails.length;
    
    // Add 1 photo if land type is Lalmi (1 = yaroqsiz/unirrigated)
    if (selectedYerType == 1) {
      minPhotos += 1;
    }
    
    // Add 1 photo if ochiq maydon (empty field) is greater than 0
    // If value is 0, no photo required. If value >= 0.1, photo is required
    final emptyAreaValue = double.tryParse(_norm(emptyArea.text.trim())) ?? 0.0;
    if (emptyAreaValue > 0) {
      minPhotos += 1;
    }
    
    // Add 1 photo if tomchilab sug'orish (drip irrigation) is enabled
    if (ref != null) {
      final isTomchiEnabled = ref.read(switchTomchi);
      if (isTomchiEnabled) {
        minPhotos += 1;
      }
      
      // Add 1 photo if shpaller (trellis) is enabled
      final isShpaller = ref.read(switchTrellis);
      if (isShpaller) {
        minPhotos += 1;
      }
      
      // Add 1 photo if suv havzasi (reservoir) is enabled
      final isReservoir = ref.read(switchReservoir);
      if (isReservoir) {
        minPhotos += 1;
      }
      
      debugPrint("📸 Minimum photos required: $minPhotos (base: 1, fruits: ${selectedDetails.length}, lalmi: ${selectedYerType == 1 ? 1 : 0}, ochiq maydon: ${emptyAreaValue > 0 ? 1 : 0}, tomchi: ${isTomchiEnabled ? 1 : 0}, shpaller: ${isShpaller ? 1 : 0}, suv havzasi: ${isReservoir ? 1 : 0})");
    } else {
      debugPrint("📸 Minimum photos required: $minPhotos (base: 1, fruits: ${selectedDetails.length}, lalmi: ${selectedYerType == 1 ? 1 : 0}, ochiq maydon: ${emptyAreaValue > 0 ? 1 : 0})");
    }
    
    return minPhotos;
  }
  
  /// Returns detailed explanation of photo requirements
  String getPhotoRequirementDetails([WidgetRef? ref]) {
    final details = <String>[];
    
    details.add("• Asosiy plantatsiya: 1 ta rasm");
    
    if (selectedDetails.isNotEmpty) {
      details.add("• Mevalar (${selectedDetails.length} ta): ${selectedDetails.length} ta rasm");
    }
    
    if (selectedYerType == 1) {
      details.add("• Lalmi (yaroqsiz) maydon: 1 ta rasm");
    }
    
    final emptyAreaValue = double.tryParse(_norm(emptyArea.text.trim())) ?? 0.0;
    if (emptyAreaValue > 0) {
      details.add("• Ochiq maydon: 1 ta rasm");
    }
    
    if (ref != null) {
      final isTomchiEnabled = ref.read(switchTomchi);
      if (isTomchiEnabled) {
        details.add("• Tomchilab sug'orish: 1 ta rasm");
      }
      
      final isShpaller = ref.read(switchTrellis);
      if (isShpaller) {
        details.add("• Shpaller: 1 ta rasm");
      }
      
      final isReservoir = ref.read(switchReservoir);
      if (isReservoir) {
        details.add("• Suv havzasi: 1 ta rasm");
      }
    }
    
    return details.join('\n');
  }
  
  /// Возвращает описание того, что нужно сфотографировать для указанного индекса фото
  String getPhotoDescription(int index, [WidgetRef? ref]) {
    int currentIndex = 0;
    
    // Фото 0: Asosiy plantatsiya
    if (index == currentIndex) {
      return "Asosiy plantatsiya";
    }
    currentIndex++;
    
    // Фото 1, 2, 3...: Фрукты
    for (int i = 0; i < selectedDetails.length; i++) {
      if (index == currentIndex) {
        final fruitName = selectedDetails[i].fruitName ?? "Meva";
        return fruitName;
      }
      currentIndex++;
    }
    
    // Фото для Lalmi (если применимо)
    if (selectedYerType == 1) {
      if (index == currentIndex) {
        return "Lalmi maydon";
      }
      currentIndex++;
    }
    
    // Фото для Ochiq maydon (если применимо)
    final emptyAreaValue = double.tryParse(_norm(emptyArea.text.trim())) ?? 0.0;
    if (emptyAreaValue > 0) {
      if (index == currentIndex) {
        return "Ochiq maydon";
      }
      currentIndex++;
    }
    
    // Фото для Tomchi (если применимо)
    if (ref != null) {
      final isTomchiEnabled = ref.read(switchTomchi);
      if (isTomchiEnabled) {
        if (index == currentIndex) {
          return "Tomchilab sug'orish";
        }
        currentIndex++;
      }
      
      // Фото для Shpaller (если применимо)
      final isShpaller = ref.read(switchTrellis);
      if (isShpaller) {
        if (index == currentIndex) {
          return "Shpaller";
        }
        currentIndex++;
      }
      
      // Фото для Suv havzasi (если применимо)
      final isReservoir = ref.read(switchReservoir);
      if (isReservoir) {
        if (index == currentIndex) {
          return "Suv havzasi";
        }
        currentIndex++;
      }
    }
    
    // Если индекс выходит за пределы требуемых фото, возвращаем общее описание
    return "Qo'shimcha rasm";
  }
  
      
  /// Основной метод для выбора изображения
  Future<void> pickImage({
    required int cardId,
    required ImageSource source,
    BuildContext? context,
  }) async {
    final XFile? pickedFile = await _picker.pickImage(source: source);
    if (pickedFile == null) return;
    
    // Валидация формата изображения
    if (!Utils.isValidImageFormat(pickedFile.path)) {
      final mountedContext = context;
      if (mountedContext != null && mountedContext.mounted) {
        Utils.fireTopSnackBar(
          "Faqat JPEG yoki JPG formatidagi rasmlar qabul qilinadi",
          DesignColors.AppColors.error,
          mountedContext,
        );
      }
      return;
    }
    
    _imageFiles[cardId] = File(pickedFile.path);
    notifyListeners();
  }

  Future<void> getFruit() async {
    isLoading = true;
    notifyListeners();
    try {
      final data = await _appRepositoryImpl.getFruits();
      if (data == null) {
        return;
      } else {
        try {
          fruitList = fruitModelFromJson(data);
        } catch (e) {
          p.log("Ma'lumotlarni qayta ishlashda muammo yuzaga keldi: $e");
        }
      }
    } catch (e) {
      l.e("$e");
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> getFruitVerity({required String verity}) async {
    isLoading2 = true;
    notifyListeners();
    try {
      final data = await _appRepositoryImpl.getFruitsVerity(verity: verity);
      if (data == null) {
        return;
      } else {
        try {
          fruitVerityList = fruitVarietyModelFromJson(data);
        } catch (e) {
          p.log("Malumotlarni Qayta ishlashda muammo yuzaga keldi");
        }
      }
    } catch (e) {
      l.e("$e");
    } finally {
      isLoading2 = false;
      notifyListeners();
    }
  }

  Future<void> getFruitRootstocks({required String rootstocks}) async {
    isLoading2 = true;
    notifyListeners();
    try {
      final data =
          await _appRepositoryImpl.getFruitsRootstocks(rootstocks: rootstocks);
      if (data == null) {
        return;
      } else {
        // print("Fruit Rootstocks: $data _____");
        try {
          fruitRootList = fruitRootstocksModelFromJson(data);
        } catch (e) {
          debugPrint("Malumotlarni Qayta ishlashda muammo yuzaga keldi");
        }
      }
    } catch (e) {
      l.e("$e");
    } finally {
      isLoading2 = false;
      notifyListeners();
    }
  }

  int? _selectedPlantationType;
  int? get selectedPlantationType => _selectedPlantationType;
  void setPlantationType(int? bogTuri) {
    _selectedPlantationType = bogTuri;
    notifyListeners();
  }

  int? _selectedBogType;
  int? get selectedBogType => _selectedBogType;
  void setBogType(int? bogType) {
    _selectedBogType = bogType;
    notifyListeners();
  }

  int? _selectedIssiqxonaType;
  int? get selectedIssiqxonaType => _selectedIssiqxonaType;
  void setIssiqxonaType(int? issiqxonaType) {
    _selectedIssiqxonaType = issiqxonaType;
    notifyListeners();
  }

  int? _selectedUzumType;
  int? get selectedUzumType => _selectedUzumType;
  void setUzumType(int? uzumType) {
    _selectedUzumType = uzumType;
    notifyListeners();
  }

  int? _selectedBogSubtype;
  int? get selectedBogSubtype => _selectedBogSubtype;
  void setBogSubtype(int? bogSubtype) {
    _selectedBogSubtype = bogSubtype;
    notifyListeners();
  }

  int? _selectedYerType;
  int? get selectedYerType => _selectedYerType;
  void setYerType(int? yerType) {
    _selectedYerType = yerType;
    notifyListeners();
  }

  

  int? _selectedSubsidyType;
  int? get selectedSubsidyType => _selectedSubsidyType;
  void setSubsidyType(int? subsidyType) {
    _selectedSubsidyType = subsidyType;
    notifyListeners();
  }

  void setValue({
    required int id,
    required List<Coordinate> coordinate,
    required Map<String, double> userLocation,
    double? polygonArea,
  }) {
    farmerId = id;
    coordinates = coordinate;
    this.userLocation = userLocation;
    this.polygonArea = polygonArea;
    p.log("✅ DetailVM setValue: userLocation received: $userLocation");
    p.log("✅ DetailVM setValue: userLocation stored: ${this.userLocation}");
    p.log("✅ DetailVM setValue: userLocation type: ${this.userLocation.runtimeType}");
    p.log("✅ DetailVM setValue: polygonArea received: $polygonArea");
  }

  

  void setTonna(String value) {
    tonnaController.text = value;
    notifyListeners();
  }

  void removeDetailAt(int index) {
    if (index < selectedDetails.length) {
      selectedDetails.removeAt(index);
    }
    if (index < selectedFruitVerityRoot.length) {
      selectedFruitVerityRoot.removeAt(index);
    }
    notifyListeners();
  }

  void removeSubsidy(int index) {
    selectedSubsidy.removeAt(index);
    notifyListeners();
  }

  void setFruitVariety(FruitVarietyModel? fruitVariety) {
    selectedFruitVariety = fruitVariety;
    notifyListeners();
  }

  void setFruitRoot(FruitRootstocksModel? fruitRoot) {
    selectedFruitRoot = fruitRoot;
    notifyListeners();
  }

  void setFruit(FruitModel? fruit) {
    selectedFruit = fruit;
    notifyListeners();
  }

  void setSelectedDate(DateTime date) {
    _selectedDate = date;
    notifyListeners();
  }

  void setSelectedDate2(DateTime date) {
    _selectedDate2 = date;
    notifyListeners();
  }

  void clearSelectedDate2() {
    _selectedDate2 = null;
    notifyListeners();
  }

  void setSelectedDate3(DateTime date) {
    _selectedDate3 = date;
    notifyListeners();
  }

  
  void setNotUsableArea(String value) {
    String cleaned = _onlyDigitsDot(_norm(value.replaceAll('-', '')));
    final dot = cleaned.indexOf('.');
    if (dot != -1) {
      final before = cleaned.substring(0, dot + 1);
      final after = cleaned.substring(dot + 1).replaceAll('.', '');
      cleaned = before + after;
    }
    notUsableArea.value = TextEditingValue(
      text: cleaned,
      selection: TextSelection.collapsed(offset: cleaned.length),
    );
    notifyListeners();
  }

  void setEmptyArea(String value) {
    String cleaned = _onlyDigitsDot(_norm(value.replaceAll('-', '')));
    final dot = cleaned.indexOf('.');
    if (dot != -1) {
      final before = cleaned.substring(0, dot + 1);
      final after = cleaned.substring(dot + 1).replaceAll('.', '');
      cleaned = before + after;
    }
    emptyArea.value = TextEditingValue(
      text: cleaned,
      selection: TextSelection.collapsed(offset: cleaned.length),
    );
    notifyListeners();
  }

  void setEconomicInefficientArea(String value) {
    String cleaned = _onlyDigitsDot(_norm(value.replaceAll('-', '')));
    final dot = cleaned.indexOf('.');
    if (dot != -1) {
      final before = cleaned.substring(0, dot + 1);
      final after = cleaned.substring(dot + 1).replaceAll('.', '');
      cleaned = before + after;
    }
    economicInefficientAreaController.value = TextEditingValue(
      text: cleaned,
      selection: TextSelection.collapsed(offset: cleaned.length),
    );
    notifyListeners();
  }

  double getTotalArea(WidgetRef ref) {
    // empty_area
    final empty = double.tryParse(emptyArea.text.replaceAll(',', '.')) ?? 0.0;
    
    // not_usable_area  
    final notUsable = double.tryParse(notUsableArea.text.replaceAll(',', '.')) ?? 0.0;
    
    // economic_inefficient_area (сумма всех экономически неэффективных площадей)
    double economicInefficient = 0.0;
    for (final fruitArea in selectedDetails) {
      if (fruitArea.iqtisodiysamarasiz == true) {
        economicInefficient += fruitArea.economicInefficientArea ?? 0.0;
      }
    }
    
    // planted_area (сумма всех обычных площадей)
    double planted = 0.0;
    for (final fruitArea in selectedDetails) {
      if (fruitArea.iqtisodiysamarasiz == false) {
        planted += fruitArea.area ?? 0.0;
      }
    }
    
    // Добавляем текущий фрукт, если он заполняется
    final isIqtisodiy = ref.read(switchIqtisodiy);
    if (isIqtisodiy) {
      economicInefficient += double.tryParse(economicInefficientAreaController.text.replaceAll(',', '.')) ?? 0.0;
    } else {
      planted += double.tryParse(cultivatedArea.text.replaceAll(',', '.')) ?? 0.0;
    }
    
    return empty + notUsable + economicInefficient + planted;
  }

  void setTomchiSystemsCount(String value) {
    tomchiSystemsCount.text = value;
   
    notifyListeners();
  }

  void setTomchiSystemsArea(String value) {
    tomchiSystemsArea.text = value;
    notifyListeners();
  }

  void setUnumdorlikValue(double value) {
    unumdorlikValue = value;
    notifyListeners();
  }

  void setSubsidiyaConract(String value) {
    subsidiyaContract.text = value;
    notifyListeners();
  }

  void setSubsidiyaAmount(String value) {
    subsidiyaAmount.text = value;
    notifyListeners();
  }

  void setTrellisTemirInstalledArea(String value) {
    trellisTemirInstalledArea.text = value;
    notifyListeners();
  }

  void setTrellisBetonInstalledArea(String value) {
    trellisBetonInstalledArea.text = value;
    notifyListeners();
  }

  void setTrellisTemirCount(String value) {
    trellisTemirCount.text = value;
    notifyListeners();
  }

  void setTrellisBetonCount(String value) {
    trellisBetonCount.text = value;
    notifyListeners();
  }

  void setInvestmentMahhalliyAmount(String value) {
    investmentMahhalliyAmount.text = value;
    notifyListeners();
  }

  void setInvestmentXorijiyAmount(String value) {
    investmentXorijiyAmount.text = value;
    notifyListeners();
  }

  void setCultivatedArea(String value) {
    cultivatedArea.text = value;
    notifyListeners();
  }

  void setSxema1(String value) {
    sxema1.text = value;
    notifyListeners();
  }

  void setSxema2(String value) {
    sxema2.text = value;
    notifyListeners();
  }

  void setReservoirQoplamaliVolume(String value) {
    reservoirsQoplamaliVolume.text = value;
    notifyListeners();
  }

  void setReservoirsBetonliVolume(String value) {
    reservoirsBetonliVolume.text = value;
    notifyListeners();
  }
}
