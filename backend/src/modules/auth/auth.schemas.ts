import { z } from 'zod';

// Schema de login con validación robusta
export const loginSchema = z.object({
  email: z
    .string({ message: 'Email es requerido' })
    .email({ message: 'Formato de email inválido' })
    .transform(val => val.toLowerCase().trim()),
  password: z
    .string({ message: 'Contraseña es requerida' })
    .min(1, { message: 'Contraseña no puede estar vacía' })
});

// Schema de registro con validación de password robusta
export const registerSchema = z.object({
  email: z
    .string({ message: 'Email es requerido' })
    .email({ message: 'Formato de email inválido' })
    .transform(val => val.toLowerCase().trim()),
  password: z
    .string({ message: 'Contraseña es requerida' })
    .min(8, { message: 'Contraseña debe tener al menos 8 caracteres' })
    .regex(/[A-Z]/, { message: 'Debe contener al menos una letra mayúscula' })
    .regex(/[0-9]/, { message: 'Debe contener al menos un número' }),
  confirmPassword: z.string({ message: 'Confirmación de contraseña es requerida' }),
  rol: z.enum(['admin', 'gerente', 'conductor', 'cliente'], {
    message: 'Rol es requerido'
  }),
  nombre: z.string({ message: 'Nombre es requerido' }).min(2, 'Nombre debe tener al menos 2 caracteres')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

// Schema de usuario en response
export const userSchema = z.object({
  id: z.number(),
  email: z.string(),
  rol: z.string(),
  nombre: z.string(),
  created_at: z.string()
});

// Schema de respuesta de login
export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  user: userSchema
});

// Schema de respuesta de refresh
export const refreshResponseSchema = z.object({
  accessToken: z.string()
});

// Schema de body para refresh (movil envia token en body)
export const refreshBodySchema = z.object({
  refreshToken: z.string().optional(),
});

// Schema de respuesta genérica de mensaje
export const messageResponseSchema = z.object({
  message: z.string()
});

// Schema de registro público (solo para clientes)
export const registerPublicSchema = z.object({
  nombre: z
    .string({ message: 'Nombre es requerido' })
    .min(2, { message: 'Nombre debe tener al menos 2 caracteres' })
    .max(255, { message: 'Nombre no puede exceder 255 caracteres' }),
  email: z
    .string({ message: 'Email es requerido' })
    .email({ message: 'Formato de email inválido' })
    .transform(val => val.toLowerCase().trim()),
  password: z
    .string({ message: 'Contraseña es requerida' })
    .min(8, { message: 'Contraseña debe tener al menos 8 caracteres' })
    .regex(/[A-Z]/, { message: 'Debe contener al menos una letra mayúscula' })
    .regex(/[0-9]/, { message: 'Debe contener al menos un número' }),
  confirmPassword: z.string({ message: 'Confirmación de contraseña es requerida' }),
  tipo_cliente_id: z
    .number({ message: 'Tipo de cliente es requerido' })
    .int()
    .min(1)
    .max(3),
  telefono: z
    .string()
    .optional()
    .transform(val => val === '' ? undefined : val)
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});
