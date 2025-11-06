import "dart:convert";
import "dart:developer";

import "package:dio/dio.dart";
import "package:flutter/material.dart";

import "app_repository.dart";
import "../../core/server/api/api.dart";
import "../model/response/api_response.dart";
import "../../core/server/api/api_constants.dart";
import "../model/farmer/create_fermer_model.dart";
import '../../core/storage/app_storage.dart';
import '../../core/server/api/api_service_v2.dart';
// Removed unused import: '../../core/setting/setup.dart'

class AppRepositoryImpl implements AppRepo {
  const AppRepositoryImpl._();

  static final _inner = AppRepositoryImpl._();

  factory AppRepositoryImpl() => _inner;

  /// Login method
  @override
  Future<ApiResponse> login(
      {required String username, required String password}) async {
    try {
      final response = await ApiService.post(
          ApiConst.apiLogin, {"username": username, "password": password});

      // Persist username for later lookup
      await AppStorage.$write(key: StorageKey.username, value: username);
      return response;
    } catch (e) {
      return ApiResponse(
          statusCode: 500,
          data: {"message": "Unexpected error: ${e.toString()}"});
    }
  }

  @override
  Future<String?> getPlantationsList({int? page, String? search}) async {
    try {
      final data = await ApiService.get(
        ApiConst.apiPlantationsForme,
        ApiParams.pageWithSearchParams(page: page ?? 1, search: search),
      );
      return data;
    } on DioException catch (e) {
      debugPrint("Server error: ${e.response?.data ?? e.message}");
    } catch (e) {
      debugPrint("Unexpected error: $e");
    }
    return null;
  }


  /// Delete Plantation method
  @override
  Future<String?> deletePlantationModel(
      {required int id, required Map<String, dynamic> model}) async {
    try {
      final data =
          await ApiService.patch(ApiConst.apiUpdatePlantation(id), model);
      if (data != null) {
        return data.toString();
      }
      return null;
    } on DioException catch (e) {
      debugPrint("Server error: ${e.response?.data ?? e.message}");
    } catch (e) {
      debugPrint("Unexpected error: $e");
    }
    return null;
  }

  /// Delete Plantation permanently (send to moderation)
  @override
  Future<String?> deletePlantation({required int id, String? reason}) async {
    try {
      final body = {
        "moderation_comment": [
          {
            "text": reason ?? "O'chirish so'rovi",
            "image": null
          }
        ]
      };
      
      final response = await ApiService.patch("${ApiConst.apiPlantations}$id/delete/", body);
      if (response != null) {
        // Проверяем статус код
        if (response.statusCode == 200 || response.statusCode == 201) {
          return jsonEncode(response.data);
        } else {
          // Возвращаем данные об ошибке
          return jsonEncode(response.data);
        }
      }
      return null;
    } on DioException catch (e) {
      debugPrint("Server error: ${e.response?.data ?? e.message}");
      // Возвращаем данные об ошибке для обработки в ViewModel
      if (e.response?.data != null) {
        return jsonEncode(e.response!.data);
      }
    } catch (e) {
      debugPrint("Unexpected error: $e");
    }
    return null;
  }

  /// Get Plantation detail method
  @override
  Future<String?> getPlantationDetail({required int id}) async {
    try {
      final data = await ApiService.get(
          "${ApiConst.apiPlantations}$id/mobile", ApiParams.emptyParams());
      return data;
    } on DioException catch (e) {
      debugPrint("Server error: ${e.response?.data ?? e.message}");
    } catch (e) {
      debugPrint("Unexpected error: $e");
    }
    return null;
  }

  /// Get related plantations for map view
  @override
  Future<String?> getRelatedPlantationsMap(int plantationId) async {
    try {
      final data = await ApiService.get(
          "${ApiConst.apiPlantations}$plantationId/related-map/", 
          ApiParams.emptyParams());
      return data;
    } on DioException catch (e) {
      debugPrint("Server error: ${e.response?.data ?? e.message}");
    } catch (e) {
      debugPrint("Unexpected error: $e");
    }
    return null;
  }

  /// Get nearby plantations for creating new plantation
  @override
  Future<String?> getNearbyPlantations({required double latitude, required double longitude, double radius = 1000}) async {
    try {
      final params = {
        'latitude': latitude.toString(),
        'longitude': longitude.toString(),
        'radius': radius.toString(),
      };
      
      final data = await ApiService.get(
          "${ApiConst.apiPlantations}nearby/", 
          ApiParams.queryParams(params));
      return data;
    } on DioException catch (e) {
      debugPrint("Server error: ${e.response?.data ?? e.message}");
    } catch (e) {
      debugPrint("Unexpected error: $e");
    }
    return null;
  }

