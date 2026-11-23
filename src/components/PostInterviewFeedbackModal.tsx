import React, { useState } from 'react';
import {
  Star,
  CheckCircle2,
  Send,
  Sparkles,
  Clock,
  MessageSquare,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { InterviewSession } from '../types/hireboost';
import { StorageService } from '../services/storage';

interface PostInterviewFeedbackModalProps {
  session: InterviewSession;
  theme: 'dark' | 'light';
  timedOut?: boolean;
  autoSubmitReason?: string;
  onComplete: (submitted: boolean) => void;
}

const QUICK_IMPRESSION_TAGS = [
  'Realistic questions',
  'Good time pacing',
  'Challenging edge cases',
  'Clear prompts',
  'Helpful key points',
  'Smooth experience'
];

export const PostInterviewFeedbackModal: React.FC<PostInterviewFeedbackModalProps> = ({
  session,
  theme,
  timedOut = false,
  autoSubmitReason,
  onComplete
}) => {
  const isDark = theme === 'dark';
  const existing = StorageService.getFeedbackBySessionId(session.sessionId);

  const [overallRating, setOverallRating] = useState<number>(existing?.overallRating ?? 5);
  const [difficultyRating, setDifficultyRating] = useState<number>(existing?.difficultyRating ?? 4);
  const [questionQualityRating, setQuestionQualityRating] = useState<number>(existing?.questionQualityRating ?? 5);
  const [interviewExperienceRating, setInterviewExperienceRating] = useState<number>(existing?.interviewExperienceRating ?? 5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [writtenFeedback, setWrittenFeedback] = useState<string>(existing?.writtenFeedback ?? '');
  const [suggestions, setSuggestions] = useState<string>(existing?.suggestions ?? '');
  const [isPublic, setIsPublic] = useState<boolean>(existing?.isPublic ?? true);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const profile = StorageService.getUserProfile(session.userId);
    const nameParts = profile.name.trim().split(/\s+/);
    const anonymousName =
      nameParts.length > 1
        ? `${nameParts[0]} ${nameParts[1].charAt(0)}.`
        : nameParts[0] || 'Candidate';

    const tagSummary = selectedTags.length > 0 ? `Highlights: ${selectedTags.join(', ')}. ` : '';
    const finalComment =
      writtenFeedback.trim()
        ? `${tagSummary}${writtenFeedback.trim()}`
        : tagSummary
          ? `${tagSummary}Completed ${session.config.domain} (${session.config.difficulty}) round.`
          : `Rated ${overallRating}/5 for ${session.config.title} (${session.config.domain}).`;

    StorageService.submitFeedback({
      sessionId: session.sessionId,
      userId: session.userId,
      userName: anonymousName,
      interviewTopic: session.config.title,
      domain: session.config.domain,
      overallRating,
      difficultyRating,
      questionQualityRating,
      interviewExperienceRating,
      writtenFeedback: finalComment,
      suggestions: suggestions.trim(),
      isPublic
    });

    onComplete(true);
  };

  const StarRow = ({
    label,
    value,
    onChange
  }: {
    label: string;
    value: number;
    onChange: (val: number) => void;
  }) => (
    <div className="flex items-center justify-between gap-2">
      <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
        {label}
      </span>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`${label}: ${star} out of 5 stars`}
            className="p-0.5 hover:scale-110 transition-transform cursor-pointer focus:outline-hidden"
          >
            <Star
              className={`w-4 h-4 ${
                star <= value
                  ? 'fill-amber-400 text-amber-400'
                  : isDark
                    ? 'text-slate-700'
                    : 'text-slate-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border shadow-2xl p-6 sm:p-8 space-y-6 ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div
              className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${
                autoSubmitReason
                  ? 'bg-rose-500/15 border-rose-500/35 text-rose-400'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              }`}
            >
              {autoSubmitReason ? <ShieldAlert className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    autoSubmitReason ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {autoSubmitReason
                    ? 'Integrity Auto-Submit • Session Concluded'
                    : timedOut
                      ? 'Time Expired • Session Concluded'
                      : 'Interview Session Completed'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5">
                {autoSubmitReason ? 'Interview Automatically Submitted' : 'How was this interview session?'}
              </h2>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {autoSubmitReason
                  ? 'Your answers recorded so far have been saved and evaluated. You can review your detailed report next.'
                  : 'Your evaluation report is ready! Share a quick rating and review before viewing your detailed score breakdown.'}
              </p>
            </div>
          </div>
        </div>

        {autoSubmitReason && (
          <div
            role="alert"
            className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 ${
              isDark
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Auto-Submission Reason</span>
              <span>{autoSubmitReason}</span>
            </div>
          </div>
        )}

        {/* Completed Session Summary Pill */}
        <div
          className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 text-xs ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="space-y-0.5">
            <span className="font-bold block">{session.config.title}</span>
            <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {session.config.domain} • {session.config.difficulty} • {session.config.mode}
            </span>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-400 font-bold border border-indigo-500/25">
              {session.answers.length}/{session.questions.length} Answered
            </span>
            <span className="flex items-center space-x-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{session.config.durationMinutes}m limit</span>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Star Ratings Grid */}
          <div
            className={`p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 gap-3.5 ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <StarRow label="Overall Rating" value={overallRating} onChange={setOverallRating} />
            <StarRow label="Difficulty Rigor" value={difficultyRating} onChange={setDifficultyRating} />
            <StarRow label="Question Quality" value={questionQualityRating} onChange={setQuestionQualityRating} />
            <StarRow label="Session Experience" value={interviewExperienceRating} onChange={setInterviewExperienceRating} />
          </div>

          {/* Quick Impression Tags */}
          <div>
            <label className={`block text-xs font-bold mb-2 flex items-center space-x-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Quick Impressions (Optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_IMPRESSION_TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                        : isDark
                          ? 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {active ? `✓ ${tag}` : tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Written Feedback */}
          <div>
            <label className={`block text-xs font-bold mb-1.5 flex items-center space-x-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
              <span>Review & Feedback for This Session</span>
            </label>
            <textarea
              rows={3}
              placeholder="How realistic were the questions? Did the pacing and evaluation focus match your expectations?"
              value={writtenFeedback}
              onChange={(e) => setWrittenFeedback(e.target.value)}
              className={`w-full p-3 text-xs rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Suggestions */}
          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Suggestions for Improvement (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Include a follow-up system design question or coding scratchpad..."
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Anonymous Public Toggle */}
          <label className="flex items-center space-x-2 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded border-slate-600 text-indigo-600 focus:ring-indigo-500"
            />
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
              Share anonymously in Community Reviews to help other candidates
            </span>
          </label>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onComplete(false)}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                isDark
                  ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
            >
              Skip & View Evaluation Report
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 cursor-pointer transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Review & View Evaluation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
