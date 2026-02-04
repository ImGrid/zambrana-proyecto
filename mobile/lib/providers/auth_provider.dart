import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

// Estado de autenticacion
class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final User? user;
  final String? error;

  AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.user,
    this.error,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    User? user,
    String? error,
    bool clearError = false,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

// Notifier de autenticacion (Riverpod 3.x)
class AuthNotifier extends Notifier<AuthState> {
  final AuthService _authService = AuthService();

  @override
  AuthState build() {
    // Verificar sesion guardada al iniciar
    _checkStoredSession();
    return AuthState(isLoading: true);
  }

  // Verificar sesion guardada
  Future<void> _checkStoredSession() async {
    final user = await _authService.getStoredUser();
    if (user != null) {
      state = AuthState(
        isAuthenticated: true,
        user: user,
        isLoading: false,
      );
    } else {
      state = AuthState(isLoading: false);
    }
  }

  // Login
  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);

    final result = await _authService.login(email, password);

    if (result.success && result.user != null) {
      state = AuthState(
        isAuthenticated: true,
        user: result.user,
        isLoading: false,
      );
      return true;
    } else {
      state = state.copyWith(
        isLoading: false,
        error: result.message ?? 'Error de autenticacion',
      );
      return false;
    }
  }

  // Logout
  Future<void> logout() async {
    await _authService.logout();
    state = AuthState();
  }

  // Limpiar error
  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

// Provider (Riverpod 3.x)
final authProvider = NotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);
