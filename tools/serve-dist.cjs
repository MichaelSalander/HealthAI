const http = require('http')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..', 'dist')
const port = Number(process.env.PORT || 4173)
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' }

http.createServer((req, res) => {
  const requestPath = decodeURIComponent((req.url || '/').split('?')[0])
  const safePath = path.normalize(requestPath).replace(/^([.][.][/\\])+/, '')
  let file = path.join(root, safePath === '/' ? 'index.html' : safePath)
  if (!file.startsWith(root)) { res.writeHead(403); return res.end('Forbidden') }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html')
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' })
  fs.createReadStream(file).pipe(res)
}).listen(port, '0.0.0.0', () => console.log(`HealthAI H5 preview: http://localhost:${port}`))
