const { ConfigHelper } = require("common-utils");

module.exports = {
  "dialect": "postgres",
  "host": ConfigHelper.read("database.postgres.host"),
  "username": ConfigHelper.read("database.postgres.username"),
  "password": ConfigHelper.read("database.postgres.password"),
  "database": ConfigHelper.read("database.postgres.database"),
  "logging": false
};
