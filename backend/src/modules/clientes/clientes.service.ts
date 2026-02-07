import * as clientesRepo from './clientes.repository.js';

// Tipos para respuestas
interface Cliente {
  id: number;
  usuario_id: number | null;
  tipo_cliente_id: number;
  razon_social: string;
  nit: string | null;
  telefono: string | null;
  created_at: string;
  updated_at: string;
  usuario_email: string | null;
  tipo_cliente_nombre: string;
}

interface ListClientesResult {
  success: boolean;
  clientes?: Array<{
    id: number;
    razon_social: string;
    nit: string | null;
    telefono: string | null;
    tipo_cliente_nombre: string;
  }>;
  total?: number;
  limit?: number;
  offset?: number;
  message?: string;
}

interface GetClienteResult {
  success: boolean;
  cliente?: Cliente;
  message?: string;
}

interface UpdateClienteResult {
  success: boolean;
  cliente?: Cliente;
  message?: string;
}

// Listar clientes con paginación
export async function listClientes(
  limit: number = 20,
  offset: number = 0,
  sort_by?: string,
  sort_order?: 'asc' | 'desc'
): Promise<ListClientesResult> {
  try {
    const [clientes, total] = await Promise.all([
      clientesRepo.findAllClientes(limit, offset, sort_by, sort_order),
      clientesRepo.countClientes()
    ]);

    return {
      success: true,
      clientes,
      total,
      limit,
      offset
    };
  } catch (error) {
    console.error('Error al listar clientes:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Obtener cliente por ID
export async function getClienteById(id: number): Promise<GetClienteResult> {
  try {
    const cliente = await clientesRepo.findClienteById(id);

    if (!cliente) {
      return {
        success: false,
        message: 'Cliente no encontrado'
      };
    }

    return {
      success: true,
      cliente: {
        id: cliente.id,
        usuario_id: cliente.usuario_id,
        tipo_cliente_id: cliente.tipo_cliente_id,
        razon_social: cliente.razon_social,
        nit: cliente.nit,
        telefono: cliente.telefono,
        created_at: cliente.created_at.toISOString(),
        updated_at: cliente.updated_at.toISOString(),
        usuario_email: cliente.usuario_email || null,
        tipo_cliente_nombre: cliente.tipo_cliente_nombre || ''
      }
    };
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Crear nuevo cliente (admin o gerente)
export async function createCliente(data: {
  razon_social: string;
  tipo_cliente_id: number;
  nit?: string;
  telefono?: string;
}): Promise<UpdateClienteResult> {
  try {
    // Verificar que el NIT no exista si se proporciona
    if (data.nit) {
      const nitExistsResult = await clientesRepo.nitExists(data.nit);
      if (nitExistsResult) {
        return {
          success: false,
          message: 'El NIT ya está registrado'
        };
      }
    }

    // Crear cliente
    const newId = await clientesRepo.createCliente(data);

    // Obtener cliente creado
    const clienteCreado = await clientesRepo.findClienteById(newId);

    return {
      success: true,
      cliente: clienteCreado ? {
        id: clienteCreado.id,
        usuario_id: clienteCreado.usuario_id,
        tipo_cliente_id: clienteCreado.tipo_cliente_id,
        razon_social: clienteCreado.razon_social,
        nit: clienteCreado.nit,
        telefono: clienteCreado.telefono,
        created_at: clienteCreado.created_at.toISOString(),
        updated_at: clienteCreado.updated_at.toISOString(),
        usuario_email: clienteCreado.usuario_email || null,
        tipo_cliente_nombre: clienteCreado.tipo_cliente_nombre || ''
      } : undefined,
      message: 'Cliente creado exitosamente'
    };
  } catch (error) {
    console.error('Error al crear cliente:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Actualizar cliente (admin o gerente)
export async function updateCliente(
  id: number,
  data: {
    razon_social?: string;
    nit?: string;
    telefono?: string;
    tipo_cliente_id?: number;
  }
): Promise<UpdateClienteResult> {
  try {
    // Verificar que el cliente existe
    const cliente = await clientesRepo.findClienteById(id);
    if (!cliente) {
      return {
        success: false,
        message: 'Cliente no encontrado'
      };
    }

    // Si se está actualizando el NIT, verificar que no exista
    if (data.nit && data.nit !== cliente.nit) {
      const nitExists = await clientesRepo.nitExists(data.nit, id);
      if (nitExists) {
        return {
          success: false,
          message: 'El NIT ya está registrado en otro cliente'
        };
      }
    }

    // Actualizar cliente
    const updated = await clientesRepo.updateCliente(id, data);

    if (!updated) {
      return {
        success: false,
        message: 'Error al actualizar cliente'
      };
    }

    // Obtener cliente actualizado
    const clienteActualizado = await clientesRepo.findClienteById(id);

    return {
      success: true,
      cliente: clienteActualizado ? {
        id: clienteActualizado.id,
        usuario_id: clienteActualizado.usuario_id,
        tipo_cliente_id: clienteActualizado.tipo_cliente_id,
        razon_social: clienteActualizado.razon_social,
        nit: clienteActualizado.nit,
        telefono: clienteActualizado.telefono,
        created_at: clienteActualizado.created_at.toISOString(),
        updated_at: clienteActualizado.updated_at.toISOString(),
        usuario_email: clienteActualizado.usuario_email || null,
        tipo_cliente_nombre: clienteActualizado.tipo_cliente_nombre || ''
      } : undefined,
      message: 'Cliente actualizado exitosamente'
    };
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Obtener estadísticas de clientes
export async function getEstadisticas() {
  try {
    const estadisticas = await clientesRepo.getEstadisticasClientes();
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

// Actualizar perfil del cliente (el cliente actualiza sus propios datos)
export async function updateClienteProfile(
  usuarioId: number,
  data: {
    razon_social?: string;
    nit?: string;
    telefono?: string;
    tipo_cliente_id?: number;
  }
): Promise<UpdateClienteResult> {
  try {
    // Buscar cliente por usuario_id
    const cliente = await clientesRepo.findClienteByUsuarioId(usuarioId);

    if (!cliente) {
      return {
        success: false,
        message: 'No se encontró un perfil de cliente asociado a este usuario'
      };
    }

    // Si se está actualizando el NIT, verificar que no exista en otro cliente
    if (data.nit && data.nit !== cliente.nit) {
      const nitExists = await clientesRepo.nitExists(data.nit, cliente.id);
      if (nitExists) {
        return {
          success: false,
          message: 'El NIT ya está registrado en otro cliente'
        };
      }
    }

    // Actualizar cliente
    const updated = await clientesRepo.updateCliente(cliente.id, data);

    if (!updated) {
      return {
        success: false,
        message: 'Error al actualizar perfil'
      };
    }

    // Obtener cliente actualizado
    const clienteActualizado = await clientesRepo.findClienteById(cliente.id);

    return {
      success: true,
      cliente: clienteActualizado ? {
        id: clienteActualizado.id,
        usuario_id: clienteActualizado.usuario_id,
        tipo_cliente_id: clienteActualizado.tipo_cliente_id,
        razon_social: clienteActualizado.razon_social,
        nit: clienteActualizado.nit,
        telefono: clienteActualizado.telefono,
        created_at: clienteActualizado.created_at.toISOString(),
        updated_at: clienteActualizado.updated_at.toISOString(),
        usuario_email: clienteActualizado.usuario_email || null,
        tipo_cliente_nombre: clienteActualizado.tipo_cliente_nombre || ''
      } : undefined,
      message: 'Perfil actualizado exitosamente'
    };
  } catch (error) {
    console.error('Error al actualizar perfil del cliente:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Obtener perfil del cliente autenticado
export async function getClienteProfile(usuarioId: number): Promise<GetClienteResult> {
  try {
    const cliente = await clientesRepo.findClienteByUsuarioId(usuarioId);

    if (!cliente) {
      return {
        success: false,
        message: 'No se encontró un perfil de cliente asociado a este usuario'
      };
    }

    return {
      success: true,
      cliente: {
        id: cliente.id,
        usuario_id: cliente.usuario_id,
        tipo_cliente_id: cliente.tipo_cliente_id,
        razon_social: cliente.razon_social,
        nit: cliente.nit,
        telefono: cliente.telefono,
        created_at: cliente.created_at.toISOString(),
        updated_at: cliente.updated_at.toISOString(),
        usuario_email: cliente.usuario_email || null,
        tipo_cliente_nombre: cliente.tipo_cliente_nombre || ''
      }
    };
  } catch (error) {
    console.error('Error al obtener perfil del cliente:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

