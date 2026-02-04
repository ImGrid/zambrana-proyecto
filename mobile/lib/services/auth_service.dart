import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _apiService = ApiService();

  // Login
  Future<AuthResult> login(String email, String password) async {
    try {
      final response = await _apiService.dio.post(
        '/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        final data = response.data;
        final accessToken = data['accessToken'] as String;
        final userData = data['user'] as Map<String, dynamic>;
        final user = User.fromJson(userData);

        // Guardar token y usuario
        _apiService.setToken(accessToken);
        await _saveCredentials(accessToken, user);

        return AuthResult(success: true, user: user);
      }

      return AuthResult(success: false, message: 'Error desconocido');
    } on DioException catch (e) {
      String message = 'Error de conexion';
      if (e.response != null) {
        final data = e.response?.data;
        if (data is Map) {
          message = data['message'] as String? ?? data['error'] as String? ?? message;
        }
      }
      return AuthResult(success: false, message: message);
    } catch (e) {
      return AuthResult(success: false, message: 'Error: $e');
    }
  }

  // Logout
  Future<void> logout() async {
    _apiService.clearToken();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('user_data');
  }

  // Verificar si hay sesion guardada
  Future<User?> getStoredUser() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    final userJson = prefs.getString('user_data');

    if (token != null && userJson != null) {
      _apiService.setToken(token);
      try {
        final userData = jsonDecode(userJson) as Map<String, dynamic>;
        return User.fromJson(userData);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // Guardar credenciales
  Future<void> _saveCredentials(String token, User user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', token);
    await prefs.setString('user_data', jsonEncode(user.toJson()));
  }
}

// Resultado de autenticacion
class AuthResult {
  final bool success;
  final User? user;
  final String? message;

  AuthResult({
    required this.success,
    this.user,
    this.message,
  });
}
