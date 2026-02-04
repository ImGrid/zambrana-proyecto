// Modelo de pedido
class Pedido {
  final int id;
  final String codigoSeguimiento;
  final String clienteRazonSocial;
  final String clienteNombre;
  final String estadoNombre;
  final String direccionEntrega;
  final String fechaPedido;
  final String? fechaEntregaSolicitada;
  final double totalM3;
  final double montoTotal;
  final String? camionPlaca;
  final String? conductorNombre;
  final double? latitudEntrega;
  final double? longitudEntrega;
  final double? distanciaKm;
  final int? etaMinutos;
  final Map<String, dynamic>? rutaCalculada;

  Pedido({
    required this.id,
    required this.codigoSeguimiento,
    required this.clienteRazonSocial,
    required this.clienteNombre,
    required this.estadoNombre,
    required this.direccionEntrega,
    required this.fechaPedido,
    this.fechaEntregaSolicitada,
    required this.totalM3,
    required this.montoTotal,
    this.camionPlaca,
    this.conductorNombre,
    this.latitudEntrega,
    this.longitudEntrega,
    this.distanciaKm,
    this.etaMinutos,
    this.rutaCalculada,
  });

  factory Pedido.fromJson(Map<String, dynamic> json) {
    return Pedido(
      id: json['id'] as int,
      codigoSeguimiento: json['codigo_seguimiento'] as String,
      clienteRazonSocial: json['cliente_razon_social'] as String? ?? '',
      clienteNombre: json['cliente_nombre'] as String? ?? '',
      estadoNombre: json['estado_nombre'] as String? ?? '',
      direccionEntrega: json['direccion_entrega'] as String,
      fechaPedido: json['fecha_pedido'] as String,
      fechaEntregaSolicitada: json['fecha_entrega_solicitada'] as String?,
      totalM3: _parseDouble(json['total_m3']),
      montoTotal: _parseDouble(json['monto_total']),
      camionPlaca: json['camion_placa'] as String?,
      conductorNombre: json['conductor_nombre'] as String?,
      latitudEntrega: _parseDoubleNullable(json['latitud_entrega']),
      longitudEntrega: _parseDoubleNullable(json['longitud_entrega']),
      distanciaKm: _parseDoubleNullable(json['distancia_km']),
      etaMinutos: json['eta_minutos'] as int?,
      rutaCalculada: json['ruta_calculada'] as Map<String, dynamic>?,
    );
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  static double? _parseDoubleNullable(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }
}

// Respuesta de lista de pedidos
class PedidosResponse {
  final List<Pedido> pedidos;
  final int total;
  final int limit;
  final int offset;

  PedidosResponse({
    required this.pedidos,
    required this.total,
    required this.limit,
    required this.offset,
  });

  factory PedidosResponse.fromJson(Map<String, dynamic> json) {
    final pedidosList = (json['pedidos'] as List<dynamic>)
        .map((e) => Pedido.fromJson(e as Map<String, dynamic>))
        .toList();

    return PedidosResponse(
      pedidos: pedidosList,
      total: json['total'] as int,
      limit: json['limit'] as int,
      offset: json['offset'] as int,
    );
  }
}
