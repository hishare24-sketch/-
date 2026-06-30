<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// خريطة الأقسام التي ستُبنى في المراحل القادمة
const SECTIONS: Record<string, { label: string; icon: string; phase: number; desc: string }> = {
  projects: { label: 'المشاريع', icon: '🏢', phase: 3, desc: 'إدارة المشاريع والأعضاء والصلاحيات والتدفقات النقدية' },
  finance: { label: 'المالية', icon: '💰', phase: 4, desc: 'الإيرادات والمصروفات والتحويلات والسجل المالي' },
  receivables: { label: 'الذمم', icon: '🧾', phase: 5, desc: 'الذمم المدينة والدائنة ودفعات التحصيل والسداد' },
  commitments: { label: 'الالتزامات', icon: '📌', phase: 5, desc: 'الأقساط والالتزامات الدورية والاشتراكات' },
  assets: { label: 'الأصول', icon: '🚗', phase: 6, desc: 'الأصول الملموسة وسجل الصيانة والضمانات' },
  trackings: { label: 'المتابعات', icon: '🔔', phase: 6, desc: 'الضمانات والعقود والتراخيص ومواعيد انتهائها' },
  requests: { label: 'الطلبات', icon: '📥', phase: 7, desc: 'الطلبات ودورة الاعتماد (إنشاء ← مراجعة ← اعتماد)' },
  documents: { label: 'المستندات', icon: '📄', phase: 7, desc: 'الفواتير والعقود والوثائق ومعالجتها' },
  surveys: { label: 'الاستبيانات', icon: '📋', phase: 7, desc: 'الاستبيانات وجمع الردود وتحليلها' },
  settings: { label: 'الإعدادات', icon: '⚙️', phase: 9, desc: 'التفضيلات والقوائم المخصّصة والتكاملات والاشتراك' },
}

const section = computed(
  () => SECTIONS[route.params.key as string] ?? { label: 'القسم', icon: '🚧', phase: 0, desc: '' },
)
</script>

<template>
  <section class="coming-soon">
    <div class="coming-soon__card app-card">
      <span class="coming-soon__icon">{{ section.icon }}</span>
      <h1>{{ section.label }}</h1>
      <p class="coming-soon__desc">{{ section.desc }}</p>
      <span class="coming-soon__badge">قيد الإنشاء — المرحلة {{ section.phase }}</span>
      <RouterLink :to="{ name: 'dashboard-page' }" class="app-btn app-btn--outlined">
        ← العودة إلى لوحة التحكم
      </RouterLink>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.coming-soon {
  display: flex;
  align-items: center;
  justify-content: center;
  min-block-size: 70vh;

  &__card {
    text-align: center;
    padding: 48px 40px;
    max-inline-size: 460px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }

  &__icon {
    font-size: 56px;
  }

  h1 {
    font-size: 24px;
    font-weight: 700;
  }

  &__desc {
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.7;
  }

  &__badge {
    background: var(--primary-soft);
    color: var(--primary);
    font-weight: 600;
    font-size: 13px;
    padding: 6px 16px;
    border-radius: 20px;
    margin-block-end: 6px;
  }
}
</style>
