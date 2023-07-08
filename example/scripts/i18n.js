import fs from "fs/promises";
/** @type {Record<string, Record<string, (string | number)[]>>} */
let db
/**
 * @param {TemplateStringsArray} key
 * @param {...any} args
 */
globalThis.i18n = function i18n(key, ...args) {
  return db[key.join("\x01")][locale]
    .map((e) => (typeof e === "number" ? args[e] : e))
    .join("");
};

const locale = process.argv[2];


export default (async function () {
  db = JSON.parse(
    (await fs.readFile("i18n/translation.json")).toString()
  );
})();
