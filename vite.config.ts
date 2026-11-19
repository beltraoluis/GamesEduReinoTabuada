import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { licenseFilesPlugin, offlinePlugin, resolveSourceUrl } from './scripts/vite-plugins.ts';

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
  // 'self' allows the offline service worker (sw.js) to register.
  "worker-src 'self' blob:",
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
  define: {
    __SOURCE_URL__: JSON.stringify(resolveSourceUrl()),
  },
  plugins: [react(), tailwindcss(), buildSecurityMetaPlugin(), licenseFilesPlugin(), offlinePlugin()],
});
