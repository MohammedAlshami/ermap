import type { GeoJSONLayerConfig, SlideConfig, SlideContentPosition } from '~/components/MapLibrary';

export interface LayerOption {
  id: string;
  name: string;
  url: string;
  geometry: 'point' | 'polygon' | 'mixed';
  color: string;
}

export type SlideLayerType = 'markers' | 'heatmap';

export const LAYER_OPTIONS: LayerOption[] = [
  { id: 'malaysia', name: 'Malaysia (country outline)', url: '/api/files/malaysia', geometry: 'polygon', color: '#93c5fd' },
  { id: 'malaysia_district', name: 'Malaysia districts', url: '/api/files/malaysia_district', geometry: 'polygon', color: '#e5e7eb' },
  { id: 'education_centers', name: 'Education centers', url: '/api/files/education_centers_malaysia', geometry: 'mixed', color: '#f97316' },
  { id: 'family_mart', name: 'Family Mart stores', url: '/api/files/family_mart', geometry: 'point', color: '#22c55e' },
  { id: 'power_data', name: 'Power (towers, substations, plants)', url: '/api/files/power_data', geometry: 'mixed', color: '#ef4444' },
  { id: 'sabah_hotels', name: 'Sabah hotels', url: '/api/files/sabah_hotels', geometry: 'point', color: '#a855f7' },
  { id: 'sabah_speedmart', name: 'Sabah SpeedMart', url: '/api/files/sabah_speedmart', geometry: 'point', color: '#14b8a6' },
  { id: 'global_landslide_catalog', name: 'Global Landslide Catalog', url: '/api/files/global_landslide_catalog', geometry: 'point', color: '#b45309' },
];

export function buildLayerConfigWithType(opt: LayerOption, displayType: SlideLayerType): GeoJSONLayerConfig {
  const sourceId = `source-${opt.id}`;
  const layers: GeoJSONLayerConfig['layers'] = [];
  const hasPoints = opt.geometry === 'point' || opt.geometry === 'mixed';
  const hasPolygons = opt.geometry === 'polygon' || opt.geometry === 'mixed';

  if (hasPoints && displayType === 'heatmap') {
    layers.push({
      id: `layer-${opt.id}-heatmap`,
      type: 'heatmap',
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'heatmap-weight': 1,
        'heatmap-intensity': 1,
        'heatmap-radius': 15,
        'heatmap-opacity': 0.7,
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(0,0,0,0)',
          0.2, opt.color,
          0.5, opt.color,
          1, opt.color,
        ],
      },
    });
  } else {
    if (hasPoints) {
      layers.push({
        id: `layer-${opt.id}-points`,
        type: 'circle',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': opt.geometry === 'mixed' ? 5 : 7,
          'circle-color': opt.color,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff',
        },
      });
    }
    if (hasPolygons) {
      layers.push({
        id: `layer-${opt.id}-fill`,
        type: 'fill',
        filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
        paint: {
          'fill-color': opt.color,
          'fill-opacity': 0.5,
          'fill-outline-color': opt.color,
        },
      });
    }
  }

  return {
    id: sourceId,
    source: { type: 'geojson', data: opt.url },
    layers,
  };
}

export interface CustomSlideInput {
  id: string;
  title: string;
  layerEntries?: { layerId: string; type: SlideLayerType }[];
  descriptionHtml?: string;
  contentPosition?: SlideContentPosition;
}

export interface ProjectConfigInput {
  slides: CustomSlideInput[];
  mapStyle?: 'standard' | 'satellite';
  selectedLayerIds?: string[];
}

export function buildSlideshowSlidesFromConfig(slides: CustomSlideInput[]): SlideConfig[] {
  return slides.map((s) => {
    const entries = s.layerEntries ?? [];
    const layerConfigs = entries
      .map((e) => {
        const opt = LAYER_OPTIONS.find((o) => o.id === e.layerId);
        return opt ? buildLayerConfigWithType(opt, e.type) : null;
      })
      .filter((c): c is GeoJSONLayerConfig => c != null);
    const legendEntriesSlide = entries
      .map((e) => LAYER_OPTIONS.find((o) => o.id === e.layerId))
      .filter((o): o is LayerOption => !!o)
      .map((opt) => ({ label: opt.name, color: opt.color }));
    return {
      id: s.id,
      title: s.title,
      description: s.descriptionHtml,
      contentPosition: (s.contentPosition ?? 'bottom-center') as SlideContentPosition,
      duration: 5000,
      camera: { center: [101.9758, 4.2105] as [number, number], zoom: 6, pitch: 0, bearing: 0 },
      layers: layerConfigs,
      legend:
        legendEntriesSlide.length > 0
          ? { title: 'Layers', position: 'bottom-left' as const, entries: legendEntriesSlide }
          : undefined,
    };
  });
}
