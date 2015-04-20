let http = require('http')
let https = require('https')
let fs = require('fs')
let request = require('request')
let through = require('through')
let spawn = require('child_process').spawn
let scheme = 'http://'
let argv = require('yargs')
    .default('host', '127.0.0.1')
    .usage('Usage: bode index.js [options]')
    .help('h')
    .alias('h', 'help')
    .describe('host', 'Specify a destination host to connect to')
    .describe('port', 'Specify a destination port to connect to')
    .describe('url', 'Specify a destination url to connect to')
    .describe('file', 'Specify a logfile')
    .alias('f', 'file')
    .alias('p', 'port')
    .alias('u', 'url')
    .argv
let port = argv.port || argv.host === '127.0.0.1' ? 8000 : 80
let destinationUrl = argv.url || scheme + argv.host + ':' + port
let logStream = argv.file ? fs.createWriteStream(argv.file) : process.stdout

if (argv.exec) {
  console.log(argv.exec, [argv._[0]])
  var child = spawn(argv.exec, [argv._[0]])
  process.stdin.on('data', function (data) {
    console.log(data)
    child.stdin.write(data)
  });
  child.stdout.on('data', function (data) {
    console.log(data)
    console.log('' + data);
  });

} else if (argv.url && argv.url.match(/^https/)) {
  https.createServer((req, res) => {
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
} else {
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
}
