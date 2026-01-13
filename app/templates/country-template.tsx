/**
 * Template for adding a new country to your map
 * 
 * Instructions:
 * 1. Copy this file to app/countries/[country-name].tsx
 * 2. Replace placeholders with actual values
 * 3. Add your data files to public/data/[country-name]/
 * 4. Import and use in your application
 */

import { MapLibraryConfig, SlideConfig } from '@/app/components/MapLibrary';

// ============================================
// COUNTRY: [COUNTRY NAME]
// ============================================

// Country center coordinates
const COUNTRY_CENTER: [number, number] = [100.0, 0.0]; // [longitude, latitude]
const COUNTRY_ZOOM = 6;

// Data paths for this country
const DATA_PATHS = {
  geojson: '/data/[country-name]/geojson/[country-name].geojson',
  hotels: '/data/[country-name]/hotels/hotels.geojson',
  retail: '/data/[country-name]/retail/stores.geojson',
  districts: '/data/[country-name]/districts/districts.geojson',
  statistics: {
    tourism: '/data/[country-name]/statistics/tourism.json',
    water: '/data/[country-name]/statistics/water_scarcity.json',
    population: '/data/[country-name]/statistics/population.json',
  },
};

// ============================================
// SLIDES
// ============================================

const slides: SlideConfig[] = [
  // Slide 1: Country Overview
  {
    id: 'overview',
    title: '[Country Name] Overview',
    description: 'Geographic and economic overview',
    duration: 6000,
    camera: {
      center: COUNTRY_CENTER,
      zoom: COUNTRY_ZOOM,
    },
    layers: [
      {
        id: 'country-boundaries',
        source: {
          type: 'geojson',
          data: DATA_PATHS.geojson,
        },
        layers: [
          {
            id: 'boundaries-fill',
            type: 'fill',
            paint: {
              'fill-color': '#E8F4F8',
              'fill-opacity': 0.4,
            },
          },
          {
            id: 'boundaries-outline',
            type: 'line',
            paint: {
              'line-color': '#0077BE',
              'line-width': 2,
            },
          },
        ],
      },
    ],
    legend: {
      title: 'Legend',
      position: 'bottom-left',
      entries: [
        { label: 'Regional Boundaries', color: '#0077BE' },
      ],
    },
    sidePanel: {
      title: '[Country Name] Statistics',
      position: 'right',
      width: '400px',
      collapsible: true,
      defaultExpanded: true,
      content: (
        <div className="p-6 space-y-6">
          <h3 className="text-lg font-bold text-gray-800">Country Overview</h3>
          
          <div className="space-y-3">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Population</div>
              <div className="text-2xl font-bold text-blue-700">[XX.X]M</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Area</div>
              <div className="text-2xl font-bold text-green-700">[XXX,XXX] km²</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Capital</div>
              <div className="text-xl font-bold text-purple-700">[Capital City]</div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">
              Add your country description here...
            </p>
          </div>
        </div>
      ),
    },
  },

  // Slide 2: Hotels/Tourism
  {
    id: 'tourism',
    title: 'Tourism Infrastructure',
    description: 'Hotel and accommodation distribution',
    duration: 8000,
    camera: {
      center: COUNTRY_CENTER,
      zoom: 7,
      pitch: 45,
    },
    layers: [
      {
        id: 'hotels-source',
        source: {
          type: 'geojson',
          data: DATA_PATHS.hotels,
        },
        layers: [
          {
            id: 'hotels-points',
            type: 'circle',
            paint: {
              'circle-radius': 8,
              'circle-color': '#FF6B6B',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#FFFFFF',
            },
          },
        ],
      },
    ],
    legend: {
      title: 'Tourism',
      position: 'bottom-left',
      entries: [
        { label: 'Hotels', color: '#FF6B6B' },
      ],
    },
    sidePanel: {
      title: 'Tourism Statistics',
      position: 'right',
      width: '400px',
      collapsible: true,
      defaultExpanded: true,
      content: (
        <div className="p-6">
          <h3 className="text-lg font-bold">Hotel Distribution</h3>
          {/* Add your tourism statistics here */}
        </div>
      ),
    },
  },

  // Slide 3: Retail/Business
  {
    id: 'retail',
    title: 'Retail Network',
    description: 'Distribution of retail locations',
    duration: 8000,
    camera: {
      center: COUNTRY_CENTER,
      zoom: 7,
    },
    layers: [
      {
        id: 'retail-source',
        source: {
          type: 'geojson',
          data: DATA_PATHS.retail,
        },
        layers: [
          {
            id: 'retail-points',
            type: 'circle',
            paint: {
              'circle-radius': 6,
              'circle-color': '#00C851',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#FFFFFF',
            },
          },
        ],
      },
    ],
    legend: {
      title: 'Retail',
      position: 'bottom-left',
      entries: [
        { label: 'Stores', color: '#00C851' },
      ],
    },
  },

  // Add more slides as needed...
];

// ============================================
// MAP CONFIGURATION
// ============================================

export const countryMapConfig: MapLibraryConfig = {
  mapboxAccessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
  
  style: 'mapbox://styles/mapbox/light-v11',
  
  initialCamera: {
    center: COUNTRY_CENTER,
    zoom: COUNTRY_ZOOM,
  },
  
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
  },
};

// ============================================
// USAGE EXAMPLE
// ============================================

/*
// In your page.tsx or component:

import { MapLibrary } from '@/app/components/MapLibrary';
import { countryMapConfig } from '@/app/countries/[country-name]';

export default function CountryMapPage() {
  return (
    <div className="w-full h-screen">
      <MapLibrary config={countryMapConfig} />
    </div>
  );
}
*/

// ============================================
// DATA PREPARATION CHECKLIST
// ============================================

/*
Before using this template, prepare your data:

1. GeoJSON Files:
   ✓ Country/region boundaries
   ✓ Points of interest (hotels, stores, etc.)
   ✓ Ensure valid GeoJSON format
   ✓ Optimize with mapshaper.org if large

2. JSON Statistics:
   ✓ Tourism data
   ✓ Population data
   ✓ Water/resource data
   ✓ Any other metrics

3. Folder Structure:
   public/data/[country-name]/
   ├── geojson/
   │   └── [country-name].geojson
   ├── hotels/
   │   └── hotels.geojson
   ├── retail/
   │   └── stores.geojson
   ├── districts/
   │   └── districts.geojson
   └── statistics/
       ├── tourism.json
       ├── water_scarcity.json
       └── population.json

4. Update Constants:
   ✓ COUNTRY_CENTER coordinates
   ✓ COUNTRY_ZOOM level
   ✓ DATA_PATHS
   ✓ Slide titles and descriptions
   ✓ Side panel content

5. Customize Styling:
   ✓ Colors to match country theme
   ✓ Legend entries
   ✓ Layer paint properties
*/
