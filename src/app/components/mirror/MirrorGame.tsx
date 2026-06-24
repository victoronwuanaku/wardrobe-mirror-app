/**
 * ============================================================================
 * WARDROBE MIRROR - 3-SET DIAGNOSTIC
 * ============================================================================
 *
 * A mobile garment diagnostic tool exploring wardrobe behavior through
 * three independent question sets: Recent Purchase, Favorite Garment, Disposal.
 *
 * Submits one row per completed set to Supabase; the researcher accesses data via the Supabase dashboard.
 *
 * ============================================================================
 */

import { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import type {
  SetResponse,
  BaselineResponses,
  PersonaProfile,
  GameData,
  GameState,
  CurrentSet,
} from './types';
import { QUESTION_STEPS, getVisibleQuestionSteps } from './constants/questionSteps';
import { BASELINE_QUESTIONS } from './constants/baselineQuestions';
import { generateSessionId } from './lib/session';
import { submitToSupabase } from './lib/supabase';
import { calculateValuesFromMirrorGame, calculatePersona } from './lib/scoring';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { SetIntroScreen } from './screens/SetIntroScreen';
import { SetCompleteScreen } from './screens/SetCompleteScreen';
import { BaselineScreen } from './screens/BaselineScreen';
import { FinalDashboard } from './screens/FinalDashboard';
import { QuestionRunner } from './screens/QuestionRunner';
import { SetAQuestion } from './questions/SetAQuestion';
import { SetBQuestion } from './questions/SetBQuestion';
import { SetCQuestion } from './questions/SetCQuestion';

// ============================================================================
// CONSTANTS
// ============================================================================

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// ============================================================================
// UI COMPONENTS
// ============================================================================

// ============================================================================
// MAIN GAME COMPONENT
// ============================================================================

// Maps each multi-select question to its free-text "Other" companion field.
const COMPANION_FIELD: Record<string, string> = {
  mainUse: 'mainUseOther',
  whyFavorite: 'whyFavoriteOther',
  whyNotWear: 'whyNotWearOther',
};

export function MirrorGame() {
  const shouldReduceMotion = useReducedMotion();
  const [gameState, setGameState] = useState<GameState>('welcome');
  const [sessionId] = useState(generateSessionId());
  const [sessionStartTime] = useState(new Date().toISOString());
  const [currentSet, setCurrentSet] = useState<CurrentSet>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentResponse, setCurrentResponse] = useState<Partial<SetResponse>>({});
  const [allResponses, setAllResponses] = useState<SetResponse[]>([]);
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  // Holds the actual error message from a failed Supabase submission so the UI can surface it
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  // Tracks whether the user has dismissed the failure status banner (so it stays visible until they do)
  const [statusDismissed, setStatusDismissed] = useState(false);
  // Auto-dismiss thank-you banner — shows briefly when the submission succeeds, then disappears after 3 s
  const [showThankYou, setShowThankYou] = useState(false);
  useEffect(() => {
    if (emailSent === true) {
      setShowThankYou(true);
      const timer = setTimeout(() => setShowThankYou(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [emailSent]);
  const [textInputValue, setTextInputValue] = useState('');
  const [baselineResponses, setBaselineResponses] = useState<BaselineResponses | null>(null);
  const [baselineQuestionIndex, setBaselineQuestionIndex] = useState(0);
  const [baselineDraft, setBaselineDraft] = useState<Partial<BaselineResponses>>({});
  const [activeTab, setActiveTab] = useState<'dashboard' | 'insights' | 'data' | 'share'>('dashboard');
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);

  // Single pending auto-advance timer. Clearing before each schedule guarantees
  // only ONE advance fires (the latest), so rapid taps can't skip questions.
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearAdvanceTimer = () => {
    if (advanceTimerRef.current !== null) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  };
  const scheduleAdvance = (fn: () => void, delay: number) => {
    clearAdvanceTimer();
    advanceTimerRef.current = setTimeout(() => {
      advanceTimerRef.current = null;
      fn();
    }, delay);
  };
  // Cancel any pending advance on unmount
  useEffect(() => clearAdvanceTimer, []);

  const handleStartGame = () => {
    setGameState('baseline');
  };

  const handleBaselineAnswer = (key: keyof BaselineResponses, value: string) => {
    const updated = { ...baselineDraft, [key]: value } as Partial<BaselineResponses>;
    setBaselineDraft(updated);
    scheduleAdvance(() => {
      if (baselineQuestionIndex < BASELINE_QUESTIONS.length - 1) {
        setBaselineQuestionIndex(baselineQuestionIndex + 1);
      } else {
        const completed = updated as BaselineResponses;
        setBaselineResponses(completed);
        setCurrentSet('A');
        setGameState('set-intro');
      }
    }, 300);
  };

  const handleBaselineBack = () => {
    clearAdvanceTimer();
    if (baselineQuestionIndex > 0) {
      setBaselineQuestionIndex((index) => index - 1);
      return;
    }

    setTextInputValue('');
    setGameState('welcome'); 
  };

  const handleStartSet = () => {
    setCurrentQuestionIndex(0);
    setCurrentResponse({ setType: currentSet! } as Partial<SetResponse>);
    setGameState('question');
  };

  const handleAnswer = (key: string, value: any) => {
    const updatedResponse = { ...currentResponse, [key]: value };
    setCurrentResponse(updatedResponse);
    setTextInputValue('');

    // Auto-advance for single-choice questions (800ms lets users catch a misclick).
    // scheduleAdvance cancels any prior pending advance so double-taps can't skip ahead.
    scheduleAdvance(() => handleContinue(updatedResponse), 800);
  };

  const submitTextAnswer = (key: string, fallbackValue = 'skipped') => {
    const value = textInputValue.trim() || fallbackValue;
    const updatedResponse = { ...currentResponse, [key]: value };
    setCurrentResponse(updatedResponse);
    setTextInputValue('');
    handleContinue(updatedResponse);
  };

  const handleSkip = (key: string) => {
    const updatedResponse = { ...currentResponse, [key]: 'skipped' };
    setCurrentResponse(updatedResponse);
    setTextInputValue('');

    scheduleAdvance(() => handleContinue(updatedResponse), 800);
  };

  const handleOtherSelection = (key: string) => {
    setTextInputValue('');
    setCurrentResponse({ ...currentResponse, [key]: 'other' });
  };

  const handleMultiSelectToggle = (key: string, value: string) => {
    let shouldClearInput = false;
    setCurrentResponse((prev) => {
      const arr = ((prev as Record<string, unknown>)[key] as string[]) || [];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      const updated: Record<string, unknown> = { ...prev, [key]: next };
      // When 'other' is removed, drop its companion text so a stale value can't survive.
      if (value === 'other' && !next.includes('other')) {
        const companion = COMPANION_FIELD[key];
        if (companion) delete updated[companion];
        shouldClearInput = true;
      }
      return updated as Partial<SetResponse>;
    });
    // Cleared outside the updater so the function stays pure (safe under StrictMode double-invoke).
    if (shouldClearInput) setTextInputValue('');
  };

  const handleOtherTextAnswer = (key: string) => {
    const value = textInputValue.trim() || 'skipped';
    const updatedResponse = { ...currentResponse, [key]: value };
    setCurrentResponse(updatedResponse);
    setTextInputValue('');
    handleContinue(updatedResponse);
  };

  const handleOtherTextSkip = (key: string) => {
    const updatedResponse = { ...currentResponse, [key]: 'skipped' };
    setCurrentResponse(updatedResponse);
    setTextInputValue('');
    handleContinue(updatedResponse);
  };

  const handleContinue = (updatedResponse?: any) => {
    clearAdvanceTimer();
    const responseToUse = updatedResponse || currentResponse;

    if (!currentSet) return;

    // Resolve the current step by id first, so dynamic visibility (shouldShow) cannot orphan us
    const stepsForOldResponse = QUESTION_STEPS[currentSet];
    const currentStepId = stepsForOldResponse.find((s) => s.renderIndex === currentQuestionIndex)?.id;

    const visibleSteps = getVisibleQuestionSteps(currentSet, responseToUse);
    const currentPosition = currentStepId
      ? visibleSteps.findIndex((step) => step.id === currentStepId)
      : visibleSteps.findIndex((step) => step.renderIndex === currentQuestionIndex);

    const nextStep = currentPosition >= 0
      ? visibleSteps[currentPosition + 1]
      : visibleSteps.find((step) => step.renderIndex > currentQuestionIndex);

    if (nextStep) {
      setCurrentQuestionIndex(nextStep.renderIndex);
    } else {
      completeSet(responseToUse);
    }
  };

  const handleBack = () => {
    clearAdvanceTimer();
    if (!currentSet) {
      setGameState('set-intro');
      return;
    }

    const visibleSteps = getVisibleQuestionSteps(currentSet, currentResponse);
    const previousStep = [...visibleSteps]
      .reverse()
      .find((step) => step.renderIndex < currentQuestionIndex);

    if (previousStep) {
      // Re-seed textInputValue so Continue is enabled on back-nav.
      // (Only real, non-last step ids belong here; 'whyBought' is Set A's final
      // question so it can't be back-navigated into, hence no entry for it.)
      const textFieldKeys: string[] = ['howLongHad', 'cost'];
      const companion = COMPANION_FIELD[previousStep.id];
      if (textFieldKeys.includes(previousStep.id)) {
        const saved = (currentResponse as Record<string, unknown>)[previousStep.id] as string | undefined;
        setTextInputValue(saved && saved !== 'skipped' ? saved : '');
      } else if (companion) {
        // Multi-select "Other": restore the typed companion text if 'other' is still selected.
        const arr = (currentResponse as Record<string, unknown>)[previousStep.id] as string[] | undefined;
        const savedOther = (currentResponse as Record<string, unknown>)[companion] as string | undefined;
        setTextInputValue(
          Array.isArray(arr) && arr.includes('other') && savedOther && savedOther !== 'skipped'
            ? savedOther
            : ''
        );
      } else {
        setTextInputValue('');
      }
      setCurrentQuestionIndex(previousStep.renderIndex);
    } else {
      setGameState('set-intro');
    }
  };

  const completeSet = (responseToUse?: any) => {
    const newResponse = {
      ...(responseToUse || currentResponse),
      timestamp: new Date().toISOString()
    } as SetResponse;

    setAllResponses([...allResponses, newResponse]);
    setGameState('set-complete');
  };

  const handleContinueToNextSet = () => {
    if (currentSet === 'A') {
      setCurrentSet('B');
      setGameState('set-intro');
      setCurrentQuestionIndex(0);
      setCurrentResponse({});
    } else if (currentSet === 'B') {
      setCurrentSet('C');
      setGameState('set-intro');
      setCurrentQuestionIndex(0);
      setCurrentResponse({});
    } else {
      finishGame();
    }
  };

  const finishGame = async () => {
    setGameState('final');

    const values = calculateValuesFromMirrorGame(allResponses, baselineResponses);
    const persona = calculatePersona(values);

    const gameData: GameData = {
      sessionId,
      timestamp: sessionStartTime,
      setsCompleted: allResponses.length,
      baselineResponses,
      values,
      persona: persona.name,
      responses: allResponses,
    };

    const result = await submitToSupabase(gameData);
    setEmailSent(result.ok);
    setSubmissionError(result.ok ? null : result.error);
    setStatusDismissed(false);
  };

  // Early "Finish Now" (Set A/B): confirm before submitting a partial session.
  // For Set C, allResponses.length === 3, so no prompt is shown.
  const handleFinishEarly = () => {
    const done = allResponses.length;
    if (
      done < 3 &&
      !window.confirm(
        `You've completed ${done} of 3 garments. Submit now with partial responses? You won't be able to add more afterwards.`
      )
    ) {
      return;
    }
    finishGame();
  };

  const handleStartNewRun = () => {
    window.location.reload();
  };

  const handleShareWithOthers = async () => {
    const url = window.location.origin + window.location.pathname;
    const shareText = 'Discover your clothing decision-making patterns with this wardrobe reflection tool';

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'The Wardrobe Mirror',
          text: shareText,
          url: url,
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.log('Share failed:', error);
          // Fallback to clipboard ph
          fallbackToCopy(url, 'invite');
        }
      }
    } else {
      fallbackToCopy(url, 'invite');
    }
  };

  const handleShareResults = async (persona: PersonaProfile) => {
    const url = window.location.origin + window.location.pathname;
    const shareText = `I just completed The Wardrobe Mirror reflection! My archetype: ${persona.icon} ${persona.name}\n\n"${persona.tagline}"\n\nDiscover your own clothing patterns:`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `My Wardrobe Archetype: ${persona.name}`,
          text: shareText,
          url: url,
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.log('Share failed:', error);
          // Fallback to clipboard
          fallbackToCopy(`${shareText}\n\n${url}`, 'results');
        }
      }
    } else {
      fallbackToCopy(`${shareText}\n\n${url}`, 'results');
    }
  };

  const fallbackToCopy = async (text: string, type: 'results' | 'invite') => {
    try {
      await navigator.clipboard.writeText(text);
      const message = type === 'results'
        ? '✅ Results copied to clipboard!\n\nYour archetype and link are ready to share.'
        : '✅ Link copied to clipboard!\n\nShare this link with others so they can participate in the research.';
      alert(message);
    } catch (error) {
      // Clipboard API failed, show text in alert so user can manually copy
      const message = type === 'results'
        ? `Copy this text to share your results:\n\n${text}`
        : `Copy this link to invite others:\n\n${text}`;
      alert(message);
    }
  };

  const renderQuestion = () => {
    if (currentSet === 'A') {
      return (
        <SetAQuestion
          currentQuestionIndex={currentQuestionIndex}
          currentResponse={currentResponse}
          textInputValue={textInputValue}
          setTextInputValue={setTextInputValue}
          setCurrentResponse={setCurrentResponse}
          onAnswer={handleAnswer}
          onContinue={handleContinue}
          onMultiSelectToggle={handleMultiSelectToggle}
          onOtherSelection={handleOtherSelection}
          onOtherTextAnswer={handleOtherTextAnswer}
          onOtherTextSkip={handleOtherTextSkip}
          submitTextAnswer={submitTextAnswer}
        />
      );
    }
    if (currentSet === 'B') {
      return (
        <SetBQuestion
          currentQuestionIndex={currentQuestionIndex}
          currentResponse={currentResponse}
          textInputValue={textInputValue}
          setTextInputValue={setTextInputValue}
          setCurrentResponse={setCurrentResponse}
          onAnswer={handleAnswer}
          onSkip={handleSkip}
          onContinue={handleContinue}
          onMultiSelectToggle={handleMultiSelectToggle}
          onOtherSelection={handleOtherSelection}
          onOtherTextAnswer={handleOtherTextAnswer}
          onOtherTextSkip={handleOtherTextSkip}
          submitTextAnswer={submitTextAnswer}
        />
      );
    }
    if (currentSet === 'C') {
      return (
        <SetCQuestion
          currentQuestionIndex={currentQuestionIndex}
          currentResponse={currentResponse}
          textInputValue={textInputValue}
          setTextInputValue={setTextInputValue}
          setCurrentResponse={setCurrentResponse}
          onAnswer={handleAnswer}
          onSkip={handleSkip}
          onContinue={handleContinue}
          onMultiSelectToggle={handleMultiSelectToggle}
          onOtherSelection={handleOtherSelection}
          onOtherTextAnswer={handleOtherTextAnswer}
          onOtherTextSkip={handleOtherTextSkip}
          submitTextAnswer={submitTextAnswer}
        />
      );
    }
    return null;
  };







  // ============================================================================
  // RENDER STATES
  // ============================================================================

  if (gameState === 'baseline') {
    return (
      <BaselineScreen
        shouldReduceMotion={shouldReduceMotion}
        baselineQuestionIndex={baselineQuestionIndex}
        baselineDraft={baselineDraft}
        onAnswer={handleBaselineAnswer}
        onBack={handleBaselineBack}
      />
    );
  }

  if (gameState === 'welcome') {
    return <WelcomeScreen shouldReduceMotion={shouldReduceMotion} onStart={handleStartGame} />;
  }

  if (gameState === 'set-intro') {
    return (
      <SetIntroScreen
        shouldReduceMotion={shouldReduceMotion}
        currentSet={currentSet}
        onStartSet={handleStartSet}
      />
    );
  }

  if (gameState === 'question') {
    return (
      <QuestionRunner
        shouldReduceMotion={shouldReduceMotion}
        currentSet={currentSet}
        currentQuestionIndex={currentQuestionIndex}
        currentResponse={currentResponse}
        onBack={handleBack}
      >
        {renderQuestion()}
      </QuestionRunner>
    );
  }

  if (gameState === 'set-complete') {
    return (
      <SetCompleteScreen
        shouldReduceMotion={shouldReduceMotion}
        currentSet={currentSet}
        completedCount={allResponses.length}
        onContinue={handleContinueToNextSet}
        onFinish={handleFinishEarly}
      />
    );
  }

  if (gameState === 'final') {
    return (
      <FinalDashboard
        sessionId={sessionId}
        sessionStartTime={sessionStartTime}
        allResponses={allResponses}
        baselineResponses={baselineResponses}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedArchetype={selectedArchetype}
        setSelectedArchetype={setSelectedArchetype}
        emailSent={emailSent}
        setEmailSent={setEmailSent}
        submissionError={submissionError}
        setSubmissionError={setSubmissionError}
        statusDismissed={statusDismissed}
        setStatusDismissed={setStatusDismissed}
        showThankYou={showThankYou}
        onStartNewRun={handleStartNewRun}
        onShareWithOthers={handleShareWithOthers}
        onShareResults={handleShareResults}
      />
    );
  }
  return null;
}
