import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { MOTION_EASE } from '../constants/design';

export function SecondaryButton({
  onClick,
  label = 'Skip',
  icon,
  disabled
}: {
  onClick: () => void;
  label?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled && !shouldReduceMotion ? { scale: 1.01, boxShadow: '0 4px 16px rgba(212, 175, 55, 0.2)' } : undefined}
      whileTap={!disabled && !shouldReduceMotion ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.2, ease: MOTION_EASE }}
      className="btn-secondary w-full flex items-center justify-center gap-2"
      style={disabled ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
    >
      {icon}
      {label}
    </motion.button>
  );
}
