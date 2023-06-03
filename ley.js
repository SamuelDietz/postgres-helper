const { join, resolve } = require("path");
const { existsSync, mkdirSync, writeFileSync } = require("fs");
const { mkdir } = require("mk-dirs");
const util = require("./lib/util");
const log = require("./lib/log");

function getConfig() {
  const phconfig = require(join(
    process.cwd(),
    "postgres-helper",
    "phconfig.js"
  ));
  return phconfig;
}

async function parse(opts) {
  const phconfig = getConfig();

  []
    .concat(opts.require || [])
    .filter(Boolean)
    .forEach((name) => {
      const tmp = util.exists(name);
      if (tmp) return require(tmp);
      throw new Error(`Cannot find module '${name}'`);
    });

  let driver = "postgres";

  driver = require(join(__dirname, "lib", "clients", driver));

  const connectionConfig = phconfig.connection;

  const migrations = await util.glob(phconfig.migrationPath);
  const migrationDir = join(process.cwd(), phconfig.migrationPath);
  const outputPath = phconfig.outputPath;

  return { driver, connectionConfig, migrations, migrationDir, outputPath };
}

exports.init = async function (opts = {}) {
  if (!existsSync("postgres-helper")) {
    mkdirSync("postgres-helper");
  } else {
    log.info("Did not create postgres-helper directory as it already exists");
  }

  if (!existsSync("postgres-helper/migrations")) {
    mkdirSync("postgres-helper/migrations");
  } else {
    log.info("Did not create migrations directory as it already exists");
  }

  if (!existsSync("postgres-helper/phconfig.js")) {
    const config = {
      connection: {
        host: "localhost",
        port: 5432,
        database: "database",
        username: "username",
        password: "password",
      },
      migrationPath: "./postgres-helper/migrations",
    };
    // only create types directory if typescript is enabled
    if (opts.typescript) {
      config.outputPath = "./postgres-helper/types";
    }

    writeFileSync(
      "postgres-helper/phconfig.js",
      `module.exports = ${JSON.stringify(config, null, 2).replace(
        /\"([^(\")"]+)\":/g,
        "$1:"
      )};`
    );
  } else {
    log.info("Did not create phconfig.js file as it already exists");
  }
  return [
    "Initialization complete:",
    "Please edit phconfig.js in the postgres-helper dir to match your database setup!",
  ];
};

exports.up = async function (opts = {}) {
  let client,
    { driver, connectionConfig, migrations, outputPath } = await parse(opts);

  try {
    // Open new conn; setup table
    client = await driver.connect(connectionConfig);
    const exists = await driver.setup(client);

    const fresh = util.diff(exists, migrations);
    if (!fresh.length) return []; // nothing to run

    const toRun = opts.single ? [fresh[0]] : fresh;
    await driver.loop(client, toRun, "up");
    return toRun.map((x) => x.name);
  } finally {
    if (client) {
      await driver.end(client);
      if (outputPath) {
        try {
          const { processDatabase } = require("kanel");
          const kanelConfig = require("./.kanelrc.js");
          await processDatabase(kanelConfig);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }
};

exports.down = async function (opts = {}) {
  let client,
    { driver, connectionConfig, migrations, outputPath } = await parse(opts);

  try {
    // Open new conn; setup table
    client = await driver.connect(connectionConfig);
    const exists = await driver.setup(client);
    if (!exists.length) return []; // nothing to undo

    exists.reverse();
    migrations.reverse();

    const last = exists[0];
    const idx = migrations.findIndex((x) => x.name === last.name);
    if (idx === -1) throw new Error(`Unknown "${last.name}" migration`);

    const toRun = util.pluck(opts.all ? exists : [last], migrations.slice(idx));
    await driver.loop(client, toRun, "down");
    return toRun.map((x) => x.name);
  } finally {
    if (client) {
      await driver.end(client);
      if (outputPath) {
        try {
          const { processDatabase } = require("kanel");
          const kanelConfig = require("./.kanelrc.js");
          await processDatabase(kanelConfig);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }
};

exports.status = async function (opts = {}) {
  let client,
    { driver, connectionConfig, migrations } = await parse(opts);

  try {
    client = await driver.connect(connectionConfig);
    const exists = await driver.setup(client);
    return util.diff(exists, migrations).map((x) => x.name);
  } finally {
    if (client) await driver.end(client);
  }
};

exports.new = async function (opts = {}) {
  let { migrations, migrationDir } = await parse(opts);

  let prefix = "";
  if (opts.timestamp) {
    prefix += (Date.now() / 1e3) | 0;
  } else {
    let tmp = migrations.pop();
    if (tmp && /^\d+/.test(tmp.name)) {
      tmp = parseInt(tmp.name.match(/^\d+/)[0], 10);
      prefix = String(tmp + 1).padStart(opts.length, "0");
    } else {
      prefix = "0".repeat(opts.length);
    }
  }

  let filename = prefix + "-" + opts.filename.replace(/\s+/g, "-");
  if (!/\.\w+$/.test(filename)) filename += opts.esm ? ".mjs" : ".js";
  let dir = resolve(migrationDir, opts.cwd || ".");
  let file = join(dir, filename);

  let str = "";
  await mkdir(dir);

  if (opts.esm) {
    str += "export async function up(sql) {\n\n}\n\n";
    str += "export async function down(sql) {\n\n}\n";
  } else {
    str += "exports.up = async sql => {\n\n};\n\n";
    str += "exports.down = async sql => {\n\n};\n";
  }
  writeFileSync(file, str);

  return filename;
};

exports.typegen = async function (opts = {}) {
  let { outputPath } = await parse(opts);

  if (outputPath) {
    try {
      const { processDatabase } = require("kanel");
      const kanelConfig = require("./.kanelrc.js");
      await processDatabase(kanelConfig);
      return [
        "Type generation complete",
      ];
    } catch (e) {
      console.error(e);
    }
  } else {
    throw new Error("If you want to generate types, please specify an outputPath in phconfig.js");
  }
};
