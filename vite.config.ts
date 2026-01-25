import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Path alias for cleaner imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Vite options tailored for Tauri
  clearScreen: false,
  server: {
    port: 5174,
    strictPort: true,
    watch: {
      usePolling: true,
    },
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: ['es2022', 'chrome100', 'safari15'],
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    // Code splitting for better caching and smaller initial bundle
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        splashscreen: path.resolve(__dirname, 'splashscreen.html'),
      },
      output: {
        manualChunks: {
          // UI framework - changes rarely
          mantine: [
            '@mantine/core',
            '@mantine/hooks',
            '@mantine/form',
            '@mantine/notifications',
          ],
          // Icons - large and stable
          icons: ['@tabler/icons-react'],
          // Virtualization - separate chunk
          virtual: ['@tanstack/react-virtual'],
          // React core
          react: ['react', 'react-dom'],
        },
      },
    },
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 600,
  },
  // Optimize deps for faster dev startup
  optimizeDeps: {
    include: [
      '@mantine/core',
      '@mantine/hooks',
      '@tabler/icons-react',
      'zustand',
      '@tanstack/react-virtual',
    ],
  },
});
