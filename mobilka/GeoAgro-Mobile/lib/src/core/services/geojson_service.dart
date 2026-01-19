import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../data/repository/app_repository_impl.dart';
import '../server/api/api_constants.dart';

/// Service for loading and caching GeoJSON boundary files
/// 
/// This service handles:
/// - Loading GeoJSON files from the backend with JWT authentication
/// - Caching GeoJSON data locally for offline access
/// - Automatic oblast slug resolution based on region ID
class GeoJsonService {
  final AppRepositoryImpl _repository = AppRepositoryImpl();
  
  /// Loads GeoJSON data for a specific oblast
  /// 
  /// First checks local cache, then falls back to network request
  /// 
  /// Parameters:
  /// - `regionId`: The region ID (1-13) to get GeoJSON for
  /// - `forceRefresh`: If true, ignores cache and fetches from network
  /// 
  /// Returns:
  /// - Map<String, dynamic> containing GeoJSON data on success
  /// - null if loading fails
  Future<Map<String, dynamic>?> loadOblastBoundaries({
    required int regionId,
    bool forceRefresh = false,
  }) async {
    final oblastSlug = ApiParams.getOblastSlug(regionId);
    debugPrint("🗺️ GeoJsonService: Loading boundaries for region $regionId (oblast: $oblastSlug)");
    
    // Try to load from cache first
    if (!forceRefresh) {
      final cachedData = await _loadFromCache(oblastSlug);
      if (cachedData != null) {
        debugPrint("✅ GeoJsonService: Loaded from cache");
        return cachedData;
      }
    }
    
    // Load from network
    debugPrint("🗺️ GeoJsonService: Loading from network...");
    final jsonString = await _repository.getOblastGeoJson(oblastSlug: oblastSlug);
    
    if (jsonString == null) {
      debugPrint("❌ GeoJsonService: Failed to load from network");
      return null;
    }
    
    try {
      final geoJsonData = jsonDecode(jsonString) as Map<String, dynamic>;
      
      // Cache the data for future use
      await _saveToCache(oblastSlug, jsonString);
      
      debugPrint("✅ GeoJsonService: Loaded from network and cached");
      return geoJsonData;
    } catch (e) {
      debugPrint("❌ GeoJsonService: Failed to parse GeoJSON: $e");
      return null;
    }
  }
  
  /// Loads GeoJSON data for the current user's region
  /// 
  /// Automatically determines the region from stored user info
  Future<Map<String, dynamic>?> loadCurrentUserBoundaries({
    bool forceRefresh = false,
  }) async {
    try {
      // Get user info to determine region
      final userInfoJson = await _repository.getUserInfo();
      if (userInfoJson == null) {
        debugPrint("❌ GeoJsonService: Failed to get user info");
        return null;
      }
      
      final userInfo = jsonDecode(userInfoJson) as Map<String, dynamic>;
      final regionId = userInfo['region_id'] as int?;
      
      if (regionId == null) {
        debugPrint("❌ GeoJsonService: User has no region_id");
        return null;
      }
      
      return await loadOblastBoundaries(
        regionId: regionId,
        forceRefresh: forceRefresh,
      );
    } catch (e) {
      debugPrint("❌ GeoJsonService: Error loading current user boundaries: $e");
      return null;
    }
  }
  
  /// Clears cached GeoJSON data for a specific oblast
  Future<void> clearCache(int regionId) async {
    try {
      final oblastSlug = ApiParams.getOblastSlug(regionId);
      final cacheKey = _getCacheKey(oblastSlug);
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(cacheKey);
      debugPrint("🗑️ GeoJsonService: Cleared cache for $oblastSlug");
    } catch (e) {
      debugPrint("⚠️ GeoJsonService: Failed to clear cache: $e");
    }
  }
  
  /// Clears all cached GeoJSON data
  Future<void> clearAllCache() async {
    for (int i = 1; i <= 13; i++) {
      await clearCache(i);
    }
    debugPrint("🗑️ GeoJsonService: Cleared all GeoJSON cache");
  }
  
  // Private helper methods
  
  String _getCacheKey(String oblastSlug) => 'geojson_$oblastSlug';
  
  Future<Map<String, dynamic>?> _loadFromCache(String oblastSlug) async {
    try {
      final cacheKey = _getCacheKey(oblastSlug);
      final prefs = await SharedPreferences.getInstance();
      final cachedJson = prefs.getString(cacheKey);
      
      if (cachedJson == null) {
        return null;
      }
      
      return jsonDecode(cachedJson) as Map<String, dynamic>;
    } catch (e) {
      debugPrint("⚠️ GeoJsonService: Failed to load from cache: $e");
      return null;
    }
  }
  
  Future<void> _saveToCache(String oblastSlug, String jsonString) async {
    try {
      final cacheKey = _getCacheKey(oblastSlug);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(cacheKey, jsonString);
      debugPrint("💾 GeoJsonService: Saved to cache: $cacheKey");
    } catch (e) {
      debugPrint("⚠️ GeoJsonService: Failed to save to cache: $e");
    }
  }
}
