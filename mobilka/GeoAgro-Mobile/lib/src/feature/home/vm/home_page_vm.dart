import 'dart:convert';
import 'dart:developer';

import 'package:flutter/material.dart';

import '../../../data/model/plantation/plantations_list_model.dart';
import '../../../data/repository/app_repository_impl.dart';

class HomePageVm extends ChangeNotifier {
  final AppRepositoryImpl _appRepositoryImpl;
  final List<Result> plantationsList = [];
  final List<Result> approvedList = [];
  final List<Result> pendingList = [];
  final List<Result> recheckList = [];
  final List<Result> rejectedList = [];

  bool _isLoading = false;
  bool _isFetchingMore = false;
  bool _isDeleting = false; // Added loading state for deletion
  String? errorMessage;
  String? deletMessage;
  int currentPage = 1;
  bool canLoadNext = true;
  String? _searchQuery;

  HomePageVm(this._appRepositoryImpl) {
    // Automatically load plantations when VM is created
    getPlantationsModel();
  }

  bool get isLoading => _isLoading;
  bool get isFetchingMore => _isFetchingMore;
  bool get isDeleting => _isDeleting; // Added getter for deletion loading state
  bool get isSearching => (_searchQuery?.isNotEmpty ?? false);

  // Getters for filtered lists
  List<Result> get rejectedPlantations => plantationsList
      .where((e) => (e.isChecked == false) && ((e.moderationComments?.isNotEmpty ?? false)))
      .toList();
  
  // Get approved plantations (isChecked == true)
  List<Result> get approvedPlantations => plantationsList.where((e) => e.isChecked == true).toList();
  
  // Get pending plantations (isChecked == null or false, no moderation comment)
  List<Result> get pendingPlantations => plantationsList
      .where((e) => (e.isChecked != true) && ((e.moderationComments == null) || (e.moderationComments?.isEmpty ?? true)))
      .toList();
  
  // Get recheck plantations (isChecked == false, has moderation comment)
  List<Result> get recheckPlantations => plantationsList
      .where((e) => (e.isChecked == false) && ((e.moderationComments?.isNotEmpty ?? false)))
      .toList();

  void _setLoading(bool value) {
    if (!_isLoading && value) {
      _isLoading = value;
      _safeNotifyListeners();
    } else if (_isLoading && !value) {
      _isLoading = value;
      _safeNotifyListeners();
    }
  }

  void _setFetchingMore(bool value) {
    if (!_isFetchingMore && value) {
      _isFetchingMore = value;
      _safeNotifyListeners();
    } else if (_isFetchingMore && !value) {
      _isFetchingMore = value;
      _safeNotifyListeners();
    }
  }

  void _setDeleting(bool value) {
    if (!_isDeleting && value) {
      _isDeleting = value;
      _safeNotifyListeners();
    } else if (_isDeleting && !value) {
      _isDeleting = value;
      _safeNotifyListeners();
    }
  }

  // Safe notifyListeners to prevent dispose errors
  void _safeNotifyListeners() {
    try {
      if (!_disposed) {
        notifyListeners();
      }
    } catch (e) {
      // VM was disposed, ignore
    }
  }

  bool _disposed = false;

  @override
  void dispose() {
    _disposed = true;
    super.dispose();
  }

