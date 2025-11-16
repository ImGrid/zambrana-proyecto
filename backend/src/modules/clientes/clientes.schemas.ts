import { z } from 'zod';

// Schema para listar clientes (query params)
export const listClientesSchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0)
});

// Schema para obtener cliente por ID
export const getClienteByIdSchema = z.object({
  id: z.string().transform(val => parseInt(val, 10))
});

// Schema para crear cliente
export const createClienteSchema = z.object({
  razon_social: z.string().min(3, 'Razón social debe tener al menos 3 caracteres').max(255),
  tipo_cliente_id: z.number().int().min(1).max(3, 'Tipo de cliente inválido'),
  nit: z.string().max(50).optional(),
  telefono: z.string().max(50).optional()
});

// Schema para actualizar cliente (admin/gerente)
export const updateClienteSchema = z.object({
  razon_social: z.string().min(3).max(255).optional(),
  nit: z.string().max(50).optional(),
  telefono: z.string().max(50).optional(),
  tipo_cliente_id: z.number().int().min(1).max(3).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar'
});

// Schema para que el cliente actualice su propio perfil
export const updateClienteProfileSchema = z.object({
  razon_social: z.string().min(3, 'Razón social debe tener al menos 3 caracteres').max(255).optional(),
  nit: z.string().max(50).optional().transform(val => val === '' ? undefined : val),
  telefono: z.string().max(50).optional().transform(val => val === '' ? undefined : val),
  tipo_cliente_id: z.number().int().min(1).max(3).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar'
});

// Schema para cliente en response
export const clienteResponseSchema = z.object({
  id: z.number(),
  usuario_id: z.number().nullable(),
  tipo_cliente_id: z.number(),
  razon_social: z.string(),
  nit: z.string().nullable(),
  telefono: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  usuario_email: z.string().nullable(),
  tipo_cliente_nombre: z.string()
});

// Schema para lista de clientes
export const clientesListResponseSchema = z.object({
  clientes: z.array(z.object({
    id: z.number(),
    razon_social: z.string(),
    nit: z.string().nullable(),
    telefono: z.string().nullable(),
    tipo_cliente_nombre: z.string()
  })),
  total: z.number(),
  limit: z.number(),
  offset: z.number()
});

// Schema para respuesta con cliente opcional (para updates)
export const clienteUpdateResponseSchema = z.object({
  message: z.string(),
  cliente: clienteResponseSchema.optional()
});

// Schema para respuesta genérica
export const messageResponseSchema = z.object({
  message: z.string()
});

// Schema para errores genéricos
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string()
});

// Schema para estadísticas de clientes
export const estadisticasClientesResponseSchema = z.object({
  total_clientes: z.number(),
  clientes_activos_mes: z.number(),
  clientes_nuevos_mes: z.number(),
  clientes_inactivos_90dias: z.number(),
  cliente_top_mes: z.object({
    id: z.number(),
    razon_social: z.string(),
    total_gastado: z.number()
  }).nullable()
});
