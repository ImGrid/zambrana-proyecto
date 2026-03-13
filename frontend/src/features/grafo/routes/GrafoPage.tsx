import { useState, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useGrafoOperaciones, useGrafoStats, useSincronizarGrafo } from '../hooks/useGrafo';
import { GrafoVisualizacion } from '../components/GrafoVisualizacion';
import { GrafoFiltroNodos } from '../components/GrafoFiltroNodos';
import { NodoDetalle } from '../components/NodoDetalle';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import type { ForceNode, TipoNodo, GrafoResponse } from '../types/grafo.types';

const ESTADOS_FILTRO = [
  { value: '', label: 'Todos' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
  { value: 'EN_CAMINO', label: 'En Camino' },
  { value: 'ENTREGADO', label: 'Entregado' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

// Filtra el grafo segun los tipos de nodo activos
function filtrarGrafo(grafo: GrafoResponse, tipos: TipoNodo[]): GrafoResponse {
  const nodosFiltrados = grafo.nodos.filter((n) => tipos.includes(n.tipo as TipoNodo));
  const idsVisibles = new Set(nodosFiltrados.map((n) => n.id));

  const relacionesFiltradas = grafo.relaciones.filter(
    (r) => idsVisibles.has(r.origen) && idsVisibles.has(r.destino)
  );

  return { nodos: nodosFiltrados, relaciones: relacionesFiltradas };
}

export const GrafoPage = () => {
  const { user } = useAuth();
  const [estado, setEstado] = useState('');
  const [tiposActivos, setTiposActivos] = useState<TipoNodo[]>([]);
  const [filtrosInicializados, setFiltrosInicializados] = useState(false);
  const [nodoSeleccionado, setNodoSeleccionado] = useState<ForceNode | null>(null);

  const {
    data: grafo,
    isLoading,
    error,
  } = useGrafoOperaciones({
    estado: estado || undefined,
    limite: 50,
  });

  const { data: stats } = useGrafoStats();
  const { mutate: sincronizar, isPending: isSyncing } = useSincronizarGrafo();

  // Tipos de nodo presentes en los datos originales
  const tiposDisponibles = useMemo(() => {
    if (!grafo) return [];
    return [...new Set(grafo.nodos.map((n) => n.tipo))] as TipoNodo[];
  }, [grafo]);

  // Inicializar con todos los tipos activos cuando llegan datos
  if (tiposDisponibles.length > 0 && !filtrosInicializados) {
    setTiposActivos(tiposDisponibles);
    setFiltrosInicializados(true);
  }

  // Datos filtrados
  const grafoFiltrado = useMemo(() => {
    if (!grafo || tiposActivos.length === 0) return null;
    return filtrarGrafo(grafo, tiposActivos);
  }, [grafo, tiposActivos]);

  const handleNodeClick = (nodo: ForceNode) => {
    setNodoSeleccionado(nodo);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cemento-900">Operaciones</h1>
          <p className="text-sm text-cemento-500 mt-1">
            Flujo de pedidos, asignaciones y entregas en forma de grafo
          </p>
        </div>

        <div className="flex items-center gap-2">
          {user?.rol === 'admin' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => sincronizar()}
              disabled={isSyncing}
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
          )}
        </div>
      </div>

      {/* Estadisticas */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
          <StatCard label="Clientes" value={stats.total_clientes} />
          <StatCard label="Pedidos" value={stats.total_pedidos} />
          <StatCard label="Materiales" value={stats.total_materiales} />
          <StatCard label="Conductores" value={stats.total_conductores} />
          <StatCard label="Camiones" value={stats.total_camiones} />
          <StatCard label="Entregas" value={stats.total_entregas} />
          <StatCard label="Relaciones" value={stats.total_relaciones} />
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-cemento-600">Estado:</span>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="rounded-lg border border-piedra-300 bg-white px-3 py-1.5 text-sm text-cemento-700 focus:border-coral-500 focus:outline-none"
          >
            {ESTADOS_FILTRO.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>

        {tiposDisponibles.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-cemento-600 shrink-0">Nodos:</span>
            <GrafoFiltroNodos
              tiposDisponibles={tiposDisponibles}
              tiposActivos={tiposActivos}
              onChange={(tipos) => {
                setTiposActivos(tipos);
                setNodoSeleccionado(null);
              }}
            />
          </div>
        )}
      </div>

      {/* Contenido principal */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      )}

      {error && (
        <ErrorState
          title="Error al cargar el grafo"
          message="No se pudieron obtener los datos de operaciones"
        />
      )}

      {!isLoading && !error && grafo && grafo.nodos.length === 0 && (
        <EmptyState
          title="Sin datos"
          message="No hay operaciones registradas en el grafo. Usa el boton Sincronizar para cargar los datos existentes."
        />
      )}

      {!isLoading && !error && grafoFiltrado && grafoFiltrado.nodos.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Grafo */}
          <div className={nodoSeleccionado ? 'lg:col-span-3' : 'lg:col-span-4'}>
            <GrafoVisualizacion
              data={grafoFiltrado}
              onNodeClick={handleNodeClick}
              height={550}
            />
          </div>

          {/* Panel de detalle */}
          {nodoSeleccionado && (
            <div className="lg:col-span-1">
              <NodoDetalle
                nodo={nodoSeleccionado}
                onClose={() => setNodoSeleccionado(null)}
              />
            </div>
          )}
        </div>
      )}

      {/* Mensaje cuando no hay nodos visibles */}
      {!isLoading && !error && tiposActivos.length === 0 && grafo && grafo.nodos.length > 0 && (
        <div className="text-center py-12 text-cemento-500 text-sm">
          Selecciona al menos un tipo de nodo para visualizar el grafo.
        </div>
      )}

      {!isLoading && !error && tiposActivos.length > 0 && grafoFiltrado && grafoFiltrado.nodos.length === 0 && grafo && grafo.nodos.length > 0 && (
        <div className="text-center py-12 text-cemento-500 text-sm">
          No hay nodos para los filtros seleccionados. Prueba cambiando el estado o los tipos de nodo.
        </div>
      )}
    </div>
  );
};

// Componente interno para las estadisticas
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-piedra-200 bg-white p-3 text-center">
      <p className="text-lg font-semibold text-cemento-900">{value}</p>
      <p className="text-xs text-cemento-500">{label}</p>
    </div>
  );
}
