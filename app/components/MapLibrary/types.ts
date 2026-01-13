import mapboxgl from 'mapbox-gl';
import { ReactNode } from 'react';

/**
 * GeoJSON Layer Configuration
 */
export interface GeoJSONLayerConfig {
  id: string;
  source: {
    type: 'geojson';
    data: GeoJSON.FeatureCollection | string; // GeoJSON object or URL
  };
  layers: Array<{
    id: string;
    type: 'fill' | 'line' | 'circle' | 'symbol' | 'heatmap' | 'fill-extrusion';
    paint?: any;
    layout?: any;
    filter?: any[];
    minzoom?: number;
    maxzoom?: number;
  }>;
}

/**
 * Legend Entry Configuration
 */
export interface LegendEntry {
  label: string;
  color?: string;
  icon?: ReactNode;
  pattern?: 'solid' | 'dashed' | 'dotted';
  size?: 'small' | 'medium' | 'large';
  description?: string;
}

/**
 * Legend Configuration
 */
export interface LegendConfig {
  title?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  entries: LegendEntry[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

/**
 * Side Panel Configuration
 */
export interface SidePanelConfig {
  title?: string;
  position?: 'left' | 'right';
  width?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  content?: ReactNode;
  className?: string;
}

/**
 * Map Animation Configuration
 */
export interface AnimationConfig {
  duration?: number;
  easing?: (t: number) => number;
  essential?: boolean;
}

/**
 * Map Camera Configuration
 */
export interface CameraConfig {
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
  animation?: AnimationConfig;
}

/**
 * Map Interaction Handlers
 */
export interface MapInteractionHandlers {
  onClick?: (e: mapboxgl.MapMouseEvent, features?: GeoJSON.Feature[]) => void;
  onHover?: (e: mapboxgl.MapMouseEvent, features?: GeoJSON.Feature[]) => void;
  onLoad?: (map: mapboxgl.Map) => void;
  onMoveEnd?: (map: mapboxgl.Map) => void;
  onZoomEnd?: (map: mapboxgl.Map) => void;
}

/**
 * Slide Configuration
 */
export interface SlideConfig {
  id: string;
  title: string;
  description?: string;
  camera?: CameraConfig;
  layers?: GeoJSONLayerConfig[];
  legend?: LegendConfig;
  sidePanel?: SidePanelConfig;
  duration?: number; // Auto-advance duration in ms
  onEnter?: (map: mapboxgl.Map) => void | Promise<void>;
  onExit?: (map: mapboxgl.Map) => void | Promise<void>;
  interactionHandlers?: MapInteractionHandlers;
}

/**
 * Slideshow Configuration
 */
export interface SlideshowConfig {
  slides: SlideConfig[];
  autoPlay?: boolean;
  loop?: boolean;
  transitionDuration?: number;
  showControls?: boolean;
  showProgress?: boolean;
}

/**
 * Map Library Main Configuration
 */
export interface MapLibraryConfig {
  mapboxAccessToken: string;
  container?: string;
  style?: string | mapboxgl.Style;
  initialCamera?: CameraConfig;
  bounds?: mapboxgl.LngLatBoundsLike;
  layers?: GeoJSONLayerConfig[];
  legend?: LegendConfig;
  sidePanel?: SidePanelConfig;
  slideshow?: SlideshowConfig;
  interactionHandlers?: MapInteractionHandlers;
  controls?: {
    navigation?: boolean;
    fullscreen?: boolean;
    scale?: boolean;
    geolocate?: boolean;
  };
}

/**
 * Layer Visibility State
 */
export interface LayerVisibilityState {
  [layerId: string]: boolean;
}

/**
 * Map State
 */
export interface MapState {
  loaded: boolean;
  currentSlide?: number;
  layerVisibility: LayerVisibilityState;
  camera: {
    center: [number, number];
    zoom: number;
    pitch: number;
    bearing: number;
  };
}

/**
 * Popup Configuration
 */
export interface PopupConfig {
  coordinates: [number, number];
  content: ReactNode | string;
  className?: string;
  closeButton?: boolean;
  closeOnClick?: boolean;
  maxWidth?: string;
}

/**
 * Filter Configuration
 */
export interface FilterConfig {
  layerId: string;
  filter: any[];
}

/**
 * Data Source Configuration
 */
export interface DataSourceConfig {
  id: string;
  type: 'geojson' | 'vector' | 'raster' | 'raster-dem' | 'image' | 'video';
  url?: string;
  data?: any;
  tiles?: string[];
  bounds?: [number, number, number, number];
  minzoom?: number;
  maxzoom?: number;
  attribution?: string;
}
