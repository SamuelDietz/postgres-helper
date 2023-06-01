"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOptions = void 0;
const postgres_1 = __importDefault(require("postgres"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function getOptions() {
    const CONFIG_FILE = "phconfig.js";
    let currentDir = process.cwd();
    let configPath = path_1.default.resolve(currentDir, "postgres-helper", CONFIG_FILE);
    if (fs_1.default.existsSync(configPath)) {
        const config = require(configPath);
        // connection
        const connection = config.connection;
        if (!connection) {
            throw new Error(`connection missing in ${CONFIG_FILE}`);
        }
        const requiredKeys = ["host", "port", "database", "username", "password"];
        const missingKeys = requiredKeys.filter((key) => !connection[key]);
        if (missingKeys.length > 0) {
            throw new Error(`${missingKeys.join(", ")} missing in connection in ${CONFIG_FILE}`);
        }
        return config;
    }
    else {
        throw new Error(`${CONFIG_FILE} not found`);
    }
}
exports.getOptions = getOptions;
let options = getOptions();
const sql = (0, postgres_1.default)(options.connection);
exports.default = sql;
