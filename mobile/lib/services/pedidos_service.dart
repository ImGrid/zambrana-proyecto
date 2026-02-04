import 'package:dio/dio.dart';
import '../models/pedido.dart';
import 'api_service.dart';

class PedidosService {
  final ApiService _apiService = ApiService();

  // Obtener pedidos del conductor (filtra automaticamente por conductor en backend)
  Future<PedidosResult> getPedidos({int? estadoId, int limit = 20, int offset = 0}) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': limit,
        'offset': offset,
      };

      if (estadoId != null) {
        queryParams['estado_id'] = estadoId;
      }

      final response = await _apiService.dio.get(
        '/pedidos',
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        final pedidosResponse = PedidosResponse.fromJson(response.data);
        return PedidosResult(
          success: true,
          pedidos: pedidosResponse.pedidos,
          total: pedidosResponse.total,
        );
      }

      return PedidosResult(success: false, message: 'Error desconocido');
    } on DioException catch (e) {
      String message = 'Error de conexion';
      if (e.response != null) {
        final data = e.response?.data;
        if (data is Map) {
          message = data['message'] as String? ?? data['error'] as String? ?? message;
        }
      }
      return PedidosResult(success: false, message: message);
    } catch (e) {
      return PedidosResult(success: false, message: 'Error: $e');
    }
  }

  // Obtener pedido por ID
  Future<PedidoResult> getPedidoById(int id) async {
    try {
      final response = await _apiService.dio.get('/pedidos/$id');

      if (response.statusCode == 200) {
        final pedido = Pedido.fromJson(response.data);
        return PedidoResult(success: true, pedido: pedido);
      }

      return PedidoResult(success: false, message: 'Error desconocido');
    } on DioException catch (e) {
      String message = 'Error de conexion';
      if (e.response != null) {
        final data = e.response?.data;
        if (data is Map) {
          message = data['message'] as String? ?? data['error'] as String? ?? message;
        }
      }
      return PedidoResult(success: false, message: message);
    } catch (e) {
      return PedidoResult(success: false, message: 'Error: $e');
    }
  }
}

// Resultado de lista de pedidos
class PedidosResult {
  final bool success;
  final List<Pedido>? pedidos;
  final int? total;
  final String? message;

  PedidosResult({
    required this.success,
    this.pedidos,
    this.total,
    this.message,
  });
}

// Resultado de pedido individual
class PedidoResult {
  final bool success;
  final Pedido? pedido;
  final String? message;

  PedidoResult({
    required this.success,
    this.pedido,
    this.message,
  });
}
