'use client';

import React, { useState, ReactNode } from 'react';
import { SidePanelConfig } from './types';

interface SidePanelProps {
  config: SidePanelConfig;
  children?: ReactNode;
  className?: string;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  config,
  children,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(config.defaultExpanded ?? true);

  const position = config.position || 'right';
  const width = config.width || '384px'; // Default ~96 in Tailwind (24rem)

  const positionClasses = position === 'left' ? 'left-0' : 'right-0';
  const collapseDirection = position === 'left' ? '-translate-x-full' : 'translate-x-full';

  return (
    <>
      {/* Side Panel */}
      <div
        className={`fixed top-0 ${positionClasses} h-full bg-white shadow-2xl z-20 transition-transform duration-300 ease-in-out ${
          isExpanded ? 'translate-x-0' : collapseDirection
        } ${className}`}
        style={{ width: isExpanded ? width : '0' }}
      >
        <div className="h-full flex flex-col overflow-hidden">
          {/* Header */}
          {config.title && (
            <div className="flex-shrink-0 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <h2 className="text-xl font-bold">{config.title}</h2>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {config.content || children}
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      {config.collapsible && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`fixed top-1/2 -translate-y-1/2 z-30 bg-white hover:bg-gray-50 shadow-lg rounded-lg p-2 transition-all duration-300 ${
            position === 'left'
              ? isExpanded
                ? 'left-[' + width + ']'
                : 'left-0'
              : isExpanded
              ? 'right-[' + width + ']'
              : 'right-0'
          }`}
          style={{
            [position]: isExpanded ? width : '0',
          }}
          title={isExpanded ? 'Collapse panel' : 'Expand panel'}
        >
          <svg
            className={`w-5 h-5 text-gray-700 transition-transform ${
              isExpanded
                ? position === 'left'
                  ? 'rotate-180'
                  : ''
                : position === 'left'
                ? ''
                : 'rotate-180'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}
    </>
  );
};

export default SidePanel;
