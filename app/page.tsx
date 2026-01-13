'use client';

import { MapLibrary, MapLibraryConfig } from './components/MapLibrary';
import { useState, useEffect } from 'react';
import { createSlides } from './config/slidesConfig';

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

export default function MapPage() {
  const [tourismData, setTourismData] = useState<TourismData[]>([]);
  const [waterScarcityData, setWaterScarcityData] = useState<WaterScarcityData[]>([]);
  const [hotelsGeoJSON, setHotelsGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [speedmartGeoJSON, setSpeedmartGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load tourism data
        const tourismResponse = await fetch('/data/malaysia/statistics/tourism.json');
        const tourism = await tourismResponse.json();
        setTourismData(tourism);

        // Load water scarcity data
        const waterResponse = await fetch('/data/malaysia/statistics/water_scarcity.json');
        const water = await waterResponse.json();
        setWaterScarcityData(water);

        // Load hotels GeoJSON
        const hotelsResponse = await fetch('/data/malaysia/hotels/sabah_hotels.geojson');
        const hotels = await hotelsResponse.json();
        setHotelsGeoJSON(hotels);

        // Load SpeedMart GeoJSON
        const speedmartResponse = await fetch('/data/malaysia/speedmart/sabah_speedmart.geojson');
        const speedmart = await speedmartResponse.json();
        setSpeedmartGeoJSON(speedmart);

      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Generate slides with loaded data
  const slides = createSlides({
    tourismData,
    waterScarcityData,
    hotelsGeoJSON,
    speedmartGeoJSON,
  });

  // Map configuration
  const mapConfig: MapLibraryConfig = {
    mapboxAccessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
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
    <div className="w-full h-screen bg-gray-100">
      <MapLibrary config={mapConfig} />
      
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/50 to-transparent p-6">
        <h1 className="text-3xl font-bold text-white drop-shadow-lg">
          Malaysia Geographic Insights
        </h1>
        <p className="text-white/90 mt-2 drop-shadow">
          Interactive visualization of tourism, infrastructure, and resource distribution
        </p>
      </div>
    </div>
  );
}
