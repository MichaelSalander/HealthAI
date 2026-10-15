import { uni as h5Uni } from '@dcloudio/uni-h5'

export const uniApi = (globalThis as { uni?: typeof h5Uni }).uni ?? h5Uni
