/**
 * ["This is ", 0, " example of ", 1] ->
 * "This is ${0} example of ${1}"
 * @param {Array<string | number>} array
 */
export function toText(array) {
  return array.reduce((temp, curr, i, prev) => {
    if (i == 0) return curr;
    const str = i % 2 === 0;
    const last = i === array.length-1
    return (
      temp + (str ? "}" : "${") + curr + (last && !str ? "}" : "")
    );
  });
}

/**
 * @param {string} text
 */
export function toArray(text, splitted = text.split("\x01")) {
  if (splitted.length === 1) return splitted;
  const result = splitted.reduce(
    // Make it look like ["This ", 0, " template"]
    (arr, curr, i) => {
      arr.push(curr);
      if (i !== splitted.length - 1) arr.push(i);
      return arr;
    },
    []
  );

  if (result[result.length - 1] === "") result.pop();

  return result;
}

/**
 * @param {i18nDB} i18nDB
 * @param {string} codeLocale
 * @param {i18nDB} old
 * @param {string[]} locales
 */
export function createTable(i18nDB, codeLocale, old, locales) {
  const table = [];
  const dbkeys = Object.keys(i18nDB);
  const needUpdate = [];
  for (const key in old) {
    if (!dbkeys.includes(key)) {
      /** @type {[string, number][]} */
      const similiarsMap = dbkeys.map((e) => [e, key.distance(e)]);
      const [similiar, percent] = similiarsMap.sort((a, b) => b[1] - a[1])[0];

      if (percent > 0.9) {
        console.log(
          "Found",
          percent.toFixed(2) + "% similiar for key:\n",
          toText(toArray(key))
        );
        old[similiar] = old[key];
        needUpdate.push(similiar);
      } else console.log("Key deleted.");
      delete old[key];
    }
  }

  for (const key of dbkeys) {
    /** @type {string[]} */
    const out = [];
    const sentence = toText(i18nDB[key][codeLocale]);
    for (const lang of locales) {
      let content;
      let oldKey = old[key]?.[lang];
      let keyNeedUpdate = needUpdate.includes(key);
      if (oldKey) {
        content = toText(oldKey);
      } else {
        content = sentence;
        keyNeedUpdate = true;
      }
      out.push(
        `<tr><td valign="top">${lang}${
          keyNeedUpdate ? `<span color="red" class="warning"> (!)</span>` : ""
        }</td><td valign="top"><textarea${
          keyNeedUpdate ? ` oninput="removeWarning(this)"` : ""
        }>${content}</textarea></td></tr>`
      );
    }
    if (out.length) {
      table.push(
        `<tr class="native" data-key="${escape(key)}"><td valign="top">${
          table.length ? "<br>" : ""
        }${codeLocale}</td><td valign="top"><textarea disabled>${sentence}</textarea></td></tr>`
      );
      table.push(...out);
    }
  }
  const indentation = "\n        ";
  return table.length
    ? `<table cellpadding="0" cellspacing="0">${indentation}${table.join(
        indentation
      )}\n</table>`
    : "";
}

/**
 * @param {i18nDB} i18nDB
 * @param {string} codeLocale
 * @param {string} table
 * @param {string} index
 */
export function createUpdate(i18nDB, codeLocale, table, index) {
  /** @type {Record<string, string>} */
  const info = {
    table,
    db: JSON.stringify({ locale: codeLocale, db: i18nDB }),
  };
  return index.replace(
    /<\!--\$\{(.+?)\}-->|\/\*\$\{(.+?)\}\*\//g,
    (
      /** @type {string} */ $0,
      /** @type {string} */ $1,
      /** @type {string} */ $2
    ) => info[$1 || $2]
  );
}

// https://github.com/zdyn/jaro-winkler-js/blob/master/jaro-winkler-js.min.js
// Comparing two strings
// @ts-ignore
String.prototype.distance = function (c) {
  var a;
  a = this;
  var h, b, d, k, e, g, f, l, n, m, p;
  a.length > c.length && ((c = [c, a]), (a = c[0]), (c = c[1]));
  k = ~~Math.max(0, c.length / 2 - 1);
  e = [];
  g = [];
  b = n = 0;
  for (p = a.length; n < p; b = ++n)
    for (
      h = a[b],
        l = Math.max(0, b - k),
        f = Math.min(b + k + 1, c.length),
        d = m = l;
      l <= f ? m < f : m > f;
      d = l <= f ? ++m : --m
    )
      if (null == g[d] && h === c[d]) {
        e[b] = h;
        g[d] = c[d];
        break;
      }
  e = e.join("");
  g = g.join("");
  if ((d = e.length)) {
    b = f = k = 0;
    for (l = e.length; f < l; b = ++f) (h = e[b]), h !== g[b] && k++;
    b = g = e = 0;
    for (f = a.length; g < f; b = ++g)
      if (((h = a[b]), h === c[b])) e++;
      else break;
    a = (d / a.length + d / c.length + (d - ~~(k / 2)) / d) / 3;
    a += 0.1 * Math.min(e, 4) * (1 - a);
  } else a = 0;
  return a;
};
