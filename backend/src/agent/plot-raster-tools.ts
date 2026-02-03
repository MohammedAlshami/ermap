import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

type RasterEntry =
  | { id: string; name: string; r2Key: string; bounds?: number[][]; tileLayer?: never }
  | { id: string; name: string; tileLayer: string; minzoom?: number; maxzoom?: number; bounds?: number[][]; r2Key?: never };

/** Resolve raster entry from data-mapping by id, r2Key, or tileLayer. */
function findRasterInMapping(obj: unknown, idOrKey: string): RasterEntry | null {
  if (!obj || typeof obj !== 'object') return null;
  const idLower = idOrKey.toLowerCase().trim();
  const walk = (o: unknown): RasterEntry | null => {
    if (!o || typeof o !== 'object') return null;
    const v = o as Record<string, unknown>;
    const match =
      (v.id === idOrKey || v.name === idOrKey || v.r2Key === idOrKey || String(v.id).toLowerCase() === idLower) ||
      (v.tileLayer && String(v.tileLayer).toLowerCase() === idLower);
    if (!match) {
      for (const key of Object.keys(v)) {
        if (key === 'description' || key === 'metadata') continue;
        const found = walk(v[key]);
        if (found) return found;
      }
      return null;
    }
    const bounds = Array.isArray(v.bounds) && v.bounds.length >= 2 ? (v.bounds as number[][]) : undefined;
    if (v.tileLayer && typeof v.tileLayer === 'string') {
      return {
        id: typeof v.id === 'string' ? v.id : String(v.name || v.tileLayer),
        name: typeof v.name === 'string' ? v.name : String(v.tileLayer),
        tileLayer: v.tileLayer,
        minzoom: typeof v.minzoom === 'number' ? v.minzoom : 0,
        maxzoom: typeof v.maxzoom === 'number' ? v.maxzoom : 18,
        bounds,
      };
    }
    if (v.r2Key && typeof v.r2Key === 'string') {
      return {
        id: typeof v.id === 'string' ? v.id : String(v.name || v.r2Key),
        name: typeof v.name === 'string' ? v.name : String(v.r2Key),
        r2Key: v.r2Key,
        bounds,
      };
    }
    return null;
  };
  return walk(obj);
}

/** Plot a raster (e.g. TIFF) on the map. Resolves raster by id from data-mapping and returns url + bounds for frontend. */
class PlotRasterTool extends StructuredTool<any, any, any, string> {
  name = 'plot_raster';
  description = `Plot a raster dataset (e.g. TIFF image) on the map. Use when the user asks to "plot the X raster", "show the X tiff", "display the oso landslide image", "add the X layer". Call after search_data if needed to get the raster id. Pass raster_id: the id from search_data results (e.g. "oso-landslide-tiff-001") or the r2Key (e.g. "uploads/oso_oli_2014018_geo.tif"). Returns JSON with id, name, url, bounds for the frontend to add the raster layer.`;
  schema = z.object({
    raster_id: z.string().describe('Raster id from search_data (e.g. oso-landslide-tiff-001) or r2Key (e.g. uploads/oso_oli_2014018_geo.tif)'),
  }) as z.ZodTypeAny;

  constructor(private readonly baseUrl: string) {
    super();
  }

  protected async _call(arg: { raster_id: string }): Promise<string> {
    const { raster_id } = arg;
    if (!raster_id?.trim()) {
      return JSON.stringify({ error: 'raster_id is required' });
    }
    const base =
      (typeof this.baseUrl === 'string' && this.baseUrl.trim()) || 'http://localhost:3001';
    const baseNorm = base.replace(/\/+$/, '');
    const dataMappingUrl = `${baseNorm}/api/data-mapping`;
    try {
      const res = await fetch(dataMappingUrl);
      if (!res.ok) {
        return JSON.stringify({ error: `Failed to load data-mapping: ${res.status}` });
      }
      const data = (await res.json()) as unknown;
      const raster = findRasterInMapping(data, raster_id.trim());
      if (!raster) {
        return JSON.stringify({ error: `Raster not found: ${raster_id}` });
      }
      const bounds = raster.bounds;
      if ('tileLayer' in raster && raster.tileLayer) {
        const tileUrlTemplate = `${baseNorm}/api/tiles/${raster.tileLayer}/{z}/{x}/{y}.png`;
        const result = {
          id: raster.id,
          name: raster.name,
          type: 'tiled',
          tileUrlTemplate,
          minzoom: raster.minzoom ?? 0,
          maxzoom: raster.maxzoom ?? 18,
          bounds: bounds && bounds.length >= 2
            ? [bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]] as [number, number, number, number]
            : undefined,
        };
        console.log('[plot_raster tool] returning tiled', JSON.stringify(result));
        return JSON.stringify(result);
      }
      const url = `${baseNorm}/api/files/${encodeURIComponent(raster.r2Key ?? '').replace(/%2F/g, '/')}`;
      console.log('[plot_raster tool] baseNorm=', baseNorm, 'r2Key=', raster.r2Key, 'url=', url);
      if (!bounds || bounds.length < 2) {
        return JSON.stringify({
          id: raster.id,
          name: raster.name,
          url,
          error: 'Bounds not defined for this raster; cannot add to map.',
        });
      }
      const [[minLng, minLat], [maxLng, maxLat]] = bounds;
      const result = {
        id: raster.id,
        name: raster.name,
        type: 'image',
        url,
        bounds: [minLng, minLat, maxLng, maxLat],
      };
      console.log('[plot_raster tool] returning', JSON.stringify(result));
      return JSON.stringify(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return JSON.stringify({ error: msg });
    }
  }
}

export function createPlotRasterTool(baseUrl: string): PlotRasterTool {
  return new PlotRasterTool(baseUrl);
}
