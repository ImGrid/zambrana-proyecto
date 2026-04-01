import 'dart:ui' show VoidCallback;
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  late Dio _dio;
  String? _accessToken;
  String? _refreshToken;
  VoidCallback? _onSessionExpired;

  ApiService._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: Duration(milliseconds: ApiConfig.connectTimeout),
      receiveTimeout: Duration(milliseconds: ApiConfig.receiveTimeout),
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    _dio.interceptors.add(_AuthInterceptor(this));
  }

  Dio get dio => _dio;
  String? get token => _accessToken;

  void setTokens(String accessToken, String? refreshToken) {
    _accessToken = accessToken;
    if (refreshToken != null) {
      _refreshToken = refreshToken;
    }
  }

  void setToken(String token) {
    _accessToken = token;
  }

  void setRefreshToken(String token) {
    _refreshToken = token;
  }

  void setSessionExpiredCallback(VoidCallback callback) {
    _onSessionExpired = callback;
  }

  void clearToken() {
    _accessToken = null;
    _refreshToken = null;
    _clearAllTokens();
  }

  Future<void> _clearAllTokens() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('refresh_token');
    await prefs.remove('user_data');
  }

  Future<void> _saveAccessToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', token);
  }

  Future<void> loadStoredToken() async {
    final prefs = await SharedPreferences.getInstance();
    _accessToken = prefs.getString('access_token');
    _refreshToken = prefs.getString('refresh_token');
  }
}

// Interceptor que encola requests mientras se refresca el token
class _AuthInterceptor extends QueuedInterceptor {
  final ApiService _apiService;

  _AuthInterceptor(this._apiService);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (_apiService._accessToken != null) {
      options.headers['Authorization'] = 'Bearer ${_apiService._accessToken}';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode != 401) {
      return handler.next(err);
    }

    final requestPath = err.requestOptions.path;

    // Si el 401 es en login o refresh, no intentar refresh
    if (requestPath.contains('/auth/login') ||
        requestPath.contains('/auth/refresh')) {
      _apiService._accessToken = null;
      _apiService._refreshToken = null;
      await _apiService._clearAllTokens();
      _apiService._onSessionExpired?.call();
      return handler.next(err);
    }

    // Si no hay refresh token, no se puede refrescar
    if (_apiService._refreshToken == null) {
      _apiService._accessToken = null;
      await _apiService._clearAllTokens();
      _apiService._onSessionExpired?.call();
      return handler.next(err);
    }

    // Intentar refresh con un Dio separado (sin interceptor, evita loop)
    try {
      final refreshDio = Dio(BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        connectTimeout: Duration(milliseconds: ApiConfig.connectTimeout),
        receiveTimeout: Duration(milliseconds: ApiConfig.receiveTimeout),
        headers: {'Content-Type': 'application/json'},
      ));

      final response = await refreshDio.post(
        '/auth/refresh',
        data: {'refreshToken': _apiService._refreshToken},
      );

      if (response.statusCode == 200) {
        final newAccessToken = response.data['accessToken'] as String;
        _apiService._accessToken = newAccessToken;
        await _apiService._saveAccessToken(newAccessToken);

        // Reintentar request original con nuevo token
        final opts = err.requestOptions;
        opts.headers['Authorization'] = 'Bearer $newAccessToken';

        final retryResponse = await refreshDio.fetch(opts);
        return handler.resolve(retryResponse);
      }
    } catch (_) {
      // Refresh fallo
    }

    // Si llegamos aqui, el refresh fallo
    _apiService._accessToken = null;
    _apiService._refreshToken = null;
    await _apiService._clearAllTokens();
    _apiService._onSessionExpired?.call();
    handler.next(err);
  }
}

