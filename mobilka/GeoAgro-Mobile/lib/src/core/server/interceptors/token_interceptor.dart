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
  Future<void> onResponse(
      Response<dynamic> response, ResponseInterceptorHandler handler) async {
    if (kDebugMode) {
      log(
        "---------[TokenInterceptor]---------ON_RESPONSE(${response.statusCode})------------------\n\n"
        "URL: ${response.realUri}\n"
        "Data: ${response.data}\n"
        "---------------------------------------------------------------------------\n\n",
      );
    }
    
    // Check for auth-related messages even in successful responses
    final responseData = response.data;
    if (responseData != null) {
      String? errorMessage;
      
      if (responseData is Map<String, dynamic>) {
        errorMessage = responseData['detail']?.toString() ??
            responseData['message']?.toString() ??
            responseData['error']?.toString();
      } else if (responseData is String) {
        errorMessage = responseData;
      }
      
      // Check if message indicates auth error (e.g., "Пароль был изменён")
      if (errorMessage != null) {
        final lower = errorMessage.toLowerCase();
        if (lower.contains('пароль был изменён') ||
            lower.contains('password was changed') ||
            lower.contains('войдите заново') ||
            lower.contains('войти заново') ||
            lower.contains('login again') ||
            lower.contains('please login')) {
          log("Auth error message detected in response. Redirecting to login...");
          
          // Clear stored tokens
          await AppStorage.clearAllData();
          accessToken = null;
          
          // Navigate to login page
          if (parentNavigatorKey.currentContext != null) {
            parentNavigatorKey.currentContext!.go(AppRouteNames.login);
            log("Redirected to login page from response");
          }
          
          // Don't process the response further
          return;
        }
      }
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

    final responseData = err.response?.data;
    final statusCode = err.response?.statusCode;
    
    // Check if it's an authentication error (401 or specific error messages)
    bool isAuthError = false;
    bool shouldRedirectToLogin = false;
    
    // Helper function to check if message indicates auth error
    bool _isAuthErrorMessage(String message) {
      final lower = message.toLowerCase();
      return lower.contains('пароль был изменён') ||
          lower.contains('password was changed') ||
          lower.contains('войдите заново') ||
          lower.contains('войти заново') ||
          lower.contains('login again') ||
          lower.contains('please login') ||
          lower.contains('please sign in') ||
          lower.contains('token') ||
          lower.contains('authentication') ||
          lower.contains('unauthorized') ||
          lower.contains('expired') ||
          lower.contains('invalid') && (lower.contains('token') || lower.contains('credential'));
    }
    
    // Check for 401 status code
    if (statusCode == 401) {
      isAuthError = true;
      shouldRedirectToLogin = true;
      log("401 error detected in TokenInterceptor - token expired or invalid");
    }
    
    // Check response data for auth-related messages (even if status code is not 401)
    if (responseData != null) {
      String? errorMessage;
      
      if (responseData is Map<String, dynamic>) {
        // Check various fields for error messages
        errorMessage = responseData['detail']?.toString() ??
            responseData['message']?.toString() ??
            responseData['error']?.toString();
        
        // Also check for token error codes
        if (responseData['code'] == 'token_not_valid' ||
            responseData['code'] == 'token_expired') {
          isAuthError = true;
          shouldRedirectToLogin = true;
        }
      } else if (responseData is String) {
        errorMessage = responseData;
      }
      
      // Check if error message indicates auth error
      if (errorMessage != null && _isAuthErrorMessage(errorMessage)) {
        isAuthError = true;
        shouldRedirectToLogin = true;
        log("Auth error detected from message: $errorMessage");
      }
    }
    
    // If it's an auth error, redirect to login
    if (shouldRedirectToLogin || isAuthError) {
      log("Authentication error detected. Clearing tokens and redirecting to login...");
      
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
      
      // Don't rethrow the error, just handle it silently
      // This prevents showing server error messages to the user
      return;
    }

    super.onError(err, handler);
  }
} 