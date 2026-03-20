import { z } from 'zod';

/**
 * Schema para iniciar una entrega
 * Solo necesita el pedido_id, el resto se obtiene de la base de datos
 */
export const iniciarEntregaSchema = z.object({
  pedido_id: z.number().int().positive()
});

export type IniciarEntregaInput = z.infer<typeof iniciarEntregaSchema>;

/**
 * Schema para recibir una posición GPS
 * El conductor envia esto cada 10 segundos desde la app movil
 */
export const recibirGPSSchema = z.object({
  latitud: z
    .number()
    .min(-90, 'Latitud debe estar entre -90 y 90')
    .max(90, 'Latitud debe estar entre -90 y 90'),

  longitud: z
    .number()
    .min(-180, 'Longitud debe estar entre -180 y 180')
    .max(180, 'Longitud debe estar entre -180 y 180'),

  velocidad_kmh: z
    .number()
    .min(0, 'Velocidad no puede ser negativa')
    .max(200, 'Velocidad no puede exceder 200 km/h')
    .optional(),

  direccion_grados: z
    .number()
    .min(0, 'Dirección debe estar entre 0 y 360 grados')
    .max(360, 'Dirección debe estar entre 0 y 360 grados')
    .optional(),

  precision_metros: z
    .number()
    .min(0, 'Precisión no puede ser negativa')
    .optional(),

  timestamp: z
    .string()
    .datetime({ message: 'Timestamp debe ser formato ISO 8601' })
    .optional()
});

export type RecibirGPSInput = z.infer<typeof recibirGPSSchema>;

/**
 * Schema para finalizar una entrega
 * Firma y foto son opcionales pero recomendados
 */
export const finalizarEntregaSchema = z.object({
  firma_cliente: z
    .string()
    .startsWith('data:image/', 'Firma debe ser una imagen en formato Base64')
    .optional(),

  foto_comprobante: z
    .string()
    .startsWith('data:image/', 'Foto debe ser una imagen en formato Base64')
    .optional(),

  observaciones: z
    .string()
    .max(500, 'Observaciones no puede exceder 500 caracteres')
    .optional()
});

export type FinalizarEntregaInput = z.infer<typeof finalizarEntregaSchema>;

/**
 * Schema para parámetros de paginación en listados
 */
export const paginacionSchema = z.object({
  limite: z
    .string()
    .optional()
    .default('50')
    .transform(val => parseInt(val, 10))
    .pipe(
      z.number()
        .int()
        .min(1, 'Límite debe ser al menos 1')
        .max(100, 'Límite no puede exceder 100')
    ),

  offset: z
    .string()
    .optional()
    .default('0')
    .transform(val => parseInt(val, 10))
    .pipe(
      z.number()
        .int()
        .min(0, 'Offset no puede ser negativo')
    )
});

export type PaginacionInput = z.infer<typeof paginacionSchema>;

/**
 * Schema para parámetro de ID en rutas
 */
export const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID debe ser un número')
    .transform(val => parseInt(val, 10))
    .pipe(z.number().int().positive())
});

export type IdParamInput = z.infer<typeof idParamSchema>;

/**
 * Schema para parámetro de pedido ID en rutas
 */
export const pedidoIdParamSchema = z.object({
  pedidoId: z
    .string()
    .regex(/^\d+$/, 'Pedido ID debe ser un número')
    .transform(val => parseInt(val, 10))
    .pipe(z.number().int().positive())
});

export type PedidoIdParamInput = z.infer<typeof pedidoIdParamSchema>;

// Tipos de eventos de movimiento que el conductor puede reportar
const tiposEventoMovimiento = [
  'DETENIDO',
  'REANUDO',
] as const;

// Motivos de detencion predefinidos
const motivosDetencion = [
  'TRAFICO',
  'PROBLEMA_MECANICO',
  'DESCANSO',
  'CLIENTE_NO_DISPONIBLE',
  'OTRO',
] as const;

/**
 * Schema para registrar evento de movimiento
 * El conductor reporta cuando esta detenido o reanuda la marcha
 */
export const registrarEventoSchema = z.object({
  tipo: z.enum(tiposEventoMovimiento, {
    message: 'Tipo debe ser DETENIDO o REANUDO'
  }),

  motivo: z.enum(motivosDetencion, {
    message: 'Motivo no valido'
  }).optional(),

  descripcion: z
    .string()
    .max(500, 'Descripcion no puede exceder 500 caracteres')
    .optional(),

  latitud: z
    .number()
    .min(-90, 'Latitud debe estar entre -90 y 90')
    .max(90, 'Latitud debe estar entre -90 y 90')
    .optional(),

  longitud: z
    .number()
    .min(-180, 'Longitud debe estar entre -180 y 180')
    .max(180, 'Longitud debe estar entre -180 y 180')
    .optional()
});

export type RegistrarEventoInput = z.infer<typeof registrarEventoSchema>;
