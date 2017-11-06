const Sequelize = require('sequelize');
var config = require('../server.config');

const sequelize = new Sequelize(config.mysql.database || 'imaths', config.mysql.user || 'root', config.mysql.password || '', {
  host: config.mysql.host || 'localhost',
  dialect: 'mysql',
  pool: {
    max: 49,
    min: 1,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;