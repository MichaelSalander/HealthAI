export function createOcrProvider({ name = process.env.OCR_PROVIDER || 'mock' } = {}) {
  if (name !== 'mock') throw new Error(`暂不支持 OCR Provider: ${name}，请先实现对应 Adapter`)
  return {
    name: 'mock-ocr-provider',
    async extract({ reportId, measuredAt }) {
      return {
        reportId,
        provider: 'mock-ocr-provider',
        status: 'needs_confirmation',
        candidates: [
          { id: `${reportId}-glucose`, code: 'fasting-glucose', name: '空腹血糖', value: '6.8', unit: 'mmol/L', reference: '< 6.1', status: '偏高', confidence: 0.96, measuredAt },
          { id: `${reportId}-ldl`, code: 'ldl-c', name: 'LDL-C（低密度脂蛋白）', value: '4.2', unit: 'mmol/L', reference: '< 3.4', status: '偏高', confidence: 0.93, measuredAt },
          { id: `${reportId}-alt`, code: 'alt', name: 'ALT（丙氨酸转氨酶）', value: '68', unit: 'U/L', reference: '< 40', status: '偏高', confidence: 0.91, measuredAt }
        ]
      }
    }
  }
}