  Future<void> getPlantationsModel({bool isLoadMore = false, String? search}) async {
    if ((!canLoadNext && isLoadMore) || (isLoadMore && isFetchingMore)) return;
    
    // If search query changed, reset pagination
    if (search != _searchQuery && !isLoadMore) {
      _searchQuery = search;
    }
    
    try {
      errorMessage = null;
      if (!isLoadMore) {
        currentPage = 1;
        canLoadNext = true;
        plantationsList.clear();
        _setLoading(true);
      } else {
        _setFetchingMore(true);
      }

      final data = await _appRepositoryImpl.getPlantationsList(
        page: currentPage, 
        search: _searchQuery,
      );

      if (data == null) {
        errorMessage = "Server bilan bog'liq xatolik yuzaga keldi.";
      } else {
        try {
          log("Received data length: ${data.length}");
          final model = plantationsListModelFromJson(data);
          log("Parsed ${model.results?.length ?? 0} plantations for page $currentPage");
          
          // Просто добавляем все приходящие данные в массив
          final incomingItems = model.results ?? [];
          plantationsList.addAll(incomingItems);
          
          log("HOME PAGE $currentPage: Added ${incomingItems.length} plantations (search: $_searchQuery)");
          log("Total plantations: ${plantationsList.length}");
          
          currentPage++;
          canLoadNext = model.next != null;
        } catch (jsonError, stackTrace) {
          log("Json Parsing Error: $jsonError");
          log("Stack trace: $stackTrace");
          errorMessage = "Ma'lumotlarni qayta ishlashda xatolik yuz berdi.";
        }
      }
    } catch (e, stackTrace) {
      log("Error in getPlantationsModel: $e");
      log("Stack trace: $stackTrace");
      errorMessage = "Internet bilan bog'liq muammo yuzaga keldi.";
    } finally {
      _setFetchingMore(false);
      _setLoading(false);
    }
  }

  Future<bool> deletePlantation({required int id}) async {
    deletMessage = null;
    _safeNotifyListeners();

    try {
      final data = await _appRepositoryImpl.deletePlantationModel(id: id, model: {});
      if (data == null) {
        deletMessage = "Server bilan bog'liq xatolik yuzaga keldi.";
        return false;
      } else {
        // DELETE запрос возвращает "success" как строку или 204 статус
        if (data == "success" || data.toString().toLowerCase().contains("success")) {
          deletMessage = "Plantatsiya muvaffaqiyatli o'chirildi";
          // Удаляем плантацию из всех списков
          plantationsList.removeWhere((plantation) => plantation.id == id);
          approvedList.removeWhere((plantation) => plantation.id == id);
          pendingList.removeWhere((plantation) => plantation.id == id);
          recheckList.removeWhere((plantation) => plantation.id == id);
          rejectedList.removeWhere((plantation) => plantation.id == id);
          _safeNotifyListeners();
          return true;
        } else {
          // Пытаемся распарсить как JSON, если это не строка "success"
          try {
            final jsonData = jsonDecode(data) as Map<String, dynamic>;
            if (jsonData.containsKey("id") || jsonData.containsKey("detail")) {
              deletMessage = jsonData["detail"]?.toString() ?? "Plantatsiya muvaffaqiyatli o'chirildi";
              // Удаляем плантацию из всех списков
              plantationsList.removeWhere((plantation) => plantation.id == id);
              approvedList.removeWhere((plantation) => plantation.id == id);
              pendingList.removeWhere((plantation) => plantation.id == id);
              recheckList.removeWhere((plantation) => plantation.id == id);
              rejectedList.removeWhere((plantation) => plantation.id == id);
              _safeNotifyListeners();
              return true;
            }
          } catch (_) {
            // Если не JSON, считаем успехом если есть данные
            deletMessage = "Plantatsiya muvaffaqiyatli o'chirildi";
            // Удаляем плантацию из всех списков
            plantationsList.removeWhere((plantation) => plantation.id == id);
            approvedList.removeWhere((plantation) => plantation.id == id);
            pendingList.removeWhere((plantation) => plantation.id == id);
            recheckList.removeWhere((plantation) => plantation.id == id);
            rejectedList.removeWhere((plantation) => plantation.id == id);
            _safeNotifyListeners();
            return true;
          }
          deletMessage = "Kutilmagan javob qaytdi";
          return false;
        }
      }
    } catch (e) {
      deletMessage = "Internet bilan bog'liq muammo yuzaga keldi.";
      debugPrint("Delete plantation error: $e");
      return false;
    } finally {
      _safeNotifyListeners();
    }
  }

