/**
 * ═══════════════════════════════════════════════════════════════
 * 
 *                     SLIDES CONFIGURATION
 * 
 *           ⭐ THIS IS THE ONLY FILE YOU NEED TO MODIFY ⭐
 * 
 * ═══════════════════════════════════════════════════════════════
 * 
 * This file contains ALL slide definitions for the map.
 * 
 * TO MODIFY THE MAP:
 * 1. Find or add a slide in the array below
 * 2. Modify: camera, layers, legend, or sidePanel
 * 3. Save this file
 * 
 * DO NOT modify any other files (page.tsx, MapLibrary, etc.)
 * Everything else is already configured and working.
 * 
 * ═══════════════════════════════════════════════════════════════
 */

import { SlideConfig } from '@/app/components/MapLibrary';

interface SlideDataProps {
  tourismData?: Array<{
    state: string;
    hotels: number;
    rooms: number;
    tourist_arrivals: number;
  }>;
  waterScarcityData?: Array<{
    state: string;
    water_access_percent: number;
    water_scarcity_percent: number;
  }>;
  hotelsGeoJSON?: GeoJSON.FeatureCollection | null;
  speedmartGeoJSON?: GeoJSON.FeatureCollection | null;
}

/**
 * Create slides with dynamic data
 * Modify the slides array below to change the map
 */
