import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, User, Package, MapPin, Clock, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Badge } from '@/components/ui/Badge';
import { useEntregasActivas } from '@/features/entregas/hooks/useEntregas';
import { MapaBase } from '@/features/entregas/components/MapaBase';
import { MarcadorCamion } from '@/features/entregas/components/MarcadorCamion';
import { MarcadorPlanta } from '@/features/entregas/components/MarcadorPlanta';
import { MarcadorCliente } from '@/features/entregas/components/MarcadorCliente';
import { RutaPlanificada } from '@/features/entregas/components/RutaPlanificada';
import type { RutaCalculada } from '@/features/entregas/types/entregas.types';

export const TrackingEntregaPage = () => {
  const { pedidoId } = useParams<{ pedidoId: string }>();
  const navigate = useNavigate();

  // Obtener entregas activas con polling
  const { data: entregas, isLoading, error } = useEntregasActivas(true);

  // Buscar la entrega que corresponde a este pedido
  const entregaActual = entregas?.find((e) => e.pedido.id === Number(pedidoId));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Error al cargar tracking"
        message="No se pudo cargar la información del tracking. Por favor, intenta nuevamente."
      />
    );
  }

  if (!entregaActual) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <ErrorState
          title="No se encontró la entrega"
          message="Esta entrega no está activa o no existe. El pedido puede estar en otro estado."
        />
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => navigate('/cliente/pedidos')}>
            <ArrowLeft className="h-4 w-4" />
            Volver a Mis Pedidos
          </Button>
        </div>
      </div>
    );
  }

  const formatETA = (eta: Date | null) => {
    if (!eta) return 'Calculando...';
    return new Date(eta).toLocaleString('es-BO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatVelocidad = (velocidad: number) => {
    return velocidad.toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/cliente/pedidos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-cemento-900">
            Tracking en Tiempo Real
          </h1>
          <p className="text-sm text-cemento-500 mt-1">
            Pedido {entregaActual.pedido.codigo_seguimiento}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Mapa (2/3) */}
        <div className="lg:col-span-2">
          <Card padding="none" className="overflow-hidden">
            <MapaBase className="h-[600px] w-full">
              {/* Marcador de la planta */}
              <MarcadorPlanta />

              {/* Marcador del cliente (destino) */}
              <MarcadorCliente
                latitud={entregaActual.pedido.latitud_entrega}
                longitud={entregaActual.pedido.longitud_entrega}
                razonSocial={entregaActual.pedido.cliente.razon_social}
                direccion={entregaActual.pedido.direccion_entrega}
              />

              {/* Ruta planificada (si existe) */}
              {entregaActual.pedido.ruta_calculada && (
                <RutaPlanificada ruta={entregaActual.pedido.ruta_calculada as RutaCalculada} />
              )}

              {/* Marcador del camión (posición actual) */}
              {entregaActual.posicion_actual && (
                <MarcadorCamion
                  posicion={entregaActual.posicion_actual}
                  camionPlaca={entregaActual.camion.placa}
                  conductorNombre={entregaActual.conductor.nombre_completo}
                  clienteNombre={entregaActual.pedido.cliente.razon_social}
                  velocidadPromedio={entregaActual.velocidad_promedio_kmh}
                />
              )}
            </MapaBase>
          </Card>
        </div>

        {/* Columna Derecha: Información (1/3) */}
        <div className="space-y-4">
          {/* Estado del camión */}
          <Card>
            <CardHeader title="Estado del Camión" />
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-cemento-600">Estado</span>
                  <Badge variant={entregaActual.esta_detenido ? 'warning' : 'success'}>
                    {entregaActual.esta_detenido ? 'Detenido' : 'En movimiento'}
                  </Badge>
                </div>

                {entregaActual.posicion_actual && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-cemento-600">Velocidad</span>
                      <div className="flex items-center gap-1">
                        <Navigation className="h-4 w-4 text-info-500" />
                        <span className="font-semibold text-cemento-900">
                          {formatVelocidad(entregaActual.velocidad_promedio_kmh)} km/h
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-cemento-600">Última actualización</span>
                      <span className="text-sm font-medium text-cemento-900">
                        {new Date(entregaActual.posicion_actual.timestamp).toLocaleTimeString('es-BO', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detalles de la entrega */}
          <Card>
            <CardHeader title="Detalles de Entrega" />
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Truck className="h-5 w-5 text-cemento-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-cemento-500">Camión</p>
                    <p className="font-semibold text-cemento-900">
                      {entregaActual.camion.placa}
                    </p>
                    <p className="text-sm text-cemento-600">
                      {entregaActual.camion.modelo}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <User className="h-5 w-5 text-cemento-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-cemento-500">Conductor</p>
                    <p className="font-semibold text-cemento-900">
                      {entregaActual.conductor.nombre_completo}
                    </p>
                    <p className="text-sm text-cemento-600">
                      {entregaActual.conductor.telefono}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-cemento-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-cemento-500">Destino</p>
                    <p className="text-sm text-cemento-900">
                      {entregaActual.pedido.direccion_entrega}
                    </p>
                  </div>
                </div>

                {entregaActual.pedido.ruta_calculada && (
                  <div className="flex items-start gap-2">
                    <Package className="h-5 w-5 text-cemento-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-cemento-500">Distancia estimada</p>
                      <p className="font-semibold text-cemento-900">
                        {entregaActual.pedido.ruta_calculada.distancia_total_km.toFixed(2)} km
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ETA */}
          <Card className="bg-gradient-to-br from-coral-50 to-coral-100 border-coral-200">
            <CardContent className="py-6">
              <div className="text-center">
                <Clock className="h-8 w-8 text-coral-600 mx-auto mb-2" />
                <p className="text-sm text-coral-700 mb-1">Tiempo estimado de llegada</p>
                <p className="text-3xl font-bold text-coral-900">
                  {formatETA(null)}
                </p>
                <p className="text-xs text-coral-600 mt-2">
                  Actualización automática cada 10 segundos
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
