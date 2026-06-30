import { defineStore } from 'pinia'
import type { Project, Member, MemberTxn, MemberTxnStatus } from '@/interfaces/models'
import { INITIAL_PROJECTS, INITIAL_MEMBERS, INITIAL_MEMBER_TXNS } from '@/data/seed'

// متجر المشاريع والأعضاء (كيان أساسي مشترك عبر كل الموديولات)
export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [...INITIAL_PROJECTS] as Project[],
    members: [...INITIAL_MEMBERS] as Member[],
    memberTxns: [...INITIAL_MEMBER_TXNS] as MemberTxn[],
    activeProjectId: (INITIAL_PROJECTS[0]?.id ?? '') as string,
  }),

  getters: {
    activeProject: (s) => s.projects.find((p) => p.id === s.activeProjectId) ?? null,
    projectById: (s) => (id: string) => s.projects.find((p) => p.id === id) ?? null,
    membersByProject: (s) => (projectId: string) =>
      s.members.filter((m) => m.projectId === projectId),
    memberById: (s) => (id: string) => s.members.find((m) => m.id === id) ?? null,
    totalBalance: (s) => s.projects.reduce((sum, p) => sum + p.balance, 0),
    txnsByMember: (s) => (memberId: string) =>
      s.memberTxns.filter((t) => t.memberId === memberId),
    // رصيد العضو المحسوب من الحركات المقبولة (عهد للعضو − ما رُدّ منه)
    computedMemberBalance: (s) => (memberId: string) =>
      s.memberTxns
        .filter((t) => t.memberId === memberId && t.status === 'accepted')
        .reduce((sum, t) => sum + (t.direction === 'to_member' ? t.amount : -t.amount), 0),
  },

  actions: {
    setActiveProject(id: string) {
      this.activeProjectId = id
    },
    addProject(p: Project) {
      this.projects.unshift(p)
    },
    updateProject(p: Project) {
      const i = this.projects.findIndex((x) => x.id === p.id)
      if (i !== -1) this.projects[i] = p
    },
    removeProject(id: string) {
      this.projects = this.projects.filter((p) => p.id !== id)
      this.members = this.members.filter((m) => m.projectId !== id)
    },

    // ── الأعضاء ──
    addMember(m: Member) {
      this.members.push(m)
    },
    updateMember(m: Member) {
      const i = this.members.findIndex((x) => x.id === m.id)
      if (i !== -1) this.members[i] = m
    },
    removeMember(id: string) {
      this.members = this.members.filter((m) => m.id !== id)
      this.memberTxns = this.memberTxns.filter((t) => t.memberId !== id)
    },

    // ── حركات رصيد الأعضاء ──
    syncMemberBalance(memberId: string) {
      const m = this.members.find((x) => x.id === memberId)
      if (m) m.balance = this.computedMemberBalance(memberId)
    },
    addMemberTxn(t: MemberTxn) {
      this.memberTxns.unshift(t)
      if (t.status === 'accepted') this.syncMemberBalance(t.memberId)
    },
    decideMemberTxn(id: string, status: MemberTxnStatus) {
      const t = this.memberTxns.find((x) => x.id === id)
      if (!t) return
      t.status = status
      this.syncMemberBalance(t.memberId)
    },
  },
})
