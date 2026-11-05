type NavigateOptions = { url: string }
type ToastOptions = { title: string }
type ModalOptions = { title: string; content: string; showCancel?: boolean }
type RequestOptions = {
  url: string
  method?: string
  data?: Record<string, unknown>
  timeout?: number
  header?: Record<string, string>
  success?: (response: { statusCode: number; data: unknown }) => void
  fail?: () => void
}
type UniRuntime = {
  request: (options: RequestOptions) => unknown
  navigateTo: (options: NavigateOptions) => unknown
  redirectTo: (options: NavigateOptions) => unknown
  reLaunch: (options: NavigateOptions) => unknown
  navigateBack?: () => unknown
  showToast?: (options: ToastOptions) => unknown
  showModal?: (options: ModalOptions) => unknown
  getStorageSync?: (key: string) => unknown
  setStorageSync?: (key: string, value: string) => unknown
  [key: string]: unknown
}

// Use the platform-provided global uni object. A static @dcloudio/uni-h5 import
// makes mp-weixin bundles pull H5-only runtime modules and breaks compilation.
const nativeRuntime = (globalThis as { uni?: Partial<UniRuntime> }).uni ?? {}
const browserRequest = (options: RequestOptions) => {
  if (typeof fetch === 'undefined') {
    options.fail?.()
    return
  }
  const method = (options.method || 'GET').toUpperCase()
  const requestInit: RequestInit = {
    method,
    headers: options.header,
  }
  if (method !== 'GET' && method !== 'HEAD' && options.data !== undefined) {
    requestInit.body = JSON.stringify(options.data)
  }
  const controller = new AbortController()
  const timeout = options.timeout ? setTimeout(() => controller.abort(), options.timeout) : undefined
  requestInit.signal = controller.signal
  fetch(options.url, requestInit)
    .then(async response => {
      const contentType = response.headers.get('content-type') || ''
      const data = contentType.includes('application/json') ? await response.json() : await response.text()
      options.success?.({ statusCode: response.status, data })
    })
    .catch(() => options.fail?.())
    .finally(() => { if (timeout) clearTimeout(timeout) })
}
const runtime = {
  ...nativeRuntime,
  request: nativeRuntime.request ?? browserRequest,
  navigateTo: nativeRuntime.navigateTo ?? ((options: NavigateOptions) => { if (typeof window !== 'undefined') window.location.hash = `#${options.url}` }),
  redirectTo: nativeRuntime.redirectTo ?? ((options: NavigateOptions) => { if (typeof window !== 'undefined') window.location.hash = `#${options.url}` }),
  reLaunch: nativeRuntime.reLaunch ?? ((options: NavigateOptions) => { if (typeof window !== 'undefined') window.location.hash = `#${options.url}` }),
  getStorageSync: nativeRuntime.getStorageSync ?? ((key: string) => typeof localStorage !== 'undefined' ? localStorage.getItem(key) : undefined),
  setStorageSync: nativeRuntime.setStorageSync ?? ((key: string, value: string) => { if (typeof localStorage !== 'undefined') localStorage.setItem(key, value) })
} as UniRuntime

export const uniApi = {
  ...runtime,
  navigateTo(options: NavigateOptions) {
    const nativeNavigateTo = runtime.navigateTo
    if (nativeNavigateTo) return nativeNavigateTo.call(runtime, options)
    if (typeof window !== 'undefined') window.location.hash = `#${options.url}`
  },
  navigateBack() {
    const nativeNavigateBack = runtime.navigateBack
    if (nativeNavigateBack) return nativeNavigateBack.call(runtime)
    if (typeof window !== 'undefined') window.history.back()
  },
  showToast(options: ToastOptions) {
    const nativeShowToast = runtime.showToast
    if (nativeShowToast) return nativeShowToast.call(runtime, options)
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('healthai-toast', { detail: options.title }))
  },
  showModal(options: ModalOptions) {
    const nativeShowModal = runtime.showModal
    if (nativeShowModal) return nativeShowModal.call(runtime, options)
    if (typeof window !== 'undefined') window.alert(`${options.title}\n\n${options.content}`)
  },
  getStorageSync(key: string) {
    return runtime.getStorageSync?.call(runtime, key)
  },
  setStorageSync(key: string, value: string) {
    return runtime.setStorageSync?.call(runtime, key, value)
  }
}
