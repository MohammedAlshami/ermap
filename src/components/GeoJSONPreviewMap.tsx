'use client';

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const SOURCE_ID = 'geojson-preview';
const FILL_LAYER_ID = 'geojson-preview-fill';
const LINE_LAYER_ID = 'geojson-preview-line';
const CIRCLE_LAYER_ID = 'geojson-preview-circle';

interface GeoJSONPreviewMapProps {
  url: string;
  token: string;
  className?: string;
}

export function GeoJSONPreviewMap({ url, token, className = '' }: GeoJSONPreviewMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current || !token?.trim() || !url) return;

    const container = containerRef.current;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [109.7, 3.1],
      zoom: 4,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(container);

    map.on('load', () => {
      setLoading(true);
      setError(null);
      fetch(url)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load'))))
        .then((geojson: GeoJSON.FeatureCollection) => {
          if (!mapRef.current) return;
          const m = mapRef.current;
          if (m.getSource(SOURCE_ID)) {
            (m.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).setData(geojson);
          } else {
            m.addSource(SOURCE_ID, { type: 'geojson', data: geojson });
            const first = geojson.features?.[0];
            const geomType = first?.geometry?.type;
            if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
              m.addLayer({
                id: FILL_LAYER_ID,
                type: 'fill',
                source: SOURCE_ID,
                paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.4 },
              });
              m.addLayer({
                id: LINE_LAYER_ID,
                type: 'line',
                source: SOURCE_ID,
                paint: { 'line-color': '#1d4ed8', 'line-width': 2 },
              });
            } else if (geomType === 'Point' || geomType === 'MultiPoint') {
              m.addLayer({
                id: CIRCLE_LAYER_ID,
                type: 'circle',
                source: SOURCE_ID,
                paint: { 'circle-radius': 6, 'circle-color': '#3b82f6' },
              });
            } else {
              m.addLayer({
                id: LINE_LAYER_ID,
                type: 'line',
                source: SOURCE_ID,
                paint: { 'line-color': '#3b82f6', 'line-width': 2 },
              });
            }
          }
          const bbox = getBounds(geojson);
          if (bbox) m.fitBounds(bbox, { padding: 40, maxZoom: 12 });
          m.resize();
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load');
          setLoading(false);
        });
    });

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [url, token]);

  return (
    <div className={`relative w-full min-h-0 flex-1 ${className}`} style={{ minHeight: 200 }}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full" style={{ minHeight: 200 }} />
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