export const createSlides = (data: SlideDataProps): SlideConfig[] => {
  const { tourismData = [], waterScarcityData = [], hotelsGeoJSON, speedmartGeoJSON } = data;

  return [
    // ============================================
    // SLIDE 1: Malaysia Overview
    // ============================================
    {
      id: 'overview',
      title: 'Malaysia Overview',
      description: 'Exploring Malaysia\'s geographic and economic landscape',
      duration: 6000,
      camera: {
        center: [109.6976, 3.1390],
        zoom: 5.5,
        pitch: 0,
        bearing: 0,
      },
      layers: [
        {
          id: 'malaysia-states',
          source: {
            type: 'geojson',
            data: '/data/malaysia/geojson/my.json',
          },
          layers: [
            {
              id: 'states-fill',
              type: 'fill',
              paint: {
                'fill-color': '#E8F4F8',
                'fill-opacity': 0.4,
              },
            },
            {
              id: 'states-outline',
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
        title: 'Map Legend',
        position: 'bottom-left',
        collapsible: true,
        entries: [
          { label: 'State Boundaries', color: '#0077BE', pattern: 'solid' },
          { label: 'State Areas', color: '#E8F4F8' },
        ],
      },
      sidePanel: {
        title: 'Malaysia Overview',
        position: 'right',
        width: '400px',
        collapsible: true,
        defaultExpanded: true,
        content: (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-3 text-gray-800">Country Statistics</h3>
              <div className="space-y-3">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Total States</div>
                  <div className="text-2xl font-bold text-blue-700">13</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Population</div>
                  <div className="text-2xl font-bold text-green-700">32.7M</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Area</div>
                  <div className="text-2xl font-bold text-purple-700">330,803 km²</div>
                </div>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600">
                Malaysia is a Southeast Asian country located partly on a peninsula of the Asian mainland and partly on the northern third of the island of Borneo.
              </p>
            </div>
          </div>
        ),
      },
    },

    // ============================================
    // SLIDE 2: Tourism Infrastructure
    // ============================================
    {
      id: 'tourism-hotels',
      title: 'Tourism Infrastructure',
      description: 'Hotel distribution across Sabah',
      duration: 8000,
      camera: {
        center: [116.0735, 5.9804],
        zoom: 8,
        pitch: 45,
        bearing: -20,
      },
      layers: hotelsGeoJSON ? [
        {
          id: 'hotels-source',
          source: {
            type: 'geojson',
            data: hotelsGeoJSON,
          },
          layers: [
            {
              id: 'hotels-heatmap',
              type: 'heatmap',
              maxzoom: 12,
              paint: {
                'heatmap-weight': 1,
                'heatmap-intensity': 1,
                'heatmap-color': [
                  'interpolate',
                  ['linear'],
                  ['heatmap-density'],
                  0, 'rgba(33,102,172,0)',
                  0.2, 'rgb(103,169,207)',
                  0.4, 'rgb(209,229,240)',
                  0.6, 'rgb(253,219,199)',
                  0.8, 'rgb(239,138,98)',
                  1, 'rgb(178,24,43)',
                ],
                'heatmap-radius': 30,
              },
            },
            {
              id: 'hotels-points',
              type: 'circle',
              minzoom: 10,
              paint: {
                'circle-radius': 8,
                'circle-color': '#FF6B6B',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#FFFFFF',
                'circle-opacity': 0.8,
              },
            },
          ],
        },
      ] : [],
      legend: {
        title: 'Hotels',
        position: 'bottom-left',
        entries: [
          { label: 'Hotel Locations', color: '#FF6B6B' },
          { label: 'High Density', color: 'rgb(178,24,43)' },
          { label: 'Low Density', color: 'rgb(103,169,207)' },
        ],
      },
      sidePanel: {
        title: 'Tourism Statistics',
        position: 'right',
        width: '400px',
        collapsible: true,
        defaultExpanded: true,
        content: (
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Hotel Distribution</h3>
            {hotelsGeoJSON && (
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Hotels in Sabah</div>
                <div className="text-3xl font-bold text-red-700">
                  {hotelsGeoJSON.features?.length || 0}
                </div>
              </div>
            )}
            {tourismData.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-700">By State</h4>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {tourismData
                    .sort((a, b) => b.hotels - a.hotels)
                    .map((state, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{state.state}</span>
                          <span className="text-blue-700 font-bold">{state.hotels}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {state.rooms.toLocaleString()} rooms • {state.tourist_arrivals.toLocaleString()} visitors
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ),
      },
    },

    // ============================================
    // SLIDE 3: Water Access & Scarcity
    // ============================================
    {
      id: 'water-scarcity',
      title: 'Water Access & Scarcity',
      description: 'Understanding water distribution challenges',
      duration: 8000,
      camera: {
        center: [109.6976, 3.1390],
        zoom: 5.5,
        pitch: 0,
        bearing: 0,
      },
      layers: [
        {
          id: 'water-data',
          source: {
            type: 'geojson',
            data: '/data/malaysia/geojson/my.json',
          },
          layers: [
            {
              id: 'water-fill',
              type: 'fill',
              paint: {
                'fill-color': [
                  'match',
                  ['get', 'name'],
                  ...waterScarcityData.flatMap(d => [
                    d.state,
                    d.water_scarcity_percent > 20
                      ? '#EF4444'
                      : d.water_scarcity_percent > 10
                      ? '#F59E0B'
                      : '#10B981',
                  ]),
                  '#E5E7EB',
                ],
                'fill-opacity': 0.7,
              },
            },
            {
              id: 'water-outline',
              type: 'line',
              paint: {
                'line-color': '#1F2937',
                'line-width': 1.5,
              },
            },
          ],
        },
      ],
      legend: {
        title: 'Water Scarcity Level',
        position: 'bottom-left',
        entries: [
          { label: 'Low (<10%)', color: '#10B981' },
          { label: 'Medium (10-20%)', color: '#F59E0B' },
          { label: 'High (>20%)', color: '#EF4444' },
        ],
      },
      sidePanel: {
        title: 'Water Access Statistics',
        position: 'right',
        width: '400px',
        collapsible: true,
        defaultExpanded: true,
        content: (
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Water Scarcity Analysis</h3>
            {waterScarcityData.length > 0 && (
              <div className="space-y-2">
                <div className="max-h-[500px] overflow-y-auto space-y-2">
                  {waterScarcityData
                    .sort((a, b) => b.water_scarcity_percent - a.water_scarcity_percent)
                    .map((state, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-l-4 ${
                          state.water_scarcity_percent > 20
                            ? 'bg-red-50 border-red-500'
                            : state.water_scarcity_percent > 10
                            ? 'bg-yellow-50 border-yellow-500'
                            : 'bg-green-50 border-green-500'
                        }`}
                      >
                        <div className="font-semibold text-gray-800">{state.state}</div>
                        <div className="mt-2 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Water Access:</span>
                            <span className="font-semibold text-green-700">
                              {state.water_access_percent}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Scarcity Level:</span>
                            <span className={`font-semibold ${
                              state.water_scarcity_percent > 20
                                ? 'text-red-700'
                                : state.water_scarcity_percent > 10
                                ? 'text-yellow-700'
                                : 'text-green-700'
                            }`}>
                              {state.water_scarcity_percent.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ),
      },
    },

    // ============================================
    // SLIDE 4: SpeedMart Retail Network
    // ============================================
    {
      id: 'speedmart-network',
      title: 'Retail Distribution Network',
      description: '99 SpeedMart store locations across Sabah',
      duration: 8000,
      camera: {
        center: [116.0735, 5.9804],
        zoom: 8.5,
        pitch: 35,
        bearing: 0,
      },
      layers: speedmartGeoJSON ? [
        {
          id: 'speedmart-source',
          source: {
            type: 'geojson',
            data: speedmartGeoJSON,
          },
          layers: [
            {
              id: 'speedmart-points',
              type: 'circle',
              paint: {
                'circle-radius': 6,
                'circle-color': '#00C851',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#FFFFFF',
                'circle-opacity': 0.9,
              },
            },
            {
              id: 'speedmart-labels',
              type: 'symbol',
              minzoom: 11,
              layout: {
                'text-field': ['get', 'name'],
                'text-size': 10,
                'text-offset': [0, 1.5],
                'text-anchor': 'top',
              },
              paint: {
                'text-color': '#000000',
                'text-halo-color': '#FFFFFF',
                'text-halo-width': 2,
              },
            },
          ],
        },
      ] : [],
      legend: {
        title: 'Retail Network',
        position: 'bottom-left',
        entries: [
          { label: '99 SpeedMart Stores', color: '#00C851' },
        ],
      },
      sidePanel: {
        title: 'Retail Network',
        position: 'right',
        width: '400px',
        collapsible: true,
        defaultExpanded: true,
        content: (
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">99 SpeedMart Network</h3>
            {speedmartGeoJSON && (
              <>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Total Stores in Sabah</div>
                  <div className="text-3xl font-bold text-green-700">
                    {speedmartGeoJSON.features?.length || 0}
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Coverage Area</div>
                  <div className="text-xl font-bold text-blue-700">Sabah State</div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Store Distribution</h4>
                  <p className="text-sm text-gray-600">
                    99 SpeedMart stores are strategically located across Sabah to provide convenient access to daily necessities for local communities.
                  </p>
                </div>
              </>
            )}
          </div>
        ),
      },
    },
  ];
};
