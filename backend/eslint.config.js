// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // Configuración base de ESLint
  eslint.configs.recommended,

  // Configuración recomendada de TypeScript ESLint
  ...tseslint.configs.recommendedTypeChecked,

  // Configuración de Prettier (debe ser la última)
  prettierConfig,

  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Reglas personalizadas
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },

  {
    // Ignorar archivos
    ignores: ['dist/**', 'node_modules/**', 'eslint.config.js'],
  }
);
