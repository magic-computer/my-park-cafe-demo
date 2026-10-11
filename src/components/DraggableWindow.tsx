import React, { useState, useRef, useEffect } from 'react';
import { DraggableWindowProps } from '../types';

export const DraggableWindow: React.FC<DraggableWindowProps> = ({ title, onClose, children, widthClass = "w-full max-w-sm" }) => {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);

  useEffect(() => {
    const width = widthClass.includes("max-w-md") ? 448 : widthClass.includes("max-w-lg") ? 512 : 384;
    const x = Math.max(10, (window.innerWidth - width) / 2);
    const y = Math.max(10, (window.innerHeight - 520) / 2);
    setPosition({ x, y });
  }, [widthClass]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y
    };
    (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    
    let newX = dragRef.current.posX + dx;
    let newY = dragRef.current.posY + dy;

    newX = Math.max(5, Math.min(window.innerWidth - 150, newX));
    newY = Math.max(5, Math.min(window.innerHeight - 150, newY));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    (e.target as HTMLDivElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div 
      style={{ left: `${position.x}px`, top: `${position.y}px`, position: 'absolute' }}
      className={`z-50 ${widthClass} bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150`}
    >
      <div 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="h-11 bg-slate-950 text-white px-4 flex items-center justify-between cursor-move select-none shrink-0 touch-none"
      >
        <span className="text-[10px] font-black uppercase tracking-wider">{title}</span>
        {onClose && (
          <button 
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer text-xs font-bold leading-none"
          >
            ✕
          </button>
        )}
      </div>
      <div className="p-4 overflow-y-auto max-h-[85vh] bg-white text-slate-800">
        {children}
      </div>
    </div>
  );
};
