'use client';

import React, { useRef, useEffect, useState, ReactNode } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapLibraryConfig, GeoJSONLayerConfig } from './types';
import { Legend } from './Legend';
import { SidePanel } from './SidePanel';
import { Slideshow } from './Slideshow';
import {
  useMapClick,
  useMapHover,
  useMapLoad,
  useMapMove,
} from './hooks/useMapInteractions';
import { fetchGeoJSONWithCache } from '~/utils/geojsonCache';

interface MapLibraryProps {
  config: MapLibraryConfig;
  children?: ReactNode;
  className?: string;
  onMapLoad?: (map: mapboxgl.Map) => void;
}

export const MapLibrary: React.FC<MapLibraryProps> = ({
  config,
  children,
  className = '',
  onMapLoad,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [tokenMissing, setTokenMissing] = useState(false);
  const [styleVersion, setStyleVersion] = useState(0);
  const lastAppliedStyleRef = useRef<string | null>(null);

  // Keep latest config in a ref so init effect can read it without re-running when only layers/legend/sidePanel change
  const configRef = useRef(config);
  configRef.current = config;

  // Stable deps for map init: only recreate map when token or initial camera change (NOT style — style changes via setStyle to preserve center/zoom)
  const token = config.mapboxAccessToken ?? '';
  const initialCameraKey = JSON.stringify({
    center: config.initialCamera?.center ?? [0, 0],
    zoom: config.initialCamera?.zoom ?? 2,
    pitch: config.initialCamera?.pitch ?? 0,
    bearing: config.initialCamera?.bearing ?? 0,
  });

  // Initialize map (uses configRef.current.style for initial style)
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    const c = configRef.current;
    if (!c.mapboxAccessToken?.trim()) {
      setTokenMissing(true);
      setMapLoaded(true);
      return;
    }

    setTokenMissing(false);
    setMapLoaded(false);

    mapboxgl.accessToken = c.mapboxAccessToken;

    // Suppress Mapbox telemetry (POST to events.mapbox.com) so ad blockers don't log ERR_BLOCKED_BY_CLIENT
    const originalFetch = typeof window !== 'undefined' ? window.fetch : null;
    if (originalFetch && typeof window !== 'undefined') {
      (window as Window & { fetch: typeof fetch }).fetch = function (
        input: RequestInfo | URL,
        init?: RequestInit
      ): Promise<Response> {
        const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input instanceof URL ? input.href : String(input);
        if (!url || url === 'undefined' || (typeof url === 'string' && !url.trim())) {
          return Promise.resolve(new Response(null, { status: 404, statusText: 'Not Found' }));
        }
        if (url && url.includes('events.mapbox.com')) {
          return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }
        return originalFetch.call(window, input, init);
      };
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: c.style || 'mapbox://styles/mapbox/light-v11',
      center: c.initialCamera?.center || [0, 0],
      zoom: c.initialCamera?.zoom || 2,
      pitch: c.initialCamera?.pitch || 0,
      bearing: c.initialCamera?.bearing || 0,
      bounds: c.bounds,
      transformRequest: (url) => {
        if (url && (url.includes('api.mapbox.com') || url.includes('tiles.mapbox.com'))) {
          const apiOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
          if (!apiOrigin) return {};
          return { url: `${apiOrigin}/api/mapbox-proxy?url=${encodeURIComponent(url)}` };
        }
        return {};
      },
    });

    // Add controls (read from latest config)
    if (c.controls?.navigation !== false) {
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    }
    if (c.controls?.fullscreen) {
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    }
    if (c.controls?.scale) {
      map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
    }
    if (c.controls?.geolocate) {
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
        }),
        'top-right'
      );
    }

    map.current.on('load', () => {
      if (map.current) {
        lastAppliedStyleRef.current = c.style || 'mapbox://styles/mapbox/light-v11';
        map.current.resize();
        setMapLoaded(true);
        if (onMapLoad) onMapLoad(map.current);
      }
    });

    return () => {
      if (originalFetch && typeof window !== 'undefined') {
        (window as Window & { fetch: typeof fetch }).fetch = originalFetch;
      }
      lastAppliedStyleRef.current = null;
      map.current?.remove();
      map.current = null;
    };
  }, [token, initialCameraKey, onMapLoad]);

  // Track which layer configs we added so we can remove them when config.layers changes
  const addedLayerConfigsRef = useRef<GeoJSONLayerConfig[]>([]);

  // When only style URL changes: setStyle in place so center/zoom are preserved (no map teardown)
  // setStyle() does not return a Promise; use 'styledata' + isStyleLoaded() per Mapbox docs
  const styleUrl = config.style ?? 'mapbox://styles/mapbox/light-v11';
  useEffect(() => {
    if (!map.current || !mapLoaded || !styleUrl) return;
    if (lastAppliedStyleRef.current === styleUrl) return;
    const m = map.current;
    lastAppliedStyleRef.current = styleUrl;
    addedLayerConfigsRef.current = [];
    const onStyledata = () => {
      if (m.isStyleLoaded()) {
        m.off('styledata', onStyledata);
        setStyleVersion((v) => v + 1);
      }
    };
    m.on('styledata', onStyledata);
    m.setStyle(styleUrl);
    return () => m.off('styledata', onStyledata);
  }, [mapLoaded, styleUrl]);

  // Stable key so effect definitely runs when the set of layers changes (array reference can be stale in React)
  const layersKey =
    (config.layers ?? []).length > 0
      ? (config.layers ?? [])
          .map((c) => c.id)
          .sort()
          .join(',')
      : '';

  // Add/remove layers when map is loaded, config.layers changes, or style was replaced (styleVersion)
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const m = map.current;
    if (!m.getStyle()) return;

    // Always read latest layers from ref so we never use stale closure (e.g. after once('idle'))
    const layers = configRef.current.layers ?? [];
    const currentIds = new Set(layers.map((c) => c.id));

    // Remove sources and their layers that are no longer in config.layers
    const toRemove = addedLayerConfigsRef.current.filter((c) => !currentIds.has(c.id));
    for (const layerConfig of toRemove) {
      for (const layer of [...layerConfig.layers].reverse()) {
        if (m.getLayer(layer.id)) m.removeLayer(layer.id);
      }
      if (m.getSource(layerConfig.id)) m.removeSource(layerConfig.id);
    }
    addedLayerConfigsRef.current = addedLayerConfigsRef.current.filter((c) => currentIds.has(c.id));

    // Add new sources and layers (fetch GeoJSON URLs ourselves so Mapbox never sees a URL and never hits "Failed to parse URL from undefined")
    const origin =
      typeof window !== 'undefined' && window.location && window.location.origin ? window.location.origin : '';

    let cancelled = false;

    const addLayerConfig = (layerConfig: GeoJSONLayerConfig, data: GeoJSON.FeatureCollection | string) => {
      if (!map.current || cancelled) return;
      const mapInstance = map.current;
      if (mapInstance.getSource(layerConfig.id)) return;
      try {
        mapInstance.addSource(layerConfig.id, { type: 'geojson', data } as mapboxgl.GeoJSONSourceRaw);
        for (const layer of layerConfig.layers) {
          const layerSpec: mapboxgl.LayerSpecification = {
            id: layer.id,
            type: layer.type,
            source: layerConfig.id,
            paint: layer.paint ?? {},
            layout: layer.layout ?? {},
            ...(layer.filter != null && layer.filter !== undefined && { filter: layer.filter }),
            ...(typeof layer.minzoom === 'number' && { minzoom: layer.minzoom }),
            ...(typeof layer.maxzoom === 'number' && { maxzoom: layer.maxzoom }),
          };
          mapInstance.addLayer(layerSpec);
        }
        addedLayerConfigsRef.current.push(layerConfig);
      } catch (err) {
        console.warn('MapLibrary: failed to add layer', layerConfig.id, err);
      }
    };

    void (async () => {
      for (const layerConfig of layers) {
        if (m.getSource(layerConfig.id)) continue;
        const rawData = layerConfig.source?.data;
        if (rawData === undefined || rawData === null) {
          console.warn('MapLibrary: skipping layer (no source data)', layerConfig.id);
          continue;
        }
        if (typeof rawData === 'string') {
          const trimmed = rawData.trim();
          if (!trimmed) {
            console.warn('MapLibrary: skipping layer (empty source URL)', layerConfig.id);
            continue;
          }
          const geojson = await fetchGeoJSONWithCache(trimmed, origin);
          if (cancelled || !map.current) return;
          if (geojson) {
            addLayerConfig(layerConfig, geojson);
          } else {
            console.warn('MapLibrary: failed to fetch layer', layerConfig.id, trimmed);
          }
        } else if (typeof rawData === 'object' && rawData !== null && 'type' in rawData) {
          addLayerConfig(layerConfig, rawData as GeoJSON.FeatureCollection);
        } else {
          console.warn('MapLibrary: skipping layer (invalid source data)', layerConfig.id);
        }
      }
      if (map.current && !cancelled) map.current.resize();
    })();

    return () => {
      cancelled = true;
    };
  }, [mapLoaded, layersKey, styleVersion]);

  // Setup interaction handlers
  useMapClick(
    map.current,
    config.interactionHandlers || {},
    config.layers?.flatMap((l) => l.layers.map((layer) => layer.id))
  );

  useMapHover(
    map.current,
    config.interactionHandlers || {},
    config.layers?.flatMap((l) => l.layers.map((layer) => layer.id))
  );

  useMapLoad(map.current, config.interactionHandlers?.onLoad);

  useMapMove(
    map.current,
    config.interactionHandlers?.onMoveEnd,
    config.interactionHandlers?.onZoomEnd
  );

  return (
    <div className={`relative w-full h-full min-h-0 ${className}`}>
      {/* Map Container - explicit z-0 so overlays (z-10) sit above; map stays visible when loading overlay is removed */}
      <div ref={mapContainer} className="absolute inset-0 z-0 min-w-full min-h-full" />

      {/* Token missing */}
      {tokenMissing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-10 p-6">
          <p className="text-gray-700 font-medium">Mapbox token required</p>
          <p className="mt-2 text-sm text-gray-500 text-center max-w-sm">
            Set <code className="bg-gray-200 px-1 rounded">VITE_MAPBOX_TOKEN</code> in <code className="bg-gray-200 px-1 rounded">.env.local</code> to load the map.
          </p>
        </div>
      )}

      {/* Loading state */}
      {!mapLoaded && !tokenMissing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-10">
          <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          <p className="mt-3 text-sm text-gray-600">Loading map…</p>
        </div>
      )}

      {/* Legend */}
      {config.legend && <Legend config={config.legend} />}

      {/* Side Panel */}
      {config.sidePanel && (
        <SidePanel config={config.sidePanel}>
          {children}
        </SidePanel>
      )}

      {/* Slideshow */}
      {config.slideshow && (
        <Slideshow
          config={config.slideshow}
          map={map.current}
        />
      )}
    </div>
  );
};

export default MapLibrary;
