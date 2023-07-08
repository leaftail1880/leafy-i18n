import { toArray, toText } from "./utils.js";

const f = [["This is ", 0, " test"], ["Some ", 0], ["No args"]];

const t = ["This is \x01 test", "Some \x01", "No args"];

for (const test of f) {
  console.log(test);
  console.log(toText(test));
  console.log(" ");
}

console.log(" ");

for (const [i, test] of t.entries()) {
  console.log(test);
  console.log(toArray(test));
  console.log(" ");
}
