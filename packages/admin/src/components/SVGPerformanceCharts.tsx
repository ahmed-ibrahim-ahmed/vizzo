/**
 * @vizzo/admin — SVGPerformanceCharts Component
 * Custom responsive charting engine using 100% native SVG vector coordinates.
 * No external charting libraries used. Features carbon styling with neon glows.
 */

import { useState } from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface SVGPerformanceChartsProps {
  data: DataPoint[];
  title: string;
  lineColor?: string;
  gradientId?: string;
  fillColor?: string;
}

export function SVGPerformanceCharts({
  data,
  title,
  lineColor = '#ef4444',
  gradientId = 'chart-crimson-gradient',
  fillColor = 'rgba(239, 68, 68, 0.1)',
}: SVGPerformanceChartsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="empty-chart">لا يوجد بيانات كافية للرسم البياني</div>;
  }

  // Dimension Configurations
  const width = 600;
  const height = 240;
  const paddingX = 45;
  const paddingY = 30;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Max and Min calculations
  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 10); // Minimum scale floor of 10
  const minValue = 0;
  const range = maxValue - minValue;

  // Coordinate Calculations
  const points = data.map((d, index) => {
    const x = paddingX + (index / (data.length - 1)) * chartWidth;
    const y = paddingY + chartHeight - ((d.value - minValue) / range) * chartHeight;
    return { x, y, label: d.label, value: d.value };
  });

  // Construct Line Path ('M x y L x y ...')
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Construct Closed Area Path for Gradient Under-fill
  const areaD = `
    ${pathD}
    L ${points[points.length - 1].x} ${height - paddingY}
    L ${points[0].x} ${height - paddingY}
    Z
  `;

  return (
    <div className="chart-card-wrapper">
      <h3 className="chart-card-title">{title}</h3>
      <div className="chart-svg-container">
        <svg viewBox={`0 0 ${width} ${height}`} className="performance-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Area underfill gradient */}
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.28} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0.0} />
            </linearGradient>
            {/* Glow drop-shadow filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid background lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingY + chartHeight * ratio;
            const gridVal = Math.round(maxValue - range * ratio);
            return (
              <g key={i} className="chart-grid-line-group">
                <line 
                  x1={paddingX} 
                  y1={y} 
                  x2={width - paddingX} 
                  y2={y} 
                  stroke="rgba(255, 255, 255, 0.05)" 
                  strokeWidth="1" 
                  strokeDasharray="4 4"
                />
                <text 
                  x={paddingX - 10} 
                  y={y + 4} 
                  fill="rgba(255, 255, 255, 0.35)" 
                  fontSize="10" 
                  textAnchor="end"
                  fontFamily="Inter"
                >
                  {gridVal}
                </text>
              </g>
            );
          })}

          {/* Render Area Fill */}
          <path d={areaD} fill={`url(#${gradientId})`} />

          {/* Render Main Glowing Trend Line */}
          <path
            d={pathD}
            fill="none"
            stroke={lineColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />

          {/* Data Circle Markers */}
          {points.map((p, i) => (
            <g 
              key={i} 
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? 6 : 4}
                fill={lineColor}
                stroke="#09090b"
                strokeWidth="2"
                style={{ transition: 'r 0.15s ease' }}
              />
              {/* Tooltip Overlay inside SVG */}
              {hoveredIndex === i && (
                <g>
                  {/* Tooltip Card Background */}
                  <rect
                    x={Math.max(5, p.x - 50)}
                    y={p.y - 38}
                    width="100"
                    height="24"
                    rx="4"
                    fill="#16161a"
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="1"
                  />
                  {/* Tooltip Text */}
                  <text
                    x={p.x}
                    y={p.y - 22}
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="Noto Sans Arabic, Inter"
                  >
                    {p.value} {p.label}
                  </text>
                </g>
              )}
            </g>
          ))}

          {/* X Axis Labels */}
          {points.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={height - paddingY + 16}
              fill="rgba(255, 255, 255, 0.45)"
              fontSize="10"
              fontWeight="medium"
              textAnchor="middle"
              fontFamily="Noto Sans Arabic, Inter"
            >
              {p.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
