'use client';

import { useEffect, useRef, RefObject } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapInteractionHandlers } from '../types';

/**
 * Hook to handle map click interactions
 */
export const useMapClick = (
  map: mapboxgl.Map | null,
  handlers: MapInteractionHandlers,
  layerIds?: string[]
) => {
  useEffect(() => {
    if (!map || !handlers.onClick) return;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const features = layerIds
        ? map.queryRenderedFeatures(e.point, { layers: layerIds })
        : map.queryRenderedFeatures(e.point);

      handlers.onClick!(e, features as GeoJSON.Feature[]);
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, handlers, layerIds]);
};

/**
 * Hook to handle map hover interactions
 */
export const useMapHover = (
  map: mapboxgl.Map | null,
  handlers: MapInteractionHandlers,
  layerIds?: string[]
) => {
  useEffect(() => {
    if (!map || !handlers.onHover) return;

    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      const features = layerIds
        ? map.queryRenderedFeatures(e.point, { layers: layerIds })
        : map.queryRenderedFeatures(e.point);

      handlers.onHover!(e, features as GeoJSON.Feature[]);
    };

    map.on('mousemove', handleMouseMove);
    return () => {
      map.off('mousemove', handleMouseMove);
    };
  }, [map, handlers, layerIds]);
};

/**
 * Hook to handle map load event
 */
export const useMapLoad = (
  map: mapboxgl.Map | null,
  onLoad?: (map: mapboxgl.Map) => void
) => {
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!map || !onLoad || hasLoaded.current) return;

    if (map.loaded()) {
      hasLoaded.current = true;
      onLoad(map);
    } else {
      const handleLoad = () => {
        hasLoaded.current = true;
        onLoad(map);
      };

      map.on('load', handleLoad);
      return () => {
        map.off('load', handleLoad);
      };
    }
  }, [map, onLoad]);
};

/**
 * Hook to handle map movement
 */
export const useMapMove = (
  map: mapboxgl.Map | null,
  onMoveEnd?: (map: mapboxgl.Map) => void,
  onZoomEnd?: (map: mapboxgl.Map) => void
) => {
  useEffect(() => {
    if (!map) return;

    const handleMoveEnd = () => {
      if (onMoveEnd) onMoveEnd(map);
    };

    const handleZoomEnd = () => {
      if (onZoomEnd) onZoomEnd(map);
    };

    if (onMoveEnd) map.on('moveend', handleMoveEnd);
    if (onZoomEnd) map.on('zoomend', handleZoomEnd);

    return () => {
      if (onMoveEnd) map.off('moveend', handleMoveEnd);
      if (onZoomEnd) map.off('zoomend', handleZoomEnd);
    };
  }, [map, onMoveEnd, onZoomEnd]);
};

/**
 * Hook to manage layer visibility
 */
export const useLayerVisibility = (
  map: mapboxgl.Map | null,
  layerId: string,
  visible: boolean
) => {
  useEffect(() => {
    if (!map || !map.getLayer(layerId)) return;

    map.setLayoutProperty(
      layerId,
      'visibility',
      visible ? 'visible' : 'none'
    );
  }, [map, layerId, visible]);
};

/**
 * Hook to add and remove GeoJSON source
 */
export const useGeoJSONSource = (
  map: mapboxgl.Map | null,
  sourceId: string,
  data: GeoJSON.FeatureCollection | string | null
) => {
  useEffect(() => {
    if (!map || !data) return;

    // Add source if it doesn't exist
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: typeof data === 'string' ? data : data,
      });
    } else {
      // Update existing source
      const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
      if (typeof data !== 'string') {
        source.setData(data);
      }
    }

    return () => {
      // Cleanup: remove source when component unmounts
      if (map.getSource(sourceId)) {
        // First remove all layers using this source
        const layers = map.getStyle()?.layers || [];
        layers.forEach((layer: any) => {
          if (layer.source === sourceId && map.getLayer(layer.id)) {
            map.removeLayer(layer.id);
          }
        });
        map.removeSource(sourceId);
      }
    };
  }, [map, sourceId, data]);
};

/**
 * Hook to manage map popup
 */
export const useMapPopup = (
  map: mapboxgl.Map | null,
  coordinates: [number, number] | null,
  content: string | HTMLElement | null
) => {
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  useEffect(() => {
    if (!map || !coordinates || !content) {
      // Remove popup if it exists
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      return;
    }

    // Create or update popup
    if (!popupRef.current) {
      popupRef.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
      });
    }

    popupRef.current
      .setLngLat(coordinates)
      .setHTML(typeof content === 'string' ? content : content.innerHTML)
      .addTo(map);

    return () => {
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    };
  }, [map, coordinates, content]);

  return popupRef;
};

/**
 * Hook to fit map bounds
 */
export const useFitBounds = (
  map: mapboxgl.Map | null,
  bounds: mapboxgl.LngLatBoundsLike | null,
  padding?: number | mapboxgl.PaddingOptions
) => {
  useEffect(() => {
    if (!map || !bounds) return;

    map.fitBounds(bounds, {
      padding: padding || 50,
      duration: 1000,
    });
  }, [map, bounds, padding]);
};

/**
 * Hook to manage map cursor
 */
export const useMapCursor = (
  map: mapboxgl.Map | null,
  cursor: string = 'pointer',
  layerIds?: string[]
) => {
  useEffect(() => {
    if (!map) return;

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = cursor;
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    if (layerIds && layerIds.length > 0) {
      layerIds.forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.on('mouseenter', layerId, handleMouseEnter);
          map.on('mouseleave', layerId, handleMouseLeave);
        }
      });

      return () => {
        layerIds.forEach((layerId) => {
          if (map.getLayer(layerId)) {
            map.off('mouseenter', layerId, handleMouseEnter);
            map.off('mouseleave', layerId, handleMouseLeave);
          }
        });
      };
    }
  }, [map, cursor, layerIds]);
};
