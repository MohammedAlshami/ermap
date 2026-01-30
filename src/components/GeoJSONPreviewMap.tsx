'use client';

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import geojsonvt from 'geojson-vt';
import 'mapbox-gl/dist/mapbox-gl.css';

const SOURCE_ID = 'geojson-preview';
const FILL_LAYER_ID = 'geojson-preview-fill';
const LINE_LAYER_ID = 'geojson-preview-line';
const CIRCLE_LAYER_ID = 'geojson-preview-circle';
const FEATURE_THRESHOLD = 1000;
const EXTENT = 4096;

/** Palette for polygon fills (varied colors) */
const FILL_COLORS = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#6366f1', '#f97316',
];

interface GeoJSONPreviewMapProps {
  url: string;
  token: string;
  /** When set, use server-side tiles (GET /api/tiles/bounds and /api/tiles/view) instead of client-side geojson-vt. */
  tileKey?: string;
  className?: string;
}

/** Convert tile pixel coords (0–extent) to lng/lat for tile (z, x, y) */
function tileToLngLat(z: number, x: number, y: number, px: number, py: number, extent: number): [number, number] {
  const z2 = 1 << z;
  const xMerc = (x + px / extent) / z2;
  const yMerc = (y + py / extent) / z2;
  const lng = xMerc * 360 - 180;
  const lat = (180 / Math.PI) * (2 * Math.atan(Math.exp(Math.PI - 2 * Math.PI * yMerc)) - Math.PI / 2);
  return [lng, lat];
}

/** Convert geojson-vt tile (type 1=Point, 2=Line, 3=Polygon; coords in tile space) to GeoJSON Feature.
 * geojson-vt getTile returns *transformed* tiles: type 1 = array of [x,y] pairs, type 2/3 = array of rings (each ring = array of [x,y]). */
function tileFeatureToGeoJSON(
  tile: { z: number; x: number; y: number },
  f: { type: number; geometry: [number, number][] | [number, number][][]; tags: Record<string, unknown> | null; id?: number },
  extent: number
): GeoJSON.Feature {
  const { z, x, y } = tile;
  const toLngLat = (px: number, py: number) => tileToLngLat(z, x, y, px, py, extent);

  let geometry: GeoJSON.Geometry;
  const geom = f.geometry;

  if (f.type === 1) {
    const points = (geom as [number, number][]).map((pt) => toLngLat(pt[0], pt[1]));
    geometry = points.length === 1 ? { type: 'Point', coordinates: points[0] } : { type: 'MultiPoint', coordinates: points };
  } else if (f.type === 2) {
    const coords = (geom as [number, number][][]).map((ring) => ring.map((c) => toLngLat(c[0], c[1])));
    geometry = coords.length === 1 ? { type: 'LineString', coordinates: coords[0] } : { type: 'MultiLineString', coordinates: coords };
  } else {
    const coords = (geom as [number, number][][]).map((ring) => ring.map((c) => toLngLat(c[0], c[1])));
    geometry = { type: 'Polygon', coordinates: coords };
  }

  const props = { ...(f.tags || {}) };
  const feature: GeoJSON.Feature = {
    type: 'Feature',
    properties: props,
    geometry,
  };
  if (f.id != null) feature.id = f.id;
  return feature;
}

/** Get tile indices that cover a bounding box at zoom z */
function getTilesInBounds(bounds: [[number, number], [number, number]], z: number): { z: number; x: number; y: number }[] {
  const [lngLat1, lngLat2] = bounds;
  const minLng = Math.min(lngLat1[0], lngLat2[0]);
  const maxLng = Math.max(lngLat1[0], lngLat2[0]);
  const minLat = Math.min(lngLat1[1], lngLat2[1]);
  const maxLat = Math.max(lngLat1[1], lngLat2[1]);
  const n = 1 << z;
  const lngToX = (lng: number) => Math.floor(((lng + 180) / 360) * n);
  const latToY = (lat: number) => {
    const latRad = (lat * Math.PI) / 180;
    const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2;
    return Math.floor(y * n);
  };
  const xMin = Math.max(0, lngToX(minLng));
  const xMax = Math.min(n - 1, lngToX(maxLng));
  const yMin = Math.max(0, latToY(maxLat));
  const yMax = Math.min(n - 1, latToY(minLat));
  const tiles: { z: number; x: number; y: number }[] = [];
  for (let x = xMin; x <= xMax; x++) {
    for (let y = yMin; y <= yMax; y++) {
      tiles.push({ z, x, y });
    }
  }
  return tiles;
}

