
var mysql2 = require('mysql2');
var config = require('../server.config');

var pool = mysql2.createPool({
    host: config.mysql.host || 'localhost',
    port: config.mysql.port || 3306,
    user: config.mysql.user || 'root',
    database: config.mysql.database || 'imaths',
    password: config.mysql.password || '',
    multipleStatements: true,
    connectionLimit: 49,
    bigNumberStrings: true
});

module.exports = pool;