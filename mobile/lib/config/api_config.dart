// Configuracion del API
class ApiConfig {
  // Produccion: IP estatica de Google Cloud VM (Nginx reverse proxy en puerto 80)
  static const String baseUrl = 'http://34.95.211.47/api';

  // Desarrollo local: descomentar la linea de abajo y comentar la de arriba
  // static const String baseUrl = 'http://192.168.0.7:3000/api';

  // Timeouts
  static const int connectTimeout = 30000;
  static const int receiveTimeout = 30000;
}
