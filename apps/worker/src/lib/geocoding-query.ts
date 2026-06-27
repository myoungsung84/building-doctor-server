export function normalizeGeocodingQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ');
}
