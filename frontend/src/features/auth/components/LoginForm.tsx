import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useLogin } from '../hooks/useLogin';

const loginSchema = z.object({
  email: z
    .string({ message: 'Email es requerido' })
    .email({ message: 'Email inválido' }),
  password: z
    .string({ message: 'Contraseña es requerida' })
    .min(1, 'Contraseña no puede estar vacía'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-cemento-700 mb-2">
          Email
        </label>
        <input
          {...register('email')}
          type="email"
          id="email"
          placeholder="admin@zambrana.com"
          className="w-full px-4 py-3 border border-piedra-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent outline-none transition"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-cemento-700 mb-2">
          Contraseña
        </label>
        <div className="relative">
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            id="password"
            placeholder="••••••••"
            className="w-full px-4 py-3 border border-piedra-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent outline-none transition pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-cemento-400 hover:text-cemento-600 transition"
          >
            {showPassword ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-coral-500 hover:bg-coral-600 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
};
