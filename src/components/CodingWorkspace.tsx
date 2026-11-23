import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Code2,
  Loader2,
  Lock,
  Play,
  RotateCcw,
  Send,
  Terminal,
  XCircle
} from 'lucide-react';
import {
  CodingExecutionResult,
  CodingLanguage,
  CodingProblemEvaluation,
  CodingSubmissionType,
  CodingTestCaseResult,
  InterviewQuestionItem
} from '../types/hireboost';

export interface CodingSubmissionOverlay {
  submissionType: CodingSubmissionType;
  completedWithinTime: boolean;
  executionResults?: CodingExecutionResult;
  testCaseResults?: CodingTestCaseResult[];
  evaluationScore?: number;
  codingEvaluation?: CodingProblemEvaluation;
  autoAdvanceSecondsLeft?: number;
}

interface CodingWorkspaceProps {
  question: InterviewQuestionItem;
  questionIndex: number;
  totalQuestions: number;
  code: string;
  language: CodingLanguage;
  remainingSeconds: number;
  assignedTimeLimitSeconds: number;
  isLocked: boolean;
  isRunningTests: boolean;
  isSubmitting: boolean;
  activeWarningThreshold: 120 | 60 | 30 | null;
  runResult: {
    executionResults: CodingExecutionResult;
    testCaseResults: CodingTestCaseResult[];
  } | null;
  runError: string | null;
  submissionResult: CodingSubmissionOverlay | null;
  onCodeChange: (code: string) => void;
  onLanguageChange: (language: CodingLanguage) => void;
  onResetCode: () => void;
  onRunCode: () => void;
  onSubmitCode: () => void;
}

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const CodingWorkspace: React.FC<CodingWorkspaceProps> = ({
  question,
  questionIndex,
  totalQuestions,
  code,
  language,
  remainingSeconds,
  assignedTimeLimitSeconds,
  isLocked,
  isRunningTests,
  isSubmitting,
  activeWarningThreshold,
  runResult,
  runError,
  submissionResult,
  onCodeChange,
  onLanguageChange,
  onResetCode,
  onRunCode,
  onSubmitCode
}) => {
  const difficulty = question.difficulty || 'Medium';
  const progressPct =
    assignedTimeLimitSeconds > 0
      ? Math.max(0, Math.min(100, (remainingSeconds / assignedTimeLimitSeconds) * 100))
      : 0;

  const timerTone =
    remainingSeconds <= 30
      ? 'bg-rose-500/20 border-rose-500/60 text-rose-200 animate-pulse'
      : remainingSeconds <= 60
        ? 'bg-orange-500/20 border-orange-500/50 text-orange-200'
        : remainingSeconds <= 120
          ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
          : 'bg-slate-800 border-slate-700 text-slate-100';

  const difficultyTone =
    difficulty === 'Easy'
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      : difficulty === 'Hard'
        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
        : 'bg-amber-500/15 text-amber-300 border-amber-500/30';

  const displayedResults = submissionResult?.testCaseResults || runResult?.testCaseResults || [];
  const displayedExec = submissionResult?.executionResults || runResult?.executionResults || null;
  const lineCount = Math.max(12, code.split('\n').length);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isLocked || isSubmitting) return;
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const indent = language === 'python' ? '    ' : '  ';
      const next = code.slice(0, start) + indent + code.slice(end);
      onCodeChange(next);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + indent.length;
      });
    }
  };

  return (
    <div className="flex flex-col gap-3 flex-1">
      {/* Warning Banners at 2m, 1m, 30s */}
      {!submissionResult && activeWarningThreshold === 120 && (
        <div className="px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>2 minutes remaining for this {difficulty} problem. Verify edge cases and run your tests.</span>
          </div>
          <span className="font-mono font-bold tabular-nums">{formatCountdown(remainingSeconds)}</span>
        </div>
      )}

      {!submissionResult && activeWarningThreshold === 60 && (
        <div className="px-4 py-2.5 rounded-xl bg-orange-500/20 border border-orange-500/50 text-orange-200 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
            <span>1 minute remaining! Submit manually when ready, or the editor will auto-submit at 00:00.</span>
          </div>
          <span className="font-mono font-bold tabular-nums">{formatCountdown(remainingSeconds)}</span>
        </div>
      )}

      {!submissionResult && activeWarningThreshold === 30 && (
        <div className="px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/60 text-rose-100 text-xs font-bold flex items-center justify-between gap-2 animate-pulse">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-400 shrink-0" />
            <span>30 seconds remaining! Your current code will be auto-submitted and locked at 00:00.</span>
          </div>
          <span className="font-mono font-bold tabular-nums">{formatCountdown(remainingSeconds)}</span>
        </div>
      )}

      {/* Submission / Auto-Submit Result Banner */}
      {submissionResult && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            submissionResult.submissionType === 'auto'
              ? 'bg-amber-950/50 border-amber-500/50 text-amber-100'
              : 'bg-emerald-950/50 border-emerald-500/50 text-emerald-100'
          }`}
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                  submissionResult.submissionType === 'auto'
                    ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                    : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                }`}
              >
                {submissionResult.submissionType === 'auto' ? 'Auto Submission (Time Expired)' : 'Manual Submission'}
              </span>
              {typeof submissionResult.evaluationScore === 'number' && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 text-[11px] font-mono font-bold">
                  Score: {submissionResult.evaluationScore}/100
                </span>
              )}
              {submissionResult.executionResults && (
                <span className="text-xs font-semibold text-slate-200">
                  {submissionResult.executionResults.passedCount}/{submissionResult.executionResults.totalCount} tests passed
                </span>
              )}
            </div>
            {submissionResult.codingEvaluation?.feedback && (
              <p className="text-xs text-slate-200 leading-relaxed">
                {submissionResult.codingEvaluation.feedback}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-bold shrink-0 text-indigo-200">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>
              {questionIndex + 1 < totalQuestions
                ? `Advancing to next problem${
                    typeof submissionResult.autoAdvanceSecondsLeft === 'number'
                      ? ` (${submissionResult.autoAdvanceSecondsLeft}s)`
                      : ''
                  }...`
                : 'Finalizing interview evaluation...'}
            </span>
          </div>
        </div>
      )}

      {/* Split Coding IDE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Left Pane: Problem Statement, Examples, Constraints & Test Output */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-900/95">
            <div className="flex items-center gap-2 min-w-0">
              <Code2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs font-bold text-white truncate">
                {question.title || `Coding Problem ${questionIndex + 1}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${difficultyTone}`}>
                {difficulty}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                {Math.round(assignedTimeLimitSeconds / 60)}m limit
              </span>
            </div>
          </div>

          <div className="p-4 overflow-y-auto space-y-4 text-xs max-h-[540px]">
            <p className="text-sm text-slate-100 leading-relaxed font-medium whitespace-pre-line">
              {question.questionText}
            </p>

            {question.examples && question.examples.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block">
                  Examples
                </span>
                {question.examples.map((ex, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1">
                    <div>
                      <span className="text-slate-400">Input: </span>
                      <span className="text-slate-100">{ex.input}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Output: </span>
                      <span className="text-emerald-300">{ex.output}</span>
                    </div>
                    {ex.explanation && (
                      <div className="text-slate-400 font-sans pt-0.5">{ex.explanation}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {question.constraints && question.constraints.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Constraints
                </span>
                <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside font-mono">
                  {question.constraints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Execution & Test Case Results */}
            {(displayedExec || runError) && (
              <div className="pt-3 border-t border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Execution Results</span>
                  </div>
                  {displayedExec && (
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        displayedExec.status === 'Passed'
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          : displayedExec.status === 'Timeout'
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                            : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                      }`}
                    >
                      {displayedExec.status} • {displayedExec.passedCount}/{displayedExec.totalCount}
                      {typeof displayedExec.executionTimeMs === 'number'
                        ? ` (${displayedExec.executionTimeMs}ms)`
                        : ''}
                    </span>
                  )}
                </div>

                {runError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-[11px]">
                    {runError}
                  </div>
                )}

                {displayedExec?.stderr && (
                  <pre className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-200 font-mono text-[11px] whitespace-pre-wrap overflow-x-auto">
                    {displayedExec.stderr}
                  </pre>
                )}

                {displayedExec?.stdout && (
                  <pre className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] whitespace-pre-wrap overflow-x-auto">
                    stdout: {displayedExec.stdout}
                  </pre>
                )}

                {displayedResults.length > 0 && (
                  <div className="space-y-1.5">
                    {displayedResults.map((tc, idx) => (
                      <div
                        key={tc.id || idx}
                        className={`p-2.5 rounded-xl border font-mono text-[11px] space-y-1 ${
                          tc.passed
                            ? 'bg-emerald-950/25 border-emerald-500/30'
                            : 'bg-rose-950/30 border-rose-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between font-sans font-bold">
                          <span className="flex items-center gap-1">
                            {tc.passed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            )}
                            <span>Case {idx + 1}</span>
                          </span>
                          <span className={tc.passed ? 'text-emerald-300' : 'text-rose-300'}>
                            {tc.passed ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                        <div className="text-slate-400 truncate">Args: {tc.input}</div>
                        <div className="flex flex-wrap gap-x-3">
                          <span>
                            <span className="text-slate-400">Expected: </span>
                            <span className="text-emerald-300">{tc.expectedOutput}</span>
                          </span>
                          <span>
                            <span className="text-slate-400">Actual: </span>
                            <span className={tc.passed ? 'text-emerald-200' : 'text-rose-200'}>
                              {tc.actualOutput}
                            </span>
                          </span>
                        </div>
                        {tc.error && <div className="text-rose-300">{tc.error}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Locked/Timed Code Editor */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col overflow-hidden">
          {/* Editor Top Bar */}
          <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-900/95">
            <div className="flex items-center gap-2">
              <select
                aria-label="Coding Language"
                disabled={isLocked || isSubmitting}
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as CodingLanguage)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-semibold text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 cursor-pointer"
              >
                <option value="javascript">JavaScript (Node)</option>
                <option value="python">Python 3</option>
              </select>

              <button
                type="button"
                disabled={isLocked || isSubmitting}
                onClick={onResetCode}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-slate-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Problem Countdown Clock */}
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:block w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    remainingSeconds <= 30
                      ? 'bg-rose-500'
                      : remainingSeconds <= 60
                        ? 'bg-orange-400'
                        : remainingSeconds <= 120
                          ? 'bg-amber-400'
                          : 'bg-indigo-500'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-mono text-xs font-bold tabular-nums ${timerTone}`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{formatCountdown(remainingSeconds)}</span>
              </div>
            </div>
          </div>

          {/* Code Editor Surface */}
          <div className="relative flex-1 flex bg-slate-950 min-h-[340px]">
            <div
              aria-hidden="true"
              className="py-3 px-2.5 text-right font-mono text-xs leading-6 text-slate-600 bg-slate-950 border-r border-slate-800/80 select-none min-w-[38px]"
            >
              {Array.from({ length: lineCount }).map((_, idx) => (
                <div key={idx}>{idx + 1}</div>
              ))}
            </div>

            <textarea
              value={code}
              readOnly={isLocked || isSubmitting}
              onChange={(e) => onCodeChange(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              placeholder={`Write your ${language === 'python' ? 'Python' : 'JavaScript'} solution here...`}
              className={`flex-1 w-full p-3 bg-slate-950 text-slate-100 font-mono text-xs sm:text-sm leading-6 resize-none focus:outline-hidden select-text ${
                isLocked ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            />

            {isLocked && (
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-900/95 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 shadow-md">
                <Lock className="w-3 h-3" />
                <span>Editor Locked</span>
              </div>
            )}
          </div>

          {/* Editor Action Footer */}
          <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/95 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400">
              {isLocked
                ? 'Submission finalized. Editor is read-only.'
                : 'Tab inserts indentation. Code auto-saves and auto-submits at 00:00.'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isLocked || isRunningTests || isSubmitting}
                onClick={onRunCode}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isRunningTests ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{isRunningTests ? 'Running...' : 'Run Tests'}</span>
              </button>

              <button
                type="button"
                disabled={isLocked || isSubmitting}
                onClick={onSubmitCode}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{isSubmitting ? 'Submitting...' : 'Submit Code'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
