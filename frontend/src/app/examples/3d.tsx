import { createFileRoute } from '@tanstack/react-router';
import { Suspense, lazy } from 'react';
import { MapLibraryConfig } from '~/components/MapLibrary';
import type { Map as MapboxMap } from 'mapbox-gl';

const MapLibrary = lazy(() =>
  import('~/components/MapLibrary').then((m) => ({ default: m.MapLibrary }))
);

const MapLoadingFallback = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
    <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
    <p className="mt-3 text-sm text-gray-600">Loading map…</p>
  </div>
);

function add3DBuildings(map: MapboxMap) {
  const layers = map.getStyle().layers;
  const firstSymbolId = layers?.find((l) => l.type === 'symbol')?.id;

  map.addLayer(
    {
      id: '3d-buildings',
      source: 'composite',
      'source-layer': 'building',
      type: 'fill-extrusion',
      minzoom: 15,
      paint: {
        'fill-extrusion-color': '#aaa',
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'min_height'],
        'fill-extrusion-opacity': 0.9,
      },
    },
    firstSymbolId
  );
}

export const Route = createFileRoute('/examples/3d')({
  component: Examples3DPage,
});

function Examples3DPage() {
  const mapConfig: MapLibraryConfig = {
    mapboxAccessToken: (import.meta.env.VITE_MAPBOX_TOKEN as string) || '',
    style: 'mapbox://styles/mapbox/light-v11',
    initialCamera: {
      center: [101.6869, 3.139],
      zoom: 15.5,
      pitch: 60,
      bearing: 0,
    },
    controls: {
      navigation: true,
      fullscreen: true,
      scale: true,
      geolocate: false,
    },
  };

  return (
    <div className="w-full h-screen bg-gray-100 relative">
      <Suspense fallback={<MapLoadingFallback />}>
        <MapLibrary config={mapConfig} onMapLoad={add3DBuildings} />
      </Suspense>
    </div>
  );
}
