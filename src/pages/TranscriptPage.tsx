import React, { useState } from 'react';
import {
  FileText,
  Download,
  ArrowLeft,
  Copy,
  Code2,
  Mic,
  CheckCircle2
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { downloadTranscriptPDF, downloadTranscriptTXT } from '../utils/pdfExport';

interface TranscriptPageProps {
  transcriptId: string;
  onNavigate: (view: string, extraParam?: string) => void;
  theme: 'dark' | 'light';
}

export const TranscriptPage: React.FC<TranscriptPageProps> = ({
  transcriptId,
  onNavigate,
  theme
}) => {
  const isDark = theme === 'dark';
  const [copiedNotice, setCopiedNotice] = useState(false);
  const transcript = StorageService.getTranscript(transcriptId);
  const session = transcript ? StorageService.getSessionById(transcript.sessionId) : null;
  const evaluation = session?.evaluationReportId ? StorageService.getEvaluation(session.evaluationReportId) : undefined;

  if (!transcript) {
    return (
      <div className={`min-h-screen py-16 text-center ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
        <p className="text-sm text-slate-400">Transcript not found.</p>
        <button
          onClick={() => onNavigate('progress_tracker')}
          className="mt-4 px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl"
        >
          Return to History &amp; Progress
        </button>
      </div>
    );
  }

  const handleCopyAll = () => {
    let text = `${transcript.interviewTitle}\nDomain: ${transcript.domain} (${transcript.difficulty})\nDate: ${new Date(transcript.generatedAt).toLocaleDateString()}\n\n`;
    transcript.conversation.forEach((item) => {
      text += `Q${item.questionNumber}: ${item.questionText}\nCandidate Answer: ${item.answerText}\n`;
      if (item.submittedCode) {
        text += `Submitted Code (${item.language || 'code'}):\n${item.submittedCode}\n`;
      }
      text += '\n';
    });
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedNotice(true);
    window.setTimeout(() => setCopiedNotice(false), 2500);
  };

  return (
    <div className={`min-h-screen py-10 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Back navigation */}
        <button
          onClick={() => onNavigate('progress_tracker')}
          className={`flex items-center space-x-1.5 text-xs font-semibold hover:underline cursor-pointer ${
            isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to History</span>
        </button>

        {/* Header Banner */}
        <div
          className={`p-6 sm:p-7 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <FileText className="w-4 h-4" />
              <span>Transcript</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">{transcript.interviewTitle}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
              <span>{transcript.domain}</span>
              <span>•</span>
              <span className="font-semibold text-amber-400">{transcript.difficulty}</span>
              <span>•</span>
              <span>{transcript.durationMinutes} mins</span>
              <span>•</span>
              <span className="font-mono text-[11px]">{transcript.transcriptId}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                copiedNotice
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : isDark
                    ? 'bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-300'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
              title="Copy to clipboard"
            >
              {copiedNotice ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copiedNotice ? 'Copied!' : 'Copy Text'}</span>
            </button>
            <button
              onClick={() => downloadTranscriptTXT(transcript, evaluation)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                isDark ? 'bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              Download TXT
            </button>
            <button
              onClick={() => downloadTranscriptPDF(transcript, evaluation)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="space-y-4">
          {transcript.conversation.map((exchange, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-3xl border space-y-4 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              {/* Question */}
              <div className="flex items-start space-x-3">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-mono shrink-0">
                  Q{exchange.questionNumber}
                </span>
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        exchange.questionType === 'coding'
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                          : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                      }`}
                    >
                      {exchange.questionType === 'coding' ? (
                        <Code2 className="w-3 h-3" />
                      ) : (
                        <Mic className="w-3 h-3" />
                      )}
                      <span>{exchange.questionType === 'coding' ? 'Timed Coding' : 'Voice Response'}</span>
                    </span>

                    {exchange.submissionType && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          exchange.submissionType === 'auto'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {exchange.submissionType === 'auto' ? 'Auto Submission' : 'Manual Submission'}
                      </span>
                    )}

                    {typeof exchange.isProperSolution === 'boolean' && exchange.questionType !== 'coding' && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          exchange.isProperSolution
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {exchange.isProperSolution ? 'Valid Solution' : 'Too Brief / Off-Topic'}
                      </span>
                    )}

                    {typeof exchange.evaluationScore === 'number' && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                          exchange.evaluationScore >= 70
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : exchange.evaluationScore >= 40
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        Score: {exchange.evaluationScore}/100
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold leading-snug">{exchange.questionText}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    <span>Recorded: {exchange.timestamp}</span>
                    <span>•</span>
                    <span>Duration: {exchange.durationSeconds}s</span>
                    {exchange.assignedTimeLimitSeconds ? (
                      <>
                        <span>•</span>
                        <span>Limit: {Math.round(exchange.assignedTimeLimitSeconds / 60)}m</span>
                      </>
                    ) : null}
                    {exchange.executionSummary && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">{exchange.executionSummary}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Answer Card */}
              <div
                className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed space-y-2 ${
                  isDark ? 'bg-slate-950/80 border-slate-800/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  {exchange.questionType === 'coding' ? 'Submission Summary:' : 'Final Response:'}
                </div>
                <p className="whitespace-pre-wrap">{exchange.finalResponse || exchange.answerText}</p>

                {exchange.originalTranscription &&
                  exchange.originalTranscription !== (exchange.finalResponse || exchange.answerText) && (
                    <div className="pt-2 border-t border-slate-800/40 text-xs text-slate-400">
                      <span className="font-semibold">Original Live Transcript: </span>
                      <span>{exchange.originalTranscription}</span>
                    </div>
                  )}

                {((exchange.matchedKeywords && exchange.matchedKeywords.length > 0) ||
                  (exchange.missingKeywords && exchange.missingKeywords.length > 0)) && (
                  <div className="pt-2 border-t border-slate-800/40 flex flex-wrap gap-3 text-[11px]">
                    {exchange.matchedKeywords && exchange.matchedKeywords.length > 0 && (
                      <span className="text-emerald-400">
                        <strong>Matched Keywords:</strong> {exchange.matchedKeywords.join(', ')}
                      </span>
                    )}
                    {exchange.missingKeywords && exchange.missingKeywords.length > 0 && (
                      <span className="text-amber-400">
                        <strong>Missing Concepts:</strong> {exchange.missingKeywords.join(', ')}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {exchange.submittedCode !== undefined && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
                  <div className="px-3.5 py-2 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Submitted Code ({exchange.language || 'code'})</span>
                    <span>
                      {exchange.completedWithinTime === false ? 'Time Expired' : 'Submitted Within Time'}
                    </span>
                  </div>
                  <pre className="p-3.5 text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap">
                    {exchange.submittedCode.trim() ? exchange.submittedCode : '// (Empty code submission)'}
                  </pre>
                </div>
              )}

              {exchange.interviewerNotes && (
                <div className="text-xs italic text-indigo-400/90 pl-2 border-l-2 border-indigo-500/40">
                  Note: {exchange.interviewerNotes}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Evaluation Shortcut */}
        {evaluation && (
          <div
            className={`p-6 rounded-3xl border flex items-center justify-between ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div>
              <h4 className="text-sm font-bold">Interview Report Ready</h4>
              <p className="text-xs text-slate-400">Overall Score: {evaluation.overallScore}/100</p>
            </div>
            <button
              onClick={() => onNavigate('performance_evaluation', evaluation.reportId)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
            >
              View Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
