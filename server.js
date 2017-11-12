/* 
 * piworld-server for piworld web apps
 * Josep Mulet (pep.mulet@gmail.com)
 * https://github.com/jmulet/piworld-server
 */
var config;
try {
    config = require('./server.config');
} catch (Ex) {
    console.log(Ex);

    console.log("========================================================");
    console.log("= piworld-server  by J. Mulet (pep.mulet@gmail.com)    =");
    console.log("========================================================");
    console.log(" CONFIGURATION REQUIRED!");
    console.log("   Please edit server configuration in server-config.js and");
    console.log("   rename the file to server.config.js");
    process.exit(1);
}

var path = require('path'),
    express = require('express'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    mysql = require('mysql2'),
    winston = require('winston'),
    expressWinston = require('express-winston'),
    compression = require('compression');


winston.exitOnError = false;

winston.add(winston.transports.File, {
    name: 'info-log',
    filename: './log/piworld-server.log',
    json: false,
    level: config.logLevel || 'verbose'
}  //Replace 'debug' by 'verbose'
);

app.enable('trust proxy');
//You can optionally use compression. Disabled here since compression is activated in ngnix
// app.use(compression());
app.use(bodyParser.urlencoded({ limit: '100mb', extended: false }));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.text({ limit: '100mb' }));
app.use(methodOverride());


app.all('/*', function(req, res, next) {
    // CORS headers
    res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    // Set custom headers for CORS
    res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
    if (req.method == 'OPTIONS') {
      res.status(200).end();
    } else {
      next();
    }
  });
   
  // Auth Middleware - This will check if the token is valid
  // Only the requests that start with /api/v1/* will be checked for the token.
  // Any URL's that do not follow the below pattern should be avoided unless you 
  // are sure that authentication is not needed
app.all('/api/v1/*', [require('./middlewares/mdw-validateRequest')]);

app.config = config;

app.parseCookies = function (request) {
    var list = {},
        rc = request.headers ? request.headers.cookie : request;

    rc && rc.split(';').forEach(function (cookie) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    var parser = function () {
        this.get = function (key) {
            var cookie = list[key];
            if (cookie) {
                return cookie.replace(/["']/g, '');
            }
            return null;
        };
    };

    return new parser();
};



//Resolve paths
global.__publicDir = path.resolve(__dirname, "../piWorld/public");
global.__serverDir = path.resolve(__dirname, "./");

if (app.config.platform !== 'linux') {
    var staticPath = path.resolve(__dirname, 'public');
    app.use(express.static(staticPath, { lastModified: true }));
}

// Load modules

require('./users/users')(app);
require('./books/books')(app);
require('./news/news')(app);
require('./centers/centers')(app);

server.listen(config.express.port, function () {
    winston.info(new Date() + ': piWorld server started, listening to port ' + config.express.port);
});