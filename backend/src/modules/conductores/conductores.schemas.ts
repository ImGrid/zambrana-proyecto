import { z } from 'zod';

// Schema para listar conductores (query params)
export const listConductoresSchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
  soloActivos: z.string().optional().transform(val => val === 'true')
});

// Schema para obtener conductor por ID
export const getConductorByIdSchema = z.object({
  id: z.string().transform(val => parseInt(val, 10))
});

// Schema para crear conductor
export const createConductorSchema = z.object({
  nombre_completo: z.string().min(3, 'Nombre debe tener al menos 3 caracteres').max(255),
  ci: z.string().min(3, 'CI debe tener al menos 3 caracteres').max(50),
  telefono: z.string().max(50).optional(),
  licencia_categoria: z.string().max(50).optional(),
  fecha_vencimiento_licencia: z.string().datetime().optional()
});

// Schema para actualizar conductor
export const updateConductorSchema = z.object({
  nombre_completo: z.string().min(3).max(255).optional(),
  ci: z.string().min(3).max(50).optional(),
  telefono: z.string().max(50).optional(),
  licencia_categoria: z.string().max(50).optional(),
  fecha_vencimiento_licencia: z.string().datetime().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar'
});

// Schema para conductor en response
export const conductorResponseSchema = z.object({
  id: z.number(),
  usuario_id: z.number().nullable(),
  nombre_completo: z.string(),
  ci: z.string(),
  telefono: z.string().nullable(),
  licencia_categoria: z.string().nullable(),
  fecha_vencimiento_licencia: z.string().nullable(),
  activo: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  usuario_email: z.string().nullable()
});

// Schema para lista de conductores
export const conductoresListResponseSchema = z.object({
  conductores: z.array(z.object({
    id: z.number(),
    nombre_completo: z.string(),
    ci: z.string(),
    telefono: z.string().nullable(),
    licencia_categoria: z.string().nullable(),
    activo: z.boolean()
  })),
  total: z.number(),
  limit: z.number(),
  offset: z.number()
});

// Schema para licencias próximas a vencer
export const licenciasVencerResponseSchema = z.object({
  conductores: z.array(z.object({
    id: z.number(),
    nombre_completo: z.string(),
    ci: z.string(),
    telefono: z.string().nullable(),
    licencia_categoria: z.string().nullable(),
    fecha_vencimiento_licencia: z.string().nullable(),
    activo: z.boolean()
  }))
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

// Schema para estadísticas de conductores
export const estadisticasConductoresResponseSchema = z.object({
  total_conductores: z.number(),
  conductores_activos: z.number(),
  conductores_inactivos: z.number(),
  licencias_por_vencer_30dias: z.number(),
  licencias_vencidas: z.number(),
  conductores_con_entregas_mes: z.number(),
  conductor_top_mes: z.object({
    id: z.number(),
    nombre_completo: z.string(),
    total_entregas: z.number()
  }).nullable()
});
