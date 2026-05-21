import React from 'react';

interface SafeSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export const SafeSparkline: React.FC<SafeSparklineProps> = ({ 
  data, 
  width = 80, 
  height = 24, 
  color = 'currentColor' 
}) => {
  if (!data || data.length === 0) {
    return <div style={{ width, height }} className="flex items-center justify-center"><div className="w-full h-px bg-border-subtle dark:bg-border-default" /></div>;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const step = width / (data.length - 1);
  
  const points = data.map((val, i) => {
    const x = i * step;
    const y = range === 0 ? height / 2 : height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};
