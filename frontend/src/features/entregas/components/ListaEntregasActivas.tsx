import { Filter } from 'lucide-react';
import { EntregaActiveCard } from './EntregaActiveCard';
import type { EntregaActiva } from '../types/entregas.types';
import { useState } from 'react';

interface ListaEntregasActivasProps {
  entregas: EntregaActiva[];
  selectedEntregaId: number | null;
  onSelectEntrega: (entregaId: number) => void;
}

// Componente para mostrar lista de entregas activas en el sidebar
// Permite filtrar por estado (todas, detenidas, en movimiento)
export function ListaEntregasActivas({
  entregas,
  selectedEntregaId,
  onSelectEntrega,
}: ListaEntregasActivasProps) {
  const [filtro, setFiltro] = useState<'todas' | 'desviadas' | 'detenidas' | 'movimiento'>('todas');

  // Filtrar entregas segun el filtro seleccionado
  const entregasFiltradas = entregas.filter((entrega) => {
    if (filtro === 'desviadas') return entrega.esta_desviado;
    if (filtro === 'detenidas') return entrega.esta_detenido;
    if (filtro === 'movimiento') return !entrega.esta_detenido && !entrega.esta_desviado;
    return true;
  });

  // Ordenar: desviadas primero, luego detenidas, luego en movimiento
  const entregasOrdenadas = [...entregasFiltradas].sort((a, b) => {
    // Desviadas tienen maxima prioridad
    if (a.esta_desviado && !b.esta_desviado) return -1;
    if (!a.esta_desviado && b.esta_desviado) return 1;

    // Luego detenidas
    if (a.esta_detenido && !b.esta_detenido) return -1;
    if (!a.esta_detenido && b.esta_detenido) return 1;

    // Luego por hora de salida (mas recientes primero)
    const horaA = a.hora_salida_planta ? new Date(a.hora_salida_planta).getTime() : 0;
    const horaB = b.hora_salida_planta ? new Date(b.hora_salida_planta).getTime() : 0;
    return horaB - horaA;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header con filtros */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-cemento-400" />
          <h3 className="text-sm font-semibold text-cemento-900">
            Entregas Activas ({entregasFiltradas.length})
          </h3>
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <button
            onClick={() => setFiltro('todas')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filtro === 'todas'
                ? 'bg-coral-500 text-white'
                : 'bg-cemento-100 text-cemento-700 hover:bg-cemento-200'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFiltro('desviadas')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filtro === 'desviadas'
                ? 'bg-error-500 text-white'
                : 'bg-cemento-100 text-cemento-700 hover:bg-cemento-200'
            }`}
          >
            Desviadas
          </button>
          <button
            onClick={() => setFiltro('detenidas')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filtro === 'detenidas'
                ? 'bg-warning-500 text-white'
                : 'bg-cemento-100 text-cemento-700 hover:bg-cemento-200'
            }`}
          >
            Detenidas
          </button>
          <button
            onClick={() => setFiltro('movimiento')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filtro === 'movimiento'
                ? 'bg-success-500 text-white'
                : 'bg-cemento-100 text-cemento-700 hover:bg-cemento-200'
            }`}
          >
            En Ruta
          </button>
        </div>
      </div>

      {/* Lista scrolleable de entregas */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {entregasOrdenadas.length === 0 ? (
          <div className="text-center py-8 text-cemento-500 text-sm">
            {filtro === 'todas'
              ? 'No hay entregas activas en este momento'
              : filtro === 'desviadas'
                ? 'No hay entregas desviadas'
                : filtro === 'detenidas'
                  ? 'No hay entregas detenidas'
                  : 'No hay entregas en movimiento'}
          </div>
        ) : (
          entregasOrdenadas.map((entrega) => (
            <EntregaActiveCard
              key={entrega.id}
              entrega={entrega}
              selected={selectedEntregaId === entrega.id}
              onClick={() => onSelectEntrega(entrega.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
