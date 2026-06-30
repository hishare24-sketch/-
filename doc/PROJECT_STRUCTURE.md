# Spaces Vue — Project Structure & Development Guide

This document describes the architecture, conventions, and patterns used in **spaces-vue**. Use it as a reference when building new features or starting a sibling project that should follow the same structure.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Key Libraries](#key-libraries)
3. [Root Directory Layout](#root-directory-layout)
4. [Source Directory (`src/`)](#source-directory-src)
5. [Path Aliases](#path-aliases)
6. [Application Bootstrap](#application-bootstrap)
7. [Authentication & Permissions](#authentication--permissions)
8. [Routing](#routing)
9. [Module Architecture](#module-architecture)
10. [CRUD Listing Pages](#crud-listing-pages)
11. [Modals](#modals)
12. [Forms & Validation](#forms--validation)
13. [Services & API Layer](#services--api-layer)
14. [State Management (Pinia)](#state-management-pinia)
15. [Shared Components](#shared-components)
16. [Composables](#composables)
17. [Internationalization (i18n)](#internationalization-i18n)
18. [Styling & Theming](#styling--theming)
19. [Code Style & Tooling](#code-style--tooling)
20. [Environment Variables](#environment-variables)
21. [Step-by-Step: Creating a New Module](#step-by-step-creating-a-new-module)
22. [Reference Module](#reference-module)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | **Vue 3** (Composition API, `<script setup>`) |
| Language | **TypeScript** (strict mode) |
| Build tool | **Vite 5** |
| UI framework | **Vuetify 3** |
| State | **Pinia** |
| Routing | **Vue Router 4** |
| HTTP client | **Axios** |
| Forms & validation | **vee-validate 4** + `@vee-validate/rules` + `@vee-validate/i18n` |
| i18n | **vue-i18n 9** |
| Utilities | **@vueuse/core**, **lodash**, **date-fns** |
| Notifications | **vue-toastification** |
| Charts | **Chart.js**, **vue-chartjs**, **apexcharts** |
| Maps | **Leaflet**, **MapLibre GL**, **Google Maps** |
| Push notifications | **Firebase** |
| Package manager | **Yarn 1.x** |

The project is based on the **Vuexy** admin template (v8) but has been heavily customized with a domain-driven **module** structure.

---

## Key Libraries

### Core

- `vue`, `vue-router`, `pinia`, `vuetify`, `axios`, `vee-validate`, `vue-i18n`, `vue-toastification`
- `@vueuse/core` — reactive utilities (`useVModel`, `useWindowSize`, etc.)
- `unplugin-auto-import` — auto-imports Vue, Router, Pinia, VueUse, i18n APIs
- `unplugin-vue-components` — auto-registers components from configured directories

### UI & UX

- `@tabler/icons` / `@iconify/vue` — icon system
- `vue-flatpickr-component` — date/time pickers
- `vue-tel-input` — phone input
- `vue-advanced-cropper` — image cropping
- `@vueup/vue-quill` — rich text editor
- `vuedraggable` — drag-and-drop lists
- `vue3-perfect-scrollbar` — custom scrollbars
- `lightgallery` — image galleries
- `video.js` — video player

### Data & Maps

- `chart.js`, `vue-chartjs`, `vue3-apexcharts` — charts and statistics
- `leaflet`, `leaflet-draw`, `maplibre-gl`, `@geoman-io/maplibre-geoman-free` — maps and geospatial
- `@googlemaps/js-api-loader` — Google Maps integration
- `@turf/turf` — geospatial calculations

### Auth & Integrations

- `jwt-decode` — JWT parsing
- `js-cookie` — cookie helpers
- `firebase` — push notifications (FCM)

### Dev Tooling

- `typescript`, `vue-tsc` — type checking
- `eslint` (+ Airbnb, Vue, Prettier configs)
- `prettier` — formatting
- `stylelint` — SCSS linting
- `vitest` — unit testing

---

## Root Directory Layout

```
spaces-vue/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── themeConfig.ts          # App theme, layout, RTL, logo
├── auto-imports.d.ts       # Generated — auto-imported APIs
├── components.d.ts         # Generated — auto-registered components
├── .env.development        # Dev environment variables
├── .env.production
├── .env.testing
├── src/
│   ├── main.ts             # App entry point
│   ├── App.vue             # Root component (layout switcher)
│   ├── modules/            # Feature modules (primary organization)
│   ├── pages/              # Standalone top-level pages
│   ├── components/         # Shared/global components
│   ├── composables/        # Shared composables
│   ├── services/           # Global API services
│   ├── stores/             # Pinia stores
│   ├── interfaces/         # Global TypeScript interfaces
│   ├── constants/          # Global constants/enums
│   ├── helpers/            # Utility functions
│   ├── router/             # Vue Router config
│   ├── layouts/            # Layout wrappers (Default, Blank, Forms)
│   ├── plugins/            # Vue plugins (axios, i18n, vuetify, vee-validate)
│   ├── styles/             # Global SCSS
│   ├── assets/             # Images, fonts, static files
│   ├── @core/              # Vuexy core (form inputs, theme, SCSS)
│   ├── @layouts/           # Vuexy layout system
│   ├── directives/         # Custom Vue directives
│   └── firebase/           # Firebase service worker
└── eslint-internal-rules/  # Custom ESLint rules
```

---

## Source Directory (`src/`)

### `src/modules/` — Feature Modules (Primary Pattern)

Each business domain lives in its own folder. This is where **most new code** should go.

```
src/modules/<module-name>/
├── <ModuleName>Module.vue       # Router outlet wrapper
├── <moduleName>Routes.ts        # Child routes for this module
├── pages/                       # Route-level page components
├── modals/                      # Form & details modals
├── components/                  # Module-specific UI components
├── services/                    # API service classes
├── interfaces/                  # TypeScript types for this module
├── composables/                 # Module-specific composables (optional)
├── constants/                   # Module-specific constants (optional)
├── utils/                       # Module-specific utilities (optional)
└── store/                       # Module-specific Pinia store (optional)
```

### `src/pages/` — Standalone Pages

Used for pages that are **not** part of a module (e.g. `HomePage`, `LoginPage`, `ChatPage`, `AdvertisersPage`). Prefer `modules/` for new domain features.

### `src/components/` — Shared Components

Reusable components used across modules:

- `shared/` — `InfiniteScrollTable`, `PageActions`, `PagePagination`, `ConfirmModal`, `ToggleActivationSwitch`, etc.
- `filters/` — reusable filter dropdowns
- `dialogs/` — generic dialogs
- Domain-grouped folders (`ads/`, `advertiser-profile/`, etc.) for cross-module UI

### `src/@core/` — Template Core

Vuexy-provided building blocks. **Do not refactor heavily** — extend instead.

- `components/app-form-elements/` — **App\*** form inputs (`AppTextField`, `AppSelect`, `AppTextarea`, `AppSwitch`, etc.)
- `components/` — theme utilities (`ThemeSwitcher`, `AppStepper`, etc.)
- `composable/` — `useThemeConfig`, `useSkins`
- `scss/` — base styles, dark mode, utilities
- `utils/validators` — shared validation helpers (aliased as `@validators`)

### `src/@layouts/` — Layout System

Vertical/horizontal navigation, layout wrappers, and layout-related SCSS.

### `src/layouts/` — App Layouts

- `DefaultLayout.vue` — main authenticated dashboard layout (sidebar, navbar, notifications)
- `BlankLayout.vue` — minimal layout (error pages, password reset)
- `FormsLayout.vue` — auth forms layout (login)

---

## Path Aliases

Configured in `vite.config.ts` and `tsconfig.json`:

| Alias | Path |
|-------|------|
| `@` | `src/` |
| `@core` | `src/@core/` |
| `@layouts` | `src/@layouts/` |
| `@images` | `src/assets/images/` |
| `@styles` | `src/styles/` |
| `@themeConfig` | `themeConfig.ts` |
| `@validators` | `src/@core/utils/validators` |
| `@configured-variables` | `src/styles/variables/_template.scss` |

**Always use aliases** instead of deep relative imports (`../../../`).

---

## Application Bootstrap

`src/main.ts` registers plugins in this order:

1. Vuetify
2. Pinia
3. Vue Router
4. vue-i18n
5. Axios (interceptors, auth headers)
6. VueTelInput
7. vee-validate (rules + `VeeForm` / `VeeField` globals)
8. vue-toastification
9. Layouts plugin
10. `v-loading` directive

---

## Authentication & Permissions

The app uses **Bearer token authentication** with a **permission-based access control** system. Permissions are string keys (e.g. `view_participant_categories`, `create_offer`) returned by the backend and checked on routes, navigation, and UI actions.

### Overview Flow

```
Login (email + password)
    ↓
POST /auth/login  →  user object + token + permissions[]
    ↓
AuthStore.setAuthUser()  →  persisted in localStorage
    ↓
Axios interceptor attaches  Authorization: Bearer <token>
    ↓
DefaultLayout loads  →  GET /auth/getMyPermissions  (refresh permissions)
    ↓
Route guard + nav items + page UI  →  hasPermission() checks
```

### User Model

Defined in `src/interfaces/Auth.ts`:

```ts
export interface User {
  id: number
  uuid: string
  name: string
  email: string
  image_path: string
  token: string              // JWT / API token
  created_at: string
  permissions: string[]      // flat list of permission keys
  roles: DropdownMenuItem[]  // assigned roles
  apps: string[]
}
```

### AuthService

Located at `src/services/AuthService.ts`:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `login(payload)` | `POST auth/login` | Authenticate with `{ email, password }` |
| `logout()` | `POST auth/logout` | Invalidate session on server |
| `getPermissions()` | `GET auth/getMyPermissions` | Refresh current user's permission list |
| `setFcmToken(token)` | `POST set_fcm_token` | Register Firebase push token |
| `deleteFcmToken(token)` | `POST delete_fcm_token` | Remove push token on logout |
| `authenticateSuggestions()` | `GET integration/suggestions/authenticate` | Get token for suggestions microservice |
| `authenticateSurvey()` | `GET survey/authenticate` | Get token for survey microservice |

### AuthStore (Pinia)

Located at `src/stores/AuthStore.ts`. This is the **single source of truth** for auth state.

**State (persisted in `localStorage`):**

| Key | Content |
|-----|---------|
| `authUser` | Full `User` object (includes `token` and `permissions`) |
| `fcmToken` | Firebase Cloud Messaging token |

**Getters:**

| Getter | Signature | Behavior |
|--------|-----------|----------|
| `isAuthUser` | `boolean` | `true` if `authUser` exists |
| `getToken` | `string \| undefined` | Returns `authUser.token` |
| `hasPermission` | `(permission: string) => boolean` | Checks if permission exists in user's list |
| `hasPermissions` | `(permissions: string[]) => boolean` | **All** permissions must be present |
| `hasAtLeaseOnePermission` | `(permissions: string[]) => boolean` | **At least one** permission must be present |

**Actions:**

| Action | Purpose |
|--------|---------|
| `setAuthUser(user)` | Save user after login; persist to `localStorage` |
| `clearAuthUser()` | Clear user + FCM token from state and `localStorage` |
| `setUserPermissions(permissions)` | Update permissions array and persist |
| `getPermissions()` | Fetch fresh permissions from API and update store |
| `setFcmToken(token)` | Save FCM token locally and send to API |
| `deleteFcmToken()` | Remove FCM token from API and local storage |

### Login Flow

**Page:** `src/pages/LoginPage.vue`  
**Layout:** `forms` (no sidebar)

```ts
authService.login({ email, password }).then((res) => {
  setAuthUser(res.data.data)   // saves user + token + permissions
  router.push({ path: redirectPath })  // ?redirect= query or '/'
})
```

After login, the user object returned by the API already includes an initial `permissions` array. Permissions are **refreshed** when the dashboard layout mounts (see below).

### Logout Flow

**Component:** `src/layouts/components/UserProfile.vue`

```ts
authService.logout().then(() => {
  clearAuthUser()
  router.push({ name: 'login-page' })
})
```

`clearAuthUser()` removes `authUser` and `fcmToken` from Pinia and `localStorage`.

### Token Attachment (Axios)

`src/plugins/axios.ts` attaches the token on every request:

```ts
const token = authStore.getToken
if (token) headers.Authorization = `Bearer ${token}`
```

Also sets:

- `Accept-Language` — current i18n locale
- `platform: dashboard`
- `Time-Zone` — browser timezone offset

### Session Expiry & 401 Handling

When the API returns **401 Unauthorized**, the Axios response interceptor:

1. Shows an error toast with the API message
2. Calls `authStore.clearAuthUser()`
3. Redirects to `login-page` with `?redirect=<current-path>` (unless already on login)

```ts
case 401:
  toast.error(errorResponse?.data?.message)
  authStore.clearAuthUser()
  router.push({ name: 'login-page', query: { redirect: router.currentRoute.value.fullPath } })
  break
```

### Permissions Refresh on Layout Mount

`DefaultLayout.vue` calls `getPermissions()` when the dashboard loads to keep permissions in sync with the backend (e.g. after an admin changes the user's role):

```ts
const { getPermissions } = useAuthStore()

function getAuthUserPermissions() {
  isLoading.value = true
  getPermissions()
    .then(() => { isLoading.value = false })
    .catch(() => { isLoading.value = false })
}

getAuthUserPermissions()
```

A full-screen `AppLoader` is shown while permissions are loading. Permissions are also re-fetched when the current user's own role is edited (`RoleForm.vue`, `EmployeeForm.vue`).

### Permission Naming Convention

Permissions follow a predictable pattern:

| Action prefix | Example | Used for |
|---------------|---------|----------|
| `view_*` | `view_participant_categories` | List/read access |
| `view_*_details` | `view_withdraw_request_details` | Detail page access |
| `create_*` | `create_participant_category` | Create action |
| `update_*` | `update_participant_category` | Edit action |
| `delete_*` | `delete_participant_category` | Delete action |
| `change_status_*` | `change_status_participant_category` | Toggle active/inactive |
| `sort_*` | `sort_participant_category` | Reorder items |

Always use the **exact permission strings** defined by the backend API.

### Where Permissions Are Checked

Permissions are enforced at **four levels**:

#### 1. Route Guards (server-side navigation block)

`src/router/index.ts` — `router.beforeEach`:

```ts
// Must be logged in for default layout
if (to.meta.layout === 'default' && !isAuthUser)
  next({ name: 'login-page', query: { redirect: to.fullPath } })

// Single permission required
if (isAuthUser && to.meta.requiredPermission && !hasPermission(to.meta.requiredPermission))
  next({ name: 'error-page', query: { message: 'errors.you_are_not_authorized' } })

// At least one permission from array
if (isAuthUser && to.meta.requireAtLeastOnePermission
    && !hasAtLeaseOnePermission(to.meta.requireAtLeastOnePermission))
  next({ name: 'error-page', query: { message: 'errors.you_are_not_authorized' } })
```

**Route meta keys:**

| Meta key | Guard type |
|----------|------------|
| `requiredPermission` | Single string — user must have it |
| `requireAtLeastOnePermission` | String array — user must have at least one |

Apply on parent routes (module level) and/or child routes (page level):

```ts
// Parent — gate entire module
{
  path: '/offers',
  meta: {
    layout: 'default',
    requireAtLeastOnePermission: ['view_offers', 'view_orders', 'view_stores'],
  },
  children: offersRoutes,
}

// Child — gate specific page
{
  path: '',
  name: 'participant-categories-page',
  meta: { requiredPermission: 'view_participant_categories' },
}
```

#### 2. Sidebar Navigation (hide menu items)

`src/layouts/DefaultLayout.vue` — each nav item has a `show` property:

```ts
const navItems = computed(() => [
  {
    title: 'تصنيفات المشاركين',
    icon: { icon: 'tabler-category' },
    to: { name: 'participant-categories-page' },
    show: hasPermission('view_participant_categories'),
  },
  {
    title: 'الإعدادات',
    icon: { icon: 'tabler-settings' },
    show: hasAtLeaseOnePermission(['view_countries', 'view_categories', 'view_packages']),
    children: [
      {
        title: 'الدول',
        to: { name: 'settings-countries-page' },
        show: hasPermission('view_countries'),
      },
    ],
  },
])
```

`VerticalNav.vue` renders items only when `item.show === true`. Parent groups with hidden children are automatically hidden.

**When adding a new module:** always add a nav entry with the correct `show` permission check.

#### 3. Page-Level UI (CRUD actions)

On listing pages, define a `permissions` computed object:

```ts
const { hasPermission } = useAuthStore()

const permissions = computed(() => ({
  create: hasPermission('create_participant_category'),
  edit: hasPermission('update_participant_category'),
  delete: hasPermission('delete_participant_category'),
  view: hasPermission('view_participant_categories'),
  changeStatus: hasPermission('change_status_participant_category'),
  sort: hasPermission('sort_participant_category'),
}))
```

Wire it to shared components:

```vue
<PageActions
  :show-multi-delete="permissions.delete"
  :show-multi-activate="permissions.changeStatus"
  :page-actions-buttons="pageActionsButtons"
/>

<InfiniteScrollTable :permissions="permissions" ... />

<IconBtn :disabled="!permissions.delete" @click="showConfirmDeleteItem(item)" />
<IconBtn :disabled="!permissions.edit" @click="showEditModal(item)" />

<ToggleActivationSwitch :disabled="!permissions.changeStatus" />
```

`pageActionsButtons` also use `show: permissions.value.create` to hide the create button.

#### 4. Component-Level (granular features)

For detail pages, tabs, or inline actions:

```ts
const permissions = computed(() => ({
  review: hasPermission('review_withdrawal_request'),
  execute: hasPermission('execute_withdrawal_transfer'),
  sendMessage: hasPermission('reply_ticket'),
}))
```

```vue
<VBtn v-if="permissions.review" @click="reviewRequest">Review</VBtn>
<VTab v-if="permissions.viewLogs">Logs</VTab>
```

### Role & Permission Management (Team Module)

Admin users manage permissions through the **Team** module:

| Page | Path | Purpose |
|------|------|---------|
| Roles | `/team/roles` | Create/edit roles with permission checkboxes |
| Employees | `/team/employees` | Assign roles to admin users |

- Permission keys are defined in `src/constants/team.ts` as `PERMISSIONS_LIST` (grouped by feature area)
- `RoleForm.vue` lets admins check/uncheck permissions per role
- When a role belonging to the **current user** is edited, `getPermissions()` is called to refresh their session permissions immediately

### Secondary Auth (Microservices)

Some modules talk to **separate backend services** with their own tokens:

**Suggestions module** (`src/modules/suggestions/store/SuggestionsAuthStore.ts`):

```ts
// DefaultLayout fetches token when user visits suggestions routes
authService.authenticateSuggestions().then((res) => {
  suggestionsAuthStore.setAuthData({
    token: res.data.data.token,
    service_url: res.data.data.service_url,
    project_key: res.data.data.project_key,
  })
})
```

A dedicated `suggestionAxios.ts` instance uses this token instead of the main `AuthStore` token.

Follow this pattern when integrating external microservices that require separate authentication.

### Auth-Related Files Quick Reference

| File | Role |
|------|------|
| `src/services/AuthService.ts` | Login, logout, permissions API |
| `src/stores/AuthStore.ts` | Auth state, permission getters |
| `src/interfaces/Auth.ts` | `User` type |
| `src/plugins/axios.ts` | Token injection, 401 handling |
| `src/pages/LoginPage.vue` | Login form |
| `src/layouts/components/UserProfile.vue` | Logout |
| `src/layouts/DefaultLayout.vue` | Permissions refresh, nav `show` checks |
| `src/router/index.ts` | Route guards |
| `src/constants/team.ts` | Full permissions catalog for role management |
| `src/modules/team/` | Roles & employees admin |

### Adding Permissions for a New Feature

When building a new module, coordinate with the backend team to define permission keys, then:

1. **Backend** — add permissions to the API and role seeder
2. **Frontend constants** — add keys to `PERMISSIONS_LIST` in `src/constants/team.ts` (for role UI)
3. **Route meta** — set `requiredPermission` or `requireAtLeastOnePermission` on routes
4. **Navigation** — add `show: hasPermission('view_...')` in `DefaultLayout.vue`
5. **Page** — define `permissions` computed with `create`, `edit`, `delete`, `changeStatus`, etc.
6. **Components** — disable/hide buttons based on `permissions`

### Auth & Permissions Checklist

- [ ] Login stores full user object via `setAuthUser()`
- [ ] Routes use `requiredPermission` or `requireAtLeastOnePermission` meta
- [ ] Nav item added with `show: hasPermission(...)` or `hasAtLeaseOnePermission([...])`
- [ ] Page `permissions` computed covers all CRUD actions
- [ ] Buttons/switches use `:disabled="!permissions.xxx"` or `v-if`
- [ ] New permission keys added to `PERMISSIONS_LIST` in `src/constants/team.ts`
- [ ] Permission strings match backend exactly (snake_case)

---

## Routing

### Route Registration

All routes are defined in `src/router/index.ts`. Module routes are imported and mounted as **child routes**:

```ts
{
  path: '/participant-categories',
  name: 'participant-categories',
  component: () => import('@/modules/participant-categories/ParticipantCategoriesModule.vue'),
  meta: { layout: 'default' },
  children: ParticipantCategoriesRoutes,
}
```

### Module Routes File

Each module exports an array of route objects:

```ts
// src/modules/<module>/<Module>Routes.ts
export const ParticipantCategoriesRoutes = [
  {
    path: '',
    name: 'participant-categories-page',
    component: () => import('./pages/ParticipantCategoriesPage.vue'),
    meta: {
      requiredPermission: 'view_participant_categories',
    },
  },
]
```

### Layout Meta

| `meta.layout` | Usage |
|---------------|-------|
| `default` | Authenticated dashboard (requires login) |
| `blank` | No sidebar/navbar |
| `forms` | Auth pages (login) |

### Route Permission Guards

Route-level permission checks are described in [Authentication & Permissions](#authentication--permissions). Use `requiredPermission` for a single permission or `requireAtLeastOnePermission` for a permission group.

### Module Wrapper Component

Every module has a thin wrapper that renders `<RouterView />`:

```vue
<template>
  <section class="participant-categories-container">
    <RouterView />
  </section>
</template>
```

---

## Module Architecture

### Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Module folder | kebab-case | `participant-categories` |
| Module wrapper | PascalCase + `Module` | `ParticipantCategoriesModule.vue` |
| Routes file | PascalCase or camelCase + `Routes` | `ParticipantCategoriesRoutes.ts` |
| Page | PascalCase + `Page` | `ParticipantCategoriesPage.vue` |
| Form modal | PascalCase + `FormModal` | `ParticipantCategoryFormModal.vue` |
| Details modal | PascalCase + `DetailsModal` | `ParticipantCategoryDetailsModal.vue` |
| Service class | PascalCase + `Service` | `ParticipantCategoriesService` |
| Service export | camelCase instance | `participantCategoriesService` |
| Interface | PascalCase | `ParticipantCategory.ts` |
| API model name | snake_case string | `'participant_categories'` |

### Interface Pattern

Define a **base** interface (for create/edit payloads) and an **extended** interface (for full API responses):

```ts
export interface ParticipantCategoryBase {
  id?: number
  name: { ar: string; en: string }
  type: 'highlight' | 'ban' | 'block' | 'general'
  color?: string
  is_active?: boolean | null
}

export interface ParticipantCategory extends ParticipantCategoryBase {
  id: number
  is_active: boolean
  created_at: string
}
```

### When to Add Extra Folders

| Folder | Use when |
|--------|----------|
| `components/` | Module has reusable UI pieces (tabs, filters, cards) |
| `composables/` | Module has complex reusable logic (maps, wizards) |
| `constants/` | Module has enums, status maps, config |
| `utils/` | Pure helper functions |
| `store/` | Module needs isolated client state beyond global stores |

---

## CRUD Listing Pages

The standard pattern for admin list/CRUD pages. **Reference:** `src/modules/participant-categories/pages/ParticipantCategoriesPage.vue`.

### Building Blocks

| Piece | Role |
|-------|------|
| `UseCrudHelpers` | Manages table data, modals, delete confirm, pagination, search |
| `InfiniteScrollTable` | Data table with infinite scroll, row selection, actions |
| `PageActions` | Search, items-per-page, bulk actions, reload, create button |
| `PagePagination` | Classic page navigation (used in table `#bottom` slot) |
| `ConfirmModal` | Delete confirmation dialog |
| `ToggleActivationSwitch` | Inline status toggle in table cells |

### Page Script Structure

```ts
const MODEL_NAME = 'participant_categories'
const params = reactive({
  page: Number(route.query?.page) || 1,
  itemPerPage: Number(route.query?.itemsPerPage) || 50,
  keyword: '',
})

const {
  selectedItems, tableData, metaData,
  showFormModal, showDetailsModal, FormAction, activeItem,
  confirmModal, IsLoadingData,
  getPageData, onReloadData, onChangeItemsPerPage, onChangeSearch,
  showCrateModal, showEditModal, showViewModal,
  onEditItem, onCreateItem, showConfirmDeleteItem, sortItems,
} = UseCrudHelpers<ItemType>(service, params, MODEL_NAME)

const permissions = computed(() => ({
  create: hasPermission('create_participant_category'),
  edit: hasPermission('update_participant_category'),
  delete: hasPermission('delete_participant_category'),
  view: hasPermission('view_participant_categories'),
  changeStatus: hasPermission('change_status_participant_category'),
}))

const fetchData = async (page: number) => {
  return await service.getItem({ ...params, page })
}

getPageData() // on mount
```

### Page Template Structure

```vue
<ConfirmModal ref="confirmModal" />

<FormModal
  v-if="showFormModal"
  v-model:showModal="showFormModal"
  :form-action="FormAction"
  :active-item="activeItem"
  @edit-item="onEditItem"
  @create-item="onCreateItem"
/>

<DetailsModal v-model:showModal="showDetailsModal" :active-item="activeItem" />

<VCard title="Page Title" class="page-card">
  <VCardText>
    <PageActions ... />
    <InfiniteScrollTable ...>
      <!-- Custom cell slots -->
      <template #bottom>
        <PagePagination ... />
      </template>
    </InfiniteScrollTable>
  </VCardText>
</VCard>
```

### Script Section Convention

Organize `<script setup>` with labeled regions:

```ts
// #region Variables
// #region Computed
// #region Functions
// #region Lifecycle Hooks
```

---

## Modals

### Form Modal Pattern

```vue
<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import type { FormModalProps } from '@/interfaces/Forms'

const props = withDefaults(defineProps<FormModalProps>(), { showModal: false })
const emit = defineEmits<{
  (e: 'update:showModal', value: boolean): void
  (e: 'createItem', value: ItemType): void
  (e: 'editItem', value: ItemType): void
}>()

const showModal = useVModel(props, 'showModal', emit)
</script>

<template>
  <VDialog v-model="showModal" persistent scrollable class="form-modal">
    <DialogCloseBtn @click="showModal = !showModal" />
    <VCard>
      <VeeForm ref="formRef" v-slot="{ meta }" @submit="submit">
        <!-- form fields -->
        <VCardText class="d-flex justify-end flex-wrap gap-3">
          <VBtn variant="outlined" color="error" @click="showModal = false">Cancel</VBtn>
          <VBtn :loading="isLoading" :disabled="!meta.valid" @click="submit">Save</VBtn>
        </VCardText>
      </VeeForm>
    </VCard>
  </VDialog>
</template>
```

### Opening Modals from the Page

```vue
<FormModal
  v-if="showFormModal"
  v-model:showModal="showFormModal"
  :form-action="FormAction"
  :active-item="activeItem"
  @edit-item="onEditItem"
  @create-item="onCreateItem"
/>
```

Use `v-if` on modals so they are destroyed when closed (resets form state).

---

## Forms & Validation

### Rules

1. **Always** use `VeeForm` + core **App\*** inputs — never raw Vuetify inputs in forms/modals.
2. Every input needs a `name` prop and `rules` prop.
3. Submit via `formRef.value.validate().then(({ valid }) => { ... })`.
4. Use `useFormDataHelpers().prepareFormData()` when sending multipart or cleaned payloads.
5. Use `cloneItem()` from `@/helpers` when copying `activeItem` into form state.

### Available Core Form Inputs

Located in `src/@core/components/app-form-elements/`:

| Component | Purpose |
|-----------|---------|
| `AppTextField` | Text input |
| `AppTextarea` | Multi-line text |
| `AppSelect` | Dropdown select |
| `AppAutocomplete` | Searchable select |
| `AppCombobox` | Combobox |
| `AppSwitch` | Boolean toggle |
| `AppCheckbox` / `AppRadio` | Checkbox / radio |
| `AppDateTimePicker` | Date/time |
| `AppPhoneInput` | Phone number |
| `AppTextEditor` | Rich text (Quill) |
| `AppUploadFile` / `AppMultipleUpload` | File uploads |
| `AppUploadFileCropper` | Image upload with crop |
| `AppOtpInput` | OTP code input |

### Validation Rules

Global rules are registered in `src/plugins/vee-validate/index.ts`:

- Standard: `required`, `email`, `min`, `max`, `confirmed`, `min_value`, `max_value`, `integer`, `between`
- Custom: `validUrl`, `greaterThanTime`, `lessThanTime`, `minWords`, `minDate`, `lessThanValue`, `greaterThanValue`, `isEqual`, `validVersionNumber`, `validIcloud`

Usage in templates:

```vue
<AppTextField
  v-model="formData.name.ar"
  label="Arabic Name"
  name="name.ar"
  rules="required|min:1|max:100"
/>
```

### User Feedback

Use `vue-toastification` for success/error messages:

```ts
import { useToast } from 'vue-toastification'
const toast = useToast()
toast.success(res.data.message)
```

---

## Services & API Layer

### Module Service Pattern

Each module has a service class with a `contextPath` matching the API resource:

```ts
import type { AxiosPromise } from 'axios'
import axios from 'axios'

class ParticipantCategoriesService {
  contextPath = 'participant_categories'

  getItem(params: any): AxiosPromise {
    return axios.get(`${this.contextPath}`, { params })
  }

  getSingleItem(id: number): AxiosPromise {
    return axios.get(`${this.contextPath}/${id}`)
  }

  createItem(data: ParticipantCategoryBase): AxiosPromise {
    return axios.post(`${this.contextPath}`, data)
  }

  editItem(data: ParticipantCategory): AxiosPromise {
    return axios.put(`${this.contextPath}/${data.id}`, data)
  }

  deleteItem(id: number): AxiosPromise {
    return axios.delete(`${this.contextPath}/${id}`)
  }
}

export const participantCategoriesService = new ParticipantCategoriesService()
```

### Standard Service Methods

| Method | HTTP | Purpose |
|--------|------|---------|
| `getItem(params)` | GET `/contextPath` | Paginated list |
| `getSingleItem(id)` | GET `/contextPath/:id` | Single record |
| `createItem(data)` | POST `/contextPath` | Create |
| `editItem(data)` | PUT `/contextPath/:id` | Update |
| `deleteItem(id)` | DELETE `/contextPath/:id` | Delete |

### Global Services (`src/services/`)

Shared API logic used across modules:

- `AuthService` — login, permissions, FCM token
- `SharedService` — bulk delete, toggle activation, sorting, file upload
- `ListService`, `UsersService`, `ChatService`, etc.

### Axios Configuration

`src/plugins/axios.ts` sets:

- `baseURL` from `VITE_BASE_API_URL`
- `Authorization: Bearer <token>` from `AuthStore`
- `Accept-Language` from current i18n locale
- `platform: dashboard`
- `Time-Zone` header
- Global loading state via `SharedStore`
- Error handling with toast messages and redirects (401 → login, 500 → error page)

### API Response Shape

List endpoints return:

```ts
{
  data: ItemType[],
  meta: {
    current_page: number,
    last_page: number,
    per_page: number,
    total: number,
  }
}
```

Mutation endpoints return:

```ts
{
  message: string,
  data: ItemType,  // optional
}
```

---

## State Management (Pinia)

### Global Stores (`src/stores/`)

| Store | Purpose |
|-------|---------|
| `AuthStore` | User session, token, permissions |
| `SharedStore` | Global loading indicator |
| `Notifications` | Notification state |
| `OffersStore`, `AdsStore`, `ProductsStore`, etc. | Domain-specific cached data |

### When to Use a Store vs. Local State

| Use Pinia store | Use local `ref`/`reactive` |
|-----------------|---------------------------|
| Auth, permissions, user profile | Single-page table data |
| Data shared across multiple routes | Modal form state |
| Complex cross-module state | CRUD page state (via `UseCrudHelpers`) |

Module-specific stores go in `src/modules/<module>/store/` when needed.

---

## Shared Components

### Must-Know Shared Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `InfiniteScrollTable` | `components/shared/` | Primary data table |
| `PageActions` | `components/shared/` | Toolbar (search, create, bulk) |
| `PagePagination` | `components/shared/` | Page numbers |
| `ConfirmModal` | `components/shared/` | Delete confirmation |
| `ToggleActivationSwitch` | `components/shared/` | Inline active/inactive toggle |
| `PageTabs` / `PageTabsNav` | `components/shared/` | Tab navigation |
| `FilterSideBar` | `components/shared/` | Advanced filters panel |
| `PageBackBtn` | `components/shared/` | Back navigation button |

### Auto-Registered Components

`unplugin-vue-components` auto-imports from:

- `src/@core/components/`
- `src/components/`
- `src/views/demos/`

No manual import needed for components in these directories (types are in `components.d.ts`).

---

## Composables

### Global Composables (`src/composables/`)

| Composable | Purpose |
|------------|---------|
| `UseCrudHelpers` | CRUD page state & actions |
| `UseGeneralHelpers` | `formatDate`, general utilities |
| `useFormDataHelpers` | `prepareFormData` for API payloads |
| `useInfiniteScrollTable` | Infinite scroll table logic |
| `useDateHelpers` | Date formatting/parsing |
| `UseLocaleHelpers` | Language initialization |
| `UseAppLayouts` | Layout component resolution |
| `usePageBack` | Back button visibility |
| `useActiveRow` | Active table row highlighting |

### Module Composables

Place module-specific composables in `src/modules/<module>/composables/` (e.g. map drawing logic in `operational-zones-maplibre`).

---

## Internationalization (i18n)

- Locale files: `src/plugins/i18n/locales/ar.json`, `en.json`
- Default locale: **Arabic** (`ar`), RTL enabled in `themeConfig.ts`
- Use `const { t } = useI18n()` in components
- Axios sends `Accept-Language` header automatically
- vee-validate messages are localized in `src/plugins/vee-validate/messages/`

---

## Styling & Theming

### SCSS Structure

- `src/styles/styles.scss` — global app styles
- `src/styles/variables/` — Vuetify variable overrides
- `src/@core/scss/` — Vuexy base theme SCSS
- `src/@layouts/styles/` — layout-specific styles

### Vuetify Theme

Configured in `src/plugins/vuetify/theme.ts` and `themeConfig.ts`.

### Component Styles

Use `<style lang="scss" scoped>` in Vue SFCs. Global mixins are auto-imported via Vite:

```scss
// Available in all SCSS via vite.config.ts additionalData
@use "@styles/layout/mixins.scss" as *;
```

### Logical Properties

Prefer CSS logical properties (`inline-size`, `block-size`, `margin-inline-start`) for RTL compatibility.

---

## Code Style & Tooling

### Prettier (`.prettierrc.json`)

- `semi: false`
- `singleQuote: true`
- `printWidth: 100`
- Trailing commas

### Commands

```bash
yarn dev          # Start dev server
yarn build        # Production build
yarn typecheck    # TypeScript check
yarn lint         # ESLint fix
yarn format       # Prettier format
```

### TypeScript

- Strict mode enabled
- Avoid `any` unless matching existing patterns
- Define interfaces for all API models

### ESLint

Custom internal rules in `eslint-internal-rules/`. Run `yarn lint` after logic changes.

---

## Environment Variables

All env vars are prefixed with `VITE_` (exposed to the client):

| Variable | Purpose |
|----------|---------|
| `VITE_BASE_API_URL` | Backend API base URL |
| `VITE_GOOGLE_MAPS_KEY` | Google Maps API key |
| `VITE_FB_*` | Firebase configuration (API key, project ID, VAPID key, etc.) |

**Never commit secrets.** Use `.env.development` / `.env.production` locally and in CI/CD.

---

## Step-by-Step: Creating a New Module

Follow these steps to add a new feature module (example: `products`).

### 1. Create the folder structure

```
src/modules/products/
├── ProductsModule.vue
├── productsRoutes.ts
├── pages/
│   └── ProductsPage.vue
├── modals/
│   ├── ProductFormModal.vue
│   └── ProductDetailsModal.vue
├── services/
│   └── ProductsService.ts
└── interfaces/
    └── Product.ts
```

### 2. Define interfaces

```ts
// interfaces/Product.ts
export interface ProductBase {
  id?: number
  name: { ar: string; en: string }
  is_active?: boolean
}

export interface Product extends ProductBase {
  id: number
  is_active: boolean
  created_at: string
}
```

### 3. Create the service

```ts
// services/ProductsService.ts
class ProductsService {
  contextPath = 'products'
  getItem(params) { return axios.get(this.contextPath, { params }) }
  getSingleItem(id) { return axios.get(`${this.contextPath}/${id}`) }
  createItem(data) { return axios.post(this.contextPath, data) }
  editItem(data) { return axios.put(`${this.contextPath}/${data.id}`, data) }
  deleteItem(id) { return axios.delete(`${this.contextPath}/${id}`) }
}
export const productsService = new ProductsService()
```

### 4. Create routes

```ts
// productsRoutes.ts
export const productsRoutes = [
  {
    path: '',
    name: 'products-page',
    component: () => import('./pages/ProductsPage.vue'),
    meta: { requiredPermission: 'view_products' },
  },
]
```

### 5. Create the module wrapper

```vue
<!-- ProductsModule.vue -->
<template>
  <section class="products-container">
    <RouterView />
  </section>
</template>
```

### 6. Build the CRUD page

Copy the pattern from `participant-categories/pages/ParticipantCategoriesPage.vue`:

- Wire `UseCrudHelpers`
- Define `headers`, `permissions`, `pageActionsButtons`
- Use `InfiniteScrollTable` + `PageActions` + `PagePagination`

### 7. Build form & details modals

Follow the modal pattern with `VeeForm`, `AppTextField`, `useVModel`, and service calls.

### 8. Register in the router

```ts
// src/router/index.ts
import { productsRoutes } from '@/modules/products/productsRoutes'

{
  path: '/products',
  name: 'products',
  component: () => import('@/modules/products/ProductsModule.vue'),
  meta: { layout: 'default' },
  children: productsRoutes,
}
```

### 9. Add navigation link

Add the menu item in `src/layouts/DefaultLayout.vue` (or the navigation config) with the correct permission check.

### 10. Verify

```bash
yarn typecheck
yarn lint
```

---

## Reference Module

The **`participant-categories`** module is the canonical reference for new CRUD modules:

```
src/modules/participant-categories/
├── ParticipantCategoriesModule.vue
├── ParticipantCategoriesRoutes.ts
├── pages/ParticipantCategoriesPage.vue
├── modals/ParticipantCategoryFormModal.vue
├── modals/ParticipantCategoryDetailsModal.vue
├── services/ParticipantCategoriesService.ts
└── interfaces/ParticipantCategory.ts
```

Study this module before building anything new.

---

## Quick Checklist for New Features

- [ ] Module folder under `src/modules/<name>/`
- [ ] Interfaces with `Base` + full types
- [ ] Service class with standard CRUD methods
- [ ] Routes file with `requiredPermission` meta
- [ ] Module wrapper with `<RouterView />`
- [ ] CRUD page using `UseCrudHelpers` + `InfiniteScrollTable`
- [ ] Form modal with `VeeForm` + `App*` inputs
- [ ] Permissions computed from `hasPermission()` (create, edit, delete, changeStatus, …)
- [ ] Route registered in `src/router/index.ts` with `requiredPermission` meta
- [ ] Navigation link added in `DefaultLayout.vue` with `show: hasPermission(...)`
- [ ] Permission keys added to `PERMISSIONS_LIST` in `src/constants/team.ts`
- [ ] `yarn typecheck` passes
- [ ] `yarn lint` passes

---

*Last updated: June 2026*
