const http = require('http')
const fs = require('fs')
const path = require('path')
const root = path.resolve(__dirname, '..', 'html-prototype')
const port = 4174
http.createServer((req, res) => {
  const file = path.join(root, req.url === '/' ? 'index.html' : req.url.split('?')[0])
  if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); return res.end('Not found') }
  res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'}); fs.createReadStream(file).pipe(res)
}).listen(port, '0.0.0.0', () => console.log(`HTML mobile prototype: http://localhost:${port}`))
