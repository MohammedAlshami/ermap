/** One layer entry in a slide: layer id + display type */
export interface SlideLayerEntryDto {
  layerId: string;
  type: 'markers' | 'heatmap';
}

/** Slide as sent from frontend / returned by tools */
export interface SlideDto {
  id: string;
  title: string;
  layerEntries: SlideLayerEntryDto[];
  descriptionHtml: string;
  contentPosition?: string;
}

/** GeoJSON FeatureCollection of polygons drawn on the map (Mapbox Draw). */
export interface DrawnPolygonsGeoJSON {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    id?: string;
    properties?: Record<string, unknown>;
    geometry: { type: 'Polygon'; coordinates: number[][][] };
  }>;
}

export interface ChatBodyDto {
  message: string;
  session_id?: string;
  /** Current slides JSON (array of SlideDto) so the agent can add/remove */
  slides?: SlideDto[] | null;
  /** Current selected layer ids (visible on map) so the agent can select/remove layers */
  selected_layer_ids?: string[] | null;
  /** Drawn polygons from Mapbox Draw so the agent can run detection in that area */
  drawn_polygons_geojson?: DrawnPolygonsGeoJSON | null;
  /** Mapbox access token (e.g. frontend VITE_MAPBOX_TOKEN) for server to fetch satellite imagery when running detection */
  mapbox_access_token?: string | null;
}
