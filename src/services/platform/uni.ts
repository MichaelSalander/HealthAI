import { uni as h5Uni } from '@dcloudio/uni-h5'

type NavigateOptions = { url: string }
type ToastOptions = { title: string }

const runtime = (globalThis as { uni?: typeof h5Uni }).uni ?? h5Uni

export const uniApi = {
  ...runtime,
  navigateTo(options: NavigateOptions) {
    const nativeNavigateTo = (runtime as typeof runtime & { navigateTo?: (input: NavigateOptions) => unknown }).navigateTo
    if (nativeNavigateTo) return nativeNavigateTo.call(runtime, options)
    if (typeof window !== 'undefined') window.location.hash = `#${options.url}`
  },
  navigateBack() {
    const nativeNavigateBack = (runtime as typeof runtime & { navigateBack?: () => unknown }).navigateBack
    if (nativeNavigateBack) return nativeNavigateBack.call(runtime)
    if (typeof window !== 'undefined') window.history.back()
  },
  showToast(options: ToastOptions) {
    const nativeShowToast = (runtime as typeof runtime & { showToast?: (input: ToastOptions) => unknown }).showToast
    if (nativeShowToast) return nativeShowToast.call(runtime, options)
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('healthai-toast', { detail: options.title }))
  }
}
