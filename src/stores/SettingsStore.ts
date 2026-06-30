import { defineStore } from 'pinia'
import type { UserPrefs, CustomLists, HelpTexts, HelpKey } from '@/interfaces/models'
import { DEFAULT_PREFS, DEFAULT_LISTS, DEFAULT_HELP } from '@/constants'
import themeConfig from '@themeConfig'

// تفضيلات المستخدم والقوائم القابلة للتخصيص ونصوص المساعدة وألوان الواجهة
export const useSettingsStore = defineStore('settings', {
  state: () => ({
    prefs: { ...DEFAULT_PREFS } as UserPrefs,
    lists: { ...DEFAULT_LISTS } as CustomLists,
    help: { ...DEFAULT_HELP } as HelpTexts,
    primaryColor: themeConfig.theme.primary as string,
  }),

  actions: {
    setPref<K extends keyof UserPrefs>(key: K, value: UserPrefs[K]) {
      this.prefs[key] = value
    },
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
    toggleHelp(key: HelpKey) {
      this.help[key].show = !this.help[key].show
    },
    setPrimaryColor(color: string) {
      this.primaryColor = color
      this.applyPrimaryColor()
    },
    // تطبيق اللون الأساسي على متغيّرات CSS
    applyPrimaryColor() {
      const root = document.documentElement
      root.style.setProperty('--primary', this.primaryColor)
      root.style.setProperty('--primary-soft', this.primaryColor + '14')
    },
  },
})
