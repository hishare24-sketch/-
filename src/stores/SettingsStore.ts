import { defineStore } from 'pinia'
import type { UserPrefs, CustomLists, HelpTexts, HelpKey, HelpEntry } from '@/interfaces/models'
import { DEFAULT_PREFS, DEFAULT_LISTS, DEFAULT_HELP, THEMES } from '@/constants'
import { setDocBranding, getDefaultBranding, type DocBranding } from '@/helpers/export'

export type ThemeMode = 'light' | 'dark'
export interface CustomTheme {
  primary?: string
  bg?: string
  surface?: string
  text?: string
  border?: string
}

// تفضيلات المستخدم + القوائم + شروحات الأقسام + الثيم
export const useSettingsStore = defineStore('settings', {
  state: () => ({
    prefs: { ...DEFAULT_PREFS } as UserPrefs,
    lists: JSON.parse(JSON.stringify(DEFAULT_LISTS)) as CustomLists,
    help: JSON.parse(JSON.stringify(DEFAULT_HELP)) as HelpTexts,
    themeMode: 'light' as ThemeMode,
    themeId: 'default' as string,
    customTheme: {} as CustomTheme,
    docBranding: getDefaultBranding() as DocBranding,
    currentPlan: 'free' as string,
    billing: 'monthly' as 'monthly' | 'yearly',
  }),

  getters: {
    hasCustomTheme: (s) => Object.values(s.customTheme).some(Boolean),
  },

  actions: {
    // ── التفضيلات ──
    setPref<K extends keyof UserPrefs>(key: K, value: UserPrefs[K]) {
      this.prefs[key] = value
      if (key === 'density') this.applyDensity()
    },

    // تطبيق كثافة الواجهة على الجذر (مريح/مدمج)
    applyDensity() {
      document.documentElement.setAttribute('data-density', this.prefs.density ?? 'comfortable')
    },

    // ── القوائم المخصّصة ──
    updateList<K extends keyof CustomLists>(key: K, value: string[]) {
      this.lists[key] = value
    },
    addListItem(key: keyof CustomLists, item: string) {
      const v = item.trim()
      if (v && !this.lists[key].includes(v)) this.lists[key].push(v)
    },
    removeListItem(key: keyof CustomLists, item: string) {
      this.lists[key] = this.lists[key].filter((x) => x !== item)
    },

    // ── شروحات الأقسام (لأي شاشة) ──
    ensureHelp(key: HelpKey): HelpEntry {
      if (!this.help[key]) this.help[key] = { title: '', body: '', show: true }
      return this.help[key]
    },
    toggleHelp(key: HelpKey) {
      this.ensureHelp(key).show = !this.help[key].show
    },
    setHelp(key: HelpKey, patch: Partial<HelpEntry>) {
      this.help[key] = { ...this.ensureHelp(key), ...patch }
    },
    resetHelp(key: HelpKey) {
      this.help[key] = DEFAULT_HELP[key] ? { ...DEFAULT_HELP[key] } : { title: '', body: '', show: true }
    },
    removeHelp(key: HelpKey) {
      delete this.help[key]
    },

    // ── هوية المستندات (محرّر القوالب) ──
    applyBranding() {
      setDocBranding(this.docBranding)
    },
    setBrandingField<K extends keyof DocBranding>(key: K, value: DocBranding[K]) {
      this.docBranding[key] = value
      this.applyBranding()
    },
    resetBranding() {
      this.docBranding = getDefaultBranding()
      this.applyBranding()
    },

    // ── الاشتراك ──
    setPlan(planId: string) {
      this.currentPlan = planId
    },
    setBilling(cycle: 'monthly' | 'yearly') {
      this.billing = cycle
    },

    // ── الثيم ──
    setThemeMode(mode: ThemeMode) {
      this.themeMode = mode
      this.applyTheme()
    },
    // اختيار ثيم بهويّة كاملة — يمسح التجاوزات اليدوية لتظهر هوية الثيم
    setTheme(id: string) {
      this.themeId = id
      this.customTheme = {}
      this.applyTheme()
    },
    toggleThemeMode() {
      this.setThemeMode(this.themeMode === 'dark' ? 'light' : 'dark')
    },
    setCustomColor(key: keyof CustomTheme, value: string | undefined) {
      if (value) this.customTheme[key] = value
      else delete this.customTheme[key]
      this.applyTheme()
    },
    setPreset(primary: string | undefined) {
      this.setCustomColor('primary', primary)
    },
    resetTheme() {
      this.customTheme = {}
      this.applyTheme()
    },
    // تطبيق الوضع + الألوان المخصّصة على متغيّرات CSS في الجذر
    applyTheme() {
      const root = document.documentElement
      const theme = THEMES.find((t) => t.id === this.themeId) ?? THEMES[0]
      const base = this.themeMode === 'dark' ? theme.dark : theme.light
      root.setAttribute('data-theme', this.themeMode)

      const primary = this.customTheme.primary ?? base.primary
      const bg = this.customTheme.bg ?? base.bg
      const surface = this.customTheme.surface ?? base.surface
      const text = this.customTheme.text ?? base.text
      const border = this.customTheme.border ?? base.border

      root.style.setProperty('--primary', primary)
      root.style.setProperty('--primary-soft', primary + (this.themeMode === 'dark' ? '26' : '14'))
      root.style.setProperty('--bg', bg)
      root.style.setProperty('--surface', surface)
      root.style.setProperty('--text', text)
      root.style.setProperty('--text-muted', base.muted)
      root.style.setProperty('--border', border)
    },
  },
})
