import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.CEREBRAS_API_KEY),
        'process.env.CEREBRAS_API_KEY': JSON.stringify(env.CEREBRAS_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        host: '0.0.0.0',
        port: 5000,
        allowedHosts: true,
        headers: {
          'Cache-Control': 'no-cache'
        }
      }
    };
});
