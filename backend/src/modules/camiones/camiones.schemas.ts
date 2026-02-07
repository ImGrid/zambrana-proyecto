import { z } from 'zod';

// Schema para listar camiones (query params)
export const listCamionesSchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
  soloActivos: z.string().optional().transform(val => val === 'true'),
  soloDisponibles: z.string().optional().transform(val => val === 'true'),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional()
});

// Schema para obtener camión por ID
export const getCamionByIdSchema = z.object({
  id: z.string().transform(val => parseInt(val, 10))
});

// Schema para crear camión
export const createCamionSchema = z.object({
  placa: z.string().min(3, 'Placa debe tener al menos 3 caracteres').max(20, 'Placa muy larga'),
  tipo_camion_id: z.number().int().min(1).max(3, 'Tipo de camión inválido'),
  marca: z.string().max(100).optional(),
  modelo: z.string().max(100).optional(),
  año: z.number().int().min(1900).max(2100).optional(),
  capacidad_m3: z.number().positive('Capacidad debe ser positiva'),
  color: z.string().max(50).optional()
});

// Schema para actualizar camión
export const updateCamionSchema = z.object({
  placa: z.string().min(3).max(20).optional(),
  tipo_camion_id: z.number().int().min(1).max(3).optional(),
  marca: z.string().max(100).optional(),
  modelo: z.string().max(100).optional(),
  año: z.number().int().min(1900).max(2100).optional(),
  capacidad_m3: z.number().positive().optional(),
  color: z.string().max(50).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar'
});

// Schema para camión en response
export const camionResponseSchema = z.object({
  id: z.number(),
  placa: z.string(),
  tipo_camion_id: z.number(),
  tipo_camion: z.string(),
  marca: z.string().nullable(),
  modelo: z.string().nullable(),
  año: z.number().nullable(),
  capacidad_m3: z.number(),
  color: z.string().nullable(),
  activo: z.boolean(),
  en_mantenimiento: z.boolean(),
  created_at: z.string(),
  updated_at: z.string()
});

// Schema para lista de camiones
export const camionesListResponseSchema = z.object({
  camiones: z.array(z.object({
    id: z.number(),
    placa: z.string(),
    tipo_camion: z.string(),
    marca: z.string().nullable(),
    modelo: z.string().nullable(),
    capacidad_m3: z.number(),
    activo: z.boolean(),
    en_mantenimiento: z.boolean()
  })),
  total: z.number(),
  limit: z.number(),
  offset: z.number()
});

// Schema para respuesta con camión opcional (para updates/toggles)
export const camionUpdateResponseSchema = z.object({
  message: z.string(),
  camion: camionResponseSchema.optional()
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

// Schema para estadísticas de camiones
export const estadisticasCamionesResponseSchema = z.object({
  total_camiones: z.number(),
  camiones_activos: z.number(),
  camiones_inactivos: z.number(),
  camiones_en_mantenimiento: z.number(),
  camiones_disponibles: z.number(),
  capacidad_total_m3: z.number(),
  camiones_con_entregas_mes: z.number(),
  camion_top_mes: z.object({
    id: z.number(),
    placa: z.string(),
    total_entregas: z.number()
  }).nullable()
});
