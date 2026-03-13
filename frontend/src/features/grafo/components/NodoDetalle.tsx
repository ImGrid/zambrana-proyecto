import { XMarkIcon } from '@heroicons/react/24/outline';
import type { ForceNode, TipoNodo } from '../types/grafo.types';
import { NODE_COLORS } from './GrafoLeyenda';

interface NodoDetalleProps {
  nodo: ForceNode;
  onClose: () => void;
}

// Etiquetas legibles para las propiedades segun tipo de nodo
const PROP_LABELS: Record<string, string> = {
  pg_id: 'ID',
  razon_social: 'Razon Social',
  nit: 'NIT',
  telefono: 'Telefono',
  tipo_cliente: 'Tipo',
  codigo_seguimiento: 'Codigo',
  estado: 'Estado',
  direccion_entrega: 'Direccion',
  total_m3: 'Total m3',
  monto_total: 'Monto Total (Bs)',
  fecha_pedido: 'Fecha',
  nombre: 'Nombre',
  codigo: 'Codigo',
  precio_m3: 'Precio/m3 (Bs)',
  unidad_medida: 'Unidad',
  nombre_completo: 'Nombre',
  ci: 'CI',
  licencia_categoria: 'Licencia',
  placa: 'Placa',
  marca: 'Marca',
  modelo: 'Modelo',
  capacidad_m3: 'Capacidad m3',
  tipo_camion: 'Tipo',
  entregado: 'Entregado',
  hora_salida_planta: 'Salida Planta',
  hora_llegada_cliente: 'Llegada Cliente',
  duracion_minutos: 'Duracion (min)',
  porcentaje_adherencia: 'Adherencia (%)',
};

// Propiedades que no se muestran
const HIDDEN_PROPS = ['pg_id'];

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Si' : 'No';
  if (typeof value === 'number') {
    if (key.includes('monto') || key.includes('precio') || key.includes('subtotal')) {
      return `${value.toFixed(2)} Bs`;
    }
    return value.toString();
  }
  if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
    return new Date(value).toLocaleString('es-BO');
  }
  return String(value);
}

export function NodoDetalle({ nodo, onClose }: NodoDetalleProps) {
  const color = NODE_COLORS[nodo.tipo as TipoNodo] || '#999999';
  const props = nodo.propiedades || {};

  return (
    <div className="rounded-lg border border-piedra-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-medium text-cemento-500 uppercase">{nodo.tipo}</span>
        </div>
        <button
          onClick={onClose}
          className="text-cemento-400 hover:text-cemento-600 transition-colors"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      <h3 className="text-sm font-semibold text-cemento-900 mb-3">{nodo.label}</h3>

      <div className="space-y-1.5">
        {Object.entries(props)
          .filter(([key]) => !HIDDEN_PROPS.includes(key))
          .map(([key, value]) => (
            <div key={key} className="flex justify-between text-xs">
              <span className="text-cemento-500">{PROP_LABELS[key] || key}</span>
              <span className="text-cemento-800 font-medium">{formatValue(key, value)}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
