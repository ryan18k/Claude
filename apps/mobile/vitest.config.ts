import { defineConfig } from 'vitest/config';

// Tests de la logique « pure » de l'app (sans rendu React Native).
export default defineConfig({
  test: { include: ['src/**/*.test.ts'] },
});
