'use client';

import React, { useState } from 'react';
import { LegendConfig, LegendEntry } from './types';

interface LegendProps {
  config: LegendConfig;
  className?: string;
}

export const Legend: React.FC<LegendProps> = ({ config, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(config.defaultExpanded ?? true);

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const position = config.position || 'bottom-left';

  const renderLegendEntry = (entry: LegendEntry, index: number) => {
    const sizeClasses = {
      small: 'w-3 h-3',
      medium: 'w-4 h-4',
      large: 'w-5 h-5',
    };

    const size = entry.size || 'medium';

    return (
      <div
        key={index}
        className="flex items-start gap-2 py-1"
        title={entry.description}
      >
        {entry.icon ? (
          <div className={`flex-shrink-0 ${sizeClasses[size]}`}>
            {entry.icon}
          </div>
        ) : entry.color ? (
          <div
            className={`flex-shrink-0 ${sizeClasses[size]} rounded-sm border border-gray-300`}
            style={{
              backgroundColor: entry.color,
              borderStyle: entry.pattern || 'solid',
            }}
          />
        ) : null}
        <span className="text-sm text-gray-700 leading-tight">
          {entry.label}
        </span>
      </div>
    );
  };

  return (
    <div
      className={`absolute ${positionClasses[position]} z-10 ${className}`}
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {config.collapsible ? (
          <>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
            >
              {config.title && (
                <span className="font-semibold text-gray-800 text-sm">
                  {config.title}
                </span>
              )}
              <svg
                className={`w-4 h-4 text-gray-600 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {isExpanded && (
              <div className="px-4 py-3 max-h-96 overflow-y-auto">
                {config.entries.map(renderLegendEntry)}
              </div>
            )}
          </>
        ) : (
          <>
            {config.title && (
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <span className="font-semibold text-gray-800 text-sm">
                  {config.title}
                </span>
              </div>
            )}
            <div className="px-4 py-3 max-h-96 overflow-y-auto">
              {config.entries.map(renderLegendEntry)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Legend;
