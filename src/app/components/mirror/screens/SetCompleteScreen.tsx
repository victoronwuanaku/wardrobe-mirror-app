import React from 'react';
import { motion } from 'motion/react';
import { MOTION_EASE, fadeRiseMotion, scaleInMotion } from '../constants/design';
import { ContinueButton } from '../ui/ContinueButton';
import { SecondaryButton } from '../ui/SecondaryButton';
import type { CurrentSet, MotionPreference } from '../types';

interface SetCompleteScreenProps {
  shouldReduceMotion: MotionPreference;
  currentSet: CurrentSet;
  completedCount: number;
  onContinue: () => void;
  onFinish: () => void;
}

export function SetCompleteScreen({
  shouldReduceMotion,
  currentSet,
  completedCount,
  onContinue,
  onFinish,
}: SetCompleteScreenProps) {
  const completionPercentage = (completedCount / 3) * 100;

  return (
      <div className="wm-screen-centered gradient-bg-animated">
        <div className="gradient-overlay-animated" />
        <motion.div
          className="wm-content text-center px-4 space-y-8 sm:space-y-12"
          {...scaleInMotion(shouldReduceMotion)}
        >
          <motion.div
            className="text-8xl"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0, rotate: -120 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.2 : 0.55, delay: shouldReduceMotion ? 0 : 0.15, ease: MOTION_EASE }}
          >
            ✨
          </motion.div>
          <motion.div {...fadeRiseMotion(shouldReduceMotion, 0.3)}>
            <h2 className="text-heading-responsive text-serif-elegant text-light text-safe mb-4">
              Set {currentSet} Complete!
            </h2>
            <div className="inline-block px-6 py-3 rounded-full bg-gold-subtle border border-gold">
              <p className="text-body-responsive text-sans-clean text-gold text-safe">
                {completedCount} of 3 sets • {completionPercentage.toFixed(0)}% complete
              </p>
            </div>
          </motion.div>
          {currentSet !== 'C' ? (
            <motion.div
              className="grid grid-cols-2 gap-3"
              {...fadeRiseMotion(shouldReduceMotion, 0.45)}
            >
              <SecondaryButton onClick={onFinish} label="Finish Now" />
              <ContinueButton onClick={onContinue} label={`Continue to Set ${currentSet === 'A' ? 'B' : 'C'}`} />
            </motion.div>
          ) : (
            <motion.div {...fadeRiseMotion(shouldReduceMotion, 0.45)}>
              <ContinueButton onClick={onFinish} label="Finish Now" />
            </motion.div>
          )}
        </motion.div>
      </div>
  );
}
