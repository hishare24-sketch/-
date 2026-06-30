import { defineStore } from 'pinia'
import type { UserPrefs, CustomLists, HelpTexts } from '@/interfaces/models'
import { DEFAULT_PREFS, DEFAULT_LISTS, DEFAULT_HELP } from '@/constants'

// تفضيلات المستخدم والقوائم القابلة للتخصيص ونصوص المساعدة
export const useSettingsStore = defineStore('settings', {
  state: () => ({
    prefs: { ...DEFAULT_PREFS } as UserPrefs,
    lists: { ...DEFAULT_LISTS } as CustomLists,
    help: { ...DEFAULT_HELP } as HelpTexts,
  }),

  actions: {
    setPref<K extends keyof UserPrefs>(key: K, value: UserPrefs[K]) {
      this.prefs[key] = value
    },
    updateList<K extends keyof CustomLists>(key: K, value: string[]) {
      this.lists[key] = value
    },
  },
})
