#!/usr/bin/env node
// @ts-check

import program from "commander";
import fs from "fs/promises";

program
  .usage("li18n [options]")
  .description(
    "Parses project, finds i18n calls and opens browser to translate them. All options can be setted in the i18n/config.json. Command line options take precedence over the config."
  )
  .option("--project <path>", "Path to tsconfig.", "tsconfig.json")
  .option("--codeLocale <string>", "Locale used in the code.")
  .option(
    "--locales <string,string...>",
    'Locales used to translate. Separate by ","'
  )
  .option(
    "--port <number>",
    "Localhost port for updates (1186 by default).",
    1186
  )
  .option("--debug", "Enable progres information.")
  .option("--noBrowser", "Stop process after finding i18n calls. Usefull for debugging.")
  .action(async function bin(program) {
    let config;
    try {
      config = (await fs.readFile("i18n/config.json")).toString();
    } catch (e) {
      if (e.code === "ENOENT") {
        console.error("No config found at 'i18n/config.json'");
        process.exit(1);
      } else throw e;
    }

    try {
      config = JSON.parse(config);
    } catch (e) {
      console.error(
        "Unable to parse 'i18n/config.json'\n\n",
        e + "\n\nFull config:\n\n" + config
      );
      process.exit(1);
    }

    const options = Object.assign(program.opts(), config);
    console.debug = !options.debug
      ? () => void 0
      : (...data) => console.log(data);

    console.debug("Config parsed successfully!");
    const i18n = (await import("./src/find.js")).find({
      project: options.project,
      codeLocale: options.codeLocale,
    });
    if (options.noBrowser) return;
    (await import("./src/webserver.js")).listen({
      port: options.port,
      locales: options.locales,
      db: i18n,
      codeLocale: options.codeLocale,
    });
  })
  .parse(process.argv);
