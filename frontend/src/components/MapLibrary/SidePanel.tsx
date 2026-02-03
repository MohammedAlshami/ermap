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
      {/* Side Panel - no heavy shadow, minimal look */}
      <div
        className={`fixed top-0 ${positionClasses} h-full bg-white z-20 transition-transform duration-300 ease-in-out ${
          position === 'left' ? 'border-r border-border/80' : 'border-l border-border/80'
        } ${isExpanded ? 'translate-x-0' : collapseDirection} ${className}`}
        style={{ width: isExpanded ? width : '0' }}
      >
        <div className="h-full flex flex-col overflow-hidden">
          {/* Compact header */}
          {config.title && (
            <div className="flex-shrink-0 px-3 py-2.5 bg-muted/30 flex items-center gap-2">
              {config.onBack && (
                <button
                  type="button"
                  onClick={config.onBack}
                  className="p-1.5 -ml-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Back"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h2 className="text-sm font-semibold text-foreground flex-1 min-w-0 truncate">{config.title}</h2>
              {config.headerRight}
            </div>
          )}

          {/* Content - flex so children (e.g. chat) can fill and scroll internally */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {config.content || children}
          </div>
        </div>
      </div>

      {/* Toggle button - compact, clear button UI */}
      {config.collapsible && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="fixed top-4 z-30 flex items-center justify-center w-8 h-8 rounded-md bg-background border border-border shadow-sm hover:bg-muted transition-all duration-300 text-foreground"
          style={{
            [position]: isExpanded ? width : '8px',
          }}
          title={isExpanded ? 'Collapse panel' : 'Expand panel'}
        >
          <svg
            className={`w-4 h-4 transition-transform ${
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
              d={position === 'left' ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}
            />
          </svg>
        </button>
      )}
    </>
  );
};

export default SidePanel;
