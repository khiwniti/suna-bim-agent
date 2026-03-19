import { useState, useCallback, useRef, useEffect } from 'react';

interface UseResizableOptions {
  initialWidth: number;
  min: number;
  max: number;
  onWidthChange?: (width: number) => void;
}

interface UseResizableReturn {
  width: number;
  setWidth: (width: number) => void;
  isDragging: boolean;
  dragHandleProps: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    role: string;
    tabIndex: number;
    'aria-label': string;
    'aria-valuemin': number;
    'aria-valuemax': number;
    'aria-valuenow': number;
    onKeyDown: (e: React.KeyboardEvent) => void;
  };
}

export function useResizable({
  initialWidth,
  min,
  max,
  onWidthChange,
}: UseResizableOptions): UseResizableReturn {
  const [width, setWidthInternal] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const setWidth = useCallback(
    (newWidth: number) => {
      const clamped = Math.max(min, Math.min(max, newWidth));
      setWidthInternal(clamped);
      onWidthChange?.(clamped);
    },
    [min, max, onWidthChange]
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (clientX: number) => {
      setIsDragging(true);
      startXRef.current = clientX;
      startWidthRef.current = width;
      containerRef.current = document.body;
    },
    [width]
  );

  // Handle mouse move during drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientX: number) => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth;
      const deltaX = startXRef.current - clientX;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = startWidthRef.current + deltaPercent;

      setWidth(newWidth);
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleMove(e.touches[0].clientX);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, setWidth]);

  // Keyboard handling for accessibility
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = 2; // 2% per key press
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setWidth(width - step);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setWidth(width + step);
      }
    },
    [width, setWidth]
  );

  const dragHandleProps = {
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      handleDragStart(e.clientX);
    },
    onTouchStart: (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        handleDragStart(e.touches[0].clientX);
      }
    },
    role: 'slider' as const,
    tabIndex: 0,
    'aria-label': 'Resize sidebar',
    'aria-valuemin': min,
    'aria-valuemax': max,
    'aria-valuenow': Math.round(width),
    onKeyDown: handleKeyDown,
  };

  return { width, setWidth, isDragging, dragHandleProps };
}
