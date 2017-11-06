/* 
 * piworld-server for piworld web apps
 * Josep Mulet (pep.mulet@gmail.com)
 * https://github.com/jmulet/piworld-server
 */
var config;
try {
    config = require('./server.config');
} catch(Ex) {
    console.log("========================================================");
    console.log("= piworld-server  by J. Mulet (pep.mulet@gmail.com)    =");
    console.log("========================================================");
    console.log(" CONFIGURATION REQUIRED!");
    console.log("   Please edit server configuration in server-config.js and");
    console.log("   rename the file to server.config.js");
    process.exit(1);
}

var path = require('path'),
    domain = require('domain'),
    express = require('express'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    d = domain.create(),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    mysql = require('mysql2'),
    winston = require('winston'),
    expressWinston = require('express-winston'),
    compression = require('compression');


d.on('error', function(err) {
    console.error(err);
});

winston.exitOnError = false;

winston.add(winston.transports.File, { 
    name: 'info-log',
    filename: './log/piworld-server.log', 
    json: false,
    level: config.logLevel || 'verbose'}  //Replace 'debug' by 'verbose'
);
    
app.enable('trust proxy');
//You can optionally use compression. Disabled here since compression is activated in ngnix
// app.use(compression());
app.use(bodyParser.urlencoded({limit: '100mb', extended: false}));
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.text({limit: '100mb'}));
app.use(methodOverride());

app.config = config;
app.APIS = {};

 
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



d.run(function() {
    
    if (app.config.platform !== 'linux') {
        var staticPath = path.resolve(__dirname, 'public');
        app.use(express.static(staticPath, { lastModified: true }));
    }
 
    server.listen(config.express.port, function () {
        winston.info(new Date() + ': piWorld server started, listening to port ' + config.express.port);

        const p = require('./mysql/pool');
     
        const models = require('./mysql/models');

        models.Users.all().then((d)=> {
            console.log(d);
        });
        /**
        const foo = async function(id){
            
            try {
                const data = await db.queryIfNotEmpty("SELECT * FROM users WHERE id=?", "SELECT * FROM logins WHERE idUser=?", [id], [id]); 
                console.log(data);
            } catch(Ex){
                console.log(Ex);
            }
            
        };
 
        const Users = require('./mysql/models').Users;

        Users.find( {id: 522}, {limit: 1}).then(d => {
            const user = d.results[0];
            user.username = "foobar22";
            user.created = new Date();
            user.id = null;
            console.log(user)
            Users.save(user).then( r => console.log(r) );
        });

        **/

    });


});