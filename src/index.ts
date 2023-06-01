import postgres from "postgres";
import fs from "fs";
import path from "path";

export function getOptions() {
  const CONFIG_FILE = "phconfig.js";

  let currentDir = process.cwd();
  let configPath = path.resolve(currentDir, "postgres-helper", CONFIG_FILE);

  if (fs.existsSync(configPath)) {
    const config = require(configPath);
    // connection
    const connection = config.connection;
    if (!connection) {
      throw new Error(`connection missing in ${CONFIG_FILE}`);
    }
    const requiredKeys = ["host", "port", "database", "username", "password"];
    const missingKeys = requiredKeys.filter((key) => !connection[key]);
    if (missingKeys.length > 0) {
      throw new Error(
        `${missingKeys.join(", ")} missing in connection in ${CONFIG_FILE}`
      );
    }
    return config;
  } else {
    throw new Error(`${CONFIG_FILE} not found`);
  }
}

let options = getOptions();

const sql = postgres(options.connection);

export default sql;
