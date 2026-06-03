import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { MOTION_EASE, fadeRiseMotion } from '../constants/design';
import { getVisibleQuestionSteps } from '../constants/questionSteps';
import type { CurrentSet, MotionPreference, SetResponse } from '../types';

interface QuestionRunnerProps {
  shouldReduceMotion: MotionPreference;
  currentSet: CurrentSet;
  currentQuestionIndex: number;
  currentResponse: Partial<SetResponse>;
  onBack: () => void;
  children: React.ReactNode;
}

export function QuestionRunner({
  shouldReduceMotion,
  currentSet,
  currentQuestionIndex,
  currentResponse,
  onBack,
  children,
}: QuestionRunnerProps) {
  return (
      <div className="wm-screen gradient-bg-animated flex flex-col">
        <div className="gradient-overlay-animated" />
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center relative z-10" style={{
          padding: 'clamp(1.5rem, 5vw, 2.5rem) clamp(1rem, 4vw, 2rem)'
        }}>
          <motion.div
            key={`${currentSet}-${currentQuestionIndex}`}
            className="glass-card relative rounded-2xl sm:rounded-3xl p-6 sm:p-8"
            {...fadeRiseMotion(shouldReduceMotion)}
          >
            <motion.button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
              transition={{ duration: 0.2, ease: MOTION_EASE }}
              className="absolute left-5 top-5 flex h-11 w-11 items-center justify-center rounded-2xl touch-manipulation sm:h-12 sm:w-12"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'rgba(245, 241, 232, 0.7)',
              }}
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={1.7} />
            </motion.button>
            <div className="pt-12 sm:pt-14">
              {(() => {
                // C4: Progress indicator within sets — uses visibleSteps so skip/optional logic is reflected
                const visibleSteps = currentSet ? getVisibleQuestionSteps(currentSet, currentResponse) : [];
                const pos = visibleSteps.findIndex((s) => s.renderIndex === currentQuestionIndex);
                const total = visibleSteps.length;
                const current = pos >= 0 ? pos + 1 : 1;
                const setProgress = total > 0 ? (current / total) * 100 : 0;
                return (
                  <div className="mb-6 px-1">
                    <div className="flex justify-between mb-2 text-[10px] sm:text-xs uppercase tracking-widest text-sans-clean text-light-muted">
                      <span>Set {currentSet} · Question {current} of {total}</span>
                      <span className="text-gold">{Math.round(setProgress)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-[rgba(245,241,232,0.1)]">
                      <div className="h-full bg-gold-gradient" style={{ width: `${setProgress}%`, transition: 'width 0.4s ease-out' }} />
                    </div>
                  </div>
                );
              })()}
              {children}
            </div>
          </motion.div>
        </div>
      </div>
  );
}
