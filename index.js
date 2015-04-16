let http = require('http')
let request = require('request')
let destinationUrl = '127.0.0.1:8000'

http.createServer((req, res) => {
  console.log(`Request received at: ${req.url}`)
  req.pipe(res)
  for (let header in req.headers) {
    res.setHeader(header, req.headers[header])
  }
}).listen(8000)

http.createServer((req, res) => {
  console.log(`Proxying request to: ${destinationUrl + req.url}`)
  let options = {
    headers: req.headers,
    method: req.method,
    url: `http://${destinationUrl}${req.url}`
  }
  req.pipe(request(options)).pipe(res)
}).listen(8001)