  Future<bool> deletePlantationPermanently({required int id, String? reason}) async {
    deletMessage = null;
    _setDeleting(true); // Start loading
    _safeNotifyListeners();

    try {
      final data = await _appRepositoryImpl.deletePlantation(id: id, reason: reason);
      
      // Добавляем подробное логирование
      debugPrint("Delete response: '$data' (type: ${data.runtimeType})");
      
      if (data == null) {
        debugPrint("Delete failed: data is null");
        deletMessage = "Server bilan bog'liq xatolik yuzaga keldi.";
        return false;
      } else {
        // API может вернуть "success" как строку или JSON объект
        if (data == "success") {
          deletMessage = "O'chirish so'rovi moderatsiyaga yuborildi";
          // Удаляем плантацию из всех списков
          plantationsList.removeWhere((plantation) => plantation.id == id);
          approvedList.removeWhere((plantation) => plantation.id == id);
          pendingList.removeWhere((plantation) => plantation.id == id);
          recheckList.removeWhere((plantation) => plantation.id == id);
          rejectedList.removeWhere((plantation) => plantation.id == id);
          
          // Сбрасываем состояние загрузки для корректного отображения
          _setLoading(false);
          _setFetchingMore(false);
          
          return true;
        }
        
        // Пробуем парсить как JSON
        try {
          final jsonData = jsonDecode(data) as Map<String, dynamic>;
          debugPrint("Delete JSON parsed: $jsonData");

          // Сначала проверяем на ошибки
          if (jsonData.containsKey("error")) {
            final errorMessage = jsonData["error"] as String;
            debugPrint("Delete error: $errorMessage");
            
            // Обрабатываем различные типы ошибок
            if (errorMessage.contains("аллақачон юборилган") || errorMessage.contains("аллақачон ўчирилган") || 
                errorMessage.contains("уже отправлена") || errorMessage.contains("уже удалена")) {
              deletMessage = "Бу плантация аллақачон ўчириш учун юборилган";
            } else {
              deletMessage = "Xatolik: $errorMessage";
            }
            return false;
          }

          // Проверяем на успешный ответ
          if (jsonData.containsKey("detail")) {
            final detailMessage = jsonData["detail"] as String;
            debugPrint("Delete detail message: $detailMessage");
            
            // Проверяем на различные варианты успешного сообщения
            if (detailMessage.contains("ўчирилди") || 
                detailMessage.contains("ўчириш") || 
                detailMessage.contains("модерацияга") ||
                detailMessage.contains("юборилди") ||
                detailMessage.contains("удален") || 
                detailMessage.contains("удаление") || 
                detailMessage.contains("модерацию") ||
                detailMessage.contains("отправлен")) {
              debugPrint("Delete successful: detail message indicates success");
              deletMessage = "Ўчириш сўрови модерацияга юборилди";
              // Удаляем плантацию из всех списков
              plantationsList.removeWhere((plantation) => plantation.id == id);
              approvedList.removeWhere((plantation) => plantation.id == id);
              pendingList.removeWhere((plantation) => plantation.id == id);
              recheckList.removeWhere((plantation) => plantation.id == id);
              rejectedList.removeWhere((plantation) => plantation.id == id);
              
              // Сбрасываем состояние загрузки для корректного отображения
              _setLoading(false);
              _setFetchingMore(false);
              
              return true;
            } else {
              debugPrint("Delete failed: detail message indicates failure");
              deletMessage = "O'chirishda xatolik yuz berdi";
              return false;
            }
          } else {
            debugPrint("Delete failed: no detail field in response");
            deletMessage = "O'chirishda xatolik yuz berdi";
            return false;
          }
        } catch (jsonError) {
          // Если не удалось распарсить JSON, но получили "success", считаем удаление успешным
          if (data.toString().toLowerCase().contains("success")) {
            deletMessage = "Plantatsiya muvaffaqiyatli o'chirildi";
            // Удаляем плантацию из всех списков
            plantationsList.removeWhere((plantation) => plantation.id == id);
            approvedList.removeWhere((plantation) => plantation.id == id);
            pendingList.removeWhere((plantation) => plantation.id == id);
            recheckList.removeWhere((plantation) => plantation.id == id);
            rejectedList.removeWhere((plantation) => plantation.id == id);
            
            // Сбрасываем состояние загрузки для корректного отображения
            _setLoading(false);
            _setFetchingMore(false);
            
            return true;
          }
          deletMessage = "O'chirishda xatolik yuz berdi";
          return false;
        }
      }
    } catch (e) {
      deletMessage = "Internet bilan bog'liq muammo yuzaga keldi.";
      return false;
    } finally {
      _setDeleting(false); // Stop loading
      _safeNotifyListeners();
    }
  }
}
