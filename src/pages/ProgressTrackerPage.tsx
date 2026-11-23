import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart2,
  Target,
  ArrowUpRight,
  Plus,
  Edit3,
  Layers,
  CheckCircle2,
  Calendar,
  Sparkles,
  SlidersHorizontal,
  History,
  ArrowUpDown,
  FileText,
  Award,
  Search
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { User, CareerTarget, TargetAccentColor, InterviewSession } from '../types/hireboost';
import { TargetManagerModal } from '../components/TargetManagerModal';

interface ProgressTrackerPageProps {
  currentUser: User;
  onNavigate: (view: string, extraParam?: string) => void;
  theme: 'dark' | 'light';
}

type HistorySortMode =
  | 'target_asc'
  | 'target_desc'
  | 'date_desc'
  | 'date_asc'
  | 'score_desc'
  | 'score_asc';

const ACCENT_STYLE_MAP: Record<
  TargetAccentColor,
  { badge: string; bar: string; ring: string }
> = {
  indigo: {
    badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    bar: 'from-indigo-500 to-purple-500',
    ring: 'border-indigo-500/50'
  },
  emerald: {
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    bar: 'from-emerald-500 to-teal-400',
    ring: 'border-emerald-500/50'
  },
  purple: {
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    bar: 'from-purple-500 to-pink-500',
    ring: 'border-purple-500/50'
  },
  cyan: {
    badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    bar: 'from-cyan-500 to-blue-500',
    ring: 'border-cyan-500/50'
  },
  amber: {
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    bar: 'from-amber-500 to-orange-400',
    ring: 'border-amber-500/50'
  },
  pink: {
    badge: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    bar: 'from-pink-500 to-rose-400',
    ring: 'border-pink-500/50'
  }
};

