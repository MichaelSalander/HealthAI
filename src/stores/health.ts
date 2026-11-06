import { reactive } from 'vue'
import { authProvider } from '../services/api/repositories'
import { uniApi as uni } from '../services/platform/uni'
import type { User } from '../types/domain'
const state = reactive<{ user: User | null; hasUploadedReport: boolean; parsingDone: boolean }>({ user: null, hasUploadedReport: false, parsingDone: false })
export function useHealthStore() { return { state, async ensureUser() { if (!state.user && uni.getStorageSync('healthai_customer_session')) { try { state.user = await authProvider.login() } catch { state.user = null } } }, markReportUploaded() { state.hasUploadedReport = true; state.parsingDone = true } } }
