let http = require('http')
let fs = require('fs')
let request = require('request')
let through = require('through')

let scheme = 'http://'
let argv = require('yargs')
    .default('host', '127.0.0.1')
    .argv
let port = argv.port || argv.host === '127.0.0.1' ? 8000 : 80
let destinationUrl = argv.url || scheme + argv.host + ':' + port
let logStream = argv.logfile ? fs.createWriteStream(argv.logfile) : process.stdout

console.log(argv.logfile)

http.createServer((req, res) => {
  console.log(`Request received at: ${req.url}`)
  req.pipe(res)
  for (let header in req.headers) {
    res.setHeader(header, req.headers[header])
  }
}).listen(8000)

http.createServer((req, res) => {
  console.log(`Proxying request to: ${destinationUrl + req.url}`)
  logStream.write('\n' + JSON.stringify(req.headers))
  through(req, logStream, { autoDestroy: false })
  let options = {
    headers: req.headers,
    method: req.method,
    url: req.headers['x-destination-url'] || `${destinationUrl}${req.url}`
  }
  let downstreamResponse = req.pipe(request(options))
  logStream.write('\n' + JSON.stringify(downstreamResponse.headers))
  through(downstreamResponse, logStream, { autoDestroy: false })
  downstreamResponse.pipe(res)
}).listen(8001)

