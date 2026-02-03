import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

const GEOCODE_URL = 'https://geocode.maps.co/search';

/** Search result returned as JSON string: { lat, lon, display_name } */
export interface PlaceSearchResult {
  lat: number;
  lon: number;
  display_name: string;
}

/** Place search tool: calls geocode.maps.co and returns first result as JSON. Avoids TS2589 by extending StructuredTool<any,any,any,string>. */
class SearchPlaceTool extends StructuredTool<any, any, any, string> {
  name = 'search_place';
  description = `Search for a place by name or address. Use when the user asks to find a place, go to a location, "take me to X", "where is X", or "search for X on the map". Pass the search query (e.g. "Oso landslide", "Kuala Lumpur", "Times Square"). Returns a JSON string with lat, lon, and display_name for the first result, or an error message if none found.`;
  schema = z.object({
    query: z.string().describe('Place name or address to search for'),
  }) as z.ZodTypeAny;

  constructor(private readonly apiKey: string) {
    super();
  }

  protected async _call(arg: { query: string }): Promise<string> {
    const { query } = arg;
    if (!query?.trim()) {
      return JSON.stringify({ error: 'Query is required' });
    }
    if (!this.apiKey?.trim()) {
      return JSON.stringify({
        error: 'GEOCODE_API_KEY not set on server',
      });
    }
    const params = new URLSearchParams({
      q: query.trim(),
      api_key: this.apiKey.trim(),
    });
    const url = `${GEOCODE_URL}?${params.toString()}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        return JSON.stringify({
          error: `Geocode API error: ${res.status} ${res.statusText}`,
        });
      }
      const data = (await res.json()) as unknown;
      const results = Array.isArray(data) ? data : [];
      const first = results[0] as { lat?: string; lon?: string; display_name?: string } | undefined;
      if (!first || first.lat == null || first.lon == null) {
        return JSON.stringify({
          error: `No results for "${query.trim()}"`,
        });
      }
      const result: PlaceSearchResult = {
        lat: Number(first.lat),
        lon: Number(first.lon),
        display_name: typeof first.display_name === 'string' ? first.display_name : String(first.lat + ',' + first.lon),
      };
      return JSON.stringify(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return JSON.stringify({ error: msg });
    }
  }
}

export function createSearchPlaceTool(apiKey: string): SearchPlaceTool {
  return new SearchPlaceTool(apiKey);
}
