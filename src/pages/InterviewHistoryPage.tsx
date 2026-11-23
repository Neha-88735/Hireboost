import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  FileText,
  Award,
  ChevronRight,
  Calendar,
  Clock,
  ArrowUpDown,
  CheckCircle2,
  Download,
  BarChart3
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { User, InterviewSession, DifficultyLevel, SessionStatus } from '../types/hireboost';

interface InterviewHistoryPageProps {
  currentUser: User;
  onNavigate: (view: string, extraParam?: string) => void;
  theme: 'dark' | 'light';
}

export const InterviewHistoryPage: React.FC<InterviewHistoryPageProps> = ({
  currentUser,
  onNavigate,
  theme
}) => {
  const isDark = theme === 'dark';
  const sessions = StorageService.getUserSessions(currentUser.userId);
  const evaluations = StorageService.getAllEvaluations();
  const targets = StorageService.getUserTargets(currentUser.userId);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('All');
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const selectedTargetObj = targets.find(t => t.targetId === selectedTargetId);

  // Filter logic
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = s.config.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.config.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sessionId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTarget = !selectedTargetObj || StorageService.doesSessionMatchTarget(s, selectedTargetObj);
    const matchesDomain = selectedDomain === 'All' || s.config.domain === selectedDomain;
    const matchesDifficulty = selectedDifficulty === 'All' || s.config.difficulty === selectedDifficulty;
    const matchesStatus = selectedStatus === 'All' || s.status === selectedStatus;

    return matchesSearch && matchesTarget && matchesDomain && matchesDifficulty && matchesStatus;
  });

  return (
    <div className={`min-h-screen py-10 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <History className="w-4 h-4" />
              <span>Candidate Archival Records</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Interview History & Archives</h1>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Browse and review all past mock interviews, transcripts, scoring reports, and performance trends.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('progress_tracker')}
              className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center space-x-1.5 transition-colors cursor-pointer ${
                isDark ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Compare Performances</span>
            </button>
            <button
              onClick={() => onNavigate('book_interview')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer"
            >
              Book New Session
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by topic, domain, or session ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Filter by chosen target"
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className={`px-3 py-2 text-xs rounded-xl border focus:outline-hidden ${
                isDark ? 'bg-slate-950 border-slate-800 text-indigo-300' : 'bg-slate-50 border-slate-200 text-indigo-700'
              }`}
            >
              <option value="All">All Targets</option>
              {targets.map((t) => (
                <option key={t.targetId} value={t.targetId}>
                  Target: {t.roleName}
                </option>
              ))}
            </select>

            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className={`px-3 py-2 text-xs rounded-xl border focus:outline-hidden ${
                isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="All">All Domains</option>
              <option value="Data Structures and Algorithms">DSA</option>
              <option value="Python">Python</option>
              <option value="HR Interview">HR Interview</option>
              <option value="Web Development">Web Development</option>
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className={`px-3 py-2 text-xs rounded-xl border focus:outline-hidden ${
                isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`px-3 py-2 text-xs rounded-xl border focus:outline-hidden ${
                isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Ready">Ready</option>
              <option value="In_Progress">In Progress</option>
            </select>

            {/* Layout Toggle */}
            <div className={`flex p-0.5 rounded-lg border ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-100'}`}>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                  viewMode === 'cards'
                    ? 'bg-indigo-600 text-white'
                    : isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white'
                    : isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Results List */}
        {filteredSessions.length === 0 ? (
          <div className={`p-12 text-center rounded-3xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <p className="text-sm text-slate-400">No interview sessions found matching your filters.</p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredSessions.map((sess) => {
              const evalRep = sess.evaluationReportId ? evaluations[sess.evaluationReportId] : null;
              const dateStr = sess.endTime ? sess.endTime.split('T')[0] : sess.createdAt.split('T')[0];

              return (
                <div
                  key={sess.sessionId}
                  className={`p-6 rounded-2xl border space-y-4 transition-all hover:border-indigo-500/40 ${
                    isDark ? 'bg-slate-900 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-indigo-400 font-bold">
                      {sess.sessionId}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      sess.status === 'Completed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {sess.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold leading-snug">{sess.config.title}</h3>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {sess.config.domain} • {sess.config.mode}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800/40 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Difficulty</span>
                      <span className="text-xs font-bold text-amber-400">{sess.config.difficulty}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Duration</span>
                      <span className="text-xs font-bold">{sess.config.durationMinutes} mins</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Overall Score</span>
                      <span className="text-xs font-black text-emerald-400">
                        {evalRep ? `${evalRep.overallScore}/100` : 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{dateStr}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {sess.transcriptId && (
                        <button
                          onClick={() => onNavigate('transcript', sess.transcriptId)}
                          className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                            isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          Transcript
                        </button>
                      )}

                      {evalRep && (
                        <button
                          onClick={() => onNavigate('performance_evaluation', evalRep.reportId)}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center space-x-1 cursor-pointer"
                        >
                          <span>Evaluation</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table Layout */
          <div className={`rounded-2xl border overflow-x-auto ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <table className="w-full text-left text-xs">
              <thead className={`border-b ${isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <tr>
                  <th className="py-3 px-4 font-semibold">Session ID</th>
                  <th className="py-3 px-4 font-semibold">Interview Topic</th>
                  <th className="py-3 px-4 font-semibold">Domain</th>
                  <th className="py-3 px-4 font-semibold">Difficulty</th>
                  <th className="py-3 px-4 font-semibold">Mode</th>
                  <th className="py-3 px-4 font-semibold">Duration</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Score</th>
                  <th className="py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredSessions.map((sess) => {
                  const evalRep = sess.evaluationReportId ? evaluations[sess.evaluationReportId] : null;
                  const dateStr = sess.endTime ? sess.endTime.split('T')[0] : sess.createdAt.split('T')[0];
                  return (
                    <tr key={sess.sessionId} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-400">{sess.sessionId}</td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{sess.config.title}</td>
                      <td className="py-3 px-4 text-slate-400">{sess.config.domain}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-amber-400">{sess.config.difficulty}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{sess.config.mode}</td>
                      <td className="py-3 px-4">{sess.config.durationMinutes}m</td>
                      <td className="py-3 px-4 text-slate-400">{dateStr}</td>
                      <td className="py-3 px-4 font-black text-emerald-400">
                        {evalRep ? `${evalRep.overallScore}%` : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {sess.transcriptId && (
                            <button
                              onClick={() => onNavigate('transcript', sess.transcriptId)}
                              className="text-indigo-400 hover:underline cursor-pointer"
                            >
                              Transcript
                            </button>
                          )}
                          {evalRep && (
                            <button
                              onClick={() => onNavigate('performance_evaluation', evalRep.reportId)}
                              className="text-purple-400 hover:underline font-bold cursor-pointer"
                            >
                              Report
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
