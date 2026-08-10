import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  // Если проект собирается на GitHub Actions, берем имя репозитория в качестве base URL
  base:
    process.env.NODE_ENV === 'production'
      ? `/${process.env.GITHUB_REPOSITORY?.split('/')[1]}/`
      : '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
  },
});
