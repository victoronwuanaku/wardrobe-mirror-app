import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { MOTION_EASE, fadeRiseMotion, scaleInMotion } from '../constants/design';
import { BASELINE_QUESTIONS } from '../constants/baselineQuestions';
import type { BaselineResponses, MotionPreference } from '../types';

interface BaselineScreenProps {
  shouldReduceMotion: MotionPreference;
  baselineQuestionIndex: number;
  baselineDraft: Partial<BaselineResponses>;
  textInputValue: string;
  setTextInputValue: (value: string) => void;
  onAnswer: (key: keyof BaselineResponses, value: string) => void;
  onBack: () => void;
}

export function BaselineScreen({
  shouldReduceMotion,
  baselineQuestionIndex,
  baselineDraft,
  textInputValue,
  setTextInputValue,
  onAnswer,
  onBack,
}: BaselineScreenProps) {
  const currentQ = BASELINE_QUESTIONS[baselineQuestionIndex];
  const progress = ((baselineQuestionIndex + 1) / BASELINE_QUESTIONS.length) * 100;
  const selected = baselineDraft[currentQ.id];

  return (
      <div className="min-h-screen gradient-bg-animated flex flex-col relative overflow-hidden">
        <div className="gradient-overlay-animated" />
        <motion.div
          className="max-w-md sm:max-w-lg lg:max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center relative z-10"
          style={{
            padding: 'clamp(1.5rem, 5vw, 2.5rem) clamp(1rem, 4vw, 2rem)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(1.5rem, 5vw, 2rem)'
          }}
          {...fadeRiseMotion(shouldReduceMotion)}
        >
          <div className="text-center space-y-5">
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="w-7 h-7 text-gold" />
              <h1 className="text-heading-responsive text-serif-elegant text-light text-safe">About You</h1>
              <Sparkles className="w-7 h-7 text-gold" />
            </div>
            <p className="text-body-responsive text-sans-clean text-light-muted text-safe">A few questions about your general wardrobe habits</p>
            <div>
              <div className="flex justify-between mb-3 text-xs uppercase tracking-widest text-sans-clean text-light-muted">
                <span>Question {baselineQuestionIndex + 1} of {BASELINE_QUESTIONS.length}</span>
                <span className="text-gold">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-[rgba(245,241,232,0.1)]">
                <div className="h-full bg-gold-gradient" style={{ width: `${progress}%`, transition: 'width 0.5s ease-out' }} />
              </div>
            </div>
          </div>

          <div className="glass-card relative rounded-2xl p-6 sm:p-8 space-y-7">
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
            <h2 className="text-heading-responsive text-serif-elegant text-light text-safe text-center pt-12 sm:pt-14">{currentQ.question}</h2>
            <div className="space-y-3">
                {currentQ.options?.map((option) => {
                  const isSelected = selected === option.value;
                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => onAnswer(currentQ.id, option.value)}
                      whileHover={shouldReduceMotion ? undefined : { scale: 1.01 }}
                      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                      transition={{ duration: 0.2, ease: MOTION_EASE }}
                      className={`selection-tile w-full p-5 rounded-xl text-left ${
                        isSelected ? 'selection-tile-selected' : 'selection-tile-unselected'
                      }`}
                    >
                      <div className="relative z-10 flex items-center gap-4">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                          style={{
                            border: isSelected ? '2px solid #d4af37' : '2px solid rgba(245, 241, 232, 0.45)',
                            background: isSelected ? 'rgba(212, 175, 55, 0.25)' : 'transparent',
                            boxShadow: isSelected ? '0 0 18px rgba(212, 175, 55, 0.25)' : 'none',
                          }}
                          aria-hidden="true"
                        >
                          {isSelected && (
                            <motion.span
                              className="h-3.5 w-3.5 rounded-full"
                              style={{ background: '#0f172a' }}
                              {...scaleInMotion(shouldReduceMotion, 0)}
                            />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-base mb-2 text-serif-elegant ${isSelected ? 'text-gold' : 'text-light'}`}>{option.label}</span>
                          {option.description && <span className={`block text-xs text-sans-clean ${isSelected ? 'text-gold-muted' : 'text-light-muted'}`}>{option.description}</span>}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
            </div>
          </div>

        </motion.div>
      </div>
  );
}
