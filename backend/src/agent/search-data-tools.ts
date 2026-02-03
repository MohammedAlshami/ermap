import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/** Search data-mapping (datasets, rasters) by query. Calls frontend /api/search-data. */
class SearchDataTool extends StructuredTool<any, any, any, string> {
  name = 'search_data';
  description = `Search the data catalog (datasets, rasters, TIFFs) by keyword. Use when the user asks "do you have X?", "any tiff for X?", "search for X", "find data about X", "do you have oso landslide tiff?", "any images for X?". Pass the search query (e.g. "oso landslide tiff", "tiff", "geojson malaysia"). Returns a JSON string with results array: each has id, name, format, r2Key, metadata (description, type).`;
  schema = z.object({
    query: z.string().describe('Search query (e.g. "oso landslide tiff", "tiff", "geojson")'),
  }) as z.ZodTypeAny;

  constructor(private readonly baseUrl: string) {
    super();
  }

  protected async _call(arg: { query: string }): Promise<string> {
    const { query } = arg;
    if (!query?.trim()) {
      return JSON.stringify({ results: [], error: 'Query is required' });
    }
    const base = (this.baseUrl || '').replace(/\/+$/, '');
    const url = `${base}/api/search-data?q=${encodeURIComponent(query.trim())}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        return JSON.stringify({ results: [], error: `Search failed: ${res.status}` });
      }
      const data = (await res.json()) as { results?: unknown[] };
      const results = Array.isArray(data?.results) ? data.results : [];
      return JSON.stringify({ results });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return JSON.stringify({ results: [], error: msg });
    }
  }
}

export function createSearchDataTool(baseUrl: string): SearchDataTool {
  return new SearchDataTool(baseUrl);
}
