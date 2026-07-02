/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // PWA: تثبيت على الجوال + عمل دون اتصال (فوق تخزين IndexedDB الحالي)
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'موازين — المنصة المالية الذكية',
        short_name: 'موازين',
        description: 'إدارة مالية شاملة: مشاريع، عمليات، ذمم، التزامات، أصول، متابعات، مستندات',
        lang: 'ar',
        dir: 'rtl',
        display: 'standalone',
        start_url: '/',
        theme_color: '#2563eb',
        background_color: '#f8f9fb',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // كل أصول البناء تُخزَّن مسبقًا؛ التنقّل يعود لـ index.html (SPA)
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: '/index.html',
        // خطوط Google: تخزين مؤقت وقت التشغيل (تعمل دون اتصال بعد أول زيارة)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // مكتبتا التصدير الكسولتان (xlsx/html2pdf) — تُخزَّنان بعد أول استخدام
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-libs',
              expiration: { maxEntries: 6, maxAgeSeconds: 60 * 60 * 24 * 180 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,js}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/helpers/**', 'src/stores/**', 'src/**/composables/**', 'src/**/*AI.ts'],
      // مستبعَد: منطق إدخال/إخراج جانبيّ (تصدير PDF/Excel عبر CDN، تخزين IndexedDB،
      // برميل التصدير) — يُغطّى عبر التحقّق الحيّ/E2E لا اختبار الوحدة
      exclude: [
        'src/helpers/export.ts',
        'src/helpers/documents.ts',
        'src/helpers/persist.ts',
        'src/helpers/id.ts',
        'src/**/index.ts',
        'src/**/*.test.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/@core', import.meta.url)),
      '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
      '@images': fileURLToPath(new URL('./src/assets/images', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
      '@themeConfig': fileURLToPath(new URL('./themeConfig.ts', import.meta.url)),
    },
  },
  server: {
    host: true, // يتيح الوصول من أي جهاز/متصفح على نفس الشبكة عبر IP الجهاز
    port: Number(process.env.PORT) || 5173,
  },
  build: {
    rollupOptions: {
      output: {
        // فصل مكتبات Vue الثابتة عن كود التطبيق — تحديثات التطبيق لا تُبطل
        // ذاكرة المتصفح المؤقتة للمكتبات التي لم تتغيّر
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia', 'vue-i18n'],
        },
      },
    },
  },
})
