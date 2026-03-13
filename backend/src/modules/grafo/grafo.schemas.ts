import { z } from 'zod';

// Params
export const pedidoIdParamSchema = z.object({
  pedido_id: z.string().transform(val => parseInt(val, 10))
});

export const clienteIdParamSchema = z.object({
  cliente_id: z.string().transform(val => parseInt(val, 10))
});

// Query para filtrar operaciones
export const operacionesQuerySchema = z.object({
  estado: z.string().optional(),
  limite: z.string().optional().transform(val => val ? parseInt(val, 10) : 50)
});

// Nodo del grafo
export const nodoGrafoSchema = z.object({
  id: z.string(),
  label: z.string(),
  tipo: z.string(),
  propiedades: z.record(z.string(), z.unknown()).optional()
});

// Relacion del grafo
export const relacionGrafoSchema = z.object({
  origen: z.string(),
  destino: z.string(),
  tipo: z.string(),
  propiedades: z.record(z.string(), z.unknown()).optional()
});

// Response del grafo
export const grafoResponseSchema = z.object({
  nodos: z.array(nodoGrafoSchema),
  relaciones: z.array(relacionGrafoSchema)
});

// Response de estadisticas
export const grafoStatsResponseSchema = z.object({
  total_clientes: z.number(),
  total_pedidos: z.number(),
  total_conductores: z.number(),
  total_camiones: z.number(),
  total_materiales: z.number(),
  total_entregas: z.number(),
  total_relaciones: z.number()
});

// Error response
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string()
});
