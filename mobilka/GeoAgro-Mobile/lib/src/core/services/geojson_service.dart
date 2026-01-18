import 'dart:convert';
import 'dart:io';
import 'package:flutter/services.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:flutter/foundation.dart';

/// Сервис для работы с GeoJSON файлами
class GeoJsonService {
  static final GeoJsonService _instance = GeoJsonService._internal();
  factory GeoJsonService() => _instance;
  GeoJsonService._internal();

  // Маппинг regionId к имени файла GeoJSON
  static const Map<int, String> _regionToFileMap = {
    1: 'toshkent.geojson',
    2: 'andijon.geojson',
    3: 'namangan.geojson',
    4: 'fargona.geojson',
    5: 'buxoro.geojson',
    6: 'qashqadaryo.geojson',
    7: 'surxondaryo.geojson',
    8: 'samarqand.geojson',
    9: 'jizzax.geojson',
    10: 'sirdaryo.geojson',
    11: 'navoiy.geojson',
    12: 'qoraqalpogiston.geojson',
    13: 'xorazm.geojson',
  };

  // Кэш для загруженных GeoJSON данных
  final Map<int, Map<String, dynamic>> _geoJsonCache = {};
  final Map<int, List<Map<String, dynamic>>> _districtsCache = {};
  
  // Кэш для маппинга districtId -> regionId
  Map<int, int>? _districtToRegionMap;

  /// Получить границы района по districtId
  /// Возвращает список полигонов (LatLng) для отображения на карте
  Future<List<List<LatLng>>> getDistrictBoundaries({
    required int districtId,
    required int regionId,
  }) async {
    try {
      // Загружаем GeoJSON для региона
      final geoJson = await _loadGeoJsonForRegion(regionId);
      if (geoJson == null) {
        return [];
      }

      // Ищем feature с нужным districtId
      final features = geoJson['features'] as List<dynamic>?;
      if (features == null) {
        return [];
      }

      final List<List<LatLng>> boundaries = [];

      for (final feature in features) {
        final properties = feature['properties'] as Map<String, dynamic>?;
        if (properties == null) continue;

        final featureId = properties['id'] as int?;
        if (featureId == districtId) {
          final geometry = feature['geometry'] as Map<String, dynamic>?;
          if (geometry == null) continue;

          final type = geometry['type'] as String?;
          final coordinates = geometry['coordinates'] as dynamic;

          if (type == 'Polygon' && coordinates != null) {
            // Polygon имеет структуру: [[[lng, lat], [lng, lat], ...]]
            final polygonCoords = coordinates as List<dynamic>;
            if (polygonCoords.isNotEmpty) {
              final outerRing = polygonCoords[0] as List<dynamic>;
              final latLngList = outerRing.map((coord) {
                final coords = coord as List<dynamic>;
                return LatLng(
                  (coords[1] as num).toDouble(), // lat
                  (coords[0] as num).toDouble(), // lng
                );
              }).toList();
              boundaries.add(latLngList);
            }
          } else if (type == 'MultiPolygon' && coordinates != null) {
            // MultiPolygon имеет структуру: [[[[lng, lat], ...], ...]]
            final multiPolygonCoords = coordinates as List<dynamic>;
            for (final polygon in multiPolygonCoords) {
              final polygonCoords = polygon as List<dynamic>;
              if (polygonCoords.isNotEmpty) {
                final outerRing = polygonCoords[0] as List<dynamic>;
                final latLngList = outerRing.map((coord) {
                  final coords = coord as List<dynamic>;
                  return LatLng(
                    (coords[1] as num).toDouble(), // lat
                    (coords[0] as num).toDouble(), // lng
                  );
                }).toList();
                boundaries.add(latLngList);
              }
            }
          }
        }
      }

      return boundaries;
    } catch (e) {
      print('Error loading district boundaries: $e');
      return [];
    }
  }

