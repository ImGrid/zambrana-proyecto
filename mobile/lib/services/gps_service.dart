import 'dart:async';
import 'dart:io' show Platform;
import 'package:geolocator/geolocator.dart';
import 'package:geolocator_android/geolocator_android.dart';

class GPSService {
  static final GPSService _instance = GPSService._internal();
  factory GPSService() => _instance;
  GPSService._internal();

  StreamSubscription<Position>? _positionSubscription;
  Position? _lastPosition;

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
    double distanciaMinimaMetros = 10,
  }) async {
    final permisoResult = await verificarYSolicitarPermisos();
    if (!permisoResult.concedido) {
      onError?.call(permisoResult.mensaje ?? 'Permisos no concedidos');
      return false;
    }

    // Cancelar tracking anterior si existe
    await detenerTracking();

    // Configuracion especifica para Android con foreground service
    // Esto mantiene el GPS activo cuando la app esta en background
    late LocationSettings locationSettings;

    if (Platform.isAndroid) {
      locationSettings = AndroidSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: distanciaMinimaMetros.toInt(),
        intervalDuration: Duration(seconds: intervaloSegundos),
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
        distanceFilter: distanciaMinimaMetros.toInt(),
      );
    }

    _positionSubscription = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen(
      (Position position) {
        _lastPosition = position;

        final posicionActual = PosicionActual(
          latitud: position.latitude,
          longitud: position.longitude,
          velocidadKmh: position.speed >= 0 ? position.speed * 3.6 : null,
          direccionGrados: position.heading >= 0 ? position.heading : null,
          precisionMetros: position.accuracy,
          timestamp: position.timestamp.toIso8601String(),
        );

        onPosicion(posicionActual);
      },
      onError: (error) {
        onError?.call('Error de GPS: $error');
      },
    );

    return true;
  }

  // Detiene el tracking continuo
  Future<void> detenerTracking() async {
    await _positionSubscription?.cancel();
    _positionSubscription = null;
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