export function GeoJSONPreviewMap({ url, token, tileKey, className = '' }: GeoJSONPreviewMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const tileIndexRef = useRef<ReturnType<typeof geojsonvt> | null>(null);
  const fullGeoJSONRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const useTiledRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current || !token?.trim() || !url) return;

    const useServerTiles = Boolean(tileKey?.trim());
    const container = containerRef.current;
    // Capture origin once so transformRequest always returns an absolute URL (Mapbox may call it from a worker where window is undefined).
    const apiOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [109.7, 3.1],
      zoom: 4,
      transformRequest: (url) => {
        if (url.includes('api.mapbox.com') || url.includes('tiles.mapbox.com') || url.includes('events.mapbox.com')) {
          if (!apiOrigin) return {}; // Don't return relative URL — would break Request in worker
          return { url: `${apiOrigin}/api/mapbox-proxy?url=${encodeURIComponent(url)}` };
        }
        return {};
      },
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(container);

    function updateVisibleTiles() {
      const m = mapRef.current;
      const index = tileIndexRef.current;
      if (!m || !index || !m.getSource(SOURCE_ID)) return;
      const bounds = m.getBounds();
      const zoom = Math.floor(m.getZoom());
      const bbox: [[number, number], [number, number]] = [
        [bounds.getWest(), bounds.getSouth()],
        [bounds.getEast(), bounds.getNorth()],
      ];
      const tiles = getTilesInBounds(bbox, Math.min(14, Math.max(0, zoom)));
      const features: GeoJSON.Feature[] = [];
      const seen = new Set<string>();
      let idx = 0;
      for (const t of tiles) {
        const tileData = index.getTile(t.z, t.x, t.y);
        if (!tileData?.features) continue;
        for (const f of tileData.features) {
          const geojsonFeature = tileFeatureToGeoJSON(t, f, EXTENT);
          const key = JSON.stringify(geojsonFeature.geometry?.type) + JSON.stringify(geojsonFeature.geometry);
          if (seen.has(key)) continue;
          seen.add(key);
          if (geojsonFeature.properties && (geojsonFeature.geometry?.type === 'Polygon' || geojsonFeature.geometry?.type === 'MultiPolygon')) {
            (geojsonFeature.properties as Record<string, unknown>)._color = FILL_COLORS[idx % FILL_COLORS.length];
            idx++;
          }
          features.push(geojsonFeature);
        }
      }
      (m.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features,
      });
    }

    async function fetchServerView() {
      const m = mapRef.current;
      if (!m || !tileKey || !m.getSource(SOURCE_ID)) return;
      const bounds = m.getBounds();
      const zoom = Math.floor(m.getZoom());
      const params = new URLSearchParams({
        key: tileKey,
        west: String(bounds.getWest()),
        south: String(bounds.getSouth()),
        east: String(bounds.getEast()),
        north: String(bounds.getNorth()),
        zoom: String(Math.min(14, Math.max(0, zoom))),
      });
      const r = await fetch(`/api/tiles/view?${params}`);
      if (!r.ok) return;
      const data = (await r.json()) as GeoJSON.FeatureCollection;
      (m.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).setData(data);
    }

    map.on('load', () => {
      setLoading(true);
      setError(null);

      if (useServerTiles) {
        const params = new URLSearchParams({ key: tileKey! });
        fetch(`/api/tiles/bounds?${params}`)
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load bounds'))))
          .then(async (body: { bbox: [number, number, number, number] | null; featureCount: number }) => {
            if (!mapRef.current) return;
            const m = mapRef.current;
            const empty: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
            if (!m.getSource(SOURCE_ID)) {
              m.addSource(SOURCE_ID, { type: 'geojson', data: empty });
              m.addLayer({
                id: FILL_LAYER_ID,
                type: 'fill',
                source: SOURCE_ID,
                paint: { 'fill-color': ['coalesce', ['get', '_color'], '#3b82f6'], 'fill-opacity': 0.55 },
                filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
              });
              m.addLayer({
                id: LINE_LAYER_ID,
                type: 'line',
                source: SOURCE_ID,
                paint: { 'line-color': '#1d4ed8', 'line-width': 2 },
                filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon', 'LineString', 'MultiLineString']]],
              });
              m.addLayer({
                id: CIRCLE_LAYER_ID,
                type: 'circle',
                source: SOURCE_ID,
                paint: { 'circle-radius': 6, 'circle-color': '#3b82f6' },
                filter: ['in', ['geometry-type'], ['literal', ['Point', 'MultiPoint']]],
              });
            }
            if (body.bbox) {
              const [west, south, east, north] = body.bbox;
              m.fitBounds([[west, south], [east, north]], { padding: 40, maxZoom: 12 });
            }
            await fetchServerView();
            m.once('idle', fetchServerView);
            m.on('moveend', fetchServerView);
            m.on('zoomend', fetchServerView);
            m.resize();
            setLoading(false);
          })
          .catch((err) => {
            setError(err.message || 'Failed to load');
            setLoading(false);
          });
        return;
      }

      fetch(url)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load'))))
        .then((geojson: GeoJSON.FeatureCollection) => {
          if (!mapRef.current) return;
          const m = mapRef.current;
          const featureCount = geojson.features?.length ?? 0;
          const useTiled = featureCount > FEATURE_THRESHOLD;

          // Add fill color per polygon feature (for full-dataset path)
          const features = geojson.features ?? [];
          let colorIdx = 0;
          const geojsonWithColors: GeoJSON.FeatureCollection = {
            ...geojson,
            features: features.map((f) => {
              const props = { ...(f.properties || {}) } as Record<string, unknown>;
              const geom = f.geometry;
              if (geom?.type === 'Polygon' || geom?.type === 'MultiPolygon') {
                props._color = FILL_COLORS[colorIdx++ % FILL_COLORS.length];
              }
              return { ...f, properties: props };
            }),
          };

          if (useTiled) {
            try {
              tileIndexRef.current = geojsonvt(geojson, {
                maxZoom: 14,
                tolerance: 3,
                extent: EXTENT,
                buffer: 64,
                indexMaxZoom: 5,
                indexMaxPoints: 100000,
              });
              fullGeoJSONRef.current = geojson;
              useTiledRef.current = true;
            } catch (e) {
              console.warn('geojson-vt failed, using full GeoJSON', e);
              useTiledRef.current = false;
            }
          } else {
            useTiledRef.current = false;
          }

          const dataToSet = useTiledRef.current ? { type: 'FeatureCollection' as const, features: [] } : geojsonWithColors;
          if (m.getSource(SOURCE_ID)) {
            (m.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).setData(dataToSet);
          } else {
            m.addSource(SOURCE_ID, { type: 'geojson', data: dataToSet });
            m.addLayer({
              id: FILL_LAYER_ID,
              type: 'fill',
              source: SOURCE_ID,
              paint: {
                'fill-color': ['coalesce', ['get', '_color'], '#3b82f6'],
                'fill-opacity': 0.55,
              },
              filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
            });
            m.addLayer({
              id: LINE_LAYER_ID,
              type: 'line',
              source: SOURCE_ID,
              paint: { 'line-color': '#1d4ed8', 'line-width': 2 },
              filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon', 'LineString', 'MultiLineString']]],
            });
            m.addLayer({
              id: CIRCLE_LAYER_ID,
              type: 'circle',
              source: SOURCE_ID,
              paint: { 'circle-radius': 6, 'circle-color': '#3b82f6' },
              filter: ['in', ['geometry-type'], ['literal', ['Point', 'MultiPoint']]],
            });
          }

          const bbox = getBounds(geojson);
          if (bbox) m.fitBounds(bbox, { padding: 40, maxZoom: 12 });

          if (useTiledRef.current) {
            updateVisibleTiles();
            m.once('idle', updateVisibleTiles);
            m.on('moveend', updateVisibleTiles);
            m.on('zoomend', updateVisibleTiles);
          }

          m.resize();
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load');
          setLoading(false);
        });
    });

    return () => {
      map.off('moveend', updateVisibleTiles);
      map.off('zoomend', updateVisibleTiles);
      map.off('moveend', fetchServerView);
      map.off('zoomend', fetchServerView);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      tileIndexRef.current = null;
      fullGeoJSONRef.current = null;
    };
  }, [url, token, tileKey]);

  return (
    <div className={`relative w-full h-full min-h-[300px] ${className}`} style={{ height: '100%', minHeight: 300 }}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full" style={{ height: '100%' }} />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/20 z-10">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-white rounded-full animate-spin" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10 p-4">
          <p className="text-red-400 text-sm font-phudu">{error}</p>
        </div>
      )}
    </div>
  );
}

function getBounds(geojson: GeoJSON.FeatureCollection): [[number, number], [number, number]] | null {
  const coords: [number, number][] = [];
  const visit = (c: unknown): void => {
    if (Array.isArray(c)) {
      if (c.length >= 2 && typeof c[0] === 'number' && typeof c[1] === 'number') {
        coords.push([c[0], c[1]]);
      } else {
        c.forEach(visit);
      }
    }
  };
  geojson.features?.forEach((f) => {
    const g = f.geometry;
    if (g?.type === 'Point') visit((g as GeoJSON.Point).coordinates);
    if (g?.type === 'LineString') visit((g as GeoJSON.LineString).coordinates);
    if (g?.type === 'Polygon') visit((g as GeoJSON.Polygon).coordinates);
    if (g?.type === 'MultiPoint') visit((g as GeoJSON.MultiPoint).coordinates);
    if (g?.type === 'MultiLineString') visit((g as GeoJSON.MultiLineString).coordinates);
    if (g?.type === 'MultiPolygon') visit((g as GeoJSON.MultiPolygon).coordinates);
  });
  if (coords.length === 0) return null;
  const lngs = coords.map(([lng]) => lng);
  const lats = coords.map(([, lat]) => lat);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}
