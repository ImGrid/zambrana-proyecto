import 'dart:async';
import 'dart:io' show Platform;
import 'package:geolocator/geolocator.dart';

class GPSService {
  static final GPSService _instance = GPSService._internal();
  factory GPSService() => _instance;
  GPSService._internal();

  StreamSubscription<Position>? _positionSubscription;
  Position? _lastPosition;
  Timer? _watchdogTimer;
  // Parametros guardados para recrear el stream si el watchdog lo detecta muerto
  void Function(PosicionActual posicion)? _onPosicionCallback;
  void Function(String error)? _onErrorCallback;
  int _intervaloSegundos = 10;

  Position? get lastPosition => _lastPosition;

  // Verifica si el servicio de ubicacion esta habilitado
  Future<bool> isLocationServiceEnabled() async {
    return await Geolocator.isLocationServiceEnabled();
  }

  // Verifica y solicita permisos de ubicacion
  Future<PermisoUbicacionResult> verificarYSolicitarPermisos() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return PermisoUbicacionResult(
        concedido: false,
        mensaje: 'El servicio de ubicacion esta deshabilitado. Por favor habilitelo en configuracion.',
      );
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return PermisoUbicacionResult(
          concedido: false,
          mensaje: 'Los permisos de ubicacion fueron denegados.',
        );
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return PermisoUbicacionResult(
        concedido: false,
        mensaje: 'Los permisos de ubicacion estan permanentemente denegados. Debe habilitarlos en la configuracion de la aplicacion.',
      );
    }

    return PermisoUbicacionResult(concedido: true);
  }

  // Obtiene la posicion actual
  Future<PosicionResult> obtenerPosicionActual() async {
    try {
      final permisoResult = await verificarYSolicitarPermisos();
      if (!permisoResult.concedido) {
        return PosicionResult(
          success: false,
          mensaje: permisoResult.mensaje,
        );
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );

      _lastPosition = position;

      return PosicionResult(
        success: true,
        posicion: PosicionActual(
          latitud: position.latitude,
          longitud: position.longitude,
          velocidadKmh: position.speed >= 0 ? position.speed * 3.6 : null,
          direccionGrados: position.heading >= 0 ? position.heading : null,
          precisionMetros: position.accuracy,
          timestamp: position.timestamp.toIso8601String(),
        ),
      );
    } catch (e) {
      return PosicionResult(
        success: false,
        mensaje: 'Error al obtener ubicacion: $e',
      );
    }
  }

  // Inicia el tracking continuo de GPS
  // Callback se llama cada vez que hay una nueva posicion
  Future<bool> iniciarTracking({
    required void Function(PosicionActual posicion) onPosicion,
    void Function(String error)? onError,
    int intervaloSegundos = 10,
  }) async {
    final permisoResult = await verificarYSolicitarPermisos();
    if (!permisoResult.concedido) {
      onError?.call(permisoResult.mensaje ?? 'Permisos no concedidos');
      return false;
    }

    // Guardar callbacks para poder recrear el stream desde el watchdog
    _onPosicionCallback = onPosicion;
    _onErrorCallback = onError;
    _intervaloSegundos = intervaloSegundos;

    // Cancelar tracking anterior si existe
    await detenerTracking();

    await _crearStream();
    return _positionSubscription != null;
  }

  // Crea el stream GPS interno (usado por iniciarTracking y por el watchdog)
  Future<void> _crearStream() async {
    late LocationSettings locationSettings;

    if (Platform.isAndroid) {
      // distanceFilter: 0 para que emita por intervalo de tiempo sin importar
      // si el dispositivo se movio. Con distanceFilter > 0 Android usa condicion
      // AND (intervalo Y distancia) y suprime posiciones si no hay desplazamiento.
      // Se usa FusedLocationProvider (default) en vez de LocationManager porque:
      // - Mejor precision (fusion de GPS + WiFi + sensores)
      // - Respeta intervalDuration correctamente
      // - forceLocationManager causaba congelamiento del stream (issues #1290, #1114)
      // - El workaround para issue #1391 es llamar getCurrentPosition antes del stream
      locationSettings = AndroidSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 0,
        intervalDuration: Duration(seconds: _intervaloSegundos),
        foregroundNotificationConfig: const ForegroundNotificationConfig(
          notificationText: 'Rastreando ubicacion de entrega',
          notificationTitle: 'Agregados Zambrana - En ruta',
          enableWakeLock: true,
          setOngoing: true,
          notificationChannelName: 'Tracking GPS',
        ),
      );
    } else {
      locationSettings = LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 0,
      );
    }

    await _positionSubscription?.cancel();
    _positionSubscription = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen(
      (Position position) {
        _lastPosition = position;
        _resetWatchdog();

        final posicionActual = PosicionActual(
          latitud: position.latitude,
          longitud: position.longitude,
          velocidadKmh: position.speed >= 0 ? position.speed * 3.6 : null,
          direccionGrados: position.heading >= 0 ? position.heading : null,
          precisionMetros: position.accuracy,
          timestamp: position.timestamp.toIso8601String(),
        );

        _onPosicionCallback?.call(posicionActual);
      },
      onError: (error) {
        _onErrorCallback?.call('Error de GPS: $error');
      },
    );

    _resetWatchdog();
  }

  // Watchdog: si no llega posicion en 3x el intervalo, recrear el stream
  void _resetWatchdog() {
    _watchdogTimer?.cancel();
    _watchdogTimer = Timer(Duration(seconds: _intervaloSegundos * 3), () async {
      if (_positionSubscription == null) return;
      _onErrorCallback?.call('GPS stream inactivo, reconectando...');
      await _crearStream();
    });
  }

  // Detiene el tracking continuo
  Future<void> detenerTracking() async {
    _watchdogTimer?.cancel();
    _watchdogTimer = null;
    await _positionSubscription?.cancel();
    _positionSubscription = null;
    _onPosicionCallback = null;
    _onErrorCallback = null;
  }

  // Verifica si el tracking esta activo
  bool get isTracking => _positionSubscription != null;

  // Calcula la distancia entre dos puntos en metros
  double calcularDistancia(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    return Geolocator.distanceBetween(lat1, lon1, lat2, lon2);
  }

  // Calcula el bearing (direccion) entre dos puntos
  double calcularBearing(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    return Geolocator.bearingBetween(lat1, lon1, lat2, lon2);
  }

  // Abre la configuracion de ubicacion del dispositivo
  Future<bool> abrirConfiguracionUbicacion() async {
    return await Geolocator.openLocationSettings();
  }

  // Abre la configuracion de la aplicacion
  Future<bool> abrirConfiguracionApp() async {
    return await Geolocator.openAppSettings();
  }
}

// Resultado de verificar permisos
class PermisoUbicacionResult {
  final bool concedido;
  final String? mensaje;

  PermisoUbicacionResult({
    required this.concedido,
    this.mensaje,
  });
}

// Posicion actual del dispositivo
class PosicionActual {
  final double latitud;
  final double longitud;
  final double? velocidadKmh;
  final double? direccionGrados;
  final double? precisionMetros;
  final String? timestamp;

  PosicionActual({
    required this.latitud,
    required this.longitud,
    this.velocidadKmh,
    this.direccionGrados,
    this.precisionMetros,
    this.timestamp,
  });
}

// Resultado de obtener posicion
class PosicionResult {
  final bool success;
  final PosicionActual? posicion;
  final String? mensaje;

  PosicionResult({
    required this.success,
    this.posicion,
    this.mensaje,
  });
}
