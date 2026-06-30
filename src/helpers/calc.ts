import type { Asset, Commitment, Receivable, Project, Transaction } from '@/interfaces/models'

// الرصيد المحسوب = الرصيد الافتتاحي + الإيرادات − المصروفات ± التحويلات
export function computeBalance(project: Project, transactions: Transaction[]): number {
  let bal = project.balance
  for (const t of transactions) {
    if (t.projectId !== project.id) continue
    if (t.type === 'income') bal += t.amount
    else if (t.type === 'expense') bal -= t.amount
    else if (t.type === 'transfer') bal += t.transferDir === 'in' ? t.amount : -t.amount
  }
  return bal
}

// حسابات الكيانات المشتقّة
export const recvPaid = (r: Receivable) => r.payments.reduce((s, p) => s + p.amount, 0)
export const recvRemaining = (r: Receivable) => Math.max(0, r.amount - recvPaid(r))
export const assetMaintCost = (a: Asset) => a.maintenance.reduce((s, m) => s + m.cost, 0)
export const commitmentDone = (c: Commitment) => c.totalCount != null && c.paidCount >= c.totalCount
