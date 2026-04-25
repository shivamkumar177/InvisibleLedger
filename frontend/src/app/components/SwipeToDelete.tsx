import React, { useState, useRef, useEffect } from 'react';

interface SwipeToDeleteProps {
  children: React.ReactNode;
  onDelete: () => void;
}

export default function SwipeToDelete({ children, onDelete }: SwipeToDeleteProps) {
  const [startX, setStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = -60; // How far to swipe left to trigger delete

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;

    // Only allow swiping left
    if (diff < 0) {
      setOffsetX(Math.max(diff, -100)); // Limit how far they can swipe
    } else {
      setOffsetX(0);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (offsetX < SWIPE_THRESHOLD) {
      onDelete();
    }
    // Snap back
    setOffsetX(0);
  };

  // Mouse fallback for testing
  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX);
    setIsSwiping(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSwiping) return;
    const currentX = e.clientX;
    const diff = currentX - startX;
    if (diff < 0) {
      setOffsetX(Math.max(diff, -100));
    } else {
      setOffsetX(0);
    }
  };

  const handleMouseUp = () => {
    setIsSwiping(false);
    if (offsetX < SWIPE_THRESHOLD) {
      onDelete();
    }
    setOffsetX(0);
  };

  const handleMouseLeave = () => {
    if (isSwiping) {
      handleMouseUp();
    }
  };

  return (
    <div
      className="relative overflow-hidden w-full"
      ref={containerRef}
    >
      {/* Background delete button */}
      <div className="absolute inset-y-0 right-0 w-20 bg-error flex items-center justify-center text-on-error">
        <span className="material-symbols-outlined">delete</span>
      </div>

      {/* Swipable content */}
      <div
        className="relative bg-background z-10 transition-transform duration-200 ease-out"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
    </div>
  );
}
