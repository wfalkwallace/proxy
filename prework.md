# Creating the Proxy Server

The pre-work incorporates a few steps:

1. Setup your Node.js environment
2. Build a proxy server and setup logging
3. Develop a command-line interface (CLI) to configure the server
4. Submit the project for review via Github
5. Extend your proxy server with additional functions

**Questions?** If you have any questions or concerns, please feel free to email us at <nodejs@codepath.com>.

## 1. Setup Node Environment

Before you get started, [setup your Node.js environment](http://guides.codepath.com/nodejs/Setup).

Start reading about JavaScript and Node.js. You can find a good quick JavaScript overview [here](http://bonsaiden.github.io/JavaScript-Garden/) and [here](https://leanpub.com/jsfun/read#leanpub-auto-javascript-fundamentals-the-powerful-and-misunderstood-language-of-the-web) and a quick node.js overview [here](https://leanpub.com/jsfun/read#leanpub-auto-nodejs-fundamentals-javascript-on-the-server). A more complete JavaScript primer from Mozilla is [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide) and for node.js see the [API documentation](http://nodejs.org/docs/latest/api/all.html). If you prefer to learn by video, Lynda has a good [JavaScript](http://www.lynda.com/JavaScript-tutorials/Introducing-JavaScript-Language/123563-2.html) (~3h) and [node.js](http://www.lynda.com/Nodejs-tutorials/Nodejs-First-Look/101554-2.html) (~2h) overview.

Follow the Proxy Server [video walkthrough]( https://vimeo.com/crabdude/proxy) to get the basic Proxy Server functionality up and running. After you finish the walkthrough, follow the steps below to add a CLI.

*Note:* Throughout this assignment we'll be using `-g` to install packages. For an explanation, see [global vs installed packages](http://blog.nodejs.org/2011/03/23/npm-1-0-global-vs-local-installation). (*Summary:* `-g` packages can be used in your shell, local packages can be `require`d)

## 2. Build the Proxy Server

Watch this Proxy Server [video walkthrough]( https://vimeo.com/crabdude/proxy) to get the basic Proxy Server functionality up and running. Steps are also documented below within this section.

### Basic Setup

1. Create a new directory for your project
1. Run `npm init` and follow the prompts
1. Create `index.js` and add the following to create a server using the core [`http`](https://nodejs.org/docs/latest/api/all.html#all_http) module:

	```node
	let http = require('http')

	http.createServer((req, res) => {
		console.log(`Request received at: ${req.url}`)
		res.end('hello world\n')
	}).listen(8000)
	```
1. Run your server:

	```bash
	$ babel-node index.js
	```
	and verify it's running:
	
	```bash
	$ curl http://127.0.0.1:8000
	hello world
	```
1. Use `npm start` instead to run your server:

	The convention is to use `npm start` to start your server. To use `npm start`, we must add a `"start"` entire to the package.json `"scripts"` object. See npm's [package.json documentation](https://docs.npmjs.com/files/package.json) for details, specifically the [scripts](https://docs.npmjs.com/misc/scripts) section.

*Bonus:* Have your server auto-restart on code changes using nodemon. Install nodemon: `npm install -g nodemon` and then start your server: `nodemon --exec babel-node -- --optional strict --stage 1 -- index.js`.

*Note:* The first `--` is for nodemon and allows arguments to be passed to babel-node, the second `--` is for babel-node and allows arguments to be passed to our process. Without nodemon, it would be: `babel-node --optional strict --stage 1 -- index.js`. If you followed the [Setup Guide](), you can use the `bodemon` alias instead: `bodemon index.js`.

*Bonus:* Have `npm start` start your server with nodemon. See the [nodemon section](https://babeljs.io/docs/using-babel/#nodemon) in the Babeljs documentation for tips on implementing this.

### Echo Server

Our goal here is to create a server that echos our requests back to us.

We'll be using node.js streams throughout this assignment. **Think of node.js streams as arrays of data over time instead of memory.** For the Proxy server, you need only know the [`readableStream.pipe(writableStream)`](https://nodejs.org/api/stream.html#stream_readable_pipe_destination_options) and [`writableStream.write(string)`](https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback) APIs. See our [Stream Guide]() or the [Stream Handbook](https://github.com/substack/stream-handbook#introduction) for more information.

*Common readable streams:* `req`, `process.stdin`

*Common writable streams:* `res`, `process.stdout`
	
1. Instead of using `res.end` to send a static response, let's send the request back to ourselves by piping our readable request stream to our writable reponse stream:


	```node
	req.pipe(res)
	```
	and verify it's working:
	
	```bash
	$ curl -X POST http://127.0.0.1:8000 -d "hello self"
	hello self
	```
1. Since most HTTP request headers can also be used as response headers, let's echo back the headers too by adding the following line:
	
	```node
	for (let header in req.headers) {
		res.setHeader(header, req.headers[header])
	}
	```
	Excellent. Now our request headers will be echoed back as well:
	
	```bash
	$ curl -v -X POST http://127.0.0.1:8000 -d "hello self" -H "x-asdf: yodawg"
	* Rebuilt URL to: http://127.0.0.1:8000/
	* Hostname was NOT found in DNS cache
	*   Trying 127.0.0.1...
	* Connected to 127.0.0.1 (127.0.0.1) port 8000 (#0)
	> POST / HTTP/1.1
	> User-Agent: curl/7.37.1
	> Host: 127.0.0.1:8000
	> Accept: */*
	> x-asdf: yodawg
	> Content-Length: 10
	> Content-Type: application/x-www-form-urlencoded
	> 
	* upload completely sent off: 10 out of 10 bytes
	< HTTP/1.1 200 OK
	< user-agent: curl/7.37.1
	< host: 127.0.0.1:8000
	< accept: */*
	< x-asdf: yodawg
	< content-length: 10
	< content-type: application/x-www-form-urlencoded
	< Date: Mon, 13 Apr 2015 00:45:50 GMT
	< Connection: keep-alive
	< 
	* Connection #0 to host 127.0.0.1 left intact
	hello self
	```

### Proxy Server

Now, let's build a proxy server. A proxy server is just a server that forwards a request on to a destination server, URL or IP, and responds with the destination server's response.

1. We'll make our echo server our destination server (We'll make this configurable later):

	```node
	let destinationUrl = '127.0.0.1:8000'
	```
1. And create a separate proxy server:

	```node
	http.createServer((req, res) => {
	  console.log(`Proxying request to: ${destinationUrl + req.url}`)
	  // Proxy code here
	}).listen(8001)
	```
1. Next we want to make a request to the destination server. For convenience, we'll use the `request` package instead of the core `http.request` functionality
	1. Install `request`:

		```bash
		project_root$ npm install --save request
		```
	1. Require `request` at the top of index.js:

		```node
		let request = require('request')
		```
	1. Make a request to the destination server at the same path using request:

		```node
		let options = {
			headers: req.headers,
			url: `http://${destinationUrl}${req.url}`
		}
		request(options)
		```
		
		*Note:* The above code uses [ESNext string interpolation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/template_strings), a feature provided by Babel.js.
	1. Forward the destination server's reponse:

		```node
		request(options).pipe(res)
		```
	1. Lastly, for non-GET requests, we'll want to forward the request body and set `option.method` to `req.method`:

		```node
		options.method = req.method
		req.pipe(request(options)).pipe(res)
		```
	1. Verify the proxy server at `http://127.0.0.1:8001` operates exactly the same as the echo server at `http://127.0.0.1:8000`:

		```bash
		$ curl -v http://127.0.0.1:8001/asdf -d "hello proxy"
		* Hostname was NOT found in DNS cache
		*   Trying 127.0.0.1...
		* Connected to 127.0.0.1 (127.0.0.1) port 8001 (#0)
		> POST /asdf HTTP/1.1
		> User-Agent: curl/7.37.1
		> Host: 127.0.0.1:8001
		> Accept: */*
		> Content-Length: 11
		> Content-Type: application/x-www-form-urlencoded
		> 
		* upload completely sent off: 11 out of 11 bytes
		< HTTP/1.1 200 OK
		< user-agent: curl/7.37.1
		< host: 127.0.0.1:8001
		< accept: */*
		< content-length: 11
		< content-type: application/x-www-form-urlencoded
		< connection: close
		< date: Mon, 13 Apr 2015 02:03:29 GMT
		< 
		* Closing connection 0
		hello proxy
		```

Congratulations, you've successfully built a fully functional Proxy Server!

### Logging

1. Basic Logging

	Let's make sure all our requests and responses are logged out to stdout. `.pipe` will allow us to do this quite nicely:

	```node
	// Log the req headers and content in our server callback
	process.stdout.write('\n\n\n' + JSON.stringify(req.headers))
	req.pipe(process.stdout)
	```
	and for the destination server's response:

	```node
	// Log the proxy request headers and content in our server callback
	let downstreamResponse = req.pipe(request(options))
	process.stdout.write(JSON.stringify(downstreamResponse.headers))
	downstreamResponse.pipe(process.stdout)
	downstreamResponse.pipe(res)
	```
	
	*Note:* We must serialize the headers object with `JSON.stringify` since the default JavaScript object serialization uselessly outputs `[object Object]`.

## 3. Adding a CLI

Currently, our proxy server isn't very useful because it only proxies to a single hardcoded url. We want to make that URL in addition to a few other things configurable. So let's add a CLI.

**Questions?** If you have any questions or concerns, please feel free to email us at <nodejs@codepath.com>.

### Destination Url

1. We'll be using the [`yargs`](https://www.npmjs.com/package/yargs) package, so we'll need to install the packge locally in our project:

	```bash
	project_root$ npm install --save yargs
	```
	
	*Note:* Be sure to review the [yargs Documentation](https://www.npmjs.com/package/yargs) for supported features.

1. Now, let's pass the destination url on the `--host` argument:

	```node
	// Place near the top of your file, just below your other requires 
	// Set a the default value for --host to 127.0.0.1
	let argv = require('yargs')
		.default('host', '127.0.0.1:8000')
		.argv
	let scheme = 'http://'
	// Build the destinationUrl using the --host value
	let destinationUrl = scheme + argv.host
	```
1. Next, we'll add `--port` support:

	*Note:* In JavaScript, `||` can be used as a [null coalescing operator](http://en.wikipedia.org/wiki/Null_coalescing_operator). In short, if the first value is empty, use the second value.
	
	```node
	// Get the --port value
	// If none, default to the echo server port, or 80 if --host exists
	let port = argv.port || argv.host === '127.0.0.1' ? 8000 : 80
	
	// Update our destinationUrl line from above to include the port
	let destinationUrl = scheme  + argv.host + ':' + port
	```
	
1. And `--url` for convenience:

	```node
	let destinationUrl = argv.url || scheme + argv.host + ':' + port
	```
1. Finally, if present, allow the `x-destination-url` header to override the `destinationUrl` value.

	Headers can be obtained like so `req.headers['x-destination-url]`.

### Better Logging

1. Write to log file

	When the `--log` argument is specified, send all logging to the specified file **instead of** `process.stdout`. The simplest way to implement this is to create an `outputStream` variable, and use it instead of `process.stdout`. Since `.pipe` will cause the destination stream (the log file stream in this case) to close when the source stream closes, we'll need to create a new destination stream every call to `.pipe` 
	
	*Note:* [`process.stdout`](https://nodejs.org/api/process.html#process_process_stdout) is special and never closes.
		
	```node
	let path = require('path')
	let fs = require('fs')
	let logPath = argv.log && path.join(__dirname, argv.log)
	let getLogStream = ()=> logPath ? fs.createWriteStream(logPath) : process.stdout

	//...
	// Replace .pipe(process.stdout) with
	req.pipe(getLogStream())
	```

1. Use pipeOptions instead:

	While the above works, we can do better and not close the destination stream at all. To do this, [use `readable.pipe`'s `end` option](https://nodejs.org/docs/latest/api/all.html#all_readable_pipe_destination_options) to keep our source streams from closing the destination stream:
			
	```node
	let logPath = argv.log && path.join(__dirname, argv.log)
	let logStream = logPath ? fs.createWriteStream(logPath) : process.stdout
	//...
	// Replace req.pipe(getLogStream()) with
	req.pipe(logStream, {end: false})
	```
	
1. You can also write directly to the logStream:

	```node
	logStream.write('Request headers: ' + JSON.stringify(req.headers)
	```
	
1. Be sure to verify that your logfile is created and contains all the expected contents!

## 4. Submitting the Project

Once you have completed the Proxy Server **including adding the CLI**, please [push your app via Github](https://help.github.com/articles/create-a-repo). All submissions occur via Github and we require each submission to follow a particular format which includes a **clearly documented README** with a GIF walkthrough and **an issue raised** as detailed below.

<img src='http://i.imgur.com/i5tCNFe.png' title='Submitted Issue' width='' alt='Submitted Issue' />

Submit your project by **creating an issue on your repository** and adding our Github handles to the issue body (**@codepathreview** and **@codepath**) so we can review the submission. See the [example of the issue](https://github.com/CrabDude/nodejs-proxy-demo/issues/1).

Also be sure to **include a README** containing a GIF walkthrough using [LiceCap](http://www.cockos.com/licecap/) of the project demostrating the functionality has been completed. See [this README](https://github.com/CrabDude/nodejs-proxy-demo/blob/submission/README.md) as an example of a complete README.

**Note:** All project submissions happen via github. If needed, review how to push your apps to github with [this handy tutorial](https://help.github.com/articles/create-a-repo).

**Windows Users:** For LiceCap to record GIFs properly in certain versions of Windows, be sure to set Scaling to 100%.

### Submission Checklist

Please **review the following checklist** to ensure your submission is valid:

 * Can you **successfully echo requests** made to the echo server?
 * Can you **successfully proxy requests** made to the proxy server?
 * Did you include a **CLI** as described above?
 * Does your app **log request to stdout** or save it properly to a file when the log argument is given?
 * Did you successfully **push your code to github**? Can you see the code on github?
 * Did you **add a README** which includes a **GIF walkthrough** of the app's functionality?
 * Did you **create an issue** on the repo and include **/cc @codepathreview @codepath** in the issue body?

If the answer to all of these is **YES** then you've successfully completed the basic Proxy server. When you've completed this, we will schedule a short phone call with you so we can chat further and answer any questions you have about the bootcamp and the rest of the selection process. In the meantime, you should focus on **improving the performance, stability and feature-set** of your Proxy server as explained below.

**Questions?** If you have any questions or concerns, please feel free to email us at <nodejs@codepath.com>.

## 5. Extending your Server

After initial submission, you should iterate by adding several additional features to your Proxy server. Engineers that submit Proxy servers with extended functionality and improved APIs are **significantly more likely to be accepted** into the bootcamp. Be sure to refer to our [new node.js guides](http://guides.codepath.com/nodejs). Try your hand at implementing the following user stories and any other extensions of your own choosing:

1. Process Forwarding

	HTTP proxying is nice, but let's make this a multi-purpose proxy process. Allow a process name to be specified in the `--exec` argument. You'll want to use `child_process.spawn` to pipe stdin/stdout/stderr between the process and the child process.
	
	*Note:* When run in process proxy mode, don't start the server.
	
	```bash
	$ cat index.js | babel-node index.js --exec grep require
	
	let http = require('http')
	let request = require('request')
	let argv = require('yargs')	
	```

1. Better Logging

	When the `--loglevel` argument is specified, only output logs greater than or equal to the specified level. See the [Syslog Severity Levels](http://en.wikipedia.org/wiki/Syslog#Severity_levels) for a list of recommended log levels.
	
	This is a little more difficult, but your best bet is a functional programming approach. Consider implementing and utilizing the following utility functions:
	
	```node
	function logStream(level, stream) {
		// Your code here
	}
	
	function logMessage(level, message) {
		// Your code here
	}
	```
	
	*Bonus:* Combine the above functions by detecting whether the input is a Stream or a String. (*Hint:* Detect streams using `instanceof`)
	
1. Documentation, `-h`

	Yargs has built-in support for documentation using the `.usage` and `.describe` methods. Document all the functionality you've implemented, and expose them with `-h`.
	
	*Bonus:* Give some props to CodePath and your company in the Epilog
	
1. Support HTTPS
	
	Send an https request to the destination server when the client sends an https request. There is a core [`https`](https://nodejs.org/docs/latest/api/all.html#all_https) module you can use as a drop-in replacement for the `http` module.
	
	*Bonus:* Add additional CLI arguments for https destination ports.

1. Tweak the log styling, play with colors, spacing and additional data 
1. Anything else that you can get done to improve the app functionality!

Please **reply back to the github issue** after pushing new features. Be sure to include in the README an updated GIF walkthrough using [LiceCap](http://www.cockos.com/licecap/) of the app demoing how it works with required user stories completed.

## Troubleshooting Notes

During setup, there are a number of ways that things can go wrong and this can be very frustrating. This is an attempt to help you avoid common issues as much as possible.

See the [Node.js Setup](http://guides.codepath.com/nodejs/Setup) guide for help setting up your environment and the [Troubleshooting](http://guides.codepath.com/nodejs/Setup) guide for help with issues like debugging.
