import React, { useState, useMemo } from 'react';
import {
  Star,
  MessageSquare,
  CheckCircle2,
  Send,
  PenLine,
  X
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { User, UserFeedback } from '../types/hireboost';

interface UserFeedbackPageProps {
  currentUser: User | null;
  sessionId?: string;
  onNavigate: (view: string) => void;
  theme: 'dark' | 'light';
}

const APP_ASPECTS = [
  'Overall Platform Experience',
  'AI Mock Interview & Voice Mode',
  'Performance Evaluation & Scoring',
  'Resume Builder',
  'History & Target Progress'
];

export const UserFeedbackPage: React.FC<UserFeedbackPageProps> = ({
  currentUser,
  sessionId,
  theme
}) => {
  const isDark = theme === 'dark';
  const targetSession = sessionId ? StorageService.getSessionById(sessionId) : null;

  const [allFeedback, setAllFeedback] = useState<UserFeedback[]>(() => StorageService.getAllFeedback());
  const [reviewScope, setReviewScope] = useState<'app' | 'all'>('app');
  const [showWriteForm, setShowWriteForm] = useState<boolean>(Boolean(sessionId));

  // Form State
  const defaultDisplayName = currentUser
    ? (() => {
        const parts = currentUser.name.trim().split(/\s+/);
        return parts.length > 1 ? `${parts[0]} ${parts[1].charAt(0)}.` : parts[0];
      })()
    : '';

  const [aspectFocus, setAspectFocus] = useState<string>(
    targetSession ? targetSession.config.title : APP_ASPECTS[0]
  );
  const [reviewerName, setReviewerName] = useState<string>(defaultDisplayName);
  const [postAnonymously, setPostAnonymously] = useState<boolean>(false);
  const [overallRating, setOverallRating] = useState<number>(5);
  const [easeOfUseRating, setEaseOfUseRating] = useState<number>(5);
  const [aiQualityRating, setAiQualityRating] = useState<number>(5);
  const [toolsValueRating, setToolsValueRating] = useState<number>(5);
  const [writtenFeedback, setWrittenFeedback] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedNotice, setSubmittedNotice] = useState<boolean>(false);

  const appReviews = useMemo(
    () =>
      allFeedback
        .filter(f => f.isPublic && (f.feedbackType === 'app' || f.domain === 'Overall App'))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [allFeedback]
  );

  const displayedReviews = useMemo(() => {
    if (reviewScope === 'app') return appReviews;
    return [...allFeedback]
      .filter(f => f.isPublic)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reviewScope, appReviews, allFeedback]);

  // Overall App Metrics
  const totalAppReviews = appReviews.length;
  const avgAppRating = totalAppReviews > 0
    ? (appReviews.reduce((acc, f) => acc + f.overallRating, 0) / totalAppReviews).toFixed(1)
    : '5.0';
  const avgAiQuality = totalAppReviews > 0
    ? (appReviews.reduce((acc, f) => acc + f.questionQualityRating, 0) / totalAppReviews).toFixed(1)
    : '5.0';
  const avgEaseOfUse = totalAppReviews > 0
    ? (appReviews.reduce((acc, f) => acc + f.interviewExperienceRating, 0) / totalAppReviews).toFixed(1)
    : '5.0';

  const ratingDistribution = useMemo(() => {
    return [5, 4, 3, 2, 1].map((stars) => {
      const count = appReviews.filter(r => r.overallRating === stars).length;
      const pct = totalAppReviews > 0 ? Math.round((count / totalAppReviews) * 100) : 0;
      return { stars, count, pct };
    });
  }, [appReviews, totalAppReviews]);

  const handleSubmitAppReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!writtenFeedback.trim()) {
      setFormError('Please write a brief review describing your experience with the app.');
      return;
    }

    const finalName = postAnonymously
      ? 'Anonymous User'
      : reviewerName.trim() || defaultDisplayName || 'HireBoost Candidate';

    const isSessionReview = Boolean(targetSession);

    StorageService.submitFeedback({
      sessionId: isSessionReview && sessionId ? sessionId : `app_review_${Date.now()}`,
      userId: currentUser ? currentUser.userId : `guest_${Date.now()}`,
      userName: finalName,
      feedbackType: isSessionReview ? 'interview' : 'app',
      interviewTopic: isSessionReview && targetSession ? targetSession.config.title : aspectFocus,
      domain: isSessionReview && targetSession ? targetSession.config.domain : 'Overall App',
      overallRating,
      difficultyRating: easeOfUseRating,
      questionQualityRating: aiQualityRating,
      interviewExperienceRating: toolsValueRating,
      writtenFeedback: writtenFeedback.trim(),
      suggestions: suggestions.trim(),
      isPublic: true
    });

    setAllFeedback(StorageService.getAllFeedback());
    setWrittenFeedback('');
    setSuggestions('');
    setFormError(null);
    setSubmittedNotice(true);
    setShowWriteForm(false);
    if (!isSessionReview) {
      setReviewScope('app');
    }
  };

  const StarPicker = ({
    value,
    onChange,
    label
  }: {
    value: number;
    onChange: (v: number) => void;
    label: string;
  }) => (
    <div className="flex items-center justify-between gap-2">
      <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{label}</span>
      <div className="flex items-center gap-1 shrink-0">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`Rate ${label} ${star} out of 5`}
            className="p-1 focus:outline-hidden hover:scale-110 transition-transform cursor-pointer"
          >
            <Star
              className={`w-4 h-4 ${
                star <= value
                  ? 'fill-amber-400 text-amber-400'
                  : isDark ? 'text-slate-700' : 'text-slate-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen py-10 transition-colors ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${
              isDark ? 'text-indigo-400' : 'text-indigo-600'
            }`}>
              <MessageSquare className="w-4 h-4" />
              <span>Reviews</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">User Reviews</h1>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              See what others think or share your feedback.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowWriteForm(prev => !prev);
              setSubmittedNotice(false);
            }}
            className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            {showWriteForm ? <X className="w-3.5 h-3.5" /> : <PenLine className="w-3.5 h-3.5" />}
            <span>{showWriteForm ? 'Close' : 'Write a Review'}</span>
          </button>
        </div>

        {/* Success Notice */}
        {submittedNotice && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Thank you for reviewing HireBoost! Your review has been published below.</span>
          </div>
        )}

        {/* Write App Review Form */}
        {showWriteForm && (
          <section
            className={`rounded-2xl border p-6 sm:p-7 space-y-5 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div>
              <h2 className="text-base font-bold">
                {targetSession ? `Review Session: ${targetSession.config.title}` : 'Write a Review on HireBoost'}
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Share how the overall platform, mock interviews, resume builder, and progress tracking worked for you.
              </p>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitAppReview} className="space-y-4">
              {/* Ratings Grid */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <StarPicker label="Overall App Rating" value={overallRating} onChange={setOverallRating} />
                <StarPicker label="UI & Ease of Use" value={easeOfUseRating} onChange={setEaseOfUseRating} />
                <StarPicker label="AI Questions & Feedback" value={aiQualityRating} onChange={setAiQualityRating} />
                <StarPicker label="Resume & Progress Tools" value={toolsValueRating} onChange={setToolsValueRating} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!targetSession && (
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Review Focus
                    </label>
                    <select
                      value={aspectFocus}
                      onChange={(e) => setAspectFocus(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      {APP_ASPECTS.map((aspect) => (
                        <option key={aspect} value={aspect}>{aspect}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Display Name
                    </label>
                    <label className={`flex items-center gap-1.5 text-[11px] cursor-pointer ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <input
                        type="checkbox"
                        checked={postAnonymously}
                        onChange={(e) => setPostAnonymously(e.target.checked)}
                        className="rounded border-slate-600"
                      />
                      <span>Post anonymously</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={postAnonymously}
                    placeholder="Your name (e.g., Aditi A.)"
                    value={postAnonymously ? 'Anonymous User' : reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Your Review
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="What did you like most about HireBoost? How has it helped your interview preparation?"
                  value={writtenFeedback}
                  onChange={(e) => setWrittenFeedback(e.target.value)}
                  className={`w-full p-3 text-xs rounded-lg border focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Suggestions for Improvement (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Share any feature requests or improvements you'd like to see..."
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWriteForm(false)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border cursor-pointer ${
                    isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg font-semibold text-xs bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish App Review</span>
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Overall App Rating Summary Card */}
        <section
          className={`rounded-2xl border p-6 sm:p-7 grid grid-cols-1 md:grid-cols-12 gap-6 items-center ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="md:col-span-4 space-y-2">
            <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Overall App Score
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-4xl font-bold font-mono tabular-nums text-amber-500 dark:text-amber-400">
                {avgAppRating}
              </span>
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/ 5.0</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(Number(avgAppRating))
                      ? 'fill-amber-400 text-amber-400'
                      : isDark ? 'text-slate-700' : 'text-slate-300'
                  }`}
                />
              ))}
              <span className={`text-xs ml-1.5 tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {totalAppReviews} app {totalAppReviews === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>

          <div className={`md:col-span-5 space-y-2 md:border-l md:pl-6 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            {ratingDistribution.map((row) => (
              <div key={row.stars} className="flex items-center gap-2.5 text-xs">
                <span className="w-7 font-mono tabular-nums text-right">{row.stars}★</span>
                <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
                <span className={`w-8 font-mono tabular-nums text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {row.count}
                </span>
              </div>
            ))}
          </div>

          <div className={`md:col-span-3 space-y-3 md:border-l md:pl-6 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div>
              <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>AI Evaluation Quality</div>
              <div className="text-lg font-bold font-mono tabular-nums">{avgAiQuality} / 5</div>
            </div>
            <div>
              <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Platform Usability</div>
              <div className="text-lg font-bold font-mono tabular-nums">{avgEaseOfUse} / 5</div>
            </div>
          </div>
        </section>

        {/* Reviews List */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold">
              {reviewScope === 'app' ? 'What Users Say About HireBoost' : 'All Community Reviews'}
            </h2>

            {/* Scope Tabs */}
            <div className={`inline-flex p-1 rounded-lg border self-start sm:self-auto ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setReviewScope('app')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                  reviewScope === 'app'
                    ? 'bg-indigo-600 text-white'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Overall App ({appReviews.length})
              </button>
              <button
                type="button"
                onClick={() => setReviewScope('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                  reviewScope === 'all'
                    ? 'bg-indigo-600 text-white'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Reviews ({allFeedback.filter(f => f.isPublic).length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedReviews.map((fb) => (
              <article
                key={fb.feedbackId}
                className={`p-6 rounded-xl border space-y-3 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">{fb.userName}</div>
                    <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {fb.interviewTopic} · {new Date(fb.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= fb.overallRating
                            ? 'fill-amber-400 text-amber-400'
                            : isDark ? 'text-slate-700' : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {fb.writtenFeedback}
                </p>

                {fb.suggestions && (
                  <div className={`pt-3 border-t text-xs ${
                    isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'
                  }`}>
                    <span className="font-semibold">Suggestion: </span>
                    <span>{fb.suggestions}</span>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
