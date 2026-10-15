import { reactive } from 'vue'
import { authProvider } from '../services/mock/repositories'
import type { User } from '../types/domain'
const state = reactive<{ user: User | null; hasUploadedReport: boolean; mockParsingDone: boolean }>({ user: null, hasUploadedReport: false, mockParsingDone: false })
export function useHealthStore() { return { state, async ensureMockUser() { if (!state.user) state.user = await authProvider.mockLogin() }, markReportUploaded() { state.hasUploadedReport = true; state.mockParsingDone = true } } }
