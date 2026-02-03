import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { BaseMessage } from '@langchain/core/messages';
import { AIMessage, ToolMessage } from '@langchain/core/messages';
import { createAddSlideTool } from '../agent/slides-tools';
import { createRemoveSlideTool } from '../agent/slides-tools';
import { createSelectLayerTool, createRemoveLayerTool } from '../agent/layers-tools';
import { createSearchPlaceTool } from '../agent/places-tools';
import { createSetMapStyleTool } from '../agent/map-style-tools';
import { createSetZoomTool } from '../agent/zoom-tools';
import { createSearchDataTool } from '../agent/search-data-tools';
import { createPlotRasterTool } from '../agent/plot-raster-tools';
import { createDetectInDrawnAreaTool } from '../agent/detection-tools';
import { streamMainAgent } from '../agent/main-agent';
import { DetectionService } from '../detection/detection.service';
import type { ChatBodyDto, SlideDto, DrawnPolygonsGeoJSON } from './dto/chat-body.dto';

const MAX_HISTORY = 40;
const SESSION_MESSAGES = new Map<string, BaseMessage[]>();

function extractTokenFromMessageContent(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    let token = '';
    for (const block of raw) {
      if (!block || typeof block !== 'object') continue;
      const b = block as Record<string, unknown>;
      const part =
        (typeof b.text === 'string' && b.text) ||
        (typeof b.content === 'string' && b.content) ||
        '';
      token += part;
    }
    return token;
  }
  return raw != null ? String(raw) : '';
}

function buildQuery(
  message: string,
  slides: SlideDto[] | undefined,
  selectedLayerIds: string[] | undefined,
  drawnPolygons: DrawnPolygonsGeoJSON | undefined,
): string {
  let query = message.trim();
  const slidesJson = JSON.stringify(slides ?? []);
  query += `\n\n[Current slides (pass as current_slides_json when calling add_slide or remove_slide):\n${slidesJson}]`;
  const layersJson = JSON.stringify(selectedLayerIds ?? []);
  query += `\n\n[Current selected layer ids (pass as current_selected_layer_ids when calling select_layer or remove_layer):\n${layersJson}]`;
  const hasDrawnPolygons =
    drawnPolygons?.features?.length != null && drawnPolygons.features.length > 0;
  if (hasDrawnPolygons) {
    query += `\n\n[Drawn polygons: the user has drawn ${drawnPolygons!.features!.length} polygon(s) on the map. You MAY call detect_in_drawn_area(detection_type: "buildings" | "trees" | "both") when they ask to detect buildings, trees, or both in this area.]`;
  } else {
    query += `\n\n[Drawn polygons: none. If the user asks to detect buildings or trees, tell them to draw a polygon on the map first using the Draw polygon tool, then ask again.]`;
  }
  return query;
}

type ContentChunk = {
  type: 'content';
  id: string;
  model: string;
  timestamp: number;
  delta: string;
  content: string;
  role: 'assistant';
};
type SlidesChunk = { type: 'slides'; slides: SlideDto[] };
type PlaceChunk = {
  type: 'place';
  place: { lat: number; lon: number; display_name: string };
};
type SelectedLayersChunk = { type: 'selected_layers'; layer_ids: string[] };
type MapStyleChunk = {
  type: 'map_style';
  style: 'standard' | 'satellite';
};
type ZoomChunk = { type: 'zoom'; delta: number };
type SearchDataChunk = { type: 'search_data'; results: unknown[] };
type RunDetectionChunk = {
  type: 'run_detection';
  detection_type: 'buildings' | 'trees' | 'both';
};
type DetectionResultChunk = {
  type: 'detection_result';
  bbox: [number, number, number, number];
  buildings?: { geojson: GeoJSONFeatureCollection };
  trees?: { geojson: GeoJSONFeatureCollection };
};

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: Record<string, unknown>;
    geometry: { type: 'Polygon'; coordinates: number[][][] };
  }>;
}
type PlotRasterChunk = {
  type: 'plot_raster';
  raster:
    | { id: string; name: string; type: 'image'; url: string; bounds: [number, number, number, number] }
    | {
        id: string;
        name: string;
        type: 'tiled';
        tileUrlTemplate: string;
        minzoom: number;
        maxzoom: number;
        bounds?: [number, number, number, number];
      };
};
type DoneChunk = {
  type: 'done';
  id: string;
  model: string;
  timestamp: number;
  finishReason: 'stop' | null;
  slides?: SlideDto[] | null;
  session_id?: string;
};
type ErrorChunk = {
  type: 'error';
  id: string;
  model: string;
  timestamp: number;
  error: { message: string };
};
type StreamChunk = ContentChunk | SlidesChunk | PlaceChunk | SelectedLayersChunk | MapStyleChunk | ZoomChunk | SearchDataChunk | PlotRasterChunk | RunDetectionChunk | DetectionResultChunk | DoneChunk | ErrorChunk;

