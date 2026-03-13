import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { TipoNodo } from '../types/grafo.types';
import { NODE_COLORS } from './GrafoLeyenda';

const NODE_LABELS: Record<TipoNodo, string> = {
  Cliente: 'Cliente',
  Pedido: 'Pedido',
  Material: 'Material',
  Conductor: 'Conductor',
  Camion: 'Camion',
  Entrega: 'Entrega',
  Zona: 'Zona',
};

interface GrafoFiltroNodosProps {
  tiposDisponibles: TipoNodo[];
  tiposActivos: TipoNodo[];
  onChange: (tipos: TipoNodo[]) => void;
}

export function GrafoFiltroNodos({ tiposDisponibles, tiposActivos, onChange }: GrafoFiltroNodosProps) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTipo = (tipo: TipoNodo) => {
    if (tiposActivos.includes(tipo)) {
      onChange(tiposActivos.filter((t) => t !== tipo));
    } else {
      onChange([...tiposActivos, tipo]);
    }
  };

  const seleccionarTodos = () => {
    onChange([...tiposDisponibles]);
  };

  const limpiarTodos = () => {
    onChange([]);
  };

  const tiposNoSeleccionados = tiposDisponibles.filter((t) => !tiposActivos.includes(t));

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      {/* Dropdown */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setAbierto(!abierto)}
          className="flex items-center gap-2 rounded-lg border border-piedra-300 bg-white px-3 py-1.5 text-sm text-cemento-700 hover:border-piedra-400 transition-colors"
        >
          <span>Agregar nodo</span>
          <ChevronDownIcon className={`h-4 w-4 text-cemento-400 transition-transform ${abierto ? 'rotate-180' : ''}`} />
        </button>

        {abierto && tiposNoSeleccionados.length > 0 && (
          <div className="absolute top-full left-0 mt-1 z-20 w-48 rounded-lg border border-piedra-200 bg-white shadow-lg py-1">
            {tiposNoSeleccionados.map((tipo) => (
              <button
                key={tipo}
                onClick={() => {
                  toggleTipo(tipo);
                  if (tiposNoSeleccionados.length === 1) setAbierto(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-cemento-700 hover:bg-piedra-50 transition-colors"
              >
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: NODE_COLORS[tipo] }}
                />
                {NODE_LABELS[tipo]}
              </button>
            ))}
          </div>
        )}

        {abierto && tiposNoSeleccionados.length === 0 && (
          <div className="absolute top-full left-0 mt-1 z-20 w-48 rounded-lg border border-piedra-200 bg-white shadow-lg py-2 px-3">
            <span className="text-xs text-cemento-400">Todos los nodos estan activos</span>
          </div>
        )}
      </div>

      {/* Botones rapidos */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={seleccionarTodos}
          disabled={tiposActivos.length === tiposDisponibles.length}
          className="text-xs text-coral-500 hover:text-coral-600 disabled:text-cemento-300 disabled:cursor-default transition-colors"
        >
          Todos
        </button>
        <span className="text-cemento-300">|</span>
        <button
          onClick={limpiarTodos}
          disabled={tiposActivos.length === 0}
          className="text-xs text-coral-500 hover:text-coral-600 disabled:text-cemento-300 disabled:cursor-default transition-colors"
        >
          Limpiar
        </button>
      </div>

      {/* Tags de tipos activos */}
      <div className="flex flex-wrap gap-1.5">
        {tiposActivos.map((tipo) => (
          <span
            key={tipo}
            className="inline-flex items-center gap-1 rounded-full border border-piedra-200 bg-white px-2.5 py-1 text-xs font-medium text-cemento-700"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: NODE_COLORS[tipo] }}
            />
            {NODE_LABELS[tipo]}
            <button
              onClick={() => toggleTipo(tipo)}
              className="ml-0.5 text-cemento-400 hover:text-cemento-600 transition-colors"
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
