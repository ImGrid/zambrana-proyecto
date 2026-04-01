import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/entrega.dart';
import '../services/entregas_service.dart';
import '../services/gps_service.dart';

// Estado de la entrega activa
class EntregaState {
  final bool isLoading;
  final Entrega? entregaActiva;
  final PosicionActual? posicionActual;
  final double? velocidadPromedioKmh;
  final bool estaDetenido;
  final String? etaActualizado;
  final bool gpsActivo;
  final String? error;
  final String? mensaje;
  final String? warning;

  EntregaState({
    this.isLoading = false,
    this.entregaActiva,
    this.posicionActual,
    this.velocidadPromedioKmh,
    this.estaDetenido = false,
    this.etaActualizado,
    this.gpsActivo = false,
    this.error,
    this.mensaje,
    this.warning,
  });

  EntregaState copyWith({
    bool? isLoading,
    Entrega? entregaActiva,
    PosicionActual? posicionActual,
    double? velocidadPromedioKmh,
    bool? estaDetenido,
    String? etaActualizado,
    bool? gpsActivo,
    String? error,
    String? mensaje,
    String? warning,
    bool clearError = false,
    bool clearMensaje = false,
    bool clearWarning = false,
    bool clearEntrega = false,
  }) {
    return EntregaState(
      isLoading: isLoading ?? this.isLoading,
      entregaActiva: clearEntrega ? null : (entregaActiva ?? this.entregaActiva),
      posicionActual: posicionActual ?? this.posicionActual,
      velocidadPromedioKmh: velocidadPromedioKmh ?? this.velocidadPromedioKmh,
      estaDetenido: estaDetenido ?? this.estaDetenido,
      etaActualizado: etaActualizado ?? this.etaActualizado,
      gpsActivo: gpsActivo ?? this.gpsActivo,
      error: clearError ? null : (error ?? this.error),
      mensaje: clearMensaje ? null : (mensaje ?? this.mensaje),
      warning: clearWarning ? null : (warning ?? this.warning),
    );
  }

  // La entrega esta en progreso si existe y no esta entregada
  bool get tieneEntregaActiva => entregaActiva != null && entregaActiva!.estaActiva;
}

// Notifier de entrega (Riverpod 3.x)
class EntregaNotifier extends Notifier<EntregaState> {
  final EntregasService _entregasService = EntregasService();
  final GPSService _gpsService = GPSService();
  Timer? _gpsTimer;
  Timer? _pollingTimer;

  @override
  EntregaState build() {
    return EntregaState();
  }

  // Carga una entrega existente por pedido_id (para pedidos EN_CAMINO)
  Future<bool> cargarEntregaPorPedido(int pedidoId) async {
    state = state.copyWith(isLoading: true, clearError: true);

    final result = await _entregasService.obtenerEntregasActivas();

    if (result.success && result.entregas != null) {
      // Buscar la entrega que corresponde a este pedido
      EntregaActiva? entregaActiva;
      for (final e in result.entregas!) {
        if (e.pedidoId == pedidoId) {
          entregaActiva = e;
          break;
        }
      }

      if (entregaActiva == null) {
        state = state.copyWith(
          isLoading: false,
          error: 'No se encontro entrega activa para este pedido',
        );
        return false;
      }

      // Convertir posicion del backend a PosicionActual del GPS service
      PosicionActual? posicion;
      if (entregaActiva.posicionActual != null) {
        posicion = PosicionActual(
          latitud: entregaActiva.posicionActual!.latitud,
          longitud: entregaActiva.posicionActual!.longitud,
          velocidadKmh: entregaActiva.posicionActual!.velocidadKmh,
          direccionGrados: entregaActiva.posicionActual!.direccionGrados,
          precisionMetros: entregaActiva.posicionActual!.precisionMetros,
          timestamp: entregaActiva.posicionActual!.timestamp,
        );
      }

      state = state.copyWith(
        isLoading: false,
        entregaActiva: entregaActiva,
        posicionActual: posicion,
        velocidadPromedioKmh: entregaActiva.velocidadPromedioKmh,
        estaDetenido: entregaActiva.estaDetenido,
      );

      // Iniciar polling para actualizar posicion periodicamente
      _iniciarPolling();
      return true;
    } else {
      state = state.copyWith(
        isLoading: false,
        error: result.mensaje ?? 'No se encontro entrega activa',
      );
      return false;
    }
  }

