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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = config.mapboxAccessToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: config.style || 'mapbox://styles/mapbox/light-v11',
      center: config.initialCamera?.center || [0, 0],
      zoom: config.initialCamera?.zoom || 2,
      pitch: config.initialCamera?.pitch || 0,
      bearing: config.initialCamera?.bearing || 0,
      bounds: config.bounds,
    });

    // Add controls
    if (config.controls?.navigation !== false) {
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    }

    if (config.controls?.fullscreen) {
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    }

    if (config.controls?.scale) {
      map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
    }

    if (config.controls?.geolocate) {
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
        }),
        'top-right'
      );
    }

    map.current.on('load', () => {
      setMapLoaded(true);
      if (onMapLoad && map.current) {
        onMapLoad(map.current);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [config, onMapLoad]);

  // Add layers when map is loaded
  useEffect(() => {
    if (!map.current || !mapLoaded || !config.layers) return;

    config.layers.forEach((layerConfig: GeoJSONLayerConfig) => {
      // Add source
      if (!map.current!.getSource(layerConfig.id)) {
        map.current!.addSource(layerConfig.id, layerConfig.source as any);
      }

      // Add layers
      layerConfig.layers.forEach((layer) => {
        if (!map.current!.getLayer(layer.id)) {
          map.current!.addLayer({
            id: layer.id,
            type: layer.type,
            source: layerConfig.id,
            paint: layer.paint,
            layout: layer.layout,
            filter: layer.filter,
            minzoom: layer.minzoom,
            maxzoom: layer.maxzoom,
          } as any);
        }
      });
    });
  }, [mapLoaded, config.layers]);

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
    <div className={`relative w-full h-full ${className}`}>
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />

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
