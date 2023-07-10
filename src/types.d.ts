declare type i18nTable = import("./export").i18nTable;
declare type i18nDB = import("/export").i18nDB;

interface String {
  distance(to: string): number;
}
interface Console {
  debug(...data: any): void;
}
