// Modelo de cliente dentro del pedido
class ClienteEntrega {
  final int id;
  final String razonSocial;
  final String telefono;

  ClienteEntrega({
    required this.id,
    required this.razonSocial,
    required this.telefono,
  });

  factory ClienteEntrega.fromJson(Map<String, dynamic> json) {
    return ClienteEntrega(
      id: json['id'] as int,
      razonSocial: json['razon_social'] as String? ?? '',
      telefono: json['telefono'] as String? ?? '',
    );
  }
}

// Modelo de pedido simplificado dentro de la entrega
class PedidoEntrega {
  final int id;
  final String codigoSeguimiento;
  final String estado;
  final String? fechaEntrega;
  final String direccionEntrega;
  final double? latitudEntrega;
  final double? longitudEntrega;
  final Map<String, dynamic>? rutaCalculada;
  final ClienteEntrega cliente;

  PedidoEntrega({
    required this.id,
    required this.codigoSeguimiento,
    required this.estado,
    this.fechaEntrega,
    required this.direccionEntrega,
    this.latitudEntrega,
    this.longitudEntrega,
    this.rutaCalculada,
    required this.cliente,
  });

  factory PedidoEntrega.fromJson(Map<String, dynamic> json) {
    return PedidoEntrega(
      id: json['id'] as int,
      codigoSeguimiento: json['codigo_seguimiento'] as String? ?? '',
      estado: json['estado'] as String? ?? '',
      fechaEntrega: json['fecha_entrega'] as String?,
      direccionEntrega: json['direccion_entrega'] as String? ?? '',
      latitudEntrega: _parseDoubleNullable(json['latitud_entrega']),
      longitudEntrega: _parseDoubleNullable(json['longitud_entrega']),
      rutaCalculada: json['ruta_calculada'] as Map<String, dynamic>?,
      cliente: ClienteEntrega.fromJson(json['cliente'] as Map<String, dynamic>),
    );
  }
}

// Modelo de camion dentro de la entrega
class CamionEntrega {
  final int id;
  final String placa;
  final String modelo;

  CamionEntrega({
    required this.id,
    required this.placa,
    required this.modelo,
  });

  factory CamionEntrega.fromJson(Map<String, dynamic> json) {
    return CamionEntrega(
      id: json['id'] as int,
      placa: json['placa'] as String? ?? '',
      modelo: json['modelo'] as String? ?? '',
    );
  }
}

// Modelo de conductor dentro de la entrega
class ConductorEntrega {
  final int id;
  final String nombreCompleto;
  final String telefono;

  ConductorEntrega({
    required this.id,
    required this.nombreCompleto,
    required this.telefono,
  });

  factory ConductorEntrega.fromJson(Map<String, dynamic> json) {
    return ConductorEntrega(
      id: json['id'] as int,
      nombreCompleto: json['nombre_completo'] as String? ?? '',
      telefono: json['telefono'] as String? ?? '',
    );
  }
}

// Modelo de posicion GPS
class PosicionGPS {
  final double latitud;
  final double longitud;
  final double? velocidadKmh;
  final double? direccionGrados;
  final double? precisionMetros;
  final String? timestamp;

  PosicionGPS({
    required this.latitud,
    required this.longitud,
    this.velocidadKmh,
    this.direccionGrados,
    this.precisionMetros,
    this.timestamp,
  });

