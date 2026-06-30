// أنواع مشتركة لمكوّنات الرسوم البيانية
export interface ChartSeries {
  name: string
  color: string
  values: number[]
}

export interface DonutSegment {
  label: string
  value: number
  color: string
}

export interface ChartView {
  id: string
  icon: string
  label: string
}
