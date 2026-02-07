import { z } from 'zod';

// Schema para listar materiales (query params)
export const listMaterialesSchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
  soloActivos: z.string().optional().transform(val => val === 'true'),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional()
});

// Schema para obtener material por ID
export const getMaterialByIdSchema = z.object({
  id: z.string().transform(val => parseInt(val, 10))
});

// Schema para crear material
export const createMaterialSchema = z.object({
  nombre: z.string().min(3, 'Nombre debe tener al menos 3 caracteres').max(255),
  codigo: z.string().min(2, 'Código debe tener al menos 2 caracteres').max(50),
  descripcion: z.string().max(500).optional(),
  unidad_medida: z.string().max(20),
  precio_m3: z.number().positive('El precio debe ser mayor a 0'),
  stock_minimo: z.number().min(0, 'Stock mínimo no puede ser negativo').default(0)
});

// Schema para actualizar precio
export const updatePrecioSchema = z.object({
  precio_m3: z.number().positive({ message: 'El precio debe ser mayor a 0' })
});

// Schema para ajustar stock
export const ajustarStockSchema = z.object({
  cantidad: z.number({ message: 'Cantidad es requerida' }),
  motivo: z.string().min(5, { message: 'El motivo debe tener al menos 5 caracteres' })
});

// Schema para material en response
export const materialResponseSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  codigo: z.string(),
  descripcion: z.string().nullable(),
  unidad_medida: z.string(),
  precio_m3: z.number(),
  stock_actual: z.number(),
  stock_minimo: z.number(),
  activo: z.boolean(),
  created_at: z.string(),
  updated_at: z.string()
});

// Schema para lista de materiales
export const materialesListResponseSchema = z.object({
  materiales: z.array(z.object({
    id: z.number(),
    nombre: z.string(),
    codigo: z.string(),
    unidad_medida: z.string(),
    precio_m3: z.number(),
    stock_actual: z.number(),
    stock_minimo: z.number(),
    activo: z.boolean()
  })),
  total: z.number(),
  limit: z.number(),
  offset: z.number()
});

// Schema para historial de precios
export const historialPreciosResponseSchema = z.array(z.object({
  id: z.number(),
  precio_anterior: z.number(),
  precio_nuevo: z.number(),
  fecha_cambio: z.date(),
  usuario_nombre: z.string()
}));

// Schema para respuesta genérica
export const messageResponseSchema = z.object({
  message: z.string()
});

// Schema para estadísticas de materiales
export const estadisticasMaterialesResponseSchema = z.object({
  total_materiales: z.number(),
  stock_critico: z.number(),
  stock_bajo: z.number(),
  stock_normal: z.number(),
  valor_total_inventario: z.number(),
  movimientos_ultimos_30dias: z.number(),
  material_mas_vendido: z.object({
    id: z.number(),
    nombre: z.string(),
    total_vendido_m3: z.number()
  }).nullable()
});
