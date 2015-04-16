let http = require('http')
let request = require('request')

let scheme = ''
let argv = require('yargs')
    .default('host', '127.0.0.1')
    .argv
let port = argv.port || argv.host === '127.0.0.1' ? 8000 : 80
let destinationUrl = argv.url || scheme + argv.host + ':' + port
let logStream = argv.logfile ? fs.createWriteStream(argv.logfile) : process.stdout

http.createServer((req, res) => {
  console.log(`Request received at: ${req.url}`)
  req.pipe(res)
  for (let header in req.headers) {
    res.setHeader(header, req.headers[header])
  }
}).listen(8000)

http.createServer((req, res) => {
  console.log(`Proxying request to: ${destinationUrl + req.url}`)
  logStream.write('\n\n\n' + JSON.stringify(req.headers))
  req.pipe(process.stdout)
  let options = {
    headers: req.headers,
    method: req.method,
    url: req.headers['x-destination-url'] || `http://${destinationUrl}${req.url}`
  }
  let downstreamResponse = req.pipe(request(options))
  logStream.write(JSON.stringify(downstreamResponse.headers))
  downstreamResponse.pipe(logStream)
  downstreamResponse.pipe(res)
}).listen(8001)

