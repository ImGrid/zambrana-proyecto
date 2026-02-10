import { z } from 'zod';

// Schema para params de sugerencia
export const sugerirParamsSchema = z.object({
  pedido_id: z.string().transform(val => parseInt(val, 10)),
});

// Schema de camion candidato
const camionCandidatoSchema = z.object({
  id: z.number(),
  placa: z.string(),
  modelo: z.string().nullable(),
  capacidad_m3: z.number(),
  tipo_camion: z.string(),
});

// Schema de conductor disponible
const conductorDisponibleSchema = z.object({
  id: z.number(),
  nombre_completo: z.string(),
});

// Schema de respuesta de sugerencia
export const sugerenciaResponseSchema = z.object({
  pedido: z.object({
    id: z.number(),
    codigo_seguimiento: z.string(),
    total_m3: z.number(),
    zona_id: z.number().nullable(),
    zona_nombre: z.string().nullable(),
    direccion_entrega: z.string(),
    fecha_entrega_solicitada: z.string().nullable(),
  }),
  sugerencia_camion: z.object({
    recomendado: camionCandidatoSchema.nullable(),
    candidatos: z.array(camionCandidatoSchema),
    motivo: z.string(),
  }),
  sugerencia_conductor: z.object({
    recomendado: conductorDisponibleSchema.nullable(),
    disponibles: z.array(conductorDisponibleSchema),
  }),
  multiples_viajes: z.object({
    requiere: z.boolean(),
    numero_viajes: z.number().nullable(),
    volumen_por_viaje: z.number().nullable(),
  }),
  agrupacion_zona: z.object({
    pedidos_misma_zona: z.number(),
    sugerir_agrupacion: z.boolean(),
    pedidos_ids: z.array(z.number()),
  }),
  prioridad: z.object({
    tiene_fecha_solicitada: z.boolean(),
    fecha_solicitada: z.string().nullable(),
    urgencia: z.enum(['alta', 'media', 'baja']).nullable(),
    pedidos_mas_urgentes: z.number(),
  }),
  warnings: z.array(z.string()),
  reglas_aplicadas: z.array(z.string()),
});

// Schema de regla
const reglaSchema = z.object({
  codigo: z.string(),
  nombre: z.string(),
  descripcion: z.string().nullable(),
  activa: z.boolean(),
  parametros: z.any(),
  prioridad: z.number(),
});

// Schema de respuesta de reglas
export const reglasResponseSchema = z.object({
  reglas: z.array(reglaSchema),
});

// Schema de error
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});
