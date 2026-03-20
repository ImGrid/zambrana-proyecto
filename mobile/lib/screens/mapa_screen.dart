import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import '../models/pedido.dart';
import '../models/entrega.dart';
import '../providers/entrega_provider.dart';
import '../services/gps_service.dart';

class MapaScreen extends ConsumerStatefulWidget {
  final Pedido pedido;

  const MapaScreen({super.key, required this.pedido});

  @override
  ConsumerState<MapaScreen> createState() => _MapaScreenState();
}

class _MapaScreenState extends ConsumerState<MapaScreen>
    with WidgetsBindingObserver {
  final MapController _mapController = MapController();
  final GPSService _gpsService = GPSService();
  bool _entregaCargada = false;

  // Coordenadas de la planta Zambrana
  static const LatLng plantaCoords = LatLng(-17.386140315699063, -66.19983962614776);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Si el pedido esta EN_CAMINO, cargar la entrega existente
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _cargarEntregaSiExiste();
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _reconectarTrackingSiNecesario();
    }
  }

  // Si hay entrega activa pero el GPS no esta trackeando, reiniciar
  Future<void> _reconectarTrackingSiNecesario() async {
    final entregaState = ref.read(entregaProvider);
    if (entregaState.tieneEntregaActiva && !entregaState.gpsActivo) {
      await ref.read(entregaProvider.notifier).iniciarTrackingGPS();
    }
  }

  Future<void> _cargarEntregaSiExiste() async {
    if (widget.pedido.estadoNombre.toUpperCase() == 'EN_CAMINO' && !_entregaCargada) {
      _entregaCargada = true;
      final loaded = await ref.read(entregaProvider.notifier).cargarEntregaPorPedido(widget.pedido.id);
      if (loaded) {
        await ref.read(entregaProvider.notifier).iniciarTrackingGPS();
      }
    }
  }

  LatLng? get clienteCoords {
    if (widget.pedido.latitudEntrega != null && widget.pedido.longitudEntrega != null) {
      return LatLng(widget.pedido.latitudEntrega!, widget.pedido.longitudEntrega!);
    }
    return null;
  }

  List<LatLng> get rutaPuntos {
    final puntos = <LatLng>[];

    // Si tiene ruta calculada de Neo4j, usar esos puntos
    final ruta = widget.pedido.rutaCalculada;
    if (ruta != null && ruta['nodos'] != null) {
      final nodos = ruta['nodos'] as List<dynamic>;
      for (final nodo in nodos) {
        final lat = nodo['latitud'];
        final lng = nodo['longitud'];
        if (lat != null && lng != null) {
          puntos.add(LatLng(
            (lat is int) ? lat.toDouble() : lat as double,
            (lng is int) ? lng.toDouble() : lng as double,
          ));
        }
      }
    }

    // Si no hay ruta de Neo4j, usar linea directa
    if (puntos.isEmpty) {
      puntos.add(plantaCoords);
      if (clienteCoords != null) {
        puntos.add(clienteCoords!);
      }
    }

    return puntos;
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    // No detenemos el tracking porque continua via foreground service
    super.dispose();
  }

  // Verifica si el conductor esta cerca del destino (menos de 100 metros)
  bool _estaCercaDelDestino(PosicionActual? posicion) {
    if (posicion == null || clienteCoords == null) return false;

    final distancia = _gpsService.calcularDistancia(
      posicion.latitud,
      posicion.longitud,
      clienteCoords!.latitude,
      clienteCoords!.longitude,
    );

    return distancia < 100; // menos de 100 metros
  }

  void _mostrarDialogoDetencion() {
    MotivoDetencion? motivoSeleccionado;
    final descripcionController = TextEditingController();

    showDialog(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Reportar detencion'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Selecciona el motivo de la detencion:'),
              const SizedBox(height: 16),
              Column(
                children: MotivoDetencion.values.map((motivo) {
                  return RadioListTile<MotivoDetencion>(
                    title: Text(motivo.label),
                    value: motivo,
                    groupValue: motivoSeleccionado,
                    onChanged: (value) {
                      setDialogState(() {
                        motivoSeleccionado = value;
                      });
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: descripcionController,
                decoration: const InputDecoration(
                  labelText: 'Descripcion adicional (opcional)',
                  border: OutlineInputBorder(),
                ),
                maxLines: 2,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: motivoSeleccionado == null ? null : () async {
                Navigator.pop(dialogContext);
                await ref.read(entregaProvider.notifier).reportarDetencion(
                  motivo: motivoSeleccionado!,
                  descripcion: descripcionController.text.isNotEmpty
                      ? descripcionController.text
                      : null,
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
              ),
              child: const Text('Reportar'),
            ),
          ],
        ),
      ),
    );
  }

  // Muestra informacion de la planta al hacer tap en el marcador
  void _mostrarInfoPlanta() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.green.shade100,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.home, color: Colors.green.shade700, size: 28),
                ),
                const SizedBox(width: 16),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Planta Agregados Zambrana',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Punto de origen',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 12),
            _buildInfoRow(Icons.location_on, 'Ubicacion', 'Agregados, Cochabamba'),
            _buildInfoRow(Icons.access_time, 'Horario', 'Lun-Sab 7:00 - 18:00'),
            _buildInfoRow(Icons.phone, 'Telefono', '+591 4 4360000'),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  // Muestra informacion del cliente al hacer tap en el marcador
  void _mostrarInfoCliente() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade100,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.location_on, color: Colors.red.shade700, size: 28),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.pedido.clienteNombre,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const Text(
                        'Destino de entrega',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 12),
            _buildInfoRow(Icons.business, 'Razon social', widget.pedido.clienteRazonSocial),
            _buildInfoRow(Icons.location_on, 'Direccion', widget.pedido.direccionEntrega),
            _buildInfoRow(Icons.inventory_2, 'Pedido', widget.pedido.codigoSeguimiento),
            _buildInfoRow(Icons.straighten, 'Cantidad', '${widget.pedido.totalM3} m3'),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  // Muestra informacion del conductor al hacer tap en el marcador
  void _mostrarInfoConductor(EntregaState state) {
    final entrega = state.entregaActiva;
    if (entrega == null) return;

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: state.estaDetenido ? Colors.orange.shade100 : Colors.blue.shade100,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    state.estaDetenido ? Icons.pause : Icons.local_shipping,
                    color: state.estaDetenido ? Colors.orange.shade700 : Colors.blue.shade700,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        entrega.conductor.nombreCompleto,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        state.estaDetenido ? 'Detenido' : 'En movimiento',
                        style: TextStyle(
                          color: state.estaDetenido ? Colors.orange : Colors.blue,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 12),
            _buildInfoRow(Icons.local_shipping, 'Camion', entrega.camion.placa),
            _buildInfoRow(Icons.directions_car, 'Modelo', entrega.camion.modelo),
            _buildInfoRow(Icons.phone, 'Telefono', entrega.conductor.telefono),
            _buildInfoRow(
              Icons.speed,
              'Velocidad',
              '${state.velocidadPromedioKmh?.toStringAsFixed(1) ?? "0.0"} km/h',
            ),
            if (state.posicionActual != null)
              _buildInfoRow(
                Icons.my_location,
                'Precision GPS',
                '${state.posicionActual!.precisionMetros?.toStringAsFixed(0) ?? "?"} metros',
              ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  // Widget auxiliar para filas de informacion
  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey.shade600),
          const SizedBox(width: 12),
          Text(
            '$label: ',
            style: TextStyle(
              color: Colors.grey.shade600,
              fontWeight: FontWeight.w500,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w600),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  void _mostrarDialogoFinalizacion() {
    final observacionesController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Finalizar entrega'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Confirma que has entregado el material al cliente.'),
            const SizedBox(height: 16),
            TextField(
              controller: observacionesController,
              decoration: const InputDecoration(
                labelText: 'Observaciones (opcional)',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              final success = await ref.read(entregaProvider.notifier).finalizarEntrega(
                observaciones: observacionesController.text.isNotEmpty
                    ? observacionesController.text
                    : null,
              );
              if (success && mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Entrega finalizada exitosamente'),
                    backgroundColor: Colors.green,
                  ),
                );
                Navigator.pop(context); // Volver a la lista de pedidos
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
            ),
            child: const Text('Finalizar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final entregaState = ref.watch(entregaProvider);

    // Escuchar cambios de error y mensaje
    ref.listen<EntregaState>(entregaProvider, (previous, next) {
      if (next.error != null && next.error != previous?.error) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.error!),
            backgroundColor: Colors.red,
          ),
        );
        ref.read(entregaProvider.notifier).clearError();
      }
      if (next.mensaje != null && next.mensaje != previous?.mensaje) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.mensaje!),
            backgroundColor: Colors.green,
          ),
        );
        ref.read(entregaProvider.notifier).clearMensaje();
      }
      if (next.warning != null && next.warning != previous?.warning) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.warning_amber, color: Colors.white),
                const SizedBox(width: 8),
                Expanded(child: Text(next.warning!)),
              ],
            ),
            backgroundColor: Colors.orange.shade800,
            duration: const Duration(seconds: 5),
          ),
        );
        ref.read(entregaProvider.notifier).clearWarning();
      }
    });

    final conductorCoords = entregaState.posicionActual != null
        ? LatLng(entregaState.posicionActual!.latitud, entregaState.posicionActual!.longitud)
        : null;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.pedido.codigoSeguimiento),
        backgroundColor: const Color(0xFFFF6B35),
        foregroundColor: Colors.white,
        actions: [
          // Indicador de GPS activo
          if (entregaState.gpsActivo)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Row(
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: const BoxDecoration(
                      color: Colors.green,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Text('GPS', style: TextStyle(fontSize: 12)),
                ],
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          // Barra de estado si hay entrega activa
          if (entregaState.tieneEntregaActiva)
            _buildBarraEstado(entregaState),

          // Mapa
          Expanded(
            flex: 3,
            child: FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: conductorCoords ?? clienteCoords ?? plantaCoords,
                initialZoom: 14,
              ),
              children: [
                // Tiles de OpenStreetMap
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.zambrana.conductor',
                ),

                // Ruta
                if (rutaPuntos.length > 1)
                  PolylineLayer(
                    polylines: [
                      Polyline(
                        points: rutaPuntos,
                        color: Colors.blue,
                        strokeWidth: 4,
                      ),
                    ],
                  ),

                // Marcadores
                MarkerLayer(
                  markers: [
                    // Marcador de la planta
                    Marker(
                      point: plantaCoords,
                      width: 50,
                      height: 50,
                      child: GestureDetector(
                        onTap: _mostrarInfoPlanta,
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.green,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 3),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.3),
                                blurRadius: 4,
                              ),
                            ],
                          ),
                          child: const Icon(Icons.home, color: Colors.white, size: 24),
                        ),
                      ),
                    ),

                    // Marcador del cliente
                    if (clienteCoords != null)
                      Marker(
                        point: clienteCoords!,
                        width: 50,
                        height: 50,
                        child: GestureDetector(
                          onTap: _mostrarInfoCliente,
                          child: Container(
                            decoration: BoxDecoration(
                              color: Colors.red,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 3),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.3),
                                  blurRadius: 4,
                                ),
                              ],
                            ),
                            child: const Icon(Icons.location_on, color: Colors.white, size: 24),
                          ),
                        ),
                      ),

                    // Marcador del conductor (si hay posicion GPS)
                    if (conductorCoords != null)
                      Marker(
                        point: conductorCoords,
                        width: 50,
                        height: 50,
                        child: GestureDetector(
                          onTap: () => _mostrarInfoConductor(entregaState),
                          child: Container(
                            decoration: BoxDecoration(
                              color: entregaState.estaDetenido ? Colors.orange : Colors.blue,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 3),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.3),
                                  blurRadius: 4,
                                ),
                              ],
                            ),
                            child: Icon(
                              entregaState.estaDetenido ? Icons.pause : Icons.local_shipping,
                              color: Colors.white,
                              size: 24,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),

          // Info del pedido y controles
          Container(
            color: Colors.white,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Cliente y estado
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        widget.pedido.clienteNombre,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: _getEstadoColor(widget.pedido.estadoNombre).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        widget.pedido.estadoNombre,
                        style: TextStyle(
                          color: _getEstadoColor(widget.pedido.estadoNombre),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Direccion
                Row(
                  children: [
                    Icon(Icons.location_on, size: 18, color: Colors.grey.shade600),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        widget.pedido.direccionEntrega,
                        style: TextStyle(color: Colors.grey.shade700),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Metricas
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildMetrica(
                      Icons.straighten,
                      '${widget.pedido.totalM3}',
                      'm3',
                    ),
                    if (widget.pedido.distanciaKm != null)
                      _buildMetrica(
                        Icons.route,
                        widget.pedido.distanciaKm!.toStringAsFixed(1),
                        'km',
                      ),
                    if (entregaState.velocidadPromedioKmh != null)
                      _buildMetrica(
                        Icons.speed,
                        entregaState.velocidadPromedioKmh!.toStringAsFixed(0),
                        'km/h',
                      )
                    else if (widget.pedido.etaMinutos != null)
                      _buildMetrica(
                        Icons.schedule,
                        '${widget.pedido.etaMinutos}',
                        'min',
                      ),
                  ],
                ),
                const SizedBox(height: 16),

                // Botones de accion
                _buildBotonesAccion(entregaState),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(top: 80),
        child: FloatingActionButton.small(
          onPressed: () {
            // Centrar mapa segun estado
            if (conductorCoords != null) {
              _mapController.move(conductorCoords, 16);
            } else if (rutaPuntos.isNotEmpty) {
              final bounds = LatLngBounds.fromPoints(rutaPuntos);
              _mapController.fitCamera(
                CameraFit.bounds(
                  bounds: bounds,
                  padding: const EdgeInsets.all(50),
                ),
              );
            }
          },
          backgroundColor: Colors.white,
          child: const Icon(Icons.center_focus_strong, color: Color(0xFFFF6B35), size: 20),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endTop,
    );
  }

  // Barra de estado superior durante entrega activa
  Widget _buildBarraEstado(EntregaState state) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: state.estaDetenido ? Colors.orange.shade100 : Colors.blue.shade100,
      child: Row(
        children: [
          Icon(
            state.estaDetenido ? Icons.pause_circle : Icons.local_shipping,
            color: state.estaDetenido ? Colors.orange : Colors.blue,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              state.estaDetenido ? 'DETENIDO' : 'EN CAMINO',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: state.estaDetenido ? Colors.orange.shade800 : Colors.blue.shade800,
              ),
            ),
          ),
          if (state.etaActualizado != null)
            Text(
              'ETA: ${_formatearETA(state.etaActualizado!)}',
              style: TextStyle(
                color: Colors.grey.shade700,
                fontSize: 12,
              ),
            ),
        ],
      ),
    );
  }

  // Botones de accion segun el estado
  Widget _buildBotonesAccion(EntregaState state) {
    final estadoPedido = widget.pedido.estadoNombre.toUpperCase();

    // Si esta cargando, mostrar indicador
    if (state.isLoading) {
      return const SizedBox(
        width: double.infinity,
        height: 50,
        child: Center(child: CircularProgressIndicator()),
      );
    }

    // Si ya tiene entrega activa, mostrar controles de entrega
    if (state.tieneEntregaActiva) {
      return Column(
        children: [
          // Botones de estado (detenido/reanudado)
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: state.estaDetenido
                      ? () => ref.read(entregaProvider.notifier).reportarReanudacion()
                      : _mostrarDialogoDetencion,
                  icon: Icon(state.estaDetenido ? Icons.play_arrow : Icons.pause),
                  label: Text(state.estaDetenido ? 'Reanudar' : 'Reportar detencion'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: state.estaDetenido ? Colors.green : Colors.orange,
                    side: BorderSide(
                      color: state.estaDetenido ? Colors.green : Colors.orange,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Boton finalizar entrega
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton.icon(
              onPressed: _mostrarDialogoFinalizacion,
              icon: const Icon(Icons.check_circle),
              label: Text(
                _estaCercaDelDestino(state.posicionActual)
                    ? 'Finalizar Entrega'
                    : 'Finalizar Entrega (lejos del destino)',
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ],
      );
    }

    // Si el pedido esta EN_CAMINO pero no tenemos la entrega cargada
    // La carga se hace en initState, aqui solo mostramos loading
    if (estadoPedido == 'EN_CAMINO') {
      return const SizedBox(
        width: double.infinity,
        height: 50,
        child: Center(child: CircularProgressIndicator()),
      );
    }

    // Si el pedido esta CONFIRMADO, mostrar boton de iniciar
    if (estadoPedido == 'CONFIRMADO') {
      return SizedBox(
        width: double.infinity,
        height: 50,
        child: ElevatedButton.icon(
          onPressed: () async {
            final success = await ref.read(entregaProvider.notifier).iniciarEntrega(widget.pedido.id);
            if (success) {
              // Iniciar tracking GPS automaticamente
              await ref.read(entregaProvider.notifier).iniciarTrackingGPS();
            }
          },
          icon: const Icon(Icons.play_arrow),
          label: const Text(
            'Iniciar Entrega',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFFF6B35),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
      );
    }

    // Para otros estados (PENDIENTE, ENTREGADO, CANCELADO, etc)
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        _getMensajeEstado(estadoPedido),
        textAlign: TextAlign.center,
        style: TextStyle(color: Colors.grey.shade600),
      ),
    );
  }

  String _getMensajeEstado(String estado) {
    switch (estado) {
      case 'PENDIENTE':
        return 'El pedido esta pendiente de confirmacion';
      case 'ENTREGADO':
        return 'Este pedido ya fue entregado';
      case 'CANCELADO':
        return 'Este pedido fue cancelado';
      default:
        return 'Estado del pedido: $estado';
    }
  }

  String _formatearETA(String isoDate) {
    try {
      final date = DateTime.parse(isoDate);
      return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return '--:--';
    }
  }

  Widget _buildMetrica(IconData icon, String valor, String unidad) {
    return Column(
      children: [
        Icon(icon, color: const Color(0xFFFF6B35), size: 28),
        const SizedBox(height: 4),
        RichText(
          text: TextSpan(
            style: const TextStyle(color: Colors.black87),
            children: [
              TextSpan(
                text: valor,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              TextSpan(
                text: ' $unidad',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Color _getEstadoColor(String estado) {
    switch (estado.toUpperCase()) {
      case 'PENDIENTE':
        return Colors.orange;
      case 'CONFIRMADO':
        return Colors.blue;
      case 'EN_CAMINO':
        return Colors.purple;
      case 'DETENIDO':
        return Colors.orange;
      case 'ENTREGADO':
        return Colors.green;
      case 'CANCELADO':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}