  factory PosicionGPS.fromJson(Map<String, dynamic> json) {
    return PosicionGPS(
      latitud: _parseDouble(json['latitud']),
      longitud: _parseDouble(json['longitud']),
      velocidadKmh: _parseDoubleNullable(json['velocidad_kmh']),
      direccionGrados: _parseDoubleNullable(json['direccion_grados']),
      precisionMetros: _parseDoubleNullable(json['precision_metros']),
      timestamp: json['timestamp'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'latitud': latitud,
      'longitud': longitud,
      if (velocidadKmh != null) 'velocidad_kmh': velocidadKmh,
      if (direccionGrados != null) 'direccion_grados': direccionGrados,
      if (precisionMetros != null) 'precision_metros': precisionMetros,
      if (timestamp != null) 'timestamp': timestamp,
    };
  }
}

// Modelo principal de entrega con detalles completos
class Entrega {
  final int id;
  final int pedidoId;
  final int conductorId;
  final int camionId;
  final String? horaSalidaPlanta;
  final String? horaLlegadaCliente;
  final int? duracionMinutos;
  final String? rutaPlanificadaId;
  final int? desviacionesDetectadas;
  final double? porcentajeAdherencia;
  final bool? entregado;
  final String? firmaCliente;
  final String? fotoComprobante;
  final String? observacionesEntrega;
  final String? createdAt;
  final String? updatedAt;
  final PedidoEntrega pedido;
  final CamionEntrega camion;
  final ConductorEntrega conductor;

  Entrega({
    required this.id,
    required this.pedidoId,
    required this.conductorId,
    required this.camionId,
    this.horaSalidaPlanta,
    this.horaLlegadaCliente,
    this.duracionMinutos,
    this.rutaPlanificadaId,
    this.desviacionesDetectadas,
    this.porcentajeAdherencia,
    this.entregado,
    this.firmaCliente,
    this.fotoComprobante,
    this.observacionesEntrega,
    this.createdAt,
    this.updatedAt,
    required this.pedido,
    required this.camion,
    required this.conductor,
  });

  factory Entrega.fromJson(Map<String, dynamic> json) {
    return Entrega(
      id: json['id'] as int,
      pedidoId: json['pedido_id'] as int,
      conductorId: json['conductor_id'] as int,
      camionId: json['camion_id'] as int,
      horaSalidaPlanta: json['hora_salida_planta'] as String?,
      horaLlegadaCliente: json['hora_llegada_cliente'] as String?,
      duracionMinutos: json['duracion_minutos'] as int?,
      rutaPlanificadaId: json['ruta_planificada_id'] as String?,
      desviacionesDetectadas: json['desviaciones_detectadas'] as int?,
      porcentajeAdherencia: _parseDoubleNullable(json['porcentaje_adherencia']),
      entregado: json['entregado'] as bool?,
      firmaCliente: json['firma_cliente'] as String?,
      fotoComprobante: json['foto_comprobante'] as String?,
      observacionesEntrega: json['observaciones_entrega'] as String?,
      createdAt: json['created_at'] as String?,
      updatedAt: json['updated_at'] as String?,
      pedido: PedidoEntrega.fromJson(json['pedido'] as Map<String, dynamic>),
      camion: CamionEntrega.fromJson(json['camion'] as Map<String, dynamic>),
      conductor: ConductorEntrega.fromJson(json['conductor'] as Map<String, dynamic>),
    );
  }

  // Verifica si la entrega esta activa (en camino)
  bool get estaActiva => entregado == false && horaSalidaPlanta != null;
}

// Modelo de entrega activa (incluye posicion y estado calculado)
class EntregaActiva extends Entrega {
  final PosicionGPS? posicionActual;
  final double velocidadPromedioKmh;
  final bool estaDetenido;

  EntregaActiva({
    required super.id,
    required super.pedidoId,
    required super.conductorId,
    required super.camionId,
    super.horaSalidaPlanta,
    super.horaLlegadaCliente,
    super.duracionMinutos,
    super.rutaPlanificadaId,
    super.desviacionesDetectadas,
    super.porcentajeAdherencia,
    super.entregado,
    super.firmaCliente,
    super.fotoComprobante,
    super.observacionesEntrega,
    super.createdAt,
    super.updatedAt,
    required super.pedido,
    required super.camion,
    required super.conductor,
    this.posicionActual,
    required this.velocidadPromedioKmh,
    required this.estaDetenido,
  });

