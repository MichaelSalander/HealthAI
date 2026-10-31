/**
 * C 端统一 Repository 入口。页面只能依赖这一层；当前实现仍包含本地兼容
 * Adapter，但健康资料、报告、订单和咨询数据已优先通过 API 读取。
 */
export { aiRepository, authProvider, commerceRepository, consultantRepository, contentRepository, healthRepository } from '../mock/repositories'
