import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path
        }
      }
    },
    plugins: [react()],
    build: {
      // Ensure environment variables are embedded in the build
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
    },
    define: {
      // Ensure environment variables are available at build time
      __VITE_API_URL__: JSON.stringify(env.VITE_API_URL),
      __VITE_APP_NAME__: JSON.stringify(env.VITE_APP_NAME),
      __VITE_APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION),
      __VITE_ENABLE_DEBUG__: JSON.stringify(env.VITE_ENABLE_DEBUG),
      __VITE_ENABLE_ANALYTICS__: JSON.stringify(env.VITE_ENABLE_ANALYTICS)
    }
  };
});


