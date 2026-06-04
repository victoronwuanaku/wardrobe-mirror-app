import React from 'react';
import {
  Compass,
  DoorOpen,
  Download,
  FileDown,
  Heart,
  Info,
  LayoutDashboard,
  List,
  Minus,
  Package,
  Share2,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import { ARCHETYPE_INFO } from '../constants/archetypes';
import { exportGameData, exportCSV } from '../lib/export';
import { submitToSupabase } from '../lib/supabase';
import { calculateValuesFromMirrorGame, calculatePersona, getMirrorInsights, calculateExpectationProfile, calculateReflectionConfidence } from '../lib/scoring';
import { formatDelta } from '../lib/display-helpers';
import { ValueFingerprintRadar } from '../ui/ValueFingerprintRadar';
import type {
  BaselineResponses,
  GameData,
  MotionPreference,
  PersonaProfile,
  SetResponse,
} from '../types';

interface FinalDashboardProps {
  shouldReduceMotion: MotionPreference;
  sessionId: string;
  sessionStartTime: string;
  allResponses: SetResponse[];
  baselineResponses: BaselineResponses | null;
  activeTab: 'dashboard' | 'insights' | 'data' | 'share';
  setActiveTab: (tab: 'dashboard' | 'insights' | 'data' | 'share') => void;
  selectedArchetype: string | null;
  setSelectedArchetype: (key: string | null) => void;
  emailSent: boolean | null;
  setEmailSent: (v: boolean | null) => void;
  submissionError: string | null;
  setSubmissionError: (v: string | null) => void;
  statusDismissed: boolean;
  setStatusDismissed: (v: boolean) => void;
  showThankYou: boolean;
  onStartNewRun: () => void;
  onShareWithOthers: () => void;
  onShareResults: (persona: PersonaProfile) => void;
}

function DeltaChip({ reflected, expectation }: { reflected: number; expectation: number }) {
  const d = formatDelta(reflected, expectation);
  const color = d.sign === 'down' ? 'text-amber-400' : d.sign === 'flat' ? 'text-white/50' : 'text-emerald-400';
  return (
    <span className={`flex items-center gap-1 ${color}`}>
      {d.sign === 'down' ? <TrendingDown className="w-3 h-3 flex-shrink-0" /> : d.sign === 'flat' ? <Minus className="w-3 h-3 flex-shrink-0" /> : <TrendingUp className="w-3 h-3 flex-shrink-0" />}
      <span className="text-xs sm:text-sm">{d.label}</span>
    </span>
  );
}

export function FinalDashboard(props: FinalDashboardProps) {
  const {
    allResponses, baselineResponses, sessionId, sessionStartTime,
    activeTab, setActiveTab, selectedArchetype, setSelectedArchetype,
    emailSent, setEmailSent, submissionError, setSubmissionError,
    statusDismissed, setStatusDismissed, showThankYou,
    onStartNewRun, onShareWithOthers, onShareResults, shouldReduceMotion,
  } = props;

    const values = calculateValuesFromMirrorGame(allResponses, baselineResponses);
    const persona = calculatePersona(values);
    const insights = getMirrorInsights(allResponses, baselineResponses, persona);
    const finalGameData: GameData = { sessionId, timestamp: sessionStartTime, setsCompleted: allResponses.length, baselineResponses, values, persona: persona.name, responses: allResponses };

    // Expectation profile (self-image) from baseline only — the comparison reference.
    const baselineValues = calculateExpectationProfile(baselineResponses);
    const confidence = calculateReflectionConfidence(allResponses);

    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 -z-10" style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 25%, #1a3a2e 50%, #2d3748 75%, #1e293b 100%) 0% 0% / 400% 400%',
          animation: 'gradientShift 15s ease infinite'
        }} />
        <div className="fixed inset-0 -z-10 opacity-40" style={{
          background: 'radial-gradient(at 20% 30%, rgba(138, 154, 91, 0.15) 0%, transparent 50%) 0% 0% / 200% 200%, radial-gradient(at 80% 70%, rgba(212, 175, 55, 0.12) 0%, transparent 50%), radial-gradient(rgba(74, 85, 104, 0.2) 0%, transparent 50%)',
          animation: 'gradientSwirl 20s ease-in-out infinite'
        }} />

        {/* Header */}
        <div className="safe-top pt-8 sm:pt-12 pb-4 sm:pb-6 text-center relative px-4" style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h1 className="text-xl sm:text-2xl tracking-[0.2em] sm:tracking-[0.3em] uppercase font-light mb-2 text-white" style={{
            fontFamily: 'Georgia, serif',
            textShadow: '0 2px 20px rgba(212, 175, 55, 0.3)'
          }}>Wardrobe Reflection</h1>
          <p className="text-xs text-white/60 tracking-wider">Your value profile</p>
        </div>

        {/* Tab Navigation */}
        <div className="relative overflow-x-auto scrollbar-hide" style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div className="max-w-4xl mx-auto flex min-w-max sm:min-w-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 py-3 sm:py-4 px-3 sm:px-4 text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-[0.15em] uppercase transition-all touch-manipulation ${
                activeTab === 'dashboard'
                  ? 'text-white border-b-2 border-[#d4af37]'
                  : 'text-white/50 hover:text-white/80'
              }`}
              style={activeTab === 'dashboard' ? { textShadow: '0 0 10px rgba(212, 175, 55, 0.5)' } : {}}
            >
              <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                <LayoutDashboard className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Chart</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`flex-1 py-3 sm:py-4 px-3 sm:px-4 text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-[0.15em] uppercase transition-all touch-manipulation ${
                activeTab === 'insights'
                  ? 'text-white border-b-2 border-[#d4af37]'
                  : 'text-white/50 hover:text-white/80'
              }`}
              style={activeTab === 'insights' ? { textShadow: '0 0 10px rgba(212, 175, 55, 0.5)' } : {}}
            >
              <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                Insights
              </span>
            </button>
            <button
              onClick={() => setActiveTab('share')}
              className={`flex-1 py-3 sm:py-4 px-3 sm:px-4 text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-[0.15em] uppercase transition-all touch-manipulation ${
                activeTab === 'share'
                  ? 'text-white border-b-2 border-[#d4af37]'
                  : 'text-white/50 hover:text-white/80'
              }`}
              style={activeTab === 'share' ? { textShadow: '0 0 10px rgba(212, 175, 55, 0.5)' } : {}}
            >
              <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                Share
              </span>
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`flex-1 py-3 sm:py-4 px-3 sm:px-4 text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-[0.15em] uppercase transition-all touch-manipulation ${
                activeTab === 'data'
                  ? 'text-white border-b-2 border-[#d4af37]'
                  : 'text-white/50 hover:text-white/80'
              }`}
              style={activeTab === 'data' ? { textShadow: '0 0 10px rgba(212, 175, 55, 0.5)' } : {}}
            >
              <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                Data
              </span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto" style={{
          padding: 'clamp(2rem, 6vw, 3rem) clamp(1rem, 4vw, 1.5rem)'
        }}>
          <div className="max-w-4xl mx-auto">
            {activeTab === 'dashboard' && (
              <div className="space-y-16 relative">
                {/* Hero Section - Persona + Crystal */}
                <section className="space-y-8">
                  <div className="text-center space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 rounded-2xl glass-card">
                    <div className="flex flex-col items-center gap-6 sm:gap-8">
                      {/* Holographic Crystal - Simplified version matching V1 aesthetic */}
                      <div className="w-32 h-32 sm:w-40 sm:h-40">
                        <div className="relative w-full h-full">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#4a5568]/20 via-[#8a9a5b]/20 to-[#d4af37]/20 blur-2xl animate-pulse" />
                          <div className="text-7xl sm:text-9xl flex items-center justify-center relative" style={{
                            filter: 'drop-shadow(0 0 20px rgba(212, 175, 55, 0.3))'
                          }}>
                            {persona.icon}
                          </div>
                        </div>
                      </div>

                      {/* Persona Info */}
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl tracking-wide text-white px-4 text-center" style={{
                        fontFamily: 'Georgia, serif',
                        fontWeight: 600,
                        textShadow: '0 2px 20px rgba(212, 175, 55, 0.3)',
                        letterSpacing: '0.05em',
                        wordWrap: 'break-word',
                        hyphens: 'auto'
                      }}>{persona.name}</h2>

                      <p className="text-sm sm:text-base leading-relaxed text-white/80 max-w-lg font-light italic px-4 text-center">
                        {persona.poeticDescription}
                      </p>

                      {confidence !== 'high' && (
                        <p className="text-[11px] text-white/50 font-light italic px-4 text-center">
                          Provisional result — based on {allResponses.length} of 3 garment sets. Completing more sharpens your profile.
                        </p>
                      )}

                      {/* Reflection Prompt — C1 contrast fix: warm gradient → dark glass */}
                      <div className="w-full max-w-lg p-4 sm:p-6 rounded-xl glass-card">
                        <div className="text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase text-[#d4af37] font-medium mb-3 sm:mb-4 text-center" style={{
                          textShadow: '0 0 10px rgba(212, 175, 55, 0.5)'
                        }}>Reflection Prompt</div>
                        <p className="text-xs sm:text-sm leading-relaxed text-white/90 font-light text-center">{persona.insight}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Baseline Comparison Section */}
                <section className="space-y-6">
                  <div className="text-center px-4">
                    <h3 className="text-base sm:text-lg tracking-[0.2em] uppercase text-white/90 font-light mb-3">Baseline Comparison</h3>
                    <p className="text-xs sm:text-sm text-white/60 font-light">How your values shifted during the reflection</p>
                  </div>

                  <div className="p-4 sm:p-6 lg:p-8 rounded-2xl space-y-5 sm:space-y-6 glass-card">
                    {/* Social Value */}
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                        <div className="flex items-center gap-2 text-white/90 min-w-0 flex-shrink">
                          <Compass className="w-4 h-4 flex-shrink-0" style={{ filter: 'drop-shadow(0 0 4px rgba(212, 175, 55, 0.5))' }} />
                          <span className="tracking-wider whitespace-nowrap">Social</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                          <span className="text-white/50 text-xs sm:text-sm">{baselineValues.social}</span>
                          <DeltaChip reflected={values.social} expectation={baselineValues.social} />
                          <span className="font-medium text-white text-sm sm:text-base min-w-[2ch] text-right">{values.social}</span>
                        </div>
                      </div>
                      <div className="h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                        <div className="h-full rounded-full transition-all" style={{
                          width: `${values.social}%`,
                          background: 'linear-gradient(90deg, rgb(138, 154, 91), rgb(168, 196, 120))',
                          boxShadow: '0 0 10px rgba(138, 154, 91, 0.5)'
                        }} />
                      </div>
                    </div>

                    {/* Emotional Value */}
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                        <div className="flex items-center gap-2 text-white/90 min-w-0 flex-shrink">
                          <Heart className="w-4 h-4 flex-shrink-0" style={{ filter: 'drop-shadow(0 0 4px rgba(236, 72, 153, 0.5))' }} />
                          <span className="tracking-wider whitespace-nowrap">Emotional</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                          <span className="text-white/50 text-xs sm:text-sm">{baselineValues.emotional}</span>
                          <DeltaChip reflected={values.emotional} expectation={baselineValues.emotional} />
                          <span className="font-medium text-white text-sm sm:text-base min-w-[2ch] text-right">{values.emotional}</span>
                        </div>
                      </div>
                      <div className="h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                        <div className="h-full rounded-full transition-all" style={{
                          width: `${values.emotional}%`,
                          background: 'linear-gradient(90deg, rgb(236, 72, 153), rgb(244, 114, 182))',
                          boxShadow: '0 0 10px rgba(236, 72, 153, 0.5)'
                        }} />
                      </div>
                    </div>

                    {/* Functional Value */}
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                        <div className="flex items-center gap-2 text-white/90 min-w-0 flex-shrink">
                          <Wrench className="w-4 h-4 flex-shrink-0" style={{ filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' }} />
                          <span className="tracking-wider whitespace-nowrap">Functional</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                          <span className="text-white/50 text-xs sm:text-sm">{baselineValues.functional}</span>
                          <DeltaChip reflected={values.functional} expectation={baselineValues.functional} />
                          <span className="font-medium text-white text-sm sm:text-base min-w-[2ch] text-right">{values.functional}</span>
                        </div>
                      </div>
                      <div className="h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                        <div className="h-full rounded-full transition-all" style={{
                          width: `${values.functional}%`,
                          background: 'linear-gradient(90deg, rgb(59, 130, 246), rgb(96, 165, 250))',
                          boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                        }} />
                      </div>
                    </div>

                    <div className="pt-5 border-t border-white/10">
                      <p className="text-[10px] text-center text-white/60 font-light">
                        Started as <span className="text-[#d4af37] font-medium" style={{ textShadow: '0 0 8px rgba(212, 175, 55, 0.5)' }}>{baselineResponses?.primaryDriver === 'function' ? 'Guardian' : baselineResponses?.primaryDriver === 'emotion' ? 'Memory Keeper' : 'Explorer'}</span> • Reflected as <span className="text-[#d4af37] font-medium" style={{ textShadow: '0 0 8px rgba(212, 175, 55, 0.5)' }}>{persona.name}</span>
                      </p>
                    </div>
                  </div>
                </section>

                {/* Auto-dismiss thank-you banner — appears for 3 s after a successful submission */}
                {showThankYou && (
                  <div
                    className="w-full p-4 sm:p-5 rounded-2xl text-center transition-opacity duration-500"
                    style={{
                      background: 'linear-gradient(135deg, rgba(138, 154, 91, 0.2), rgba(212, 175, 55, 0.15))',
                      border: '1px solid rgba(212, 175, 55, 0.4)',
                      backdropFilter: 'blur(10px)',
                    }}
                    role="status"
                  >
                    <p className="text-sm sm:text-base text-white font-light" style={{ fontFamily: 'Georgia, serif' }}>
                      Thank You for contributing to this research.
                    </p>
                  </div>
                )}

                {/* Persistent submission status banner — only renders for Saving and Failed states */}
                {!statusDismissed && emailSent !== true && (
                  <div
                    className="w-full p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3"
                    style={
                      emailSent === false
                        ? {
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            backdropFilter: 'blur(10px)',
                          }
                        : {
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(10px)',
                          }
                    }
                    role="status"
                  >
                    <div className="flex-1 text-center sm:text-left">
                      {emailSent === null && (
                        <p className="text-sm text-white font-light">
                          Saving your responses…
                        </p>
                      )}
                      {emailSent === false && (
                        <div className="space-y-1">
                          <p className="text-sm text-white font-light">
                            Your data could not be saved.
                          </p>
                          {submissionError && (
                            <p className="text-[11px] text-white/70 font-mono break-all">
                              {submissionError}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {emailSent === false && (
                        <>
                          <button
                            onClick={async () => {
                              setEmailSent(null);
                              setSubmissionError(null);
                              const result = await submitToSupabase(finalGameData);
                              setEmailSent(result.ok);
                              setSubmissionError(result.ok ? null : result.error);
                            }}
                            className="px-5 py-2.5 rounded-lg text-xs tracking-wider uppercase font-medium transition-all touch-manipulation"
                            style={{
                              background: 'linear-gradient(135deg, #d4af37, #8a9a5b)',
                              color: '#1a2e1a',
                              minHeight: '40px',
                            }}
                          >
                            Try again
                          </button>
                          <button
                            onClick={() => setStatusDismissed(true)}
                            aria-label="Dismiss submission status"
                            className="px-3 py-2.5 rounded-lg text-xs uppercase tracking-wider font-light text-white/70 hover:text-white transition-all touch-manipulation"
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              minHeight: '40px',
                            }}
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Value Fingerprint with simplified radar */}
                <section className="space-y-6">
                  <div className="text-center px-4">
                    <h3 className="text-base sm:text-lg tracking-[0.2em] uppercase text-white/90 font-light mb-3">Value Fingerprint</h3>
                    <p className="text-xs sm:text-sm text-white/60 font-light">The gap between expectation and behavior</p>
                  </div>

                  <div className="p-4 sm:p-6 lg:p-8 rounded-2xl glass-card">
                    <div className="flex items-center justify-center py-4">
                      <ValueFingerprintRadar values={values} expectation={baselineValues} />
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mt-6 text-xs sm:text-sm px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-4 flex-shrink-0 border-2 border-dashed border-[#d4af37] rounded-sm" style={{
                          filter: 'drop-shadow(0 0 4px rgba(212, 175, 55, 0.6))'
                        }} />
                        <span className="text-white/70 text-center sm:text-left">Initial Self-Assessment</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-4 flex-shrink-0 bg-emerald-500/30 rounded-sm border-2 border-emerald-500" style={{
                          boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
                        }} />
                        <span className="text-white/70 text-center sm:text-left">Reflective Result</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Behavioral Archetypes Grid */}
                <section className="space-y-6">
                  <div className="text-center px-4">
                    <h3 className="text-base sm:text-lg tracking-[0.2em] uppercase text-white/90 font-light mb-3">Behavioral Archetype</h3>
                    <p className="text-xs sm:text-sm text-white/60 font-light">Click any archetype to learn more</p>
                  </div>

                  <div className="p-4 sm:p-6 rounded-2xl glass-card">
                    <div className="space-y-4">
                      {/* Mobile: 2 columns, Tablet: 3 columns, Desktop: 5 columns */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                        {Object.entries(ARCHETYPE_INFO).map(([name, info]) => {
                          // calculatePersona prefixes with "The " (e.g. "The Memory Keeper"); ARCHETYPE_INFO keys do not
                          const isUser = name === persona.name.replace(/^The /, '');
                          return (
                            <button
                              key={name}
                              onClick={() => setSelectedArchetype(selectedArchetype === name ? null : name)}
                              className={`relative p-3 sm:p-4 rounded-xl text-center transition-all min-h-[100px] sm:min-h-[110px] flex flex-col items-center justify-center ${
                                isUser ? '' : selectedArchetype === name ? 'ring-2 ring-gold' : 'glass-card-subtle'
                              }`}
                              style={isUser ? {
                                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(138, 154, 91, 0.25))',
                                border: selectedArchetype === name ? '2px solid rgba(212, 175, 55, 1)' : '2px solid rgba(212, 175, 55, 0.7)',
                                backdropFilter: 'blur(10px)'
                              } : undefined}
                            >
                              {isUser && (
                                <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-medium tracking-wider" style={{
                                  background: 'linear-gradient(135deg, #d4af37, #8a9a5b)',
                                  color: '#1a2e1a',
                                  boxShadow: '0 0 15px rgba(212, 175, 55, 0.5)'
                                }}>YOU</div>
                              )}
                              <div className="text-2xl sm:text-3xl mb-2" style={isUser ? {
                                display: 'inline-block',
                                animation: 'wiggle 0.6s ease-in-out infinite'
                              } : undefined}>{info.icon}</div>
                              <h4 className="text-[10px] sm:text-xs font-medium leading-tight text-center" style={{
                                fontFamily: 'Georgia, serif',
                                color: '#f5f1e8',
                                wordWrap: 'break-word',
                                hyphens: 'auto',
                                maxWidth: '100%'
                              }}>{name}</h4>
                              <Info aria-hidden="true" className="absolute bottom-2 right-2 opacity-30 w-[10px] h-[10px] text-light" />
                            </button>
                          );
                        })}
                      </div>

                      {/* Archetype Description — C1 contrast fix: gold/olive gradient → dark glass */}
                      {selectedArchetype && ARCHETYPE_INFO[selectedArchetype as keyof typeof ARCHETYPE_INFO] && (
                        <div className="mt-5 p-4 sm:p-5 rounded-xl glass-card archetype-description-reveal">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-3xl">{ARCHETYPE_INFO[selectedArchetype as keyof typeof ARCHETYPE_INFO].icon}</span>
                            <div>
                              <h4 className="text-sm sm:text-base font-medium text-white" style={{ fontFamily: 'Georgia, serif' }}>
                                {selectedArchetype}
                              </h4>
                              <p className="text-xs text-gold italic">{ARCHETYPE_INFO[selectedArchetype as keyof typeof ARCHETYPE_INFO].tagline}</p>
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-white/80 font-light leading-relaxed">
                            {ARCHETYPE_INFO[selectedArchetype as keyof typeof ARCHETYPE_INFO].description}
                          </p>
                        </div>
                      )}

                      <p className="text-[10px] sm:text-xs text-center opacity-50 font-light italic" style={{
                        fontFamily: 'Inter, Montserrat, sans-serif',
                        color: '#f5f1e8'
                      }}>Tap any archetype to learn more</p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="space-y-4 sm:space-y-5">
                {/* Persona Insight Card */}
                <div className="p-5 sm:p-6 rounded-2xl glass-card relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{
                    background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.8), transparent)'
                  }} />
                  <div className="flex items-start gap-3 sm:gap-4 mb-4">
                    <div className="text-3xl sm:text-4xl flex-shrink-0" style={{
                      filter: 'drop-shadow(0 0 12px rgba(212, 175, 55, 0.4))'
                    }}>{persona.icon}</div>
                    <div>
                      <h2 className="text-base sm:text-lg tracking-wide text-white font-light mb-1" style={{
                        fontFamily: 'Georgia, serif',
                        textShadow: '0 0 10px rgba(212, 175, 55, 0.3)'
                      }}>{persona.name}</h2>
                      <p className="text-xs sm:text-sm text-white/60 font-light">{persona.tagline}</p>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-white/80 font-light leading-relaxed">{persona.insight}</p>
                </div>

                {/* Insights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {insights.map((insight, index) => {
                    const insightIcons = [
                      <Sparkles className="w-5 h-5" />,
                      <TrendingUp className="w-5 h-5" />,
                      <Heart className="w-5 h-5" />
                    ];
                    return (
                      <div key={index} className="p-4 sm:p-5 rounded-xl glass-card relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-0.5" style={{
                          background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.5), transparent)'
                        }} />
                        <div className="flex items-center gap-2 mb-3">
                          <div style={{
                            color: '#d4af37',
                            filter: 'drop-shadow(0 0 6px rgba(212, 175, 55, 0.5))'
                          }}>
                            {insightIcons[index % 3]}
                          </div>
                          <p className="text-[10px] sm:text-xs uppercase tracking-widest" style={{
                            color: '#d4af37',
                            textShadow: '0 0 8px rgba(212, 175, 55, 0.4)'
                          }}>Insight {index + 1}</p>
                        </div>
                        <h3 className="text-sm sm:text-base mb-2 text-white font-light" style={{
                          fontFamily: 'Georgia, serif'
                        }}>{insight.title}</h3>
                        <p className="text-xs sm:text-sm text-white/70 font-light leading-relaxed">{insight.text}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Behavioral Profile Card */}
                <div className="p-5 sm:p-6 rounded-2xl glass-card relative" style={{
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(138, 154, 91, 0.12))',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  boxShadow: '0 0 24px rgba(212, 175, 55, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
                }}>
                  <div className="flex items-center gap-2 mb-4">
                    <List className="w-5 h-5" style={{
                      color: '#d4af37',
                      filter: 'drop-shadow(0 0 6px rgba(212, 175, 55, 0.5))'
                    }} />
                    <p className="text-xs sm:text-sm uppercase tracking-widest" style={{
                      color: '#d4af37',
                      textShadow: '0 0 8px rgba(212, 175, 55, 0.4)'
                    }}>Behavioural Profile</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="flex items-start gap-2">
                      <ShoppingBag className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#d4af37', opacity: 0.7 }} />
                      <div>
                        <p className="text-xs font-medium text-white/90 mb-1">Acquisition</p>
                        <p className="text-xs text-white/70 font-light leading-relaxed">{persona.researchProfile.acquisitionDriver}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Package className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#d4af37', opacity: 0.7 }} />
                      <div>
                        <p className="text-xs font-medium text-white/90 mb-1">Retention</p>
                        <p className="text-xs text-white/70 font-light leading-relaxed">{persona.researchProfile.retentionPattern}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <DoorOpen className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#d4af37', opacity: 0.7 }} />
                      <div>
                        <p className="text-xs font-medium text-white/90 mb-1">Letting Go</p>
                        <p className="text-xs text-white/70 font-light leading-relaxed">{persona.researchProfile.disposalTrigger}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'share' && (
              <div className="space-y-4 sm:space-y-5">
                {/* Share Your Results */}
                <div className="p-5 sm:p-6 rounded-2xl glass-card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-2xl sm:text-3xl">{persona.icon}</div>
                    <div>
                      <h2 className="text-base sm:text-lg tracking-wide text-white" style={{ fontFamily: 'Georgia, serif', fontWeight: 600 }}>Share Your Results</h2>
                      <p className="text-xs sm:text-sm text-white/60 font-light">{persona.name}</p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-white/70 font-light mb-5 italic">"{persona.tagline}"</p>
                  <button
                    onClick={() => onShareResults(persona)}
                    className="w-full py-3 sm:py-4 rounded-xl text-xs sm:text-sm tracking-[0.1em] sm:tracking-[0.15em] uppercase font-light transition-all touch-manipulation"
                    style={{
                      background: 'linear-gradient(135deg, #d4af37, #f4d03f)',
                      color: '#1a2e1a',
                      boxShadow: '0 4px 20px rgba(212, 175, 55, 0.35)',
                      minHeight: '48px'
                    }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Share2 className="w-4 h-4" />
                      Share My Archetype
                    </span>
                  </button>
                </div>

                {/* Invite Others */}
                <div className="p-5 sm:p-6 rounded-2xl glass-card">
                  <h2 className="text-base sm:text-lg tracking-wide mb-3 text-white" style={{ fontFamily: 'Georgia, serif', fontWeight: 600 }}>Invite Others</h2>
                  <p className="text-xs sm:text-sm text-white/60 font-light mb-5">Share this research tool with friends and help them discover their own wardrobe archetype</p>
                  <button
                    onClick={onShareWithOthers}
                    className="w-full py-3 sm:py-4 rounded-xl text-xs sm:text-sm tracking-[0.1em] sm:tracking-[0.15em] uppercase font-light transition-all touch-manipulation"
                    style={{
                      background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(138, 154, 91, 0.15))',
                      border: '1px solid rgba(212, 175, 55, 0.4)',
                      color: '#d4af37',
                      boxShadow: '0 0 20px rgba(212, 175, 55, 0.15)',
                      minHeight: '48px'
                    }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Users className="w-4 h-4" />
                      Invite Others
                    </span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-5">
                <div className="p-6 rounded-2xl glass-card">
                  <h2 className="text-lg tracking-wide mb-4 text-white" style={{ fontFamily: 'Georgia, serif', fontWeight: 600 }}>Research Data Export</h2>
                  <div className="space-y-3 text-sm text-white/80 font-light">
                    <div className="flex justify-between"><span>Session ID</span><span className="font-mono text-white/60">{sessionId.substring(0, 12)}...</span></div>
                    <div className="flex justify-between"><span>Sets completed</span><span className="text-white">{allResponses.length} / 3</span></div>
                    <div className="flex justify-between"><span>Baseline completed</span><span className="text-white">{baselineResponses ? 'Yes' : 'No'}</span></div>
                    <div className="flex justify-between"><span>Date</span><span className="text-white">{new Date(sessionStartTime).toLocaleDateString()}</span></div>
                    <div className="flex justify-between"><span>Submission status</span><span className={emailSent === false ? 'text-red-400' : 'text-white'}>{emailSent === null ? 'Saving...' : emailSent ? 'Saved' : 'Submission failed'}</span></div>
                    {emailSent === false && (
                      <button
                        onClick={async () => {
                          setEmailSent(null);
                          setSubmissionError(null);
                          const result = await submitToSupabase(finalGameData);
                          setEmailSent(result.ok);
                          setSubmissionError(result.ok ? null : result.error);
                          setStatusDismissed(false);
                        }}
                        className="w-full mt-2 py-2.5 px-4 rounded-lg text-xs tracking-wider uppercase font-medium transition-all touch-manipulation"
                        style={{
                          background: 'linear-gradient(135deg, #d4af37, #8a9a5b)',
                          color: '#1a2e1a',
                          minHeight: '40px',
                        }}
                      >
                        Try again
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => exportCSV(finalGameData)}
                    className="py-3 px-4 flex items-center justify-center gap-2 rounded-xl text-xs tracking-wider uppercase font-light transition-all touch-manipulation"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      backdropFilter: 'blur(10px)',
                      color: '#d4af37',
                      minHeight: '48px'
                    }}
                  >
                    <FileDown className="w-4 h-4" />
                    Download CSV
                  </button>
                  <button
                    onClick={() => exportGameData(finalGameData)}
                    className="py-3 px-4 flex items-center justify-center gap-2 rounded-xl text-xs tracking-wider uppercase font-light transition-all touch-manipulation"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      backdropFilter: 'blur(10px)',
                      color: '#d4af37',
                      minHeight: '48px'
                    }}
                  >
                    <FileDown className="w-4 h-4" />
                    Download JSON
                  </button>
                </div>
                <div className="p-5 rounded-2xl" style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <p className="text-xs uppercase tracking-widest mb-3" style={{
                    color: '#d4af37',
                    textShadow: '0 0 8px rgba(212, 175, 55, 0.4)'
                  }}>Raw response count</p>
                  <p className="text-sm text-white/60 font-light">This page keeps export and session information only. The archetype explanation is intentionally shown on Dashboard and Insights, not on Data.</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6" style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div className="max-w-4xl mx-auto space-y-4">
              <button
                onClick={onStartNewRun}
                className="w-full py-4 rounded-xl text-xs sm:text-sm tracking-[0.1em] sm:tracking-[0.15em] uppercase font-light transition-all touch-manipulation"
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(138, 154, 91, 0.2))',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  color: '#d4af37',
                  boxShadow: '0 0 30px rgba(212, 175, 55, 0.2)',
                  textShadow: '0 0 10px rgba(212, 175, 55, 0.5)',
                  minHeight: '48px'
                }}
              >
                New Reflection
              </button>
              <p className="text-center text-[10px] tracking-[0.15em] sm:tracking-[0.2em] uppercase font-light" style={{
                color: 'rgba(212, 175, 55, 0.5)',
                textShadow: '0 0 8px rgba(212, 175, 55, 0.3)'
              }}>
                Wardrobe Mirror Research
              </p>
            </div>
          </div>
        </div>
      </div>
    );

}
