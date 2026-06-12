export interface ScrapeStats {
  rowsFound: number;
  codesUpserted: number;
  activeCodes: number;
  expiredCodes: number;
  newCodes: string[];
}
