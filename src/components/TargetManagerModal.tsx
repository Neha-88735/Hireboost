import React, { useState, useEffect } from 'react';
import {
  Target,
  X,
  Plus,
  Check,
  Trash2,
  Edit3,
  Sparkles,
  Sliders
} from 'lucide-react';
import { CareerTarget, TargetAccentColor } from '../types/hireboost';
import { StorageService, INTERVIEW_DOMAINS, TARGET_PRESETS } from '../services/storage';

interface TargetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  theme: 'dark' | 'light';
  initialEditTarget?: CareerTarget | null;
  initialMode?: 'list' | 'create' | 'edit';
  onTargetsChanged: () => void;
}

const ACCENT_OPTIONS: { id: TargetAccentColor; label: string; dotClass: string }[] = [
  { id: 'indigo', label: 'Indigo', dotClass: 'bg-indigo-500' },
  { id: 'emerald', label: 'Emerald', dotClass: 'bg-emerald-500' },
  { id: 'purple', label: 'Purple', dotClass: 'bg-purple-500' },
  { id: 'cyan', label: 'Cyan', dotClass: 'bg-cyan-500' },
  { id: 'amber', label: 'Amber', dotClass: 'bg-amber-500' },
  { id: 'pink', label: 'Pink', dotClass: 'bg-pink-500' }
];

const SELECTABLE_DOMAINS = INTERVIEW_DOMAINS.filter(d => d !== 'Custom Topic');

