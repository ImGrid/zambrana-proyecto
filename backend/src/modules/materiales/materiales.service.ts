import * as materialesRepo from './materiales.repository.js';

// Tipos para respuestas
interface Material {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  unidad_medida: string;
  precio_m3: number;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

interface ListMaterialesResult {
  success: boolean;
  materiales?: Array<{
    id: number;
    nombre: string;
    codigo: string;
    unidad_medida: string;
    precio_m3: number;
    stock_actual: number;
    stock_minimo: number;
    activo: boolean;
  }>;
  total?: number;
  limit?: number;
  offset?: number;
  message?: string;
}

interface GetMaterialResult {
  success: boolean;
  material?: Material;
  message?: string;
}

interface UpdatePrecioResult {
  success: boolean;
  material?: Material;
  message?: string;
}

interface AjustarStockResult {
  success: boolean;
  material?: Material;
  message?: string;
}

// Listar materiales con paginación
export async function listMateriales(
  limit: number = 20,
  offset: number = 0,
  soloActivos: boolean = false
): Promise<ListMaterialesResult> {
  try {
    const [materiales, total] = await Promise.all([
      materialesRepo.findAllMateriales(limit, offset, soloActivos),
      materialesRepo.countMateriales(soloActivos)
    ]);

    return {
      success: true,
      materiales,
      total,
      limit,
      offset
    };
  } catch (error) {
    console.error('Error al listar materiales:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Obtener material por ID
export async function getMaterialById(id: number): Promise<GetMaterialResult> {
  try {
    const material = await materialesRepo.findMaterialById(id);

    if (!material) {
      return {
        success: false,
        message: 'Material no encontrado'
      };
    }

    return {
      success: true,
      material: {
        id: material.id,
        nombre: material.nombre,
        codigo: material.codigo,
        descripcion: material.descripcion,
        unidad_medida: material.unidad_medida,
        precio_m3: material.precio_m3,
        stock_actual: material.stock_actual,
        stock_minimo: material.stock_minimo,
        activo: material.activo,
        created_at: material.created_at.toISOString(),
        updated_at: material.updated_at.toISOString()
      }
    };
  } catch (error) {
    console.error('Error al obtener material:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Crear nuevo material (admin o gerente)
export async function createMaterial(data: {
  nombre: string;
  codigo: string;
  descripcion?: string;
  unidad_medida: string;
  precio_m3: number;
  stock_minimo: number;
}): Promise<UpdatePrecioResult> {
  try {
    // Verificar que el código no exista
    const codigoExistsResult = await materialesRepo.codigoExists(data.codigo);
    if (codigoExistsResult) {
      return {
        success: false,
        message: 'El código ya está registrado'
      };
    }

    // Crear material
    const newId = await materialesRepo.createMaterial(data);

    // Obtener material creado
    const materialCreado = await materialesRepo.findMaterialById(newId);

    return {
      success: true,
      material: materialCreado ? {
        id: materialCreado.id,
        nombre: materialCreado.nombre,
        codigo: materialCreado.codigo,
        descripcion: materialCreado.descripcion,
        unidad_medida: materialCreado.unidad_medida,
        precio_m3: materialCreado.precio_m3,
        stock_actual: materialCreado.stock_actual,
        stock_minimo: materialCreado.stock_minimo,
        activo: materialCreado.activo,
        created_at: materialCreado.created_at.toISOString(),
        updated_at: materialCreado.updated_at.toISOString()
      } : undefined,
      message: 'Material creado exitosamente'
    };
  } catch (error) {
    console.error('Error al crear material:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Actualizar precio de material (solo admin)
export async function updatePrecio(
  id: number,
  nuevoPrecio: number,
  usuarioId: number
): Promise<UpdatePrecioResult> {
  try {
    // Verificar que el material existe
    const material = await materialesRepo.findMaterialById(id);
    if (!material) {
      return {
        success: false,
        message: 'Material no encontrado'
      };
    }

    // Validar que el precio sea diferente
    if (material.precio_m3 === nuevoPrecio) {
      return {
        success: false,
        message: 'El precio nuevo debe ser diferente al actual'
      };
    }

    // Actualizar precio (crea historial automáticamente)
    const updated = await materialesRepo.updatePrecioMaterial(id, nuevoPrecio, usuarioId);

    if (!updated) {
      return {
        success: false,
        message: 'Error al actualizar precio'
      };
    }

    // Obtener material actualizado
    const materialActualizado = await materialesRepo.findMaterialById(id);

    return {
      success: true,
      material: materialActualizado ? {
        id: materialActualizado.id,
        nombre: materialActualizado.nombre,
        codigo: materialActualizado.codigo,
        descripcion: materialActualizado.descripcion,
        unidad_medida: materialActualizado.unidad_medida,
        precio_m3: materialActualizado.precio_m3,
        stock_actual: materialActualizado.stock_actual,
        stock_minimo: materialActualizado.stock_minimo,
        activo: materialActualizado.activo,
        created_at: materialActualizado.created_at.toISOString(),
        updated_at: materialActualizado.updated_at.toISOString()
      } : undefined,
      message: 'Precio actualizado exitosamente'
    };
  } catch (error) {
    console.error('Error al actualizar precio:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Ajustar stock manualmente (admin o gerente)
export async function ajustarStock(
  id: number,
  cantidad: number,
  usuarioId: number,
  motivo: string
): Promise<AjustarStockResult> {
  try {
    // Verificar que el material existe
    const material = await materialesRepo.findMaterialById(id);
    if (!material) {
      return {
        success: false,
        message: 'Material no encontrado'
      };
    }

    // Validar que el ajuste no deje stock negativo
    const stockNuevo = material.stock_actual + cantidad;
    if (stockNuevo < 0) {
      return {
        success: false,
        message: 'El ajuste dejaría el stock en negativo'
      };
    }

    // Ajustar stock
    const updated = await materialesRepo.ajustarStock(id, cantidad, usuarioId, motivo);

    if (!updated) {
      return {
        success: false,
        message: 'Error al ajustar stock'
      };
    }

    // Obtener material actualizado
    const materialActualizado = await materialesRepo.findMaterialById(id);

    return {
      success: true,
      material: materialActualizado ? {
        id: materialActualizado.id,
        nombre: materialActualizado.nombre,
        codigo: materialActualizado.codigo,
        descripcion: materialActualizado.descripcion,
        unidad_medida: materialActualizado.unidad_medida,
        precio_m3: materialActualizado.precio_m3,
        stock_actual: materialActualizado.stock_actual,
        stock_minimo: materialActualizado.stock_minimo,
        activo: materialActualizado.activo,
        created_at: materialActualizado.created_at.toISOString(),
        updated_at: materialActualizado.updated_at.toISOString()
      } : undefined,
      message: 'Stock ajustado exitosamente'
    };
  } catch (error) {
    console.error('Error al ajustar stock:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Activar/desactivar material (solo admin)
export async function toggleActivo(id: number): Promise<AjustarStockResult> {
  try {
    const updated = await materialesRepo.toggleActivoMaterial(id);

    if (!updated) {
      return {
        success: false,
        message: 'Material no encontrado'
      };
    }

    const materialActualizado = await materialesRepo.findMaterialById(id);

    return {
      success: true,
      material: materialActualizado ? {
        id: materialActualizado.id,
        nombre: materialActualizado.nombre,
        codigo: materialActualizado.codigo,
        descripcion: materialActualizado.descripcion,
        unidad_medida: materialActualizado.unidad_medida,
        precio_m3: materialActualizado.precio_m3,
        stock_actual: materialActualizado.stock_actual,
        stock_minimo: materialActualizado.stock_minimo,
        activo: materialActualizado.activo,
        created_at: materialActualizado.created_at.toISOString(),
        updated_at: materialActualizado.updated_at.toISOString()
      } : undefined,
      message: `Material ${materialActualizado?.activo ? 'activado' : 'desactivado'} exitosamente`
    };
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Obtener historial de precios
export async function getHistorialPrecios(id: number, limit: number = 10) {
  try {
    const historial = await materialesRepo.getHistorialPrecios(id, limit);
    return {
      success: true,
      historial
    };
  } catch (error) {
    console.error('Error al obtener historial:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Obtener estadísticas de materiales
export async function getEstadisticas() {
  try {
    const estadisticas = await materialesRepo.getEstadisticasMateriales();
    return {
      success: true,
      data: estadisticas
    };
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}
