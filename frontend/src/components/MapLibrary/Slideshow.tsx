'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SlideConfig, SlideshowConfig, SlideContentPosition } from './types';
import mapboxgl from 'mapbox-gl';
import { fetchGeoJSONWithCache } from '~/utils/geojsonCache';

interface SlideshowProps {
  config: SlideshowConfig;
  map: mapboxgl.Map | null;
  onSlideChange?: (slideIndex: number, slide: SlideConfig) => void;
  className?: string;
}

export const Slideshow: React.FC<SlideshowProps> = ({
  config,
  map,
  onSlideChange,
  className = '',
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(config.autoPlay ?? false);
  const [progress, setProgress] = useState(0);
  const hasInitializedSlidesRef = useRef(false);

  const slides = config.slides;
  const currentSlideConfig = slides[currentSlide];

  // Navigate to specific slide
  const goToSlide = useCallback(
    async (index: number) => {
      if (!map || index < 0 || index >= slides.length) return;

      const oldSlide = slides[currentSlide];
      const newSlide = slides[index];

      // Exit current slide
      if (oldSlide?.onExit) {
        await oldSlide.onExit(map);
      }

      // Remove old slide: layers first (reverse order so topmost is removed first), then sources
      if (oldSlide?.layers?.length) {
        for (const layerConfig of oldSlide.layers) {
          const layers = [...layerConfig.layers].reverse();
          for (const layer of layers) {
            if (map.getLayer(layer.id)) {
              map.removeLayer(layer.id);
            }
          }
        }
        for (const layerConfig of oldSlide.layers) {
          if (map.getSource(layerConfig.id)) {
            map.removeSource(layerConfig.id);
          }
        }
      }

      // Update camera
      if (newSlide.camera) {
        map.flyTo({
          center: newSlide.camera.center,
          zoom: newSlide.camera.zoom,
          pitch: newSlide.camera.pitch,
          bearing: newSlide.camera.bearing,
          duration: newSlide.camera.animation?.duration ?? config.transitionDuration ?? 1000,
          essential: newSlide.camera.animation?.essential ?? true,
        });
      }

      // Add new layers: resolve GeoJSON (fetch URL if needed), then add source + layers with valid spec
      const origin =
        typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
      if (newSlide.layers?.length) {
        for (const layerConfig of newSlide.layers) {
          if (map.getSource(layerConfig.id)) continue;
          const rawData = layerConfig.source?.data;
          if (rawData === undefined || rawData === null) continue;
          let data: GeoJSON.FeatureCollection | string;
          if (typeof rawData === 'string') {
            const trimmed = rawData.trim();
            if (!trimmed) continue;
            const fetched = await fetchGeoJSONWithCache(trimmed, origin);
            if (!fetched) {
              console.warn('Slideshow: failed to fetch layer', layerConfig.id, trimmed);
              continue;
            }
            data = fetched;
          } else if (typeof rawData === 'object' && rawData !== null && 'type' in rawData) {
            data = rawData as GeoJSON.FeatureCollection;
          } else {
            continue;
          }
          map.addSource(layerConfig.id, { type: 'geojson', data });
          for (const layer of layerConfig.layers) {
            if (map.getLayer(layer.id)) continue;
            const layerSpec: mapboxgl.LayerSpecification = {
              id: layer.id,
              type: layer.type,
              source: layerConfig.id,
              paint: layer.paint ?? {},
              layout: layer.layout ?? {},
              ...(layer.filter != null && layer.filter !== undefined && { filter: layer.filter }),
              ...(typeof layer.minzoom === 'number' && { minzoom: layer.minzoom }),
              ...(typeof layer.maxzoom === 'number' && { maxzoom: layer.maxzoom }),
            };
            map.addLayer(layerSpec);
          }
        }
      }

      // Enter new slide
      if (newSlide.onEnter) {
        await newSlide.onEnter(map);
      }

      setCurrentSlide(index);
      setProgress(0);
      onSlideChange?.(index, newSlide);
    },
    [map, currentSlide, slides, config.transitionDuration, onSlideChange]
  );

  // Show first slide's layers once when map and slides are ready
  useEffect(() => {
    if (!map || slides.length === 0 || hasInitializedSlidesRef.current) return;
    hasInitializedSlidesRef.current = true;
    goToSlide(0);
  }, [map, slides.length, goToSlide]);

  // Next slide
  const nextSlide = useCallback(() => {
    const nextIndex = currentSlide + 1;
    if (nextIndex >= slides.length) {
      if (config.loop) {
        goToSlide(0);
      } else {
        setIsPlaying(false);
      }
    } else {
      goToSlide(nextIndex);
    }
  }, [currentSlide, slides.length, config.loop, goToSlide]);

  // Previous slide
  const previousSlide = useCallback(() => {
    const prevIndex = currentSlide - 1;
    if (prevIndex < 0) {
      if (config.loop) {
        goToSlide(slides.length - 1);
      }
    } else {
      goToSlide(prevIndex);
    }
  }, [currentSlide, slides.length, config.loop, goToSlide]);

  // Auto-play effect
  useEffect(() => {
    if (!isPlaying || !currentSlideConfig?.duration) return;

    const duration = currentSlideConfig.duration;
    const interval = 50; // Update progress every 50ms
    const steps = duration / interval;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      setProgress((step / steps) * 100);

      if (step >= steps) {
        clearInterval(timer);
        nextSlide();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, currentSlideConfig, nextSlide]);

  // Keyboard controls (skip when user is typing in an input/textarea/editor)
  useEffect(() => {
    const isTypingElement = (el: HTMLElement | null) => {
      if (!el) return false;
      return (
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.getAttribute('contenteditable') === 'true' ||
        !!el.closest('[contenteditable="true"]')
      );
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const active = document.activeElement as HTMLElement;
      const isTyping = isTypingElement(target) || isTypingElement(active);
      if (isTyping) return;

      if (e.key === 'ArrowLeft') {
        previousSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextSlide, previousSlide, isPlaying]);

  if (!config.showControls) return null;

  const contentPosition: SlideContentPosition =
    currentSlideConfig?.contentPosition ?? 'bottom-center';

  const positionClasses: Record<SlideContentPosition, string> = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'middle-left': 'top-1/2 -translate-y-1/2 left-4',
    'middle-center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'middle-right': 'top-1/2 -translate-y-1/2 right-4',
    'bottom-left': 'bottom-8 left-4',
    'bottom-center': 'bottom-8 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-8 right-4',
  };

  return (
    <div
      className={`fixed z-20 max-w-sm ${positionClasses[contentPosition]} ${className}`}
    >
      <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Progress Bar */}
        {config.showProgress && currentSlideConfig?.duration && isPlaying && (
          <div className="h-1 bg-gray-200">
            <div
              className="h-full bg-blue-600 transition-all duration-50"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="px-4 py-3 flex items-center gap-4">
          <button
            onClick={previousSlide}
            disabled={!config.loop && currentSlide === 0}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous slide (←)"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-6.586-4.125A1 1 0 007 8.006v7.988a1 1 0 001.166.963l6.586-4.125a1 1 0 000-1.664z" />
              </svg>
            )}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {currentSlide + 1} / {slides.length}
            </span>
          </div>

          <button
            onClick={nextSlide}
            disabled={!config.loop && currentSlide === slides.length - 1}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next slide (→)"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="flex gap-1 ml-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'bg-blue-600 w-6'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                title={slides[index].title}
              />
            ))}
          </div>
        </div>

        {/* Slide Title & Description – same card as nav */}
        {currentSlideConfig && (currentSlideConfig.title || currentSlideConfig.description) && (
          <div className="px-4 pb-3 pt-0">
            {currentSlideConfig.title && (
              <h3 className="font-semibold text-gray-800 text-sm">
                {currentSlideConfig.title}
              </h3>
            )}
            {currentSlideConfig.description && (
              <div className="text-xs text-gray-600 mt-1 prose prose-sm max-w-none">
                {currentSlideConfig.description.trim().startsWith('<') ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: currentSlideConfig.description }}
                    className="slideshow-description"
                  />
                ) : (
                  <p>{currentSlideConfig.description}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Slideshow;