export const TargetManagerModal: React.FC<TargetManagerModalProps> = ({
  isOpen,
  onClose,
  userId,
  theme,
  initialEditTarget = null,
  initialMode = 'list',
  onTargetsChanged
}) => {
  const isDark = theme === 'dark';
  const [targets, setTargets] = useState<CareerTarget[]>([]);
  const [activeTargetId, setActiveTargetId] = useState<string>('');
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>(initialMode);

  // Form state
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [roleName, setRoleName] = useState<string>('');
  const [targetScore, setTargetScore] = useState<number>(85);
  const [focusDomains, setFocusDomains] = useState<string[]>([]);
  const [allDomainsMode, setAllDomainsMode] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');
  const [accentColor, setAccentColor] = useState<TargetAccentColor>('indigo');
  const [error, setError] = useState<string | null>(null);

  const refreshData = () => {
    const profile = StorageService.getUserProfile(userId);
    const list = StorageService.getUserTargets(userId);
    const active = StorageService.getActiveTarget(userId);
    setTargets(list);
    setActiveTargetId(profile.activeTargetId || active.targetId);
  };

  useEffect(() => {
    if (!isOpen) return;
    refreshData();
    setError(null);
    if (initialEditTarget) {
      loadTargetIntoForm(initialEditTarget);
      setMode('edit');
    } else if (initialMode === 'create') {
      resetForm();
      setMode('create');
    } else {
      setMode('list');
    }
  }, [isOpen, userId, initialEditTarget, initialMode]);

  const resetForm = () => {
    setEditingId(undefined);
    setRoleName('');
    setTargetScore(85);
    setFocusDomains(['Data Structures and Algorithms']);
    setAllDomainsMode(false);
    setDescription('');
    setAccentColor('indigo');
    setError(null);
  };

  const loadTargetIntoForm = (t: CareerTarget) => {
    setEditingId(t.targetId);
    setRoleName(t.roleName);
    setTargetScore(t.targetScore);
    const isAll = !t.focusDomains || t.focusDomains.length === 0;
    setAllDomainsMode(isAll);
    setFocusDomains(isAll ? [] : [...t.focusDomains]);
    setDescription(t.description || '');
    setAccentColor(t.accentColor || 'indigo');
    setError(null);
  };

  const handleApplyPreset = (preset: typeof TARGET_PRESETS[number]) => {
    setRoleName(preset.roleName);
    setTargetScore(preset.targetScore);
    setAllDomainsMode(false);
    setFocusDomains([...preset.focusDomains]);
    setDescription(preset.description);
    setAccentColor(preset.accentColor);
    setError(null);
  };

  const toggleDomain = (domain: string) => {
    setAllDomainsMode(false);
    setFocusDomains(prev =>
      prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]
    );
  };

  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      setError('Please enter a target role name.');
      return;
    }

    const effectiveDomains = allDomainsMode ? [] : focusDomains;
    StorageService.upsertTarget(
      userId,
      {
        targetId: editingId,
        roleName: roleName.trim(),
        targetScore,
        focusDomains: effectiveDomains,
        description: description.trim() || undefined,
        accentColor
      },
      true
    );

    refreshData();
    onTargetsChanged();
    setMode('list');
  };

  const handleActivateTarget = (targetId: string) => {
    StorageService.setActiveTarget(userId, targetId);
    refreshData();
    onTargetsChanged();
  };

  const handleDeleteTarget = (targetId: string) => {
    if (targets.length <= 1) return;
    StorageService.deleteTarget(userId, targetId);
    refreshData();
    onTargetsChanged();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Modal Header */}
        <div className={`sticky top-0 z-10 px-6 py-5 border-b flex items-center justify-between ${
          isDark ? 'bg-slate-900/95 border-slate-800 backdrop-blur-md' : 'bg-white/95 border-slate-200 backdrop-blur-md'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">
                {mode === 'list'
                  ? 'Your Career Goals'
                  : mode === 'create'
                    ? 'Add Goal'
                    : 'Edit Goal'}
              </h2>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Switch or add goals to track your progress.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
            aria-label="Close goals modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {mode === 'list' ? (
            <>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Saved Goals ({targets.length})
                </span>
                <button
                  onClick={() => {
                    resetForm();
                    setMode('create');
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Goal</span>
                </button>
              </div>

              <div className="space-y-3">
                {targets.map((t) => {
                  const isActive = t.targetId === activeTargetId;
                  return (
                    <div
                      key={t.targetId}
                      className={`p-4 rounded-2xl border transition-all ${
                        isActive
                          ? isDark
                            ? 'bg-indigo-950/30 border-indigo-500/50'
                            : 'bg-indigo-50/70 border-indigo-300'
                          : isDark
                            ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold">{t.roleName}</h3>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                                <Check className="w-3 h-3" />
                                <span>Active</span>
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                              Goal: {t.targetScore}%
                            </span>
                          </div>
                          {t.description && (
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              {t.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {!t.focusDomains || t.focusDomains.length === 0 ? (
                              <span className={`text-[10px] px-2 py-0.5 rounded-md border ${
                                isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
                              }`}>
                                All Interview Domains
                              </span>
                            ) : (
                              t.focusDomains.map((dom) => (
                                <span
                                  key={dom}
                                  className={`text-[10px] px-2 py-0.5 rounded-md border ${
                                    isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
                                  }`}
                                >
                                  {dom}
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {!isActive && (
                            <button
                              onClick={() => handleActivateTarget(t.targetId)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition-colors"
                            >
                              Use Goal
                            </button>
                          )}
                          <button
                            onClick={() => {
                              loadTargetIntoForm(t);
                              setMode('edit');
                            }}
                            className={`p-2 rounded-lg border text-xs cursor-pointer ${
                              isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                            }`}
                            title="Edit target"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {targets.length > 1 && (
                            <button
                              onClick={() => handleDeleteTarget(t.targetId)}
                              className="p-2 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                              title="Delete target"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={onClose}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                    isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Done
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSaveTarget} className="space-y-5">
              {/* Quick Presets (only show in create mode or as quick fill) */}
              {mode === 'create' && (
                <div>
                  <label className="block text-xs font-bold text-indigo-400 mb-2 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Quick Picks (Optional)</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TARGET_PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset.roleName}
                        onClick={() => handleApplyPreset(preset)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          roleName === preset.roleName
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : isDark
                              ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{preset.roleName}</span>
                          <span className="text-[10px] font-mono text-indigo-400">{preset.targetScore}%</span>
                        </div>
                        <p className={`text-[10px] mt-0.5 line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {preset.focusDomains.join(', ')}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Role Name & Target Score */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Goal / Role Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Frontend React Engineer, Backend SDE"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <span>Goal Score</span>
                    <span className="font-mono text-indigo-400">{targetScore}%</span>
                  </label>
                  <input
                    type="range"
                    min={60}
                    max={98}
                    step={1}
                    value={targetScore}
                    onChange={(e) => setTargetScore(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-500 mt-2 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                    <span>60%</span>
                    <span>80%</span>
                    <span>98%</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Prep for upcoming interviews"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              {/* Focus Domains */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-xs font-bold flex items-center space-x-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Topics to Practice</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAllDomainsMode(!allDomainsMode);
                      if (!allDomainsMode) setFocusDomains([]);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-colors ${
                      allDomainsMode
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : isDark
                          ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    {allDomainsMode ? '✓ All Topics' : 'All Topics'}
                  </button>
                </div>
                <p className={`text-[11px] mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Pick which topics count toward this goal.
                </p>

                <div className="flex flex-wrap gap-2">
                  {SELECTABLE_DOMAINS.map((domain) => {
                    const selected = !allDomainsMode && focusDomains.includes(domain);
                    return (
                      <button
                        type="button"
                        key={domain}
                        onClick={() => toggleDomain(domain)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                          selected
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                            : isDark
                              ? 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {selected ? `✓ ${domain}` : domain}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Badge Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {ACCENT_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setAccentColor(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-2 cursor-pointer ${
                        accentColor === c.id
                          ? 'border-indigo-500 bg-indigo-500/15'
                          : isDark
                            ? 'border-slate-800 bg-slate-950 text-slate-400'
                            : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${c.dotClass}`} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-slate-800/40 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                    isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md cursor-pointer"
                >
                  {mode === 'create' ? 'Save Goal' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
