// توليد معرّفات فريدة (مؤقتة للجلسة — تُستبدل بمعرّفات backend لاحقاً)
export const uid = (prefix: string) => prefix + Math.random().toString(36).slice(2, 8)
