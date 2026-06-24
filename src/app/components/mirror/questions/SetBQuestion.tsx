import { Briefcase, Calendar, Clock, Compass, Droplet, Eye, Gift, Heart, Home, Package, PartyPopper, Recycle, Repeat, Scissors, Shirt, ShoppingBag, Sparkles, Star, Target, Users, Wrench, X } from 'lucide-react';
import { COLORS } from '../constants/design';
import { getGarmentIcon, getGarmentLabel } from '../constants/garments';
import { getSetCategoryName } from '../constants/questionSteps';
import { SelectionTile } from '../ui/SelectionTile';
import { ContinueButton } from '../ui/ContinueButton';
import { SecondaryButton } from '../ui/SecondaryButton';
import { QuestionScreen } from '../ui/QuestionScreen';
import { OtherInput, GarmentGrid } from './shared';
import type { SetBResponse, SetResponse } from '../types';

interface SetBQuestionProps {
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

export function SetBQuestion(props: SetBQuestionProps) {
  const {
    currentQuestionIndex, currentResponse, textInputValue, setTextInputValue,
    setCurrentResponse, onAnswer, onSkip, onContinue, onMultiSelectToggle,
    onOtherSelection, onOtherTextAnswer, onOtherTextSkip, submitTextAnswer,
  } = props;
    const resp = currentResponse as Partial<SetBResponse>;

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
      case 1: {
        const whyFavoriteArr = Array.isArray(resp.whyFavorite) ? resp.whyFavorite : [];
        return (
          <QuestionScreen title="Why is it your favorite?" subtitle="Select all that apply" icon={
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
                }}>{getSetCategoryName('B')}</div>
                <div className="text-sm font-light leading-none" style={{
                  color: COLORS.light,
                  fontFamily: 'Georgia, serif'
                }}>{getGarmentLabel(resp.garmentType)}</div>
              </div>
            </div>
          }>
            <div className="space-y-4">
              <div className="space-y-3">
                <SelectionTile label="Comfortable"               selected={whyFavoriteArr.includes('comfortable')}        onClick={() => onMultiSelectToggle('whyFavorite', 'comfortable')}        icon={<Heart className="w-5 h-5" />} />
                <SelectionTile label="Easy to style"            selected={whyFavoriteArr.includes('easy-to-style')}      onClick={() => onMultiSelectToggle('whyFavorite', 'easy-to-style')}      icon={<Sparkles className="w-5 h-5" />} />
                <SelectionTile label="Makes me feel confident"  selected={whyFavoriteArr.includes('confident')}          onClick={() => onMultiSelectToggle('whyFavorite', 'confident')}          icon={<Star className="w-5 h-5" />} />
                <SelectionTile label="Personal or emotional"    selected={whyFavoriteArr.includes('personal-emotional')} onClick={() => onMultiSelectToggle('whyFavorite', 'personal-emotional')} icon={<Gift className="w-5 h-5" />} />
                <SelectionTile label="Other"                    selected={whyFavoriteArr.includes('other')}              onClick={() => onMultiSelectToggle('whyFavorite', 'other')}              icon={<Compass className="w-5 h-5" />} />
                {whyFavoriteArr.includes('other') && (
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
              <div className="grid grid-cols-2 gap-3">
                <SecondaryButton onClick={() => onSkip('whyFavorite')} label="Skip" />
                <ContinueButton
                  onClick={() => {
                    const merged = whyFavoriteArr.includes('other')
                      ? { ...currentResponse, whyFavoriteOther: textInputValue.trim() || 'skipped' }
                      : currentResponse;
                    setCurrentResponse(merged);
                    setTextInputValue('');
                    onContinue(merged);
                  }}
                  label="Continue"
                  disabled={whyFavoriteArr.length === 0}
                />
              </div>
            </div>
          </QuestionScreen>
        );
      }
      case 2:
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
                }}>{getSetCategoryName('B')}</div>
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
      case 3:
        return (
          <QuestionScreen title="How much did it cost?" subtitle="Estimate if you're unsure" icon={
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
                }}>{getSetCategoryName('B')}</div>
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
      case 4:
        return (
          <QuestionScreen title="How long have you had it?" icon={
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
                }}>{getSetCategoryName('B')}</div>
                <div className="text-sm font-light leading-none" style={{
                  color: COLORS.light,
                  fontFamily: 'Georgia, serif'
                }}>{getGarmentLabel(resp.garmentType)}</div>
              </div>
            </div>
          }>
            <div className="space-y-3">
              <SelectionTile label="Less than 1 year" selected={resp.howLongHad === 'less-1-year'} onClick={() => onAnswer('howLongHad', 'less-1-year')} icon={<Sparkles className="w-5 h-5" />} />
              <SelectionTile label="1–2 years" selected={resp.howLongHad === '1-2-years'} onClick={() => onAnswer('howLongHad', '1-2-years')} icon={<Calendar className="w-5 h-5" />} />
              <SelectionTile label="3–4 years" selected={resp.howLongHad === '3-4-years'} onClick={() => onAnswer('howLongHad', '3-4-years')} icon={<Calendar className="w-5 h-5" />} />
              <SelectionTile label="5–6 years" selected={resp.howLongHad === '5-6-years'} onClick={() => onAnswer('howLongHad', '5-6-years')} icon={<Clock className="w-5 h-5" />} />
              <SelectionTile label="7+ years" selected={resp.howLongHad === '7-plus-years'} onClick={() => onAnswer('howLongHad', '7-plus-years')} icon={<Heart className="w-5 h-5" />} />
            </div>
          </QuestionScreen>
        );
      case 5:
        return (
          <QuestionScreen title="How often do you wear it?" icon={
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
                }}>{getSetCategoryName('B')}</div>
                <div className="text-sm font-light leading-none" style={{
                  color: COLORS.light,
                  fontFamily: 'Georgia, serif'
                }}>{getGarmentLabel(resp.garmentType)}</div>
              </div>
            </div>
          }>
            <div className="space-y-3">
              <SelectionTile label="At least once a week" selected={resp.wearFrequency === 'once-a-week'} onClick={() => onAnswer('wearFrequency', 'once-a-week')} icon={<Star className="w-5 h-5" />} />
              <SelectionTile label="At least once a month" selected={resp.wearFrequency === 'once-a-month'} onClick={() => onAnswer('wearFrequency', 'once-a-month')} icon={<Calendar className="w-5 h-5" />} />
              <SelectionTile label="At least once each season" selected={resp.wearFrequency === 'once-each-season'} onClick={() => onAnswer('wearFrequency', 'once-each-season')} icon={<Clock className="w-5 h-5" />} />
              <SelectionTile label="Not used in the last year" selected={resp.wearFrequency === 'not-used-last-year'} onClick={() => onAnswer('wearFrequency', 'not-used-last-year')} icon={<X className="w-5 h-5" />} />
            </div>
          </QuestionScreen>
        );
      case 6:
        return (
          <QuestionScreen title="What do you use it for?" icon={
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
                }}>{getSetCategoryName('B')}</div>
                <div className="text-sm font-light leading-none" style={{
                  color: COLORS.light,
                  fontFamily: 'Georgia, serif'
                }}>{getGarmentLabel(resp.garmentType)}</div>
              </div>
            </div>
          }>
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-center text-light-muted font-light">Select all that apply</p>
              <div className="space-y-3">
                <SelectionTile label="Home" selected={(resp.mainUse || []).includes('home')} onClick={() => onMultiSelectToggle('mainUse', 'home')} icon={<Home className="w-5 h-5" />} />
                <SelectionTile label="Leisure" selected={(resp.mainUse || []).includes('leisure')} onClick={() => onMultiSelectToggle('mainUse', 'leisure')} icon={<Heart className="w-5 h-5" />} />
                <SelectionTile label="Sport" selected={(resp.mainUse || []).includes('sport')} onClick={() => onMultiSelectToggle('mainUse', 'sport')} icon={<Target className="w-5 h-5" />} />
                <SelectionTile label="Work" selected={(resp.mainUse || []).includes('work')} onClick={() => onMultiSelectToggle('mainUse', 'work')} icon={<Briefcase className="w-5 h-5" />} />
                <SelectionTile label="Special occasions" selected={(resp.mainUse || []).includes('special-occasions')} onClick={() => onMultiSelectToggle('mainUse', 'special-occasions')} icon={<PartyPopper className="w-5 h-5" />} />
                <SelectionTile label="Currently not in use" selected={(resp.mainUse || []).includes('not-in-use')} onClick={() => onMultiSelectToggle('mainUse', 'not-in-use')} icon={<Package className="w-5 h-5" />} />
                <SelectionTile label="Other" selected={(resp.mainUse || []).includes('other')} onClick={() => onMultiSelectToggle('mainUse', 'other')} icon={<Compass className="w-5 h-5" />} />
              </div>
              {(resp.mainUse || []).includes('other') && (
                <input
                  type="text"
                  value={textInputValue}
                  onChange={(e) => setTextInputValue(e.target.value)}
                  placeholder="Describe other use..."
                  className={`input-field ${textInputValue ? 'has-value' : ''}`}
                  autoFocus
                />
              )}
              <ContinueButton
                onClick={() => {
                  const merged = (resp.mainUse || []).includes('other')
                    ? { ...currentResponse, mainUseOther: textInputValue.trim() }
                    : currentResponse;
                  setCurrentResponse(merged);
                  setTextInputValue('');
                  onContinue(merged);
                }}
                label="Continue"
                disabled={
                  !Array.isArray(resp.mainUse) ||
                  resp.mainUse.length === 0 ||
                  (resp.mainUse.includes('other') && !textInputValue.trim())
                }
              />
            </div>
          </QuestionScreen>
        );
      case 8:
        return (
          <QuestionScreen title="How often do you wash it?" subtitle="Optional - You can skip this" icon={
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
                }}>{getSetCategoryName('B')}</div>
                <div className="text-sm font-light leading-none" style={{
                  color: COLORS.light,
                  fontFamily: 'Georgia, serif'
                }}>{getGarmentLabel(resp.garmentType)}</div>
              </div>
            </div>
          }>
            <div className="space-y-3">
              <SelectionTile label="Every time I wear it" selected={resp.washFrequency === 'every-time'} onClick={() => onAnswer('washFrequency', 'every-time')} icon={<Droplet className="w-5 h-5" />} />
              <SelectionTile label="After wearing it a few times" selected={resp.washFrequency === 'few-times'} onClick={() => onAnswer('washFrequency', 'few-times')} icon={<Repeat className="w-5 h-5" />} />
              <SelectionTile label="When it looks dirty or stained" selected={resp.washFrequency === 'when-dirty'} onClick={() => onAnswer('washFrequency', 'when-dirty')} icon={<Eye className="w-5 h-5" />} />
              <SelectionTile label="Never" selected={resp.washFrequency === 'never'} onClick={() => onAnswer('washFrequency', 'never')} icon={<X className="w-5 h-5" />} />
              <SecondaryButton onClick={() => onSkip('washFrequency')} label="Skip" />
            </div>
          </QuestionScreen>
        );
      case 9:
        return (
          <QuestionScreen title="Did you ever repair it?" subtitle="Optional - You can skip this" icon={
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
                }}>{getSetCategoryName('B')}</div>
                <div className="text-sm font-light leading-none" style={{
                  color: COLORS.light,
                  fontFamily: 'Georgia, serif'
                }}>{getGarmentLabel(resp.garmentType)}</div>
              </div>
            </div>
          }>
            <div className="space-y-3">
              <SelectionTile label="Yes, myself" selected={resp.repaired === 'yes-myself'} onClick={() => onAnswer('repaired', 'yes-myself')} icon={<Wrench className="w-5 h-5" />} />
              <SelectionTile label="Yes, professionally" selected={resp.repaired === 'yes-professionally'} onClick={() => onAnswer('repaired', 'yes-professionally')} icon={<Scissors className="w-5 h-5" />} />
              <SelectionTile label="No, but I would" selected={resp.repaired === 'no-but-would'} onClick={() => onAnswer('repaired', 'no-but-would')} icon={<Heart className="w-5 h-5" />} />
              <SelectionTile label="No" selected={resp.repaired === 'no'} onClick={() => onAnswer('repaired', 'no')} icon={<X className="w-5 h-5" />} />
              <SecondaryButton onClick={() => onSkip('repaired')} label="Skip" />
            </div>
          </QuestionScreen>
        );
    }

}
