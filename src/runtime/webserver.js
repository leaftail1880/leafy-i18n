import http from "http";
import fs from "fs/promises";
import path from "path";
import url from "url";
import open from "open";
import { createTable, createUpdate } from "./updates.js";

/**
 * @param {{
 * port: string,
 * locales: string[],
 * db: i18nDB,
 * codeLocale: string
 * }} a1
 */
export async function listen({ port = "1186", locales = [], db, codeLocale }) {
  const index = (
    await fs.readFile(
      path.join(url.fileURLToPath(new URL(".", import.meta.url)), "index.html")
    )
  ).toString();

  const file = "i18n/translation.json";
  /** @type {i18nDB} */
  let oldTranslation = {};
  try {
    oldTranslation = JSON.parse((await fs.readFile(file)).toString());
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  const table = createTable(db, codeLocale, oldTranslation, locales);

  const server = http
    .createServer((req, res) => {
      /**
       * @param {number} statusCode
       * @param {any} statusText
       * @param {any} [data]
       */
      const send = (statusCode, statusText, data) => {
        res.writeHead(statusCode, statusText);
        res.end(data);
      };

      switch (req.url) {
        case "/":
          send(
            200,
            { "Content-Type": "text/html" },
            createUpdate(db, codeLocale, table, index)
          );
          break;
        case "/exit":
          send(200, "OK");
          setTimeout(() => {
            server.close();
            console.log(
              `[li18n] Done.${
                Object.keys(oldTranslation).length
                  ? ""
                  : " Translations saved to i18n/translations.json"
              }`
            );
          }, 200);
          break;
        case "/update":
          if (req.method.toLowerCase() !== "post") {
            return send(400, "Bad method: " + req.method);
          }
          /** @type {string[]} */
          const body = [];
          req.on("data", (data) => body.push(data));
          req.on("end", async () => {
            try {
              JSON.parse(body.join(""));
            } catch (e) {
              return send(400, "Bad request", e);
            }

            try {
              await fs.writeFile(file, body.join(""));
            } catch (e) {
              console.error(e);
              return send(500, "Internal Server Error", e);
            }

            send(200, "OK");
          });
          break;

        default:
          send(404, "Not Found");
          break;
      }
    })
    .listen(Number(port), async () => {
      const url = `http://localhost:${port}/`;
      open(url);
      console.log("[li18n] Updating via " + url);
    });
}
