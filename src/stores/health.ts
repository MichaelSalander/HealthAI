import { reactive } from 'vue'
import { authProvider } from '../services/api/repositories'
import { uniApi as uni } from '../services/platform/uni'
import type { User } from '../types/domain'
const state = reactive<{ user: User | null; hasUploadedReport: boolean; parsingDone: boolean }>({ user: null, hasUploadedReport: false, parsingDone: false })
export function useHealthStore() { return { state, async ensureUser() {
  const rawSession = uni.getStorageSync('healthai_customer_session')
  if (!rawSession) { state.user = null; return null }
  try {
    const session = JSON.parse(String(rawSession)) as { id?: string; role?: string; token?: string }
    if (!session.token || session.role !== 'customer' || uni.getStorageSync('healthai_active_role') === 'consultant') { state.user = null; return null }
    if (state.user?.id !== session.id) state.user = null
    const currentUser = await authProvider.login()
    if (currentUser.id !== session.id) { state.user = null; return null }
    state.user = currentUser
    return currentUser
  } catch { state.user = null; return null }
}, markReportUploaded() { state.hasUploadedReport = true; state.parsingDone = true } } }