function* yieldAsTokens(
  fullText: string,
  base: { id: string; model: string; timestamp: number },
): Generator<ContentChunk> {
  let content = '';
  const words = fullText.split(/(\s+)/);
  for (const w of words) {
    if (!w) continue;
    content += w;
    yield {
      type: 'content',
      ...base,
      timestamp: Date.now(),
      delta: w,
      content,
      role: 'assistant' as const,
    };
  }
}

@Injectable()
export class ChatService {
  constructor(
    private readonly config: ConfigService,
    private readonly detectionService: DetectionService,
  ) {}

  async *streamChat(body: ChatBodyDto): AsyncGenerator<StreamChunk> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY')?.trim();
    if (!apiKey) {
      yield {
        type: 'error',
        id: '',
        model: 'langgraph',
        timestamp: Date.now(),
        error: { message: 'OPENAI_API_KEY not set in server .env' },
      };
      return;
    }

    const message = body.message?.trim();
    if (!message) {
      yield {
        type: 'error',
        id: '',
        model: 'langgraph',
        timestamp: Date.now(),
        error: { message: 'Message is required' },
      };
      return;
    }

    const sessionId = body.session_id ?? crypto.randomUUID();
    const currentSlides = body.slides ?? [];
    const selectedLayerIds = body.selected_layer_ids ?? [];

    let conversationHistory: BaseMessage[] = [];
    if (SESSION_MESSAGES.has(sessionId)) {
      conversationHistory = SESSION_MESSAGES.get(sessionId)!;
    }

    const drawnPolygons = body.drawn_polygons_geojson ?? undefined;
    const query = buildQuery(message, currentSlides, selectedLayerIds, drawnPolygons);
    const geocodeKey = this.config.get<string>('GEOCODE_API_KEY')?.trim() ?? '';
    const searchDataBaseUrl = this.config.get<string>('SEARCH_DATA_BASE_URL')?.trim() ?? 'http://localhost:3001';
    const tools = [
      createAddSlideTool(),
      createRemoveSlideTool(),
      createSelectLayerTool(),
      createRemoveLayerTool(),
      createSearchPlaceTool(geocodeKey),
      createSetMapStyleTool(),
      createSetZoomTool(),
      createSearchDataTool(searchDataBaseUrl),
      createPlotRasterTool(searchDataBaseUrl),
      createDetectInDrawnAreaTool(),
    ];

