# Map Library Documentation

A powerful, customizable React map library built on Mapbox GL JS with support for slideshows, legends, side panels, and more.

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Components](#components)
4. [Configuration](#configuration)
5. [Examples](#examples)
6. [API Reference](#api-reference)

## Installation

The library is already included in your project under `app/components/MapLibrary/`.

Required dependencies:
- `mapbox-gl` - Mapbox GL JS library
- `react` & `react-dom` - React framework

## Quick Start

```tsx
import { MapLibrary } from './components/MapLibrary';

export default function MyMapPage() {
  const config = {
    mapboxAccessToken: 'YOUR_MAPBOX_TOKEN',
    initialCamera: {
      center: [101.9758, 4.2105], // Malaysia
      zoom: 6,
    },
    legend: {
      title: 'Legend',
      position: 'bottom-left',
      entries: [
        { label: 'Hotels', color: '#FF5733' },
        { label: 'Stores', color: '#33FF57' },
      ],
    },
  };

  return (
    <div className="w-full h-screen">
      <MapLibrary config={config} />
    </div>
  );
}
```

## Components

### MapLibrary (Main Component)

The main map container that orchestrates all other components.

```tsx
<MapLibrary
  config={mapConfig}
  onMapLoad={(map) => console.log('Map loaded!', map)}
  className="custom-map"
/>
```

### Legend

Displays a customizable legend with colors, icons, and labels.

```tsx
const legendConfig = {
  title: 'Map Legend',
  position: 'bottom-left',
  collapsible: true,
  defaultExpanded: true,
  entries: [
    { 
      label: 'High Density', 
      color: '#FF0000',
      description: 'Population > 10,000/km²'
    },
    { 
      label: 'Medium Density', 
      color: '#FFFF00' 
    },
    { 
      label: 'Low Density', 
      color: '#00FF00' 
    },
  ],
};
```

### SidePanel

A collapsible side panel for displaying additional content.

```tsx
const sidePanelConfig = {
  title: 'Statistics',
  position: 'right',
  width: '400px',
  collapsible: true,
  defaultExpanded: true,
  content: <YourCustomContent />,
};
```

### Slideshow

Create interactive presentations with automatic transitions between map views.

```tsx
const slideshowConfig = {
  autoPlay: true,
  loop: true,
  showControls: true,
  showProgress: true,
  transitionDuration: 1000,
  slides: [
    {
      id: 'slide-1',
      title: 'Overview',
      description: 'Malaysia Overview',
      duration: 5000, // 5 seconds
      camera: {
        center: [101.9758, 4.2105],
        zoom: 6,
      },
      layers: [/* layer configs */],
      legend: {/* legend config */},
    },
    // More slides...
  ],
};
```

## Configuration

### MapLibraryConfig

Main configuration object for the map library.

```typescript
interface MapLibraryConfig {
  // Required
  mapboxAccessToken: string;
  
  // Optional
  style?: string | mapboxgl.Style; // Default: 'mapbox://styles/mapbox/light-v11'
  initialCamera?: CameraConfig;
  bounds?: mapboxgl.LngLatBoundsLike;
  layers?: GeoJSONLayerConfig[];
  legend?: LegendConfig;
  sidePanel?: SidePanelConfig;
  slideshow?: SlideshowConfig;
  interactionHandlers?: MapInteractionHandlers;
  controls?: {
    navigation?: boolean; // Default: true
    fullscreen?: boolean;
    scale?: boolean;
    geolocate?: boolean;
  };
}
```

### GeoJSONLayerConfig

Configure GeoJSON layers with custom styling.

```typescript
const layerConfig: GeoJSONLayerConfig = {
  id: 'hotels-source',
  source: {
    type: 'geojson',
    data: '/data/malaysia/hotels/sabah_hotels.geojson',
  },
  layers: [
    {
      id: 'hotels-circle',
      type: 'circle',
      paint: {
        'circle-radius': 6,
        'circle-color': '#FF5733',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#FFFFFF',
      },
    },
    {
      id: 'hotels-labels',
      type: 'symbol',
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 12,
        'text-offset': [0, 1.5],
      },
      paint: {
        'text-color': '#000000',
        'text-halo-color': '#FFFFFF',
        'text-halo-width': 2,
      },
    },
  ],
};
```

### SlideConfig

Configure individual slides with layers and interactions.

```typescript
const slide: SlideConfig = {
  id: 'water-scarcity',
  title: 'Water Scarcity Analysis',
  description: 'Areas with limited water access',
  duration: 8000, // 8 seconds auto-advance
  
  camera: {
    center: [116.0735, 5.9804], // Sabah
    zoom: 8,
    pitch: 45,
    bearing: -20,
  },
  
  layers: [
    {
      id: 'water-data',
      source: {
        type: 'geojson',
        data: '/data/malaysia/statistics/water_scarcity.json',
      },
      layers: [
        {
          id: 'water-fill',
          type: 'fill',
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['get', 'scarcity_percent'],
              0, '#00FF00',
              50, '#FFFF00',
              100, '#FF0000',
            ],
            'fill-opacity': 0.7,
          },
        },
      ],
    },
  ],
  
  legend: {
    title: 'Water Scarcity',
    entries: [
      { label: 'Low (0-30%)', color: '#00FF00' },
      { label: 'Medium (30-60%)', color: '#FFFF00' },
      { label: 'High (60-100%)', color: '#FF0000' },
    ],
  },
  
  onEnter: async (map) => {
    console.log('Entered water scarcity slide');
    // Custom animations or data loading
  },
  
  onExit: async (map) => {
    console.log('Exiting water scarcity slide');
    // Cleanup
  },
};
```

## Examples

### Example 1: Basic Map with Layers

```tsx
'use client';

import { MapLibrary, MapLibraryConfig } from '@/app/components/MapLibrary';

export default function BasicMap() {
  const config: MapLibraryConfig = {
    mapboxAccessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN!,
    
    initialCamera: {
      center: [101.9758, 4.2105],
      zoom: 6,
    },
    
    layers: [
      {
        id: 'hotels',
        source: {
          type: 'geojson',
          data: '/data/malaysia/hotels/sabah_hotels.geojson',
        },
        layers: [
          {
            id: 'hotels-markers',
            type: 'circle',
            paint: {
              'circle-radius': 8,
              'circle-color': '#FF5733',
            },
          },
        ],
      },
    ],
    
    legend: {
      title: 'Hotels',
      position: 'bottom-left',
      entries: [
        { label: 'Hotel Locations', color: '#FF5733' },
      ],
    },
    
    controls: {
      navigation: true,
      fullscreen: true,
      scale: true,
    },
  };

  return (
    <div className="w-full h-screen">
      <MapLibrary config={config} />
    </div>
  );
}
```

### Example 2: Map with Side Panel

```tsx
'use client';

import { MapLibrary, MapLibraryConfig } from '@/app/components/MapLibrary';

export default function MapWithPanel() {
  const config: MapLibraryConfig = {
    mapboxAccessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN!,
    
    initialCamera: {
      center: [116.0735, 5.9804],
      zoom: 8,
    },
    
    sidePanel: {
      title: 'District Statistics',
      position: 'right',
      width: '400px',
      collapsible: true,
      defaultExpanded: true,
      content: (
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-bold">Water Access Data</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Districts:</span>
              <span className="font-semibold">23</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Water Access:</span>
              <span className="font-semibold">87.5%</span>
            </div>
          </div>
        </div>
      ),
    },
  };

  return (
    <div className="w-full h-screen">
      <MapLibrary config={config} />
    </div>
  );
}
```

### Example 3: Interactive Slideshow

```tsx
'use client';

import { MapLibrary, MapLibraryConfig, SlideConfig } from '@/app/components/MapLibrary';

export default function SlideshowMap() {
  const slides: SlideConfig[] = [
    {
      id: 'overview',
      title: 'Malaysia Overview',
      description: 'Country-wide view',
      duration: 5000,
      camera: {
        center: [101.9758, 4.2105],
        zoom: 6,
      },
      legend: {
        entries: [
          { label: 'States', color: '#E8F4F8' },
        ],
      },
    },
    {
      id: 'hotels',
      title: 'Hotel Distribution',
      description: 'Tourist accommodations in Sabah',
      duration: 8000,
      camera: {
        center: [116.0735, 5.9804],
        zoom: 8,
      },
      layers: [
        {
          id: 'hotels-data',
          source: {
            type: 'geojson',
            data: '/data/malaysia/hotels/sabah_hotels.geojson',
          },
          layers: [
            {
              id: 'hotels-points',
              type: 'circle',
              paint: {
                'circle-radius': 6,
                'circle-color': '#FF5733',
              },
            },
          ],
        },
      ],
      legend: {
        entries: [
          { label: 'Hotels', color: '#FF5733' },
        ],
      },
    },
    {
      id: 'speedmart',
      title: 'Retail Network',
      description: 'SpeedMart store locations',
      duration: 8000,
      camera: {
        center: [116.0735, 5.9804],
        zoom: 9,
      },
      layers: [
        {
          id: 'speedmart-data',
          source: {
            type: 'geojson',
            data: '/data/malaysia/speedmart/sabah_speedmart.geojson',
          },
          layers: [
            {
              id: 'speedmart-points',
              type: 'circle',
              paint: {
                'circle-radius': 5,
                'circle-color': '#00C851',
              },
            },
          ],
        },
      ],
      legend: {
        entries: [
          { label: 'SpeedMart Stores', color: '#00C851' },
        ],
      },
    },
  ];

  const config: MapLibraryConfig = {
    mapboxAccessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN!,
    
    style: 'mapbox://styles/mapbox/light-v11',
    
    slideshow: {
      slides,
      autoPlay: false,
      loop: true,
      showControls: true,
      showProgress: true,
      transitionDuration: 1500,
    },
  };

  return (
    <div className="w-full h-screen">
      <MapLibrary config={config} />
    </div>
  );
}
```

### Example 4: Multi-Country Setup

```tsx
'use client';

import { useState } from 'react';
import { MapLibrary, MapLibraryConfig } from '@/app/components/MapLibrary';

type Country = 'malaysia' | 'thailand' | 'singapore';

export default function MultiCountryMap() {
  const [selectedCountry, setSelectedCountry] = useState<Country>('malaysia');
  
  const countryConfigs: Record<Country, MapLibraryConfig> = {
    malaysia: {
      mapboxAccessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN!,
      initialCamera: {
        center: [101.9758, 4.2105],
        zoom: 6,
      },
      layers: [
        {
          id: 'malaysia-hotels',
          source: {
            type: 'geojson',
            data: '/data/malaysia/hotels/sabah_hotels.geojson',
          },
          layers: [
            {
              id: 'hotels',
              type: 'circle',
              paint: { 'circle-radius': 6, 'circle-color': '#FF5733' },
            },
          ],
        },
      ],
    },
    thailand: {
      mapboxAccessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN!,
      initialCamera: {
        center: [100.5018, 13.7563],
        zoom: 6,
      },
      // Add Thailand-specific layers here
      layers: [],
    },
    singapore: {
      mapboxAccessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN!,
      initialCamera: {
        center: [103.8198, 1.3521],
        zoom: 11,
      },
      // Add Singapore-specific layers here
      layers: [],
    },
  };

  return (
    <div className="w-full h-screen relative">
      {/* Country Selector */}
      <div className="absolute top-4 left-4 z-30 bg-white rounded-lg shadow-lg p-2">
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value as Country)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="malaysia">Malaysia</option>
          <option value="thailand">Thailand</option>
          <option value="singapore">Singapore</option>
        </select>
      </div>
      
      <MapLibrary config={countryConfigs[selectedCountry]} />
    </div>
  );
}
```

## API Reference

### Custom Hooks

#### useMapClick
```typescript
useMapClick(
  map: mapboxgl.Map | null,
  handlers: MapInteractionHandlers,
  layerIds?: string[]
)
```

#### useMapHover
```typescript
useMapHover(
  map: mapboxgl.Map | null,
  handlers: MapInteractionHandlers,
  layerIds?: string[]
)
```

#### useGeoJSONSource
```typescript
useGeoJSONSource(
  map: mapboxgl.Map | null,
  sourceId: string,
  data: GeoJSON.FeatureCollection | string | null
)
```

#### useLayerVisibility
```typescript
useLayerVisibility(
  map: mapboxgl.Map | null,
  layerId: string,
  visible: boolean
)
```

### Interaction Handlers

```typescript
const handlers: MapInteractionHandlers = {
  onClick: (e, features) => {
    console.log('Clicked at:', e.lngLat);
    console.log('Features:', features);
  },
  onHover: (e, features) => {
    console.log('Hovering over:', features);
  },
  onLoad: (map) => {
    console.log('Map loaded:', map);
  },
  onMoveEnd: (map) => {
    console.log('Map moved:', map.getCenter());
  },
  onZoomEnd: (map) => {
    console.log('Zoom level:', map.getZoom());
  },
};
```

## Best Practices

1. **Data Organization**: Keep country-specific data in separate folders (`/data/malaysia/`, `/data/thailand/`, etc.)

2. **Performance**: Load data conditionally based on the current view or slide

3. **Type Safety**: Use TypeScript interfaces for all configurations

4. **Reusability**: Create separate config files for different map views

5. **Responsive Design**: Adjust panel widths and legend positions based on screen size

## Support

For issues or questions, refer to:
- Mapbox GL JS documentation: https://docs.mapbox.com/mapbox-gl-js/
- This library's type definitions in `types.ts`
