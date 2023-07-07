import "./jaro-winkler.js"

/**
 * @param {string} chunk
 * @param {number} i
 */
const chunks = (chunk, i) => (i ? "${" + (i - 1) + "}" : "") + chunk;

/**
 * @param {i18nDB} db
 * @param {string} locale
 * @param {i18nDB} existent
 * @param {string[]} locales
 */
export function createTable(db, locale, existent, locales) {
  const table = [];
  const keys = Object.keys(db);
  for (const key in existent) {
    if (!keys.includes(key)) {
      console.log("Key deleted")
      const value = existent[key];
      /** @type {[string, number][]} */
      const similiarsMap = keys.map((e) => [e, key.distance(e)])
      const similiars = similiarsMap.sort((a, b) => b[1] - a[1]);

      if (similiars[0][1] < 0.15) {
        console.log("Found", similiars[0][1]+ "% similiar for:\n", key, "\n", similiars[0][1])
        existent[similiars[0][0]] = existent[key];
      }

      delete existent[key];
    }
  }

  for (const key of keys) {
    /** @type {string[]} */
    const out = [];
    const target = db[key];
    const source = {
      t: key.split("\x01"),
      v: target[locale].v,
    };
    const sentence = source.t.map(chunks).join("");
    locales.forEach((lang) => {
      let content;
      if (existent.hasOwnProperty(key) && existent[key].hasOwnProperty(lang)) {
        target[lang] = existent[key][lang];
        content = target[lang].t.map(chunks).join("");
      } else {
        target[lang] = { t: source.t, v: source.v };
        content = sentence;
      }
      out.push(
        `<tr><td valign="top">${lang}</td><td valign="top"><textarea>${content}</textarea></td></tr>`
      );
    });
    if (out.length) {
      table.push(
        `<tr class="native" data-key="${escape(
          key
        )}"><td valign="top">${locale}</td><td valign="top"><textarea disabled>${sentence}</textarea></td></tr>`
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
 * @param {i18nDB} db
 * @param {string} locale
 * @param {string} table
 * @param {string} index
 */
export function createUpdate(db, locale, table, index) {
  /** @type {Record<string, string>} */
  const info = { table, db: JSON.stringify({ locale, db }) };
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
String.prototype.distance=function(c){var a;a=this;var h,b,d,k,e,g,f,l,n,m,p;a.length>c.length&&(c=[c,a],a=c[0],c=c[1]);k=~~Math.max(0,c.length/2-1);e=[];g=[];b=n=0;for(p=a.length;n<p;b=++n)for(h=a[b],l=Math.max(0,b-k),f=Math.min(b+k+1,c.length),d=m=l;l<=f?m<f:m>f;d=l<=f?++m:--m)if(null==g[d]&&h===c[d]){e[b]=h;g[d]=c[d];break}e=e.join("");g=g.join("");if(d=e.length){b=f=k=0;for(l=e.length;f<l;b=++f)h=e[b],h!==g[b]&&k++;b=g=e=0;for(f=a.length;g<f;b=++g)if(h=a[b],h===c[b])e++;else break;a=(d/a.length+
d/c.length+(d-~~(k/2))/d)/3;a+=0.1*Math.min(e,4)*(1-a)}else a=0;return a};