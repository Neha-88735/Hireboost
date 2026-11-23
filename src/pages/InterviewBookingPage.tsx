import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Target,
  Sparkles,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Sliders,
  Star,
  Users,
  Play,
  ShieldAlert,
  HelpCircle,
  MessageSquare,
  X
} from 'lucide-react';
import { StorageService, INTERVIEW_DOMAINS } from '../services/storage';
import {
  User,
  DifficultyLevel,
  InterviewMode,
  ExperienceLevel,
  QuestionSetType,
  InterviewSession,
  UserFeedback,
  RoundFormat,
  InterviewQuestionItem
} from '../types/hireboost';
import { TargetManagerModal } from '../components/TargetManagerModal';
import {
  getDefaultRoundFormat,
  getStoredCodingTimeLimits,
  getStoredVoiceTimeLimits,
  getVoiceTimeLimitSeconds,
  saveStoredCodingTimeLimits,
  saveStoredVoiceTimeLimits
} from '../config/interviewConfig';
import { selectCodingProblemsForConfig } from '../data/codingProblems';

interface InterviewBookingPageProps {
  currentUser: User;
  initialDomain?: string;
  initialDifficulty?: DifficultyLevel;
  initialMilestoneId?: string;
  onStartSession: (session: InterviewSession) => void;
  onNavigate: (view: string) => void;
  theme: 'dark' | 'light';
}

const DOMAIN_OPTIONS = INTERVIEW_DOMAINS;

const DOMAIN_TOPICS: Record<string, string[]> = {
  'Data Structures and Algorithms': [
    'Arrays, Strings & Sliding Window',
    'Trees, Graphs & Shortest Paths',
    'Dynamic Programming & Memoization',
    'Heaps, Recursion & Complexity Proofs'
  ],
  'C++': [
    'Pointers, References & Smart Pointers',
    'STL Containers & Iterators',
    'OOP, Virtual Tables & Move Semantics',
    'Memory Safety & Concurrency'
  ],
  'Java': [
    'JVM Internals & Garbage Collection',
    'Collections Framework & Generics',
    'Streams, Lambdas & Exception Handling',
    'Multithreading & Spring Core Concepts'
  ],
  'Python': [
    'Data Model, Generators & Decorators',
    'Memory Management, GIL & Asyncio',
    'Data Structures & Pythonic Algorithms',
    'API Design, Testing & Type Annotations'
  ],
  'Web Development': [
    'DOM, Browser Rendering & Event Loop',
    'React Component State & Hooks',
    'REST/GraphQL APIs, Auth & CORS',
    'Core Web Vitals & Caching'
  ],
  'Database Management Systems': [
    'Normalization & Schema Modeling',
    'B-Tree Indexing & Query Optimization',
    'ACID Transactions & Isolation Levels',
    'Replication, Sharding & NoSQL Trade-offs'
  ],
  'Operating Systems': [
    'Processes, Threads & Context Switching',
    'CPU Scheduling & Deadlock Prevention',
    'Virtual Memory, Paging & Page Faults',
    'File Systems & Synchronization Primitives'
  ],
  'Computer Networks': [
    'OSI & TCP/IP Protocol Layers',
    'HTTP/HTTPS, TLS & DNS Resolution',
    'Congestion Control, Routing & Subnets',
    'Load Balancing, CDNs & WebSockets'
  ],
  'Software Engineering': [
    'System Architecture & Modular Design',
    'Design Patterns & SOLID Principles',
    'API Contracts, Testing & CI/CD',
    'Scalability & Reliability Trade-offs'
  ],
  'Artificial Intelligence': [
    'Search Heuristics & Constraint Solving',
    'LLM Prompting & Context Engineering',
    'RAG Pipelines, Embeddings & Grounding',
    'Agent Evaluation & Safety Guardrails'
  ],
  'Machine Learning': [
    'Supervised & Unsupervised Algorithms',
    'Feature Engineering & Regularization',
    'Bias-Variance, Cross-Validation & Metrics',
    'Model Training, Drift & Deployment'
  ],
  'HR Interview': [
    'Career Motivation & Role Alignment',
    'Strengths, Growth Areas & Ownership',
    'Team Collaboration & Conflict Handling',
    'Adaptability & Long-Term Goals'
  ],
  'Behavioral Interview': [
    'STAR Storytelling Structure',
    'Technical Leadership & Mentoring',
    'Handling Ambiguity & Tight Deadlines',
    'Post-Mortems & Lessons Learned'
  ]
};