  factory EntregaActiva.fromJson(Map<String, dynamic> json) {
    return EntregaActiva(
      id: json['id'] as int,
      pedidoId: json['pedido_id'] as int,
      conductorId: json['conductor_id'] as int,
      camionId: json['camion_id'] as int,
      horaSalidaPlanta: json['hora_salida_planta'] as String?,
      horaLlegadaCliente: json['hora_llegada_cliente'] as String?,
      duracionMinutos: json['duracion_minutos'] as int?,
      rutaPlanificadaId: json['ruta_planificada_id'] as String?,
      desviacionesDetectadas: json['desviaciones_detectadas'] as int?,
      porcentajeAdherencia: _parseDoubleNullable(json['porcentaje_adherencia']),
      entregado: json['entregado'] as bool?,
      firmaCliente: json['firma_cliente'] as String?,
      fotoComprobante: json['foto_comprobante'] as String?,
      observacionesEntrega: json['observaciones_entrega'] as String?,
      createdAt: json['created_at'] as String?,
      updatedAt: json['updated_at'] as String?,
      pedido: PedidoEntrega.fromJson(json['pedido'] as Map<String, dynamic>),
      camion: CamionEntrega.fromJson(json['camion'] as Map<String, dynamic>),
      conductor: ConductorEntrega.fromJson(json['conductor'] as Map<String, dynamic>),
      posicionActual: json['posicion_actual'] != null
          ? PosicionGPS.fromJson(json['posicion_actual'] as Map<String, dynamic>)
          : null,
      velocidadPromedioKmh: _parseDouble(json['velocidad_promedio_kmh']),
      estaDetenido: json['esta_detenido'] as bool? ?? false,
    );
  }
}

// Modelo de evento de entrega (DETENIDO, REANUDO, SALIDA_PLANTA, etc)
class EventoEntrega {
  final int id;
  final int entregaId;
  final String tipoEvento;
  final String? descripcion;
  final double? latitud;
  final double? longitud;
  final String? createdAt;

  EventoEntrega({
    required this.id,
    required this.entregaId,
    required this.tipoEvento,
    this.descripcion,
    this.latitud,
    this.longitud,
    this.createdAt,
  });

  factory EventoEntrega.fromJson(Map<String, dynamic> json) {
    return EventoEntrega(
      id: json['id'] as int,
      entregaId: json['entrega_id'] as int,
      tipoEvento: json['tipo_evento'] as String,
      descripcion: json['descripcion'] as String?,
      latitud: _parseDoubleNullable(json['latitud']),
      longitud: _parseDoubleNullable(json['longitud']),
      createdAt: json['created_at'] as String?,
    );
  }
}

// Respuesta del estado de entrega (GET /entregas/:id)
class EstadoEntregaResponse {
  final Entrega entrega;
  final PosicionGPS? posicionActual;
  final double velocidadPromedioKmh;
  final bool estaDetenido;
  final String? etaActualizado;

  EstadoEntregaResponse({
    required this.entrega,
    this.posicionActual,
    required this.velocidadPromedioKmh,
    required this.estaDetenido,
    this.etaActualizado,
  });

  factory EstadoEntregaResponse.fromJson(Map<String, dynamic> json) {
    return EstadoEntregaResponse(
      entrega: Entrega.fromJson(json['entrega'] as Map<String, dynamic>),
      posicionActual: json['posicion_actual'] != null
          ? PosicionGPS.fromJson(json['posicion_actual'] as Map<String, dynamic>)
          : null,
      velocidadPromedioKmh: _parseDouble(json['velocidad_promedio_kmh']),
      estaDetenido: json['esta_detenido'] as bool? ?? false,
      etaActualizado: json['eta_actualizado'] as String?,
    );
  }
}

// Respuesta de iniciar entrega (POST /entregas/iniciar)
class IniciarEntregaResponse {
  final bool success;
  final Entrega? data;
  final String mensaje;
  final String? error;

