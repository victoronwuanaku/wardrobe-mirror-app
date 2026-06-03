import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import { MOTION_EASE, scaleInMotion } from '../constants/design';

export function SelectionTile({
  label,
  selected,
  onClick,
  icon,
  description
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  description?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      onClick={onClick}
      whileHover={shouldReduceMotion ? undefined : { scale: 1.01, boxShadow: selected ? '0 6px 28px rgba(212, 175, 55, 0.35)' : '0 4px 16px rgba(255, 255, 255, 0.05)' }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.2, ease: MOTION_EASE }}
      className="selection-tile w-full rounded-xl sm:rounded-2xl text-left touch-manipulation"
      style={{
        padding: 'clamp(1rem, 4vw, 1.25rem)',
        background: selected
          ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(138, 154, 91, 0.12))'
          : 'rgba(255, 255, 255, 0.04)',
        border: selected
          ? '1px solid rgba(212, 175, 55, 0.4)'
          : '1px solid rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: selected
          ? '0 0 24px rgba(212, 175, 55, 0.2), 0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
          : '0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        minHeight: '48px',
        transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
      }}
    >
      <div className="flex items-center gap-3 sm:gap-4 relative z-10">
        {icon && (
          <div aria-hidden="true" style={{
            color: selected ? '#d4af37' : '#f5f1e8',
            filter: selected ? 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.5))' : 'none',
            transition: 'all 0.3s ease'
          }}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm sm:text-base font-light leading-snug" style={{
            fontFamily: 'Georgia, serif',
            color: selected ? '#d4af37' : '#f5f1e8',
            textShadow: selected ? '0 0 10px rgba(212, 175, 55, 0.3)' : 'none'
          }}>
            {label}
          </div>
          {description && (
            <div className="text-xs mt-1 font-light leading-relaxed" style={{
              color: selected ? 'rgba(212, 175, 55, 0.7)' : 'rgba(245, 241, 232, 0.6)'
            }}>
              {description}
            </div>
          )}
        </div>
        {selected && (
          <motion.div
            className="flex-shrink-0"
            {...scaleInMotion(shouldReduceMotion, 0)}
          >
            <Check className="w-5 h-5" style={{
              color: '#d4af37',
              filter: 'drop-shadow(0 0 6px rgba(212, 175, 55, 0.6))'
            }} strokeWidth={2.5} />
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}
