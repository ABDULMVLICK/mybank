import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// En développement, Vite renvoie les appels /api vers l'API Node.
// Le front et l'API ont donc la même origine : pas besoin de CORS, et le cookie SameSite=Strict fonctionne.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:3000' },
  },
});
