import React from 'react';
import { COLORS } from '../constants/design';
import type { ValueMeters } from '../types';

const AXES: Array<{ key: keyof ValueMeters; label: string }> = [
  { key: 'social', label: 'Social' },
  { key: 'emotional', label: 'Emotional' },
  { key: 'functional', label: 'Functional' },
];

export function ValueFingerprintRadar({ values, expectation }: { values: ValueMeters; expectation?: ValueMeters }) {
  const size = 300, center = size / 2, maxRadius = 105;

  const toPoints = (v: ValueMeters) =>
    AXES.map((axis, index) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AXES.length;
      const radius = (v[axis.key] / 100) * maxRadius;
      return { x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius };
    });

  const labelPoints = AXES.map((axis, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AXES.length;
    return {
      ...axis,
      value: values[axis.key],
      lx: center + Math.cos(angle) * (maxRadius + 32),
      ly: center + Math.sin(angle) * (maxRadius + 32),
    };
  });

  const reflectedPoly = toPoints(values).map((p) => `${p.x},${p.y}`).join(' ');
  const expectationPoly = expectation ? toPoints(expectation).map((p) => `${p.x},${p.y}`).join(' ') : null;

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {[0.33, 0.66, 1].map((scale) => (
          <polygon key={scale} points={AXES.map((_, index) => {
            const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AXES.length;
            return `${center + Math.cos(angle) * maxRadius * scale},${center + Math.sin(angle) * maxRadius * scale}`;
          }).join(' ')} fill="none" stroke="rgba(245,241,232,0.18)" strokeWidth="1" />
        ))}
        {AXES.map((_, index) => {
          const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AXES.length;
          return <line key={index} x1={center} y1={center} x2={center + Math.cos(angle) * maxRadius} y2={center + Math.sin(angle) * maxRadius} stroke="rgba(245,241,232,0.18)" strokeWidth="1" />;
        })}
        {expectationPoly && (
          <polygon points={expectationPoly} fill="none" stroke={COLORS.gold} strokeWidth="2" strokeDasharray="5 4" opacity={0.8} />
        )}
        <polygon points={reflectedPoly} fill="rgba(16,185,129,0.22)" stroke="rgb(16,185,129)" strokeWidth="2" />
        {toPoints(values).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="rgb(16,185,129)" />)}
        {labelPoints.map((point) => (
          <g key={point.label}>
            <text x={point.lx} y={point.ly - 5} textAnchor="middle" fill={COLORS.light} fontSize="12" fontFamily="Georgia, serif">{point.label}</text>
            <text x={point.lx} y={point.ly + 11} textAnchor="middle" fill={COLORS.gold} fontSize="12" fontFamily="Georgia, serif">{point.value}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
