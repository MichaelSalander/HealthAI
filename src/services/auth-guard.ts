/** Page lifecycle guard shared by H5 and mini-program pages. */
export function guardPage() {
  const pages = getCurrentPages()
  if (!pages.length) return
  const route = `/${pages[pages.length - 1]?.route || ''}`
  if (route === '/pages/login/index' || route === '/pages/consultant/login') return
  const role = route.startsWith('/pages/consultant/') || route === '/pages/consultants/notices' ? 'consultant' : 'customer'
  let valid = false
  try { const session = JSON.parse(String(uni.getStorageSync(`healthai_${role}_session`) || 'null')); valid = Boolean(session?.token && session.role === role) } catch { /* No valid session. */ }
  if (!valid) uni.reLaunch({ url: role === 'consultant' ? '/pages/consultant/login' : '/pages/login/index' })
}
