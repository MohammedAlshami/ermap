import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BuildingService } from '../buildings/building.service';
import { TreeService } from '../trees/tree.service';
import { maskToGeoJSON, type GeoJSONFeatureCollection } from './mask-to-geojson';

const MAPBOX_SATELLITE_STYLE = 'mapbox/satellite-v9';
const IMAGE_SIZE = 512;

/** Compute zoom level so the bbox fits in a square image of sizePx. */
function getZoomForBbox(
  bbox: [number, number, number, number],
  sizePx: number,
): number {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const lngSpan = Math.max(maxLng - minLng, 0.0001);
  const latSpan = Math.max(maxLat - minLat, 0.0001);
  const zLng = Math.log2((sizePx * 360) / (256 * lngSpan));
  const zLat = Math.log2((sizePx * 180) / (256 * latSpan));
  const z = Math.min(zLng, zLat);
  return Math.max(0, Math.min(22, Math.floor(z)));
}

export type DetectionType = 'buildings' | 'trees' | 'both';

export interface DetectionGeoJSONResult {
  geojson: GeoJSONFeatureCollection;
}

export interface DetectInAreaResult {
  bbox: [number, number, number, number];
  buildings?: DetectionGeoJSONResult;
  trees?: DetectionGeoJSONResult;
}

@Injectable()
export class DetectionService {
  constructor(
    private readonly config: ConfigService,
    private readonly buildingService: BuildingService,
    private readonly treeService: TreeService,
  ) {}

  /** Fetch Mapbox static satellite image for a bbox. */
  private async fetchMapboxStaticImage(
    bbox: [number, number, number, number],
    tokenOverride?: string,
  ): Promise<Buffer> {
    const token =
      tokenOverride?.trim() ||
      this.config.get<string>('MAPBOX_ACCESS_TOKEN')?.trim() ||
      this.config.get<string>('VITE_MAPBOX_TOKEN')?.trim();
    if (!token) {
      throw new Error(
        'Mapbox token required: set MAPBOX_ACCESS_TOKEN or VITE_MAPBOX_TOKEN in backend .env or send mapbox_access_token in the request.',
      );
    }
    const [minLng, minLat, maxLng, maxLat] = bbox;
    // Use center + zoom (satellite-v9 works reliably with this; bbox can 422 for some styles)
    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;
    const zoom = getZoomForBbox(bbox, IMAGE_SIZE);
    const url = `https://api.mapbox.com/styles/v1/${MAPBOX_SATELLITE_STYLE}/static/${centerLng},${centerLat},${zoom}/${IMAGE_SIZE}x${IMAGE_SIZE}@2x?access_token=${token}`;
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Mapbox static image failed: ${res.status} ${res.statusText}. ${body || ''}`.trim(),
      );
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async detectInArea(
    bbox: [number, number, number, number],
    detectionType: DetectionType,
    mapboxAccessToken?: string,
  ): Promise<DetectInAreaResult> {
    const imageBuffer = await this.fetchMapboxStaticImage(
      bbox,
      mapboxAccessToken,
    );
    const result: DetectInAreaResult = { bbox };

    if (detectionType === 'buildings' || detectionType === 'both') {
      const raw = await this.buildingService.detectBuildings(imageBuffer);
      const geojson = maskToGeoJSON(raw.mask, raw.width, raw.height, bbox);
      result.buildings = { geojson };
    }
    if (detectionType === 'trees' || detectionType === 'both') {
      const raw = await this.treeService.detectTrees(imageBuffer);
      const geojson = maskToGeoJSON(raw.mask, raw.width, raw.height, bbox);
      result.trees = { geojson };
    }

    return result;
  }
}
