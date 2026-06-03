import React from 'react';
import { COLORS } from '../constants/design';
import type { ValueMeters } from '../types';

export function ValueFingerprintRadar({ values }: { values: ValueMeters }) {
  const data = [{ label: 'Social', value: values.social }, { label: 'Emotional', value: values.emotional }, { label: 'Functional', value: values.functional }];
  const size = 300, center = size / 2, maxRadius = 105;
  const points = data.map((item, index) => { const angle = -Math.PI / 2 + (index * 2 * Math.PI) / data.length; const radius = (item.value / 100) * maxRadius; return { ...item, x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius, lx: center + Math.cos(angle) * (maxRadius + 32), ly: center + Math.sin(angle) * (maxRadius + 32) }; });
  const polygon = points.map(p => `${p.x},${p.y}`).join(' ');
  return <div className="flex justify-center"><svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
    {[0.33, 0.66, 1].map((scale) => <polygon key={scale} points={data.map((_, index) => { const angle = -Math.PI / 2 + (index * 2 * Math.PI) / data.length; return `${center + Math.cos(angle) * maxRadius * scale},${center + Math.sin(angle) * maxRadius * scale}`; }).join(' ')} fill="none" stroke="rgba(245,241,232,0.18)" strokeWidth="1" />)}
    {data.map((_, index) => { const angle = -Math.PI / 2 + (index * 2 * Math.PI) / data.length; return <line key={index} x1={center} y1={center} x2={center + Math.cos(angle) * maxRadius} y2={center + Math.sin(angle) * maxRadius} stroke="rgba(245,241,232,0.18)" strokeWidth="1" />; })}
    <polygon points={polygon} fill="rgba(212,175,55,0.28)" stroke={COLORS.gold} strokeWidth="2" />
    {points.map((point) => <circle key={point.label} cx={point.x} cy={point.y} r="4" fill={COLORS.gold} />)}
    {points.map((point) => <g key={point.label}><text x={point.lx} y={point.ly - 5} textAnchor="middle" fill={COLORS.light} fontSize="12" fontFamily="Georgia, serif">{point.label}</text><text x={point.lx} y={point.ly + 11} textAnchor="middle" fill={COLORS.gold} fontSize="12" fontFamily="Georgia, serif">{point.value}</text></g>)}
  </svg></div>;
}
