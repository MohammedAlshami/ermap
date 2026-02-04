import { createFileRoute, useRouter, useSearch } from '@tanstack/react-router';
import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import type mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import {
  MapLibrary,
  MapLibraryConfig,
  GeoJSONLayerConfig,
  SlideConfig,
  SlideContentPosition,
} from '~/components/MapLibrary';
import { RichTextEditor } from '~/components/RichTextEditor';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs';
import { cn } from '~/lib/utils';
import { useAuth } from '~/lib/auth';
import { LAYER_OPTIONS, buildLayerConfigWithType } from '~/config/layerOptions';
import type { LayerOption, SlideLayerType } from '~/config/layerOptions';

export const Route = createFileRoute('/customize')({
  validateSearch: (search: Record<string, unknown>): { projectId?: string } => ({
    projectId: typeof search.projectId === 'string' ? search.projectId : undefined,
  }),
  component: CustomizePage,
});

/** User-defined slide: layers to show (with display type) and rich-text description */
interface CustomSlide {
  id: string;
  title: string;
  layerEntries: { layerId: string; type: SlideLayerType }[];
  descriptionHtml: string;
  contentPosition?: SlideContentPosition;
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: Record<string, unknown>;
    geometry: { type: 'Polygon'; coordinates: number[][][] };
  }>;
}

function buildLayerConfig(opt: LayerOption): GeoJSONLayerConfig {
  return buildLayerConfigWithType(opt, 'markers');
}

function canUseHeatmap(opt: LayerOption): boolean {
  return opt.geometry === 'point' || opt.geometry === 'mixed';
}

const CHAT_API_URL = (import.meta.env.VITE_CHAT_API_URL as string) || 'http://localhost:3002';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

/** Get bbox [minLng, minLat, maxLng, maxLat] from a GeoJSON Polygon. */
function bboxFromPolygon(coordinates: number[][][]): [number, number, number, number] {
  const ring = coordinates[0];
  if (!ring?.length) return [0, 0, 0, 0];
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
  return [minLng, minLat, maxLng, maxLat];
}

/** Drawn polygon from Mapbox Draw (id only for chips) */
interface DrawnPolygon {
  id: string;
}

interface SavedProject {
  id: string;
  name: string;
  share_id: string | null;
}

