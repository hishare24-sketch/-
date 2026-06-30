import type { SurveyQuestion } from '@/interfaces/models'

// قوالب الاستبيانات الجاهزة (منقولة من legacy/App.tsx)
export interface SurveyTemplate {
  id: string
  name: string
  icon: string
  desc: string
  questions: Omit<SurveyQuestion, 'id'>[]
}

export const SURVEY_TEMPLATES: SurveyTemplate[] = [
  {
    id: 'customer', name: 'رضا العملاء', icon: '😊', desc: 'قياس رضا العملاء عن الخدمة',
    questions: [
      { text: 'ما مدى رضاك العام عن خدمتنا؟', kind: 'rating' },
      { text: 'كيف تقيّم سرعة الاستجابة؟', kind: 'single', options: ['ممتازة', 'جيدة', 'مقبولة', 'ضعيفة'] },
      { text: 'هل تنصح بنا أصدقاءك؟', kind: 'single', options: ['نعم بالتأكيد', 'ربما', 'لا'] },
      { text: 'ملاحظات أو اقتراحات للتحسين', kind: 'text' },
    ],
  },
  {
    id: 'supplier', name: 'تقييم الموردين', icon: '🏭', desc: 'تقييم أداء الموردين والشركاء',
    questions: [
      { text: 'جودة المنتجات/الخدمات المقدّمة', kind: 'rating' },
      { text: 'الالتزام بمواعيد التسليم', kind: 'single', options: ['دائماً', 'غالباً', 'أحياناً', 'نادراً'] },
      { text: 'أي جوانب تحتاج تحسيناً؟', kind: 'multi', options: ['السعر', 'الجودة', 'التواصل', 'التسليم', 'الدعم'] },
      { text: 'ملاحظات إضافية', kind: 'text' },
    ],
  },
  {
    id: 'employee', name: 'استبيان الموظفين', icon: '👥', desc: 'قياس رضا وتفاعل الموظفين',
    questions: [
      { text: 'مدى رضاك عن بيئة العمل', kind: 'rating' },
      { text: 'هل تشعر بالتقدير في عملك؟', kind: 'single', options: ['دائماً', 'أحياناً', 'نادراً'] },
      { text: 'ما الذي يحفّزك أكثر؟', kind: 'multi', options: ['الراتب', 'التطوّر المهني', 'بيئة العمل', 'المرونة', 'التقدير'] },
      { text: 'اقتراحاتك لتحسين بيئة العمل', kind: 'text' },
    ],
  },
  {
    id: 'project', name: 'رأي حول مشروع/خدمة', icon: '💡', desc: 'جمع الآراء حول مشروع أو خدمة',
    questions: [
      { text: 'ما تقييمك العام للمشروع؟', kind: 'rating' },
      { text: 'ما أكثر ما أعجبك؟', kind: 'text' },
      { text: 'ما الذي يمكن تحسينه؟', kind: 'text' },
    ],
  },
  {
    id: 'rfq', name: 'طلب عروض أسعار', icon: '💰', desc: 'جمع عروض الأسعار من المورّدين',
    questions: [
      { text: 'اسم الشركة/المورّد', kind: 'text' },
      { text: 'السعر المقترح (ر.س)', kind: 'text' },
      { text: 'مدة التنفيذ المتوقّعة', kind: 'single', options: ['أسبوع', 'أسبوعان', 'شهر', 'أكثر من شهر'] },
      { text: 'ما الذي يشمله العرض؟', kind: 'text' },
    ],
  },
]
