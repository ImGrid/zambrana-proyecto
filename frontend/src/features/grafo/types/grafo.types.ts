// Tipos alineados con backend/src/modules/grafo/grafo.schemas.ts

export interface NodoGrafo {
  id: string;
  label: string;
  tipo: string;
  propiedades?: Record<string, unknown>;
}

export interface RelacionGrafo {
  origen: string;
  destino: string;
  tipo: string;
  propiedades?: Record<string, unknown>;
}

export interface GrafoResponse {
  nodos: NodoGrafo[];
  relaciones: RelacionGrafo[];
}

export interface GrafoStatsResponse {
  total_clientes: number;
  total_pedidos: number;
  total_conductores: number;
  total_camiones: number;
  total_materiales: number;
  total_entregas: number;
  total_relaciones: number;
}

export interface SincronizarResponse {
  mensaje: string;
  detalles: {
    clientes: number;
    materiales: number;
    conductores: number;
    camiones: number;
    zonas: number;
    pedidos: number;
    entregas: number;
  };
}

export interface GrafoQueryParams {
  estado?: string;
  limite?: number;
}

// Tipos para react-force-graph-2d
export type TipoNodo = 'Cliente' | 'Pedido' | 'Material' | 'Conductor' | 'Camion' | 'Entrega' | 'Zona';

export interface ForceNode {
  id: string;
  label: string;
  tipo: TipoNodo;
  propiedades?: Record<string, unknown>;
}

export interface ForceLink {
  source: string;
  target: string;
  tipo: string;
  propiedades?: Record<string, unknown>;
}
