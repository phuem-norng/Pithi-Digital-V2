'use client';

import { ReactNode, useRef, useEffect, useState } from 'react';

type ResizableSplitLayoutProps = {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  defaultLeftWidth?: number; // percentage: 0-100
  minLeftWidth?: number; // pixels
  minRightWidth?: number; // pixels
};

export default function ResizableSplitLayout({
  leftPanel,
  rightPanel,
  defaultLeftWidth = 52.5,
  minLeftWidth = 300,
  minRightWidth = 350,
}: ResizableSplitLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Retrieve saved width from localStorage
    const savedWidth = localStorage.getItem('invitation-builder-left-width');
    if (savedWidth) {
      setLeftWidth(parseFloat(savedWidth));
    }
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Calculate pixel values to check against minimums
      const containerWidth = containerRect.width;
      const leftPixels = (newLeftWidth / 100) * containerWidth;
      const rightPixels = ((100 - newLeftWidth) / 100) * containerWidth;

      // Apply minimum width constraints
      if (leftPixels >= minLeftWidth && rightPixels >= minRightWidth) {
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Save width to localStorage
      localStorage.setItem('invitation-builder-left-width', leftWidth.toString());
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, leftWidth, minLeftWidth, minRightWidth]);

  const rightWidth = 100 - leftWidth;

  return (
    <div
      ref={containerRef}
      className="flex h-full gap-0 overflow-hidden"
    >
      {/* Left Panel */}
      <div
        style={{ width: `${leftWidth}%` }}
        className="overflow-hidden transition-all duration-0"
      >
        {leftPanel}
      </div>

      {/* Divider */}
      <div
        onMouseDown={() => setIsDragging(true)}
        className="group relative w-1 cursor-col-resize select-none bg-gray-200 transition-colors hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600"
      >
        {/* Handle Icon */}
        <div className="absolute inset-y-0 -left-3 -right-3 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center rounded-md bg-gray-300 px-2 py-1 opacity-0 transition-opacity shadow-sm group-hover:opacity-100 dark:bg-slate-600">
            {/* 6-dot drag pattern */}
            <div className="flex gap-1">
              <div className="h-1 w-1 rounded-full bg-white"></div>
              <div className="h-1 w-1 rounded-full bg-white"></div>
            </div>
            <div className="flex gap-1">
              <div className="h-1 w-1 rounded-full bg-white"></div>
              <div className="h-1 w-1 rounded-full bg-white"></div>
            </div>
            <div className="flex gap-1">
              <div className="h-1 w-1 rounded-full bg-white"></div>
              <div className="h-1 w-1 rounded-full bg-white"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div
        style={{ width: `${rightWidth}%` }}
        className="overflow-hidden transition-all duration-0"
      >
        {rightPanel}
      </div>
    </div>
  );
}
