import React, { useState } from 'react';
import {
  Shield,
  Users,
  BookOpen,
  Star,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Activity,
  Layers,
  ChevronRight,
  Clock
} from 'lucide-react';
import { StorageService } from '../services/storage';
import {
  getStoredCodingTimeLimits,
  getStoredVoiceTimeLimits,
  saveStoredCodingTimeLimits,
  saveStoredVoiceTimeLimits
} from '../config/interviewConfig';
import {
  User,
  QuestionBankItem,
  DifficultyLevel,
  InterviewMode
} from '../types/hireboost';

interface AdminDashboardProps {
  currentUser: User;
  onSwitchRole: (role: 'Student' | 'Admin') => void;
  onNavigate: (view: string) => void;
  theme: 'dark' | 'light';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onSwitchRole,
  onNavigate,
  theme
}) => {
  const isDark = theme === 'dark';

  // Role Gate
  if (currentUser.role !== 'Admin') {
    return (
      <div className={`min-h-screen py-20 px-4 text-center ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
        <div className="max-w-md mx-auto p-8 rounded-3xl border border-rose-500/30 bg-rose-500/10 space-y-4">
          <Shield className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold">Administrative Access Restricted</h2>
          <p className="text-xs text-slate-400">
            You are currently signed in as a <strong className="text-slate-200">Student</strong>. Only accounts with the Admin role have access to platform analytics and curriculum question management.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onSwitchRole('Admin')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
            >
              Switch Role to Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin Data
  const users = StorageService.getUsers();
  const allSessions = StorageService.getAllSessions();
  const feedbackList = StorageService.getAllFeedback();
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>(StorageService.getQuestionBank());

  // Add Question Modal/Form State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [qDomain, setQDomain] = useState<string>('Data Structures and Algorithms');
  const [qDifficulty, setQDifficulty] = useState<DifficultyLevel>('Medium');
  const [qMode, setQMode] = useState<InterviewMode>('Technical');
  const [qCategory, setQCategory] = useState<string>('Algorithms');
  const [qText, setQText] = useState<string>('');
  const [qSample, setQSample] = useState<string>('');
  const [qPoints, setQPoints] = useState<string>('');
  const [addNotice, setAddNotice] = useState<string | null>(null);
  const [codingLimits, setCodingLimits] = useState<Record<DifficultyLevel, number>>(() =>
    getStoredCodingTimeLimits()
  );
  const [voiceLimits, setVoiceLimits] = useState<Record<DifficultyLevel, number>>(() =>
    getStoredVoiceTimeLimits()
  );
  const [limitsSavedMsg, setLimitsSavedMsg] = useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/interview/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.codingTimeLimitsMinutes) {
          setCodingLimits(saveStoredCodingTimeLimits(data.codingTimeLimitsMinutes));
        }
        if (data?.voiceTimeLimitsMinutes) {
          setVoiceLimits(saveStoredVoiceTimeLimits(data.voiceTimeLimitsMinutes));
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveCodingLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    const savedCoding = saveStoredCodingTimeLimits(codingLimits);
    const savedVoice = saveStoredVoiceTimeLimits(voiceLimits);
    setCodingLimits(savedCoding);
    setVoiceLimits(savedVoice);
    try {
      await fetch('/api/interview/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codingTimeLimitsMinutes: savedCoding,
          voiceTimeLimitsMinutes: savedVoice
        })
      });
    } catch {
      // local config saved cleanly even if offline
    }
    setLimitsSavedMsg(
      `Limits updated — Coding: ${savedCoding.Easy}m/${savedCoding.Medium}m/${savedCoding.Hard}m · Voice: ${savedVoice.Easy}m/${savedVoice.Medium}m/${savedVoice.Hard}m.`
    );
    window.setTimeout(() => setLimitsSavedMsg(null), 3500);
  };

  // Statistics
  const totalUsers = users.length;
  const totalSessions = allSessions.length;
  const avgRating = feedbackList.length > 0
    ? (feedbackList.reduce((acc, f) => acc + f.overallRating, 0) / feedbackList.length).toFixed(1)
    : '4.9';

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) return;

    const pointsArray = qPoints
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    const newItem = StorageService.addQuestionToBank({
      domain: qDomain,
      difficulty: qDifficulty,
      mode: qMode,
      category: qCategory.trim() || 'Core Technical',
      questionText: qText.trim(),
      sampleAnswer: qSample.trim() || 'Thorough conceptual breakdown with edge case analysis.',
      keyPoints: pointsArray.length > 0 ? pointsArray : ['Foundations', 'Complexity', 'Trade-offs']
    });

    setQuestionBank(StorageService.getQuestionBank());
    setShowAddModal(false);
    setQText('');
    setQSample('');
    setQPoints('');
    setAddNotice('New interview question added to platform repository!');
    setTimeout(() => setAddNotice(null), 3500);
  };

  const handleDeleteQuestion = (qId: string) => {
    if (window.confirm('Delete this question from the active curriculum bank?')) {
      StorageService.deleteQuestionFromBank(qId);
      setQuestionBank(StorageService.getQuestionBank());
    }
  };

  return (
    <div className={`min-h-screen py-10 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Shield className="w-4 h-4" />
              <span>Platform Executive Administration</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">HireBoost Admin Console</h1>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Manage user accounts, curriculum question sets, interview evaluations, and platform-wide telemetry.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onSwitchRole('Student')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isDark ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
            >
              Switch to Student View
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Question</span>
            </button>
          </div>
        </div>

        {addNotice && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{addNotice}</span>
          </div>
        )}

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Registered Users</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black">{totalUsers} Active</div>
            <p className="text-[11px] text-slate-500 mt-1">Students & staff</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Total Interviews</span>
              <BookOpen className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-400">{totalSessions} Sessions</div>
            <p className="text-[11px] text-slate-500 mt-1">Simulations executed</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Platform Rating</span>
              <Star className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">{avgRating} / 5.0</div>
            <p className="text-[11px] text-slate-500 mt-1">From student reviews</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Question Repository</span>
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">{questionBank.length} Items</div>
            <p className="text-[11px] text-slate-500 mt-1">Curated curriculum</p>
          </div>
        </div>

        {/* Configurable Timed Coding Limits */}
        <form
          onSubmit={handleSaveCodingLimits}
          className={`p-6 rounded-3xl border space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold flex items-center space-x-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Per-Question Time Limits (Coding &amp; Voice)</span>
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Configure countdown timers (minutes) before auto-stop, feedback, and next-question advance.
              </p>
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shrink-0"
            >
              Save Time Limits
            </button>
          </div>

          {limitsSavedMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{limitsSavedMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map((lvl) => (
              <div
                key={lvl}
                className={`p-3.5 rounded-2xl border space-y-2.5 ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <label className="block text-xs font-bold mb-1">{lvl} Coding Limit (mins)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={codingLimits[lvl]}
                    onChange={(e) =>
                      setCodingLimits((prev) => ({
                        ...prev,
                        [lvl]: Math.min(60, Math.max(1, parseInt(e.target.value || '1', 10)))
                      }))
                    }
                    className={`w-full px-3 py-2 text-xs font-mono rounded-xl border ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">{lvl} Voice Question Limit (mins)</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={voiceLimits[lvl]}
                    onChange={(e) =>
                      setVoiceLimits((prev) => ({
                        ...prev,
                        [lvl]: Math.min(15, Math.max(1, parseInt(e.target.value || '1', 10)))
                      }))
                    }
                    className={`w-full px-3 py-2 text-xs font-mono rounded-xl border ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </form>

        {/* Question Bank Manager */}
        <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <span>Curated Question Bank & Curriculum Repository</span>
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Add, review, and maintain standardized questions served during mock interviews.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-800/40">
            {questionBank.map((q) => (
              <div key={q.questionId} className="py-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        {q.domain}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {q.difficulty}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                        {q.mode}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">ID: {q.questionId}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-200">{q.questionText}</h4>
                  </div>

                  <button
                    onClick={() => handleDeleteQuestion(q.questionId)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                    title="Delete question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className={`p-3 rounded-xl border text-xs ${
                  isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <strong className="text-indigo-400">Sample Answer / Model Solution: </strong>
                  <span>{q.sampleAnswer}</span>
                </div>

                {q.keyPoints && q.keyPoints.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {q.keyPoints.map((pt, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-400">
                        ✓ {pt}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* User Account Registry Overview */}
        <div className={`p-6 sm:p-8 rounded-3xl border space-y-4 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <h3 className="text-base font-bold flex items-center space-x-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span>Platform User Directory ({users.length})</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                <tr>
                  <th className="py-2.5 px-3">User ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Join Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {users.map((u) => (
                  <tr key={u.userId} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{u.userId}</td>
                    <td className="py-2.5 px-3 font-bold">{u.name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{u.email}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'Admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{u.joinDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Question Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div className={`w-full max-w-lg rounded-3xl p-7 border shadow-2xl space-y-4 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
                <h3 className="text-lg font-bold">Add Question to Curriculum Bank</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddQuestion} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-300">Domain / Topic</label>
                    <select
                      value={qDomain}
                      onChange={(e) => setQDomain(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <option value="Data Structures and Algorithms">Data Structures & Algorithms</option>
                      <option value="Python">Python</option>
                      <option value="Web Development">Web Development</option>
                      <option value="HR Interview">HR Interview</option>
                      <option value="Software Engineering">Software Engineering</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-300">Difficulty</label>
                    <select
                      value={qDifficulty}
                      onChange={(e) => setQDifficulty(e.target.value as DifficultyLevel)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">Question Text</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Enter the complete question prompt..."
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    className={`w-full p-3 text-xs rounded-xl border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">Sample Model Answer</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Ideal response summary and architectural solution..."
                    value={qSample}
                    onChange={(e) => setQSample(e.target.value)}
                    className={`w-full p-3 text-xs rounded-xl border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">Key Focus Points (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Memory layout, Time complexity O(N), Pointer traversal"
                    value={qPoints}
                    onChange={(e) => setQPoints(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer"
                  >
                    Save to Question Bank
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
