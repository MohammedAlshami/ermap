'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SlideConfig, SlideshowConfig } from './types';
import mapboxgl from 'mapbox-gl';

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

      // Remove old layers
      oldSlide?.layers?.forEach((layerConfig) => {
        layerConfig.layers.forEach((layer) => {
          if (map.getLayer(layer.id)) {
            map.removeLayer(layer.id);
          }
        });
        if (map.getSource(layerConfig.id)) {
          map.removeSource(layerConfig.id);
        }
      });

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

      // Add new layers
      newSlide.layers?.forEach((layerConfig) => {
        // Add source
        if (!map.getSource(layerConfig.id)) {
          map.addSource(layerConfig.id, layerConfig.source as any);
        }

        // Add layers
        layerConfig.layers.forEach((layer) => {
          if (!map.getLayer(layer.id)) {
            map.addLayer({
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

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
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

  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-20 ${className}`}>
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
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
          {/* Previous Button */}
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

          {/* Play/Pause Button */}
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

          {/* Slide Counter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {currentSlide + 1} / {slides.length}
            </span>
          </div>

          {/* Next Button */}
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

          {/* Slide Indicators */}
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

        {/* Slide Title */}
        {currentSlideConfig && (
          <div className="px-4 pb-3 pt-0">
            <h3 className="font-semibold text-gray-800 text-sm">
              {currentSlideConfig.title}
            </h3>
            {currentSlideConfig.description && (
              <p className="text-xs text-gray-600 mt-1">
                {currentSlideConfig.description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Slideshow;
