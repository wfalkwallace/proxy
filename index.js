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
  process.stdout.write('\n\n\n' + JSON.stringify(req.headers))
  req.pipe(process.stdout)
  let options = {
    headers: req.headers,
    method: req.method,
    url: `http://${destinationUrl}${req.url}`
  }
  let downstreamResponse = req.pipe(request(options))
  process.stdout.write(JSON.stringify(downstreamResponse.headers))
  downstreamResponse.pipe(process.stdout)
  downstreamResponse.pipe(res)
}).listen(8001)
