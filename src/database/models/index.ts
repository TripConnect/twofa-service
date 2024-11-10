'use strict';

const Sequelize = require('sequelize');
const configs = require("./../config/config.js");
const env = process.env.NODE_ENV || 'development';
const db: { [key: string]: any; } = {};

let activeConfig = configs[env];

let sequelize = new Sequelize(activeConfig.database, activeConfig.username, activeConfig.password, activeConfig);
db.sequelize = sequelize;

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.log('Unable to connect to the database:', error);
    }
})();

export default db;
