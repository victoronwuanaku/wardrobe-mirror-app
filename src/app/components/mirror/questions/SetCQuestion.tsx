import React from 'react';
import { AlertCircle, Clock, Compass, Euro, Gift, Heart, Package, Recycle, Scissors, Shirt, ShoppingBag, TrendingUp, Users, Wrench, X } from 'lucide-react';
import { COLORS } from '../constants/design';
import { getGarmentIcon, getGarmentLabel } from '../constants/garments';
import { getSetCategoryName } from '../constants/questionSteps';
import { SelectionTile } from '../ui/SelectionTile';
import { ContinueButton } from '../ui/ContinueButton';
import { SecondaryButton } from '../ui/SecondaryButton';
import { QuestionScreen } from '../ui/QuestionScreen';
import { OtherInput, GarmentGrid } from './shared';
import type { SetCResponse, SetResponse } from '../types';

interface SetCQuestionProps {
  currentQuestionIndex: number;
  currentResponse: Partial<SetResponse>;
  textInputValue: string;
  setTextInputValue: (v: string) => void;
  setCurrentResponse: (response: Partial<SetResponse>) => void;
  onAnswer: (key: string, value: any) => void;
  onSkip: (key: string) => void;
  onContinue: (updatedResponse?: any) => void;
  onMultiSelectToggle: (key: string, value: string) => void;
  onOtherSelection: (key: string) => void;
  onOtherTextAnswer: (key: string) => void;
  onOtherTextSkip: (key: string) => void;
  submitTextAnswer: (key: string, fallbackValue?: string) => void;
}

