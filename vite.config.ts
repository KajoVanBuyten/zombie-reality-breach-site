import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import type { Plugin } from 'vite';

// Base path: '/' for https://zombierealitybreach.com, or e.g. SITE_BASE=/repo-name/ for a GitHub Pages sub path.
const base = process.env.SITE_BASE ?? '/';

// The quest's A3500X starter pistol is an Asset Store model: it is never committed (public/breach/private/ is ignored) and
// has to be generated locally before a build (DEPLOY.md). Without it the quest falls back to the block pistol; the build
// says so loudly instead of shipping that silently.
function privateAssetsCheck(): Plugin {
  const file = fileURLToPath(new URL('./public/breach/private/a3500x.glb', import.meta.url));
  return {
    name: 'zrb-private-assets-check',
    apply: 'build',
    buildStart() {
      if (!existsSync(file)) {
        this.warn(
          '\n\n  public/breach/private/a3500x.glb FEHLT: die Web-AR-Quest zeigt nur die Klotzpistole.\n' +
            '  Vor dem Deploy erzeugen (DEPLOY.md, Abschnitt "Private Assets der Web-AR-Quest").\n',
        );
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base,
  plugins: [react(), privateAssetsCheck()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
