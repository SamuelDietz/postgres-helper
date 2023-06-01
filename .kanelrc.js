const { getOptions } = require("./lib/index");

const options = getOptions();
options.connection = {
  host: options.connection.host,
  user: options.connection.username,
  password: options.connection.password,
  database: options.connection.database,
  charset: "utf8",
  port: options.connection.port,
};
options.preDeleteOutputFolder = true;
options.typeFilter = (t) => !["migrations"].includes(t.name);

module.exports = options;
