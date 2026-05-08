import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';

interface ComparisonSliderProps {
  before: string;
  after: string;
  className?: string;
  isSharing?: boolean;
}

export const ComparisonSlider = ({ before, after, className, isSharing }: ComparisonSliderProps) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = (x / rect.width) * 100;
    setSliderPos(Math.min(Math.max(position, 0), 100));
  };

  const onMouseDown = () => { isDragging.current = true; };
  const onMouseUp = () => { isDragging.current = false; };
  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) handleMove(e.clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  // Auto-slide animation for sharing showcase
  useEffect(() => {
    if (isSharing) {
      let startTime = Date.now();
      const duration = 2000; // 2 seconds

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Sine wave swing for "motion" look: 50 -> 30 -> 70 -> 50
        const swing = Math.sin(progress * Math.PI * 2) * 25;
        setSliderPos(50 + swing);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setSliderPos(50);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isSharing]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full aspect-square overflow-hidden rounded-[24px] cursor-ew-resize select-none border border-white/10 group bg-zinc-900",
        className
      )}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onMouseMove={onMouseMove}
      onTouchMove={onTouchMove}
      onTouchStart={onMouseDown}
      onTouchEnd={onMouseUp}
    >
      {/* After Image (The Result) */}
      <img 
        src={after} 
        alt="After" 
        className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
        draggable={false}
      />
      
      {/* Before Image (Clipped) */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none transition-all duration-75" 
        style={{ width: `${sliderPos}%` }}
      >
        <img 
          src={before} 
          alt="Before" 
          className="absolute inset-0 h-full object-cover max-w-none pointer-events-none" 
          draggable={false}
          style={{ width: containerWidth || '100%' }}
        />
      </div>

      {/* Draggable Divider */}
      <div 
        className="absolute inset-y-0 w-1 bg-white/80 backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 transition-all duration-75"
        style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-neon-blue">
          <div className="flex gap-1">
             <div className="w-0.5 h-3 bg-neon-blue rounded-full" />
             <div className="w-0.5 h-3 bg-neon-blue rounded-full" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-6 left-6 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[10px] font-bold tracking-[2px] text-white uppercase pointer-events-none">
        Original
      </div>
      <div className="absolute top-6 right-6 px-3 py-1.5 bg-neon-pink rounded-lg text-[10px] font-black tracking-[2px] text-black uppercase pointer-events-none shadow-lg">
        Virsa AI
      </div>

      {/* Guide Overlay (fades out on first interaction) */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};