    let stream: AsyncIterable<[string[], string, unknown]>;
    try {
      stream = await streamMainAgent(
        query,
        conversationHistory,
        apiKey,
        tools,
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      yield {
        type: 'error',
        id: '',
        model: 'langgraph',
        timestamp: Date.now(),
        error: { message: errMsg },
      };
      return;
    }

    const messageId = crypto.randomUUID();
    const modelName = 'langgraph';
    const base = { id: messageId, model: modelName, timestamp: Date.now() };

    let lastValues: { messages?: BaseMessage[] } | null = null;
    let accumulatedContent = '';
    const slidesResults: SlideDto[][] = [];
    let placeResult: { lat: number; lon: number; display_name: string } | null = null;
    let selectedLayersResult: string[] | null = null;
    let mapStyleResult: 'standard' | 'satellite' | null = null;
    let zoomDeltaResult: number | null = null;
    let searchDataResult: unknown[] | null = null;
    let plotRasterResult: PlotRasterChunk['raster'] | null = null;
    let runDetectionResult: RunDetectionChunk['detection_type'] | null = null;

    try {
      for await (const chunk of stream) {
        const parts = chunk as unknown[];
        const mode = parts.length === 2 ? parts[0] : parts[1];
        const data = parts.length === 2 ? parts[1] : parts[2];
        const modeStr = typeof mode === 'string' ? mode : '';
        if (
          (modeStr === 'values' || modeStr.startsWith('values:')) &&
          data != null &&
          typeof data === 'object'
        ) {
          lastValues = data as { messages?: BaseMessage[] };
        }
        if (mode === 'messages' || mode === 'messages-tuple') {
          const messageList = Array.isArray(data) ? data : data != null ? [data] : [];
          for (let i = 0; i < messageList.length; i++) {
            const msg = messageList[i] as {
              name?: string;
              content?: unknown;
              tool_call_id?: string;
            };
            if (msg == null || typeof msg !== 'object') continue;
            const msgName = (msg.name ?? '').toString().trim();
            if (msgName === 'search_place' && msg.content != null) {
            const raw =
              typeof msg.content === 'string'
                ? msg.content
                : String(msg.content ?? '');
            if (raw.trim()) {
              try {
                const parsed = JSON.parse(raw.trim()) as {
                  lat?: number;
                  lon?: number;
                  display_name?: string;
                  error?: string;
                };
                if (
                  parsed &&
                  typeof parsed.lat === 'number' &&
                  typeof parsed.lon === 'number' &&
                  !parsed.error
                ) {
                  placeResult = {
                    lat: parsed.lat,
                    lon: parsed.lon,
                    display_name:
                      typeof parsed.display_name === 'string'
                        ? parsed.display_name
                        : `${parsed.lat}, ${parsed.lon}`,
                  };
                }
              } catch {
                // ignore
              }
            }
            continue;
          }
          if (msgName === 'set_map_style' && msg.content != null) {
            const raw =
              typeof msg.content === 'string'
                ? msg.content
                : String(msg.content ?? '');
            if (raw.trim()) {
              try {
                const parsed = JSON.parse(raw.trim()) as {
                  style?: string;
                };
                if (
                  parsed?.style === 'satellite' ||
                  parsed?.style === 'standard'
                ) {
                  mapStyleResult = parsed.style;
                }
              } catch {
                // ignore
              }
            }
            continue;
          }
          if (msgName === 'set_zoom' && msg.content != null) {
            const raw =
              typeof msg.content === 'string'
                ? msg.content
                : String(msg.content ?? '');
            if (raw.trim()) {
              try {
                const parsed = JSON.parse(raw.trim()) as { delta?: number };
                if (
                  parsed?.delta != null &&
                  typeof parsed.delta === 'number' &&
                  !Number.isNaN(parsed.delta)
                ) {
                  zoomDeltaResult = Math.max(
                    -10,
                    Math.min(10, Math.round(parsed.delta)),
                  );
                }
              } catch {
                // ignore
              }
            }
            continue;
          }
          if (msgName === 'search_data' && msg.content != null) {
            const raw =
              typeof msg.content === 'string'
                ? msg.content
                : String(msg.content ?? '');
            if (raw.trim()) {
              try {
                const parsed = JSON.parse(raw.trim()) as { results?: unknown[] };
                if (Array.isArray(parsed?.results)) {
                  searchDataResult = parsed.results;
                }
              } catch {
                // ignore
              }
            }
            continue;
          }
          if (msgName === 'plot_raster' && msg.content != null) {
            const raw =
              typeof msg.content === 'string'
                ? msg.content
                : String(msg.content ?? '');
            if (raw.trim()) {
              try {
                const parsed = JSON.parse(raw.trim()) as {
                  id?: string;
                  name?: string;
                  type?: string;
                  url?: string;
                  tileUrlTemplate?: string;
                  minzoom?: number;
                  maxzoom?: number;
                  bounds?: number[];
                  error?: string;
                };
                if (parsed?.type === 'tiled' && parsed?.tileUrlTemplate && !parsed.error) {
                  plotRasterResult = {
                    id: String(parsed.id || 'raster'),
                    name: String(parsed.name || 'Raster'),
                    type: 'tiled',
                    tileUrlTemplate: parsed.tileUrlTemplate,
                    minzoom: typeof parsed.minzoom === 'number' ? parsed.minzoom : 0,
                    maxzoom: typeof parsed.maxzoom === 'number' ? parsed.maxzoom : 18,
                    bounds:
                      Array.isArray(parsed.bounds) && parsed.bounds.length >= 4
                        ? (parsed.bounds.slice(0, 4) as [number, number, number, number])
                        : undefined,
                  };
                  console.log('[chat.service] plot_raster parsed (tiled), yielding raster:', plotRasterResult);
                } else if (
                  parsed?.url &&
                  Array.isArray(parsed.bounds) &&
                  parsed.bounds.length >= 4 &&
                  !parsed.error
                ) {
                  plotRasterResult = {
                    id: String(parsed.id || 'raster'),
                    name: String(parsed.name || 'Raster'),
                    type: 'image',
                    url: parsed.url,
                    bounds: parsed.bounds.slice(0, 4) as [number, number, number, number],
                  };
                  console.log('[chat.service] plot_raster parsed (image), yielding raster:', plotRasterResult);
                } else {
                  console.log('[chat.service] plot_raster tool raw:', raw.trim(), 'parsed=', parsed);
                }
              } catch {
                // ignore
              }
            }
            continue;
          }
          if (
            (msgName === 'select_layer' || msgName === 'remove_layer') &&
            msg.content != null
          ) {
            const raw =
              typeof msg.content === 'string'
                ? msg.content
                : String(msg.content ?? '');
            if (raw.trim()) {
              try {
                const parsed = JSON.parse(raw.trim()) as unknown;
                if (Array.isArray(parsed)) {
                  selectedLayersResult = (parsed as string[]).filter(
                    (id) => typeof id === 'string',
                  );
                }
              } catch {
                // ignore
              }
            }
            continue;
          }
          if (
            (msgName === 'add_slide' || msgName === 'remove_slide') &&
            msg.content != null
          ) {
            const raw =
              typeof msg.content === 'string'
                ? msg.content
                : String(msg.content ?? '');
            if (raw.trim()) {
              try {
                const parsed = JSON.parse(raw.trim()) as unknown;
                if (Array.isArray(parsed)) {
                  slidesResults.push(parsed as SlideDto[]);
                }
              } catch {
                // ignore
              }
            }
            continue;
          }
          if (msgName === 'detect_in_drawn_area' && msg.content != null) {
            const raw =
              typeof msg.content === 'string'
                ? msg.content
                : String(msg.content ?? '');
            if (raw.trim()) {
              try {
                const parsed = JSON.parse(raw.trim()) as {
                  run_detection?: boolean;
                  detection_type?: 'buildings' | 'trees' | 'both';
                };
                if (
                  parsed?.run_detection &&
                  (parsed.detection_type === 'buildings' ||
                    parsed.detection_type === 'trees' ||
                    parsed.detection_type === 'both')
                ) {
                  runDetectionResult = parsed.detection_type;
                }
              } catch {
                // ignore
              }
            }
            continue;
          }
          if ('content' in msg && msg.tool_call_id == null) {
            const raw = extractTokenFromMessageContent(msg.content);
            if (raw) {
              accumulatedContent += raw;
              yield {
                type: 'content',
                ...base,
                timestamp: Date.now(),
                delta: raw,
                content: accumulatedContent,
                role: 'assistant' as const,
              };
            }
          }
        }
        }
      }

      if (slidesResults.length > 0) {
        const lastSlides = slidesResults[slidesResults.length - 1];
        yield { type: 'slides', slides: lastSlides };
      }

      if (placeResult) {
        yield { type: 'place', place: placeResult };
      }

      if (selectedLayersResult != null) {
        yield { type: 'selected_layers', layer_ids: selectedLayersResult };
      }

      if (mapStyleResult) {
        yield { type: 'map_style', style: mapStyleResult };
      }

      if (zoomDeltaResult != null) {
        yield { type: 'zoom', delta: zoomDeltaResult };
      }

      if (searchDataResult != null) {
        yield { type: 'search_data', results: searchDataResult };
      }

      if (plotRasterResult != null) {
        yield { type: 'plot_raster', raster: plotRasterResult };
      }

      if (runDetectionResult != null) {
        yield { type: 'run_detection', detection_type: runDetectionResult };
        const features = drawnPolygons?.features;
        const firstPolygon = features?.[0];
        const geom = firstPolygon?.geometry;
        if (
          geom?.type === 'Polygon' &&
          Array.isArray(geom.coordinates) &&
          geom.coordinates[0]?.length
        ) {
          const ring = geom.coordinates[0];
          let minLng = ring[0]![0]!;
          let minLat = ring[0]![1]!;
          let maxLng = minLng;
          let maxLat = minLat;
          for (let i = 1; i < ring.length; i++) {
            const [lng, lat] = ring[i]!;
            if (lng < minLng) minLng = lng;
            if (lat < minLat) minLat = lat;
            if (lng > maxLng) maxLng = lng;
            if (lat > maxLat) maxLat = lat;
          }
          const bbox: [number, number, number, number] = [
            minLng,
            minLat,
            maxLng,
            maxLat,
          ];
          const mapboxToken =
            body.mapbox_access_token?.trim() ||
            this.config.get<string>('MAPBOX_ACCESS_TOKEN')?.trim() ||
            '';
          try {
            const detResult = await this.detectionService.detectInArea(
              bbox,
              runDetectionResult,
              mapboxToken || undefined,
            );
            yield {
              type: 'detection_result',
              bbox: detResult.bbox,
              ...(detResult.buildings?.geojson && {
                buildings: { geojson: detResult.buildings.geojson },
              }),
              ...(detResult.trees?.geojson && {
                trees: { geojson: detResult.trees.geojson },
              }),
            };
          } catch (detErr) {
            const msg =
              detErr instanceof Error ? detErr.message : String(detErr);
            yield {
              type: 'error',
              id: messageId,
              model: modelName,
              timestamp: Date.now(),
              error: { message: `Detection failed: ${msg}` },
            };
          }
        }
      }

      const messages = lastValues?.messages ?? [];
      if (!accumulatedContent?.trim() && slidesResults.length > 0) {
        const fallback = "I've updated the slides.";
        for (const contentChunk of yieldAsTokens(fallback, base)) {
          yield contentChunk;
        }
      }
      if (!accumulatedContent?.trim() && placeResult) {
        const fallback = `I've found it and moved the map to ${placeResult.display_name}.`;
        for (const contentChunk of yieldAsTokens(fallback, base)) {
          yield contentChunk;
        }
      }
      if (!accumulatedContent?.trim() && selectedLayersResult != null) {
        const fallback =
          selectedLayersResult.length > 0
            ? "I've updated the visible layers."
            : "I've cleared the visible layers.";
        for (const contentChunk of yieldAsTokens(fallback, base)) {
          yield contentChunk;
        }
      }
      if (!accumulatedContent?.trim() && mapStyleResult) {
        const fallback =
          mapStyleResult === 'satellite'
            ? "I've switched the map to satellite view."
            : "I've switched the map to standard view.";
        for (const contentChunk of yieldAsTokens(fallback, base)) {
          yield contentChunk;
        }
      }
      if (!accumulatedContent?.trim() && zoomDeltaResult != null) {
        const fallback =
          zoomDeltaResult > 0
            ? `I've zoomed in by ${zoomDeltaResult}.`
            : zoomDeltaResult < 0
              ? `I've zoomed out by ${Math.abs(zoomDeltaResult)}.`
              : "I've kept the zoom the same.";
        for (const contentChunk of yieldAsTokens(fallback, base)) {
          yield contentChunk;
        }
      }
      if (!accumulatedContent?.trim() && plotRasterResult != null) {
        const fallback = `I've added the raster "${plotRasterResult.name}" to the map.`;
        for (const contentChunk of yieldAsTokens(fallback, base)) {
          yield contentChunk;
        }
      }
      if (!accumulatedContent?.trim() && runDetectionResult != null) {
        const label =
          runDetectionResult === 'both'
            ? 'buildings and trees'
            : runDetectionResult === 'buildings'
              ? 'buildings'
              : 'trees';
        const fallback = `Running ${label} detection in your drawn area…`;
        for (const contentChunk of yieldAsTokens(fallback, base)) {
          yield contentChunk;
        }
      }

      let newHistory = messages.length > 1 ? messages.slice(1) : [...messages];
      if (newHistory.length > MAX_HISTORY) {
        newHistory = newHistory.slice(-MAX_HISTORY);
      }
      SESSION_MESSAGES.set(sessionId, newHistory);

      const slidesOut =
        slidesResults.length > 0
          ? slidesResults[slidesResults.length - 1]
          : null;

      yield {
        type: 'done',
        ...base,
        timestamp: Date.now(),
        finishReason: 'stop',
        slides: slidesOut ?? undefined,
        session_id: sessionId,
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      yield {
        type: 'error',
        ...base,
        timestamp: Date.now(),
        error: { message: errMsg },
      };
    }
  }
}
