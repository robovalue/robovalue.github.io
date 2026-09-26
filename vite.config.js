import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  // The remote workspace uses a shared filesystem; poll for reliable updates.
  server: { watch: { usePolling: true, interval: 500 } },
  build: { sourcemap: false },
});
