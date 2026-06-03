import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { MOTION_EASE } from '../constants/design';

export function ContinueButton({
  onClick,
  disabled,
  label = 'Continue'
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled && !shouldReduceMotion ? { scale: 1.02, boxShadow: '0 6px 24px rgba(212, 175, 55, 0.5)' } : undefined}
      whileTap={!disabled && !shouldReduceMotion ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.2, ease: MOTION_EASE }}
      className="btn-primary w-full flex items-center justify-center gap-3"
    >
      <span>{label}</span>
      <motion.span
        className="flex"
        initial={{ x: 0 }}
        animate={!disabled && !shouldReduceMotion ? { x: [0, 4, 0] } : { x: 0 }}
        transition={!disabled && !shouldReduceMotion ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
      >
        <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
      </motion.span>
    </motion.button>
  );
}
