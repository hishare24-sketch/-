// إعدادات الهوية العامة لتطبيق موازين
export const themeConfig = {
  app: {
    title: 'موازين',
    subtitle: 'المنصة المالية الذكية',
    logo: '⚖️',
    isRtl: true,
    defaultLocale: 'ar' as const,
    locales: ['ar', 'en'] as const,
  },
  theme: {
    primary: '#2563eb',
    secondary: '#059669',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    info: '#0891b2',
    background: '#f8f9fb',
    surface: '#ffffff',
  },
}

export default themeConfig