  // Inicia una entrega para un pedido
  Future<bool> iniciarEntrega(int pedidoId) async {
    state = state.copyWith(isLoading: true, clearError: true);

    final result = await _entregasService.iniciarEntrega(pedidoId);

    if (result.success && result.entrega != null) {
      state = state.copyWith(
        isLoading: false,
        entregaActiva: result.entrega,
        mensaje: result.mensaje ?? 'Entrega iniciada',
      );
      return true;
    } else {
      state = state.copyWith(
        isLoading: false,
        error: result.mensaje ?? 'Error al iniciar entrega',
      );
      return false;
    }
  }

  // Inicia el tracking GPS y envio periodico al servidor
  Future<bool> iniciarTrackingGPS({int intervaloSegundos = 10}) async {
    if (state.entregaActiva == null) {
      state = state.copyWith(error: 'No hay entrega activa');
      return false;
    }

    // Obtener posicion inicial antes de arrancar el stream.
    // Esto garantiza que posicionActual no sea null desde el segundo 0
    // y el servidor reciba la primera coordenada inmediatamente.
    final posInicial = await _gpsService.obtenerPosicionActual();
    if (posInicial.success && posInicial.posicion != null) {
      _onNuevaPosicion(posInicial.posicion!);
      // Enviar posicion inicial al servidor sin esperar al timer
      _enviarPosicionAlServidor();
    }

    final started = await _gpsService.iniciarTracking(
      onPosicion: _onNuevaPosicion,
      onError: (error) {
        state = state.copyWith(error: error);
      },
      intervaloSegundos: intervaloSegundos,
    );

    if (started) {
      // GPS local toma el control, detener polling del servidor
      _detenerPolling();
      state = state.copyWith(gpsActivo: true);
      // Iniciar timer para enviar posicion cada N segundos
      _iniciarTimerEnvioPosicion(intervaloSegundos);
    } else {
      // El stream no arranco pero tenemos posicion inicial,
      // usar polling como fallback para seguir enviando
      if (state.posicionActual != null) {
        state = state.copyWith(
          gpsActivo: true,
          warning: 'GPS en modo fallback: usando posicion puntual',
        );
        _iniciarTimerEnvioPosicion(intervaloSegundos);
      }
    }

    return started || state.posicionActual != null;
  }

  // Callback cuando hay nueva posicion GPS
  // No determina estaDetenido localmente - el servidor lo calcula
  // con logica hibrida (eventos + velocidad promedio + buffer temporal)
  void _onNuevaPosicion(PosicionActual posicion) {
    state = state.copyWith(
      posicionActual: posicion,
      velocidadPromedioKmh: posicion.velocidadKmh,
    );
  }

  // Timer para enviar posicion al servidor
  void _iniciarTimerEnvioPosicion(int intervaloSegundos) {
    _gpsTimer?.cancel();
    _gpsTimer = Timer.periodic(
      Duration(seconds: intervaloSegundos),
      (_) => _enviarPosicionAlServidor(),
    );
  }

  // Inicia polling periodico al servidor para obtener posicion actualizada
  void _iniciarPolling({int intervaloSegundos = 10}) {
    _detenerPolling();
    _pollingTimer = Timer.periodic(
      Duration(seconds: intervaloSegundos),
      (_) => actualizarEstadoEntrega(),
    );
  }

  // Detiene el polling periodico
  void _detenerPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  int _enviosFallidos = 0;
  String? _ultimoTimestampEnviado;
  double? _ultimaLatEnviada;
  double? _ultimaLonEnviada;
  DateTime? _ultimoEnvioExitoso;

