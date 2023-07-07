import ts from "typescript";
import path from "path";
import fs from "fs";

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
export function find({ project, codeLocale }) {
  console.debug("Loading ts...");
  const configPath = ts.findConfigFile("./", ts.sys.fileExists, project);
  if (!configPath) {
    console.error("No ts config found at path", project);
    process.exit(1);
  } else console.debug("Using ts config from:", configPath);
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
  console.debug("Parsed ts config successfully.");
  const { fileNames } = check(
    ts.parseJsonConfigFileContent(config, ts.sys, path.dirname(configPath))
  );
  console.debug("Found", fileNames.length, "files");

  // Create the program using the project settings
  const program = ts.createProgram(fileNames, options);
  check({ errors: ts.getPreEmitDiagnostics(program) });

  let files = 0;
  /** @type {i18nDB} */
  const i18n = {};
  const locale = codeLocale ?? "en";

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
      // @ts-ignore
      const spans = t.templateSpans ?? [];
      const quasis = [t.head ?? t, ...spans.map((e) => e.literal)].map(
        (e) => e?.rawText
      );
      // console.debug(Object.assign(template, { parent: null }));

      // @ts-ignore
      (i18n[quasis.join("\x01")] = {})[locale] = {
        t: null,
        v: spans.map((e, i) => i),
      };

      // visitQuasi(item.quasi); // maybe
    }

    ts.forEachChild(node, visit);
  }

  // Process each source file
  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile) {
      files++;
      visit(sourceFile);
    }
  }

  console.log(
    `[i18n] Parsed total ${files} files with ${
      Object.keys(i18n).length
    } locales.`
  );
  console.log(i18n);

  return i18n;
}