interface AvailableInterviewOption {
  id: string;
  title: string;
  domain: string;
  subtopic?: string;
  difficulty: DifficultyLevel;
  mode: InterviewMode;
  durationMinutes: number;
  description: string;
  rating: number;
  reviewCount: number;
  highlight: string;
}

export const InterviewBookingPage: React.FC<InterviewBookingPageProps> = ({
  currentUser,
  initialDomain,
  initialDifficulty,
  initialMilestoneId,
  onStartSession,
  onNavigate,
  theme
}) => {
  const isDark = theme === 'dark';
  const [, setRefreshTick] = useState(0);
  const [targetModalOpen, setTargetModalOpen] = useState(false);

  const profile = StorageService.getUserProfile(currentUser.userId);
  const targets = StorageService.getUserTargets(currentUser.userId);
  const activeTarget = StorageService.getActiveTarget(currentUser.userId);

  const defaultDomain =
    initialDomain ||
    (activeTarget.focusDomains && activeTarget.focusDomains.length > 0
      ? activeTarget.focusDomains[0]
      : 'Data Structures and Algorithms');

  // Configuration Form State
  const [domain, setDomain] = useState<string>(defaultDomain);
  const [subtopic, setSubtopic] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialDifficulty || 'Medium');
  const [mode, setMode] = useState<InterviewMode>('Technical');
  const [roundFormat, setRoundFormat] = useState<RoundFormat>(() => getDefaultRoundFormat(defaultDomain, 'Technical'));
  const [hasCustomRoundFormat, setHasCustomRoundFormat] = useState<boolean>(false);
  const [codingTimeLimits, setCodingTimeLimits] = useState<Record<DifficultyLevel, number>>(() =>
    getStoredCodingTimeLimits()
  );
  const [voiceTimeLimits, setVoiceTimeLimits] = useState<Record<DifficultyLevel, number>>(() =>
    getStoredVoiceTimeLimits()
  );
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(profile.experience || 'Fresher');
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [questionSetType, setQuestionSetType] = useState<QuestionSetType>('AI-Generated');

  useEffect(() => {
    fetch('/api/interview/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.codingTimeLimitsMinutes) {
          const synced = saveStoredCodingTimeLimits(data.codingTimeLimitsMinutes);
          setCodingTimeLimits(synced);
        }
        if (data?.voiceTimeLimitsMinutes) {
          const syncedVoice = saveStoredVoiceTimeLimits(data.voiceTimeLimitsMinutes);
          setVoiceTimeLimits(syncedVoice);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!hasCustomRoundFormat) {
      setRoundFormat(getDefaultRoundFormat(domain, mode));
    }
  }, [domain, mode, hasCustomRoundFormat]);

  const getOptionStats = (optDomain: string, optTitle: string) => {
    const reviews = StorageService.getReviewsForInterview(optDomain, optTitle);
    const reviewCount = reviews.length;
    const rating =
      reviewCount > 0
        ? Math.round((reviews.reduce((acc, r) => acc + r.overallRating, 0) / reviewCount) * 10) / 10
        : 0;
    return { rating, reviewCount };
  };

  const buildAvailableOptions = (
    effectiveDomain: string,
    targetDifficulty: DifficultyLevel,
    targetMode: InterviewMode,
    targetDuration: number,
    targetSubtopic?: string
  ): AvailableInterviewOption[] => {
    const cleanSub = (targetSubtopic || '').trim();
    const labelBase = cleanSub ? `${effectiveDomain}: ${cleanSub}` : effectiveDomain;
    const title1 = `${labelBase} – Core Round`;
    const title2 = `${labelBase} – Quick Round`;
    const title3 = `${labelBase} – Tech + HR Mix`;

    const stats1 = getOptionStats(effectiveDomain, title1);
    const stats2 = getOptionStats(effectiveDomain, title2);
    const stats3 = getOptionStats(effectiveDomain, title3);

    return [
      {
        id: 'opt_1',
        title: title1,
        domain: effectiveDomain,
        subtopic: cleanSub || undefined,
        difficulty: targetDifficulty,
        mode: targetMode,
        durationMinutes: targetDuration,
        description: cleanSub
          ? `Deep-dive questions, edge cases, and problem solving focused specifically on ${cleanSub}.`
          : `Core questions, problem solving, and trade-offs in ${effectiveDomain}.`,
        rating: stats1.rating,
        reviewCount: stats1.reviewCount,
        highlight: 'Recommended'
      },
      {
        id: 'opt_2',
        title: title2,
        domain: effectiveDomain,
        subtopic: cleanSub || undefined,
        difficulty: targetDifficulty === 'Hard' ? 'Medium' : targetDifficulty === 'Easy' ? 'Easy' : 'Medium',
        mode: targetMode,
        durationMinutes: Math.min(15, targetDuration),
        description: cleanSub
          ? `Fast-paced round drilling key patterns and pitfalls in ${cleanSub}.`
          : `Short, fast round focused on core concepts and edge cases.`,
        rating: stats2.rating,
        reviewCount: stats2.reviewCount,
        highlight: 'Quick'
      },
      {
        id: 'opt_3',
        title: title3,
        domain: effectiveDomain,
        subtopic: cleanSub || undefined,
        difficulty: targetDifficulty,
        mode: 'Mixed',
        durationMinutes: Math.min(30, Math.max(15, targetDuration)),
        description: cleanSub
          ? `Mix of ${cleanSub} technical prompts and HR behavioral questions.`
          : `Mix of technical coding and HR behavioral questions.`,
        rating: stats3.rating,
        reviewCount: stats3.reviewCount,
        highlight: 'Tech + HR'
      }
    ];
  };

  // Search Results & Booking State
  const [availableOptions, setAvailableOptions] = useState<AvailableInterviewOption[]>(() =>
    initialDomain ? buildAvailableOptions(initialDomain, initialDifficulty || 'Medium', 'Technical', 15) : []
  );
  const [hasSearched, setHasSearched] = useState<boolean>(() => Boolean(initialDomain));
  const [selectedOption, setSelectedOption] = useState<AvailableInterviewOption | null>(null);
  const [bookingConfirmation, setBookingConfirmation] = useState<InterviewSession | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    if (initialDomain) {
      const nextDiff = initialDifficulty || 'Medium';
      setDomain(initialDomain);
      setDifficulty(nextDiff);
      setAvailableOptions(buildAvailableOptions(initialDomain, nextDiff, mode, durationMinutes));
      setHasSearched(true);
      setSelectedOption(null);
    } else if (initialDifficulty) {
      setDifficulty(initialDifficulty);
      setHasSearched(false);
      setSelectedOption(null);
    }
  }, [initialDomain, initialDifficulty]);

  const handleTargetSwitch = (targetId: string) => {
    StorageService.setActiveTarget(currentUser.userId, targetId);
    const updatedTarget = StorageService.getActiveTarget(currentUser.userId);
    if (updatedTarget.focusDomains && updatedTarget.focusDomains.length > 0) {
      setDomain(updatedTarget.focusDomains[0]);
    }
    setHasSearched(false);
    setSelectedOption(null);
    setRefreshTick(t => t + 1);
  };

  // Generate Available Interview Options based on user selection
  const handleFindInterviews = () => {
    const effectiveDomain = domain === 'Custom Topic' ? (customTopic || 'Specialized Topic') : domain;
    const options = buildAvailableOptions(effectiveDomain, difficulty, mode, durationMinutes, subtopic);
    setAvailableOptions(options);
    setSelectedOption(null);
    setHasSearched(true);
  };

  // Confirm booking & create InterviewSession
  const handleConfirmBooking = async (option: AvailableInterviewOption) => {
    setIsGenerating(true);

    try {
      const effectiveRoundFormat: RoundFormat =
        option.mode === 'HR' ? 'voice_only' : roundFormat;

      // Configure session linked to the active target (and optional roadmap milestone)
      const savedConfig = StorageService.configureSession({
        domain: option.domain,
        subtopic: option.subtopic,
        customTopic: domain === 'Custom Topic' ? customTopic : undefined,
        difficulty: option.difficulty,
        mode: option.mode,
        roundFormat: effectiveRoundFormat,
        codingTimeLimits,
        voiceTimeLimits,
        experienceLevel: experienceLevel,
        durationMinutes: option.durationMinutes,
        questionSetType: questionSetType,
        title: option.title,
        description: option.description,
        targetId: activeTarget.targetId,
        targetRole: activeTarget.roleName,
        roadmapMilestoneId: initialMilestoneId && option.domain === initialDomain ? initialMilestoneId : undefined,
        roadmapTargetId: initialMilestoneId && option.domain === initialDomain ? activeTarget.targetId : undefined
      });

      // Fetch questions (preserving full coding test cases, starter code & configurable time limits)
      let questions: InterviewQuestionItem[] = [];

      try {
        const response = await fetch('/api/ai/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: option.domain,
            subtopic: option.subtopic || '',
            difficulty: option.difficulty,
            mode: option.mode,
            roundFormat: effectiveRoundFormat,
            codingTimeLimits,
            voiceTimeLimits,
            count: 3,
            customTopic: domain === 'Custom Topic' ? customTopic : ''
          })
        });
        const data = await response.json();
        if (data && data.questions && data.questions.length > 0) {
          questions = data.questions.map((q: any, i: number) => ({
            ...q,
            questionId: q.questionId || `q_${Date.now()}_${i}`,
            questionText: q.questionText,
            questionType: q.questionType || 'voice',
            difficulty: q.difficulty || option.difficulty,
            keyPoints: q.keyPoints
          }));
        }
      } catch (err) {
        console.warn('Backend question fetch error, using fallback:', err);
      }

      if (questions.length === 0) {
        const focusTopic = option.subtopic ? `${option.subtopic} (${option.domain})` : option.domain;
        const voiceLimitSec = getVoiceTimeLimitSeconds(option.difficulty, voiceTimeLimits);
        const voiceFb: InterviewQuestionItem[] =
          effectiveRoundFormat === 'coding_only'
            ? []
            : [
                {
                  questionId: `q_fb_1`,
                  questionType: 'voice',
                  difficulty: option.difficulty,
                  timeLimitSeconds: voiceLimitSec,
                  questionText: `Explain how you would design an efficient solution for a core problem in ${focusTopic}. What data structures and Big-O guarantees apply?`,
                  keyPoints: ['Time complexity', 'Space complexity', 'Edge cases']
                },
                {
                  questionId: `q_fb_2`,
                  questionType: 'voice',
                  difficulty: option.difficulty,
                  timeLimitSeconds: voiceLimitSec,
                  questionText: `How does ${focusTopic} scale in high-throughput production environments? What trade-offs must an engineer make?`,
                  keyPoints: ['Scalability', 'Fault tolerance', 'Latency vs Consistency']
                }
              ];
        const codingFb: InterviewQuestionItem[] =
          effectiveRoundFormat === 'voice_only'
            ? []
            : selectCodingProblemsForConfig(
                option.domain,
                option.difficulty,
                effectiveRoundFormat === 'coding_only' ? 2 : 1,
                codingTimeLimits
              );
        questions = [...voiceFb, ...codingFb];
      }

      // Create session in database
      const session = StorageService.createSession(currentUser.userId, savedConfig, questions);
      setSelectedOption(null);
      setBookingConfirmation(session);
      setBookingError(null);
    } catch (err: any) {
      setBookingError(`Booking error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`min-h-screen py-10 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sliders className="w-4 h-4" />
              <span>Book Interview</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Set Up Your Interview</h1>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Pick your topic, difficulty, and time limit.
            </p>
          </div>
        </div>

        {/* Active Target Selector Bar */}
        <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block">
                Your Goal
              </span>
              <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <strong>{activeTarget.roleName}</strong> • Goal: {activeTarget.targetScore}%
                {activeTarget.focusDomains && activeTarget.focusDomains.length > 0 && (
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                    {' '}• Topics: {activeTarget.focusDomains.join(', ')}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              aria-label="Select target for this interview"
              value={activeTarget.targetId}
              onChange={(e) => handleTargetSwitch(e.target.value)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              {targets.map((t) => (
                <option key={t.targetId} value={t.targetId}>
                  {t.roleName} ({t.targetScore}%)
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setTargetModalOpen(true)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                isDark ? 'border-slate-700 hover:bg-slate-800 text-indigo-400' : 'border-slate-300 hover:bg-slate-100 text-indigo-600'
              }`}
            >
              Change / Add
            </button>
          </div>
        </div>

        {bookingError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {bookingError}
          </div>
        )}

        {/* Configuration Form */}
        <div className={`p-6 sm:p-8 rounded-3xl border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* A. Domain / Topic */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Domain / Topic</span>
                <span className="text-[10px] text-indigo-400 font-normal">Technical & HR Tracks</span>
              </label>
              <select
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value);
                  setSubtopic('');
                }}
                className={`w-full px-3 py-2.5 text-xs rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                {DOMAIN_OPTIONS.map((opt) => {
                  const isTargetFocus = activeTarget.focusDomains?.includes(opt);
                  return (
                    <option key={opt} value={opt}>
                      {isTargetFocus ? `★ ${opt} (Target Focus)` : opt}
                    </option>
                  );
                })}
              </select>

              {/* Custom Topic Input if selected */}
              {domain === 'Custom Topic' && (
                <div className="mt-2.5">
                  <input
                    type="text"
                    required
                    placeholder="Enter custom topic (e.g. Distributed Caching, Kubernetes, Go)"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* A2. Optional Specific Subtopic Filter / Search */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Specific Subtopic <span className="font-normal text-slate-400">(Optional)</span></span>
                <span className="text-[10px] text-emerald-400 font-normal">Targeted Practice</span>
              </label>
              <input
                type="text"
                value={subtopic}
                onChange={(e) => setSubtopic(e.target.value)}
                placeholder={
                  DOMAIN_TOPICS[domain]?.[0]
                    ? `e.g. ${DOMAIN_TOPICS[domain][0].split(',')[0]}`
                    : 'e.g. Dynamic Programming, Asyncio, Indexing'
                }
                className={`w-full px-3 py-2.5 text-xs rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
              />
              {DOMAIN_TOPICS[domain] && DOMAIN_TOPICS[domain].length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {DOMAIN_TOPICS[domain].slice(0, 3).map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setSubtopic(subtopic === chip ? '' : chip)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors cursor-pointer ${
                        subtopic === chip
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : isDark
                            ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                            : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* B. Difficulty Level */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Difficulty Level</span>
                <span className="text-[10px] text-amber-400 font-normal">Adaptive Depth</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      difficulty === lvl
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : isDark
                          ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* C. Interview Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Interview Mode</span>
                <span className="text-[10px] text-purple-400 font-normal">Technical or Behavioral</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Technical', 'HR', 'Mixed'] as InterviewMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      mode === m
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : isDark
                          ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* D. Experience Level */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Experience Level</span>
                <span className="text-[10px] text-emerald-400 font-normal">Prefilled from Profile</span>
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                className={`w-full px-3 py-2.5 text-xs rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="Fresher">Fresher (0 - 1 Years)</option>
                <option value="Intermediate">Intermediate (1 - 3 Years)</option>
                <option value="Experienced">Experienced (3+ Years)</option>
              </select>
            </div>

            {/* E. Interview Duration (max 30 mins constraint strictly adhered to) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Interview Duration</span>
                <span className="text-[10px] text-rose-400 font-normal">Max 30 mins</span>
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                className={`w-full px-3 py-2.5 text-xs rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value={5}>5 Minutes (Quick Drill)</option>
                <option value={10}>10 Minutes (Standard Screening)</option>
                <option value={15}>15 Minutes (Recommended)</option>
                <option value={20}>20 Minutes (In-Depth Technical)</option>
                <option value={25}>25 Minutes (Advanced Architectural)</option>
                <option value={30}>30 Minutes (Comprehensive Deep Dive)</option>
              </select>
            </div>

            {/* F. Question Set */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Question Set Engine</span>
                <span className="text-[10px] text-blue-400 font-normal">AI or Curated Bank</span>
              </label>
              <select
                value={questionSetType}
                onChange={(e) => setQuestionSetType(e.target.value as QuestionSetType)}
                className={`w-full px-3 py-2.5 text-xs rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="AI-Generated">AI-Generated (Google Gemini)</option>
                <option value="Predefined">Predefined Expert Curated</option>
                <option value="Custom">Custom High-Difficulty Focus</option>
              </select>
            </div>

            {/* G. Round Format (Timed Coding + Live Voice) */}
            <div className="md:col-span-2 lg:col-span-3 pt-2 border-t border-slate-800/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="text-xs font-bold text-slate-300">
                  Round Format &amp; Per-Question Time Limits
                </label>
                <span className="text-[11px] font-mono text-indigo-400">
                  Voice: Easy {voiceTimeLimits.Easy}m · Med {voiceTimeLimits.Medium}m · Hard {voiceTimeLimits.Hard}m
                  {roundFormat !== 'voice_only' &&
                    ` | Coding: ${codingTimeLimits.Easy}m / ${codingTimeLimits.Medium}m / ${codingTimeLimits.Hard}m`}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    value: 'mixed_coding_voice' as RoundFormat,
                    label: 'Voice + Timed Coding',
                    desc: 'Live voice Q&A followed by timed coding problems'
                  },
                  {
                    value: 'coding_only' as RoundFormat,
                    label: 'Timed Coding Only',
                    desc: 'Auto-timed coding problems with test execution'
                  },
                  {
                    value: 'voice_only' as RoundFormat,
                    label: 'Voice Interview Only',
                    desc: 'Real-time spoken dialogue with follow-up probing'
                  }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setHasCustomRoundFormat(true);
                      setRoundFormat(item.value);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      roundFormat === item.value
                        ? 'bg-indigo-600/15 border-indigo-500 ring-1 ring-indigo-500/40'
                        : isDark
                          ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Find Available Interviews Button */}
          <div className="mt-8 pt-6 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Mandatory proctored audio, video &amp; AI dialogue enabled automatically.</span>
            </div>
            <button
              onClick={handleFindInterviews}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs bg-linear-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 cursor-pointer transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Find Available Interviews</span>
            </button>
          </div>
        </div>

        {/* Available Interviews Results Section */}
        {hasSearched && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Matching Available Interviews</h2>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Select an interview to inspect candidate ratings and reviews before confirming your booking.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                {availableOptions.length} Options Ready
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {availableOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setSelectedOption(opt)}
                  className={`p-6 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer ${
                    selectedOption?.id === opt.id
                      ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                      : 'hover:border-indigo-500/50'
                  } ${
                    isDark ? 'bg-slate-900 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        {opt.highlight}
                      </span>
                      <div className="flex items-center space-x-1 text-amber-400 text-xs font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{opt.reviewCount > 0 ? opt.rating : 'New'}</span>
                        <span className="text-slate-500 text-[10px]">
                          ({opt.reviewCount} {opt.reviewCount === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold mb-2 leading-snug">{opt.title}</h3>
                    <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {opt.description}
                    </p>

                    <div className="flex flex-wrap gap-2 text-[11px] mb-5">
                      <span className={`px-2 py-1 rounded-md border ${
                        isDark ? 'bg-slate-800/80 text-slate-300 border-slate-700/50' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        ⏱️ {opt.durationMinutes} mins
                      </span>
                      <span className={`px-2 py-1 rounded-md border ${
                        isDark ? 'bg-slate-800/80 text-slate-300 border-slate-700/50' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        🎯 {opt.difficulty}
                      </span>
                      <span className={`px-2 py-1 rounded-md border ${
                        isDark ? 'bg-slate-800/80 text-slate-300 border-slate-700/50' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        ⚡ {opt.mode}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOption(opt);
                    }}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center justify-center space-x-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <span>Select &amp; View Reviews</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pre-Booking Selected Interview Details & Candidate Reviews Modal */}
        {selectedOption && !bookingConfirmation && (() => {
          const reviews: UserFeedback[] = StorageService.getReviewsForInterview(
            selectedOption.domain,
            selectedOption.title
          );
          const count = reviews.length;
          const avgOverall = count > 0
            ? (reviews.reduce((acc, r) => acc + r.overallRating, 0) / count).toFixed(1)
            : null;
          const avgQuality = count > 0
            ? (reviews.reduce((acc, r) => acc + r.questionQualityRating, 0) / count).toFixed(1)
            : null;
          const avgDifficulty = count > 0
            ? (reviews.reduce((acc, r) => acc + r.difficultyRating, 0) / count).toFixed(1)
            : null;
          const avgExperience = count > 0
            ? (reviews.reduce((acc, r) => acc + r.interviewExperienceRating, 0) / count).toFixed(1)
            : null;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
              <div
                className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                {/* Modal Header */}
                <div
                  className={`sticky top-0 z-10 px-6 py-5 border-b flex items-start justify-between gap-4 ${
                    isDark ? 'bg-slate-900/95 border-slate-800 backdrop-blur-md' : 'bg-white/95 border-slate-200 backdrop-blur-md'
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        {selectedOption.highlight}
                      </span>
                      <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {selectedOption.domain} • {selectedOption.difficulty} • {selectedOption.durationMinutes} mins
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold tracking-tight">{selectedOption.title}</h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedOption(null)}
                    aria-label="Close interview preview"
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Description, Topics Involved & Difficulty Modes */}
                  <div
                    className={`p-4 rounded-2xl border space-y-3 ${
                      isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {selectedOption.description}
                    </p>

                    <div className="flex flex-wrap gap-3 text-[11px] pt-0.5">
                      <span className="text-indigo-400 font-semibold">
                        Goal: {activeTarget.roleName}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                        Type: {selectedOption.mode}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                        Level: {experienceLevel}
                      </span>
                    </div>

                    {/* List of Topics Covered */}
                    <div className={`pt-2.5 border-t space-y-1.5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                      <span className={`text-[11px] font-bold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        Topics
                      </span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        {(() => {
                          const baseTopics = DOMAIN_TOPICS[selectedOption.domain] || [
                            `${selectedOption.domain} Basics`,
                            'Problem Solving',
                            'Edge Cases',
                            'Real-World Design'
                          ];
                          const topicsList =
                            selectedOption.mode === 'Mixed' &&
                            selectedOption.domain !== 'HR Interview' &&
                            selectedOption.domain !== 'Behavioral Interview'
                              ? [...baseTopics.slice(0, 3), 'Behavioral Questions']
                              : baseTopics;
                          return topicsList.map((topicItem) => (
                            <li
                              key={topicItem}
                              className={`flex items-start gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                            >
                              <span className="text-indigo-400 mt-0.5" aria-hidden="true">·</span>
                              <span>{topicItem}</span>
                            </li>
                          ));
                        })()}
                      </ul>
                    </div>

                    {/* Difficulty Picker */}
                    <div className={`pt-2.5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isDark ? 'border-slate-800' : 'border-slate-200'
                    }`}>
                      <span className={`text-[11px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        Difficulty
                      </span>
                      <div className="flex items-center gap-1.5">
                        {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map((lvl) => {
                          const isActive = selectedOption.difficulty === lvl;
                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => {
                                setSelectedOption({ ...selectedOption, difficulty: lvl });
                                setDifficulty(lvl);
                              }}
                              aria-pressed={isActive}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : isDark
                                    ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-indigo-500'
                                    : 'bg-white border-slate-300 text-slate-700 hover:border-indigo-500'
                              }`}
                            >
                              {lvl}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Pre-Booking Actions */}
                  <div className={`pb-5 border-b flex flex-col sm:flex-row items-center justify-between gap-3 ${
                    isDark ? 'border-slate-800/70' : 'border-slate-200'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setSelectedOption(null)}
                      className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-semibold text-xs border cursor-pointer transition-colors ${
                        isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => handleConfirmBooking(selectedOption)}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <span>{isGenerating ? 'Setting up...' : 'Book Interview'}</span>
                      {!isGenerating && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Rating Summary */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-indigo-400" />
                        <span>Reviews</span>
                      </h3>
                      <span className="text-xs font-semibold text-amber-400 flex items-center space-x-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{avgOverall ? `${avgOverall} / 5 (${count} ${count === 1 ? 'review' : 'reviews'})` : 'No reviews yet'}</span>
                      </span>
                    </div>

                    {count > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          { label: 'Overall', value: avgOverall },
                          { label: 'Questions', value: avgQuality },
                          { label: 'Difficulty', value: avgDifficulty },
                          { label: 'Experience', value: avgExperience }
                        ].map((metric) => (
                          <div
                            key={metric.label}
                            className={`p-3 rounded-xl border text-center ${
                              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <span className="text-[10px] text-slate-400 block">{metric.label}</span>
                            <span className="text-sm font-black text-amber-400 font-mono">
                              {metric.value} ★
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reviews List */}
                  <div className="space-y-3">
                    {reviews.length === 0 ? (
                      <div
                        className={`p-6 rounded-2xl border border-dashed text-center space-y-1.5 ${
                          isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-300'
                        }`}
                      >
                        <p className="text-xs font-bold">No reviews for {selectedOption.domain} yet</p>
                        <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Finish this interview to add the first review.
                        </p>
                      </div>
                    ) : (
                      reviews.map((fb) => (
                        <div
                          key={fb.feedbackId}
                          className={`p-4 rounded-2xl border space-y-2 ${
                            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full bg-linear-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-[10px]">
                                {fb.userName.charAt(0)}
                              </div>
                              <span className="text-xs font-bold">{fb.userName}</span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(fb.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex items-center space-x-0.5 text-amber-400">
                              {Array.from({ length: fb.overallRating }).map((_, idx) => (
                                <Star key={idx} className="w-3 h-3 fill-amber-400" />
                              ))}
                            </div>
                          </div>

                          <div className="text-[11px] font-semibold text-indigo-400">
                            {fb.interviewTopic}
                          </div>

                          <p className={`text-xs leading-relaxed italic ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            &ldquo;{fb.writtenFeedback}&rdquo;
                          </p>

                          {fb.suggestions && (
                            <div
                              className={`p-2 rounded-xl border text-[11px] ${
                                isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>Tip: </strong>
                              <span>{fb.suggestions}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Booking Confirmation Modal */}
        {bookingConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div className={`w-full max-w-lg rounded-3xl p-7 border shadow-2xl space-y-6 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black tracking-tight">Ready to Start!</h2>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Your mock interview is ready.
                </p>
              </div>

              {/* Session Details Card */}
              <div className={`p-4 rounded-2xl border space-y-2.5 text-xs ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex justify-between">
                  <span className="text-slate-400">ID:</span>
                  <span className="font-mono font-bold text-indigo-400">{bookingConfirmation.sessionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Title:</span>
                  <span className="font-bold">{bookingConfirmation.config.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Topic:</span>
                  <span>{bookingConfirmation.config.domain} ({bookingConfirmation.config.difficulty})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Time:</span>
                  <span>{bookingConfirmation.config.durationMinutes} mins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Questions:</span>
                  <span className="font-bold text-emerald-400">{bookingConfirmation.questions.length} ready</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {bookingConfirmation.status}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => onStartSession(bookingConfirmation)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 cursor-pointer transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Now</span>
                </button>
                <button
                  onClick={() => setBookingConfirmation(null)}
                  className={`py-3 px-4 rounded-xl font-semibold text-xs border transition-colors cursor-pointer ${
                    isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Return to Booking
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <TargetManagerModal
        isOpen={targetModalOpen}
        onClose={() => setTargetModalOpen(false)}
        userId={currentUser.userId}
        theme={theme}
        onTargetsChanged={() => {
          const updatedTarget = StorageService.getActiveTarget(currentUser.userId);
          if (updatedTarget.focusDomains && updatedTarget.focusDomains.length > 0) {
            setDomain(updatedTarget.focusDomains[0]);
          }
          setHasSearched(false);
          setRefreshTick(t => t + 1);
        }}
      />
    </div>
  );
};