  // Envia la posicion actual al servidor
  // Filtra duplicados: no reenvia si es la misma lectura GPS o
  // si la distancia es menor a 5m (excepto heartbeat cada 120s)
  Future<void> _enviarPosicionAlServidor() async {
    if (state.entregaActiva == null) return;

    // Si no hay posicion del stream, intentar obtener una puntual
    if (state.posicionActual == null) {
      final posPuntual = await _gpsService.obtenerPosicionActual();
      if (posPuntual.success && posPuntual.posicion != null) {
        _onNuevaPosicion(posPuntual.posicion!);
      } else {
        _enviosFallidos++;
        if (_enviosFallidos >= 3) {
          state = state.copyWith(
            warning: 'Sin senal GPS. Verifica que la ubicacion este activada.',
          );
        }
        return;
      }
    }

    final posicion = state.posicionActual!;

    // Filtro de duplicados: no reenviar la misma lectura GPS
    if (_ultimoTimestampEnviado != null &&
        posicion.timestamp == _ultimoTimestampEnviado) {
      // Mismo timestamp exacto = misma lectura, no reenviar
      // Excepto heartbeat cada 120 segundos para confirmar que seguimos vivos
      if (_ultimoEnvioExitoso != null) {
        final segundosDesdeUltimo = DateTime.now().difference(_ultimoEnvioExitoso!).inSeconds;
        if (segundosDesdeUltimo < 120) return;
      }
    }

    // Filtro de distancia minima: no enviar si se movio menos de 5 metros
    if (_ultimaLatEnviada != null && _ultimaLonEnviada != null) {
      final distancia = _gpsService.calcularDistancia(
        _ultimaLatEnviada!, _ultimaLonEnviada!,
        posicion.latitud, posicion.longitud,
      );
      if (distancia < 5) {
        // Menos de 5 metros, no enviar (excepto heartbeat cada 120s)
        if (_ultimoEnvioExitoso != null) {
          final segundosDesdeUltimo = DateTime.now().difference(_ultimoEnvioExitoso!).inSeconds;
          if (segundosDesdeUltimo < 120) return;
        }
      }
    }

    final result = await _entregasService.registrarPosicionGPS(
      state.entregaActiva!.id,
      posicion.latitud,
      posicion.longitud,
      velocidadKmh: posicion.velocidadKmh,
      direccionGrados: posicion.direccionGrados,
      precisionMetros: posicion.precisionMetros,
      timestamp: posicion.timestamp,
    );

    if (result.success) {
      _enviosFallidos = 0;
      _ultimoTimestampEnviado = posicion.timestamp;
      _ultimaLatEnviada = posicion.latitud;
      _ultimaLonEnviada = posicion.longitud;
      _ultimoEnvioExitoso = DateTime.now();
      if (result.etaActualizado != null) {
        state = state.copyWith(etaActualizado: result.etaActualizado);
      }
      if (result.warnings.isNotEmpty) {
        state = state.copyWith(warning: result.warnings.first);
      }
    } else {
      _enviosFallidos++;
      if (_enviosFallidos >= 3) {
        state = state.copyWith(
          warning: 'Error enviando GPS al servidor. Reintentando...',
        );
      }
    }
  }

  // Detiene el tracking GPS
  Future<void> detenerTrackingGPS() async {
    _gpsTimer?.cancel();
    _gpsTimer = null;
    await _gpsService.detenerTracking();
    state = state.copyWith(gpsActivo: false);
  }

  // Registra un evento de detencion
  Future<bool> reportarDetencion({
    required MotivoDetencion motivo,
    String? descripcion,
  }) async {
    if (state.entregaActiva == null) {
      state = state.copyWith(error: 'No hay entrega activa');
      return false;
    }

    state = state.copyWith(isLoading: true, clearError: true);

    final result = await _entregasService.registrarEvento(
      state.entregaActiva!.id,
      TipoEventoMovimiento.detenido,
      motivo: motivo,
      descripcion: descripcion,
      latitud: state.posicionActual?.latitud,
      longitud: state.posicionActual?.longitud,
    );

    if (result.success) {
      state = state.copyWith(
        isLoading: false,
        estaDetenido: true,
        mensaje: result.mensaje ?? 'Detencion reportada',
      );
      return true;
    } else {
      state = state.copyWith(
        isLoading: false,
        error: result.mensaje ?? 'Error al reportar detencion',
      );
      return false;
    }
  }

