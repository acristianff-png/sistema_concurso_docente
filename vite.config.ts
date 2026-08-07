import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serve o projeto em /<repo>/, não na raiz do domínio.
  // Em dev local mantém "/" pra não precisar acessar um subcaminho.
  base: command === 'build' ? '/sistema_concurso_docente/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
}))
