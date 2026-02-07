import * as camionesRepo from './camiones.repository.js';

// Tipos para respuestas
interface Camion {
  id: number;
  placa: string;
  tipo_camion_id: number;
  tipo_camion: string;
  marca: string | null;
  modelo: string | null;
  año: number | null;
  capacidad_m3: number;
  color: string | null;
  activo: boolean;
  en_mantenimiento: boolean;
  created_at: string;
  updated_at: string;
}

interface ListCamionesResult {
  success: boolean;
  camiones?: Array<{
    id: number;
    placa: string;
    tipo_camion: string;
    marca: string | null;
    modelo: string | null;
    capacidad_m3: number;
    activo: boolean;
    en_mantenimiento: boolean;
  }>;
  total?: number;
  limit?: number;
  offset?: number;
  message?: string;
}

interface GetCamionResult {
  success: boolean;
  camion?: Camion;
  message?: string;
}

interface UpdateCamionResult {
  success: boolean;
  camion?: Camion;
  message?: string;
}

// Listar camiones con paginación y filtros
export async function listCamiones(
  limit: number = 20,
  offset: number = 0,
  soloActivos: boolean = false,
  soloDisponibles: boolean = false,
  sort_by?: string,
  sort_order?: 'asc' | 'desc'
): Promise<ListCamionesResult> {
  try {
    const [camiones, total] = await Promise.all([
      camionesRepo.findAllCamiones(limit, offset, soloActivos, soloDisponibles, sort_by, sort_order),
      camionesRepo.countCamiones(soloActivos, soloDisponibles)
    ]);

    return {
      success: true,
      camiones,
      total,
      limit,
      offset
    };
  } catch (error) {
    console.error('Error al listar camiones:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Obtener camión por ID
export async function getCamionById(id: number): Promise<GetCamionResult> {
  try {
    const camion = await camionesRepo.findCamionById(id);

    if (!camion) {
      return {
        success: false,
        message: 'Camión no encontrado'
      };
    }

    return {
      success: true,
      camion: {
        id: camion.id,
        placa: camion.placa,
        tipo_camion_id: camion.tipo_camion_id,
        tipo_camion: camion.tipo_camion || '',
        marca: camion.marca,
        modelo: camion.modelo,
        año: camion.año,
        capacidad_m3: camion.capacidad_m3,
        color: camion.color,
        activo: camion.activo,
        en_mantenimiento: camion.en_mantenimiento,
        created_at: camion.created_at.toISOString(),
        updated_at: camion.updated_at.toISOString()
      }
    };
  } catch (error) {
    console.error('Error al obtener camión:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Crear nuevo camión (admin o gerente)
export async function createCamion(data: {
  placa: string;
  tipo_camion_id: number;
  marca?: string;
  modelo?: string;
  año?: number;
  capacidad_m3: number;
  color?: string;
}): Promise<UpdateCamionResult> {
  try {
    // Verificar que la placa no exista
    const placaExists = await camionesRepo.placaExists(data.placa);
    if (placaExists) {
      return {
        success: false,
        message: 'La placa ya está registrada'
      };
    }

    // Crear camión
    const newId = await camionesRepo.createCamion(data);

    // Obtener camión creado
    const camionCreado = await camionesRepo.findCamionById(newId);

    return {
      success: true,
      camion: camionCreado ? {
        id: camionCreado.id,
        placa: camionCreado.placa,
        tipo_camion_id: camionCreado.tipo_camion_id,
        tipo_camion: camionCreado.tipo_camion || '',
        marca: camionCreado.marca,
        modelo: camionCreado.modelo,
        año: camionCreado.año,
        capacidad_m3: camionCreado.capacidad_m3,
        color: camionCreado.color,
        activo: camionCreado.activo,
        en_mantenimiento: camionCreado.en_mantenimiento,
        created_at: camionCreado.created_at.toISOString(),
        updated_at: camionCreado.updated_at.toISOString()
      } : undefined,
      message: 'Camión creado exitosamente'
    };
  } catch (error) {
    console.error('Error al crear camión:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Actualizar camión (admin o gerente)
export async function updateCamion(
  id: number,
  data: {
    placa?: string;
    tipo_camion_id?: number;
    marca?: string;
    modelo?: string;
    año?: number;
    capacidad_m3?: number;
    color?: string;
  }
): Promise<UpdateCamionResult> {
  try {
    // Verificar que el camión existe
    const camion = await camionesRepo.findCamionById(id);
    if (!camion) {
      return {
        success: false,
        message: 'Camión no encontrado'
      };
    }

    // Si se está actualizando la placa, verificar que no exista
    if (data.placa && data.placa !== camion.placa) {
      const placaExists = await camionesRepo.placaExists(data.placa, id);
      if (placaExists) {
        return {
          success: false,
          message: 'La placa ya está registrada en otro camión'
        };
      }
    }

    // Actualizar camión
    const updated = await camionesRepo.updateCamion(id, data);

    if (!updated) {
      return {
        success: false,
        message: 'Error al actualizar camión'
      };
    }

    // Obtener camión actualizado
    const camionActualizado = await camionesRepo.findCamionById(id);

    return {
      success: true,
      camion: camionActualizado ? {
        id: camionActualizado.id,
        placa: camionActualizado.placa,
        tipo_camion_id: camionActualizado.tipo_camion_id,
        tipo_camion: camionActualizado.tipo_camion || '',
        marca: camionActualizado.marca,
        modelo: camionActualizado.modelo,
        año: camionActualizado.año,
        capacidad_m3: camionActualizado.capacidad_m3,
        color: camionActualizado.color,
        activo: camionActualizado.activo,
        en_mantenimiento: camionActualizado.en_mantenimiento,
        created_at: camionActualizado.created_at.toISOString(),
        updated_at: camionActualizado.updated_at.toISOString()
      } : undefined,
      message: 'Camión actualizado exitosamente'
    };
  } catch (error) {
    console.error('Error al actualizar camión:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Activar/desactivar camión (solo admin)
export async function toggleActivo(id: number): Promise<UpdateCamionResult> {
  try {
    const updated = await camionesRepo.toggleActivoCamion(id);

    if (!updated) {
      return {
        success: false,
        message: 'Camión no encontrado'
      };
    }

    const camionActualizado = await camionesRepo.findCamionById(id);

    return {
      success: true,
      camion: camionActualizado ? {
        id: camionActualizado.id,
        placa: camionActualizado.placa,
        tipo_camion_id: camionActualizado.tipo_camion_id,
        tipo_camion: camionActualizado.tipo_camion || '',
        marca: camionActualizado.marca,
        modelo: camionActualizado.modelo,
        año: camionActualizado.año,
        capacidad_m3: camionActualizado.capacidad_m3,
        color: camionActualizado.color,
        activo: camionActualizado.activo,
        en_mantenimiento: camionActualizado.en_mantenimiento,
        created_at: camionActualizado.created_at.toISOString(),
        updated_at: camionActualizado.updated_at.toISOString()
      } : undefined,
      message: `Camión ${camionActualizado?.activo ? 'activado' : 'desactivado'} exitosamente`
    };
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Cambiar estado de mantenimiento (admin o gerente)
export async function toggleMantenimiento(id: number): Promise<UpdateCamionResult> {
  try {
    const updated = await camionesRepo.toggleMantenimientoCamion(id);

    if (!updated) {
      return {
        success: false,
        message: 'Camión no encontrado'
      };
    }

    const camionActualizado = await camionesRepo.findCamionById(id);

    return {
      success: true,
      camion: camionActualizado ? {
        id: camionActualizado.id,
        placa: camionActualizado.placa,
        tipo_camion_id: camionActualizado.tipo_camion_id,
        tipo_camion: camionActualizado.tipo_camion || '',
        marca: camionActualizado.marca,
        modelo: camionActualizado.modelo,
        año: camionActualizado.año,
        capacidad_m3: camionActualizado.capacidad_m3,
        color: camionActualizado.color,
        activo: camionActualizado.activo,
        en_mantenimiento: camionActualizado.en_mantenimiento,
        created_at: camionActualizado.created_at.toISOString(),
        updated_at: camionActualizado.updated_at.toISOString()
      } : undefined,
      message: `Camión ${camionActualizado?.en_mantenimiento ? 'en mantenimiento' : 'disponible'}`
    };
  } catch (error) {
    console.error('Error al cambiar estado de mantenimiento:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Obtener estadísticas de camiones
export async function getEstadisticas() {
  try {
    const estadisticas = await camionesRepo.getEstadisticasCamiones();
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
