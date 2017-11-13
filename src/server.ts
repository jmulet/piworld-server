/*
 * piworld-server for piworld web apps
 * Josep Mulet (pep.mulet@gmail.com)
 * https://github.com/jmulet/piworld-server
 */
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as path from 'path';
import * as http from 'http';
import * as methodOverride from 'method-override';
import * as winston from 'winston';
import * as SocketIO from 'socket.io';
import { mdwValidateRequest } from './middlewares/mdw-validateRequest';

const config = require('./server.config');

export class HttpServer {
    public app: express.Application;
    public router: express.Router;
    public server: http.Server;
    public socketio: SocketIO.Server;

    public static bootstrap(): HttpServer {
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

    private expressConfiguration() {
        this.app.enable('trust proxy');
        this.app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
        this.app.use(bodyParser.json({ limit: '100mb' }));
        this.app.use(bodyParser.text({ limit: '100mb' }));
        this.app.use(methodOverride());

        //security settings
        this.app.use(function (req: express.Request, res: express.Response, next: express.NextFunction) {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE,OPTIONS');
            next();
        });

        this.app.all('/*', function (req: express.Request, res: express.Response, next: express.NextFunction) {
            // CORS headers
            res.header('Access-Control-Allow-Origin', '*'); // restrict it to the required domain
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
            // Set custom headers for CORS
            res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
            if (req.method === 'OPTIONS') {
                res.status(200).end();
            } else {
                next();
            }
        });

        // Auth Middleware - This will check if the token is valid
        // Only the requests that start with /api/v1/* will be checked for the token.
        // Furthermore, urls like /api/v1/admin/* will have and extra user based auth check.
        // Any URL's that do not follow the below pattern should be avoided unless you
        // are sure that authentication is not needed
        this.app.all('/api/v1/*', [mdwValidateRequest]);
    }

    private loggerConfiguration() {

        winston.add(winston.transports.File, {
            name: 'info-log',
            filename: './log/piworld-server.log',
            json: false,
            level: config.logLevel || 'debug',
            exitOnError: false
        }  //Replace 'debug' by 'verbose'
        );
    }
}

// serverInstance
export const appServer = HttpServer.bootstrap();

// shortcut to app instance
export const app = appServer.app;


// Cookie parser
export class CookieParser  {

    list: any = {};

    constructor(request: express.Request) {
        const rc = request.headers ? request.headers.cookie : request;

        if (rc) {
            rc.toString().split(';').forEach((cookie: string) => {
                const parts = cookie.split('=');
                this.list[parts.shift().trim()] = decodeURI(parts.join('='));
            });
        }
    }

    get(key: string) {
        var cookie = this.list[key];
        if (cookie) {
            return cookie.replace(/['']/g, '');
        }
        return null;
    }

}

export const global = {
    __publicDir: path.resolve(__dirname, '../piWorld/public'),
    __serverDir: path.resolve(__dirname, './')
};
