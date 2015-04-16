let http = require('http')

http.createServer((req, res) => {
    console.log(`Request received at: ${req.url}`)
    res.end('hello world\n')
}).listen(8000)