  /// Get user plantations for map display
  @override
  Future<String?> getUserPlantationsForMap() async {
    try {
      debugPrint("Fetching user plantations for map from: ${ApiConst.apiPlantationsFormeMap}");
      
      // Используем endpoint для получения плантаций пользователя с координатами
      final data = await ApiService.get(
          ApiConst.apiPlantationsFormeMap, 
          ApiParams.emptyParams());
      
      debugPrint("User plantations API response: ${data?.substring(0, data.length > 500 ? 500 : data.length)}...");
      
      return data;
    } on DioException catch (e) {
      debugPrint("Server error in getUserPlantationsForMap: ${e.response?.statusCode} - ${e.response?.data ?? e.message}");
      if (e.response?.statusCode == 401) {
        debugPrint("Authentication error - token may be expired");
      }
    } catch (e) {
      debugPrint("Unexpected error in getUserPlantationsForMap: $e");
    }
    return null;
  }

  // ===== Farmers API =====
  @override
  Future<String?> getFermersList({int? page}) async {
    try {
      final data = await ApiService.get(
        ApiConst.apiFermers,
        ApiParams.pageParams(page: page ?? 1),
      );
      return data;
    } on DioException catch (e) {
      debugPrint("Server error: ${e.response?.data ?? e.message}");
    } catch (e) {
      debugPrint("Unexpected error: $e");
    }
    return null;
  }

  @override
  Future<String?> searchFarmers({required int inn}) async {
    try {
      final data = await ApiService.get(
        ApiConst.apiFermers,
        ApiParams.searchFarmersParam(inn: inn),
      );
      return data;
    } on DioException catch (e) {
      debugPrint("Server error: ${e.response?.data ?? e.message}");
    } catch (e) {
      debugPrint("Unexpected error: $e");
    }
    return null;
  }

  @override
  Future<String?> getFarmerPlantations({required int farmerInn}) async {
    try {
      final data = await ApiService.get(
        ApiConst.apiFarmerPlantations(farmerInn),
        ApiParams.emptyParams(),
      );
      return data;
    } on DioException catch (e) {
      debugPrint("Server error: ${e.response?.data ?? e.message}");
    } catch (e) {
      debugPrint("Unexpected error: $e");
    }
    return null;
  }

  @override
  Future<ApiResponse> postNewFermer({required CreateFermerModel fermer}) async {
    try {
      final response = await ApiService.post(ApiConst.apiFermers, fermer.toJson());
      return response;
    } catch (e) {
      return ApiResponse(
        statusCode: 500,
        data: {"message": "Unexpected error: ${e.toString()}"},
      );
    }
  }

  // ===== Fruits API =====
  @override
  Future<String?> getFruits() async {
    try {
      final data = await ApiService.get(
        ApiConst.apiFruits,
        ApiParams.emptyParams(),
      );
      return data;
    } on DioException catch (e) {
      debugPrint("Server error: ${e.response?.data ?? e.message}");
      return "Server error: ${e.response?.statusCode ?? 'Unknown status code'}";
    } catch (e) {
      debugPrint("Unexpected error: $e");
      return "Unexpected error: $e";
    }
  }

  @override
  Future<String?> getFruitsVerity({required String verity}) async {
    try {
      final url = "${ApiConst.apiFruitsVerity}/?fruit=$verity";
      final data = await ApiService.get(
        url,
        ApiParams.emptyParams(),
      );
      return data;
    } on DioException catch (e) {
      debugPrint("Server error: ${e.response?.data ?? e.message}");
      return "Server error: ${e.response?.statusCode ?? 'Unknown status code'}";
    } catch (e) {
      debugPrint("Unexpected error: $e");
      return "Unexpected error: $e";
    }
  }

  @override
  Future<String?> getFruitsRootstocks({required String rootstocks}) async {
    try {
      final url = "${ApiConst.apiFruitsRootstocks}/?fruit=$rootstocks";
      final data = await ApiService.get(
        url,
        ApiParams.emptyParams(),
      );
      return data;
    } on DioException catch (e) {
      debugPrint("Server error: ${e.response?.data ?? e.message}");
      return "Server error: ${e.response?.statusCode ?? 'Unknown status code'}";
    } catch (e) {
      debugPrint("Unexpected error: $e");
      return "Unexpected error: $e";
    }
  }

  // ===== Plantations create/update =====
  @override
  Future<ApiResponse> postCreatePlantationWithImages(
      {required Map<String, dynamic> body, required List<String> image}) async {
    try {
      final response =
          await ApiService.multipart(ApiConst.apiCreatePlantation, body, image);
      return response;
    } catch (e) {
      log("Something went wrong at $e");
      return ApiResponse(
          statusCode: 500,
          data: {"message": "Unexpected error: ${e.toString()}"});
    }
  }

  @override
  Future<ApiResponse> editPlantation(
      {required int id, required Map<String, dynamic> body}) async {
    try {
      // Use V2 service to keep error bodies (e.g., 400 with validation message)
      final response = await ApiServiceV2.patch(
        ApiConst.apiUpdatePlantation(id),
        data: body,
      );
      return response;
    } catch (e) {
      log("Error: $e");
      return ApiResponse(
        statusCode: 500,
        data: {"message": "Unexpected error: ${e.toString()}"},
      );
    }
  }

