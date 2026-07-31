import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    // Loads local variables from your root .env files safely
    const env = loadEnv(mode, '.', '');
    
    return {
      define: {
        // Exposes a unified local server endpoint target variable
        'process.env.LOCAL_AI_URL': JSON.stringify(env.VITE_AI_API_URL || 'http://72.20.20.20:8085')
      },
      resolve: {
        alias: {
          // Maintains clean shorthand root directories mapping rule
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});