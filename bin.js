#!/usr/bin/env node
// @ts-check

import program from "commander";
import fs from "fs/promises";

program
  .description(
    "Parses project, finds i18n calls and opens browser to translate them."
  )
  .option("-p, --project <path>", "Path to tsconfig.", "tsconfig.json")
  .option(
    "--port <number>",
    "Localhost port for updates (1186 by default).",
    1186
  )
  .option("-s, --silent", "Disable all progress information.")
  .action(async function bin(program) {
    const options = program.opts();
    console.debug = options.silent
      ? () => void 0
      : (...data) => console.log(data);

    let config;
    try {
      config = (await fs.readFile("i18n/config.json")).toString();
    } catch (e) {
      if (e.code === "ENOENT") {
        console.error(
          "No config at 'i18n/config.json' found. Use\n\nnpx leafy-i18n-init\n\nto create one."
        );
        process.exit(1);
      } else throw e;
    }

    try {
      config = JSON.parse(config);
    } catch (e) {
      console.error(
        "Unable to parse i18n/config.json\n\n",
        e + "\n\nFull config:\n\n" + config
      );

      process.exit(1);
    }

    console.debug("Config parsed successfully!");
    const i18n = (await import("./src/find.js")).find({
      project: options.project,
      codeLocale: config.codeLocale
    });
    return
    (await import("./src/webserver.js")).listen({
      port: options.port,
      locales: config.locales,
      db: i18n,
      codeLocale: config.codeLocale,
    });
  })
  .parse(process.argv);
