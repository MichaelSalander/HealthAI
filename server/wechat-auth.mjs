import { createHash } from 'node:crypto'

export async function exchangeMiniProgramCode(code, config = {}) {
  if (!code) throw Object.assign(new Error('缺少微信登录 code'), { status: 400 })
  // touristappid / 测试 AppID 没有可供后端调用的 AppSecret。
  // 测试模式只在本地显式开启，并使用 code 的稳定摘要作为临时身份。
  if (config.testMode && (!config.appId || !config.appSecret || config.appId === 'touristappid')) {
    return { openid: `test-${createHash('sha256').update(code).digest('hex').slice(0, 32)}` }
  }
  if (!config.appId || !config.appSecret) throw Object.assign(new Error('后端尚未配置微信 AppID/AppSecret'), { status: 503 })
  const url = new URL('https://api.weixin.qq.com/sns/jscode2session')
  url.searchParams.set('appid', config.appId)
  url.searchParams.set('secret', config.appSecret)
  url.searchParams.set('js_code', code)
  url.searchParams.set('grant_type', 'authorization_code')
  const response = await fetch(url)
  if (!response.ok) throw Object.assign(new Error('微信登录服务暂时不可用'), { status: 502 })
  const payload = await response.json()
  if (payload.errcode || !payload.openid) throw Object.assign(new Error(`微信登录失败：${payload.errmsg || '无效 code'}`), { status: 401 })
  return { openid: payload.openid, unionid: payload.unionid }
}

export function stableWechatUserId(openid, role) {
  return `wx-${role}-${createHash('sha256').update(openid).digest('hex').slice(0, 16)}`
}
