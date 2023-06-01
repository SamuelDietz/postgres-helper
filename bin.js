#!/usr/bin/env node
const sade = require("sade");
const pkg = require("./package.json");
const log = require("./lib/log");
const ley = require("./ley");

function wrap(act) {
  const done = log.done.bind(log, act);
  return async (opts, tmp) => {
    await ley[act](opts).then(done).catch(log.bail);
  };
}

sade("postgres-helper")
  .version(pkg.version)
  .option("-C, --cwd", "The current directory to resolve from", ".")
  .option("-r, --require", "Additional module(s) to preload")

  .command("init")
  .describe("Initialize the postgres-helper directory with all necessary files")
  .option("-t, --typescript", "Automatically create types after migrations")
  .action(wrap("init"))

  .command("up")
  .describe('Run "up" migration(s). Applies all outstanding items.')
  .option("-s, --single", "Only run a single migraton")
  .action(wrap("up"))

  .command("down")
  .describe('Run "down" migration(s). Defaults to one at a time.')
  .option("-a, --all", 'Run all "down" migrations')
  .action(wrap("down"))

  .command("status")
  .describe("Check for migration status. Counts unapplied migrations.")
  .action(wrap("status"))

  .command("new <filename>")
  .describe("Create a new migration file.")
  .option("-t, --timestamp", "Prefix the filename with a timestamp")
  .option("-l, --length", "The length of prefix, if not timestamp", 5)
  .action((filename, opts) => {
    opts.filename = filename;
    return wrap("new")(opts);
  })

  .parse(process.argv);
