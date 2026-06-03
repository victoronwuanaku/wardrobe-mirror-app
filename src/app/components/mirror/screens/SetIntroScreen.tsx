import React from 'react';
import { motion } from 'motion/react';
import { scaleInMotion } from '../constants/design';
import { ContinueButton } from '../ui/ContinueButton';
import type { CurrentSet, MotionPreference } from '../types';

interface SetIntroScreenProps {
  shouldReduceMotion: MotionPreference;
  currentSet: CurrentSet;
  onStartSet: () => void;
}

export function SetIntroScreen({ shouldReduceMotion, currentSet, onStartSet }: SetIntroScreenProps) {
  return (
      <div className="wm-screen-centered gradient-bg-animated">
        <div className="gradient-overlay-animated" />
        <motion.div
          className="wm-content"
          {...scaleInMotion(shouldReduceMotion)}
        >
          {currentSet === 'A' ? (
        <div className="container-mobile max-w-md w-full space-y-12 text-center">
          <div className="text-9xl">👕</div>
          <div className="space-y-6">
            <h1 className="text-heading-responsive text-serif-elegant text-light text-safe">
              Set A: Recent Purchase
            </h1>
            <p className="text-body-responsive text-sans-clean text-light-muted text-safe">
              Think of a garment you got in the last year
            </p>
          </div>
          <div className="glass-card p-6 sm:p-7 rounded-2xl">
            <p className="text-body-responsive text-sans-clean text-light-muted text-safe">
              We'll ask you 7 questions about this garment
            </p>
          </div>
          <ContinueButton onClick={onStartSet} label="Start Set A" />
        </div>
          ) : currentSet === 'B' ? (
        <div className="container-mobile max-w-md w-full space-y-12 text-center">
          <div className="text-9xl">⭐</div>
          <div className="space-y-6">
            <h1 className="text-heading-responsive text-serif-elegant text-light text-safe">
              Set B: Favorite Garment
            </h1>
            <p className="text-body-responsive text-sans-clean text-light-muted text-safe">
              Think of your favorite garment
            </p>
          </div>
          <div className="glass-card p-6 sm:p-7 rounded-2xl">
            <p className="text-body-responsive text-sans-clean text-light-muted text-safe">
              We'll ask you up to 12 questions about this garment (some optional)
            </p>
          </div>
          <ContinueButton onClick={onStartSet} label="Start Set B" />
        </div>
          ) : currentSet === 'C' ? (
        <div className="container-mobile max-w-md w-full space-y-12 text-center">
          <div className="text-9xl">🚪</div>
          <div className="space-y-6">
            <h1 className="text-heading-responsive text-serif-elegant text-light text-safe">
              Set C: Ready to Let Go
            </h1>
            <p className="text-body-responsive text-sans-clean text-light-muted text-safe">
              Think of a garment you want to dispose of
            </p>
          </div>
          <div className="glass-card p-6 sm:p-7 rounded-2xl">
            <p className="text-body-responsive text-sans-clean text-light-muted text-safe">
              We'll ask you 6 questions about this garment
            </p>
          </div>
          <ContinueButton onClick={onStartSet} label="Start Set C" />
        </div>
          ) : null}
        </motion.div>
      </div>
  );
}
