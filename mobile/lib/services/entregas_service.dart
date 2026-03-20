import 'package:dio/dio.dart';
import '../models/entrega.dart';
import 'api_service.dart';

class EntregasService {
  final ApiService _apiService = ApiService();

  // Iniciar una entrega para un pedido confirmado
  // POST /entregas/iniciar
  Future<EntregaResult> iniciarEntrega(int pedidoId) async {
    try {
      final response = await _apiService.dio.post(
        '/entregas/iniciar',
        data: {'pedido_id': pedidoId},
      );

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        if (data['success'] == true && data['data'] != null) {
          final entrega = Entrega.fromJson(data['data'] as Map<String, dynamic>);
          return EntregaResult(
            success: true,
            entrega: entrega,
            mensaje: data['mensaje'] as String? ?? 'Entrega iniciada',
          );
        }
        return EntregaResult(
          success: false,
          mensaje: data['error'] as String? ?? 'Error desconocido',
        );
      }

      return EntregaResult(success: false, mensaje: 'Error desconocido');
    } on DioException catch (e) {
      String mensaje = 'Error de conexion';
      if (e.response != null) {
        final data = e.response?.data;
        if (data is Map) {
          mensaje = data['error'] as String? ?? data['message'] as String? ?? mensaje;
        }
      }
      return EntregaResult(success: false, mensaje: mensaje);
    } catch (e) {
      return EntregaResult(success: false, mensaje: 'Error: $e');
    }
  }

  // Obtener estado actual de una entrega
  // GET /entregas/:id
  Future<EstadoEntregaResult> obtenerEstadoEntrega(int entregaId) async {
    try {
      final response = await _apiService.dio.get('/entregas/$entregaId');

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        if (data['success'] == true && data['data'] != null) {
          final estado = EstadoEntregaResponse.fromJson(data['data'] as Map<String, dynamic>);
          return EstadoEntregaResult(success: true, estado: estado);
        }
        return EstadoEntregaResult(
          success: false,
          mensaje: data['error'] as String? ?? 'Error desconocido',
        );
      }

      return EstadoEntregaResult(success: false, mensaje: 'Error desconocido');
    } on DioException catch (e) {
      String mensaje = 'Error de conexion';
      if (e.response != null) {
        final data = e.response?.data;
        if (data is Map) {
          mensaje = data['error'] as String? ?? data['message'] as String? ?? mensaje;
        }
      }
      return EstadoEntregaResult(success: false, mensaje: mensaje);
    } catch (e) {
      return EstadoEntregaResult(success: false, mensaje: 'Error: $e');
    }
  }

  // Registrar posicion GPS durante la entrega
  // POST /entregas/:id/gps
  Future<GPSResult> registrarPosicionGPS(
    int entregaId,
    double latitud,
    double longitud, {
    double? velocidadKmh,
    double? direccionGrados,
    double? precisionMetros,
    String? timestamp,
  }) async {
    try {
      final body = <String, dynamic>{
        'latitud': latitud,
        'longitud': longitud,
      };

      if (velocidadKmh != null) body['velocidad_kmh'] = velocidadKmh;
      if (direccionGrados != null) body['direccion_grados'] = direccionGrados;
      if (precisionMetros != null) body['precision_metros'] = precisionMetros;
      if (timestamp != null) body['timestamp'] = timestamp;

      final response = await _apiService.dio.post(
        '/entregas/$entregaId/gps',
        data: body,
      );

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        if (data['success'] == true) {
          final responseData = data['data'] as Map<String, dynamic>?;
          final warningsList = responseData?['warnings'] as List<dynamic>?;
          return GPSResult(
            success: true,
            etaActualizado: responseData?['eta_actualizado'] as String?,
            warnings: warningsList?.map((w) => w.toString()).toList() ?? [],
          );
        }
        return GPSResult(
          success: false,
          mensaje: data['error'] as String? ?? 'Error desconocido',
        );
      }

      return GPSResult(success: false, mensaje: 'Error desconocido');
    } on DioException catch (e) {
      String mensaje = 'Error de conexion';
      if (e.response != null) {
        final data = e.response?.data;
        if (data is Map) {
          mensaje = data['error'] as String? ?? data['message'] as String? ?? mensaje;
        }
      }
      return GPSResult(success: false, mensaje: mensaje);
    } catch (e) {
      return GPSResult(success: false, mensaje: 'Error: $e');
    }
  }

  // Registrar evento de movimiento (DETENIDO o REANUDO)
  // POST /entregas/:id/evento
  Future<EventoResult> registrarEvento(
    int entregaId,
    TipoEventoMovimiento tipo, {
    MotivoDetencion? motivo,
    String? descripcion,
    double? latitud,
    double? longitud,
  }) async {
    try {
      final body = <String, dynamic>{
        'tipo': tipo.value,
      };

      if (motivo != null) body['motivo'] = motivo.value;
      if (descripcion != null) body['descripcion'] = descripcion;
      if (latitud != null) body['latitud'] = latitud;
      if (longitud != null) body['longitud'] = longitud;

      final response = await _apiService.dio.post(
        '/entregas/$entregaId/evento',
        data: body,
      );

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        if (data['success'] == true && data['data'] != null) {
          final evento = EventoEntrega.fromJson(data['data'] as Map<String, dynamic>);
          return EventoResult(
            success: true,
            evento: evento,
            mensaje: data['mensaje'] as String? ?? 'Evento registrado',
          );
        }
        return EventoResult(
          success: false,
          mensaje: data['error'] as String? ?? 'Error desconocido',
        );
      }

      return EventoResult(success: false, mensaje: 'Error desconocido');
    } on DioException catch (e) {
      String mensaje = 'Error de conexion';
      if (e.response != null) {
        final data = e.response?.data;
        if (data is Map) {
          mensaje = data['error'] as String? ?? data['message'] as String? ?? mensaje;
        }
      }
      return EventoResult(success: false, mensaje: mensaje);
    } catch (e) {
      return EventoResult(success: false, mensaje: 'Error: $e');
    }
  }

  // Finalizar una entrega
  // PATCH /entregas/:id/finalizar
  Future<EntregaResult> finalizarEntrega(
    int entregaId, {
    String? firmaCliente,
    String? fotoComprobante,
    String? observaciones,
  }) async {
    try {
      final body = <String, dynamic>{};

      if (firmaCliente != null) body['firma_cliente'] = firmaCliente;
      if (fotoComprobante != null) body['foto_comprobante'] = fotoComprobante;
      if (observaciones != null) body['observaciones'] = observaciones;

      final response = await _apiService.dio.patch(
        '/entregas/$entregaId/finalizar',
        data: body,
      );

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        if (data['success'] == true && data['data'] != null) {
          // La respuesta contiene { entrega: {...}, metricas: {...} }
          final entregaData = data['data']['entrega'] as Map<String, dynamic>?;
          if (entregaData != null) {
            // El backend no devuelve EntregaConDetalle completo en finalizar
            // Solo la entrega basica, asi que creamos un resultado simplificado
            return EntregaResult(
              success: true,
              mensaje: data['mensaje'] as String? ?? 'Entrega finalizada',
            );
          }
        }
        return EntregaResult(
          success: false,
          mensaje: data['error'] as String? ?? 'Error desconocido',
        );
      }

      return EntregaResult(success: false, mensaje: 'Error desconocido');
    } on DioException catch (e) {
      String mensaje = 'Error de conexion';
      if (e.response != null) {
        final data = e.response?.data;
        if (data is Map) {
          mensaje = data['error'] as String? ?? data['message'] as String? ?? mensaje;
        }
      }
      return EntregaResult(success: false, mensaje: mensaje);
    } catch (e) {
      return EntregaResult(success: false, mensaje: 'Error: $e');
    }
  }

  // Obtener todas las entregas activas
  // GET /entregas/activas
  Future<EntregasActivasResult> obtenerEntregasActivas() async {
    try {
      final response = await _apiService.dio.get('/entregas/activas');

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        if (data['success'] == true && data['data'] != null) {
          final entregasData = data['data'] as List<dynamic>;
          final entregas = entregasData
              .map((e) => EntregaActiva.fromJson(e as Map<String, dynamic>))
              .toList();
          return EntregasActivasResult(success: true, entregas: entregas);
        }
        return EntregasActivasResult(
          success: false,
          mensaje: data['error'] as String? ?? 'Error desconocido',
        );
      }

      return EntregasActivasResult(success: false, mensaje: 'Error desconocido');
    } on DioException catch (e) {
      String mensaje = 'Error de conexion';
      if (e.response != null) {
        final data = e.response?.data;
        if (data is Map) {
          mensaje = data['error'] as String? ?? data['message'] as String? ?? mensaje;
        }
      }
      return EntregasActivasResult(success: false, mensaje: mensaje);
    } catch (e) {
      return EntregasActivasResult(success: false, mensaje: 'Error: $e');
    }
  }

  // Obtener historial de eventos de una entrega
  // GET /entregas/:id/eventos
  Future<EventosResult> obtenerEventos(int entregaId) async {
    try {
      final response = await _apiService.dio.get('/entregas/$entregaId/eventos');

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        if (data['success'] == true && data['data'] != null) {
          final eventosData = data['data']['eventos'] as List<dynamic>?;
          final eventos = eventosData
              ?.map((e) => EventoEntrega.fromJson(e as Map<String, dynamic>))
              .toList() ?? [];
          return EventosResult(success: true, eventos: eventos);
        }
        return EventosResult(
          success: false,
          mensaje: data['error'] as String? ?? 'Error desconocido',
        );
      }

      return EventosResult(success: false, mensaje: 'Error desconocido');
    } on DioException catch (e) {
      String mensaje = 'Error de conexion';
      if (e.response != null) {
        final data = e.response?.data;
        if (data is Map) {
          mensaje = data['error'] as String? ?? data['message'] as String? ?? mensaje;
        }
      }
      return EventosResult(success: false, mensaje: mensaje);
    } catch (e) {
      return EventosResult(success: false, mensaje: 'Error: $e');
    }
  }
}

