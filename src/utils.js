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