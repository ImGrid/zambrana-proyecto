import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { useEntregasActivas } from '../hooks/useEntregas';
import { MapaBase } from '../components/MapaBase';
import { MarcadorCamion } from '../components/MarcadorCamion';
import { MarcadorPlanta } from '../components/MarcadorPlanta';
import { MarcadorCliente } from '../components/MarcadorCliente';
import { RutaPlanificada } from '../components/RutaPlanificada';
import { MetricasEntregasGrid } from '../components/MetricasEntregasGrid';
import { ListaEntregasActivas } from '../components/ListaEntregasActivas';
import type { RutaCalculada } from '../types/entregas.types';

// Dashboard principal para monitorear entregas GPS en tiempo real
// Roles permitidos: admin, gerente
export function MonitorGPSPage() {
  const [selectedEntregaId, setSelectedEntregaId] = useState<number | null>(null);

  // Obtener entregas activas con polling cada 10 segundos
  const { data: entregas, isLoading, error } = useEntregasActivas(true);

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
        title="Error al cargar entregas"
        message="No se pudo cargar la información de entregas activas. Por favor, intenta nuevamente."
      />
    );
  }

  const entregasActivas = entregas || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-cemento-900">Monitor GPS</h1>
        <p className="text-sm text-cemento-500 mt-1">
          Monitoreo en tiempo real de entregas activas
        </p>
      </div>

      {/* Métricas principales */}
      <MetricasEntregasGrid entregas={entregasActivas} />

      {/* Layout principal: Mapa (70%) + Sidebar (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Columna del mapa - 70% */}
        <div className="lg:col-span-7">
          <Card padding="none" className="overflow-hidden">
            <MapaBase className="h-[700px] w-full">
              {/* Marcador de la planta (punto de origen) */}
              <MarcadorPlanta />

              {/* Renderizar todas las entregas activas */}
              {entregasActivas.map((entrega) => (
                <div key={entrega.id}>
                  {/* Marcador del cliente (destino) */}
                  <MarcadorCliente
                    latitud={entrega.pedido.latitud_entrega}
                    longitud={entrega.pedido.longitud_entrega}
                    razonSocial={entrega.pedido.cliente.razon_social}
                    direccion={entrega.pedido.direccion_entrega}
                  />

                  {/* Ruta planificada (si existe) */}
                  {entrega.pedido.ruta_calculada && (
                    <RutaPlanificada ruta={entrega.pedido.ruta_calculada as RutaCalculada} />
                  )}

                  {/* Marcador del camión (posición actual) */}
                  {entrega.posicion_actual && (
                    <MarcadorCamion
                      posicion={entrega.posicion_actual}
                      camionPlaca={entrega.camion.placa}
                      conductorNombre={entrega.conductor.nombre_completo}
                      clienteNombre={entrega.pedido.cliente.razon_social}
                      velocidadPromedio={entrega.velocidad_promedio_kmh}
                      destacado={selectedEntregaId === entrega.id}
                    />
                  )}
                </div>
              ))}
            </MapaBase>
          </Card>
        </div>

        {/* Columna del sidebar - 30% */}
        <div className="lg:col-span-3">
          <Card className="h-[700px]">
            <ListaEntregasActivas
              entregas={entregasActivas}
              selectedEntregaId={selectedEntregaId}
              onSelectEntrega={setSelectedEntregaId}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
