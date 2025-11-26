import "dart:developer";
import "package:dio/dio.dart";
import "package:flutter/foundation.dart";
import "package:go_router/go_router.dart";

import "../../storage/app_storage.dart";
import "../../routes/router_config.dart";
import "../../routes/app_route_names.dart";
import "../../setting/setup.dart";

class TokenInterceptor extends Interceptor {
  TokenInterceptor._();

  static final TokenInterceptor instance = TokenInterceptor._();



  @override
  Future<void> onRequest(
      RequestOptions options, RequestInterceptorHandler handler) async {
    if (kDebugMode) {
      log(
        "---------[TokenInterceptor]---------ON_REQUEST(${options.method})------------------\n\n"
        "URL: ${options.uri}\n"
        "Headers: ${options.headers}\n"
        "---------------------------------------------------------------------------\n\n",
      );
    }
    super.onRequest(options, handler);
  }

  @override
  void onResponse(
      Response<dynamic> response, ResponseInterceptorHandler handler) {
    if (kDebugMode) {
      log(
        "---------[TokenInterceptor]---------ON_RESPONSE(${response.statusCode})------------------\n\n"
        "URL: ${response.realUri}\n"
        "Data: ${response.data}\n"
        "---------------------------------------------------------------------------\n\n",
      );
    }
    super.onResponse(response, handler);
  }

  @override
  Future<void> onError(
      DioException err, ErrorInterceptorHandler handler) async {
    log("TokenInterceptor onError called with status: ${err.response?.statusCode}");
    
    if (kDebugMode) {
      log(
        "---------[TokenInterceptor]---------ON_ERROR(${err.response?.statusCode})------------------\n\n"
        "URL: ${err.response?.realUri.path}\n"
        "TYPE: ${err.type}\n"
        "Data: ${err.response?.data}\n"
        "Message: ${err.message}\n"
        "---------------------------------------------------------------------------\n\n",
      );
    }

    log("TokenInterceptor processing error: ${err.response?.statusCode} - ${err.response?.data}");

    // Check if it's a 401 Unauthorized error
    if (err.response?.statusCode == 401) {
      log("401 error detected in TokenInterceptor");
      final responseData = err.response?.data;
      
      // Check if the error is related to token validation
      if (responseData is Map<String, dynamic> && 
          responseData['code'] == 'token_not_valid') {
        
        log("Token is invalid or expired. Redirecting to login...");
        
        // Clear stored tokens
        await AppStorage.clearAllData();
        accessToken = null;
        
        // Navigate to login page
        if (parentNavigatorKey.currentContext != null) {
          parentNavigatorKey.currentContext!.go(AppRouteNames.login);
          log("Redirected to login page");
        } else {
          log("Warning: parentNavigatorKey.currentContext is null, cannot navigate to login");
        }
        
        // Don't rethrow the error, just handle it
        return;
      } else {
        log("401 error but not token_not_valid: $responseData");
      }
    }

    super.onError(err, handler);
  }
} 