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
    bool clearError = false,
    bool clearMensaje = false,
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
  Future<bool> iniciarTrackingGPS({int intervaloSegundos = 30}) async {
    if (state.entregaActiva == null) {
      state = state.copyWith(error: 'No hay entrega activa');
      return false;
    }

    final started = await _gpsService.iniciarTracking(
      onPosicion: _onNuevaPosicion,
      onError: (error) {
        state = state.copyWith(error: error);
      },
      intervaloSegundos: intervaloSegundos,
    );

    if (started) {
      state = state.copyWith(gpsActivo: true);
      // Iniciar timer para enviar posicion cada 30 segundos
      _iniciarTimerEnvioPosicion(intervaloSegundos);
    }

    return started;
  }

  // Callback cuando hay nueva posicion GPS
  void _onNuevaPosicion(PosicionActual posicion) {
    state = state.copyWith(
      posicionActual: posicion,
      velocidadPromedioKmh: posicion.velocidadKmh,
      // Detectar si esta detenido (velocidad < 5 km/h)
      estaDetenido: (posicion.velocidadKmh ?? 0) < 5,
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

  // Envia la posicion actual al servidor
  Future<void> _enviarPosicionAlServidor() async {
    if (state.entregaActiva == null || state.posicionActual == null) return;

    final posicion = state.posicionActual!;
    final result = await _entregasService.registrarPosicionGPS(
      state.entregaActiva!.id,
      posicion.latitud,
      posicion.longitud,
      velocidadKmh: posicion.velocidadKmh,
      direccionGrados: posicion.direccionGrados,
      precisionMetros: posicion.precisionMetros,
      timestamp: posicion.timestamp,
    );

    if (result.success && result.etaActualizado != null) {
      state = state.copyWith(etaActualizado: result.etaActualizado);
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

    // Detener tracking GPS antes de finalizar
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
      state = state.copyWith(
        entregaActiva: estadoData.entrega,
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

  // Limpia el estado completamente
  void reset() {
    detenerTrackingGPS();
    state = EntregaState();
  }
}

// Provider (Riverpod 3.x)
final entregaProvider = NotifierProvider<EntregaNotifier, EntregaState>(
  EntregaNotifier.new,
);
