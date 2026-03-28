"use client";

import { useEffect, useState } from "react";

interface FatexiBallProps {
  score: number; // 0-100
}

export default function FatexiBall({ score }: FatexiBallProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine state based on score
  const isHigh = score >= 70;
  const isLow = score <= 30;
  const isMid = !isHigh && !isLow;

  // Color interpolation
  const getColor = () => {
    if (isHigh) return { primary: '#00FF88', secondary: '#00D4FF', glow: 'rgba(0, 255, 136, 0.4)' };
    if (isLow) return { primary: '#FF3366', secondary: '#FF006E', glow: 'rgba(255, 51, 102, 0.4)' };
    return { primary: '#00D4FF', secondary: '#8B5CF6', glow: 'rgba(0, 212, 255, 0.3)' };
  };

  const colors = getColor();

  // Ball shape based on score
  const getShape = () => {
    if (isHigh) return 'circle';
    if (isLow) return 'polygon';
    return 'ellipse';
  };

  // Pulsing animation speed
  const getPulseSpeed = () => {
    if (isHigh) return '3s';
    if (isLow) return '1.5s';
    return '2.5s';
  };

  if (!mounted) {
    return (
      <div className="w-48 h-48 flex items-center justify-center">
        <div className="w-32 h-32 rounded-full" style={{ background: 'rgba(0, 212, 255, 0.1)' }} />
      </div>
    );
  }

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {/* Outer glow ring */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at center, transparent 40%, ${colors.glow} 70%, transparent 100%)`,
          animation: `pulse-ball ${getPulseSpeed()} ease-in-out infinite`
        }}
      />

      {/* Main ball */}
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <radialGradient id="ballGradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor={colors.secondary} stopOpacity="0.8" />
            <stop offset="50%" stopColor={colors.primary} stopOpacity="0.6" />
            <stop offset="100%" stopColor={colors.primary} stopOpacity="0.2" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="innerShadow">
            <feOffset dx="0" dy="4"/>
            <feGaussianBlur stdDeviation="6" result="offset-blur"/>
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse"/>
            <feFlood floodColor={colors.primary} floodOpacity="0.3" result="color"/>
            <feComposite operator="in" in="color" in2="inverse" result="shadow"/>
            <feComposite operator="over" in="shadow" in2="SourceGraphic"/>
          </filter>
        </defs>

        {/* Main orb */}
        <circle
          cx="100"
          cy="100"
          r={isHigh ? 70 : isLow ? 60 : 65}
          fill="url(#ballGradient)"
          filter="url(#glow)"
          style={{
            animation: `morph-ball ${getPulseSpeed()} ease-in-out infinite`,
            transformOrigin: 'center'
          }}
        />

        {/* Inner highlight */}
        <ellipse
          cx="80"
          cy="75"
          rx={isHigh ? 25 : 20}
          ry={isHigh ? 20 : 15}
          fill="white"
          opacity="0.15"
          style={{ filter: 'blur(3px)' }}
        />

        {/* Score text */}
        <text
          x="100"
          y="108"
          textAnchor="middle"
          fill="white"
          fontSize="28"
          fontWeight="600"
          fontFamily="var(--font-mono)"
          style={{ filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.5))' }}
        >
          {score}
        </text>
      </svg>

      {/* Status label */}
      <div 
        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-medium px-3 py-1 rounded-full"
        style={{ 
          background: 'rgba(0,0,0,0.4)',
          border: `1px solid ${colors.primary}`,
          color: colors.primary,
          boxShadow: `0 0 10px ${colors.glow}`
        }}
      >
        {isHigh ? '▲ 極佳' : isLow ? '▼ 警示' : '◆ 平穩'}
      </div>

      <style jsx>{`
        @keyframes pulse-ball {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        @keyframes morph-ball {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(${isHigh ? 1.08 : isLow ? 0.95 : 1.03}); }
        }
      `}</style>
    </div>
  );
}
