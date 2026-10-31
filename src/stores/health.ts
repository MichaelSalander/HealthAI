import { reactive } from 'vue'
import { authProvider } from '../services/api/repositories'
import type { User } from '../types/domain'
const state = reactive<{ user: User | null; hasUploadedReport: boolean; parsingDone: boolean }>({ user: null, hasUploadedReport: false, parsingDone: false })
export function useHealthStore() { return { state, async ensureUser() { if (!state.user) state.user = await authProvider.login() }, markReportUploaded() { state.hasUploadedReport = true; state.parsingDone = true } } }
