import React, { useState, useEffect } from 'react';
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  GitBranch,
  Layers,
  RotateCcw
} from 'lucide-react';
import { CareerTarget } from '../types/hireboost';
import { getRoadmapForTarget, RoadmapMilestone, RoadmapPhase } from '../data/targetRoadmaps';
import { StorageService } from '../services/storage';

interface TargetRoadmapFlowchartProps {
  userId: string;
  activeTarget: CareerTarget;
  onPracticeTopicInterview: (milestone: RoadmapMilestone) => void;
  requestedStage?: { targetId: string; stepNumber: string | null; trigger: number };
  resetToRoleName?: string;
  onResetTarget?: () => void;
  theme: 'dark' | 'light';
}

export const TargetRoadmapFlowchart: React.FC<TargetRoadmapFlowchartProps> = ({
  userId,
  activeTarget,
  onPracticeTopicInterview,
  requestedStage,
  resetToRoleName,
  onResetTarget,
  theme
}) => {
  const isDark = theme === 'dark';
  const roadmap = getRoadmapForTarget(activeTarget);

  // Starts collapsed so clicking any stage opens its dropdown of topics & interviews
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [completedMilestones, setCompletedMilestones] = useState<string[]>(() =>
    StorageService.syncCompletedSessionsToRoadmap(userId, activeTarget)
  );

  useEffect(() => {
    setCompletedMilestones(StorageService.syncCompletedSessionsToRoadmap(userId, activeTarget));
    if (
      requestedStage &&
      requestedStage.trigger > 0 &&
      requestedStage.targetId === activeTarget.targetId &&
      requestedStage.stepNumber
    ) {
      setExpandedStep(requestedStage.stepNumber);
    } else {
      setExpandedStep(null);
    }
  }, [userId, activeTarget.targetId, requestedStage?.trigger, requestedStage?.targetId, requestedStage?.stepNumber]);

  const handleToggleStage = (stepNumber: string) => {
    setExpandedStep(prev => (prev === stepNumber ? null : stepNumber));
  };

  const expandedIndex = roadmap.phases.findIndex(p => p.stepNumber === expandedStep);
  const expandedPhase: RoadmapPhase | null =
    expandedIndex >= 0 ? roadmap.phases[expandedIndex] : null;

  const totalMilestones = roadmap.phases.reduce((sum, p) => sum + p.milestones.length, 0);
  const completedCount = roadmap.phases.reduce(
    (sum, p) => sum + p.milestones.filter(m => completedMilestones.includes(m.id)).length,
    0
  );
  const completionPct =
    totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;

  const nextStageStep = roadmap.phases.find(
    p => p.milestones.some(m => !completedMilestones.includes(m.id))
  )?.stepNumber;

  // Map each completed milestone ID to the latest evaluation overallScore
  const milestoneScores: Record<string, number> = {};
  const completedSessionsSorted = StorageService.getUserSessions(userId)
    .filter(s => s.status === 'Completed' && s.evaluationReportId)
    .sort(
      (a, b) =>
        new Date(a.endTime || a.createdAt).getTime() -
        new Date(b.endTime || b.createdAt).getTime()
    );
  const allRoadmapMilestones = roadmap.phases.flatMap(p => p.milestones);
  for (const sess of completedSessionsSorted) {
    const evalReport = sess.evaluationReportId
      ? StorageService.getEvaluation(sess.evaluationReportId)
      : undefined;
    if (!evalReport) continue;

    if (sess.config.roadmapMilestoneId) {
      milestoneScores[sess.config.roadmapMilestoneId] = evalReport.overallScore;
      continue;
    }

    const titleMatch = allRoadmapMilestones.find(
      m => m.interviewTitle === sess.config.title && completedMilestones.includes(m.id)
    );
    if (titleMatch) {
      milestoneScores[titleMatch.id] = evalReport.overallScore;
      continue;
    }

    const domainFallback = allRoadmapMilestones.find(
      m =>
        completedMilestones.includes(m.id) &&
        m.interviewDomain === sess.config.domain &&
        milestoneScores[m.id] === undefined
    );
    if (domainFallback) {
      milestoneScores[domainFallback.id] = evalReport.overallScore;
    }
  }

  const renderStageDropdownBody = (phase: RoadmapPhase) => {
    const phaseDone = phase.milestones.filter(m => completedMilestones.includes(m.id)).length;

    return (
      <div
        className={`rounded-xl border overflow-hidden transition-all duration-150 ${
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300 shadow-xs'
        }`}
      >
        {/* Section Bar inside Dropdown */}
        <div
          className={`px-4 sm:px-6 py-2.5 border-b flex items-center justify-between text-xs font-semibold ${
            isDark ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Layers className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <span>Topics &amp; Interviews</span>
          </div>
          <span className={`font-mono tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {phaseDone}/{phase.milestones.length} done
          </span>
        </div>

        {/* Dropdown List of Topics & Paired Interviews */}
        <div className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
          {phase.milestones.map((ms) => {
            const checked = completedMilestones.includes(ms.id);
            return (
              <div
                key={ms.id}
                className={`px-4 sm:px-6 py-4 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center transition-colors duration-200 ${
                  checked
                    ? isDark
                      ? 'bg-slate-950/75'
                      : 'bg-slate-100/75'
                    : ''
                }`}
              >
                {/* Topic to Cover (tick box is auto-updated only, not editable) */}
                <div className={`sm:col-span-5 flex items-start gap-3 transition-opacity ${checked ? 'opacity-55' : ''}`}>
                  <div
                    role="img"
                    aria-label={checked ? `${ms.topic} completed` : `${ms.topic} not completed`}
                    className={`mt-0.5 w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${
                      checked
                        ? isDark
                          ? 'bg-emerald-600/80 border-emerald-600/80 text-white'
                          : 'bg-emerald-600/85 border-emerald-600/85 text-white'
                        : isDark
                          ? 'border-slate-700 bg-slate-900/60'
                          : 'border-slate-300 bg-white'
                    }`}
                  >
                    {checked && <Check className="w-3 h-3" />}
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div
                      className={`text-sm font-semibold ${
                        checked
                          ? isDark ? 'text-slate-400' : 'text-slate-500'
                          : isDark ? 'text-slate-100' : 'text-slate-900'
                      }`}
                    >
                      {ms.topic}
                    </div>
                    <p
                      className={`text-xs leading-relaxed ${
                        checked
                          ? isDark ? 'text-slate-500' : 'text-slate-400'
                          : isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      {ms.subtopics}
                    </p>
                  </div>
                </div>

                {/* Paired Topic-Wise Interview & Action in Right Corner */}
                <div
                  className={`sm:col-span-7 flex items-center justify-between gap-3 sm:border-l sm:pl-5 ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}
                >
                  <div className={`space-y-0.5 min-w-0 transition-opacity ${checked ? 'opacity-55' : ''}`}>
                    <div
                      className={`text-sm font-semibold truncate ${
                        checked
                          ? isDark ? 'text-slate-400' : 'text-slate-500'
                          : 'text-indigo-500 dark:text-indigo-400'
                      }`}
                    >
                      {ms.interviewTitle}
                    </div>
                    <div
                      className={`text-xs tabular-nums ${
                        checked
                          ? isDark ? 'text-slate-500' : 'text-slate-400'
                          : isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {ms.interviewDomain} · {ms.interviewDifficulty} · {ms.interviewDuration} min
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    {checked && milestoneScores[ms.id] !== undefined && (
                      <span
                        title={`Last score: ${milestoneScores[ms.id]}% (Goal: ${activeTarget.targetScore}%)`}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold tabular-nums ${
                          milestoneScores[ms.id] >= activeTarget.targetScore
                            ? isDark
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-emerald-50 text-emerald-700'
                            : isDark
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {milestoneScores[ms.id]}%
                      </span>
                    )}

                    {checked && (
                      <span
                        className={`hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold ${
                          isDark
                            ? 'bg-emerald-500/10 text-emerald-400/80'
                            : 'bg-emerald-500/10 text-emerald-700/80'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>Done</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => onPracticeTopicInterview(ms)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                        checked
                          ? isDark
                            ? 'bg-slate-900 border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white'
                            : 'bg-white border-slate-300 hover:border-indigo-500 text-slate-700 hover:text-indigo-700'
                          : isDark
                            ? 'bg-slate-950 border-slate-700 hover:border-indigo-500 text-slate-200 hover:text-white'
                            : 'bg-slate-50 border-slate-200 hover:border-indigo-500 text-slate-800 hover:text-indigo-700'
                      }`}
                    >
                      {checked ? (
                        <>
                          <RotateCcw className="w-3 h-3" />
                          <span>Practice Again</span>
                        </>
                      ) : (
                        <>
                          <span>Practice</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section
      id="career-roadmap-section"
      aria-label="Target role preparation roadmap"
      className={`scroll-mt-16 rounded-2xl border p-4 sm:p-5 space-y-3.5 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold ${
                isDark ? 'text-indigo-400' : 'text-indigo-600'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Learning Path</span>
            </span>
            <span className={isDark ? 'text-slate-700' : 'text-slate-300'} aria-hidden="true">·</span>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">
              {roadmap.roleTitle}
            </h2>
            {resetToRoleName && onResetTarget && (
              <button
                type="button"
                onClick={onResetTarget}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border cursor-pointer transition-colors ${
                  isDark
                    ? 'border-slate-700 bg-slate-800/70 text-slate-300 hover:text-white hover:border-indigo-500'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-indigo-700 hover:border-indigo-400'
                }`}
              >
                Back to {resetToRoleName}
              </button>
            )}
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Click any stage to see topics and practice interviews.
          </p>
        </div>

        <div className="w-full md:w-56 space-y-1 shrink-0">
          <div className="flex items-center justify-between text-xs tabular-nums">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Topics done</span>
            <span className="font-semibold">
              {completedCount}/{totalMilestones} ({completionPct}%)
            </span>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <div
              className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sequential Stage Flow & Interactive Dropdowns */}
      <div
        className={`rounded-xl border p-3 sm:p-4 space-y-2.5 ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/70 border-slate-200'
        }`}
      >
        {/* Clean Unboxed Start -> Goal Track */}
        <div
          className={`flex flex-wrap items-center justify-between gap-2 text-[11px] pb-2 border-b ${
            isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Start: {roadmap.roleTitle}
            </span>
            <span aria-hidden="true">·</span>
            <span>4 Stages</span>
          </div>
          <div className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            Goal: {activeTarget.targetScore}% Score
          </div>
        </div>

        {/* Desktop Horizontal Sequential Flowchart (lg+) */}
        <div className="hidden lg:block space-y-2.5">
          <div className="flex items-stretch gap-2">
            {roadmap.phases.map((phase, idx) => {
              const isOpen = expandedStep === phase.stepNumber;
              const phaseDone = phase.milestones.filter(m => completedMilestones.includes(m.id)).length;
              const allDone = phaseDone === phase.milestones.length;
              const isUpNext = !allDone && phase.stepNumber === nextStageStep;

              return (
                <React.Fragment key={phase.stepNumber}>
                  <button
                    type="button"
                    onClick={() => handleToggleStage(phase.stepNumber)}
                    aria-expanded={isOpen}
                    className={`flex-1 min-w-0 rounded-xl border p-3 text-left transition-all duration-150 cursor-pointer flex flex-col justify-between gap-2 ${
                      isOpen
                        ? isDark
                          ? 'bg-indigo-950/80 border-indigo-400 ring-2 ring-indigo-500/25 text-white'
                          : 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20 text-slate-950'
                        : allDone
                          ? isDark
                            ? 'bg-slate-900/40 border-slate-800/70 text-slate-500 opacity-60 hover:opacity-90'
                            : 'bg-slate-100/75 border-slate-200/80 text-slate-400 opacity-65 hover:opacity-95'
                          : isUpNext
                            ? isDark
                              ? 'bg-indigo-950/25 border-indigo-500/50 hover:border-indigo-400 text-slate-100'
                              : 'bg-indigo-50/40 border-indigo-300 hover:border-indigo-500 text-slate-900'
                            : isDark
                              ? 'bg-slate-900 border-slate-800 hover:border-indigo-500/60 text-slate-200'
                              : 'bg-white border-slate-200 hover:border-indigo-400 text-slate-800'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between gap-1 text-[11px] font-mono tabular-nums">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            isOpen
                              ? isDark ? 'text-indigo-300' : 'text-indigo-700'
                              : allDone
                                ? isDark ? 'text-emerald-500/75' : 'text-emerald-600/80'
                                : isDark ? 'text-indigo-400' : 'text-indigo-600'
                          }`}
                        >
                          {allDone && (
                            <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                          <span>Stage {phase.stepNumber}</span>
                        </span>
                        {isUpNext && !isOpen ? (
                          <span className="font-sans text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                            Up Next
                          </span>
                        ) : (
                          <span className={allDone ? 'opacity-70' : isDark ? 'text-slate-400' : 'text-slate-500'}>
                            {phase.estimatedWeeks}
                          </span>
                        )}
                      </div>
                      <div className={`text-sm font-bold leading-snug truncate ${allDone && !isOpen ? 'opacity-80' : ''}`}>
                        {phase.shortLabel}
                      </div>
                      <div
                        className={`text-[11px] truncate ${
                          isOpen
                            ? isDark ? 'text-indigo-200/80' : 'text-indigo-800/80'
                            : allDone
                              ? 'opacity-70'
                              : isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {phase.recommendedDomain}
                      </div>
                    </div>

                    <div
                      className={`pt-1.5 border-t flex items-center justify-between text-[11px] font-mono tabular-nums ${
                        isOpen
                          ? isDark ? 'border-indigo-500/30' : 'border-indigo-200'
                          : isDark ? 'border-slate-800' : 'border-slate-100'
                      }`}
                    >
                      <span
                        className={`flex items-center gap-1 font-sans font-semibold ${
                          isOpen
                            ? isDark ? 'text-indigo-300' : 'text-indigo-700'
                            : allDone
                              ? 'opacity-75'
                              : isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        <span>{phase.milestones.length} topics</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-150 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </span>
                      <span className={`font-semibold inline-flex items-center gap-1 ${allDone ? 'text-emerald-600/80 dark:text-emerald-400/80' : ''}`}>
                        {allDone && <Check className="w-3 h-3" />}
                        {phaseDone}/{phase.milestones.length}
                      </span>
                    </div>
                  </button>

                  {/* Directional Connector Arrow */}
                  {idx < roadmap.phases.length - 1 && (
                    <div className="flex items-center justify-center shrink-0 px-0.5" aria-hidden="true">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        className={
                          isOpen || roadmap.phases[idx + 1]?.stepNumber === expandedStep
                            ? isDark ? 'text-indigo-400' : 'text-indigo-600'
                            : isDark ? 'text-slate-600' : 'text-slate-400'
                        }
                      >
                        <line
                          x1="2"
                          y1="12"
                          x2="18"
                          y2="12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <polyline
                          points="13,7 19,12 13,17"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Desktop Stage Dropdown Panel anchored below the clicked stage */}
          {expandedPhase && (
            <div className="relative pt-2">
              <div
                aria-hidden="true"
                className={`absolute top-0.5 w-3 h-3 rotate-45 border-l border-t -translate-x-1/2 ${
                  isDark ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-300'
                }`}
                style={{ left: `${[11, 37, 63, 89][expandedIndex] ?? 50}%` }}
              />
              {renderStageDropdownBody(expandedPhase)}
            </div>
          )}
        </div>

        {/* Tablet & Mobile Vertical Flowchart with Inline Stage Dropdowns (<lg) */}
        <div className="lg:hidden space-y-2">
          {roadmap.phases.map((phase, idx) => {
            const isOpen = expandedStep === phase.stepNumber;
            const phaseDone = phase.milestones.filter(m => completedMilestones.includes(m.id)).length;
            const allDone = phaseDone === phase.milestones.length;
            const isUpNext = !allDone && phase.stepNumber === nextStageStep;

            return (
              <React.Fragment key={phase.stepNumber}>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStage(phase.stepNumber)}
                    aria-expanded={isOpen}
                    className={`w-full rounded-xl border p-4 text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isOpen
                        ? isDark
                          ? 'bg-indigo-950/80 border-indigo-400 text-white'
                          : 'bg-indigo-50 border-indigo-600 text-slate-950'
                        : allDone
                          ? isDark
                            ? 'bg-slate-900/40 border-slate-800/70 text-slate-500 opacity-60 hover:opacity-90'
                            : 'bg-slate-100/75 border-slate-200/80 text-slate-400 opacity-65 hover:opacity-95'
                          : isUpNext
                            ? isDark
                              ? 'bg-indigo-950/25 border-indigo-500/50 text-slate-100'
                              : 'bg-indigo-50/40 border-indigo-300 text-slate-900'
                            : isDark
                              ? 'bg-slate-900 border-slate-800 text-slate-200'
                              : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className={`text-[11px] font-mono tabular-nums font-semibold inline-flex items-center gap-1.5 ${
                        allDone && !isOpen
                          ? 'text-emerald-600/80 dark:text-emerald-400/80'
                          : 'text-indigo-500 dark:text-indigo-400'
                      }`}>
                        {allDone && <Check className="w-3 h-3" />}
                        <span>Stage {phase.stepNumber} · {phase.estimatedWeeks}</span>
                        {isUpNext && !isOpen && (
                          <span className="font-sans text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                            Up Next
                          </span>
                        )}
                      </div>
                      <div className={`text-sm font-bold truncate mt-0.5 ${allDone && !isOpen ? 'opacity-80' : ''}`}>
                        {phase.shortLabel}
                      </div>
                      <div className={`text-xs truncate ${allDone && !isOpen ? 'opacity-70' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {phase.recommendedDomain} · {phase.milestones.length} topic interviews
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-mono font-semibold tabular-nums inline-flex items-center gap-1 ${
                        allDone ? 'text-emerald-600/80 dark:text-emerald-400/80' : ''
                      }`}>
                        {allDone && <Check className="w-3.5 h-3.5" />}
                        {phaseDone}/{phase.milestones.length}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-150 ${
                          isOpen ? 'rotate-180 text-indigo-400' : isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      />
                    </div>
                  </button>

                  {isOpen && renderStageDropdownBody(phase)}
                </div>

                {idx < roadmap.phases.length - 1 && (
                  <div className="flex justify-center py-0.5" aria-hidden="true">
                    <ArrowDown className={`w-4 h-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

      </div>
    </section>
  );
};
