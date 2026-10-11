import React, { useState, useEffect } from 'react';

export const ClockComponent: React.FC<{ collapsed?: boolean; mode?: 'brand' | 'sidebar' }> = ({ collapsed, mode = 'sidebar' }) => {
  const [time, setTime] = React.useState(() => {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  });

  React.useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toTimeString().split(' ')[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (mode === 'brand') {
    return <p className="text-xs font-bold text-slate-400 font-mono tracking-widest leading-none mt-1">{time}</p>;
  }

  if (collapsed) {
    return (
      <p className="text-[10px] font-black text-slate-600 tracking-tight font-mono whitespace-nowrap">
        {time.substring(0, 5)}
      </p>
    );
  }

  return (
    <p className="text-base font-extrabold text-slate-600 tracking-widest font-mono">
      {time}
    </p>
  );
};
