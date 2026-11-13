import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.VITE_BASE || '/GamesEduReinoTabuada/',
  plugins: [react(), tailwindcss()],
});
