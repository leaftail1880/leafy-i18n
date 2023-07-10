export type i18nTable = Record<string, Array<number | string>>;
export type i18nDB = Record<string, i18nTable>;
/**
 * ["This is ", 0, " example of ", 1] ->
 * "This is ${0} example of ${1}"
 * @param {Array<string | number>} array
 */
export function toText(array: Array<string | number>): string | number;
/**
 * @param {string} text
 */
export function toArray(text: string, splitted?: string[]): any[];
