interface SparklineProps {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  filled?: boolean;
  className?: string;
}

export function Sparkline({
  values,
  color = '#4ade80',
  width = 100,
  height = 28,
  strokeWidth = 1.5,
  filled = true,
  className = '',
}: SparklineProps) {
  if (!values || values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pad = strokeWidth;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * w;
    const y = pad + h - ((v - min) / range) * h;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const fillD = `${pathD} L ${pad + w},${pad + h} L ${pad},${pad + h} Z`;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={`overflow-visible ${className}`}
    >
      {filled && (
        <path
          d={fillD}
          fill={color}
          fillOpacity={0.1}
        />
      )}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={points[points.length - 1].split(',')[0]}
        cy={points[points.length - 1].split(',')[1]}
        r={2}
        fill={color}
      />
    </svg>
  );
}
