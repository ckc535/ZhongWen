import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { apiRouter } from './server/apiRouter.js';

// Custom Vite Plugin to handle backend API seamlessly
function apiPlugin() {
  return {
    name: 'zhongwen-api-server',
    configureServer(server: any) {
      server.middlewares.use(apiRouter);
    }
  };
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    apiPlugin()
  ],
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: [
        '**/server/data/**',
        '**/server/data/database.json',
        '**/.tempmediaStorage/**',
        '**/scratch/**'
      ]
    }
  }
});
