'use strict';

const Sequelize = require('sequelize');

const configs = require("database/config/config");
import logger from "utils/logging";

const db: Record<string, any> = {};
db.sequelize = new Sequelize(configs.database, configs.username, configs.password, configs);

(async () => {
    try {
        await db.sequelize.authenticate();
        logger.info('Connection has been established successfully.');
    } catch (error) {
        logger.error('Unable to connect to the database:', error);
    }
})();

export default db;
