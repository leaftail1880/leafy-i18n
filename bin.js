#!/usr/bin/env node
// @ts-check

import { program } from "commander";
import fs from "fs/promises";

program
  .usage("[options]")
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
    "Localhost port for updates.",
    "1186"
  )
  .option("--debug", "Enable progres information.")
  .option("--noBrowser", "Stop process after finding i18n calls. Usefull for debugging.")
  .action(async function li18n(opts, program) {
    let config;
    try {
      config = await fs.readFile("i18n/config.json", "utf-8")
    } catch (e) {
      if (e.code === "ENOENT") {
        program.error("No config found at 'i18n/config.json'");
      } else throw e;
    }

    try {
      config = JSON.parse(config);
    } catch (e) {
      program.error(
        "Unable to parse 'i18n/config.json'\n\n",
        e + "\n\nFull config:\n" + config
      );
    }

    const options = Object.assign(opts, config);
    console.debug = !options.debug
      ? () => void 0
      : (...data) => console.log(data);
      
    if (isNaN(Number(options.port))) program.error("Port '" + options.port + "' isn't a number.")

    console.debug("Config parsed successfully!");
    console.log("[li18n] Loading...");
    const i18n = (await import("./src/runtime/find.js")).find({
      project: options.project,
      codeLocale: options.codeLocale,
    });
    if (options.noBrowser) return;
    (await import("./src/runtime/webserver.js")).listen({
      port: options.port,
      locales: options.locales,
      db: i18n,
      codeLocale: options.codeLocale,
    });
  })
  .parse(process.argv);
