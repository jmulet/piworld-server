/*
 * piworld-server for piworld web apps
 * Josep Mulet (pep.mulet@gmail.com)
 * https://github.com/jmulet/piworld-server
 */
let config: any;
try {
    config = require('./server.config');
} catch (ex) {
    console.log(ex);

    console.log('========================================================');
    console.log('= piworld-server  by J. Mulet (pep.mulet@gmail.com)    =');
    console.log('========================================================');
    console.log(' CONFIGURATION REQUIRED!');
    console.log('   Please edit server configuration in server-config.ts and');
    console.log('   rename the file to server.config.ts');
    process.exit(1);
}

import { app, appServer } from './server';
import * as path from 'path';
import * as express from 'express';
import * as winston from 'winston';

// Import all required router modules
import { usersPublicRouter, usersPrivateRouter } from './users/users.router';
import { centersRouter } from './centers/centers.router';
import { newsPublicRouter, newsAdminRouter } from './news/news.router';

// Now initialize app based on HttpServer Class defined in server.ts
if (config.platform !== 'linux') {
    var staticPath = path.resolve(__dirname, 'public');
    app.use(express.static(staticPath, { lastModified: true }));
}

// Attach every modular routers to its desired mounting point
// Routes must start by /api/
// Routes like /api/v1/*        require athentication
// Routes like /api/v1/admin/*  require auth as admin user or admin teacher


// PUBLIC ROUTES
app.use('/api/users', usersPublicRouter);
app.use('/api/news', newsPublicRouter);

// AUTHENTICATED ROUTES
app.use('/api/v1/users', usersPrivateRouter);

// ADMINSTRATIVE ROUTES

app.use('/api/v1/admin/center', centersRouter);
app.use('/api/v1/admin/news', newsAdminRouter);

/**
require('./users/users')(app);
require('./books/books')(app);
require('./news/news')(app);
require('./centers/centers')(app);
**/

appServer.server.listen(config.express.port, function () {
    winston.info(new Date() + ': piWorld server started, listening to port ' + config.express.port);
});