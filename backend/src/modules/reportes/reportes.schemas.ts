import { z } from 'zod';

// Input schemas para consultas

export const getDashboardQuerySchema = z.object({
  dias: z.string().optional().transform(val => val ? parseInt(val, 10) : 30)
});

export const getClienteMensualParamsSchema = z.object({
  id: z.string().transform(val => parseInt(val, 10))
});

export const getClienteMensualQuerySchema = z.object({
  meses: z.string().optional().transform(val => val ? parseInt(val, 10) : 6)
});

export const getConductorRendimientoParamsSchema = z.object({
  id: z.string().transform(val => parseInt(val, 10))
});

export const getStockQuerySchema = z.object({
  estado: z.enum(['CRÍTICO', 'BAJO', 'NORMAL', 'TODOS']).optional().default('TODOS')
});

export const getVentasQuerySchema = z.object({
  fecha_desde: z.string().optional(),
  fecha_hasta: z.string().optional(),
  cliente_id: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  material_id: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0)
});

// Output schemas para respuestas

export const metricaDashboardSchema = z.object({
  fecha: z.string(),
  total_pedidos: z.coerce.number(),
  entregados: z.coerce.number(),
  cancelados: z.coerce.number(),
  en_proceso: z.coerce.number(),
  ingresos_dia: z.coerce.number(),
  tiempo_promedio_entrega: z.coerce.number().nullable(),
  conductores_activos: z.coerce.number(),
  camiones_activos: z.coerce.number()
});

export const dashboardResponseSchema = z.object({
  metricas: z.array(metricaDashboardSchema),
  resumen: z.object({
    total_pedidos: z.number(),
    total_ingresos: z.number(),
    promedio_diario: z.number(),
    tasa_entrega: z.number()
  })
});

export const clienteMensualSchema = z.object({
  mes: z.string(),
  total_pedidos: z.coerce.number(),
  total_gastado: z.coerce.number(),
  total_m3_comprados: z.coerce.number(),
  tiempo_promedio_entrega: z.coerce.number().nullable(),
  pedidos_cancelados: z.coerce.number(),
  pedidos_entregados: z.coerce.number()
});

export const clienteMensualResponseSchema = z.object({
  cliente: z.object({
    id: z.number(),
    razon_social: z.string()
  }),
  reportes: z.array(clienteMensualSchema),
  totales: z.object({
    total_pedidos: z.number(),
    total_gastado: z.number(),
    total_m3: z.number()
  })
});

export const conductorRendimientoResponseSchema = z.object({
  conductor: z.object({
    id: z.number(),
    nombre_completo: z.string()
  }),
  total_entregas: z.coerce.number(),
  tiempo_promedio_entrega: z.coerce.number().nullable(),
  entregas_exitosas: z.coerce.number(),
  entregas_fallidas: z.coerce.number(),
  adherencia_promedio_ruta: z.coerce.number().nullable(),
  total_desviaciones: z.coerce.number(),
  tasa_exito: z.number()
});

export const materialStockSchema = z.object({
  material_id: z.number(),
  nombre: z.string(),
  codigo: z.string(),
  stock_actual: z.coerce.number(),
  stock_minimo: z.coerce.number(),
  precio_m3: z.coerce.number(),
  total_movimientos_30dias: z.coerce.number(),
  entradas_30dias: z.coerce.number(),
  salidas_30dias: z.coerce.number(),
  estado_stock: z.string()
});

export const stockResponseSchema = z.object({
  materiales: z.array(materialStockSchema),
  resumen: z.object({
    total_materiales: z.number(),
    criticos: z.number(),
    bajos: z.number(),
    normales: z.number()
  })
});

export const ventaItemSchema = z.object({
  pedido_id: z.number(),
  codigo_seguimiento: z.string(),
  fecha_pedido: z.string(),
  cliente_razon_social: z.string(),
  material_nombre: z.string(),
  cantidad_m3: z.coerce.number(),
  precio_unitario: z.coerce.number(),
  subtotal: z.coerce.number(),
  estado_nombre: z.string()
});

export const ventasResponseSchema = z.object({
  ventas: z.array(ventaItemSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  totales: z.object({
    total_ventas: z.number(),
    total_m3: z.number(),
    monto_total: z.number()
  })
});

export const refreshViewsResponseSchema = z.object({
  message: z.string(),
  refreshed: z.array(z.string()),
  errors: z.array(z.object({
    view: z.string(),
    error: z.string()
  })),
  duration_ms: z.number()
});

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string()
});
