import { createFileRoute } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';
import { Suspense, lazy } from 'react';
import { MapLibraryConfig } from '~/components/MapLibrary';
import { useState, useEffect } from 'react';
import { createSlides } from '~/config/slidesConfig';

const MapLibrary = lazy(() =>
  import('~/components/MapLibrary').then((m) => ({ default: m.MapLibrary }))
);

const MapLoadingFallback = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
    <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
    <p className="mt-3 text-sm text-gray-600">Loading map…</p>
  </div>
);

interface TourismData {
  state: string;
  hotels: number;
  rooms: number;
  tourist_arrivals: number;
}

interface WaterScarcityData {
  state: string;
  water_access_percent: number;
  water_scarcity_percent: number;
}

export const Route = createFileRoute('/examples/basic')({
  component: BasicMapPage,
});

function BasicMapPage() {
  const [tourismData, setTourismData] = useState<TourismData[]>([]);
  const [waterScarcityData, setWaterScarcityData] = useState<WaterScarcityData[]>([]);
  const [hotelsGeoJSON, setHotelsGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [speedmartGeoJSON, setSpeedmartGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const tourismResponse = await fetch('/data/malaysia/statistics/tourism.json');
        const tourism = await tourismResponse.json();
        setTourismData(tourism);

        const waterResponse = await fetch('/data/malaysia/statistics/water_scarcity.json');
        const water = await waterResponse.json();
        setWaterScarcityData(water);

        const hotelsResponse = await fetch('/data/malaysia/hotels/sabah_hotels.geojson');
        const hotels = await hotelsResponse.json();
        setHotelsGeoJSON(hotels);

        const speedmartResponse = await fetch('/data/malaysia/speedmart/sabah_speedmart.geojson');
        const speedmart = await speedmartResponse.json();
        setSpeedmartGeoJSON(speedmart);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const slides = createSlides({
    tourismData,
    waterScarcityData,
    hotelsGeoJSON,
    speedmartGeoJSON,
  });

  const mapConfig: MapLibraryConfig = {
    mapboxAccessToken: (import.meta.env.VITE_MAPBOX_TOKEN as string) || '',
    style: 'mapbox://styles/mapbox/light-v11',

    slideshow: {
      slides,
      autoPlay: false,
      loop: true,
      showControls: true,
      showProgress: true,
      transitionDuration: 1500,
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
        <MapLibrary config={mapConfig} />
      </Suspense>

      <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/50 to-transparent p-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg font-phudu">
            Malaysia Geographic Insights
          </h1>
          <p className="text-white/90 mt-2 drop-shadow">
            Interactive visualization of tourism, infrastructure, and resource distribution
          </p>
        </div>
        <Link
          to="/examples"
          className="text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition"
        >
          ← Examples
        </Link>
      </div>
    </div>
  );
}
