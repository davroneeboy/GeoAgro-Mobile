final class ApiConst {
  const ApiConst._();

  static const Duration connectionTimeout = Duration(minutes: 2);
  static const Duration sendTimeout = Duration(minutes: 2);
  static const Duration receiveTimeout = Duration(minutes: 2);

  static const String baseUrl = "https://luxa.uz";

  static String apiUpdatePlantation(int id) => '/api/plantations/$id/mobile-update/';
  static String apiUpdateImage(int id) => '/api/plantations/$id/images/';
  static String apiLegacyImagesUpdate(int id) => '/api/plantations/$id/images/update/';
  static String apiDeleteImage(int plantationId, int imageId) => '/api/plantations/$plantationId/images/$imageId/';
  static String apiDeletePlantation(int id) => '/api/plantations/$id/';

  static const String apiLogin = "/api/login/";
  static const String apiPlantations = "/api/plantations/";
  static const String apiPlantationsForme = "/api/plantations/forme/";
  static const String apiPlantationsFormeMap = "/api/plantations/forme/map/";
  static const String apiPlantationsFormeRejected = "/api/plantations/forme/rejected/";
  static const String apiPlantationsFormeApproved = "/api/plantations/forme/approved/";
  static const String apiPlantationsPending = "/api/plantations/forme/pending/";
  static const String apiCreatePlantation = "/api/plantations/create/";
  static const String apiGetRegions = "/api/regions/";
  static const String apiGetUserInfo = "/api/user_info/";
  static const String apiGetDistrcts = "/api/districts/";
  static const String apiFermers = "/api/farmers/";
  static String apiUpdateFarmer(int id) => "/api/farmers/$id/";
  static String apiFarmerPlantations({required int farmerInn}) => "/api/mymap/plantations/?farmer_inn=$farmerInn";
  static const String apiFruits = "/api/fruits";
  static const String apiFruitsVerity = "/api/variety";
  static const String apiFruitsRootstocks = "/api/rootstocks";
  static const String apiPlantationsUpdate = "/api/plantations/1/";
  static const String apiFarmersStatistics = "/api/statistics/farmers";
  static const String apiNotifications = "/api/notifications/";
  static const String apiNotificationsUnreadCount = "/api/notifications/unread-count/";
  
  // Comments
  static String apiPlantationComments(int plantationId) => '/api/plantations/$plantationId/comments/';
  
  // GeoJSON
  // TODO: Уточните правильный путь на бэкенде:
  // Вариант 1: /geojson/oblast.geojson
  // Вариант 2: /api/geojson/oblast.geojson
  // Вариант 3: /static/geojson/oblast.geojson
  static String apiGeoJson(String oblastSlug) => '/api/geojson/$oblastSlug.geojson'; // Попробуем с /api/
}

final class ApiParams {
  const ApiParams._();

  static Map<String, dynamic> cabinetSmsCheckParams({required String phone, required String code}) => <String, dynamic>{"phone": phone, "code": code};

  static Map<String, dynamic> pageParams({required int page}) => <String, dynamic>{"page": page};

  static Map<String, dynamic> searchFarmersParam({required int inn}) => <String, dynamic>{"inn": inn};

  static Map<String, dynamic> emptyParams() => <String, dynamic>{};
  
  static Map<String, dynamic> farmersStatisticsParams({required int districtId}) => <String, dynamic>{"district_id": districtId};
  
  static Map<String, dynamic> pageWithSearchParams({required int page, String? search}) {
    // If search query is provided, DO NOT send page param
    // Backend will return all matches or handle pagination internally for search
    final params = <String, dynamic>{};
    if (search != null && search.isNotEmpty) {
      params["search"] = search;
    } else {
      params["page"] = page;
    }
    return params;
  }
  
  static Map<String, dynamic> queryParams(Map<String, String> params) => Map<String, dynamic>.from(params);

  // Notifications
  static Map<String, dynamic> notificationsListParams({int limit = 20, int offset = 0, bool? unreadOnly, String? type}) {
    final params = <String, dynamic>{
      "limit": limit,
      "offset": offset,
    };
    if (unreadOnly != null) params["unread_only"] = unreadOnly;
    if (type != null && type.isNotEmpty) params["type"] = type;
    return params;
  }
  
  /// Converts region_id to oblast slug for GeoJSON files
  static String getOblastSlug(int regionId) {
    const regionIdToSlug = {
      1: 'tashkent',
      2: 'andijan',
      3: 'bukhara',
      4: 'fergana',
      5: 'jizzakh',
      6: 'kashkadarya',
      7: 'navoi',
      8: 'namangan',
      9: 'samarkand',
      10: 'sirdarya',
      11: 'surkhandarya',
      12: 'karakalpakstan',
      13: 'khorezm',
    };
    return regionIdToSlug[regionId] ?? 'tashkent';
  }
}