// Resultado de operaciones con entrega
class EntregaResult {
  final bool success;
  final Entrega? entrega;
  final String? mensaje;

  EntregaResult({
    required this.success,
    this.entrega,
    this.mensaje,
  });
}

// Resultado de obtener estado de entrega
class EstadoEntregaResult {
  final bool success;
  final EstadoEntregaResponse? estado;
  final String? mensaje;

  EstadoEntregaResult({
    required this.success,
    this.estado,
    this.mensaje,
  });
}

// Resultado de registrar GPS
class GPSResult {
  final bool success;
  final String? etaActualizado;
  final String? mensaje;
  final List<String> warnings;

  GPSResult({
    required this.success,
    this.etaActualizado,
    this.mensaje,
    this.warnings = const [],
  });
}

// Resultado de registrar evento
class EventoResult {
  final bool success;
  final EventoEntrega? evento;
  final String? mensaje;

  EventoResult({
    required this.success,
    this.evento,
    this.mensaje,
  });
}

// Resultado de obtener eventos
class EventosResult {
  final bool success;
  final List<EventoEntrega>? eventos;
  final String? mensaje;

  EventosResult({
    required this.success,
    this.eventos,
    this.mensaje,
  });
}

// Resultado de obtener entregas activas
class EntregasActivasResult {
  final bool success;
  final List<EntregaActiva>? entregas;
  final String? mensaje;

  EntregasActivasResult({
    required this.success,
    this.entregas,
    this.mensaje,
  });
}