  IniciarEntregaResponse({
    required this.success,
    this.data,
    required this.mensaje,
    this.error,
  });

  factory IniciarEntregaResponse.fromJson(Map<String, dynamic> json) {
    return IniciarEntregaResponse(
      success: json['success'] as bool,
      data: json['data'] != null
          ? Entrega.fromJson(json['data'] as Map<String, dynamic>)
          : null,
      mensaje: json['mensaje'] as String? ?? '',
      error: json['error'] as String?,
    );
  }
}

// Respuesta de registrar evento (POST /entregas/:id/evento)
class RegistrarEventoResponse {
  final bool success;
  final EventoEntrega? data;
  final String mensaje;
  final String? error;

  RegistrarEventoResponse({
    required this.success,
    this.data,
    required this.mensaje,
    this.error,
  });

  factory RegistrarEventoResponse.fromJson(Map<String, dynamic> json) {
    return RegistrarEventoResponse(
      success: json['success'] as bool,
      data: json['data'] != null
          ? EventoEntrega.fromJson(json['data'] as Map<String, dynamic>)
          : null,
      mensaje: json['mensaje'] as String? ?? '',
      error: json['error'] as String?,
    );
  }
}

// Respuesta de registrar GPS (POST /entregas/:id/gps)
class RegistrarGPSResponse {
  final bool success;
  final List<String> warnings;
  final String? etaActualizado;
  final PosicionGPS? posicionRegistrada;
  final String? error;

  RegistrarGPSResponse({
    required this.success,
    required this.warnings,
    this.etaActualizado,
    this.posicionRegistrada,
    this.error,
  });

  factory RegistrarGPSResponse.fromJson(Map<String, dynamic> json) {
    final data = json['data'] as Map<String, dynamic>?;
    return RegistrarGPSResponse(
      success: json['success'] as bool,
      warnings: data?['warnings'] != null
          ? List<String>.from(data!['warnings'] as List)
          : [],
      etaActualizado: data?['eta_actualizado'] as String?,
      posicionRegistrada: data?['posicion_registrada'] != null
          ? PosicionGPS.fromJson(data!['posicion_registrada'] as Map<String, dynamic>)
          : null,
      error: json['error'] as String?,
    );
  }
}

// Tipos de eventos de movimiento
enum TipoEventoMovimiento {
  detenido,
  reanudo,
}

extension TipoEventoMovimientoExtension on TipoEventoMovimiento {
  String get value {
    switch (this) {
      case TipoEventoMovimiento.detenido:
        return 'DETENIDO';
      case TipoEventoMovimiento.reanudo:
        return 'REANUDO';
    }
  }
}

// Motivos de detencion
enum MotivoDetencion {
  trafico,
  problemaMecanico,
  descanso,
  clienteNoDisponible,
  otro,
}

extension MotivoDetencionExtension on MotivoDetencion {
  String get value {
    switch (this) {
      case MotivoDetencion.trafico:
        return 'TRAFICO';
      case MotivoDetencion.problemaMecanico:
        return 'PROBLEMA_MECANICO';
      case MotivoDetencion.descanso:
        return 'DESCANSO';
      case MotivoDetencion.clienteNoDisponible:
        return 'CLIENTE_NO_DISPONIBLE';
      case MotivoDetencion.otro:
        return 'OTRO';
    }
  }

  String get label {
    switch (this) {
      case MotivoDetencion.trafico:
        return 'Trafico';
      case MotivoDetencion.problemaMecanico:
        return 'Problema mecanico';
      case MotivoDetencion.descanso:
        return 'Descanso';
      case MotivoDetencion.clienteNoDisponible:
        return 'Cliente no disponible';
      case MotivoDetencion.otro:
        return 'Otro';
    }
  }
}

// Helpers para parsear numeros
double _parseDouble(dynamic value) {
  if (value == null) return 0.0;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0.0;
  return 0.0;
}

double? _parseDoubleNullable(dynamic value) {
  if (value == null) return null;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}
