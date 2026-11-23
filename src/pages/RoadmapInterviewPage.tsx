import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
  MessageSquare,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Target
} from 'lucide-react';
import { StorageService } from '../services/storage';
import {
  DifficultyLevel,
  InterviewMode,
  InterviewQuestionItem,
  InterviewSession,
  RoundFormat,
  User
} from '../types/hireboost';
import { getRoadmapForTarget, RoadmapMilestone, RoadmapPhase } from '../data/targetRoadmaps';
import {
  getDefaultRoundFormat,
  getStoredCodingTimeLimits,
  getStoredVoiceTimeLimits,
  getVoiceTimeLimitSeconds,
  saveStoredCodingTimeLimits,
  saveStoredVoiceTimeLimits
} from '../config/interviewConfig';
import { selectCodingProblemsForConfig } from '../data/codingProblems';

interface RoadmapInterviewPageProps {
  currentUser: User;
  targetId?: string;
  milestoneId?: string;
  onStartSession: (session: InterviewSession) => void;
  onNavigate: (view: string, extraParam?: string) => void;
  theme: 'dark' | 'light';
}

export const RoadmapInterviewPage: React.FC<RoadmapInterviewPageProps> = ({
  currentUser,
  targetId,
  milestoneId,
  onStartSession,
  onNavigate,
  theme
}) => {
  const isDark = theme === 'dark';
  const profile = StorageService.getUserProfile(currentUser.userId);
  const target = StorageService.resolveTargetById(currentUser.userId, targetId);

  const roadmap = useMemo(() => getRoadmapForTarget(target), [target]);

  const resolved = useMemo<{ phase: RoadmapPhase; milestone: RoadmapMilestone } | null>(() => {
    for (const phase of roadmap.phases) {
      const found = phase.milestones.find(m => m.id === milestoneId);
      if (found) {
        return { phase, milestone: found };
      }
    }
    const fallbackPhase = roadmap.phases[0];
    const fallbackMilestone = fallbackPhase?.milestones[0];
    return fallbackPhase && fallbackMilestone
      ? { phase: fallbackPhase, milestone: fallbackMilestone }
      : null;
  }, [roadmap, milestoneId]);

  const milestone = resolved?.milestone;
  const phase = resolved?.phase;

  const defaultMode: InterviewMode =
    milestone?.interviewDomain === 'HR Interview' ||
    milestone?.interviewDomain === 'Behavioral Interview'
      ? 'HR'
      : 'Technical';

  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    milestone?.interviewDifficulty || 'Medium'
  );
  const [mode, setMode] = useState<InterviewMode>(defaultMode);
  const [roundFormat, setRoundFormat] = useState<RoundFormat>(() =>
    getDefaultRoundFormat(milestone?.interviewDomain || 'Data Structures and Algorithms', defaultMode)
  );
  const [codingTimeLimits, setCodingTimeLimits] = useState<Record<DifficultyLevel, number>>(() =>
    getStoredCodingTimeLimits()
  );
  const [voiceTimeLimits, setVoiceTimeLimits] = useState<Record<DifficultyLevel, number>>(() =>
    getStoredVoiceTimeLimits()
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(
    milestone?.interviewDuration || 15
  );
  const [isStarting, setIsStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/interview/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.codingTimeLimitsMinutes) {
          setCodingTimeLimits(saveStoredCodingTimeLimits(data.codingTimeLimitsMinutes));
        }
        if (data?.voiceTimeLimitsMinutes) {
          setVoiceTimeLimits(saveStoredVoiceTimeLimits(data.voiceTimeLimitsMinutes));
        }
      })
      .catch(() => {});
  }, []);

  const completedIds = useMemo(
    () => StorageService.syncCompletedSessionsToRoadmap(currentUser.userId, target),
    [currentUser.userId, target]
  );
  const isCompleted = milestone ? completedIds.includes(milestone.id) : false;

  const pastAttempts = useMemo(() => {
    if (!milestone) return [];
    return StorageService.getUserSessions(currentUser.userId).filter(
      s =>
        s.status === 'Completed' &&
        (s.config.roadmapMilestoneId === milestone.id ||
          (s.config.domain === milestone.interviewDomain &&
            s.config.title === milestone.interviewTitle))
    );
  }, [currentUser.userId, milestone]);

  const reviews = useMemo(() => {
    if (!milestone) return [];
    return StorageService.getReviewsForInterview(
      milestone.interviewDomain,
      milestone.interviewTitle
    ).slice(0, 3);
  }, [milestone]);

  if (!milestone || !phase) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer mb-4 ${
            isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>
        <div
          className={`rounded-2xl border p-6 text-center ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <p className="text-sm font-semibold">Interview not found.</p>
        </div>
      </div>
    );
  }

  const handleStartInterview = async () => {
    setIsStarting(true);
    setErrorMsg(null);

    try {
      const effectiveFormat: RoundFormat = mode === 'HR' ? 'voice_only' : roundFormat;
      const savedConfig = StorageService.configureSession({
        domain: milestone.interviewDomain,
        customTopic: milestone.topic,
        difficulty,
        mode,
        roundFormat: effectiveFormat,
        codingTimeLimits,
        voiceTimeLimits,
        experienceLevel: profile.experience || 'Fresher',
        durationMinutes,
        questionSetType: 'AI-Generated',
        title: milestone.interviewTitle,
        description: `${milestone.topic} — ${milestone.subtopics}`,
        targetId: target.targetId,
        targetRole: target.roleName,
        roadmapMilestoneId: milestone.id,
        roadmapTargetId: target.targetId
      });

      let questions: InterviewQuestionItem[] = [];

      try {
        const response = await fetch('/api/ai/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: milestone.interviewDomain,
            difficulty,
            mode,
            roundFormat: effectiveFormat,
            codingTimeLimits,
            voiceTimeLimits,
            count: 3,
            customTopic: `${milestone.topic} (${milestone.subtopics}). Focus prompt: ${milestone.samplePrompt}`
          })
        });
        const data = await response.json();
        if (data && data.questions && data.questions.length > 0) {
          questions = data.questions.map((q: any, i: number) => ({
            ...q,
            questionId: q.questionId || `q_${Date.now()}_${i}`,
            questionText: q.questionText,
            questionType: q.questionType || 'voice',
            difficulty: q.difficulty || difficulty,
            keyPoints: q.keyPoints
          }));
        }
      } catch {
        // Fallback below if AI endpoint is unavailable
      }

      if (questions.length === 0) {
        const voiceLimitSec = getVoiceTimeLimitSeconds(difficulty, voiceTimeLimits);
        const voiceFb: InterviewQuestionItem[] =
          effectiveFormat === 'coding_only'
            ? []
            : [
                {
                  questionId: `q_rm_${Date.now()}_1`,
                  questionType: 'voice',
                  difficulty,
                  timeLimitSeconds: voiceLimitSec,
                  questionText: milestone.samplePrompt,
                  keyPoints: ['Core concept', 'Clarity', 'Trade-offs']
                },
                {
                  questionId: `q_rm_${Date.now()}_2`,
                  questionType: 'voice',
                  difficulty,
                  timeLimitSeconds: voiceLimitSec,
                  questionText: `Explain the key concepts behind ${milestone.topic} (${milestone.subtopics}) and when you would use them.`,
                  keyPoints: ['Practical use case', 'Complexity / constraints', 'Edge cases']
                }
              ];
        const codingFb: InterviewQuestionItem[] =
          effectiveFormat === 'voice_only'
            ? []
            : selectCodingProblemsForConfig(
                milestone.interviewDomain,
                difficulty,
                effectiveFormat === 'coding_only' ? 2 : 1,
                codingTimeLimits
              );
        questions = [...voiceFb, ...codingFb];
      }

      const session = StorageService.createSession(currentUser.userId, savedConfig, questions);
      onStartSession(session);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not start the interview. Please try again.');
      setIsStarting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Top Back Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors ${
            isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>

        <div
          className={`flex items-center gap-2 text-xs ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          <span>{roadmap.roleTitle}</span>
          <span aria-hidden="true">·</span>
          <span className="font-semibold text-indigo-500 dark:text-indigo-400">
            Stage {phase.stepNumber}
          </span>
        </div>
      </div>

      {/* Main Interview Detail Card */}
      <section
        className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="p-5 sm:p-6 space-y-5">
          {/* Badges & Title */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                  isDark
                    ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                }`}
              >
                Stage {phase.stepNumber}: {phase.shortLabel}
              </span>

              {isCompleted && (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                    isDark
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Done</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {milestone.interviewTitle}
            </h1>

            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <span className="font-semibold">{milestone.topic}:</span> {milestone.subtopics}
            </p>
          </div>

          {/* Key Metadata Strip */}
          <div
            className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div>
              <span className={`text-[11px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Topic
              </span>
              <span className="text-xs font-semibold flex items-center gap-1.5 mt-0.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{milestone.interviewDomain}</span>
              </span>
            </div>

            <div>
              <span className={`text-[11px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Difficulty
              </span>
              <span className="text-xs font-semibold flex items-center gap-1.5 mt-0.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{difficulty}</span>
              </span>
            </div>

            <div>
              <span className={`text-[11px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Time
              </span>
              <span className="text-xs font-semibold flex items-center gap-1.5 mt-0.5 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{durationMinutes} min</span>
              </span>
            </div>

            <div>
              <span className={`text-[11px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Goal
              </span>
              <span className="text-xs font-semibold flex items-center gap-1.5 mt-0.5 tabular-nums">
                <Target className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{target.targetScore}% Score</span>
              </span>
            </div>
          </div>

          {/* Sample Question Preview */}
          <div
            className={`rounded-xl border p-4 space-y-1.5 ${
              isDark
                ? 'bg-indigo-950/25 border-indigo-500/30'
                : 'bg-indigo-50/70 border-indigo-200'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 dark:text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sample Question</span>
            </div>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              &ldquo;{milestone.samplePrompt}&rdquo;
            </p>
          </div>

          {/* Round Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                className={`block text-xs font-semibold mb-1.5 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Difficulty
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                      difficulty === lvl
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : isDark
                          ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                className={`block text-xs font-semibold mb-1.5 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Type
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Technical', 'HR', 'Mixed'] as InterviewMode[]).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                      mode === m
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : isDark
                          ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                className={`block text-xs font-semibold mb-1.5 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Length
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[10, 15, 20].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`py-2 rounded-lg text-xs font-semibold border tabular-nums cursor-pointer transition-colors ${
                      durationMinutes === mins
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : isDark
                          ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {mode !== 'HR' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Format:
                </span>
                {[
                  { value: 'mixed_coding_voice' as RoundFormat, label: 'Voice + Timed Coding' },
                  { value: 'coding_only' as RoundFormat, label: 'Timed Coding Only' },
                  { value: 'voice_only' as RoundFormat, label: 'Voice Only' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRoundFormat(opt.value)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors ${
                      roundFormat === opt.value
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : isDark
                          ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {roundFormat !== 'voice_only' && (
                <span className="text-[11px] font-mono text-indigo-400">
                  Coding Limits: {difficulty} = {codingTimeLimits[difficulty]}m
                </span>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-500 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Start CTA Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isCompleted
                ? 'You finished this topic. Practice again to improve your score.'
                : 'Finish this round to tick this topic as done.'}
            </p>

            <button
              type="button"
              disabled={isStarting}
              onClick={handleStartInterview}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white flex items-center justify-center gap-2 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              {isStarting ? (
                <span>Starting...</span>
              ) : isCompleted ? (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Practice Again</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Start Interview</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Past Attempts for this Topic */}
      {pastAttempts.length > 0 && (
        <section
          className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <h2 className="text-sm font-bold tracking-tight">Past Rounds ({pastAttempts.length})</h2>
          <div className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
            {pastAttempts.slice(0, 3).map(sess => {
              const report = sess.evaluationReportId
                ? StorageService.getEvaluation(sess.evaluationReportId)
                : undefined;
              return (
                <div
                  key={sess.sessionId}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-semibold">{sess.config.title}</div>
                    <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                      {new Date(sess.endTime || sess.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}{' '}
                      · {sess.config.difficulty} · {sess.config.durationMinutes} min
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {report && (
                      <span className="font-mono font-bold tabular-nums text-emerald-500">
                        {report.overallScore}%
                      </span>
                    )}
                    {sess.evaluationReportId && (
                      <button
                        type="button"
                        onClick={() => onNavigate('performance_evaluation', sess.evaluationReportId)}
                        className={`px-2.5 py-1 rounded-lg border font-semibold cursor-pointer ${
                          isDark
                            ? 'border-slate-700 hover:border-indigo-500 text-slate-200'
                            : 'border-slate-200 hover:border-indigo-500 text-slate-700'
                        }`}
                      >
                        Report
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Peer Reviews */}
      {reviews.length > 0 && (
        <section
          className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold tracking-tight">Recent Reviews</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {reviews.map(rev => (
              <div
                key={rev.feedbackId}
                className={`rounded-xl border p-3 space-y-1.5 text-xs ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold truncate">{rev.userName}</span>
                  <span className="inline-flex items-center gap-0.5 text-amber-500 font-bold tabular-nums">
                    <Star className="w-3 h-3 fill-amber-500" />
                    {rev.overallRating}
                  </span>
                </div>
                <p className={`line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {rev.writtenFeedback}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
