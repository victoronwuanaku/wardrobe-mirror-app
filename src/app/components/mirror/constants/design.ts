import type { MotionPreference } from '../types';

// V1 Design System Colors - DO NOT MODIFY
// These match wardrobe-mirror.css exactly
export const COLORS = {
  gold: '#d4af37',
  goldMuted: 'rgba(212, 175, 55, 0.7)',
  goldSubtle: 'rgba(212, 175, 55, 0.15)',
  light: '#f5f1e8',
  lightMuted: 'rgba(245, 241, 232, 0.6)',
  olive: '#8a9a5b',
  oliveSubtle: 'rgba(138, 154, 91, 0.15)',
  slateDark: '#1e293b',
  slateDarker: '#0f172a',
  forestDark: '#1a3a2e',
  grayDark: '#2d3748',
  mossGreen: '#1a2e1a', // For button text
};

export const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

export function fadeRiseMotion(shouldReduceMotion: MotionPreference, delay = 0) {
  return shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.2, delay: 0 },
      }
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, delay, ease: MOTION_EASE },
      };
}

export function scaleInMotion(shouldReduceMotion: MotionPreference, delay = 0) {
  return shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.2, delay: 0 },
      }
    : {
        initial: { opacity: 0, scale: 0.92 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.45, delay, ease: MOTION_EASE },
      };
}
