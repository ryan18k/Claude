// Configuration ESLint partagée par tout le monorepo (format "flat config").
// ESLint repère les erreurs probables et les mauvaises pratiques dans le code.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.expo/**',
      '**/coverage/**',
      'supabase/functions/**', // code Deno, vérifié séparément
      'packages/supabase/src/database.types.ts', // fichier généré
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      // Variables inutilisées autorisées seulement si elles commencent par "_".
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  prettier, // désactive les règles de mise en forme (c'est le rôle de Prettier)
);
