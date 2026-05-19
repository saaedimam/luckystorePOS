import { useId } from 'react';

interface SparklineProps {
  data: number[];
  width?: number | string;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
}

export function Sparkline({
  data,
  width = 120,
  height = 36,
  strokeColor = 'var(--color-success-default)',
  strokeWidth = 2,
  fillColor = 'var(--color-success-subtle)',
}: SparklineProps) {
  const gradientId = useId();

  if (!data || data.length === 0) {
    return (
      <svg width={width} height={height} className="opacity-30">
        <line
          x1={0}
          y1={height / 2}
          x2="100%"
          y2={height / 2}
          stroke="var(--color-text-muted)"
          strokeWidth={1}
          strokeDasharray="3,3"
        />
      </svg>
    );
  }

  // Find min & max for normalized scaling
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;

  // Resolve numerical/percentage width for points mapping
  const svgWidth = typeof width === 'number' ? width : 120;

  // Compute rendering points
  const points = data.map((val, index) => {
    const x = data.length > 1 ? (index / (data.length - 1)) * svgWidth : 0;
    // Keep 4px padding top/bottom to prevent path clipping
    const y =
      range === 0
        ? height / 2
        : height - 4 - ((val - min) / range) * (height - 8);
    return { x, y };
  });

  // Handle single data item fallback
  let pathD = '';
  if (points.length === 1) {
    pathD = `M 0 ${points[0].y.toFixed(1)} L ${svgWidth} ${points[0].y.toFixed(1)}`;
  } else {
    pathD = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');
  }

  const areaD = `${pathD} L ${svgWidth} ${height} L 0 ${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${svgWidth} ${height}`}
      style={{ overflow: 'visible' }}
      aria-label="Sparkline trend chart"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={fillColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradientId})`} stroke="none" />
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default Sparkline;