function CustomizePage() {
  const router = useRouter();
  const { projectId } = useSearch({ from: '/customize' });
  const { user, getAuthHeaders } = useAuth();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sideTab, setSideTab] = useState<'chat' | 'slides'>('chat');
  const [slides, setSlides] = useState<CustomSlide[]>([]);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [mapStyle, setMapStyle] = useState<'standard' | 'satellite'>('standard');
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const [drawnPolygons, setDrawnPolygons] = useState<DrawnPolygon[]>([]);
  const [currentProject, setCurrentProject] = useState<SavedProject | null>(null);
  const [projectName, setProjectName] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [shareCopied, setShareCopied] = useState(false);
  const projectLoadedRef = useRef(false);

  useEffect(() => {
    if (!projectId || !user) {
      if (!projectId) projectLoadedRef.current = false;
      return;
    }
    projectLoadedRef.current = false;
  }, [projectId]);
  useEffect(() => {
    if (!projectId || !user) return;
    if (projectLoadedRef.current) return;
    projectLoadedRef.current = true;
    const headers = getAuthHeaders();
    fetch(`/api/projects/${projectId}`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.config) return;
        setCurrentProject({ id: data.id, name: data.name, share_id: data.share_id ?? null });
        setProjectName(data.name || 'Untitled');
        if (Array.isArray(data.config.slides) && data.config.slides.length > 0) {
          setSlides(
            data.config.slides.map((s: CustomSlide) => ({
              id: s.id,
              title: s.title ?? 'Slide',
              layerEntries: s.layerEntries ?? [],
              descriptionHtml: s.descriptionHtml ?? '<p></p>',
              contentPosition: s.contentPosition ?? 'bottom-center',
            }))
          );
        }
        if (data.config.mapStyle === 'satellite' || data.config.mapStyle === 'standard') {
          setMapStyle(data.config.mapStyle);
        }
        if (Array.isArray(data.config.selectedLayerIds)) {
          setSelectedIds(new Set(data.config.selectedLayerIds));
        }
      })
      .catch(() => setCurrentProject(null))
      .finally(() => {});
  }, [projectId, user, getAuthHeaders]);

  const handleSaveProject = useCallback(async () => {
    if (!user) return;
    const name = projectName.trim() || 'Untitled';
    const config = {
      slides,
      mapStyle,
      selectedLayerIds: Array.from(selectedIds),
    };
    setSaveStatus('saving');
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      if (currentProject) {
        const res = await fetch(`/api/projects/${currentProject.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ name, config }),
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentProject((prev) => (prev ? { ...prev, name: data.name, share_id: data.share_id ?? prev.share_id } : null));
          setSaveStatus('saved');
        } else setSaveStatus('error');
      } else {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers,
          body: JSON.stringify({ name, config }),
        });
        if (res.ok) {
          const data = await res.json();
          const id = String(data.id);
          setCurrentProject({ id, name: data.name, share_id: data.share_id ?? null });
          setProjectName(data.name);
          setSaveStatus('saved');
          projectLoadedRef.current = true;
          router.navigate({
            to: '/customize',
            search: { projectId: id },
            replace: true,
          });
        } else setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  }, [user, getAuthHeaders, projectName, slides, mapStyle, selectedIds, currentProject, router]);

  const handleCopyShareLink = useCallback(() => {
    if (!currentProject?.share_id) return;
    const url = `${window.location.origin}/p/${currentProject.share_id}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  }, [currentProject?.share_id]);

  const handleMapLoad = useCallback((map: mapboxgl.Map) => {
    mapRef.current = map;
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: 'draw_polygon',
    });
    map.addControl(draw, 'top-right');
    drawRef.current = draw;

    const updateDrawn = () => {
      const data = draw.getAll();
      setDrawnPolygons(
        data.features
          .filter((f): f is GeoJSON.Feature<GeoJSON.Polygon> & { id: string } => f.geometry?.type === 'Polygon' && typeof f.id === 'string')
          .map((f) => ({ id: f.id }))
      );
    };
    map.on('draw.create', updateDrawn);
    map.on('draw.delete', updateDrawn);
    map.on('draw.update', updateDrawn);
  }, []);

  const removeDrawnPolygon = useCallback((id: string) => {
    drawRef.current?.delete([id]);
  }, []);

  const toggleLayer = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateSlide = (id: string, patch: Partial<CustomSlide>) => {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeSlide = (id: string) => {
    setSlides((prev) => prev.filter((s) => s.id !== id));
    if (editingSlideId === id) setEditingSlideId(null);
  };

  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || isStreaming) return;
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsStreaming(true);
    setStreamingContent('');
    const abortController = new AbortController();
    try {
      const drawnGeoJSON = drawRef.current?.getAll?.();
      const drawnPolygonsGeoJSON =
        drawnGeoJSON?.features?.length &&
        drawnGeoJSON.type === 'FeatureCollection'
          ? {
              type: 'FeatureCollection' as const,
              features: drawnGeoJSON.features.filter(
                (f): f is GeoJSON.Feature<GeoJSON.Polygon> =>
                  f?.geometry?.type === 'Polygon' &&
                  Array.isArray((f.geometry as GeoJSON.Polygon).coordinates),
              ),
            }
          : undefined;

      const res = await fetch(`${CHAT_API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: chatSessionId ?? undefined,
          slides: slides.map((s) => ({
            id: s.id,
            title: s.title,
            layerEntries: s.layerEntries ?? [],
            descriptionHtml: s.descriptionHtml ?? '<p></p>',
            contentPosition: s.contentPosition ?? 'bottom-center',
          })),
          selected_layer_ids: Array.from(selectedIds),
          drawn_polygons_geojson: drawnPolygonsGeoJSON ?? undefined,
          mapbox_access_token:
            (import.meta.env.VITE_MAPBOX_TOKEN as string) || undefined,
        }),
        signal: abortController.signal,
      });
      if (!res.ok || !res.body) throw new Error('Chat request failed');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';
      while (true) {
        let chunk: ReadableStreamReadResult<Uint8Array>;
        try {
          chunk = await reader.read();
        } catch (readErr) {
          if (readErr instanceof Error && readErr.name === 'AbortError') break;
          throw readErr;
        }
        const { done, value } = chunk;
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6).trim()) as {
                type?: string;
                delta?: string;
                content?: string;
                slides?: CustomSlide[];
                place?: { lat: number; lon: number; display_name: string };
                layer_ids?: string[];
                style?: 'standard' | 'satellite';
                zoom?: number;
                delta?: number;
                raster?:
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
                run_detection?: boolean;
                detection_type?: 'buildings' | 'trees' | 'both';
                detection_result?: {
                  bbox: [number, number, number, number];
                  buildings?: { geojson: GeoJSONFeatureCollection };
                  trees?: { geojson: GeoJSONFeatureCollection };
                };
                session_id?: string;
                error?: { message?: string };
              };
              if (data.type === 'content' && data.content != null) {
                assistantContent = data.content;
                setStreamingContent(data.content);
              }
              // Replace with full slides array so add_slides (multiple at once) displays all slides
              if (data.type === 'slides' && Array.isArray(data.slides)) {
                setSlides(
                  data.slides.map((s) => ({
                    id: s.id,
                    title: s.title,
                    layerEntries: s.layerEntries ?? [],
                    descriptionHtml: s.descriptionHtml ?? '<p></p>',
                    contentPosition: (s.contentPosition as SlideContentPosition) ?? 'bottom-center',
                  })),
                );
              }
              if (data.type === 'place' && data.place) {
                const { lat, lon } = data.place;
                mapRef.current?.flyTo({
                  center: [lon, lat],
                  zoom: 12,
                  duration: 1500,
                });
              }
              if (data.type === 'selected_layers' && Array.isArray(data.layer_ids)) {
                setSelectedIds(new Set(data.layer_ids));
              }
              if (data.type === 'map_style' && (data.style === 'standard' || data.style === 'satellite')) {
                setMapStyle(data.style);
              }
              if (data.type === 'zoom') {
                const map = mapRef.current;
                if (map && typeof data.delta === 'number') {
                  const center = map.getCenter();
                  const currentZoom = map.getZoom();
                  const newZoom = Math.max(0, Math.min(22, currentZoom + data.delta));
                  map.flyTo({ center: [center.lng, center.lat], zoom: newZoom, duration: 800 });
                }
              }
              if (data.type === 'detection_result' && data.bbox) {
                const map = mapRef.current;
                const result = data as {
                  bbox: [number, number, number, number];
                  buildings?: { geojson: GeoJSONFeatureCollection };
                  trees?: { geojson: GeoJSONFeatureCollection };
                };
                if (map) {
                  if (result.buildings?.geojson) {
                    const sourceId = 'detection-buildings-geojson';
                    const layerId = `${sourceId}-layer`;
                    if (map.getSource(sourceId)) {
                      map.removeLayer(layerId);
                      map.removeSource(sourceId);
                    }
                    map.addSource(sourceId, {
                      type: 'geojson',
                      data: result.buildings.geojson,
                    });
                    map.addLayer({
                      id: layerId,
                      type: 'fill',
                      source: sourceId,
                      paint: {
                        'fill-color': '#3b82f6',
                        'fill-opacity': 0.5,
                        'fill-outline-color': '#1d4ed8',
                      },
                    });
                  }
                  if (result.trees?.geojson) {
                    const sourceId = 'detection-trees-geojson';
                    const layerId = `${sourceId}-layer`;
                    if (map.getSource(sourceId)) {
                      map.removeLayer(layerId);
                      map.removeSource(sourceId);
                    }
                    map.addSource(sourceId, {
                      type: 'geojson',
                      data: result.trees.geojson,
                    });
                    map.addLayer({
                      id: layerId,
                      type: 'fill',
                      source: sourceId,
                      paint: {
                        'fill-color': '#22c55e',
                        'fill-opacity': 0.5,
                        'fill-outline-color': '#15803d',
                      },
                    });
                  }
                }
              }
              if (data.type === 'plot_raster' && data.raster) {
                const map = mapRef.current;
                const r = data.raster;
                const sourceId = `raster-${r.id}`;
                const layerId = `${sourceId}-layer`;
                if (map?.getSource(sourceId)) {
                  map.removeLayer(layerId);
                  map.removeSource(sourceId);
                }
                if (r.type === 'tiled' && r.tileUrlTemplate && map) {
                  const template =
                    r.tileUrlTemplate.startsWith('http') || r.tileUrlTemplate.startsWith('/')
                      ? r.tileUrlTemplate
                      : `${window.location.origin}${r.tileUrlTemplate.startsWith('/') ? '' : '/'}${r.tileUrlTemplate}`;
                  map.addSource(sourceId, {
                    type: 'raster',
                    tiles: [template],
                    tileSize: 256,
                    minzoom: r.minzoom ?? 0,
                    maxzoom: r.maxzoom ?? 18,
                  });
                  map.addLayer({
                    id: layerId,
                    type: 'raster',
                    source: sourceId,
                    paint: { 'raster-opacity': 0.85 },
                  });
                  if (r.bounds && r.bounds.length >= 4) {
                    map.fitBounds(
                      [
                        [r.bounds[0], r.bounds[1]],
                        [r.bounds[2], r.bounds[3]],
                      ],
                      { padding: 40, maxZoom: 14, duration: 1000 }
                    );
                  }
                } else {
                  const rawUrl =
                    typeof (r as { url?: string }).url === 'string' &&
                    (r as { url: string }).url &&
                    !(r as { url: string }).url.includes('undefined')
                      ? (r as { url: string }).url
                      : null;
                  if (!rawUrl && data.raster?.id) {
                    setChatMessages((prev) => [
                      ...prev,
                      {
                        role: 'assistant',
                        content: `Could not add raster "${data.raster.name ?? data.raster.id}": image URL was not provided.`,
                      },
                    ]);
                  }
                  if (map && rawUrl && Array.isArray(r.bounds) && r.bounds.length >= 4) {
                    const [minLng, minLat, maxLng, maxLat] = r.bounds;
                    const imageUrl = rawUrl.startsWith('http')
                      ? rawUrl
                      : `${window.location.origin}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
                    map.addSource(sourceId, {
                      type: 'image',
                      url: imageUrl,
                      coordinates: [
                        [minLng, minLat],
                        [maxLng, minLat],
                        [maxLng, maxLat],
                        [minLng, maxLat],
                      ],
                    });
                    map.addLayer({
                      id: layerId,
                      type: 'raster',
                      source: sourceId,
                      paint: { 'raster-opacity': 0.85 },
                    });
                  }
                }
              }
              if (data.type === 'done') {
                if (data.session_id) setChatSessionId(data.session_id);
                // Apply final slides from done chunk so we always sync with backend (e.g. add_slides returning full list)
                if (Array.isArray(data.slides)) {
                  setSlides(
                    data.slides.map((s) => ({
                      id: s.id,
                      title: s.title,
                      layerEntries: s.layerEntries ?? [],
                      descriptionHtml: s.descriptionHtml ?? '<p></p>',
                      contentPosition: (s.contentPosition as SlideContentPosition) ?? 'bottom-center',
                    })),
                  );
                }
              }
              if (data.type === 'error' && data.error?.message) {
                setChatMessages((prev) => [
                  ...prev,
                  { role: 'assistant', content: `Error: ${data.error!.message}` },
                ]);
              }
            } catch {
              // skip malformed line
            }
          }
        }
      }
      if (assistantContent) {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: assistantContent }]);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.name === 'AbortError'
            ? 'Request was cancelled.'
            : err.message || 'Failed to send message'
          : 'Failed to send message';
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: message },
      ]);
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const editingSlide = editingSlideId ? slides.find((s) => s.id === editingSlideId) : null;

  const activeLayers = useMemo(() => {
    return LAYER_OPTIONS.filter((opt) => selectedIds.has(opt.id)).map(buildLayerConfig);
  }, [selectedIds]);

  const legendEntries = useMemo(() => {
    return LAYER_OPTIONS.filter((opt) => selectedIds.has(opt.id)).map((opt) => ({
      label: opt.name,
      color: opt.color,
    }));
  }, [selectedIds]);

  const slideshowSlides: SlideConfig[] = useMemo(() => {
    return slides.map((s) => {
      const entries =
        s.layerEntries ??
        ('layerIds' in s &&
          Array.isArray((s as { layerIds?: string[] }).layerIds) &&
          (s as { layerIds: string[] }).layerIds.map((layerId) => ({
            layerId,
            type: 'markers' as const,
          }))) ??
        [];
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
        contentPosition: s.contentPosition ?? 'bottom-center',
        duration: 5000,
        camera: { center: [101.9758, 4.2105], zoom: 6, pitch: 0, bearing: 0 },
        layers: layerConfigs,
        legend:
          legendEntriesSlide.length > 0
            ? { title: 'Layers', position: 'bottom-left' as const, entries: legendEntriesSlide }
            : undefined,
      };
    });
  }, [slides]);

  const mapStyleUrl =
    mapStyle === 'satellite'
      ? 'mapbox://styles/mapbox/satellite-v9'
      : 'mapbox://styles/mapbox/light-v11';

  const mapConfig: MapLibraryConfig = {
    mapboxAccessToken: (import.meta.env.VITE_MAPBOX_TOKEN as string) || '',
    style: mapStyleUrl,
    initialCamera: {
      center: [101.9758, 4.2105],
      zoom: 6,
    },
    layers:
      slideshowSlides.length > 0 && sideTab === 'slides'
        ? []
        : activeLayers,
    legend:
      legendEntries.length > 0
        ? {
            title: 'Layers',
            position: 'bottom-left',
            collapsible: true,
            defaultExpanded: true,
            entries: legendEntries,
          }
        : undefined,
    slideshow:
      slideshowSlides.length > 0
        ? {
            slides: slideshowSlides,
            autoPlay: false,
            loop: true,
            showControls: true,
            showProgress: true,
          }
        : undefined,
    sidePanel: {
      title: 'Customize',
      position: 'left',
      width: '320px',
      collapsible: true,
      defaultExpanded: true,
      onBack: () => router.history.back(),
      headerRight: (
        <div className="flex items-center gap-1">
          {user && (
            <button
              type="button"
              onClick={handleSaveProject}
              disabled={saveStatus === 'saving'}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none"
              title={saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Save project'}
            >
              {saveStatus === 'saving' ? (
                <span className="text-xs font-medium text-muted-foreground">Saving…</span>
              ) : saveStatus === 'saved' ? (
                <span className="text-xs font-medium text-primary">Saved</span>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              )}
            </button>
          )}
          {currentProject?.share_id && (
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title={shareCopied ? 'Copied!' : 'Copy share link'}
            >
              {shareCopied ? (
                <span className="text-xs font-medium text-primary">Copied!</span>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              )}
            </button>
          )}
        </div>
      ),
      content: (
        <div className="p-3 flex flex-col flex-1 min-h-0 gap-3">
          <Tabs value={sideTab} onValueChange={(v) => setSideTab(v as 'chat' | 'slides')} className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <TabsList className="w-full grid grid-cols-2 rounded-lg shrink-0">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="slides">Slides</TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="mt-3 flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 flex flex-col rounded-lg border border-input bg-muted/20 overflow-hidden min-h-0">
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 space-y-3">
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-lg rounded-tl-none border border-border/80 bg-background px-3 py-2 text-sm text-foreground shadow-sm">
                      Hi. Ask me to show or hide layers (e.g. "show Malaysia", "hide Family Mart"), find places, add or remove slides, and move the map.
                    </div>
                  </div>
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex',
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-sm',
                          msg.role === 'user'
                            ? 'rounded-tr-none border border-border/80 bg-primary text-primary-foreground'
                            : 'rounded-tl-none border border-border/80 bg-background text-foreground'
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isStreaming && streamingContent && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-lg rounded-tl-none border border-border/80 bg-background px-3 py-2 text-sm text-foreground shadow-sm whitespace-pre-wrap">
                        {streamingContent}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 p-2 bg-background space-y-2">
                  {drawnPolygons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {drawnPolygons.map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary px-2.5 py-1 text-xs font-medium border border-primary/30"
                        >
                          Drawn area
                          <button
                            type="button"
                            onClick={() => removeDrawnPolygon(p.id)}
                            className="rounded-full p-0.5 hover:bg-primary/20 focus:outline-none focus:ring-1 focus:ring-primary"
                            aria-label="Remove"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="relative">
                    <input
                      data-testid="chat-input"
                      type="text"
                      placeholder="Type a message…"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendChatMessage();
                        }
                      }}
                      disabled={isStreaming}
                      className="w-full rounded-lg border border-input bg-background pl-3 pr-10 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                    />
                    <button
                      data-testid="chat-send"
                      type="button"
                      onClick={sendChatMessage}
                      disabled={!chatInput.trim() || isStreaming}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      aria-label="Send"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="slides" className="mt-3 flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto">
              {editingSlide ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">Edit slide</span>
                    <button
                      type="button"
                      onClick={() => setEditingSlideId(null)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Done
                    </button>
                  </div>
                  <label className="text-xs text-muted-foreground">Title</label>
                  <input
                    type="text"
                    value={editingSlide.title}
                    onChange={(e) => updateSlide(editingSlide.id, { title: e.target.value })}
                    onKeyDown={(e) => {
                      // Let Space and other keys through; stop propagation so global handlers (e.g. slideshow) don't capture them
                      if (e.key === ' ') e.stopPropagation();
                    }}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Slide title"
                  />
                  <label className="text-xs text-muted-foreground">Content position on map</label>
                  <div className="grid grid-cols-3 gap-1 w-full max-w-[140px]">
                    {(
                      [
                        'top-left',
                        'top-center',
                        'top-right',
                        'middle-left',
                        'middle-center',
                        'middle-right',
                        'bottom-left',
                        'bottom-center',
                        'bottom-right',
                      ] as SlideContentPosition[]
                    ).map((pos) => {
                      const current =
                        editingSlide.contentPosition ?? 'bottom-center';
                      const isSelected = current === pos;
                      return (
                        <button
                          key={pos}
                          type="button"
                          onClick={() =>
                            updateSlide(editingSlide.id, {
                              contentPosition: pos,
                            })
                          }
                          title={pos.replace('-', ' ')}
                          className={cn(
                            'aspect-square rounded border text-[10px] font-medium transition-colors',
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-muted/50 border-border hover:bg-muted text-muted-foreground'
                          )}
                        >
                          {pos === 'top-left' && '↖'}
                          {pos === 'top-center' && '↑'}
                          {pos === 'top-right' && '↗'}
                          {pos === 'middle-left' && '←'}
                          {pos === 'middle-center' && '●'}
                          {pos === 'middle-right' && '→'}
                          {pos === 'bottom-left' && '↙'}
                          {pos === 'bottom-center' && '↓'}
                          {pos === 'bottom-right' && '↘'}
                        </button>
                      );
                    })}
                  </div>
                  <label className="text-xs text-muted-foreground">Layers to show</label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {LAYER_OPTIONS.map((opt) => {
                      const effectiveEntries =
                        editingSlide.layerEntries ??
                        (editingSlide as { layerIds?: string[] }).layerIds?.map(
                          (layerId) => ({ layerId, type: 'markers' as const })
                        ) ??
                        [];
                      const entry = effectiveEntries.find(
                        (e) => e.layerId === opt.id
                      );
                      const checked = !!entry;
                      const showTypeSelect = checked && canUseHeatmap(opt);
                      return (
                        <div
                          key={opt.id}
                          className="flex flex-wrap items-center gap-2 text-sm"
                        >
                          <label className="flex items-center gap-2 cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const current =
                                  editingSlide.layerEntries ?? effectiveEntries;
                                const next = checked
                                  ? current.filter((e) => e.layerId !== opt.id)
                                  : [
                                      ...current,
                                      {
                                        layerId: opt.id,
                                        type: 'markers' as const,
                                      },
                                    ];
                                updateSlide(editingSlide.id, {
                                  layerEntries: next,
                                });
                              }}
                              className="rounded border-input"
                            />
                            <span
                              className="shrink-0 w-3 h-3 rounded-full border border-gray-300"
                              style={{ backgroundColor: opt.color }}
                            />
                            <span className="truncate">{opt.name}</span>
                          </label>
                          {showTypeSelect && (
                            <select
                              value={entry.type}
                              onChange={(e) => {
                                const type = e.target
                                  .value as SlideLayerType;
                                const current =
                                  editingSlide.layerEntries ?? effectiveEntries;
                                updateSlide(editingSlide.id, {
                                  layerEntries: current.map((e) =>
                                    e.layerId === opt.id ? { ...e, type } : e
                                  ),
                                });
                              }}
                              className="ml-5 rounded-lg border border-input bg-background px-2 py-1 text-xs"
                            >
                              <option value="markers">Markers</option>
                              <option value="heatmap">Heatmap</option>
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <label className="text-xs text-muted-foreground">Description (rich text)</label>
                  <RichTextEditor
                    value={editingSlide.descriptionHtml}
                    onChange={(html) => updateSlide(editingSlide.id, { descriptionHtml: html })}
                    placeholder="Describe this slide…"
                    minHeight="100px"
                    className="rounded-lg"
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">Slides</span>
                  </div>
                  <div className="space-y-2">
                    {slides.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">
                        No slides yet. Ask in Chat to add slides (e.g. &quot;create 3 slides&quot; or &quot;add a slide with Malaysia&quot;).
                      </p>
                    ) : (
                      slides.map((s) => (
                        <Card
                          key={s.id}
                          className="rounded-lg border border-border/80 shadow-sm overflow-hidden"
                        >
                          <CardContent className="p-3 flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium truncate">{s.title}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setEditingSlideId(s.id)}
                                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                  title="Edit"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeSlide(s.id)}
                                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                  title="Remove"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {(s.layerEntries?.length ??
                                (s as { layerIds?: string[] }).layerIds?.length ??
                                0)}{' '}
                              layer
                              {(s.layerEntries?.length ??
                                (s as { layerIds?: string[] }).layerIds?.length ??
                                0) !== 1
                                ? 's'
                                : ''}
                            </p>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      ),
    },
    controls: {
      navigation: true,
      fullscreen: true,
      scale: true,
      geolocate: false,
    },
  };

  return (
    <div className="w-full h-screen min-h-screen flex flex-col bg-gray-100 relative">
      <MapLibrary
        config={mapConfig}
        onMapLoad={handleMapLoad}
        className="flex-1 min-h-0"
      />
    </div>
  );
}
