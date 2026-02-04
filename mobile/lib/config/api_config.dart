// Configuracion del API
class ApiConfig {
  // Para emulador Android usa 10.0.2.2
  // Para dispositivo fisico usa la IP de tu computadora (ej: 192.168.0.6)
  static const String baseUrl = 'http://10.0.2.2:3000/api';

  // Timeouts
  static const int connectTimeout = 30000;
  static const int receiveTimeout = 30000;
}
