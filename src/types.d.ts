declare type i18nTable = Record<string, Array<number | string>>;
declare type i18nDB = Record<string, i18nTable>;

interface String {
  distance(to: string): number
}
interface Console {
  debug(...data: any): void
}