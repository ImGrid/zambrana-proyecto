import type { TipoNodo } from '../types/grafo.types';

const NODE_COLORS: Record<TipoNodo, string> = {
  Cliente: '#3b82f6',
  Pedido: '#ff6b35',
  Material: '#22c55e',
  Conductor: '#8b5cf6',
  Camion: '#ef4444',
  Entrega: '#06b6d4',
  Zona: '#eab308',
};

const NODE_LABELS: Record<TipoNodo, string> = {
  Cliente: 'Cliente',
  Pedido: 'Pedido',
  Material: 'Material',
  Conductor: 'Conductor',
  Camion: 'Camion',
  Entrega: 'Entrega',
  Zona: 'Zona',
};

interface GrafoLeyendaProps {
  tiposVisibles: TipoNodo[];
}

export function GrafoLeyenda({ tiposVisibles }: GrafoLeyendaProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {tiposVisibles.map((tipo) => (
        <div key={tipo} className="flex items-center gap-1.5">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: NODE_COLORS[tipo] }}
          />
          <span className="text-xs text-cemento-600">{NODE_LABELS[tipo]}</span>
        </div>
      ))}
    </div>
  );
}

export { NODE_COLORS };
