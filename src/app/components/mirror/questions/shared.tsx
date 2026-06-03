import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import { GARMENT_OPTIONS } from '../constants/garments';
import { MOTION_EASE, scaleInMotion } from '../constants/design';
import { ContinueButton } from '../ui/ContinueButton';
import { SecondaryButton } from '../ui/SecondaryButton';

interface OtherInputProps {
  textInputValue: string;
  setTextInputValue: (v: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
  placeholder?: string;
}

export function OtherInput({ textInputValue, setTextInputValue, onSubmit, onSkip, placeholder = 'Type your answer...' }: OtherInputProps) {
  return (
    <div className="space-y-4 pt-2">
      <input
        type="text"
        value={textInputValue}
        onChange={(e) => setTextInputValue(e.target.value)}
        onKeyDown={(e) => {
          // C9: Enter submits the "Other" answer rather than just inserting a newline
          if (e.key === 'Enter' && textInputValue.trim()) {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder={placeholder}
        className={`input-field ${textInputValue ? 'has-value' : ''}`}
        autoFocus
      />
      <div className="grid grid-cols-2 gap-3">
        <SecondaryButton onClick={() => onSkip()} label="Skip" />
        <ContinueButton onClick={() => onSubmit()} label="Continue" disabled={!textInputValue.trim()} />
      </div>
    </div>
  );
}

interface GarmentGridProps {
  selectedValue?: string;
  onSelect: (value: string) => void;
  onSelectOther: () => void;
}

export function GarmentGrid({ selectedValue, onSelect, onSelectOther }: GarmentGridProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="grid grid-cols-3 gap-3">
      {GARMENT_OPTIONS.map((option) => {
        const isSelected = selectedValue === option.value;
        return (
          <motion.button
            key={option.value}
            onClick={() => option.value === 'other' ? onSelectOther() : onSelect(option.value)}
            whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            transition={{ duration: 0.2, ease: MOTION_EASE }}
            className={`selection-tile aspect-square rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center gap-1 sm:gap-2 text-center relative overflow-hidden ${
              isSelected ? 'selection-tile-selected' : 'selection-tile-unselected'
            }`}
          >
            <span
              className="text-4xl sm:text-5xl relative z-10"
              aria-hidden="true"
              style={{
                display: 'inline-block',
                animation: isSelected ? 'wiggle 0.4s ease-in-out' : 'none',
                lineHeight: '1'
              }}
            >
              {option.icon}
            </span>
            <span className={`text-[10px] sm:text-xs leading-tight text-serif-elegant relative z-10 text-safe ${isSelected ? 'text-gold' : 'text-light'}`}>
              {option.label}
            </span>
            {isSelected && (
              <motion.div
                className="absolute top-2 right-2 z-20"
                {...scaleInMotion(shouldReduceMotion, 0)}
              >
                <Check className="w-4 h-4 text-gold" strokeWidth={3} />
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
