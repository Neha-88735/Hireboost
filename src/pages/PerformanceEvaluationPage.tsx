import React, { useState } from 'react';
import {
  Award,
  Download,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  MessageSquare,
  Star,
  Video,
  Mic,
  ShieldCheck,
  Code2
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { downloadTranscriptPDF, downloadTranscriptTXT } from '../utils/pdfExport';
import { PostInterviewFeedbackModal } from '../components/PostInterviewFeedbackModal';

interface PerformanceEvaluationPageProps {
  reportId: string;
  onNavigate: (view: string, extraParam?: string) => void;
  theme: 'dark' | 'light';
}

export const PerformanceEvaluationPage: React.FC<PerformanceEvaluationPageProps> = ({
  reportId,
  onNavigate,
  theme
}) => {
  const isDark = theme === 'dark';
  const [, setRefreshTick] = useState(0);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  const report = StorageService.getEvaluation(reportId);
  const session = report ? StorageService.getSessionById(report.sessionId) : null;
  const transcript = session?.transcriptId ? StorageService.getTranscript(session.transcriptId) : null;
  const sessionFeedback = session ? StorageService.getFeedbackBySessionId(session.sessionId) : undefined;

  if (!report || !session) {
    return (
      <div className={`min-h-screen py-16 text-center ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
        <p className="text-sm text-slate-400">Evaluation report not found.</p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="mt-4 px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const breakdown = report.breakdown;

  // Circular Score Badge Helper
  const renderCircularScore = (label: string, score: number, colorClass: string, strokeColor: string) => {
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              className={`stroke-current ${isDark ? 'text-slate-800' : 'text-slate-200'}`}
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={strokeColor}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className={`text-xl font-black font-mono ${colorClass}`}>{score}</span>
            <span className="text-[9px] text-slate-400 uppercase font-semibold">/ 100</span>
          </div>
        </div>
        <span className="text-xs font-bold mt-2 text-center text-slate-300">{label}</span>
      </div>
    );
  };

  return (
    <div className={`min-h-screen py-10 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Award className="w-4 h-4" />
              <span>Report</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Interview Report</h1>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="font-mono text-indigo-400 font-bold">{session.config.title}</span> • {report.reportId}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5">
            {transcript && (
              <>
                <button
                  onClick={() => downloadTranscriptPDF(transcript, report)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => downloadTranscriptTXT(transcript, report)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isDark ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>TXT</span>
                </button>
              </>
            )}

            <button
              onClick={() => setFeedbackModalOpen(true)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer ${
                sessionFeedback
                  ? isDark
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-linear-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white'
              }`}
            >
              {sessionFeedback ? (
                <>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>Rated {sessionFeedback.overallRating}/5 • Edit Review</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Rate &amp; Review Session</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Circular Score Breakdown Hero */}
        <div className={`p-8 rounded-3xl border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Your Scores
            </span>
            <div className="mt-2 text-4xl font-black text-indigo-400">
              {report.overallScore} <span className="text-xl font-normal text-slate-400">/ 100</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Overall Score</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-slate-800/50">
            {renderCircularScore('Technical', breakdown.technicalScore, 'text-blue-400', '#60a5fa')}
            {renderCircularScore('Communication', breakdown.communicationScore, 'text-purple-400', '#c084fc')}
            {renderCircularScore('Confidence', breakdown.confidenceScore, 'text-pink-400', '#f472b6')}
            {renderCircularScore('Answers', breakdown.responseQualityScore, 'text-emerald-400', '#34d399')}
          </div>
        </div>

        {/* Written Feedback Banner */}
        <div className={`p-6 rounded-3xl border space-y-4 ${
          isDark
            ? 'bg-linear-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border-indigo-500/30'
            : 'bg-linear-to-r from-indigo-50 to-purple-50 border-indigo-200'
        }`}>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-2 flex items-center space-x-2">
              <Award className="w-4 h-4" />
              <span>Summary</span>
            </h2>
            <p className="text-sm leading-relaxed font-medium">
              &ldquo;{report.writtenFeedback}&rdquo;
            </p>
          </div>

          {(report.deliveryNotes || report.mediaSummary) && (
            <div className={`pt-4 border-t flex flex-col gap-3 ${
              isDark ? 'border-indigo-500/20' : 'border-indigo-200'
            }`}>
              {report.deliveryNotes && (
                <div className="text-xs leading-relaxed">
                  <span className="font-bold text-indigo-400">Audio, Video &amp; Confidence Delivery: </span>
                  <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{report.deliveryNotes}</span>
                </div>
              )}

              {report.mediaSummary && (
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold ${
                    isDark ? 'bg-slate-900/80 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <Video className={`w-3 h-3 ${report.mediaSummary.cameraUsed ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{report.mediaSummary.cameraUsed ? 'Live Video Checked' : 'Camera Off'}</span>
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold ${
                    isDark ? 'bg-slate-900/80 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <Mic className={`w-3 h-3 ${report.mediaSummary.micUsed ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{report.mediaSummary.micUsed ? 'Live Audio Evaluated' : 'Text Only'}</span>
                  </span>
                  {report.mediaSummary.wordsPerMinute > 0 && (
                    <span className={`px-2.5 py-1 rounded-lg border font-mono font-semibold ${
                      isDark ? 'bg-slate-900/80 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                    }`}>
                      {report.mediaSummary.wordsPerMinute} WPM
                    </span>
                  )}
                  <span className={`px-2.5 py-1 rounded-lg border font-mono font-semibold ${
                    isDark ? 'bg-slate-900/80 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    {report.mediaSummary.recordingDurationSeconds}s live call
                  </span>
                  {(() => {
                    const m = report.mediaSummary!;
                    const totalProctorEvents =
                      (m.tabSwitches || 0) +
                      (m.cameraAlerts || 0) +
                      (m.multiplePeopleAlerts || 0) +
                      (m.backgroundNoiseAlerts || 0) +
                      (m.gadgetAlerts || 0);
                    return (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold ${
                          m.autoSubmittedDueToDiscrepancy
                            ? isDark
                              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                              : 'bg-rose-50 border-rose-200 text-rose-700'
                            : totalProctorEvents === 0
                              ? isDark
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : isDark
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>
                          {m.autoSubmittedDueToDiscrepancy
                            ? `Auto-Submitted (${m.discrepancyStrikes || 3}/3 Discrepancies)`
                            : totalProctorEvents === 0
                              ? 'Live Monitor: Verified (Not Stored)'
                              : `Proctoring: ${m.multiplePeopleAlerts || 0} multi-person · ${m.gadgetAlerts || 0} gadget · ${m.backgroundNoiseAlerts || 0} noise · ${m.tabSwitches || 0} tab`}
                        </span>
                      </span>
                    );
                  })()}
                </div>
              )}

              {report.mediaSummary?.autoSubmittedDueToDiscrepancy && (
                <div
                  role="alert"
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    isDark
                      ? 'bg-rose-950/40 border-rose-500/35 text-rose-200'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Integrity Auto-Submission: </span>
                    <span>
                      {report.mediaSummary.autoSubmitReason ||
                        'This session was automatically submitted due to repeated proctoring discrepancies.'}
                    </span>
                  </div>
                </div>
              )}

              {(() => {
                const codingAnswers = session.answers.filter((a) => a.questionType === 'coding');
                if (codingAnswers.length === 0) return null;
                const totalPassed = codingAnswers.reduce((s, a) => s + (a.executionResults?.passedCount || 0), 0);
                const totalCases = codingAnswers.reduce((s, a) => s + (a.executionResults?.totalCount || 0), 0);
                const autoCount = codingAnswers.filter((a) => a.submissionType === 'auto').length;
                const manualCount = codingAnswers.filter((a) => a.submissionType === 'manual').length;
                return (
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold ${
                      isDark ? 'bg-slate-900/80 border-slate-700 text-indigo-300' : 'bg-white border-slate-200 text-indigo-700'
                    }`}>
                      <Code2 className="w-3 h-3" />
                      <span>{codingAnswers.length} Timed Coding {codingAnswers.length === 1 ? 'Problem' : 'Problems'}</span>
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg border font-mono font-semibold ${
                      isDark ? 'bg-slate-900/80 border-slate-700 text-emerald-300' : 'bg-white border-slate-200 text-emerald-700'
                    }`}>
                      {totalPassed}/{totalCases} Test Cases Passed
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg border font-semibold ${
                      isDark ? 'bg-slate-900/80 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                    }`}>
                      {manualCount} Manual · {autoCount} Auto Submitted
                    </span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Strengths & Weaknesses Two-Column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className={`p-6 rounded-3xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <h3 className="text-sm font-bold flex items-center space-x-2 text-emerald-400 mb-4">
              <CheckCircle2 className="w-4 h-4" />
              <span>What Went Well</span>
            </h3>
            <ul className="space-y-2.5">
              {report.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-xs leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses / Opportunities */}
          <div className={`p-6 rounded-3xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <h3 className="text-sm font-bold flex items-center space-x-2 text-amber-400 mb-4">
              <AlertTriangle className="w-4 h-4" />
              <span>What to Improve</span>
            </h3>
            <ul className="space-y-2.5">
              {report.weaknesses.map((wk, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-xs leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{wk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Concrete Actionable Improvement Suggestions */}
        <div className={`p-6 sm:p-7 rounded-3xl border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <h3 className="text-sm font-bold flex items-center space-x-2 text-purple-400 mb-4">
            <Lightbulb className="w-4 h-4" />
            <span>Next Steps</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {report.suggestions.map((sug, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex items-start space-x-2.5 ${
                  isDark ? 'bg-slate-950/70 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <span className="font-mono font-bold text-indigo-400 shrink-0">#{idx + 1}</span>
                <span>{sug}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Navigation CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/40">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`text-xs font-semibold hover:underline cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ← Return to Student Dashboard
          </button>

          <div className="flex gap-3">
            {transcript && (
              <button
                onClick={() => onNavigate('transcript', transcript.transcriptId)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-100 text-slate-800'
                }`}
              >
                View Full Transcript
              </button>
            )}
            <button
              onClick={() => onNavigate('book_interview')}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Book Another Interview</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {feedbackModalOpen && (
        <PostInterviewFeedbackModal
          session={session}
          theme={theme}
          onComplete={() => {
            setFeedbackModalOpen(false);
            setRefreshTick(t => t + 1);
          }}
        />
      )}
    </div>
  );
};
