"use client";

import { useEffect, useState } from "react";

interface IndicatorCardProps {
  title: string;
  value: number; // 0-100
  icon: string;
  unit?: string;
  trend?: "up" | "down" | "stable";
  lastUpdate?: string;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 800;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{display}</span>;
}

export default function IndicatorCard({ 
  title, 
  value, 
  icon, 
  unit = "分",
  trend = "stable",
  lastUpdate
}: IndicatorCardProps) {
  const getColor = () => {
    if (value >= 70) return { main: '#00FF88', glow: 'rgba(0, 255, 136, 0.2)' };
    if (value <= 30) return { main: '#FF3366', glow: 'rgba(255, 51, 102, 0.2)' };
    return { main: '#00D4FF', glow: 'rgba(0, 212, 255, 0.2)' };
  };

  const getTrendIcon = () => {
    if (trend === "up") return "↗";
    if (trend === "down") return "↘";
    return "→";
  };

  const color = getColor();

  // Progress bar width
  const progressWidth = `${value}%`;

  return (
    <div 
      className="relative overflow-hidden rounded-lg p-5 transition-all duration-300 hover:scale-[1.02]"
      style={{
        background: 'linear-gradient(135deg, #0D0D1A 0%, #111128 100%)',
        border: `1px solid ${color.main}20`,
        boxShadow: `0 0 20px ${color.glow}`
      }}
    >
      {/* Top accent line */}
      <div 
        className="absolute top-0 left-0 right-0 h-px"
        style={{ 
          background: `linear-gradient(90deg, transparent, ${color.main}, transparent)`,
          boxShadow: `0 0 10px ${color.main}`
        }}
      />

      {/* Icon and title */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
            style={{ background: `${color.main}15`, border: `1px solid ${color.main}30` }}
          >
            {icon}
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: '#E0E0E0' }}>{title}</div>
            {lastUpdate && (
              <div className="text-xs mt-0.5" style={{ color: '#666680' }}>{lastUpdate}</div>
            )}
          </div>
        </div>
        <div 
          className="text-2xl"
          style={{ color: color.main, textShadow: `0 0 10px ${color.main}` }}
        >
          {getTrendIcon()}
        </div>
      </div>

      {/* Score display */}
      <div className="flex items-end gap-2 mb-3">
        <div 
          className="text-4xl font-bold"
          style={{ 
            color: color.main, 
            fontFamily: 'var(--font-mono)',
            textShadow: `0 0 20px ${color.main}80`
          }}
        >
          <AnimatedNumber value={value} />
        </div>
        <div className="text-sm mb-1" style={{ color: '#666680' }}>{unit}</div>
      </div>

      {/* Progress bar */}
      <div 
        className="h-1 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        <div 
          className="h-full rounded-full transition-all duration-700"
          style={{ 
            width: progressWidth,
            background: `linear-gradient(90deg, ${color.main}80, ${color.main})`,
            boxShadow: `0 0 8px ${color.main}`
          }}
        />
      </div>

      {/* Label */}
      <div className="mt-3 text-xs" style={{ color: '#666680' }}>
        {value >= 70 ? '表現極佳，宜把握時機' : value <= 30 ? '需注意休息，保守行事' : '平穩發展，保持節奏'}
      </div>
    </div>
  );
}
