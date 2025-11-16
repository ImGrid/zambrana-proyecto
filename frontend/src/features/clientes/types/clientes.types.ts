// Tipos alineados 100% con backend/src/modules/clientes/clientes.schemas.ts

// Cliente completo (usado en detalle y después de updates)
export interface Cliente {
  id: number;
  usuario_id: number | null;
  tipo_cliente_id: number;
  razon_social: string;
  nit: string | null;
  telefono: string | null;
  created_at: string;
  updated_at: string;
  usuario_email: string | null;
  tipo_cliente_nombre: string;
}

// Cliente en lista (versión simplificada)
export interface ClienteListItem {
  id: number;
  razon_social: string;
  nit: string | null;
  telefono: string | null;
  tipo_cliente_nombre: string;
}

// Respuesta de lista de clientes
export interface ClientesListResponse {
  clientes: ClienteListItem[];
  total: number;
  limit: number;
  offset: number;
}

// Parámetros de query para listar clientes
export interface ListClientesParams {
  limit?: number;
  offset?: number;
}

// Datos para crear cliente
export interface CreateClienteData {
  razon_social: string;
  tipo_cliente_id: number;
  nit?: string;
  telefono?: string;
}

// Datos para actualizar cliente (admin/gerente)
export interface UpdateClienteData {
  razon_social?: string;
  nit?: string;
  telefono?: string;
  tipo_cliente_id?: number;
}

// Datos para actualizar perfil (cliente actualiza sus propios datos)
export interface UpdatePerfilData {
  razon_social?: string;
  nit?: string;
  telefono?: string;
  tipo_cliente_id?: number;
}

// Respuesta de update
export interface ClienteUpdateResponse {
  message: string;
  cliente?: Cliente;
}

// Tipos de cliente disponibles (según base de datos)
export enum TipoCliente {
  INDEPENDIENTE = 1,
  HORMIGONERA = 2,
  CONSTRUCTORA = 3
}

export const TIPO_CLIENTE_LABELS: Record<number, string> = {
  [TipoCliente.INDEPENDIENTE]: 'Independiente',
  [TipoCliente.HORMIGONERA]: 'Hormigonera',
  [TipoCliente.CONSTRUCTORA]: 'Constructora'
};