export function SetCQuestion(props: SetCQuestionProps) {
  const {
    currentQuestionIndex, currentResponse, textInputValue, setTextInputValue,
    setCurrentResponse, onAnswer, onSkip, onContinue, onMultiSelectToggle,
    onOtherSelection, onOtherTextAnswer, onOtherTextSkip, submitTextAnswer,
  } = props;
    const resp = currentResponse as Partial<SetCResponse>;

    switch (currentQuestionIndex) {
      case 0:
        return (
          <QuestionScreen title="What garment is it?" subtitle="Select one" icon={
            <div className="text-gold" style={{ filter: 'drop-shadow(0 0 12px rgba(212, 175, 55, 0.5))' }}>
              <Shirt className="w-8 h-8" strokeWidth={1.5} />
            </div>
          }>
            <div className="space-y-4">
              <GarmentGrid selectedValue={resp.garmentType} onSelect={(value) => onAnswer('garmentType', value)} onSelectOther={() => onOtherSelection('garmentType')} />
              {resp.garmentType === 'other' && (<OtherInput textInputValue={textInputValue} setTextInputValue={setTextInputValue} onSubmit={() => onOtherTextAnswer('garmentType')} onSkip={() => onOtherTextSkip('garmentType')} placeholder={'Type garment type...'} />)}
            </div>
          </QuestionScreen>
        );
      case 1:
        return (
          <QuestionScreen title="How long have you had it?" subtitle="Enter number of years (Guess if you don't remember)" icon={
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full" style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.06), rgba(138, 154, 91, 0.06))',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
            }}>
              <span className="text-3xl" style={{ filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.3))' }}>{getGarmentIcon(resp.garmentType)}</span>
              <div className="flex flex-col gap-0.5">
                <div className="text-[9px] uppercase tracking-[0.2em] font-medium" style={{
                  color: COLORS.gold,
                  textShadow: '0 0 10px rgba(212, 175, 55, 0.4)'
                }}>{getSetCategoryName('C')}</div>
                <div className="text-sm font-light leading-none" style={{
                  color: COLORS.light,
                  fontFamily: 'Georgia, serif'
                }}>{getGarmentLabel(resp.garmentType)}</div>
              </div>
            </div>
          }>
            <div className="space-y-4">
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                pattern="[0-9]*"
                value={textInputValue}
                onChange={(e) => setTextInputValue(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && textInputValue.trim()) submitTextAnswer('howLongHad');
                }}
                placeholder="Number of years..."
                className="w-full p-4 rounded-2xl text-base"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${'rgba(255, 255, 255, 0.18)'}`,
                  color: COLORS.light,
                  fontFamily: 'Georgia, serif',
                }}
                autoFocus
              />
              <div className="grid grid-cols-2 gap-3">
                <SecondaryButton onClick={() => onSkip('howLongHad')} label="Skip" />
                <ContinueButton onClick={() => submitTextAnswer('howLongHad')} label="Continue" disabled={!textInputValue.trim()} />
              </div>
            </div>
          </QuestionScreen>
        );
      case 2:
        return (
          <QuestionScreen title="About how much did it cost?" subtitle="Estimate if you're unsure" icon={
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full" style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.06), rgba(138, 154, 91, 0.06))',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
            }}>
              <span className="text-3xl" style={{ filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.3))' }}>{getGarmentIcon(resp.garmentType)}</span>
              <div className="flex flex-col gap-0.5">
                <div className="text-[9px] uppercase tracking-[0.2em] font-medium" style={{
                  color: COLORS.gold,
                  textShadow: '0 0 10px rgba(212, 175, 55, 0.4)'
                }}>{getSetCategoryName('C')}</div>
                <div className="text-sm font-light leading-none" style={{
                  color: COLORS.light,
                  fontFamily: 'Georgia, serif'
                }}>{getGarmentLabel(resp.garmentType)}</div>
              </div>
            </div>
          }>
            <div className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={textInputValue}
                onChange={(e) => setTextInputValue(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && textInputValue.trim()) submitTextAnswer('cost');
                }}
                placeholder="Amount in euros..."
                className="w-full p-4 rounded-2xl text-base"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${'rgba(255, 255, 255, 0.18)'}`,
                  color: COLORS.light,
                  fontFamily: 'Georgia, serif',
                }}
                autoFocus
              />
              <p className="text-xs text-center" style={{ color: 'rgba(245, 241, 232, 0.5)', fontFamily: 'Inter, Montserrat, sans-serif' }}>
                Approximate amounts are completely fine.
              </p>
              <ContinueButton onClick={() => submitTextAnswer('cost')} label="Continue" disabled={!textInputValue.trim()} />
            </div>
          </QuestionScreen>
        );
      case 3:
        return (
          <QuestionScreen title="How did you get it?" icon={
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full" style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.06), rgba(138, 154, 91, 0.06))',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
            }}>
              <span className="text-3xl" style={{ filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.3))' }}>{getGarmentIcon(resp.garmentType)}</span>
              <div className="flex flex-col gap-0.5">
                <div className="text-[9px] uppercase tracking-[0.2em] font-medium" style={{
                  color: COLORS.gold,
                  textShadow: '0 0 10px rgba(212, 175, 55, 0.4)'
                }}>{getSetCategoryName('C')}</div>
                <div className="text-sm font-light leading-none" style={{
                  color: COLORS.light,
                  fontFamily: 'Georgia, serif'
                }}>{getGarmentLabel(resp.garmentType)}</div>
              </div>
            </div>
          }>
            <div className="space-y-3">
              <SelectionTile label="Bought new" selected={resp.howGot === 'bought-new'} onClick={() => onAnswer('howGot', 'bought-new')} icon={<ShoppingBag className="w-5 h-5" />} />
              <SelectionTile label="Bought second-hand" selected={resp.howGot === 'bought-secondhand'} onClick={() => onAnswer('howGot', 'bought-secondhand')} icon={<Recycle className="w-5 h-5" />} />
              <SelectionTile label="Gift" selected={resp.howGot === 'gift'} onClick={() => onAnswer('howGot', 'gift')} icon={<Gift className="w-5 h-5" />} />
              <SelectionTile label="Borrowed / shared / rented" selected={resp.howGot === 'borrowed-shared-rented'} onClick={() => onAnswer('howGot', 'borrowed-shared-rented')} icon={<Users className="w-5 h-5" />} />
              <SelectionTile label="Made it" selected={resp.howGot === 'made-it'} onClick={() => onAnswer('howGot', 'made-it')} icon={<Scissors className="w-5 h-5" />} />
            </div>
          </QuestionScreen>
        );
      case 4: {
        const whyNotWearArr = Array.isArray(resp.whyNotWear) ? resp.whyNotWear : [];
        return (
          <QuestionScreen title="Why don't you wear it anymore?" subtitle="Select all that apply" icon={
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full" style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.06), rgba(138, 154, 91, 0.06))',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
            }}>
              <span className="text-3xl" style={{ filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.3))' }}>{getGarmentIcon(resp.garmentType)}</span>
              <div className="flex flex-col gap-0.5">
                <div className="text-[9px] uppercase tracking-[0.2em] font-medium" style={{
                  color: COLORS.gold,
                  textShadow: '0 0 10px rgba(212, 175, 55, 0.4)'
                }}>{getSetCategoryName('C')}</div>
                <div className="text-sm font-light leading-none" style={{
                  color: COLORS.light,
                  fontFamily: 'Georgia, serif'
                }}>{getGarmentLabel(resp.garmentType)}</div>
              </div>
            </div>
          }>
            <div className="space-y-4">
              <div className="space-y-3">
                <SelectionTile label="Doesn't fit"                    selected={whyNotWearArr.includes('doesnt-fit')}        onClick={() => onMultiSelectToggle('whyNotWear', 'doesnt-fit')}        icon={<AlertCircle className="w-5 h-5" />} />
                <SelectionTile label="Out of style"                   selected={whyNotWearArr.includes('out-of-style')}      onClick={() => onMultiSelectToggle('whyNotWear', 'out-of-style')}      icon={<TrendingUp className="w-5 h-5" />} />
                <SelectionTile label="Damaged or worn out"            selected={whyNotWearArr.includes('damaged-worn-out')}  onClick={() => onMultiSelectToggle('whyNotWear', 'damaged-worn-out')}  icon={<X className="w-5 h-5" />} />
                <SelectionTile label="Forgot about it"                selected={whyNotWearArr.includes('forgot')}            onClick={() => onMultiSelectToggle('whyNotWear', 'forgot')}            icon={<Package className="w-5 h-5" />} />
                <SelectionTile label="Waiting for the right occasion" selected={whyNotWearArr.includes('waiting-occasion')}  onClick={() => onMultiSelectToggle('whyNotWear', 'waiting-occasion')}  icon={<Clock className="w-5 h-5" />} />
                <SelectionTile label="Don't like it anymore"          selected={whyNotWearArr.includes('dont-like-anymore')} onClick={() => onMultiSelectToggle('whyNotWear', 'dont-like-anymore')} icon={<Heart className="w-5 h-5" />} />
                <SelectionTile label="Other"                          selected={whyNotWearArr.includes('other')}             onClick={() => onMultiSelectToggle('whyNotWear', 'other')}             icon={<Compass className="w-5 h-5" />} />
                {whyNotWearArr.includes('other') && (
                  <input
                    type="text"
                    value={textInputValue}
                    onChange={(e) => setTextInputValue(e.target.value)}
                    placeholder="Type your reason..."
                    className="w-full p-4 rounded-2xl text-base"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      color: COLORS.light,
                      fontFamily: 'Georgia, serif',
                    }}
                    autoFocus
                  />
                )}
              </div>
              <ContinueButton
                onClick={() => {
                  const merged = whyNotWearArr.includes('other')
                    ? { ...currentResponse, whyNotWearOther: textInputValue.trim() || 'skipped' }
                    : currentResponse;
                  setCurrentResponse(merged);
                  setTextInputValue('');
                  onContinue(merged);
                }}
                label="Continue"
                disabled={whyNotWearArr.length === 0}
              />
            </div>
          </QuestionScreen>
        );
      }
      case 5:
        return (
          <QuestionScreen title="How do you plan to get rid of it?" icon={
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full" style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.06), rgba(138, 154, 91, 0.06))',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
            }}>
              <span className="text-3xl" style={{ filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.3))' }}>{getGarmentIcon(resp.garmentType)}</span>
              <div className="flex flex-col gap-0.5">
                <div className="text-[9px] uppercase tracking-[0.2em] font-medium" style={{
                  color: COLORS.gold,
                  textShadow: '0 0 10px rgba(212, 175, 55, 0.4)'
                }}>{getSetCategoryName('C')}</div>
                <div className="text-sm font-light leading-none" style={{
                  color: COLORS.light,
                  fontFamily: 'Georgia, serif'
                }}>{getGarmentLabel(resp.garmentType)}</div>
              </div>
            </div>
          }>
            <div className="space-y-3">
              <SelectionTile label="Repair or repurpose" selected={resp.disposalPlan === 'repair-repurpose'} onClick={() => onAnswer('disposalPlan', 'repair-repurpose')} icon={<Wrench className="w-5 h-5" />} />
              <SelectionTile label="Donate to charity" selected={resp.disposalPlan === 'donate-charity'} onClick={() => onAnswer('disposalPlan', 'donate-charity')} icon={<Gift className="w-5 h-5" />} />
              <SelectionTile label="Gift to friends or family" selected={resp.disposalPlan === 'gift-friends-family'} onClick={() => onAnswer('disposalPlan', 'gift-friends-family')} icon={<Users className="w-5 h-5" />} />
              <SelectionTile label="Sell it" selected={resp.disposalPlan === 'sell-it'} onClick={() => onAnswer('disposalPlan', 'sell-it')} icon={<Euro className="w-5 h-5" />} />
              <SelectionTile label="Put in the textile collection bins" selected={resp.disposalPlan === 'textile-bins'} onClick={() => onAnswer('disposalPlan', 'textile-bins')} icon={<Recycle className="w-5 h-5" />} />
            </div>
          </QuestionScreen>
        );
    }

}