  /// Загрузить GeoJSON для региона
  Future<Map<String, dynamic>?> _loadGeoJsonForRegion(int regionId) async {
    // Проверяем кэш
    if (_geoJsonCache.containsKey(regionId)) {
      return _geoJsonCache[regionId];
    }

    try {
      final fileName = _regionToFileMap[regionId];
      if (fileName == null) {
        print('No GeoJSON file found for region $regionId');
        return null;
      }

      // Пытаемся загрузить из assets (если файлы добавлены в pubspec.yaml)
      try {
        final String jsonString = await rootBundle.loadString(
          'assets/geojson/$fileName',
        );
        final geoJson = jsonDecode(jsonString) as Map<String, dynamic>;
        _geoJsonCache[regionId] = geoJson;
        debugPrint('✅ Loaded GeoJSON for region $regionId from assets');
        return geoJson;
      } catch (e) {
        debugPrint('⚠️ GeoJSON not found in assets, trying file system: $e');
      }

      // Для разработки/тестирования: пытаемся загрузить из папки android/uzb-geojson/
      // Это работает только во время разработки, не в собранном APK
      try {
        final currentDir = Directory.current;
        final file = File('${currentDir.path}/android/uzb-geojson/$fileName');
        
        if (await file.exists()) {
          final jsonString = await file.readAsString();
          final geoJson = jsonDecode(jsonString) as Map<String, dynamic>;
          _geoJsonCache[regionId] = geoJson;
          debugPrint('✅ Loaded GeoJSON for region $regionId from: ${file.path}');
          return geoJson;
        } else {
          debugPrint('❌ GeoJSON file not found: ${file.path}');
        }
      } catch (e) {
        debugPrint('❌ Error loading GeoJSON from android folder: $e');
      }

      return null;
    } catch (e) {
      print('Error loading GeoJSON for region $regionId: $e');
      return null;
    }
  }

  /// Получить regionId по districtId из файла geaoagro_distircts.json
  Future<int?> getRegionIdByDistrictId(int districtId) async {
    try {
      // Загружаем маппинг, если еще не загружен
      if (_districtToRegionMap == null) {
        await _loadDistrictToRegionMap();
      }

      return _districtToRegionMap?[districtId];
    } catch (e) {
      debugPrint('Error getting regionId for districtId $districtId: $e');
      return null;
    }
  }

  /// Загрузить маппинг districtId -> regionId из geaoagro_distircts.json
  Future<void> _loadDistrictToRegionMap() async {
    try {
      String? jsonString;

      // Пытаемся загрузить из assets
      try {
        jsonString = await rootBundle.loadString('assets/geojson/geaoagro_distircts.json');
        debugPrint('✅ Loaded districts mapping from assets');
      } catch (e) {
        debugPrint('⚠️ Districts mapping not found in assets, trying file system: $e');
      }

      // Если не найдено в assets, пытаемся загрузить из файловой системы
      if (jsonString == null) {
        try {
          final currentDir = Directory.current;
          final file = File('${currentDir.path}/android/uzb-geojson/geaoagro_distircts.json');
          
          if (await file.exists()) {
            jsonString = await file.readAsString();
            debugPrint('✅ Loaded districts mapping from: ${file.path}');
          } else {
            debugPrint('❌ geaoagro_distircts.json not found: ${file.path}');
          }
        } catch (e) {
          debugPrint('❌ Error loading districts mapping from file system: $e');
        }
      }

      if (jsonString != null) {
        final districts = jsonDecode(jsonString) as List<dynamic>;
        
        _districtToRegionMap = {};
        for (final district in districts) {
          final districtMap = district as Map<String, dynamic>;
          final id = districtMap['id'] as int?;
          final region = districtMap['region'] as int?;
          if (id != null && region != null) {
            _districtToRegionMap![id] = region;
          }
        }
        debugPrint('✅ Loaded district to region mapping: ${_districtToRegionMap!.length} districts');
      }
    } catch (e) {
      debugPrint('❌ Error loading district to region map: $e');
    }
  }

  /// Очистить кэш
  void clearCache() {
    _geoJsonCache.clear();
    _districtsCache.clear();
    _districtToRegionMap = null;
  }
}

