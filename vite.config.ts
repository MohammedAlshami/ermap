import { defineConfig } from 'vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import viteReact from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import { app as uploadApi } from './server/index.js';

export default defineConfig({
  server: {
    port: 3001,
  },
  plugins: [
    {
      name: 'upload-api',
      configureServer(server) {
        server.middlewares.use('/api', uploadApi);
      },
    },
    tailwindcss(),
    tsconfigPaths(),
    TanStackRouterVite({
      routesDirectory: './src/app',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    viteReact(),
  ],
});
