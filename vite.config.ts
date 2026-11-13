import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const CSP_CONTENT = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  'worker-src blob:',
  'child-src blob:',
].join('; ') + ';';

function buildSecurityMetaPlugin(): Plugin {
  return {
    name: 'build-security-meta',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: {
            'http-equiv': 'Content-Security-Policy',
            content: CSP_CONTENT,
          },
          injectTo: 'head-prepend',
        },
        {
          tag: 'meta',
          attrs: {
            name: 'referrer',
            content: 'no-referrer',
          },
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}

export default defineConfig({
  base: process.env.VITE_BASE || '/GamesEduReinoTabuada/',
  plugins: [react(), tailwindcss(), buildSecurityMetaPlugin()],
});
