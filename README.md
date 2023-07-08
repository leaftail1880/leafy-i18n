# leafy-i18n

Parses project, finds i18n calls and opens browser to translate them

```js
/**
 * @param {string[]} t
 * @param {...string[]} args
 */
function i18n(key, ...args) {
  return db[key.join("\x01")][locale].map(e => 
    typeof e === "number" ? args[e] : e
  ).join("")
}
```