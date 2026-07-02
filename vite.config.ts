/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // PWA معطَّلة مؤقتًا (عودة للوضع المستقر): sw.js يدمّر نفسه — يلغي تسجيل
    // أي service worker سابق على أجهزة المستخدمين وينظّف الكاش
    VitePWA({
      selfDestroying: true,
      manifest: false,
      injectRegister: 'auto',
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
})
