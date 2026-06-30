import { defineStore } from 'pinia'
import type { Project, Member, MemberTxn } from '@/interfaces/models'
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
    },
  },
})
