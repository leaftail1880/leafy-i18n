import promise from "./i18n.js";

promise.then(() => {
  import("./anotherFile.js");

  console.log(i18n`index.js is nice? ${9}`);
  console.log(i18n`Without arg? Yeee`);
  console.log(
    i18n`Internationalization hidden in ${i18n`internationalization`}? Why not.`
  );
});
