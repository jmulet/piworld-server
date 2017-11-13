"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * piworld-server for piworld web apps
 * Josep Mulet (pep.mulet@gmail.com)
 * https://github.com/jmulet/piworld-server
 */
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const methodOverride = require("method-override");
const winston = require("winston");
const SocketIO = require("socket.io");
const mdw_validateRequest_1 = require("./middlewares/mdw-validateRequest");
const config = require('./server.config');
class HttpServer {
    static bootstrap() {
        return new HttpServer();
    }
    constructor() {
        this.app = express();
        this.server = new http.Server(this.app),
            this.socketio = SocketIO(this.server),
            //configure express middleware
            this.expressConfiguration();
        // configure logger
        this.loggerConfiguration();
    }
    expressConfiguration() {
        this.app.enable('trust proxy');
        this.app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
        this.app.use(bodyParser.json({ limit: '100mb' }));
        this.app.use(bodyParser.text({ limit: '100mb' }));
        this.app.use(methodOverride());
        //security settings
        this.app.use(function (req, res, next) {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE,OPTIONS');
            next();
        });
        this.app.all('/*', function (req, res, next) {
            // CORS headers
            res.header('Access-Control-Allow-Origin', '*'); // restrict it to the required domain
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
            // Set custom headers for CORS
            res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
            if (req.method === 'OPTIONS') {
                res.status(200).end();
            }
            else {
                next();
            }
        });
        // Auth Middleware - This will check if the token is valid
        // Only the requests that start with /api/v1/* will be checked for the token.
        // Furthermore, urls like /api/v1/admin/* will have and extra user based auth check.
        // Any URL's that do not follow the below pattern should be avoided unless you
        // are sure that authentication is not needed
        this.app.all('/api/v1/*', [mdw_validateRequest_1.mdwValidateRequest]);
    }
    loggerConfiguration() {
        winston.add(winston.transports.File, {
            name: 'info-log',
            filename: './log/piworld-server.log',
            json: false,
            level: config.logLevel || 'debug',
            exitOnError: false
        } //Replace 'debug' by 'verbose'
        );
    }
}
exports.HttpServer = HttpServer;
// serverInstance
exports.appServer = HttpServer.bootstrap();
// shortcut to app instance
exports.app = exports.appServer.app;
// Cookie parser
class CookieParser {
    constructor(request) {
        this.list = {};
        const rc = request.headers ? request.headers.cookie : request;
        if (rc) {
            rc.toString().split(';').forEach((cookie) => {
                const parts = cookie.split('=');
                this.list[parts.shift().trim()] = decodeURI(parts.join('='));
            });
        }
    }
    get(key) {
        var cookie = this.list[key];
        if (cookie) {
            return cookie.replace(/['']/g, '');
        }
        return null;
    }
}
exports.CookieParser = CookieParser;
exports.global = {
    __publicDir: path.resolve(__dirname, '../piWorld/public'),
    __serverDir: path.resolve(__dirname, './')
};
//# sourceMappingURL=server.js.map