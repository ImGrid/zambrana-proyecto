import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import '../models/pedido.dart';
import '../models/entrega.dart';
import '../providers/entrega_provider.dart';
import '../services/gps_service.dart';

// Paleta Zambrana
const _coral500 = Color(0xFFFF6B35);
const _cemento500 = Color(0xFF7F7C72);
const _cemento700 = Color(0xFF575550);
const _cemento900 = Color(0xFF403F3C);
const _piedra200 = Color(0xFFE4E4E4);
const _plantaGreen = Color(0xFF10B981);
const _camionBlue = Color(0xFF3B82F6);
const _camionOrange = Color(0xFFF59E0B);
const _clienteRed = Color(0xFFEF4444);
const _rutaBlue = Color(0xFF0066FF);
const _successGreen = Color(0xFF22C55E);

class MapaScreen extends ConsumerStatefulWidget {
  final Pedido pedido;

  const MapaScreen({super.key, required this.pedido});

  @override
  ConsumerState<MapaScreen> createState() => _MapaScreenState();
}

class _MapaScreenState extends ConsumerState<MapaScreen>
    with WidgetsBindingObserver, TickerProviderStateMixin {
  final MapController _mapController = MapController();
  final GPSService _gpsService = GPSService();
  bool _entregaCargada = false;

  // Animacion suave del marcador del conductor
  late AnimationController _markerAnimController;
  LatLng? _posicionAnterior;
  LatLng _posicionAnimada = plantaCoords;

  // Cache de ruta (estatica, no cambia durante la entrega)
  late List<LatLng> _rutaPuntosCache;

  // Coordenadas de la planta Zambrana
  static const LatLng plantaCoords = LatLng(-17.386140315699063, -66.19983962614776);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _markerAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _rutaPuntosCache = _calcularRutaPuntos();
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

  // Calcula los puntos de la ruta una sola vez (la ruta no cambia durante la entrega)
  List<LatLng> _calcularRutaPuntos() {
    final puntos = <LatLng>[];
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
    if (puntos.isEmpty) {
      puntos.add(plantaCoords);
      if (clienteCoords != null) {
        puntos.add(clienteCoords!);
      }
    }
    return puntos;
  }

  // Anima el marcador suavemente de la posicion anterior a la nueva
  void _animarMarcadorA(LatLng nuevaPosicion) {
    _posicionAnterior = _posicionAnimada;
    final inicio = _posicionAnterior!;

    _markerAnimController.reset();
    final animation = CurvedAnimation(
      parent: _markerAnimController,
      curve: Curves.easeInOut,
    );

    animation.addListener(() {
      final t = animation.value;
      setState(() {
        _posicionAnimada = LatLng(
          inicio.latitude + (nuevaPosicion.latitude - inicio.latitude) * t,
          inicio.longitude + (nuevaPosicion.longitude - inicio.longitude) * t,
        );
      });
    });

    _markerAnimController.forward();
  }

  @override
  void dispose() {
    _markerAnimController.dispose();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  // Radio de geofence en metros (debe coincidir con R7_GEOFENCE_ENTREGA del backend)
  static const double _radioGeofenceMetros = 300;

  bool _estaCercaDelDestino(PosicionActual? posicion) {
    if (posicion == null || clienteCoords == null) return false;
    final distancia = _gpsService.calcularDistancia(
      posicion.latitud,
      posicion.longitud,
      clienteCoords!.latitude,
      clienteCoords!.longitude,
    );
    return distancia < _radioGeofenceMetros;
  }

  // Distancia actual al destino en metros (para mostrar en UI)
  double? _distanciaAlDestino(PosicionActual? posicion) {
    if (posicion == null || clienteCoords == null) return null;
    return _gpsService.calcularDistancia(
      posicion.latitud,
      posicion.longitud,
      clienteCoords!.latitude,
      clienteCoords!.longitude,
    );
  }

  void _mostrarDialogoDetencion() {
    MotivoDetencion? motivoSeleccionado;
    final descripcionController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setSheetState) => Padding(
          padding: EdgeInsets.fromLTRB(
            20, 20, 20,
            MediaQuery.of(context).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: _piedra200,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Motivo de Detencion',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: _cemento900,
                ),
              ),
              const SizedBox(height: 16),
              // Opciones como botones
              ...MotivoDetencion.values.map((motivo) {
                final isSelected = motivoSeleccionado == motivo;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () {
                        setSheetState(() {
                          motivoSeleccionado = motivo;
                        });
                      },
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                        backgroundColor: isSelected
                            ? _coral500.withValues(alpha: 0.08)
                            : Colors.transparent,
                        side: BorderSide(
                          color: isSelected ? _coral500 : _piedra200,
                          width: isSelected ? 2 : 1.5,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        foregroundColor: isSelected ? _coral500 : _cemento700,
                      ),
                      child: Row(
                        children: [
                          Icon(_getMotivoIcon(motivo), size: 20),
                          const SizedBox(width: 12),
                          Text(
                            motivo.label,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
              const SizedBox(height: 8),
              TextField(
                controller: descripcionController,
                decoration: InputDecoration(
                  hintText: 'Descripcion adicional (opcional)',
                  hintStyle: const TextStyle(color: _cemento500, fontSize: 14),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: _piedra200),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: _piedra200),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: _coral500),
                  ),
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: motivoSeleccionado == null ? null : () async {
                    Navigator.pop(sheetContext);
                    await ref.read(entregaProvider.notifier).reportarDetencion(
                      motivo: motivoSeleccionado!,
                      descripcion: descripcionController.text.isNotEmpty
                          ? descripcionController.text
                          : null,
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _camionOrange,
                    disabledBackgroundColor: _camionOrange.withValues(alpha: 0.4),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: const Text(
                    'Reportar',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  IconData _getMotivoIcon(MotivoDetencion motivo) {
    switch (motivo) {
      case MotivoDetencion.trafico:
        return Icons.traffic;
      case MotivoDetencion.problemaMecanico:
        return Icons.build;
      case MotivoDetencion.descanso:
        return Icons.coffee;
      case MotivoDetencion.clienteNoDisponible:
        return Icons.person_off;
      case MotivoDetencion.otro:
        return Icons.help_outline;
    }
  }

  void _mostrarInfoPlanta() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: _piedra200,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: _plantaGreen.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.home, color: _plantaGreen, size: 26),
                ),
                const SizedBox(width: 14),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Planta Agregados Zambrana',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          color: _cemento900,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Punto de origen',
                        style: TextStyle(color: _cemento500, fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(color: _piedra200),
            const SizedBox(height: 12),
            _buildInfoRow(Icons.location_on, 'Ubicacion', 'Quillacollo, Cochabamba'),
            _buildInfoRow(Icons.access_time, 'Horario', 'Lun-Sab 7:00 - 18:00'),
            _buildInfoRow(Icons.phone, 'Telefono', '+591 4 4360000'),
          ],
        ),
      ),
    );
  }

  void _mostrarInfoCliente() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: _piedra200,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: _clienteRed.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.location_on, color: _clienteRed, size: 26),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.pedido.clienteNombre,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          color: _cemento900,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Destino de entrega',
                        style: TextStyle(color: _cemento500, fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(color: _piedra200),
            const SizedBox(height: 12),
            _buildInfoRow(Icons.business, 'Razon social', widget.pedido.clienteRazonSocial),
            _buildInfoRow(Icons.location_on, 'Direccion', widget.pedido.direccionEntrega),
            _buildInfoRow(Icons.inventory_2, 'Pedido', widget.pedido.codigoSeguimiento),
            _buildInfoRow(Icons.straighten, 'Cantidad', '${widget.pedido.totalM3} m3'),
          ],
        ),
      ),
    );
  }

  void _mostrarInfoConductor(EntregaState state) {
    final entrega = state.entregaActiva;
    if (entrega == null) return;
    final detenido = state.estaDetenido;

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: _piedra200,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: detenido
                        ? _camionOrange.withValues(alpha: 0.12)
                        : _camionBlue.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(
                    detenido ? Icons.pause : Icons.local_shipping,
                    color: detenido ? _camionOrange : _camionBlue,
                    size: 26,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        entrega.conductor.nombreCompleto,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          color: _cemento900,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        detenido ? 'Detenido' : 'En movimiento',
                        style: TextStyle(
                          color: detenido ? _camionOrange : _camionBlue,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(color: _piedra200),
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
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 18, color: _cemento500),
          const SizedBox(width: 12),
          Text(
            '$label: ',
            style: const TextStyle(
              color: _cemento500,
              fontWeight: FontWeight.w500,
              fontSize: 13,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                color: _cemento900,
                fontSize: 13,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  void _mostrarDialogoFinalizacion() {
    final observacionesController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.fromLTRB(
          20, 16, 20,
          MediaQuery.of(context).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: _piedra200,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Finalizar entrega',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: _cemento900,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Confirma que has entregado el material al cliente.',
              style: TextStyle(color: _cemento500, fontSize: 14),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: observacionesController,
              decoration: InputDecoration(
                hintText: 'Observaciones (opcional)',
                hintStyle: const TextStyle(color: _cemento500, fontSize: 14),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: _piedra200),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: _piedra200),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: _coral500),
                ),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 52,
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(sheetContext),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: _cemento700,
                        side: const BorderSide(color: _piedra200, width: 1.5),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: const Text(
                        'Cancelar',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed: () async {
                        Navigator.pop(sheetContext);
                        final success = await ref.read(entregaProvider.notifier).finalizarEntrega(
                          observaciones: observacionesController.text.isNotEmpty
                              ? observacionesController.text
                              : null,
                        );
                        if (success && mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Entrega finalizada exitosamente'),
                              backgroundColor: _successGreen,
                            ),
                          );
                          Navigator.pop(context);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _successGreen,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: const Text(
                        'Finalizar',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final entregaState = ref.watch(entregaProvider);

    ref.listen<EntregaState>(entregaProvider, (previous, next) {
      if (next.error != null && next.error != previous?.error) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.error!),
            backgroundColor: _clienteRed,
          ),
        );
        ref.read(entregaProvider.notifier).clearError();
      }
      if (next.mensaje != null && next.mensaje != previous?.mensaje) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.mensaje!),
            backgroundColor: _successGreen,
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
            backgroundColor: _camionOrange,
            duration: const Duration(seconds: 5),
          ),
        );
        ref.read(entregaProvider.notifier).clearWarning();
      }

      // Animar marcador cuando la posicion GPS cambia
      if (next.posicionActual != null &&
          (previous?.posicionActual == null ||
           next.posicionActual!.latitud != previous!.posicionActual!.latitud ||
           next.posicionActual!.longitud != previous.posicionActual!.longitud)) {
        _animarMarcadorA(LatLng(
          next.posicionActual!.latitud,
          next.posicionActual!.longitud,
        ));
      }
    });

    // Usar posicion animada para el marcador (movimiento suave)
    final conductorCoords = entregaState.posicionActual != null
        ? _posicionAnimada
        : null;

    return Scaffold(
      backgroundColor: Colors.white,
      body: Column(
        children: [
          // Header personalizado
          _buildHeader(entregaState),
          // Barra de estado
          if (entregaState.tieneEntregaActiva)
            _buildBarraEstado(entregaState),
          // Mapa
          Expanded(
            child: FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: conductorCoords ?? clienteCoords ?? plantaCoords,
                initialZoom: 14,
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.zambrana.conductor',
                ),
                if (_rutaPuntosCache.length > 1)
                  PolylineLayer(
                    polylines: [
                      Polyline(
                        points: _rutaPuntosCache,
                        color: _rutaBlue,
                        strokeWidth: 5,
                      ),
                    ],
                  ),
                MarkerLayer(
                  markers: [
                    // Planta
                    Marker(
                      point: plantaCoords,
                      width: 48,
                      height: 48,
                      child: GestureDetector(
                        onTap: _mostrarInfoPlanta,
                        child: Container(
                          decoration: BoxDecoration(
                            color: _plantaGreen,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 3),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.25),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Icon(Icons.home, color: Colors.white, size: 22),
                        ),
                      ),
                    ),
                    // Cliente
                    if (clienteCoords != null)
                      Marker(
                        point: clienteCoords!,
                        width: 48,
                        height: 48,
                        child: GestureDetector(
                          onTap: _mostrarInfoCliente,
                          child: Container(
                            decoration: BoxDecoration(
                              color: _clienteRed,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 3),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.25),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: const Icon(Icons.location_on, color: Colors.white, size: 22),
                          ),
                        ),
                      ),
                    // Conductor
                    if (conductorCoords != null)
                      Marker(
                        point: conductorCoords,
                        width: 48,
                        height: 48,
                        child: GestureDetector(
                          onTap: () => _mostrarInfoConductor(entregaState),
                          child: Container(
                            decoration: BoxDecoration(
                              color: entregaState.estaDetenido ? _camionOrange : _camionBlue,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: Colors.white, width: 3),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.25),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Icon(
                              entregaState.estaDetenido ? Icons.pause : Icons.local_shipping,
                              color: Colors.white,
                              size: 22,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
          // Panel inferior
          _buildPanelInferior(entregaState),
        ],
      ),
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(top: 160),
        child: FloatingActionButton.small(
          onPressed: () {
            if (conductorCoords != null) {
              _mapController.move(conductorCoords, 16);
            } else if (_rutaPuntosCache.isNotEmpty) {
              final bounds = LatLngBounds.fromPoints(_rutaPuntosCache);
              _mapController.fitCamera(
                CameraFit.bounds(
                  bounds: bounds,
                  padding: const EdgeInsets.all(50),
                ),
              );
            }
          },
          backgroundColor: Colors.white,
          elevation: 4,
          child: const Icon(Icons.my_location, color: _coral500, size: 20),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endTop,
    );
  }

  // Header con logo y info
  Widget _buildHeader(EntregaState state) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Color(0x0D000000),
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
          child: Row(
            children: [
              // Boton volver
              SizedBox(
                width: 40,
                height: 40,
                child: IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.arrow_back, size: 22),
                  color: _cemento900,
                  padding: EdgeInsets.zero,
                ),
              ),
              const SizedBox(width: 4),
              // Logo
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.asset(
                  'assets/images/logo_origin.png',
                  width: 36,
                  height: 36,
                  fit: BoxFit.contain,
                ),
              ),
              const SizedBox(width: 10),
              // Titulo y subtitulo
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Mi Ruta',
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: _cemento900,
                      ),
                    ),
                    Text(
                      widget.pedido.codigoSeguimiento,
                      style: const TextStyle(
                        fontSize: 12,
                        color: _cemento500,
                      ),
                    ),
                  ],
                ),
              ),
              // GPS indicator
              if (state.gpsActivo)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: _successGreen.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: _successGreen,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 5),
                      const Text(
                        'GPS',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: _successGreen,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  // Barra de estado
  Widget _buildBarraEstado(EntregaState state) {
    final detenido = state.estaDetenido;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: detenido
          ? _camionOrange.withValues(alpha: 0.1)
          : _camionBlue.withValues(alpha: 0.1),
      child: Row(
        children: [
          Icon(
            detenido ? Icons.pause_circle_filled : Icons.local_shipping,
            color: detenido ? _camionOrange : _camionBlue,
            size: 20,
          ),
          const SizedBox(width: 8),
          Text(
            detenido ? 'DETENIDO' : 'EN CAMINO',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 13,
              color: detenido ? _camionOrange : _camionBlue,
            ),
          ),
          const Spacer(),
          if (state.etaActualizado != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                'ETA ${_formatearETA(state.etaActualizado!)}',
                style: const TextStyle(
                  color: _cemento700,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
    );
  }

  // Panel inferior
  Widget _buildPanelInferior(EntregaState state) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Color(0x1A000000),
            blurRadius: 16,
            offset: Offset(0, -4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: _piedra200,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 14),
            // Cliente y estado
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: _coral500.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.local_shipping, color: _coral500, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.pedido.clienteNombre,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                          color: _cemento900,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        widget.pedido.direccionEntrega,
                        style: const TextStyle(color: _cemento500, fontSize: 12),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: _getEstadoColor(widget.pedido.estadoNombre).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    widget.pedido.estadoNombre,
                    style: TextStyle(
                      color: _getEstadoColor(widget.pedido.estadoNombre),
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Metricas
            Container(
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8F8F8),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
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
                  if (state.velocidadPromedioKmh != null)
                    _buildMetrica(
                      Icons.speed,
                      state.velocidadPromedioKmh!.toStringAsFixed(0),
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
            ),
            const SizedBox(height: 16),
            // Botones
            _buildBotonesAccion(state),
          ],
        ),
      ),
    );
  }

  Widget _buildBotonesAccion(EntregaState state) {
    final estadoPedido = widget.pedido.estadoNombre.toUpperCase();

    if (state.isLoading) {
      return const SizedBox(
        width: double.infinity,
        height: 52,
        child: Center(child: CircularProgressIndicator(color: _coral500)),
      );
    }

    if (state.tieneEntregaActiva) {
      return Column(
        children: [
          // Detenido / Reanudar
          SizedBox(
            width: double.infinity,
            height: 52,
            child: OutlinedButton.icon(
              onPressed: state.estaDetenido
                  ? () => ref.read(entregaProvider.notifier).reportarReanudacion()
                  : _mostrarDialogoDetencion,
              icon: Icon(
                state.estaDetenido ? Icons.play_arrow : Icons.pause,
                size: 22,
              ),
              label: Text(
                state.estaDetenido ? 'Reanudar' : 'Detenido',
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: state.estaDetenido ? _successGreen : _camionOrange,
                side: BorderSide(
                  color: state.estaDetenido ? _successGreen : _camionOrange,
                  width: 1.5,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          // Finalizar - muestra distancia al destino
          Builder(builder: (context) {
            final cerca = _estaCercaDelDestino(state.posicionActual);
            final distancia = _distanciaAlDestino(state.posicionActual);
            final distanciaTexto = distancia != null
                ? '${(distancia / 1000).toStringAsFixed(1)} km'
                : '';

            return Column(
              children: [
                if (!cerca && distancia != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Text(
                      'Estas a $distanciaTexto del destino',
                      style: const TextStyle(color: _camionOrange, fontSize: 12, fontWeight: FontWeight.w500),
                    ),
                  ),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton.icon(
                    onPressed: _mostrarDialogoFinalizacion,
                    icon: Icon(cerca ? Icons.check_circle : Icons.warning_amber, size: 22),
                    label: Text(
                      cerca ? 'Pedido Entregado' : 'Finalizar (requiere observacion)',
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: cerca ? _successGreen : _camionOrange,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                  ),
                ),
              ],
            );
          }),
        ],
      );
    }

    if (estadoPedido == 'EN_CAMINO') {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!state.isLoading && !state.tieneEntregaActiva) {
          ref.read(entregaProvider.notifier).cargarEntregaPorPedido(widget.pedido.id);
        }
      });
      return const SizedBox(
        width: double.infinity,
        height: 52,
        child: Center(child: CircularProgressIndicator(color: _coral500)),
      );
    }

    if (estadoPedido == 'CONFIRMADO') {
      return SizedBox(
        width: double.infinity,
        height: 52,
        child: ElevatedButton.icon(
          onPressed: () async {
            final success = await ref.read(entregaProvider.notifier).iniciarEntrega(widget.pedido.id);
            if (success) {
              await ref.read(entregaProvider.notifier).iniciarTrackingGPS();
            }
          },
          icon: const Icon(Icons.play_arrow, size: 24),
          label: const Text(
            'Comenzar Ruta',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: _camionBlue,
            foregroundColor: Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
        ),
      );
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F8F8),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(
        _getMensajeEstado(estadoPedido),
        textAlign: TextAlign.center,
        style: const TextStyle(color: _cemento500, fontSize: 14),
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
        Icon(icon, color: _coral500, size: 24),
        const SizedBox(height: 4),
        RichText(
          text: TextSpan(
            style: const TextStyle(color: _cemento900),
            children: [
              TextSpan(
                text: valor,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              TextSpan(
                text: ' $unidad',
                style: const TextStyle(
                  fontSize: 12,
                  color: _cemento500,
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
        return _camionOrange;
      case 'CONFIRMADO':
        return _camionBlue;
      case 'EN_CAMINO':
        return const Color(0xFF8B5CF6);
      case 'DETENIDO':
        return _camionOrange;
      case 'ENTREGADO':
        return _successGreen;
      case 'CANCELADO':
        return _clienteRed;
      default:
        return _cemento500;
    }
  }
}
