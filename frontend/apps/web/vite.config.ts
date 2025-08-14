import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  const config: any = {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
    },
    // Enable runtime environment variable injection
    define: {
      // This allows runtime environment variable injection
      __RUNTIME_ENV__: 'true'
    }
  };

  // Only add proxy in development mode
  if (command === 'serve') {
    config.server.proxy = {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path
      }
    };
  }

  return config;
});


