"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * piworld-server for piworld web apps
 * Josep Mulet (pep.mulet@gmail.com)
 * https://github.com/jmulet/piworld-server
 */
let config;
try {
    config = require('./server.config');
}
catch (ex) {
    console.log(ex);
    console.log('========================================================');
    console.log('= piworld-server  by J. Mulet (pep.mulet@gmail.com)    =');
    console.log('========================================================');
    console.log(' CONFIGURATION REQUIRED!');
    console.log('   Please edit server configuration in server-config.ts and');
    console.log('   rename the file to server.config.ts');
    process.exit(1);
}
const server_1 = require("./server");
const path = require("path");
const express = require("express");
const winston = require("winston");
// Import all required router modules
const centers_router_1 = require("./centers/centers.router");
const news_router_1 = require("./news/news.router");
// Now initialize app based on HttpServer Class defined in server.ts
if (config.platform !== 'linux') {
    var staticPath = path.resolve(__dirname, 'public');
    server_1.app.use(express.static(staticPath, { lastModified: true }));
}
// Attach every modular routers to its desired mounting point
// Routes must start by /api/
// Routes like /api/v1/*        require athentication
// Routes like /api/v1/admin/*  require auth as admin user or admin teacher
// PUBLIC ROUTES
server_1.app.use('/api/news', news_router_1.newsPublicRouter);
// AUTHENTICATED ROUTES
// ADMINSTRATIVE ROUTES
server_1.app.use('/api/v1/admin/center', centers_router_1.centersRouter);
server_1.app.use('/api/v1/admin/news', news_router_1.newsAdminRouter);
/**
require('./users/users')(app);
require('./books/books')(app);
require('./news/news')(app);
require('./centers/centers')(app);
**/
server_1.appServer.server.listen(config.express.port, function () {
    winston.info(new Date() + ': piWorld server started, listening to port ' + config.express.port);
});
//# sourceMappingURL=index.js.map