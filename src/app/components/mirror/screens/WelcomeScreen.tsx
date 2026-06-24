import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { MOTION_EASE, fadeRiseMotion, scaleInMotion } from '../constants/design';
import { ContinueButton } from '../ui/ContinueButton';
import type { MotionPreference } from '../types';

interface WelcomeScreenProps {
  shouldReduceMotion: MotionPreference;
  onStart: () => void;
}

export function WelcomeScreen({ shouldReduceMotion, onStart }: WelcomeScreenProps) {
  return (
      <div className="wm-screen-centered gradient-bg-animated">
        <div className="gradient-overlay-animated" />

        <motion.div
          className="wm-content text-center px-4"
          {...fadeRiseMotion(shouldReduceMotion)}
        >
          <div className="space-y-8 sm:space-y-12">
            <div className="space-y-4 sm:space-y-6">
              <motion.div
                className="flex items-center justify-center gap-2 sm:gap-3"
                {...scaleInMotion(shouldReduceMotion, 0.15)}
              >
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-gold" strokeWidth={1.7} />
                <h1 className="wm-landing-title text-safe">
                  The Wardrobe Mirror
                </h1>
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-gold" strokeWidth={1.7} />
              </motion.div>
              <motion.div
                className="wm-divider"
                initial={shouldReduceMotion ? { opacity: 0 } : { scaleX: 0 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { scaleX: 1 }}
                transition={{ duration: shouldReduceMotion ? 0.2 : 0.7, delay: shouldReduceMotion ? 0 : 0.3, ease: MOTION_EASE }}
              />
              <motion.p
                className="wm-landing-subtitle text-safe"
                {...fadeRiseMotion(shouldReduceMotion, 0.35)}
              >
                A research tool exploring your relationship
                <br />
                with clothing and wardrobe behavior
              </motion.p>
            </div>

            <motion.div
              className="glass-card wm-instruction-card text-left space-y-6"
              {...fadeRiseMotion(shouldReduceMotion, 0.5)}
            >
              <h2 className="text-xl tracking-wide text-serif-elegant text-light text-safe">
                How It Works
              </h2>

              <div className="space-y-4">
                <div className="wm-instruction-row">
                  <div className="wm-instruction-index">1</div>
                  <p className="wm-instruction-text text-safe">
                    Answer questions about up to 3 garments from your wardrobe
                  </p>
                </div>
                <div className="wm-instruction-row">
                  <div className="wm-instruction-index">2</div>
                  <p className="wm-instruction-text text-safe">
                    Select your answer to continue through each question
                  </p>
                </div>
                <div className="wm-instruction-row">
                  <div className="wm-instruction-index">3</div>
                  <p className="wm-instruction-text text-safe">
                    Discover insights about your wardrobe patterns at the end
                  </p>
                </div>
              </div>
            </motion.div>

            <ContinueButton onClick={onStart} label="Begin" />

            <motion.p
              className="wm-footer-label"
              {...fadeRiseMotion(shouldReduceMotion, 0.65)}
            >
              Wardrobe Mirror Research
            </motion.p>
          </div>
        </motion.div>
      </div>
  );
}
