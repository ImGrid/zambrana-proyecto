import * as conductoresRepo from './conductores.repository.js';

// Tipos para respuestas
interface Conductor {
  id: number;
  usuario_id: number | null;
  nombre_completo: string;
  ci: string;
  telefono: string | null;
  licencia_categoria: string | null;
  fecha_vencimiento_licencia: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  usuario_email: string | null;
}

interface ListConductoresResult {
  success: boolean;
  conductores?: Array<{
    id: number;
    nombre_completo: string;
    ci: string;
    telefono: string | null;
    licencia_categoria: string | null;
    activo: boolean;
  }>;
  total?: number;
  limit?: number;
  offset?: number;
  message?: string;
}

interface GetConductorResult {
  success: boolean;
  conductor?: Conductor;
  message?: string;
}

interface UpdateConductorResult {
  success: boolean;
  conductor?: Conductor;
  message?: string;
}

// Listar conductores con paginación y filtros
export async function listConductores(
  limit: number = 20,
  offset: number = 0,
  soloActivos: boolean = false
): Promise<ListConductoresResult> {
  try {
    const [conductores, total] = await Promise.all([
      conductoresRepo.findAllConductores(limit, offset, soloActivos),
      conductoresRepo.countConductores(soloActivos)
    ]);

    return {
      success: true,
      conductores,
      total,
      limit,
      offset
    };
  } catch (error) {
    console.error('Error al listar conductores:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Obtener conductor por ID
export async function getConductorById(id: number): Promise<GetConductorResult> {
  try {
    const conductor = await conductoresRepo.findConductorById(id);

    if (!conductor) {
      return {
        success: false,
        message: 'Conductor no encontrado'
      };
    }

    return {
      success: true,
      conductor: {
        id: conductor.id,
        usuario_id: conductor.usuario_id,
        nombre_completo: conductor.nombre_completo,
        ci: conductor.ci,
        telefono: conductor.telefono,
        licencia_categoria: conductor.licencia_categoria,
        fecha_vencimiento_licencia: conductor.fecha_vencimiento_licencia
          ? conductor.fecha_vencimiento_licencia.toISOString()
          : null,
        activo: conductor.activo,
        created_at: conductor.created_at.toISOString(),
        updated_at: conductor.updated_at.toISOString(),
        usuario_email: conductor.usuario_email || null
      }
    };
  } catch (error) {
    console.error('Error al obtener conductor:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Crear nuevo conductor (admin o gerente)
export async function createConductor(data: {
  nombre_completo: string;
  ci: string;
  telefono?: string;
  licencia_categoria?: string;
  fecha_vencimiento_licencia?: string;
}): Promise<UpdateConductorResult> {
  try {
    // Verificar que el CI no exista
    const ciExistsResult = await conductoresRepo.ciExists(data.ci);
    if (ciExistsResult) {
      return {
        success: false,
        message: 'El CI ya está registrado'
      };
    }

    // Crear conductor
    const newId = await conductoresRepo.createConductor(data);

    // Obtener conductor creado
    const conductorCreado = await conductoresRepo.findConductorById(newId);

    return {
      success: true,
      conductor: conductorCreado ? {
        id: conductorCreado.id,
        usuario_id: conductorCreado.usuario_id,
        nombre_completo: conductorCreado.nombre_completo,
        ci: conductorCreado.ci,
        telefono: conductorCreado.telefono,
        licencia_categoria: conductorCreado.licencia_categoria,
        fecha_vencimiento_licencia: conductorCreado.fecha_vencimiento_licencia
          ? conductorCreado.fecha_vencimiento_licencia.toISOString()
          : null,
        activo: conductorCreado.activo,
        created_at: conductorCreado.created_at.toISOString(),
        updated_at: conductorCreado.updated_at.toISOString(),
        usuario_email: conductorCreado.usuario_email || null
      } : undefined,
      message: 'Conductor creado exitosamente'
    };
  } catch (error) {
    console.error('Error al crear conductor:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Actualizar conductor (admin o gerente)
export async function updateConductor(
  id: number,
  data: {
    nombre_completo?: string;
    ci?: string;
    telefono?: string;
    licencia_categoria?: string;
    fecha_vencimiento_licencia?: string;
  }
): Promise<UpdateConductorResult> {
  try {
    // Verificar que el conductor existe
    const conductor = await conductoresRepo.findConductorById(id);
    if (!conductor) {
      return {
        success: false,
        message: 'Conductor no encontrado'
      };
    }

    // Si se está actualizando el CI, verificar que no exista
    if (data.ci && data.ci !== conductor.ci) {
      const ciExists = await conductoresRepo.ciExists(data.ci, id);
      if (ciExists) {
        return {
          success: false,
          message: 'El CI ya está registrado en otro conductor'
        };
      }
    }

    // Convertir fecha si viene como string
    const updateData: {
      nombre_completo?: string;
      ci?: string;
      telefono?: string;
      licencia_categoria?: string;
      fecha_vencimiento_licencia?: Date;
    } = {};

    if (data.nombre_completo !== undefined) {
      updateData.nombre_completo = data.nombre_completo;
    }
    if (data.ci !== undefined) {
      updateData.ci = data.ci;
    }
    if (data.telefono !== undefined) {
      updateData.telefono = data.telefono;
    }
    if (data.licencia_categoria !== undefined) {
      updateData.licencia_categoria = data.licencia_categoria;
    }

    if (data.fecha_vencimiento_licencia) {
      const fechaVencimiento = new Date(data.fecha_vencimiento_licencia);
      updateData.fecha_vencimiento_licencia = fechaVencimiento;

      // Validar que la fecha sea futura
      if (fechaVencimiento <= new Date()) {
        return {
          success: false,
          message: 'La fecha de vencimiento de licencia debe ser futura'
        };
      }
    }

    // Actualizar conductor
    const updated = await conductoresRepo.updateConductor(id, updateData);

    if (!updated) {
      return {
        success: false,
        message: 'Error al actualizar conductor'
      };
    }

    // Obtener conductor actualizado
    const conductorActualizado = await conductoresRepo.findConductorById(id);

    return {
      success: true,
      conductor: conductorActualizado ? {
        id: conductorActualizado.id,
        usuario_id: conductorActualizado.usuario_id,
        nombre_completo: conductorActualizado.nombre_completo,
        ci: conductorActualizado.ci,
        telefono: conductorActualizado.telefono,
        licencia_categoria: conductorActualizado.licencia_categoria,
        fecha_vencimiento_licencia: conductorActualizado.fecha_vencimiento_licencia
          ? conductorActualizado.fecha_vencimiento_licencia.toISOString()
          : null,
        activo: conductorActualizado.activo,
        created_at: conductorActualizado.created_at.toISOString(),
        updated_at: conductorActualizado.updated_at.toISOString(),
        usuario_email: conductorActualizado.usuario_email || null
      } : undefined,
      message: 'Conductor actualizado exitosamente'
    };
  } catch (error) {
    console.error('Error al actualizar conductor:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Activar/desactivar conductor (solo admin)
export async function toggleActivo(id: number): Promise<UpdateConductorResult> {
  try {
    const updated = await conductoresRepo.toggleActivoConductor(id);

    if (!updated) {
      return {
        success: false,
        message: 'Conductor no encontrado'
      };
    }

    const conductorActualizado = await conductoresRepo.findConductorById(id);

    return {
      success: true,
      conductor: conductorActualizado ? {
        id: conductorActualizado.id,
        usuario_id: conductorActualizado.usuario_id,
        nombre_completo: conductorActualizado.nombre_completo,
        ci: conductorActualizado.ci,
        telefono: conductorActualizado.telefono,
        licencia_categoria: conductorActualizado.licencia_categoria,
        fecha_vencimiento_licencia: conductorActualizado.fecha_vencimiento_licencia
          ? conductorActualizado.fecha_vencimiento_licencia.toISOString()
          : null,
        activo: conductorActualizado.activo,
        created_at: conductorActualizado.created_at.toISOString(),
        updated_at: conductorActualizado.updated_at.toISOString(),
        usuario_email: conductorActualizado.usuario_email || null
      } : undefined,
      message: `Conductor ${conductorActualizado?.activo ? 'activado' : 'desactivado'} exitosamente`
    };
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Obtener licencias próximas a vencer
export async function getLicenciasProximasVencer(diasAntes: number = 30) {
  try {
    const conductores = await conductoresRepo.findLicenciasProximasVencer(diasAntes);

    return {
      success: true,
      conductores: conductores.map(c => ({
        id: c.id,
        nombre_completo: c.nombre_completo,
        ci: c.ci,
        telefono: c.telefono,
        licencia_categoria: c.licencia_categoria,
        fecha_vencimiento_licencia: c.fecha_vencimiento_licencia
          ? c.fecha_vencimiento_licencia.toISOString()
          : null,
        activo: c.activo
      }))
    };
  } catch (error) {
    console.error('Error al obtener licencias próximas a vencer:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Obtener estadísticas de conductores
export async function getEstadisticas() {
  try {
    const estadisticas = await conductoresRepo.getEstadisticasConductores();
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
