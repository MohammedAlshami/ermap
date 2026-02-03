/**
 * Simple localStorage cache for GeoJSON by URL.
 * Keys by normalized URL; evicts oldest entries when over max size.
 */

const CACHE_PREFIX = 'ermap_geojson_';
const CACHE_META_KEY = 'ermap_geojson_meta';
const MAX_ENTRIES = 24;
const MAX_ITEM_SIZE = 5 * 1024 * 1024; // 5MB per item (localStorage ~5–10MB total)

interface CacheMeta {
  keys: string[];
  sizes: Record<string, number>;
}

function getMeta(): CacheMeta {
  try {
    const raw = localStorage.getItem(CACHE_META_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CacheMeta;
      if (Array.isArray(parsed.keys) && parsed.sizes && typeof parsed.sizes === 'object')
        return parsed;
    }
  } catch {
    // ignore
  }
  return { keys: [], sizes: {} };
}

function setMeta(meta: CacheMeta): void {
  try {
    localStorage.setItem(CACHE_META_KEY, JSON.stringify(meta));
  } catch {
    // ignore
  }
}

function cacheKey(url: string): string {
  return CACHE_PREFIX + url.replace(/^https?:\/\//, '').replace(/\//g, '_').slice(0, 120);
}

function evictOne(meta: CacheMeta): void {
  const key = meta.keys.shift();
  if (key) {
    try {
      localStorage.removeItem(key);
      delete meta.sizes[key];
    } catch {
      // ignore
    }
  }
}

/**
 * Get cached GeoJSON for a URL, or null if missing/expired/invalid.
 */
export function getCachedGeoJSON(url: string): GeoJSON.FeatureCollection | null {
  if (typeof url !== 'string' || !url.trim()) return null;
  const key = cacheKey(url.trim());
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.type === 'string' && parsed.type === 'FeatureCollection')
      return parsed as GeoJSON.FeatureCollection;
  } catch {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
  return null;
}

/**
 * Store GeoJSON in cache for the given URL. Evicts oldest entries if over limit.
 */
export function setCachedGeoJSON(url: string, data: GeoJSON.FeatureCollection): void {
  if (typeof url !== 'string' || !url.trim() || !data || data.type !== 'FeatureCollection')
    return;
  const key = cacheKey(url.trim());
  const str = JSON.stringify(data);
  const size = str.length;
  if (size > MAX_ITEM_SIZE) return;
  const meta = getMeta();
  if (!meta.keys.includes(key)) {
    while (meta.keys.length >= MAX_ENTRIES) evictOne(meta);
    meta.keys.push(key);
  }
  meta.sizes[key] = size;
  try {
    localStorage.setItem(key, str);
    setMeta(meta);
  } catch (e) {
    try {
      localStorage.removeItem(key);
      const i = meta.keys.indexOf(key);
      if (i >= 0) meta.keys.splice(i, 1);
      delete meta.sizes[key];
      setMeta(meta);
    } catch {
      // ignore
    }
  }
}

/**
 * Fetch GeoJSON from URL, using cache when available.
 * Returns parsed FeatureCollection or null on error.
 */
export async function fetchGeoJSONWithCache(
  url: string,
  origin?: string
): Promise<GeoJSON.FeatureCollection | null> {
  const fullUrl =
    typeof origin === 'string' && origin && url.trim().startsWith('/')
      ? `${origin}${url.trim()}`
      : url.trim();
  const cached = getCachedGeoJSON(fullUrl);
  if (cached) return cached;
  try {
    const res = await fetch(fullUrl);
    if (!res.ok) return null;
    const data = (await res.json()) as GeoJSON.FeatureCollection;
    if (data && data.type === 'FeatureCollection') {
      setCachedGeoJSON(fullUrl, data);
      return data;
    }
  } catch {
    // ignore
  }
  return null;
}
