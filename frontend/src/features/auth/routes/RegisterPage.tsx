import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useRegister } from '../hooks/useRegister';

const registerSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(255, 'El nombre es demasiado largo'),
  email: z
    .string()
    .email('Email inválido')
    .transform(val => val.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string(),
  tipo_cliente_id: z.coerce.number().int().min(1).max(3),
  telefono: z.string().optional().transform(val => val === '' ? undefined : val),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { mutate: register, isPending } = useRegister();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      tipo_cliente_id: 1,
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    register(data);
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div className="max-w-md w-full">
        <Card variant="elevated">
          <CardHeader className="text-center border-b-0 pb-4">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="h-8 w-8 text-orange-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Crear Cuenta
            </h2>
            <p className="text-gray-600 mt-2">
              Regístrate para empezar a hacer tus pedidos
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Nombre completo"
                {...registerField('nombre')}
                error={errors.nombre?.message}
                placeholder="Ej: Juan Pérez"
                required
                autoFocus
              />

              <Input
                label="Email"
                type="email"
                {...registerField('email')}
                error={errors.email?.message}
                placeholder="tu@email.com"
                required
              />

              <Select
                label="Tipo de cliente"
                {...registerField('tipo_cliente_id')}
                error={errors.tipo_cliente_id?.message}
                options={[
                  { value: 1, label: 'Minorista' },
                  { value: 2, label: 'Mayorista' },
                  { value: 3, label: 'Empresarial' },
                ]}
                required
              />

              <Input
                label="Teléfono (opcional)"
                type="tel"
                {...registerField('telefono')}
                error={errors.telefono?.message}
                placeholder="Ej: 70123456"
              />

              <div className="relative">
                <Input
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  {...registerField('password')}
                  error={errors.password?.message}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Confirmar contraseña"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...registerField('confirmPassword')}
                  error={errors.confirmPassword?.message}
                  placeholder="Repite tu contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={isPending}
                >
                  Crear Cuenta
                </Button>
              </div>

              <div className="text-center text-sm">
                <span className="text-gray-600">¿Ya tienes cuenta? </span>
                <Link
                  to="/login"
                  className="font-medium text-orange-600 hover:text-orange-700"
                >
                  Inicia sesión aquí
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
