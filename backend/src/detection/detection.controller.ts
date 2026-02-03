import {
  Controller,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { DetectionService } from './detection.service';

class DetectInAreaDto {
  bbox!: [number, number, number, number];
  detection_type!: 'buildings' | 'trees' | 'both';
  /** Optional: Mapbox access token (e.g. from frontend VITE_MAPBOX_TOKEN) to fetch satellite imagery. If omitted, backend uses MAPBOX_ACCESS_TOKEN from .env */
  mapbox_access_token?: string;
}

@Controller('api')
export class DetectionController {
  constructor(private readonly service: DetectionService) {}

  @Post('detect-in-area')
  async detectInArea(@Body() body: DetectInAreaDto) {
    const bbox = body.bbox;
    if (
      !Array.isArray(bbox) ||
      bbox.length < 4 ||
      bbox.some((n) => typeof n !== 'number' || Number.isNaN(n))
    ) {
      throw new BadRequestException(
        'body.bbox must be [minLng, minLat, maxLng, maxLat]',
      );
    }
    const detectionType = body.detection_type;
    if (
      detectionType !== 'buildings' &&
      detectionType !== 'trees' &&
      detectionType !== 'both'
    ) {
      throw new BadRequestException(
        'body.detection_type must be "buildings", "trees", or "both"',
      );
    }
    const normalizedBbox = bbox.slice(0, 4) as [number, number, number, number];
    const result = await this.service.detectInArea(
      normalizedBbox,
      detectionType,
      body.mapbox_access_token,
    );
    return {
      bbox: result.bbox,
      ...(result.buildings && { buildings: { geojson: result.buildings.geojson } }),
      ...(result.trees && { trees: { geojson: result.trees.geojson } }),
    };
  }
}