  // ===== Images per-endpoint operations =====
  @override
  Future<String?> getPlantationImages({required int id}) async {
    try {
      final data = await ApiService.get(ApiConst.apiUpdateImage(id), ApiParams.emptyParams());
      return data;
    } on DioException catch (e) {
      debugPrint("Server error: ${e.response?.data ?? e.message}");
    } catch (e) {
      debugPrint("Unexpected error: $e");
    }
    return null;
  }

  @override
  Future<ApiResponse> postPlantationImage({required int id, required String filePath}) async {
    try {
      final response = await ApiService.postFile(ApiConst.apiUpdateImage(id), filePath);
      return response;
    } catch (e) {
      return ApiResponse(statusCode: 500, data: {"message": e.toString()});
    }
  }

  @override
  Future<String?> deletePlantationImage({required int plantationId, required int imageId}) async {
    try {
      final data = await ApiService.delete(ApiConst.apiDeleteImage(plantationId, imageId));
      return data;
    } on DioException catch (e) {
      debugPrint("Server error: ${e.response?.data ?? e.message}");
    } catch (e) {
      debugPrint("Unexpected error: $e");
    }
    return null;
  }

  @override
  Future<String?> editImage({required int id, required List<String> images}) async {
    try {
      final data = await ApiService.uploadImages(ApiConst.apiLegacyImagesUpdate(id), images);
      return data;
    } on DioException catch (e) {
      debugPrint("Server error: ${e.response?.data ?? e.message}");
      return "Server error: ${e.response?.statusCode ?? 'Unknown status code'}";
    } catch (e) {
      debugPrint("Unexpected error: $e");
      return "Unexpected error: $e";
    }
  }

  // ===== Misc =====
  @override
  Future<String?> getUserInfo() async {
    try {
      final data = await ApiService.get(ApiConst.apiGetUserInfo, ApiParams.emptyParams());
      return data;
    } on DioException catch (e) {
      debugPrint("Server error: ${e.response?.data ?? e.message}");
    } catch (e) {
      debugPrint("Unexpected error: $e");
    }
    return null;
  }

  @override
  Future<String?> getFarmerById(int farmerId) async {
    try {
      final data = await ApiService.get("${ApiConst.apiFermers}$farmerId/", ApiParams.emptyParams());
      return data;
    } on DioException catch (e) {
      debugPrint("Server error: ${e.response?.data ?? e.message}");
    } catch (e) {
      debugPrint("Unexpected error: $e");
    }
    return null;
  }

  @override
  Future<String?> getFarmersStatistics({required int districtId}) async {
    try {
      final params = ApiParams.farmersStatisticsParams(districtId: districtId);
      final data = await ApiService.get(ApiConst.apiFarmersStatistics, params);
      return data;
    } on DioException catch (e) {
      debugPrint("Server error: ${e.response?.data ?? e.message}");
    } catch (e) {
      debugPrint("Unexpected error: $e");
    }
    return null;
  }

  // ===== Notifications API =====
  @override
  Future<String?> getNotifications({int limit = 20, int offset = 0, bool? unreadOnly, String? type}) async {
    try {
      final params = ApiParams.notificationsListParams(limit: limit, offset: offset, unreadOnly: unreadOnly, type: type);
      final data = await ApiService.get(ApiConst.apiNotifications, params);
      return data;
    } on DioException catch (e) {
      debugPrint("Server error: ${e.response?.data ?? e.message}");
    } catch (e) {
      debugPrint("Unexpected error: $e");
    }
    return null;
  }

  @override
  Future<String?> getUnreadNotificationsCount() async {
    try {
      final data = await ApiService.get(ApiConst.apiNotificationsUnreadCount, ApiParams.emptyParams());
      return data;
    } on DioException catch (e) {
      debugPrint("Server error: ${e.response?.data ?? e.message}");
    } catch (e) {
      debugPrint("Unexpected error: $e");
    }
    return null;
  }

  @override
  Future<String?> markNotificationsAsRead({bool markAll = false, List<int>? ids}) async {
    try {
      final body = <String, dynamic>{};
      if (markAll) body['mark_all_as_read'] = true;
      if (ids != null && ids.isNotEmpty) body['notification_ids'] = ids;
      final response = await ApiService.patch(ApiConst.apiNotifications, body);
      return response?.toString();
    } on DioException catch (e) {
      debugPrint("Server error: ${e.response?.data ?? e.message}");
    } catch (e) {
      debugPrint("Unexpected error: $e");
    }
    return null;
  }

  @override
  Future<String?> markNotificationAsRead({required int id}) async {
    try {
      final response = await ApiService.patch("${ApiConst.apiNotifications}$id/", {});
      return response?.toString();
    } on DioException catch (e) {
      debugPrint("Server error: ${e.response?.data ?? e.message}");
    } catch (e) {
      debugPrint("Unexpected error: $e");
    }
    return null;
  }

  @override
  Future<String?> deleteNotification({required int id}) async {
    try {
      final data = await ApiService.delete("${ApiConst.apiNotifications}$id/");
      return data;
    } on DioException catch (e) {
      debugPrint("Server error: ${e.response?.data ?? e.message}");
    } catch (e) {
      debugPrint("Unexpected error: $e");
    }
    return null;
  }
}
