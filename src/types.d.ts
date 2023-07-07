declare type i18nTable = Record<string, { t: any | null; v: number[] }>;
declare type i18nDB = Record<string, i18nTable>;

interface String {
  distance(to: string): number
}
interface Console {
  debug(...data: any): void
}