  // Registra un evento de reanudacion
  Future<bool> reportarReanudacion({String? descripcion}) async {
    if (state.entregaActiva == null) {
      state = state.copyWith(error: 'No hay entrega activa');
      return false;
    }

    state = state.copyWith(isLoading: true, clearError: true);

    final result = await _entregasService.registrarEvento(
      state.entregaActiva!.id,
      TipoEventoMovimiento.reanudo,
      descripcion: descripcion,
      latitud: state.posicionActual?.latitud,
      longitud: state.posicionActual?.longitud,
    );

    if (result.success) {
      state = state.copyWith(
        isLoading: false,
        estaDetenido: false,
        mensaje: result.mensaje ?? 'Reanudacion reportada',
      );
      return true;
    } else {
      state = state.copyWith(
        isLoading: false,
        error: result.mensaje ?? 'Error al reportar reanudacion',
      );
      return false;
    }
  }

  // Finaliza la entrega actual
  Future<bool> finalizarEntrega({
    String? firmaCliente,
    String? fotoComprobante,
    String? observaciones,
  }) async {
    if (state.entregaActiva == null) {
      state = state.copyWith(error: 'No hay entrega activa');
      return false;
    }

    state = state.copyWith(isLoading: true, clearError: true);

    // Detener polling y tracking GPS antes de finalizar
    _detenerPolling();
    await detenerTrackingGPS();

    final result = await _entregasService.finalizarEntrega(
      state.entregaActiva!.id,
      firmaCliente: firmaCliente,
      fotoComprobante: fotoComprobante,
      observaciones: observaciones,
    );

    if (result.success) {
      state = state.copyWith(
        isLoading: false,
        clearEntrega: true,
        mensaje: result.mensaje ?? 'Entrega finalizada',
      );
      return true;
    } else {
      state = state.copyWith(
        isLoading: false,
        error: result.mensaje ?? 'Error al finalizar entrega',
      );
      return false;
    }
  }

  // Obtiene el estado actual de la entrega desde el servidor
  Future<void> actualizarEstadoEntrega() async {
    if (state.entregaActiva == null) return;

    final result = await _entregasService.obtenerEstadoEntrega(state.entregaActiva!.id);

    if (result.success && result.estado != null) {
      final estadoData = result.estado!;

      // Convertir PosicionGPS del backend a PosicionActual
      PosicionActual? posicion;
      if (estadoData.posicionActual != null) {
        posicion = PosicionActual(
          latitud: estadoData.posicionActual!.latitud,
          longitud: estadoData.posicionActual!.longitud,
          velocidadKmh: estadoData.posicionActual!.velocidadKmh,
          direccionGrados: estadoData.posicionActual!.direccionGrados,
          precisionMetros: estadoData.posicionActual!.precisionMetros,
          timestamp: estadoData.posicionActual!.timestamp,
        );
      }

      state = state.copyWith(
        entregaActiva: estadoData.entrega,
        posicionActual: posicion,
        velocidadPromedioKmh: estadoData.velocidadPromedioKmh,
        estaDetenido: estadoData.estaDetenido,
        etaActualizado: estadoData.etaActualizado,
      );
    }
  }

  // Limpia mensajes y errores
  void clearError() {
    state = state.copyWith(clearError: true);
  }

  void clearMensaje() {
    state = state.copyWith(clearMensaje: true);
  }

  void clearWarning() {
    state = state.copyWith(clearWarning: true);
  }

  // Limpia el estado completamente
  void reset() {
    _detenerPolling();
    detenerTrackingGPS();
    _enviosFallidos = 0;
    _ultimoTimestampEnviado = null;
    _ultimaLatEnviada = null;
    _ultimaLonEnviada = null;
    _ultimoEnvioExitoso = null;
    state = EntregaState();
  }
}

// Provider (Riverpod 3.x)
final entregaProvider = NotifierProvider<EntregaNotifier, EntregaState>(
  EntregaNotifier.new,
);
