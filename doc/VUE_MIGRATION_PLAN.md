# خطة إعادة بناء موازين بـ Vue 3

> الهدف: إعادة بناء تطبيق **موازين** (حالياً React في ملف واحد `src/App.tsx`) بـ **Vue 3**
> متبعاً البنية المعمارية في [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md).
> الفرع: `vue-test`.

## القرارات المعتمدة

| القرار | الاختيار |
|--------|----------|
| **البيانات** | Pinia stores محمّلة بالبيانات التجريبية (`INITIAL_*`)، يعمل offline. الخدمات (Services) مصممة لتُربط بـ API لاحقاً بسهولة. |
| **الواجهة** | الحفاظ على تصميم موازين الحالي (الألوان، البطاقات، RTL، خط IBM Plex Sans Arabic) مع اتباع بنية الدليل (modules / services / stores / router). بدون فرض مظهر Vuetify الافتراضي. |
| **الدخول** | هيكل Auth كامل (LoginPage + AuthStore + صلاحيات) جاهز، لكن غير مُفعّل إجبارياً حتى يتوفر backend. |

## الشاشات الحالية (23) ومصدرها

`overview · tasks · dashboard · projects · projectDetail · finance · ledger · reports · receivables · commitments · documents · trackings · assets · requests · notifications · settings · integrations · subscription · memberDetail · audit · customize · colorCustomize · surveys`

## المراحل

### المرحلة 0 — التأسيس (Scaffold)
إنشاء هيكل Vue 3 + Vite + TS + Pinia + Vue Router + i18n + vee-validate + axios، مع:
`index.html` (RTL)، `vite.config.ts` (aliases)، `tsconfig.json` (strict)، `themeConfig.ts`،
`src/main.ts`, `src/App.vue`, مجلدات: `plugins/ layouts/ router/ stores/ services/ composables/ components/shared/ interfaces/ constants/ helpers/ styles/ assets/ modules/`.
**المخرج:** `yarn dev` يعمل ويعرض layout + صفحة دخول.

### المرحلة 1 — البنية التحتية المشتركة
- نقل جميع `types` → `src/interfaces/` (نمط Base + كامل).
- نقل الثوابت → `src/constants/`.
- نقل المساعدات (`fmt`, `loadXLSX`, `loadPDF`, `docHTML`) → `src/helpers/`.
- المكوّنات المشتركة: `InfiniteScrollTable`, `PageActions`, `PagePagination`, `ConfirmModal`, `ToggleActivationSwitch`, مكوّن المرفقات.
- Pinia stores محمّلة بـ `INITIAL_*`.

### المراحل 2–9 — الموديولات

| # | الموديول | الشاشات |
|---|----------|---------|
| 2 | `dashboard` | overview, dashboard, reports |
| 3 | `projects` | projects, projectDetail, members, memberDetail |
| 4 | `finance` | finance, ledger, transactions |
| 5 | `receivables` + `commitments` | receivables, commitments |
| 6 | `assets` + `trackings` | assets, trackings |
| 7 | `requests` + `documents` + `surveys` | requests, documents, surveys |
| 8 | `notifications` + `audit` + `tasks` | notifications, audit, tasks |
| 9 | `settings` | settings, customize, colorCustomize, integrations, subscription |

كل موديول: `Module.vue` + `Routes.ts` + `pages/` + `modals/` + `services/` + `interfaces/` + تسجيل بالراوتر + رابط بالقائمة الجانبية.

### المرحلة 10 — التحقق
`yarn typecheck` + `yarn lint` + تشغيل وفحص كل الشاشات.

## ملاحظات
- العمل يتم على الفرع `vue-test`، مع الإبقاء على نسخة React في `main` سليمة.
- كود React الحالي يبقى مرجعاً أثناء النقل ثم يُزال في نهاية المشروع.
