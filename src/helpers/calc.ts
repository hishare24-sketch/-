import type { Asset, Commitment, Receivable } from '@/interfaces/models'

// حسابات الكيانات المشتقّة
export const recvPaid = (r: Receivable) => r.payments.reduce((s, p) => s + p.amount, 0)
export const recvRemaining = (r: Receivable) => Math.max(0, r.amount - recvPaid(r))
export const assetMaintCost = (a: Asset) => a.maintenance.reduce((s, m) => s + m.cost, 0)
export const commitmentDone = (c: Commitment) => c.totalCount != null && c.paidCount >= c.totalCount
