import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { hashPassword } from '../server/passwords.mjs'

const supplied = process.argv.slice(2).find(argument => argument !== '--')
let password = supplied
if (!password) {
  const readline = createInterface({ input, output })
  password = await readline.question('请输入运营账号密码（输入内容不会写入项目文件）：')
  readline.close()
}

if (!password || password.length < 12) {
  console.error('密码至少需要 12 个字符。')
  process.exitCode = 1
} else {
  console.log(hashPassword(password))
}
