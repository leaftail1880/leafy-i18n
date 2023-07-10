import ts from "typescript";
import path from "path";
import fs from "fs";
import {toArray} from "./utils.js"
import util from "util"

const formatHost = {
  getCanonicalFileName: (/** @type {string} */ path) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
};

/**
 * @template {{error?: any, errors?: readonly any[]}} R
 * @param {R} result
 * @returns {R}
 */
function check(result) {
  if (result.error || result.errors?.length) {
    console.log(
      ts.formatDiagnosticsWithColorAndContext(
        result.error ? [result.error] : result.errors,
        formatHost
      )
    );
    process.exit(1);
  } else {
    return result;
  }
}

/**
 * @param {{
 * project: string,
 * codeLocale: string
 * }} a1
 */
export function find({ project, codeLocale = "en" }) {
  const configPath = ts.findConfigFile("./", ts.sys.fileExists, project);
  if (!configPath) {
    console.error(
      "No typescript config found at path '" +
        project +
        "'\n\nYou can change 'project' option in config or in command line"
    );
    process.exit(1);
  } else console.debug("Using typescript config from:", configPath);
  const { config } = check(ts.readConfigFile(configPath, ts.sys.readFile));
  const { options } = check(
    ts.convertCompilerOptionsFromJson(
      Object.assign(config.compilerOptions, {
        outDir: "dist",
        skipLibCheck: true,
      }),
      "./"
    )
  );
  const { fileNames } = check(
    ts.parseJsonConfigFileContent(config, ts.sys, path.dirname(configPath))
  );
  console.debug("Found", fileNames.length, "files");

  // Create the program using the project settings
  const program = ts.createProgram(fileNames, options);
  check({ errors: ts.getPreEmitDiagnostics(program) });

  
  /** @type {i18nDB} */
  const i18n = {}

  /**
   * @param {ts.Node} node
   */
  function visit(node) {
    if (
      ts.isTaggedTemplateExpression(node) &&
      "escapedText" in node.tag &&
      node.tag.escapedText === "i18n"
    ) {
      const t = node.template;
      /** @type {{literal: {rawText: string}}[]} */
      // @ts-ignore
      const spans = t.templateSpans ?? [];
      const quasis = [
        // @ts-ignore
        t.head?.rawText ?? t.rawText,
        ...spans.map((e) => e.literal.rawText),
      ];
      // console.debug(Object.assign(template, { parent: null }));
      const key = quasis.join("\x01")
      console.debug(key)
      
      i18n[key] ??= {};
      i18n[key][codeLocale] = toArray("", quasis)
    }

    ts.forEachChild(node, visit);
  }

  let files = 0;
  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile) {
      files++;
      visit(sourceFile);
    }
  }

  console.log(
    `[li18n] Parsed total ${files} files with ${
      Object.keys(i18n).length
    } locales.`
  );
  console.log(util.inspect(i18n, { depth: 30}));

  return i18n;
}
