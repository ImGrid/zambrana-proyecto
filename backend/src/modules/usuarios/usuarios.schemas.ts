import { z } from 'zod';

// Schema para listar usuarios (query params)
export const listUsuariosSchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional()
});

// Schema para obtener usuario por ID
export const getUsuarioByIdSchema = z.object({
  id: z.string().transform(val => parseInt(val, 10))
});

// Schema para actualizar usuario
export const updateUsuarioSchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').optional(),
  rol: z.enum(['admin', 'gerente', 'conductor', 'cliente']).optional(),
  activo: z.boolean().optional()
}).refine(
  data => Object.keys(data).length > 0,
  { message: 'Debe proporcionar al menos un campo para actualizar' }
);

// Schema para cambiar contraseña
export const changePasswordSchema = z.object({
  currentPassword: z.string({ message: 'Contraseña actual es requerida' }),
  newPassword: z
    .string({ message: 'Nueva contraseña es requerida' })
    .min(8, { message: 'Contraseña debe tener al menos 8 caracteres' })
    .regex(/[A-Z]/, { message: 'Debe contener al menos una letra mayúscula' })
    .regex(/[0-9]/, { message: 'Debe contener al menos un número' }),
  confirmPassword: z.string({ message: 'Confirmación de contraseña es requerida' })
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

// Schema para usuario en response
export const usuarioResponseSchema = z.object({
  id: z.number(),
  email: z.string(),
  nombre: z.string(),
  rol: z.string(),
  activo: z.boolean(),
  created_at: z.string()
});

// Schema para lista de usuarios
export const usuariosListResponseSchema = z.object({
  usuarios: z.array(usuarioResponseSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number()
});

// Schema para respuesta de actualización
export const usuarioUpdatedResponseSchema = z.object({
  message: z.string(),
  usuario: usuarioResponseSchema
});

// Schema para respuesta genérica
export const messageResponseSchema = z.object({
  message: z.string()
});
