import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeResult } from './ai-provider.mjs'

const observations = [{ id: 'o1', name: '检测项', value: '76', unit: 'U/L', reference: '报告范围', status: '偏高', measuredAt: '2026-11-01' }]
const response = { summary: '需核对异常指标', consultantInsight: '指标依据与跟进事项', findings: [{ observationId: 'o1', value: '999', meaning: '需要结合资料判断', uncertainties: ['是否存在相关症状？'] }], questions: ['是否空腹？'], lifestyleAdvice: ['记录作息'], followUp: ['携报告咨询医生'], limitations: ['缺少既往报告'] }
test('measurement evidence comes from source, never model-generated numbers', () => {
  const result = normalizeResult(response, observations)
  assert.equal(result.findings[0].value, '76')
  assert.equal(result.reviewStatus, 'pending')
  assert.deepEqual(result.questions, ['是否空腹？'])
})
test('unknown evidence and missing analysis fail closed', () => {
  assert.throws(() => normalizeResult({ ...response, findings: [{ observationId: 'invented' }] }, observations))
  assert.throws(() => normalizeResult({ ...response, findings: [] }, observations))
  assert.throws(() => normalizeResult({}, observations))
})