export const ProgressTrackerPage: React.FC<ProgressTrackerPageProps> = ({
  currentUser,
  onNavigate,
  theme
}) => {
  const isDark = theme === 'dark';
  const [, setRefreshTick] = useState(0);

  // History filter & sort state (defaults to sorting by Target Role)
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyTargetFilter, setHistoryTargetFilter] = useState<string>('All');
  const [historySortBy, setHistorySortBy] = useState<HistorySortMode>('target_asc');

  // Target-based analysis state
  const [scopeMode, setScopeMode] = useState<'active_target' | 'all_sessions'>('active_target');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editTarget, setEditTarget] = useState<CareerTarget | null>(null);

  const tracker = StorageService.getProgressTracker(currentUser.userId);
  const profile = StorageService.getUserProfile(currentUser.userId);
  const activeTarget = StorageService.getActiveTarget(currentUser.userId);
  const targets = StorageService.getUserTargets(currentUser.userId);
  const targetSummaries = StorageService.getTargetProgressSummaries(currentUser.userId);
  const allSessions = StorageService.getUserSessions(currentUser.userId);
  const evaluations = StorageService.getAllEvaluations();

  const activeSummary =
    targetSummaries.find(s => s.target.targetId === activeTarget.targetId) ||
    targetSummaries[0];

  const handleSelectTarget = (targetId: string) => {
    StorageService.setActiveTarget(currentUser.userId, targetId);
    setScopeMode('active_target');
    setRefreshTick(t => t + 1);
  };

  const openCreateTarget = () => {
    setEditTarget(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const openManageTargets = () => {
    setEditTarget(null);
    setModalMode('list');
    setModalOpen(true);
  };

  const openEditTarget = (target: CareerTarget) => {
    setEditTarget(target);
    setModalMode('edit');
    setModalOpen(true);
  };

  // Resolve target role labels for any session
  const getSessionTargetInfo = (sess: InterviewSession) => {
    const explicitTarget = sess.config.targetId
      ? targets.find(t => t.targetId === sess.config.targetId)
      : undefined;
    const matchedTargets = targets.filter(t => StorageService.doesSessionMatchTarget(sess, t));
    const primaryTargetName =
      explicitTarget?.roleName ||
      sess.config.targetRole ||
      matchedTargets[0]?.roleName ||
      'General Practice';

    return {
      primaryTargetName,
      matchedTargets
    };
  };

  // Filter & Sort all interviews for Section 1
  const selectedFilterTarget = targets.find(t => t.targetId === historyTargetFilter);

  const enrichedHistory = allSessions
    .filter((sess) => {
      if (selectedFilterTarget && !StorageService.doesSessionMatchTarget(sess, selectedFilterTarget)) {
        return false;
      }
      const q = historySearch.trim().toLowerCase();
      if (!q) return true;
      return (
        sess.config.title.toLowerCase().includes(q) ||
        sess.config.domain.toLowerCase().includes(q) ||
        sess.sessionId.toLowerCase().includes(q)
      );
    })
    .map((sess) => {
      const evalRep = sess.evaluationReportId ? evaluations[sess.evaluationReportId] : undefined;
      const score = evalRep ? evalRep.overallScore : null;
      const dateStr = sess.endTime ? sess.endTime.split('T')[0] : sess.createdAt.split('T')[0];
      const timestamp = new Date(sess.endTime || sess.createdAt).getTime();
      const { primaryTargetName, matchedTargets } = getSessionTargetInfo(sess);
      return {
        sess,
        evalRep,
        score,
        dateStr,
        timestamp,
        primaryTargetName,
        matchedTargets
      };
    })
    .sort((a, b) => {
      switch (historySortBy) {
        case 'target_asc': {
          const cmp = a.primaryTargetName.localeCompare(b.primaryTargetName);
          return cmp !== 0 ? cmp : b.timestamp - a.timestamp;
        }
        case 'target_desc': {
          const cmp = b.primaryTargetName.localeCompare(a.primaryTargetName);
          return cmp !== 0 ? cmp : b.timestamp - a.timestamp;
        }
        case 'date_asc':
          return a.timestamp - b.timestamp;
        case 'date_desc':
          return b.timestamp - a.timestamp;
        case 'score_desc':
          return (b.score ?? -1) - (a.score ?? -1);
        case 'score_asc':
          return (a.score ?? -1) - (b.score ?? -1);
        default:
          return b.timestamp - a.timestamp;
      }
    });

  // Section 2 metrics (Scoped to Active Target or All Sessions)
  const displayedSessions =
    scopeMode === 'active_target' && activeSummary
      ? activeSummary.sessions
      : tracker.scoreHistory;

  const displayedCount =
    scopeMode === 'active_target' && activeSummary
      ? activeSummary.sessionCount
      : tracker.totalInterviews;

  const displayedAvg =
    scopeMode === 'active_target' && activeSummary
      ? activeSummary.avgScore
      : tracker.avgScore;

  const displayedPeak =
    scopeMode === 'active_target' && activeSummary
      ? activeSummary.highestScore
      : tracker.highestScore;

  const displayedLatest =
    scopeMode === 'active_target' && activeSummary
      ? activeSummary.latestScore
      : tracker.latestScore;

  const displayedImprovement =
    scopeMode === 'active_target' && activeSummary
      ? activeSummary.improvementPercentage
      : tracker.improvementPercentage;

  const isImproving = displayedImprovement >= 0;

  return (
    <div className={`min-h-screen py-5 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>My Progress</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">History &amp; Progress</h1>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Past interviews and scores for {profile.name}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={openCreateTarget}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Goal</span>
            </button>

            <button
              onClick={openManageTargets}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center space-x-1.5 cursor-pointer transition-colors ${
                isDark
                  ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200'
                  : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Manage Goals</span>
            </button>
          </div>
        </div>

        {/* Main 2-Column Balanced Workspace: Left (History + Goal Summary) & Right (All Career Goals) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN (7 cols): History + Goal Summary */}
          <div className="md:col-span-7 space-y-5">
            {/* ============================================================
                SECTION 1: HISTORY
                ============================================================ */}
            <section
              className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
          <div className="flex flex-col gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xl font-extrabold tracking-tight">History</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  {enrichedHistory.length} {enrichedHistory.length === 1 ? 'Interview' : 'Interviews'}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Your past mock interviews.
              </p>
            </div>

            {/* Filter & Sort Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Search */}
              <div className="relative flex-1 min-w-[160px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search topic or ID..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className={`pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-full ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                />
              </div>
              {/* Target Role Filter */}
              <div className="flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <select
                  aria-label="Filter interviews by goal"
                  value={historyTargetFilter}
                  onChange={(e) => setHistoryTargetFilter(e.target.value)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                    isDark ? 'bg-slate-950 border-slate-800 text-indigo-300' : 'bg-slate-50 border-slate-200 text-indigo-700'
                  }`}
                >
                  <option value="All">All Goals</option>
                  {targets.map((t) => (
                    <option key={t.targetId} value={t.targetId}>
                      Goal: {t.roleName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center space-x-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <select
                  aria-label="Sort interviews"
                  value={historySortBy}
                  onChange={(e) => setHistorySortBy(e.target.value as HistorySortMode)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="target_asc">Goal (A → Z)</option>
                  <option value="target_desc">Goal (Z → A)</option>
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="score_desc">Highest Score</option>
                  <option value="score_asc">Lowest Score</option>
                </select>
              </div>
            </div>
          </div>

          {enrichedHistory.length === 0 ? (
            <div className={`p-8 rounded-2xl border border-dashed text-center space-y-2 ${
              isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-300'
            }`}>
              <p className="text-xs font-bold">No matching interviews yet.</p>
              <div className="flex justify-center gap-2 pt-1">
                <button
                  onClick={() => {
                    setHistoryTargetFilter('All');
                    setHistorySearch('');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                    isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-white text-slate-700'
                  }`}
                >
                  Show All Interviews
                </button>
                <button
                  onClick={() => onNavigate('book_interview')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                >
                  Book Interview
                </button>
              </div>
            </div>
          ) : (
            <div className={`rounded-2xl border overflow-x-auto ${
              isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/50'
            }`}>
              <table className="w-full text-left text-xs">
                <thead className={`border-b ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Goal</th>
                    <th className="py-2.5 px-3 font-semibold">Interview</th>
                    <th className="py-2.5 px-3 font-semibold">Topic &amp; Type</th>
                    <th className="py-2.5 px-3 font-semibold">Level</th>
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold">Score</th>
                    <th className="py-2.5 px-3 font-semibold text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {enrichedHistory.map(({ sess, evalRep, score, dateStr, primaryTargetName, matchedTargets }) => (
                    <tr
                      key={sess.sessionId}
                      className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-white'}
                    >
                      <td className="py-3 px-3 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 w-fit">
                            {primaryTargetName}
                          </span>
                          {matchedTargets.length > 1 && (
                            <span className="text-[10px] text-slate-500">
                              Also fits: {matchedTargets.filter(t => t.roleName !== primaryTargetName).map(t => t.roleName).join(', ')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 align-top">
                        <div className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                          {sess.config.title}
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">{sess.sessionId}</span>
                      </td>
                      <td className="py-3 px-3 align-top">
                        <div className={isDark ? 'text-slate-300' : 'text-slate-700'}>{sess.config.domain}</div>
                        <span className="text-[10px] text-slate-500">{sess.config.mode} • {sess.config.durationMinutes}m</span>
                      </td>
                      <td className="py-3 px-3 align-top">
                        <span className="font-semibold text-amber-400">{sess.config.difficulty}</span>
                      </td>
                      <td className="py-3 px-3 align-top text-slate-400 whitespace-nowrap">{dateStr}</td>
                      <td className="py-3 px-3 align-top">
                        {score !== null ? (
                          <span className={`font-black font-mono text-sm ${
                            score >= 80 ? 'text-emerald-400' : score >= 70 ? 'text-indigo-400' : 'text-amber-400'
                          }`}>
                            {score}%
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">{sess.status}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {sess.transcriptId && (
                            <button
                              onClick={() => onNavigate('transcript', sess.transcriptId)}
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold inline-flex items-center space-x-1 cursor-pointer ${
                                isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <FileText className="w-3 h-3" />
                              <span>Transcript</span>
                            </button>
                          )}
                          {evalRep && (
                            <button
                              onClick={() => onNavigate('performance_evaluation', evalRep.reportId)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center space-x-1 cursor-pointer"
                            >
                              <Award className="w-3 h-3" />
                              <span>Report</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
            </section>

            {/* ============================================================
                GOAL SUMMARY (DIRECTLY UNDER HISTORY)
                ============================================================ */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    <Target className="w-4 h-4" />
                    <span>Goal Summary</span>
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight mt-0.5">
                    {activeTarget.roleName}
                  </h2>
                </div>

                <span className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center space-x-1 border self-start sm:self-auto ${
                  isImproving
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>
                    {displayedCount <= 1
                      ? 'First Interview Done'
                      : isImproving
                        ? `+${displayedImprovement}% Up`
                        : `${displayedImprovement}%`}
                  </span>
                </span>
              </div>

              {/* Interactive Target Switcher Bar */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 text-xs font-bold">
                    <Target className="w-4 h-4 text-indigo-400" />
                    <span>Choose a Goal</span>
                    <span className={`text-[11px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      ({targetSummaries.length})
                    </span>
                  </div>

                  {/* Scope Toggle */}
                  <div className={`inline-flex p-0.5 rounded-xl border self-start sm:self-auto ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <button
                      onClick={() => setScopeMode('active_target')}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                        scopeMode === 'active_target'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      This Goal
                    </button>
                    <button
                      onClick={() => setScopeMode('all_sessions')}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                        scopeMode === 'all_sessions'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All ({tracker.totalInterviews})
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {targetSummaries.map((summary) => {
                    const isActive = summary.target.targetId === activeTarget.targetId;
                    const accent = ACCENT_STYLE_MAP[summary.target.accentColor || 'indigo'];
                    return (
                      <button
                        key={summary.target.targetId}
                        onClick={() => handleSelectTarget(summary.target.targetId)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                          isActive
                            ? isDark
                              ? `bg-indigo-600/20 ${accent.ring} text-white shadow-xs`
                              : 'bg-indigo-50 border-indigo-400 text-indigo-800 shadow-xs'
                            : isDark
                              ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>{summary.target.roleName}</span>
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono border ${
                          isActive
                            ? accent.badge
                            : isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                        }`}>
                          {summary.sessionCount} • {summary.readinessPercentage}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                  <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Interviews
                  </span>
                  <div className="text-2xl font-black mt-0.5">{displayedCount}</div>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                    {scopeMode === 'active_target' ? activeTarget.roleName : 'All goals'}
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                  <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Avg Score</span>
                  <div className="text-2xl font-black text-purple-400 mt-0.5">
                    {displayedCount > 0 ? `${displayedAvg}%` : '—'}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {scopeMode === 'active_target' ? `Goal: ${activeTarget.targetScore}%` : 'Overall avg'}
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                  <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Best Score</span>
                  <div className="text-2xl font-black text-amber-400 mt-0.5">
                    {displayedCount > 0 ? `${displayedPeak}%` : '—'}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Highest yet</p>
                </div>

                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                  <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Latest</span>
                  <div className="text-2xl font-black text-emerald-400 mt-0.5">
                    {displayedCount > 0 ? `${displayedLatest}%` : '—'}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Last round</p>
                </div>
              </div>

              {/* Active Target Benchmark & Skill Breakdown Banner */}
              {activeSummary && (
                <div className={`p-5 rounded-2xl border space-y-4 ${
                  isDark
                    ? 'bg-linear-to-r from-slate-900 via-indigo-950/30 to-slate-900 border-slate-800'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Goal Progress</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                          {activeSummary.sessionCount} {activeSummary.sessionCount === 1 ? 'Interview' : 'Interviews'}
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold">{activeTarget.roleName}</h3>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <span className={`text-[10px] font-semibold mr-1 py-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Topics:
                        </span>
                        {!activeTarget.focusDomains || activeTarget.focusDomains.length === 0 ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            All Topics
                          </span>
                        ) : (
                          activeTarget.focusDomains.map((dom) => (
                            <span
                              key={dom}
                              className={`text-[10px] px-2 py-0.5 rounded-md border ${
                                isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              {dom}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => openEditTarget(activeTarget)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center space-x-1.5 cursor-pointer transition-colors ${
                          isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => onNavigate('book_interview')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Practice</span>
                      </button>
                    </div>
                  </div>

                  {/* Readiness Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap justify-between text-xs font-bold gap-2">
                      <span>
                        Progress: {activeSummary.readinessPercentage}% (Goal: {activeTarget.targetScore}%)
                      </span>
                      <span className={activeSummary.gapToTarget === 0 && activeSummary.sessionCount > 0 ? 'text-emerald-400' : 'text-indigo-400'}>
                        {activeSummary.sessionCount === 0
                          ? 'Do 1 interview to start'
                          : activeSummary.gapToTarget === 0
                            ? 'Goal Reached!'
                            : `Avg: ${activeSummary.avgScore}% (${activeSummary.gapToTarget}% to go)`}
                      </span>
                    </div>
                    <div className={`w-full h-3 rounded-full overflow-hidden relative ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                      <div
                        className={`h-full bg-linear-to-r ${ACCENT_STYLE_MAP[activeTarget.accentColor || 'indigo'].bar} transition-all duration-700`}
                        style={{ width: `${activeSummary.readinessPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Target Skill Pillar Breakdown */}
                  {activeSummary.sessionCount > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                      {[
                        { label: 'Technical', value: activeSummary.avgTechnicalScore, color: 'text-blue-400', bar: 'bg-blue-400' },
                        { label: 'Communication', value: activeSummary.avgCommunicationScore, color: 'text-purple-400', bar: 'bg-purple-400' },
                        { label: 'Confidence', value: activeSummary.avgConfidenceScore, color: 'text-pink-400', bar: 'bg-pink-400' },
                        { label: 'Response', value: activeSummary.avgResponseQualityScore, color: 'text-emerald-400', bar: 'bg-emerald-400' }
                      ].map((pillar) => (
                        <div
                          key={pillar.label}
                          className={`p-3 rounded-xl border ${
                            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{pillar.label}</span>
                            <span className={`font-black font-mono ${pillar.color}`}>{pillar.value}%</span>
                          </div>
                          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                            <div className={`h-full rounded-full ${pillar.bar}`} style={{ width: `${pillar.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* ============================================================
              RIGHT COLUMN (5 cols, BESIDE HISTORY): ANALYSIS ACROSS ALL TARGET ROLES
              ============================================================ */}
          <section
            className={`md:col-span-5 p-4 sm:p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Layers className="w-4 h-4" />
                  <span>All Goals</span>
                </div>
                <h2 className="text-lg font-extrabold">Your Career Goals</h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Compare scores across all roles.
                </p>
              </div>
              <button
                onClick={openCreateTarget}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0 ${
                  isDark ? 'border-slate-700 hover:bg-slate-800 text-indigo-400' : 'border-slate-300 hover:bg-slate-100 text-indigo-600'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Goal</span>
              </button>
            </div>

            {/* Comparative Cards Grid */}
            <div className="grid grid-cols-1 gap-3.5">
              {targetSummaries.map((summary) => {
                const isActive = summary.target.targetId === activeTarget.targetId;
                const accent = ACCENT_STYLE_MAP[summary.target.accentColor || 'indigo'];
                return (
                  <div
                    key={summary.target.targetId}
                    className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${
                      isActive
                        ? isDark
                          ? 'bg-indigo-950/25 border-indigo-500/50 shadow-md'
                          : 'bg-indigo-50/50 border-indigo-300 shadow-xs'
                        : isDark
                          ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-extrabold leading-snug">{summary.target.roleName}</h3>
                          <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {summary.sessionCount} {summary.sessionCount === 1 ? 'interview' : 'interviews'} • Goal {summary.target.targetScore}%
                          </span>
                        </div>
                        {isActive ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => openEditTarget(summary.target)}
                            className={`p-1.5 rounded-lg border cursor-pointer ${
                              isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-white text-slate-500'
                            }`}
                            title="Edit goal"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Visual Score vs Target Benchmark Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span>Avg: <span className="text-indigo-400">{summary.sessionCount > 0 ? `${summary.avgScore}%` : '0%'}</span></span>
                          <span className={summary.readinessPercentage >= 90 ? 'text-emerald-400' : 'text-purple-400'}>
                            {summary.readinessPercentage}% Ready
                          </span>
                        </div>
                        <div className={`w-full h-2.5 rounded-full overflow-hidden relative ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                          <div
                            className={`h-full rounded-full bg-linear-to-r ${accent.bar} transition-all duration-700`}
                            style={{ width: `${summary.sessionCount > 0 ? Math.min(100, summary.avgScore) : 0}%` }}
                          />
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-xs"
                            style={{ left: `${Math.min(99, summary.target.targetScore)}%` }}
                            title={`Goal: ${summary.target.targetScore}%`}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>0%</span>
                          <span>Goal: {summary.target.targetScore}%</span>
                        </div>
                      </div>

                      {/* Key Stats Grid */}
                      <div className={`grid grid-cols-2 gap-2 p-2.5 rounded-xl border text-[11px] ${
                        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
                      }`}>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Best Score</span>
                          <span className="font-bold text-amber-400">
                            {summary.sessionCount > 0 ? `${summary.highestScore}%` : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Trend</span>
                          <span className={`font-bold ${
                            summary.improvementPercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {summary.sessionCount > 1
                              ? `${summary.improvementPercentage >= 0 ? '+' : ''}${summary.improvementPercentage}%`
                              : summary.sessionCount === 1
                                ? 'First'
                                : 'No data'}
                          </span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-slate-800/30">
                          <span className="text-slate-500 block text-[10px]">Best / Needs Work</span>
                          <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {summary.sessionCount > 0
                              ? `${summary.strongestSkill} • Improve: ${summary.weakestSkill}`
                              : 'Do an interview to see stats'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex gap-2 pt-0.5">
                      {!isActive ? (
                        <button
                          onClick={() => handleSelectTarget(summary.target.targetId)}
                          className="flex-1 py-1.5 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition-colors"
                        >
                          View Details
                        </button>
                      ) : (
                        <button
                          onClick={() => openEditTarget(summary.target)}
                          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                            isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-white text-slate-700'
                          }`}
                        >
                          Edit Goal
                        </button>
                      )}
                      <button
                        onClick={() => {
                          StorageService.setActiveTarget(currentUser.userId, summary.target.targetId);
                          onNavigate('book_interview');
                        }}
                        className={`py-1.5 px-3 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                          isDark
                            ? 'border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300'
                            : 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        Practice
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* ============================================================
            FULL-WIDTH SCORE PROGRESSION TIMELINE
            ============================================================ */}
        <section>
          <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold flex items-center space-x-2">
                  <BarChart2 className="w-5 h-5 text-indigo-400" />
                  <span>
                    {scopeMode === 'active_target'
                      ? `${activeTarget.roleName} — Score History`
                      : 'All Scores Over Time'}
                  </span>
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {scopeMode === 'active_target'
                    ? `${displayedSessions.length} completed ${displayedSessions.length === 1 ? 'interview' : 'interviews'}`
                    : 'Your scores across all interviews'}
                </p>
              </div>
            </div>

            {displayedSessions.length === 0 ? (
              <div className={`p-10 rounded-2xl border border-dashed text-center space-y-3 ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-300'
              }`}>
                <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
                <h4 className="text-sm font-bold">No interviews for &ldquo;{activeTarget.roleName}&rdquo; yet</h4>
                <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Book an interview to start tracking your score toward {activeTarget.targetScore}%.
                </p>
                <div className="flex justify-center gap-3 pt-1">
                  <button
                    onClick={() => onNavigate('book_interview')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                  >
                    Book Interview
                  </button>
                  <button
                    onClick={() => setScopeMode('all_sessions')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                      isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    Show All
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {displayedSessions.map((sc, index) => {
                  const diffFromPrev = index > 0 ? sc.score - displayedSessions[index - 1].score : 0;
                  return (
                    <div key={sc.sessionId} className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-[11px] flex items-center justify-center font-mono">
                            {index + 1}
                          </span>
                          <span className="font-bold">{sc.interviewTitle}</span>
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>({sc.domain})</span>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className="text-slate-500 text-[11px]">{sc.date}</span>
                          {index > 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                              diffFromPrev >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                            }`}>
                              {diffFromPrev >= 0 ? `+${diffFromPrev}%` : `${diffFromPrev}%`}
                            </span>
                          )}
                          <span className="font-black text-sm text-indigo-400 font-mono w-12 text-right">
                            {sc.score}%
                          </span>
                        </div>
                      </div>

                      {/* Visual Bar */}
                      <div className={`w-full h-4 rounded-xl overflow-hidden flex shadow-inner relative ${
                        isDark ? 'bg-slate-800/80' : 'bg-slate-200'
                      }`}>
                        <div
                          className={`h-full transition-all duration-700 ${
                            sc.score >= 80
                              ? 'bg-linear-to-r from-emerald-500 to-teal-400'
                              : sc.score >= 70
                                ? 'bg-linear-to-r from-indigo-500 to-purple-500'
                                : 'bg-linear-to-r from-amber-500 to-orange-400'
                          }`}
                          style={{ width: `${sc.score}%` }}
                        />
                        {scopeMode === 'active_target' && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-white/80"
                            style={{ left: `${Math.min(99, activeTarget.targetScore)}%` }}
                            title={`Target: ${activeTarget.targetScore}%`}
                          />
                        )}
                      </div>

                      <div className={`flex flex-wrap gap-4 text-[10px] pl-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span>
                          Technical Score:{' '}
                          <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{sc.technicalScore}%</strong>
                        </span>
                        <span>
                          Communication:{' '}
                          <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{sc.communicationScore}%</strong>
                        </span>
                        <span>
                          Confidence:{' '}
                          <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{sc.confidenceScore}%</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Target Manager Modal */}
      <TargetManagerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        userId={currentUser.userId}
        theme={theme}
        initialEditTarget={editTarget}
        initialMode={modalMode}
        onTargetsChanged={() => setRefreshTick(t => t + 1)}
      />
    </div>
  );
};
