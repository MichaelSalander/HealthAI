type NavigateOptions = { url: string }
type ToastOptions = { title: string }
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
  getStorageSync?: (key: string) => unknown
  setStorageSync?: (key: string, value: string) => unknown
  [key: string]: unknown
}

// Use the platform-provided global uni object. A static @dcloudio/uni-h5 import
// makes mp-weixin bundles pull H5-only runtime modules and breaks compilation.
const nativeRuntime = (globalThis as { uni?: Partial<UniRuntime> }).uni ?? {}
const runtime = {
  ...nativeRuntime,
  request: nativeRuntime.request ?? (() => { throw new Error('当前运行环境不支持 uni.request') }),
  navigateTo: nativeRuntime.navigateTo ?? ((options: NavigateOptions) => { if (typeof window !== 'undefined') window.location.hash = `#${options.url}` }),
  redirectTo: nativeRuntime.redirectTo ?? ((options: NavigateOptions) => { if (typeof window !== 'undefined') window.location.hash = `#${options.url}` }),
  reLaunch: nativeRuntime.reLaunch ?? ((options: NavigateOptions) => { if (typeof window !== 'undefined') window.location.hash = `#${options.url}` }),
  getStorageSync: nativeRuntime.getStorageSync ?? (() => undefined),
  setStorageSync: nativeRuntime.setStorageSync ?? (() => undefined)
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
  getStorageSync(key: string) {
    return runtime.getStorageSync?.call(runtime, key)
  },
  setStorageSync(key: string, value: string) {
    return runtime.setStorageSync?.call(runtime, key, value)
  }
}
