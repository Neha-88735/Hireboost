import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Camera,
  CheckCircle2,
  Clock,
  Code2,
  Eye,
  HelpCircle,
  Loader2,
  Lock,
  MessageCircle,
  Mic,
  MicOff,
  Pause,
  PhoneOff,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User as UserIcon,
  Users,
  Video
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StorageService } from '../services/storage';
import {
  CodingLanguage,
  CodingSubmissionType,
  ConversationTurnContext,
  InterviewQuestionItem,
  InterviewSession
} from '../types/hireboost';
import { speakQuestion, stopSpeaking } from '../utils/speech';
import { LiveTranscriberStatus, LiveVoiceTranscriber } from '../utils/liveTranscriber';
import {
  DetectedGadgetBox,
  DetectedPersonBox,
  detectPeopleInVideoFrame,
  preloadPersonDetector
} from '../utils/personDetector';
import { CodingWorkspace, CodingSubmissionOverlay } from '../components/CodingWorkspace';
import {
  getCodingTimeLimitSeconds,
  getStoredCodingTimeLimits,
  getStoredVoiceTimeLimits,
  getVoiceTimeLimitSeconds
} from '../config/interviewConfig';
import { PostInterviewFeedbackModal } from '../components/PostInterviewFeedbackModal';

interface InterviewSessionPageProps {
  session: InterviewSession;
  onFinishSession: (completedSession: InterviewSession) => void;
  onExit: () => void;
  theme: 'dark' | 'light';
}

interface ConversationMessage {
  id: string;
  sender: 'ai' | 'user' | 'monitor';
  text: string;
  time: string;
}

interface ProblemRuntimeEntry {
  assignedTimeLimitSeconds: number;
  startTimestamp?: number;
  deadlineTimestamp?: number;
  draftCode?: string;
  draftLanguage?: CodingLanguage;
  submitted?: boolean;
}

const REPEAT_PHRASE_REGEX =
  /\b(repeat|say that again|didn'?t catch|did not catch|didn'?t get|did not get|didn'?t hear|did not hear|come again|pardon|once more|one more time)\b/i;

const CLARIFY_PHRASE_REGEX =
  /\b(clarify|clarification|didn'?t understand|did not understand|explain the question|what do you mean|rephrase)\b/i;

const MAX_DISCREPANCY_STRIKES = 3;
const DISCREPANCY_HOLD_MS = 2000;

function playProctorBeep(isFinalAutoSubmit: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isFinalAutoSubmit ? 440 : 660, ctx.currentTime);
    if (isFinalAutoSubmit) {
      osc.frequency.setValueAtTime(330, ctx.currentTime + 0.14);
    }
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isFinalAutoSubmit ? 0.32 : 0.18));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (isFinalAutoSubmit ? 0.34 : 0.2));
    osc.onended = () => {
      ctx.close().catch(() => {});
    };
  } catch {
    // ignore if audio context blocked
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = typeof reader.result === 'string' ? reader.result : '';
      const idx = res.indexOf(',');
      resolve(idx >= 0 ? res.slice(idx + 1) : res);
    };
    reader.onerror = () => reject(new Error('Failed to read audio buffer'));
    reader.readAsDataURL(blob);
  });
}

function getStarterCodeFor(q: InterviewQuestionItem, lang: CodingLanguage): string {
  if (q.starterCode?.[lang]) return q.starterCode[lang] || '';
  const fn = q.functionName || 'solution';
  if (lang === 'python') {
    return `def ${fn}(*args):\n    # Write your solution here\n    pass\n`;
  }
  return `function ${fn}() {\n  // Write your solution here\n}\n`;
}

export const InterviewSessionPage: React.FC<InterviewSessionPageProps> = ({
  session: initialSession,
  onFinishSession,
  theme
}) => {
  const [session, setSession] = useState<InterviewSession>(
    () => StorageService.getSessionById(initialSession.sessionId) || initialSession
  );
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  // Voice Response & Wispr-Flow Transcription State
  const [answerInput, setAnswerInput] = useState<string>('');
  const [interimSpeech, setInterimSpeech] = useState<string>('');
  const [originalTranscription, setOriginalTranscription] = useState<string>('');
  const [sttStatus, setSttStatus] = useState<LiveTranscriberStatus>('idle');
  const [sttProviderLabel, setSttProviderLabel] = useState<string>('Gemini Live STT');
  const [isSilentPause, setIsSilentPause] = useState<boolean>(false);
  const [isMicPaused, setIsMicPaused] = useState<boolean>(false);

  // Per-question Voice Follow-Up Context & Countdown Timer State
  const [followUpsCount, setFollowUpsCount] = useState<number>(0);
  const askedFollowUpsRef = useRef<string[]>([]);
  const priorVoiceAnswerRef = useRef<string>('');
  const [voiceRemainingSeconds, setVoiceRemainingSeconds] = useState<number>(180);
  const [voiceAssignedLimitSeconds, setVoiceAssignedLimitSeconds] = useState<number>(180);
  const [voiceWarningThreshold, setVoiceWarningThreshold] = useState<30 | 15 | null>(null);
  const [voiceTimeExpiredLocked, setVoiceTimeExpiredLocked] = useState<boolean>(false);
  const [lastTurnFeedback, setLastTurnFeedback] = useState<{
    questionNumber: number;
    text: string;
    isProperSolution: boolean;
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    submissionType: 'manual' | 'auto';
  } | null>(null);

  // Coding Workspace State
  const [codingLanguage, setCodingLanguage] = useState<CodingLanguage>('javascript');
  const [codingCode, setCodingCode] = useState<string>('');
  const [codingRemainingSeconds, setCodingRemainingSeconds] = useState<number>(0);
  const [codingAssignedLimitSeconds, setCodingAssignedLimitSeconds] = useState<number>(1200);
  const [codingLocked, setCodingLocked] = useState<boolean>(false);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [codingRunResult, setCodingRunResult] = useState<{
    executionResults: any;
    testCaseResults: any[];
  } | null>(null);
  const [codingRunError, setCodingRunError] = useState<string | null>(null);
  const [codingSubmissionOverlay, setCodingSubmissionOverlay] = useState<CodingSubmissionOverlay | null>(null);
  const [activeWarningThreshold, setActiveWarningThreshold] = useState<120 | 60 | 30 | null>(null);

  // Submission & Lifecycle State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isAiTransitioning, setIsAiTransitioning] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [completedSessionForReview, setCompletedSessionForReview] = useState<InterviewSession | null>(null);
  const [didTimeOut, setDidTimeOut] = useState<boolean>(false);
  const [confirmEndOpen, setConfirmEndOpen] = useState<boolean>(false);
  const [showKeyPoints, setShowKeyPoints] = useState<boolean>(false);

  // Session Timers (Server-timestamp authoritative)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialSession.config.durationMinutes * 60);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // AI Conversational State
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [turnLabel, setTurnLabel] = useState<string>('Initializing Session...');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);

  // Live Audio/Video State (live-only, zero recording/storage)
  const [hasCameraStream, setHasCameraStream] = useState<boolean>(false);
  const [hasMicStream, setHasMicStream] = useState<boolean>(false);
  const [hardwareBlockedMsg, setHardwareBlockedMsg] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // AI Live Proctoring State
  const [tabSwitches, setTabSwitches] = useState<number>(0);
  const [cameraCoveredCount, setCameraCoveredCount] = useState<number>(0);
  const [multiplePeopleCount, setMultiplePeopleCount] = useState<number>(0);
  const [backgroundNoiseCount, setBackgroundNoiseCount] = useState<number>(0);
  const [gadgetAlertsCount, setGadgetAlertsCount] = useState<number>(0);
  const [discrepancyStrikes, setDiscrepancyStrikes] = useState<number>(0);
  const [autoSubmitReasonState, setAutoSubmitReasonState] = useState<string | null>(null);
  const [detectedPersonCount, setDetectedPersonCount] = useState<number>(1);
  const [detectedPersonBoxes, setDetectedPersonBoxes] = useState<DetectedPersonBox[]>([]);
  const [detectedGadgets, setDetectedGadgets] = useState<DetectedGadgetBox[]>([]);
  const [multiPersonHoldMs, setMultiPersonHoldMs] = useState<number>(0);
  const [gadgetHoldMs, setGadgetHoldMs] = useState<number>(0);
  const [noiseHoldMs, setNoiseHoldMs] = useState<number>(0);
  const [codingPipMinimized, setCodingPipMinimized] = useState<boolean>(false);
  const [cvEngineActive, setCvEngineActive] = useState<boolean>(false);
  const [multiPersonError, setMultiPersonError] = useState<string | null>(null);
  const [gadgetError, setGadgetError] = useState<string | null>(null);
  const [backgroundNoiseAlert, setBackgroundNoiseAlert] = useState<string | null>(null);
  const [proctorAlertBanner, setProctorAlertBanner] = useState<string | null>(null);

  // Authoritative Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriberRef = useRef<LiveVoiceTranscriber | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const serverClockOffsetRef = useRef<number>(0);
  const sessionStartedAtRef = useRef<number>(Date.now());
  const sessionDeadlineTsRef = useRef<number>(Date.now() + initialSession.config.durationMinutes * 60 * 1000);
  const problemRuntimeRef = useRef<Record<string, ProblemRuntimeEntry>>({});
  const problemDeadlineTsRef = useRef<number>(0);
  const warnedThresholdsRef = useRef<Set<string>>(new Set());
  const codingSubmitLockRef = useRef<Set<string>>(new Set());
  const voiceSubmitLockRef = useRef<Set<string>>(new Set());
  const voiceInFlightRef = useRef<boolean>(false);
  const isMicPausedRef = useRef<boolean>(false);
  const userManuallyEditedVoiceRef = useRef<boolean>(false);
  const sttStatusRef = useRef<LiveTranscriberStatus>('idle');
  const draftSaveTimerRef = useRef<number | null>(null);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

  // Fresh mutable refs for timers & closures
  const sessionRef = useRef<InterviewSession>(session);
  const currentIdxRef = useRef<number>(0);
  const codingCodeRef = useRef<string>('');
  const codingLanguageRef = useRef<CodingLanguage>('javascript');
  const answerInputRef = useRef<string>('');
  const interimSpeechRef = useRef<string>('');
  const originalTranscriptionRef = useRef<string>('');
  const conversationRef = useRef<ConversationMessage[]>([]);
  const isAiSpeakingRef = useRef<boolean>(false);
  const hasEndedRef = useRef<boolean>(false);

  const cameraOnSamplesRef = useRef<number[]>([]);
  const audioLevelSamplesRef = useRef<number[]>([]);
  const tabSwitchesRef = useRef<number>(0);
  const cameraCoveredRef = useRef<number>(0);
  const multiplePeopleRef = useRef<number>(0);
  const backgroundNoiseRef = useRef<number>(0);
  const gadgetAlertsRef = useRef<number>(0);
  const discrepancyStrikesRef = useRef<number>(0);
  const discrepancyAutoSubmitRef = useRef<boolean>(false);
  const lastStrikeAtRef = useRef<number>(0);
  const registerDiscrepancyStrikeRef = useRef<
    (kind: 'multiple_people' | 'gadget' | 'excessive_noise', detail: string) => void
  >(() => {});
  const handleCompleteInterviewRef = useRef<
    (
      timedOut?: boolean,
      latestSessionSnapshot?: InterviewSession,
      discrepancyAutoSubmit?: { autoSubmittedReason: string }
    ) => Promise<void>
  >(async () => {});
  const proctorFrameInFlightRef = useRef<boolean>(false);
  const cameraDropsRef = useRef<number>(0);
  const micDropsRef = useRef<number>(0);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    currentIdxRef.current = currentIdx;
  }, [currentIdx]);

  useEffect(() => {
    codingCodeRef.current = codingCode;
  }, [codingCode]);

  useEffect(() => {
    codingLanguageRef.current = codingLanguage;
  }, [codingLanguage]);

  useEffect(() => {
    answerInputRef.current = answerInput;
  }, [answerInput]);

  useEffect(() => {
    interimSpeechRef.current = interimSpeech;
  }, [interimSpeech]);

  useEffect(() => {
    originalTranscriptionRef.current = originalTranscription;
  }, [originalTranscription]);

  useEffect(() => {
    isMicPausedRef.current = isMicPaused;
  }, [isMicPaused]);

  useEffect(() => {
    sttStatusRef.current = sttStatus;
  }, [sttStatus]);

  useEffect(() => {
    conversationRef.current = conversation;
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const appendMessage = useCallback((sender: ConversationMessage['sender'], text: string) => {
    if (!text.trim()) return;
    setConversation((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        sender,
        text: text.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, []);

  const getServerNow = useCallback(() => Date.now() + serverClockOffsetRef.current, []);

  const formatTime = (totalSeconds: number) => {
    const safe = Math.max(0, Math.floor(totalSeconds));
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start or resume LiveVoiceTranscriber for voice questions
  const startTranscriberOnStream = useCallback(
    (stream: MediaStream, initialDraft = '') => {
      if (transcriberRef.current) {
        transcriberRef.current.stop();
        transcriberRef.current = null;
      }

      const transcriber = new LiveVoiceTranscriber({
        onStatusChange: (status, label) => {
          sttStatusRef.current = status;
          setSttStatus(status);
          if (label) setSttProviderLabel(label);
        },
        onInterimText: (interim) => {
          if (!isAiSpeakingRef.current) {
            interimSpeechRef.current = interim;
            setInterimSpeech(interim);
          }
        },
        onFinalText: (fullFinalized, delta) => {
          if (isAiSpeakingRef.current || !delta) return;
          interimSpeechRef.current = '';
          setInterimSpeech('');
          setOriginalTranscription((prev) => {
            const nextOrig = prev ? `${prev} ${delta}`.trim() : fullFinalized;
            originalTranscriptionRef.current = nextOrig;
            return nextOrig;
          });
          setAnswerInput((prev) => {
            const cleanPrev = prev.trim();
            const nextVal = !cleanPrev ? fullFinalized : `${cleanPrev} ${delta}`.trim();
            answerInputRef.current = nextVal;
            const qId = sessionRef.current.questions[currentIdxRef.current]?.questionId;
            if (qId) {
              persistDraftDebounced({ questionId: qId, voiceDraft: nextVal });
            }
            return nextVal;
          });
        },
        onAudioLevel: (lvl) => {
          setAudioLevel(lvl);
          audioLevelSamplesRef.current.push(lvl);
        },
        onSilenceStateChange: (silent) => {
          setIsSilentPause(silent);
        },
        onBackgroundNoiseChange: (detected, _noiseScore, reason) => {
          if (detected) {
            const msg =
              reason || 'Excessive background noise detected on your microphone. Please quiet your surroundings.';
            setBackgroundNoiseAlert(msg);
          } else {
            setBackgroundNoiseAlert(null);
            setNoiseHoldMs(0);
          }
        },
        onExcessiveNoiseHold: (holdMs, triggeredAttempt, _noiseScore, reason) => {
          setNoiseHoldMs(holdMs);
          if (triggeredAttempt) {
            const msg =
              reason || 'Excessive background noise detected continuously for over 2 seconds.';
            setBackgroundNoiseAlert(msg);
            setNoiseHoldMs(0);
            registerDiscrepancyStrikeRef.current('excessive_noise', msg);
          }
        },
        onVoiceCommand: (cmd, utterance) => {
          if (cmd === 'repeat') void onRepeatRef.current(utterance);
          if (cmd === 'clarify') void onClarifyRef.current(utterance);
        }
      });

      if (initialDraft) {
        transcriber.setFinalizedTextManual(initialDraft);
      }

      transcriberRef.current = transcriber;
      transcriber.start(stream, { domain: sessionRef.current.config.domain });
      if (isAiSpeakingRef.current || isMicPausedRef.current) {
        transcriber.pause();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const onRepeatRef = useRef<(trigger?: string) => Promise<void>>(async () => {});
  const onClarifyRef = useRef<(trigger?: string) => Promise<void>>(async () => {});

  const speakWithPromise = useCallback((text: string, resumeAfter = true): Promise<void> => {
    return new Promise((resolve) => {
      if (!text.trim()) {
        resolve();
        return;
      }
      isAiSpeakingRef.current = true;
      setIsAiSpeaking(true);
      setTurnLabel('AI Host Speaking...');
      transcriberRef.current?.pause();
      let settled = false;

      const done = () => {
        if (settled) return;
        settled = true;
        isAiSpeakingRef.current = false;
        setIsAiSpeaking(false);
        const curQ = sessionRef.current.questions[currentIdxRef.current];
        if (curQ?.questionType === 'coding') {
          setTurnLabel('Timed Coding Round Active');
        } else if (resumeAfter) {
          setTurnLabel('Your Turn — Speak Now');
          if (!isMicPausedRef.current && !voiceSubmitLockRef.current.has(curQ?.questionId || '')) {
            transcriberRef.current?.resume();
          }
        }
        resolve();
      };

      const maxSpeechMs = Math.min(18000, Math.max(2500, text.split(/\s+/).length * 440));
      const fallbackTimer = window.setTimeout(done, maxSpeechMs);

      speakQuestion(text, () => {
        window.clearTimeout(fallbackTimer);
        done();
      });
    });
  }, []);

  const handleRepeatQuestion = useCallback(
    async (spokenTrigger?: string) => {
      if (hasEndedRef.current || isEvaluating) return;
      const idx = currentIdxRef.current;
      const q = sessionRef.current.questions[idx];
      if (!q) return;

      if (spokenTrigger) appendMessage('user', spokenTrigger);

      setIsAiTransitioning(true);
      let intro = `No problem at all. Let me repeat question ${idx + 1} clearly for you.`;
      try {
        const resp = await fetch('/api/ai/converse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'repeat',
            domain: sessionRef.current.config.domain,
            subtopic: sessionRef.current.config.subtopic || '',
            difficulty: sessionRef.current.config.difficulty,
            currentQuestion: q.questionText,
            questionNumber: idx + 1,
            totalQuestions: sessionRef.current.questions.length
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data?.replyText) intro = data.replyText;
        }
      } catch {
        // default intro
      }
      setIsAiTransitioning(false);

      const fullRepeat = `${intro} ${q.questionText}`;
      appendMessage('ai', fullRepeat);
      await speakWithPromise(fullRepeat);
    },
    [appendMessage, isEvaluating, speakWithPromise]
  );

  const handleClarifyQuestion = useCallback(
    async (spokenTrigger?: string) => {
      if (hasEndedRef.current || isEvaluating || isAiTransitioning) return;
      const idx = currentIdxRef.current;
      const q = sessionRef.current.questions[idx];
      if (!q) return;

      if (spokenTrigger) appendMessage('user', spokenTrigger);

      setIsAiTransitioning(true);
      setTurnLabel('AI Clarifying...');
      let reply =
        'Sure — focus on explaining the core mechanism first, then share one practical example and any key trade-offs.';
      try {
        const resp = await fetch('/api/ai/converse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'clarify',
            domain: sessionRef.current.config.domain,
            subtopic: sessionRef.current.config.subtopic || '',
            difficulty: sessionRef.current.config.difficulty,
            currentQuestion: q.questionText,
            candidateUtterance: spokenTrigger || '',
            conversationHistory: conversationRef.current
              .filter((m) => m.sender !== 'monitor')
              .slice(-8)
              .map((m) => ({ sender: m.sender, text: m.text })),
            questionNumber: idx + 1,
            totalQuestions: sessionRef.current.questions.length
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data?.replyText) reply = data.replyText;
        }
      } catch {
        // fallback reply
      }
      setIsAiTransitioning(false);

      appendMessage('ai', reply);
      await speakWithPromise(reply);
    },
    [appendMessage, isAiTransitioning, isEvaluating, speakWithPromise]
  );

  useEffect(() => {
    onRepeatRef.current = handleRepeatQuestion;
    onClarifyRef.current = handleClarifyQuestion;
  }, [handleRepeatQuestion, handleClarifyQuestion]);

  // Live-only A/V initializer (no session video/audio storage)
  const startMandatoryMedia = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHardwareBlockedMsg('Camera & microphone API unavailable in this browser. Text input fallback is active.');
      setSttStatus('unavailable');
      setSttProviderLabel('Text Input Fallback');
      return;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      setHardwareBlockedMsg(null);
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        setHardwareBlockedMsg('Camera access was blocked. Microphone voice recognition remains active.');
      } catch {
        setHasCameraStream(false);
        setHasMicStream(false);
        setSttStatus('unavailable');
        setSttProviderLabel('Text Input Fallback');
        setHardwareBlockedMsg(
          'Microphone/camera permission denied. You can still type and submit responses in the text box below or click Enable Camera & Mic.'
        );
        return;
      }
    }

    if (!stream || hasEndedRef.current) {
      stream?.getTracks().forEach((t) => t.stop());
      return;
    }

    streamRef.current = stream;
    const vTracks = stream.getVideoTracks();
    const aTracks = stream.getAudioTracks();

    vTracks.forEach((t) => {
      t.enabled = true;
      t.addEventListener('ended', () => {
        cameraDropsRef.current += 1;
        setHasCameraStream(false);
        setProctorAlertBanner('Monitoring Alert: Webcam stream disconnected.');
      });
    });
    aTracks.forEach((t) => {
      t.enabled = true;
      t.addEventListener('ended', () => {
        micDropsRef.current += 1;
        setHasMicStream(false);
        setProctorAlertBanner('Monitoring Alert: Microphone stream disconnected.');
      });
    });

    setHasCameraStream(vTracks.length > 0);
    setHasMicStream(aTracks.length > 0);

    if (videoRef.current && vTracks.length > 0) {
      const vid = videoRef.current;
      vid.muted = true;
      vid.volume = 0;
      vid.srcObject = stream;
    }

    if (aTracks.length > 0) {
      startTranscriberOnStream(stream, answerInputRef.current);
    }
  }, [startTranscriberOnStream]);

  // Schedule server draft sync
  const persistDraftDebounced = useCallback(
    (payload: { questionId: string; draftCode?: string; draftLanguage?: CodingLanguage; voiceDraft?: string }) => {
      if (draftSaveTimerRef.current !== null) {
        window.clearTimeout(draftSaveTimerRef.current);
      }
      draftSaveTimerRef.current = window.setTimeout(() => {
        fetch(`/api/interview/session/${sessionRef.current.sessionId}/draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {});
      }, 450);
    },
    []
  );

  // Complete & evaluate full session
  const handleCompleteInterview = useCallback(
    async (
      timedOut = false,
      latestSessionSnapshot?: InterviewSession,
      discrepancyAutoSubmit?: { autoSubmittedReason: string }
    ) => {
      if (hasEndedRef.current) return;
      hasEndedRef.current = true;
      setConfirmEndOpen(false);
      setIsEvaluating(true);
      const autoSubmittedDueToDiscrepancy = Boolean(discrepancyAutoSubmit?.autoSubmittedReason);
      const autoSubmitReason = discrepancyAutoSubmit?.autoSubmittedReason || '';
      setTurnLabel(
        autoSubmittedDueToDiscrepancy ? 'Auto-Submitting Session...' : 'Evaluating Live Session...'
      );

      if (autoAdvanceTimerRef.current !== null) {
        window.clearInterval(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }

      stopSpeaking();
      isAiSpeakingRef.current = false;
      setIsAiSpeaking(false);

      const pendingFlush = transcriberRef.current ? await transcriberRef.current.flushTurnAudio() : { blob: null, mimeType: 'audio/webm' };
      transcriberRef.current?.stop();

      let workingSession =
        latestSessionSnapshot || StorageService.getSessionById(sessionRef.current.sessionId) || sessionRef.current;
      const curQ = workingSession.questions[currentIdxRef.current];
      const alreadyAnsweredCurrent = workingSession.answers.some((a) => a.questionId === curQ?.questionId);

      // Save unsaved current question response cleanly on early exit, auto-submit, or session timeout
      if (curQ && !alreadyAnsweredCurrent) {
        if (curQ.questionType === 'coding') {
          const currentCode = codingCodeRef.current;
          const currentLang = codingLanguageRef.current;
          try {
            const resp = await fetch(`/api/interview/session/${workingSession.sessionId}/submit-coding`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                questionId: curQ.questionId,
                questionText: curQ.questionText,
                difficulty: curQ.difficulty || workingSession.config.difficulty,
                code: currentCode,
                language: currentLang,
                functionName: curQ.functionName || 'solution',
                testCases: curQ.testCases || [],
                submissionType: timedOut || autoSubmittedDueToDiscrepancy ? 'auto' : 'manual'
              })
            });
            if (resp.ok) {
              const data = await resp.json();
              const prob = data.problem;
              workingSession = StorageService.saveAnswer(workingSession.sessionId, {
                questionId: curQ.questionId,
                questionText: curQ.questionText,
                answerText: currentCode.trim()
                  ? `[${currentLang}] Passed ${prob.executionResults?.passedCount ?? 0}/${prob.executionResults?.totalCount ?? 0} test cases`
                  : '(Empty coding submission)',
                durationSeconds: Math.max(1, Math.round((getServerNow() - (prob.startTimestamp || getServerNow())) / 1000)),
                questionType: 'coding',
                problemId: curQ.questionId,
                difficulty: curQ.difficulty || workingSession.config.difficulty,
                assignedTimeLimitSeconds: prob.assignedTimeLimitSeconds,
                startTimestamp: new Date(prob.startTimestamp || Date.now()).toISOString(),
                submissionTimestamp: new Date(prob.submissionTimestamp || Date.now()).toISOString(),
                submittedCode: currentCode,
                language: currentLang,
                submissionType: timedOut || autoSubmittedDueToDiscrepancy ? 'auto' : 'manual',
                completedWithinTime: prob.completedWithinTime,
                executionResults: prob.executionResults,
                testCaseResults: prob.testCaseResults,
                evaluationScore: prob.evaluationScore,
                codingEvaluation: prob.codingEvaluation
              });
            }
          } catch {
            // fallback local record
          }
        } else {
          let unsavedText = `${answerInputRef.current} ${interimSpeechRef.current}`.trim();
          if (!unsavedText && pendingFlush.blob && pendingFlush.blob.size > 1200) {
            try {
              const b64 = await blobToBase64(pendingFlush.blob);
              const tResp = await fetch('/api/ai/transcribe-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  audioBase64: b64,
                  mimeType: pendingFlush.mimeType,
                  domain: workingSession.config.domain,
                  currentQuestion: curQ.questionText
                })
              });
              if (tResp.ok) {
                const td = await tResp.json();
                unsavedText = String(td?.transcript || '').trim();
              }
            } catch {
              // ignore
            }
          }
          if (unsavedText.length > 0) {
            const dur = Math.max(3, Math.round((Date.now() - questionStartTimeRef.current) / 1000));
            workingSession = StorageService.saveAnswer(workingSession.sessionId, {
              questionId: curQ.questionId,
              questionText: curQ.questionText,
              answerText: unsavedText,
              originalTranscription: originalTranscription || unsavedText,
              finalResponse: unsavedText,
              questionType: 'voice',
              durationSeconds: dur
            });
          }
        }
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      await fetch(`/api/interview/session/${workingSession.sessionId}/complete`, { method: 'POST' }).catch(() => {});

      const totalCallSeconds = Math.max(1, Math.round((getServerNow() - sessionStartedAtRef.current) / 1000));
      const totalWords = workingSession.answers.reduce((acc, ans) => {
        if (ans.questionType === 'coding' || !ans.answerText || ans.answerText.startsWith('(No ') || ans.answerText.startsWith('(Candidate skipped')) {
          return acc;
        }
        return acc + ans.answerText.trim().split(/\s+/).length;
      }, 0);
      const totalAnsSeconds = Math.max(1, workingSession.answers.reduce((acc, a) => acc + (a.durationSeconds || 0), 0));
      const wordsPerMinute = totalWords > 0 ? Math.round((totalWords / totalAnsSeconds) * 60) : 0;

      const camSamples = cameraOnSamplesRef.current;
      const cameraActiveRatio =
        camSamples.length > 0 ? camSamples.reduce((a, b) => a + b, 0) / camSamples.length : hasCameraStream ? 1 : 0;
      const cameraUsed = cameraActiveRatio > 0.1;

      const audSamples = audioLevelSamplesRef.current;
      const avgAudioLevel =
        audSamples.length > 0 ? Math.round(audSamples.reduce((a, b) => a + b, 0) / audSamples.length) : 0;
      const voiceActiveSamples = audSamples.filter((v) => v > 10).length;
      const voiceActivityPct = audSamples.length > 0 ? Math.round((voiceActiveSamples / audSamples.length) * 100) : 0;
      const micUsed = hasMicStream && (avgAudioLevel > 0 || totalWords > 0);

      let aiOverride: Parameters<typeof StorageService.endSession>[1] | undefined;
      try {
        const resp = await fetch('/api/ai/evaluate-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questions: workingSession.questions,
            answers: workingSession.answers,
            domain: workingSession.config.domain,
            difficulty: workingSession.config.difficulty,
            mode: workingSession.config.mode,
            targetRole: workingSession.config.targetRole || 'Software Engineer',
            mediaMetrics: {
              cameraUsed,
              cameraActivePct: Math.round(cameraActiveRatio * 100),
              micUsed,
              wordsPerMinute,
              totalWords,
              avgAudioLevel,
              voiceActivityPct,
              recordingDurationSeconds: totalCallSeconds
            },
            proctoringSummary: {
              tabSwitches: tabSwitchesRef.current,
              cameraCoveredCount: cameraCoveredRef.current,
              multiplePeopleAlerts: multiplePeopleRef.current,
              backgroundNoiseAlerts: backgroundNoiseRef.current,
              gadgetAlerts: gadgetAlertsRef.current,
              discrepancyStrikes: discrepancyStrikesRef.current,
              autoSubmittedDueToDiscrepancy,
              autoSubmitReason,
              cameraDrops: cameraDropsRef.current,
              micDrops: micDropsRef.current
            }
          })
        });

        if (resp.ok) {
          const json = await resp.json();
          const ev = json.evaluation;
          if (ev) {
            const rawWritten = String(ev.writtenFeedback || '');
            const writtenFeedback =
              autoSubmittedDueToDiscrepancy &&
              autoSubmitReason &&
              !rawWritten.toLowerCase().includes('automatically submitted')
                ? `${autoSubmitReason} ${rawWritten}`.trim()
                : rawWritten;

            aiOverride = {
              technicalScore: ev.technicalScore,
              communicationScore: ev.communicationScore,
              confidenceScore: ev.confidenceScore,
              responseQualityScore: ev.responseQualityScore,
              overallScore: ev.overallScore,
              writtenFeedback,
              deliveryNotes: ev.deliveryNotes,
              strengths: ev.strengths,
              weaknesses: ev.weaknesses,
              suggestions: ev.suggestions,
              recordedDurationSeconds: totalCallSeconds,
              mediaSummary: {
                cameraUsed,
                micUsed,
                recordingDurationSeconds: totalCallSeconds,
                wordsPerMinute,
                totalWords,
                evaluationSource: json.source || 'gemini',
                tabSwitches: tabSwitchesRef.current,
                cameraAlerts: cameraCoveredRef.current,
                multiplePeopleAlerts: multiplePeopleRef.current,
                backgroundNoiseAlerts: backgroundNoiseRef.current,
                gadgetAlerts: gadgetAlertsRef.current,
                discrepancyStrikes: discrepancyStrikesRef.current,
                autoSubmittedDueToDiscrepancy,
                autoSubmitReason: autoSubmitReason || undefined
              }
            };
          }
        }
      } catch {
        // Fallback handled inside StorageService.endSession
      }

      const finalized = StorageService.endSession(workingSession.sessionId, aiOverride);
      try {
        if (!autoSubmittedDueToDiscrepancy) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      } catch {
        // ignore
      }

      setIsEvaluating(false);
      setDidTimeOut(timedOut);
      setCompletedSessionForReview(finalized);

      if (autoSubmitReason) {
        speakQuestion(autoSubmitReason);
      }
    },
    [getServerNow, hasCameraStream, hasMicStream, originalTranscription]
  );

  useEffect(() => {
    handleCompleteInterviewRef.current = handleCompleteInterview;
  }, [handleCompleteInterview]);

  const registerDiscrepancyStrike = useCallback(
    (kind: 'multiple_people' | 'gadget' | 'excessive_noise', detail: string) => {
      if (hasEndedRef.current || discrepancyAutoSubmitRef.current) return;

      const now = Date.now();
      // Tiny 400ms re-entrancy guard only; each attempt already requires >2s continuous detection and resets timer to 0
      if (now - lastStrikeAtRef.current < 400) {
        return;
      }
      lastStrikeAtRef.current = now;

      if (kind === 'multiple_people') {
        multiplePeopleRef.current += 1;
        setMultiplePeopleCount(multiplePeopleRef.current);
        setMultiPersonHoldMs(0);
      } else if (kind === 'gadget') {
        gadgetAlertsRef.current += 1;
        setGadgetAlertsCount(gadgetAlertsRef.current);
        setGadgetHoldMs(0);
      } else {
        backgroundNoiseRef.current += 1;
        setBackgroundNoiseCount(backgroundNoiseRef.current);
        setNoiseHoldMs(0);
      }

      discrepancyStrikesRef.current += 1;
      const strikes = discrepancyStrikesRef.current;
      setDiscrepancyStrikes(strikes);
      playProctorBeep(strikes >= MAX_DISCREPANCY_STRIKES);

      if (strikes < MAX_DISCREPANCY_STRIKES) {
        const warnMsg = `Discrepancy Attempt (${strikes}/${MAX_DISCREPANCY_STRIKES}): ${detail} Sustained for >2s — timer reset to 0s. Reaching ${MAX_DISCREPANCY_STRIKES} attempts auto-submits the interview.`;
        setProctorAlertBanner(warnMsg);
        appendMessage('monitor', warnMsg);
        return;
      }

      discrepancyAutoSubmitRef.current = true;
      const reasons: string[] = [];
      if (multiplePeopleRef.current > 0) reasons.push(`${multiplePeopleRef.current} multiple-person alert(s)`);
      if (gadgetAlertsRef.current > 0) reasons.push(`${gadgetAlertsRef.current} unauthorized gadget alert(s)`);
      if (backgroundNoiseRef.current > 0) reasons.push(`${backgroundNoiseRef.current} excessive background noise alert(s)`);

      const closingResponse = `Your interview has been automatically submitted after ${strikes} proctoring discrepancies were detected (${reasons.join(', ') || detail}). Any responses and code recorded so far have been saved and evaluated.`;
      setAutoSubmitReasonState(closingResponse);
      setProctorAlertBanner(closingResponse);
      appendMessage('monitor', `Auto-Submit Triggered (${strikes}/${MAX_DISCREPANCY_STRIKES}): ${detail}`);
      appendMessage('ai', closingResponse);

      void handleCompleteInterviewRef.current(false, undefined, { autoSubmittedReason: closingResponse });
    },
    [appendMessage]
  );

  useEffect(() => {
    registerDiscrepancyStrikeRef.current = registerDiscrepancyStrike;
  }, [registerDiscrepancyStrike]);

  // Activate a question (voice or coding) and set up its authoritative timer & workspace
  const activateQuestionAtIndex = useCallback(
    async (idx: number, announceVoice = true) => {
      const q = sessionRef.current.questions[idx];
      if (!q || hasEndedRef.current) return;

      setCurrentIdx(idx);
      currentIdxRef.current = idx;
      questionStartTimeRef.current = Date.now();
      setShowKeyPoints(false);
      setFollowUpsCount(0);
      askedFollowUpsRef.current = [];
      priorVoiceAnswerRef.current = '';
      setCodingSubmissionOverlay(null);
      setCodingRunResult(null);
      setCodingRunError(null);
      setActiveWarningThreshold(null);
      setVoiceWarningThreshold(null);
      setVoiceTimeExpiredLocked(false);

      const isCoding = q.questionType === 'coding';
      const runtime = problemRuntimeRef.current[q.questionId];
      const fallbackLimit =
        q.timeLimitSeconds ||
        (isCoding
          ? getCodingTimeLimitSeconds(
              q.difficulty || sessionRef.current.config.difficulty,
              sessionRef.current.config.codingTimeLimits
            )
          : getVoiceTimeLimitSeconds(
              q.difficulty || sessionRef.current.config.difficulty,
              sessionRef.current.config.voiceTimeLimits
            ));

      let startTs = runtime?.startTimestamp;
      let deadlineTs = runtime?.deadlineTimestamp;
      let limitSec = runtime?.assignedTimeLimitSeconds || fallbackLimit;

      try {
        const actResp = await fetch(`/api/interview/session/${sessionRef.current.sessionId}/activate-problem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId: q.questionId })
        });
        if (actResp.ok) {
          const actData = await actResp.json();
          if (typeof actData.serverNow === 'number') {
            serverClockOffsetRef.current = actData.serverNow - Date.now();
          }
          if (actData.problem) {
            startTs = actData.problem.startTimestamp;
            deadlineTs = actData.problem.deadlineTimestamp;
            limitSec = actData.problem.assignedTimeLimitSeconds || limitSec;
            problemRuntimeRef.current[q.questionId] = {
              ...runtime,
              assignedTimeLimitSeconds: limitSec,
              startTimestamp: startTs,
              deadlineTimestamp: deadlineTs
            };
          }
        }
      } catch {
        // Local fallback timestamps if offline
        if (!startTs) {
          startTs = getServerNow();
          deadlineTs = startTs + limitSec * 1000;
          problemRuntimeRef.current[q.questionId] = {
            ...runtime,
            assignedTimeLimitSeconds: limitSec,
            startTimestamp: startTs,
            deadlineTimestamp: deadlineTs
          };
        }
      }

      const resolvedDeadline = deadlineTs || (startTs ? startTs + limitSec * 1000 : getServerNow() + limitSec * 1000);
      problemDeadlineTsRef.current = resolvedDeadline;
      const initialRem = Math.max(0, Math.ceil((resolvedDeadline - getServerNow()) / 1000));

      if (isCoding) {
        stopSpeaking();
        transcriberRef.current?.pause();

        const lang: CodingLanguage = runtime?.draftLanguage || q.defaultLanguage || 'javascript';
        const initialCode =
          typeof runtime?.draftCode === 'string' ? runtime.draftCode : getStarterCodeFor(q, lang);

        setCodingLanguage(lang);
        codingLanguageRef.current = lang;
        setCodingCode(initialCode);
        codingCodeRef.current = initialCode;
        setCodingAssignedLimitSeconds(limitSec);
        setCodingRemainingSeconds(initialRem);
        setCodingLocked(initialRem <= 0 || Boolean(runtime?.submitted));
        setTurnLabel(`Timed Coding (${Math.round(limitSec / 60)}m)`);

        if (announceVoice) {
          appendMessage(
            'ai',
            `Coding Problem ${idx + 1} (${q.difficulty || sessionRef.current.config.difficulty} • ${Math.round(
              limitSec / 60
            )}m limit): ${q.title || q.questionText}. Your countdown has started — your code will auto-submit at 00:00.`
          );
        }
      } else {
        setCodingLocked(false);
        userManuallyEditedVoiceRef.current = false;
        answerInputRef.current = '';
        interimSpeechRef.current = '';
        originalTranscriptionRef.current = '';
        setAnswerInput('');
        setInterimSpeech('');
        setOriginalTranscription('');
        setVoiceAssignedLimitSeconds(limitSec);
        setVoiceRemainingSeconds(initialRem);
        transcriberRef.current?.resetTurn(false);
        setTurnLabel('Your Turn — Speak Now');

        if (announceVoice) {
          const promptText = `Question ${idx + 1}: ${q.questionText}`;
          appendMessage('ai', promptText);
          void speakWithPromise(promptText, true);
        } else if (!isMicPausedRef.current && !isAiSpeakingRef.current) {
          transcriberRef.current?.resume();
        }
      }
    },
    [appendMessage, getServerNow, speakWithPromise]
  );

  // Submit Coding Problem (Manual or Auto) with strict duplicate-submission prevention
  const submitCodingProblem = useCallback(
    async (q: InterviewQuestionItem, submissionType: CodingSubmissionType) => {
      if (!q || hasEndedRef.current) return;
      if (codingSubmitLockRef.current.has(q.questionId)) return;

      // Synchronous lock prevents simultaneous manual submit + 00:00 timer expiration
      codingSubmitLockRef.current.add(q.questionId);
      setCodingLocked(true);
      setIsSubmitting(true);
      setTurnLabel(submissionType === 'auto' ? 'Time Expired — Auto-Submitting Code...' : 'Submitting & Evaluating Code...');

      const submittedCode = codingCodeRef.current ?? '';
      const language = codingLanguageRef.current;
      const runtime = problemRuntimeRef.current[q.questionId];
      const assignedLimit =
        runtime?.assignedTimeLimitSeconds ||
        q.timeLimitSeconds ||
        getCodingTimeLimitSeconds(
          q.difficulty || sessionRef.current.config.difficulty,
          sessionRef.current.config.codingTimeLimits
        );

      let probData: any = null;
      try {
        const resp = await fetch(`/api/interview/session/${sessionRef.current.sessionId}/submit-coding`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: q.questionId,
            questionText: q.questionText,
            difficulty: q.difficulty || sessionRef.current.config.difficulty,
            code: submittedCode,
            language,
            functionName: q.functionName || 'solution',
            testCases: q.testCases || [],
            submissionType
          })
        });
        if (resp.ok) {
          const json = await resp.json();
          probData = json.problem;
        }
      } catch {
        // Fallback summary if offline
      }

      const nowMs = getServerNow();
      const startTs = probData?.startTimestamp || runtime?.startTimestamp || nowMs;
      const submissionTs = probData?.submissionTimestamp || nowMs;
      const completedWithinTime =
        typeof probData?.completedWithinTime === 'boolean'
          ? probData.completedWithinTime
          : submissionType === 'manual';
      const executionResults = probData?.executionResults || {
        status: submittedCode.trim() ? 'Evaluated' : 'Failed',
        passedCount: 0,
        totalCount: q.testCases?.length || 0,
        executionTimeMs: 0
      };
      const testCaseResults = probData?.testCaseResults || [];
      const codingEvaluation = probData?.codingEvaluation || {
        technicalScore: submittedCode.trim() ? 45 : 5,
        codeQualityScore: submittedCode.trim() ? 50 : 5,
        efficiencyScore: submittedCode.trim() ? 45 : 5,
        overallScore: submittedCode.trim() ? 46 : 5,
        feedback:
          submissionType === 'auto'
            ? submittedCode.trim()
              ? 'Time expired — your current code was automatically submitted and recorded.'
              : 'Time expired with no code written. Empty submission recorded.'
            : 'Code submitted and recorded.'
      };
      const evaluationScore = probData?.evaluationScore ?? codingEvaluation.overallScore;

      if (problemRuntimeRef.current[q.questionId]) {
        problemRuntimeRef.current[q.questionId].submitted = true;
      }

      const durationForProblem = Math.max(
        1,
        Math.min(assignedLimit, Math.round((submissionTs - startTs) / 1000))
      );

      const summaryText = submittedCode.trim()
        ? `[${language.toUpperCase()} • ${submissionType === 'auto' ? 'Auto Submission' : 'Manual Submission'}] Passed ${executionResults.passedCount}/${executionResults.totalCount} test cases (Score: ${evaluationScore}/100)`
        : `[${language.toUpperCase()} • ${submissionType === 'auto' ? 'Auto Submission' : 'Manual Submission'}] Empty submission recorded at deadline.`;

      const updatedSession = StorageService.saveAnswer(sessionRef.current.sessionId, {
        questionId: q.questionId,
        questionText: q.title ? `${q.title}: ${q.questionText}` : q.questionText,
        answerText: summaryText,
        durationSeconds: durationForProblem,
        questionType: 'coding',
        problemId: q.questionId,
        difficulty: q.difficulty || sessionRef.current.config.difficulty,
        assignedTimeLimitSeconds: assignedLimit,
        startTimestamp: new Date(startTs).toISOString(),
        submissionTimestamp: new Date(submissionTs).toISOString(),
        submittedCode,
        language,
        submissionType,
        completedWithinTime,
        executionResults,
        testCaseResults,
        evaluationScore,
        codingEvaluation
      });

      setSession(updatedSession);
      sessionRef.current = updatedSession;
      appendMessage('user', summaryText);
      if (codingEvaluation.feedback) {
        appendMessage('ai', codingEvaluation.feedback);
      }

      setIsSubmitting(false);

      const nextIdx = currentIdxRef.current + 1;
      const hasNext = nextIdx < updatedSession.questions.length;

      setCodingSubmissionOverlay({
        submissionType,
        completedWithinTime,
        executionResults,
        testCaseResults,
        evaluationScore,
        codingEvaluation,
        autoAdvanceSecondsLeft: hasNext ? 2 : undefined
      });

      if (autoAdvanceTimerRef.current !== null) {
        window.clearInterval(autoAdvanceTimerRef.current);
      }

      if (hasNext) {
        let secsLeft = 2;
        autoAdvanceTimerRef.current = window.setInterval(() => {
          secsLeft -= 1;
          if (secsLeft <= 0) {
            if (autoAdvanceTimerRef.current !== null) {
              window.clearInterval(autoAdvanceTimerRef.current);
              autoAdvanceTimerRef.current = null;
            }
            void activateQuestionAtIndex(nextIdx, true);
          } else {
            setCodingSubmissionOverlay((prev) =>
              prev ? { ...prev, autoAdvanceSecondsLeft: secsLeft } : prev
            );
          }
        }, 1000);
      } else {
        window.setTimeout(() => {
          void handleCompleteInterview(false, updatedSession);
        }, 1500);
      }
    },
    [activateQuestionAtIndex, appendMessage, getServerNow, handleCompleteInterview]
  );

  // Initial session hydration & server sync (supports seamless page refresh restoration)
  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      const started = StorageService.startSession(initialSession.sessionId);
      setSession(started);
      sessionRef.current = started;

      // Sync configurable coding & voice time limits
      let activeCodingLimits = getStoredCodingTimeLimits();
      let activeVoiceLimits = getStoredVoiceTimeLimits();
      try {
        const cfgResp = await fetch('/api/interview/config');
        if (cfgResp.ok) {
          const cfgData = await cfgResp.json();
          if (cfgData?.codingTimeLimitsMinutes) {
            activeCodingLimits = {
              ...cfgData.codingTimeLimitsMinutes,
              ...(started.config.codingTimeLimits || {})
            };
          }
          if (cfgData?.voiceTimeLimitsMinutes) {
            activeVoiceLimits = {
              ...cfgData.voiceTimeLimitsMinutes,
              ...(started.config.voiceTimeLimits || {})
            };
          }
        }
      } catch {
        // use local config
      }

      // Compute effective overall session duration budget
      const codingTotalSec = started.questions
        .filter((q) => q.questionType === 'coding')
        .reduce(
          (sum, q) =>
            sum + (q.timeLimitSeconds || getCodingTimeLimitSeconds(q.difficulty || started.config.difficulty, activeCodingLimits)),
          0
        );
      const voiceTotalSec = started.questions
        .filter((q) => q.questionType !== 'coding')
        .reduce(
          (sum, q) =>
            sum + (q.timeLimitSeconds || getVoiceTimeLimitSeconds(q.difficulty || started.config.difficulty, activeVoiceLimits)),
          0
        );
      const effectiveTotalDurationSec = Math.max(started.config.durationMinutes * 60, codingTotalSec + voiceTotalSec + 60);

      let serverSession: any = null;
      try {
        const initResp = await fetch('/api/interview/session/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: started.sessionId,
            userId: started.userId,
            questions: started.questions,
            sessionCodingLimits: started.config.codingTimeLimits || activeCodingLimits,
            sessionVoiceLimits: started.config.voiceTimeLimits || activeVoiceLimits
          })
        });
        if (initResp.ok) {
          const initData = await initResp.json();
          if (typeof initData.serverNow === 'number') {
            serverClockOffsetRef.current = initData.serverNow - Date.now();
          }
          serverSession = initData.session;
        }
      } catch {
        // local mode fallback
      }

      if (cancelled) return;

      const startMs = serverSession?.startedAt || (started.startTime ? new Date(started.startTime).getTime() : Date.now());
      sessionStartedAtRef.current = startMs;
      sessionDeadlineTsRef.current = startMs + effectiveTotalDurationSec * 1000;

      // Build runtime map from server state + existing local answers
      const answeredIds = new Set(started.answers.map((a) => a.questionId));
      const runtimeMap: Record<string, ProblemRuntimeEntry> = {};

      for (const q of started.questions) {
        const srvProb = serverSession?.problems?.[q.questionId];
        const isCoding = q.questionType === 'coding';
        const limitSec =
          srvProb?.assignedTimeLimitSeconds ||
          q.timeLimitSeconds ||
          (isCoding
            ? getCodingTimeLimitSeconds(q.difficulty || started.config.difficulty, activeCodingLimits)
            : getVoiceTimeLimitSeconds(q.difficulty || started.config.difficulty, activeVoiceLimits));
        const alreadySubmitted =
          Boolean(srvProb?.submissionTimestamp) ||
          Boolean(serverSession?.voiceAnswers?.[q.questionId]) ||
          answeredIds.has(q.questionId);
        if (alreadySubmitted) {
          if (isCoding) codingSubmitLockRef.current.add(q.questionId);
          else voiceSubmitLockRef.current.add(q.questionId);
        }
        runtimeMap[q.questionId] = {
          assignedTimeLimitSeconds: limitSec,
          startTimestamp: srvProb?.startTimestamp,
          deadlineTimestamp: srvProb?.deadlineTimestamp,
          draftCode: srvProb?.draftCode,
          draftLanguage: srvProb?.draftLanguage,
          submitted: alreadySubmitted
        };
      }
      problemRuntimeRef.current = runtimeMap;

      // Determine exact resume question index (first unsubmitted question)
      let resumeIdx = started.questions.findIndex((q) => {
        const srvSubmitted = Boolean(serverSession?.problems?.[q.questionId]?.submissionTimestamp || serverSession?.voiceAnswers?.[q.questionId]);
        return !answeredIds.has(q.questionId) && !srvSubmitted;
      });
      if (resumeIdx < 0) {
        resumeIdx = Math.max(0, started.questions.length - 1);
      }

      const targetQ = started.questions[resumeIdx];
      const isResuming = started.answers.length > 0 || Boolean(serverSession?.problems?.[targetQ?.questionId]?.startTimestamp);

      if (targetQ && targetQ.questionType !== 'coding') {
        isAiSpeakingRef.current = true;
      }

      await startMandatoryMedia();
      if (cancelled) return;

      // Avoid double-speaking Question 1: greeting below already announces Question 1 for voice rounds
      await activateQuestionAtIndex(resumeIdx, targetQ?.questionType === 'coding' ? !isResuming : false);

      // Restore voice draft if refreshing mid-question
      if (targetQ && targetQ.questionType !== 'coding') {
        const savedVoiceDraft = serverSession?.voiceDrafts?.[targetQ.questionId];
        if (savedVoiceDraft) {
          setAnswerInput(savedVoiceDraft);
          answerInputRef.current = savedVoiceDraft;
          transcriberRef.current?.setFinalizedTextManual(savedVoiceDraft);
        }
        if (isResuming) {
          appendMessage('ai', `Session restored cleanly. Question ${resumeIdx + 1}: ${targetQ.questionText}`);
          void speakWithPromise(`Welcome back. Question ${resumeIdx + 1}: ${targetQ.questionText}`, true);
        } else {
          const topicTag = started.config.subtopic
            ? `${started.config.domain} focusing on ${started.config.subtopic}`
            : started.config.domain;
          const greeting = `Hi! I'm your AI Interview Host for today's ${topicTag} round. Live audio and video are processed in real time — nothing is saved. Let's begin with Question 1: ${targetQ.questionText}`;
          setConversation([]);
          appendMessage('ai', greeting);
          void speakWithPromise(greeting, true);
        }
      } else if (targetQ && targetQ.questionType === 'coding' && isResuming) {
        appendMessage(
          'ai',
          `Timer and code draft restored for Problem ${resumeIdx + 1} (${targetQ.title || targetQ.difficulty}).`
        );
      }

      setIsHydrated(true);

      // If current problem deadline already expired while page was refreshed/closed, auto-submit immediately
      if (targetQ) {
        const rt = problemRuntimeRef.current[targetQ.questionId];
        if (rt?.deadlineTimestamp && getServerNow() >= rt.deadlineTimestamp) {
          if (targetQ.questionType === 'coding' && !codingSubmitLockRef.current.has(targetQ.questionId)) {
            void submitCodingProblem(targetQ, 'auto');
          } else if (targetQ.questionType !== 'coding' && !voiceSubmitLockRef.current.has(targetQ.questionId)) {
            void handleSubmitVoiceAnswerRef.current(undefined, 'auto');
          }
        }
      }
    };

    void initialize();

    return () => {
      cancelled = true;
      stopSpeaking();
      transcriberRef.current?.stop();
      if (draftSaveTimerRef.current !== null) window.clearTimeout(draftSaveTimerRef.current);
      if (autoAdvanceTimerRef.current !== null) window.clearInterval(autoAdvanceTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSession.sessionId]);

  const handleSubmitVoiceAnswerRef = useRef<
    (overrideText?: string, submissionType?: 'manual' | 'auto') => Promise<void>
  >(async () => {});

  // Authoritative UTC Timestamp Timer Loop (Immune to browser tab switching / minimizing)
  useEffect(() => {
    if (!isHydrated) return;

    const tickTimers = () => {
      if (hasEndedRef.current) return;
      const now = getServerNow();

      // Sample camera status once per tick
      const vTrack = streamRef.current?.getVideoTracks()?.[0];
      cameraOnSamplesRef.current.push(vTrack && vTrack.enabled && vTrack.readyState === 'live' ? 1 : 0);

      setElapsedSeconds(Math.max(0, Math.round((now - sessionStartedAtRef.current) / 1000)));
      const sessionRem = Math.max(0, Math.round((sessionDeadlineTsRef.current - now) / 1000));
      setSecondsRemaining(sessionRem);

      if (sessionRem <= 0 && !hasEndedRef.current) {
        setDidTimeOut(true);
        void handleCompleteInterview(true);
        return;
      }

      const activeQ = sessionRef.current.questions[currentIdxRef.current];
      const deadline = problemDeadlineTsRef.current;
      if (!activeQ || deadline <= 0) return;

      if (activeQ.questionType === 'coding' && !codingSubmitLockRef.current.has(activeQ.questionId)) {
        const probRem = Math.max(0, Math.ceil((deadline - now) / 1000));
        setCodingRemainingSeconds(probRem);

        // Check warning thresholds: 2m (120s), 1m (60s), 30s
        let warning: 120 | 60 | 30 | null = null;
        if (probRem > 0 && probRem <= 30) warning = 30;
        else if (probRem > 0 && probRem <= 60) warning = 60;
        else if (probRem > 0 && probRem <= 120) warning = 120;
        setActiveWarningThreshold(warning);

        if (warning) {
          const warnKey = `${activeQ.questionId}_${warning}`;
          if (!warnedThresholdsRef.current.has(warnKey)) {
            warnedThresholdsRef.current.add(warnKey);
            const label = warning === 120 ? '2 minutes' : warning === 60 ? '1 minute' : '30 seconds';
            appendMessage('monitor', `Timer Notice (${activeQ.title || 'Coding'}): ${label} remaining before automatic submission.`);
          }
        }

        if (probRem <= 0) {
          void submitCodingProblem(activeQ, 'auto');
        }
      } else if (
        activeQ.questionType !== 'coding' &&
        !voiceSubmitLockRef.current.has(activeQ.questionId) &&
        !voiceInFlightRef.current &&
        !isEvaluating
      ) {
        const probRem = Math.max(0, Math.ceil((deadline - now) / 1000));
        setVoiceRemainingSeconds(probRem);

        // Check warning thresholds for voice questions: 30s and 15s
        let vWarn: 30 | 15 | null = null;
        if (probRem > 0 && probRem <= 15) vWarn = 15;
        else if (probRem > 0 && probRem <= 30) vWarn = 30;
        setVoiceWarningThreshold(vWarn);

        if (vWarn) {
          const warnKey = `v_${activeQ.questionId}_${vWarn}`;
          if (!warnedThresholdsRef.current.has(warnKey)) {
            warnedThresholdsRef.current.add(warnKey);
            appendMessage(
              'monitor',
              `Timer Notice (Question ${currentIdxRef.current + 1}): ${vWarn} seconds remaining before listening stops automatically.`
            );
          }
        }

        if (probRem <= 0) {
          setVoiceTimeExpiredLocked(true);
          transcriberRef.current?.pause();
          setTurnLabel('Time Up — Stopping Mic & Reviewing...');
          void handleSubmitVoiceAnswerRef.current(undefined, 'auto');
        }
      }
    };

    tickTimers();
    const timer = window.setInterval(tickTimers, 500);
    const onVisChange = () => {
      tickTimers();
    };
    document.addEventListener('visibilitychange', onVisChange);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, [appendMessage, getServerNow, handleCompleteInterview, isEvaluating, isHydrated, submitCodingProblem]);

  // Real-Time Computer Vision & Proctoring Loop (TF.js COCO-SSD + Luminance + Server Vision Fallback — zero photos saved)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && !hasEndedRef.current) {
        tabSwitchesRef.current += 1;
        setTabSwitches(tabSwitchesRef.current);
        const msg = `Monitoring Alert: Tab switch detected (${tabSwitchesRef.current}x). Interview timer continues running.`;
        setProctorAlertBanner(msg);
        appendMessage('monitor', msg);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    void preloadPersonDetector();

    let lastLumCheckAt = 0;
    let lastVisionCheckAt = 0;
    let cvInFlight = false;
    let multiPersonSinceMs: number | null = null;
    let multiPersonMissStreak = 0;
    let gadgetSinceMs: number | null = null;
    let gadgetMissStreak = 0;
    let serverMultiSinceMs: number | null = null;
    let serverGadgetSinceMs: number | null = null;
    let serverMissedGadgetStreak = 0;

    const resetMultiPersonHold = (clearError = true) => {
      multiPersonSinceMs = null;
      multiPersonMissStreak = 0;
      setMultiPersonHoldMs(0);
      if (clearError) setMultiPersonError(null);
    };

    const resetGadgetHold = (clearError = true) => {
      gadgetSinceMs = null;
      gadgetMissStreak = 0;
      setGadgetHoldMs(0);
      if (clearError) setGadgetError(null);
    };

    const monitorInterval = window.setInterval(async () => {
      if (hasEndedRef.current) return;
      const videoEl = videoRef.current;
      const vTrack = streamRef.current?.getVideoTracks()?.[0];
      if (!videoEl || videoEl.readyState < 2 || !vTrack || vTrack.readyState !== 'live') {
        return;
      }

      const now = Date.now();

      try {
        // 1. Real-time client-side Computer Vision check (~450ms cadence for accurate >2s continuous timer)
        let localCvReady = false;
        let localCvCount: number | null = null;
        let localCvGadgetCount = 0;
        if (!cvInFlight) {
          cvInFlight = true;
          try {
            const cvResult = await detectPeopleInVideoFrame(videoEl);
            if (!hasEndedRef.current && cvResult.ready && cvResult.personCount !== null) {
              localCvReady = true;
              localCvCount = cvResult.personCount;
              localCvGadgetCount = cvResult.gadgets.length;
              setCvEngineActive(true);
              setDetectedPersonCount(cvResult.personCount);
              setDetectedPersonBoxes(cvResult.boxes);
              setDetectedGadgets(cvResult.gadgets);

              // Multiple People > 2.0s continuous hold -> count 1 attempt & reset timer to 0
              if (cvResult.personCount > 1) {
                multiPersonMissStreak = 0;
                if (multiPersonSinceMs === null) {
                  multiPersonSinceMs = now;
                }
                const elapsedMs = now - multiPersonSinceMs;
                setMultiPersonHoldMs(elapsedMs);
                setMultiPersonError(
                  `Proctoring Warning: ${cvResult.personCount} people detected in frame (${(elapsedMs / 1000).toFixed(1)}s / ${(DISCREPANCY_HOLD_MS / 1000).toFixed(1)}s). Only 1 candidate permitted.`
                );

                if (elapsedMs > DISCREPANCY_HOLD_MS) {
                  resetMultiPersonHold(false);
                  registerDiscrepancyStrikeRef.current(
                    'multiple_people',
                    `${cvResult.personCount} people detected in frame for over 2 seconds.`
                  );
                }
              } else {
                multiPersonMissStreak += 1;
                if (multiPersonMissStreak >= 2) {
                  resetMultiPersonHold(true);
                }
              }

              // Unauthorized Gadget > 2.0s continuous hold -> count 1 attempt & reset timer to 0
              if (cvResult.gadgets.length > 0) {
                gadgetMissStreak = 0;
                const labels = Array.from(new Set(cvResult.gadgets.map((g) => g.label)));
                if (gadgetSinceMs === null) {
                  gadgetSinceMs = now;
                }
                const elapsedMs = now - gadgetSinceMs;
                setGadgetHoldMs(elapsedMs);
                setGadgetError(
                  `Unauthorized Gadget Detected (${labels.join(', ')}) — ${(elapsedMs / 1000).toFixed(1)}s / ${(DISCREPANCY_HOLD_MS / 1000).toFixed(1)}s.`
                );

                if (elapsedMs > DISCREPANCY_HOLD_MS) {
                  resetGadgetHold(false);
                  registerDiscrepancyStrikeRef.current(
                    'gadget',
                    `Unauthorized gadget (${labels.join(', ')}) detected in frame for over 2 seconds.`
                  );
                }
              } else {
                gadgetMissStreak += 1;
                if (gadgetMissStreak >= 2) {
                  resetGadgetHold(true);
                }
              }
            }
          } finally {
            cvInFlight = false;
          }
        }

        // 2. Local pixel luminance check for camera obstruction (every 3s)
        if (now - lastLumCheckAt >= 3000) {
          lastLumCheckAt = now;
          const checkCanvas = document.createElement('canvas');
          checkCanvas.width = 64;
          checkCanvas.height = 48;
          const ctx = checkCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoEl, 0, 0, 64, 48);
            const pixels = ctx.getImageData(0, 0, 64, 48).data;
            let lumSum = 0;
            for (let i = 0; i < pixels.length; i += 4) {
              lumSum += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
            }
            const avgLum = lumSum / (pixels.length / 4);
            if (avgLum < 8) {
              cameraCoveredRef.current += 1;
              setCameraCoveredCount(cameraCoveredRef.current);
              setProctorAlertBanner('Monitoring Alert: Camera feed appears covered or very dark. Please stay visible.');
            }
          }
        }

        // 3. Server-side Gemini Vision secondary check (fallback when local CV unavailable, or corroboration for occluded gadgets)
        const serverCheckInterval = localCvReady ? 10000 : 2500;
        if (!proctorFrameInFlightRef.current && now - lastVisionCheckAt >= serverCheckInterval) {
          lastVisionCheckAt = now;
          proctorFrameInFlightRef.current = true;
          try {
            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = 320;
            frameCanvas.height = 240;
            const fCtx = frameCanvas.getContext('2d');
            if (fCtx) {
              fCtx.drawImage(videoEl, 0, 0, 320, 240);
              const dataUrl = frameCanvas.toDataURL('image/jpeg', 0.65);
              const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
              if (b64) {
                const resp = await fetch('/api/ai/proctor-frame', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ imageBase64: b64, mimeType: 'image/jpeg' })
                });
                if (resp.ok && !hasEndedRef.current) {
                  const pData = await resp.json();
                  const srvCount = Number(pData?.personCount);

                  if (!localCvReady && pData?.source !== 'fallback' && pData?.source !== 'unavailable') {
                    if (pData?.multiplePeopleDetected || srvCount > 1) {
                      const effectiveCount = Math.max(2, srvCount || 2);
                      setDetectedPersonCount(effectiveCount);
                      if (serverMultiSinceMs === null) {
                        serverMultiSinceMs = now;
                        setMultiPersonError(
                          `Proctoring Warning: ${effectiveCount} people detected in frame. Only 1 candidate permitted.`
                        );
                      } else if (now - serverMultiSinceMs > DISCREPANCY_HOLD_MS) {
                        serverMultiSinceMs = null;
                        registerDiscrepancyStrikeRef.current(
                          'multiple_people',
                          `${effectiveCount} people detected in frame.${pData?.summary ? ` (${pData.summary})` : ''}`
                        );
                      }
                    } else {
                      serverMultiSinceMs = null;
                      if (!Number.isNaN(srvCount)) setDetectedPersonCount(srvCount);
                      setMultiPersonError(null);
                    }
                  }

                  const srvGadgets = Array.isArray(pData?.detectedGadgets)
                    ? pData.detectedGadgets.map((g: unknown) => String(g || '').trim()).filter(Boolean)
                    : [];
                  if (pData?.gadgetDetected || srvGadgets.length > 0) {
                    const labelText = srvGadgets.length > 0 ? srvGadgets.join(', ') : 'Electronic Device';
                    if (!localCvReady) {
                      if (serverGadgetSinceMs === null) {
                        serverGadgetSinceMs = now;
                        setGadgetError(`Unauthorized Gadget Detected (${labelText}).`);
                      } else if (now - serverGadgetSinceMs > DISCREPANCY_HOLD_MS) {
                        serverGadgetSinceMs = null;
                        registerDiscrepancyStrikeRef.current(
                          'gadget',
                          `Unauthorized gadget detected (${labelText}).${pData?.summary ? ` (${pData.summary})` : ''}`
                        );
                      }
                    } else if (localCvGadgetCount === 0 && gadgetSinceMs === null) {
                      // Corroborate devices local COCO-SSD may miss across 2 consecutive vision checks without double-counting
                      serverMissedGadgetStreak += 1;
                      setGadgetError(`Unauthorized Gadget Detected (${labelText}).`);
                      if (serverMissedGadgetStreak >= 2) {
                        serverMissedGadgetStreak = 0;
                        registerDiscrepancyStrikeRef.current(
                          'gadget',
                          `Unauthorized gadget detected (${labelText}).${pData?.summary ? ` (${pData.summary})` : ''}`
                        );
                      }
                    }
                  } else {
                    serverGadgetSinceMs = null;
                    serverMissedGadgetStreak = 0;
                    if (!localCvReady && pData?.source !== 'fallback' && pData?.source !== 'unavailable') {
                      setGadgetError(null);
                    }
                  }

                  if (pData?.cameraObstructed) {
                    cameraCoveredRef.current += 1;
                    setCameraCoveredCount(cameraCoveredRef.current);
                    setProctorAlertBanner('Monitoring Alert: Camera view appears blocked. Please keep your face visible.');
                  }
                }
              }
            }
          } catch {
            // ignore transient network glitch
          } finally {
            proctorFrameInFlightRef.current = false;
          }
        }
      } catch {
        // ignore frame check error
      }
    }, 450);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(monitorInterval);
    };
  }, [appendMessage]);

  // Voice Answer Submission & Keyword-Verified Evaluation Loop
  const handleSubmitVoiceAnswer = async (
    overrideText?: string,
    submissionType: 'manual' | 'auto' = 'manual'
  ) => {
    if (hasEndedRef.current || isEvaluating || voiceInFlightRef.current) return;

    const curQ = sessionRef.current.questions[currentIdxRef.current];
    if (!curQ || voiceSubmitLockRef.current.has(curQ.questionId)) {
      return;
    }

    voiceInFlightRef.current = true;
    voiceSubmitLockRef.current.add(curQ.questionId);
    setIsSubmitting(true);
    if (submissionType === 'auto') {
      setVoiceTimeExpiredLocked(true);
    }

    stopSpeaking();
    isAiSpeakingRef.current = false;
    setIsAiSpeaking(false);
    transcriberRef.current?.pause();

    const qNum = currentIdxRef.current + 1;
    const durationForQuestion = Math.max(
      2,
      Math.round((Date.now() - questionStartTimeRef.current) / 1000)
    );
    const flushed = transcriberRef.current
      ? await transcriberRef.current.flushTurnAudio()
      : { blob: null, mimeType: 'audio/webm' };

    // Always read live mutable refs (never stale closure state!)
    const liveInput = answerInputRef.current || '';
    const liveInterim = interimSpeechRef.current || '';
    const transcriberFinal = transcriberRef.current?.getFinalizedText() || '';
    const bestFinalBase = liveInput.length >= transcriberFinal.length ? liveInput : transcriberFinal;

    let capturedAnswer = (
      overrideText !== undefined ? overrideText : `${bestFinalBase} ${liveInterim}`
    ).trim();
    const rawOriginal = (
      originalTranscriptionRef.current ||
      transcriberFinal ||
      capturedAnswer
    ).trim();

    // Always refine recorded spoken turn audio with server STT (Deepgram Nova-3 / Gemini 3.5 Transcribe / Whisper)
    // when mic audio was captured and the candidate didn't type over it manually
    const wordLen = capturedAnswer ? capturedAnswer.split(/\s+/).length : 0;
    const shouldRefineWithServer =
      overrideText === undefined &&
      !userManuallyEditedVoiceRef.current &&
      flushed.blob &&
      flushed.blob.size > 1400 &&
      (wordLen < 12 || sttStatusRef.current !== 'live' || audioLevelSamplesRef.current.some((v) => v > 12));

    if (shouldRefineWithServer && flushed.blob) {
      setIsTranscribing(true);
      setTurnLabel('Transcribing & Verifying Speech...');
      try {
        const base64Audio = await blobToBase64(flushed.blob);
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 14000);
        const tResp = await fetch('/api/ai/transcribe-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: flushed.mimeType,
            domain: sessionRef.current.config.domain,
            currentQuestion: curQ.questionText
          })
        });
        window.clearTimeout(timeoutId);
        if (tResp.ok) {
          const td = await tResp.json();
          const refined = String(td?.transcript || '').trim();
          if (refined) {
            const refinedWords = refined.split(/\s+/).length;
            if (wordLen < 5) {
              capturedAnswer = capturedAnswer && !refined.toLowerCase().includes(capturedAnswer.toLowerCase())
                ? `${capturedAnswer} ${refined}`.trim()
                : refined;
            } else if (refinedWords >= wordLen * 0.65) {
              capturedAnswer = refined;
            }
            answerInputRef.current = capturedAnswer;
            setAnswerInput(capturedAnswer);
            interimSpeechRef.current = '';
            setInterimSpeech('');

            if (submissionType === 'manual' && refinedWords <= 14 && REPEAT_PHRASE_REGEX.test(capturedAnswer)) {
              voiceSubmitLockRef.current.delete(curQ.questionId);
              voiceInFlightRef.current = false;
              setIsTranscribing(false);
              setIsSubmitting(false);
              setAnswerInput('');
              answerInputRef.current = '';
              await handleRepeatQuestion(capturedAnswer);
              return;
            }
            if (submissionType === 'manual' && refinedWords <= 16 && CLARIFY_PHRASE_REGEX.test(capturedAnswer)) {
              voiceSubmitLockRef.current.delete(curQ.questionId);
              voiceInFlightRef.current = false;
              setIsTranscribing(false);
              setIsSubmitting(false);
              setAnswerInput('');
              answerInputRef.current = '';
              await handleClarifyQuestion(capturedAnswer);
              return;
            }
          }
        }
      } catch {
        // keep capturedAnswer
      } finally {
        setIsTranscribing(false);
      }
    }

    const finalSegment =
      capturedAnswer ||
      (submissionType === 'auto'
        ? '(No spoken or written response captured before timer expired)'
        : '(No verbal or written response provided)');
    appendMessage('user', finalSegment);

    const combinedResponse = priorVoiceAnswerRef.current
      ? `${priorVoiceAnswerRef.current}\n\n[Follow-up Response]: ${finalSegment}`
      : finalSegment;

    const hasNext = currentIdxRef.current + 1 < sessionRef.current.questions.length;
    const nextQ = hasNext ? sessionRef.current.questions[currentIdxRef.current + 1] : null;

    setIsAiTransitioning(true);
    setTurnLabel('Checking Keywords & Understanding...');
    let reactionText =
      submissionType === 'auto'
        ? "Time's up on this question. Let's move on to the next one."
        : hasNext
          ? "Got it. Let's move on to the next question."
          : 'Response recorded. Compiling your performance evaluation now.';
    let nextAction: 'advance' | 'follow_up' = 'advance';
    let assessment = 'partial';
    let isProperSolution = false;
    let matchedKeywords: string[] = [];
    let missingKeywords: string[] = [];
    let keywordCoveragePct = 0;
    let conceptualFeedback = '';
    let conceptualScore = 25;

    try {
      const resp = await fetch('/api/ai/converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond',
          submissionMode: submissionType === 'auto' ? 'timeout' : 'manual',
          domain: sessionRef.current.config.domain,
          subtopic: sessionRef.current.config.subtopic || '',
          difficulty: curQ.difficulty || sessionRef.current.config.difficulty,
          currentQuestion: curQ.questionText,
          keyPoints: curQ.keyPoints || [],
          nextQuestion: nextQ ? nextQ.questionText : '',
          candidateUtterance: finalSegment,
          conversationHistory: conversationRef.current
            .filter((m) => m.sender !== 'monitor')
            .slice(-8)
            .map((m) => ({ sender: m.sender, text: m.text })),
          askedFollowUps: askedFollowUpsRef.current,
          followUpsCount,
          questionNumber: qNum,
          totalQuestions: sessionRef.current.questions.length
        })
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json?.replyText) reactionText = json.replyText;
        if (
          submissionType === 'manual' &&
          json?.nextAction === 'follow_up' &&
          followUpsCount < 1 &&
          overrideText === undefined
        ) {
          nextAction = 'follow_up';
        }
        if (json?.assessment) assessment = json.assessment;
        if (typeof json?.isProperSolution === 'boolean') isProperSolution = json.isProperSolution;
        if (Array.isArray(json?.matchedKeywords)) matchedKeywords = json.matchedKeywords;
        if (Array.isArray(json?.missingKeywords)) missingKeywords = json.missingKeywords;
        if (typeof json?.keywordCoveragePct === 'number') keywordCoveragePct = json.keywordCoveragePct;
        if (json?.conceptualFeedback) conceptualFeedback = json.conceptualFeedback;
        if (typeof json?.conceptualScore === 'number') conceptualScore = json.conceptualScore;
      }
    } catch {
      // keep safe honest defaults
    }
    setIsAiTransitioning(false);

    // Probing follow-up turn (manual submission only; auto-timeout ALWAYS advances with feedback)
    if (nextAction === 'follow_up') {
      voiceSubmitLockRef.current.delete(curQ.questionId);
      voiceInFlightRef.current = false;
      priorVoiceAnswerRef.current = combinedResponse;
      askedFollowUpsRef.current = [...askedFollowUpsRef.current, reactionText];
      setFollowUpsCount((c) => c + 1);
      answerInputRef.current = '';
      interimSpeechRef.current = '';
      originalTranscriptionRef.current = '';
      userManuallyEditedVoiceRef.current = false;
      setAnswerInput('');
      setInterimSpeech('');
      setOriginalTranscription('');
      transcriberRef.current?.resetTurn(false);
      setIsSubmitting(false);

      appendMessage('ai', reactionText);
      await speakWithPromise(reactionText, true);
      return;
    }

    const conversationContext: ConversationTurnContext[] = conversationRef.current
      .filter((m) => m.sender !== 'monitor')
      .slice(-10)
      .map((m) => ({
        sender: m.sender === 'ai' ? 'ai' : 'user',
        text: m.text,
        timestamp: m.time
      }));

    const voiceEval = {
      conceptualScore,
      communicationScore: Math.min(96, Math.max(12, conceptualScore)),
      assessment,
      isProperSolution,
      matchedKeywords,
      missingKeywords,
      keywordCoveragePct,
      submissionType,
      feedback: conceptualFeedback || reactionText,
      followUpsCount
    };

    const updated = StorageService.saveAnswer(sessionRef.current.sessionId, {
      questionId: curQ.questionId,
      questionText: curQ.questionText,
      answerText: combinedResponse,
      durationSeconds: durationForQuestion,
      questionType: 'voice',
      difficulty: curQ.difficulty || sessionRef.current.config.difficulty,
      assignedTimeLimitSeconds: voiceAssignedLimitSeconds,
      submissionType,
      evaluationScore: conceptualScore,
      originalTranscription: rawOriginal || combinedResponse,
      finalResponse: combinedResponse,
      voiceEvaluation: voiceEval,
      conversationContext
    });
    setSession(updated);
    sessionRef.current = updated;

    if (problemRuntimeRef.current[curQ.questionId]) {
      problemRuntimeRef.current[curQ.questionId].submitted = true;
    }

    // Persist voice answer & keyword parsing result on server store
    fetch(`/api/interview/session/${sessionRef.current.sessionId}/submit-voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: curQ.questionId,
        originalTranscription: rawOriginal || combinedResponse,
        finalResponse: combinedResponse,
        submissionType,
        aiEvaluation: voiceEval,
        conversationContext,
        durationSeconds: durationForQuestion
      })
    }).catch(() => {});

    // Show brief honest feedback card on previous problem before advancing
    setLastTurnFeedback({
      questionNumber: qNum,
      text: conceptualFeedback || reactionText,
      isProperSolution,
      score: conceptualScore,
      matchedKeywords,
      missingKeywords,
      submissionType
    });

    appendMessage('ai', reactionText);
    setIsSubmitting(false);
    voiceInFlightRef.current = false;

    // Speak honest brief feedback on the previous problem while keeping mic paused so next timer starts cleanly afterward
    await speakWithPromise(reactionText, false);

    if (hasNext && nextQ) {
      const nextIdx = currentIdxRef.current + 1;
      await activateQuestionAtIndex(nextIdx, true);
    } else {
      await handleCompleteInterview(false, updated);
    }
  };

  useEffect(() => {
    handleSubmitVoiceAnswerRef.current = handleSubmitVoiceAnswer;
  });

  // Run Coding Test Cases without submitting
  const handleRunCodingTests = async () => {
    const curQ = session.questions[currentIdx];
    if (!curQ || curQ.questionType !== 'coding' || codingLocked || isRunningTests) return;
    setIsRunningTests(true);
    setCodingRunError(null);
    try {
      const resp = await fetch(`/api/interview/session/${session.sessionId}/run-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codingCode,
          language: codingLanguage,
          functionName: curQ.functionName || 'solution',
          testCases: curQ.testCases || []
        })
      });
      const json = await resp.json();
      if (!resp.ok || !json.success) {
        setCodingRunError(json?.error || 'Could not execute code.');
      } else {
        setCodingRunResult({
          executionResults: json.executionResults,
          testCaseResults: json.testCaseResults || []
        });
      }
    } catch {
      setCodingRunError('Network error while executing test cases.');
    } finally {
      setIsRunningTests(false);
    }
  };

  // Manual Retry Answer for Voice Questions
  const handleRetryVoiceAnswer = () => {
    if (isSubmitting || isTranscribing || isAiTransitioning || isEvaluating || voiceTimeExpiredLocked) return;
    userManuallyEditedVoiceRef.current = false;
    answerInputRef.current = '';
    interimSpeechRef.current = '';
    originalTranscriptionRef.current = '';
    setAnswerInput('');
    setInterimSpeech('');
    setOriginalTranscription('');
    setIsSilentPause(false);
    isMicPausedRef.current = false;
    setIsMicPaused(false);
    transcriberRef.current?.resetTurn(true);
    persistDraftDebounced({
      questionId: session.questions[currentIdx]?.questionId || '',
      voiceDraft: ''
    });
  };

  const handleToggleMicPause = () => {
    if (voiceTimeExpiredLocked) return;
    if (isMicPausedRef.current) {
      isMicPausedRef.current = false;
      setIsMicPaused(false);
      transcriberRef.current?.resume();
    } else {
      isMicPausedRef.current = true;
      setIsMicPaused(true);
      transcriberRef.current?.pause();
    }
  };

  const currentQuestion = session.questions[currentIdx];
  const isCodingQuestion = currentQuestion?.questionType === 'coding';
  const isLastQuestion = currentIdx === session.questions.length - 1;
  const isSessionTimeCritical = secondsRemaining < 120;
  const combinedPreview = interimSpeech ? `${answerInput}${answerInput ? ' ' : ''}${interimSpeech}` : answerInput;
  const wordCount = combinedPreview.trim() ? combinedPreview.trim().split(/\s+/).length : 0;
  const totalAlerts =
    tabSwitches + cameraCoveredCount + multiplePeopleCount + backgroundNoiseCount + gadgetAlertsCount;

  // Keep live camera stream attached whenever <video> mounts/unmounts between Voice & Coding views
  useEffect(() => {
    const vid = videoRef.current;
    const stream = streamRef.current;
    if (vid && stream && hasCameraStream) {
      if (vid.srcObject !== stream) {
        vid.muted = true;
        vid.volume = 0;
        vid.srcObject = stream;
      }
      vid.play().catch(() => {});
    }
  }, [isCodingQuestion, codingPipMinimized, hasCameraStream, currentIdx]);

  const sttBadge = (() => {
    if (isMicPaused) return { text: 'Listening Paused', tone: 'bg-slate-800 text-slate-300 border-slate-700' };
    if (sttStatus === 'live') {
      return isSilentPause
        ? { text: `${sttProviderLabel} • Continuous Listening`, tone: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' }
        : { text: `${sttProviderLabel} • Listening`, tone: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    }
    if (sttStatus === 'fallback') {
      return isSilentPause
        ? { text: `${sttProviderLabel} • Continuous Listening`, tone: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' }
        : { text: sttProviderLabel, tone: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' };
    }
    if (sttStatus === 'reconnecting' || sttStatus === 'connecting') {
      return { text: 'Connecting Voice STT...', tone: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' };
    }
    if (sttStatus === 'unavailable' || !hasMicStream) {
      return { text: 'Text Fallback Active', tone: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    }
    return { text: 'Continuous Listening Active', tone: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
  })();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between select-none">
      {/* Live-Only Privacy-First Header */}
      <header className="px-4 sm:px-6 py-3 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE</span>
            <span className="font-mono text-[11px] text-emerald-200 tabular-nums">{formatTime(elapsedSeconds)}</span>
          </div>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold truncate text-white">{session.config.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 truncate">
              <span>{session.config.domain}</span>
              {session.config.subtopic && (
                <>
                  <span>•</span>
                  <span className="text-indigo-400 font-semibold">{session.config.subtopic}</span>
                </>
              )}
              <span>•</span>
              <span className="text-amber-400 font-semibold">
                {currentQuestion?.difficulty || session.config.difficulty}
              </span>
              <span>•</span>
              <span>
                {isCodingQuestion ? 'Coding Problem' : 'Question'} {currentIdx + 1} of {session.questions.length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {discrepancyStrikes > 0 && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold ${
                discrepancyStrikes >= MAX_DISCREPANCY_STRIKES
                  ? 'bg-rose-600/25 border-rose-500 text-rose-200 animate-pulse'
                  : 'bg-amber-500/20 border-amber-500/50 text-amber-200'
              }`}
              title={`Reaching ${MAX_DISCREPANCY_STRIKES} proctoring discrepancies automatically submits the interview`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>
                Discrepancies: {Math.min(discrepancyStrikes, MAX_DISCREPANCY_STRIKES)}/{MAX_DISCREPANCY_STRIKES}
              </span>
            </div>
          )}

          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
              totalAlerts > 0
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
            title="Live AI monitoring only — zero video or audio is recorded or stored"
          >
            {totalAlerts > 0 ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            <span>
              {totalAlerts > 0
                ? `Live Monitor (${totalAlerts} Alert${totalAlerts > 1 ? 's' : ''})`
                : 'Live Monitored • Nothing Stored'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            {isCodingQuestion ? (
              <>
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Timed Coding IDE</span>
              </>
            ) : (
              <>
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>2 in Call</span>
              </>
            )}
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono font-bold text-xs tabular-nums ${
              isSessionTimeCritical
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-200 border-slate-700'
            }`}
            title="Total interview time remaining"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{formatTime(secondsRemaining)} session</span>
          </div>
        </div>
      </header>

      {/* Main Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3.5">
        {isEvaluating && (
          <div className="p-6 rounded-2xl bg-indigo-950/70 border border-indigo-500/40 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
            <Loader2 className="w-7 h-7 text-indigo-400 animate-spin shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Evaluating Your Live Answers, Code &amp; Presence...
              </h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                Computing technical depth, test results, clarity, speaking pace, and confidence.
              </p>
            </div>
          </div>
        )}

        {confirmEndOpen && !isEvaluating && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-rose-100">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>End the interview now and view your performance evaluation?</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmEndOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
              >
                Continue Interview
              </button>
              <button
                type="button"
                onClick={() => handleCompleteInterview(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                End &amp; Evaluate
              </button>
            </div>
          </div>
        )}

        {hardwareBlockedMsg && (
          <div className="px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{hardwareBlockedMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => void startMandatoryMedia()}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Enable Camera &amp; Mic</span>
            </button>
          </div>
        )}

        {multiPersonError && (
          <div
            role="alert"
            className="px-4 py-2.5 rounded-xl bg-rose-600/20 border-2 border-rose-500 text-rose-100 text-xs font-semibold flex items-center justify-between gap-3 shadow-lg shadow-rose-950/50"
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
              <span>{multiPersonError}</span>
            </div>
            <button
              type="button"
              onClick={() => setMultiPersonError(null)}
              className="text-[11px] font-bold underline text-rose-200 hover:text-white cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {gadgetError && (
          <div
            role="alert"
            className="px-4 py-2.5 rounded-xl bg-orange-600/20 border-2 border-orange-500 text-orange-100 text-xs font-semibold flex items-center justify-between gap-3 shadow-lg shadow-orange-950/40"
          >
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-orange-400 shrink-0 animate-pulse" />
              <span>{gadgetError}</span>
            </div>
            <button
              type="button"
              onClick={() => setGadgetError(null)}
              className="text-[11px] font-bold underline text-orange-200 hover:text-white cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {backgroundNoiseAlert && (
          <div
            role="status"
            className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/45 text-amber-200 text-xs flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {backgroundNoiseAlert}
                {noiseHoldMs > 0
                  ? ` (${(Math.min(noiseHoldMs, DISCREPANCY_HOLD_MS) / 1000).toFixed(1)}s / 2.0s)`
                  : ''}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBackgroundNoiseAlert(null)}
              className="text-[11px] font-bold underline cursor-pointer shrink-0"
            >
              Acknowledge
            </button>
          </div>
        )}

        {proctorAlertBanner && (
          <div className="px-3.5 py-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{proctorAlertBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setProctorAlertBanner(null)}
              className="text-[11px] font-bold underline cursor-pointer shrink-0"
            >
              Acknowledge
            </button>
          </div>
        )}

        {/* Branch cleanly between Timed Coding Workspace and Live AI Voice Stage */}
        {isCodingQuestion && currentQuestion ? (
          <>
            {/* Live Proctor PiP Monitor during coding mode (never display:none so CV continues decoding frames) */}
            {hasCameraStream ? (
              codingPipMinimized ? (
                <div className="fixed bottom-16 left-4 z-30 flex items-center gap-2">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-2 h-2 opacity-0 pointer-events-none fixed bottom-0 left-0"
                  />
                  <button
                    type="button"
                    onClick={() => setCodingPipMinimized(false)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold shadow-xl flex items-center gap-2 cursor-pointer ${
                      multiPersonError || gadgetError
                        ? 'bg-rose-950/95 border-rose-500 text-rose-100 animate-pulse'
                        : 'bg-slate-900/95 border-slate-700 text-slate-200 hover:border-slate-500'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {multiPersonHoldMs > 0
                        ? `People ${(multiPersonHoldMs / 1000).toFixed(1)}s/2.0s`
                        : gadgetHoldMs > 0
                          ? `Gadget ${(gadgetHoldMs / 1000).toFixed(1)}s/2.0s`
                          : 'Show Proctor Cam'}
                    </span>
                  </button>
                </div>
              ) : (
                <div
                  className={`fixed bottom-16 left-4 z-30 w-44 rounded-xl border overflow-hidden shadow-2xl bg-slate-900 ${
                    multiPersonError
                      ? 'border-rose-500 ring-2 ring-rose-500/60'
                      : gadgetError
                        ? 'border-orange-500 ring-2 ring-orange-500/60'
                        : 'border-slate-700'
                  }`}
                >
                  <div className="relative aspect-video bg-slate-950">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    <div className="absolute top-1 left-1 right-1 flex items-center justify-between gap-1">
                      <span className="px-1.5 py-0.5 rounded bg-slate-950/85 text-[9px] font-bold text-slate-200">
                        {detectedPersonCount}P
                        {detectedGadgets.length > 0 ? ' • Gadget' : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCodingPipMinimized(true)}
                        className="px-1.5 py-0.5 rounded bg-slate-950/85 text-[9px] font-semibold text-slate-300 hover:text-white cursor-pointer"
                      >
                        Hide
                      </button>
                    </div>
                    {(multiPersonHoldMs > 0 || gadgetHoldMs > 0) && (
                      <div className="absolute inset-x-1 bottom-1 px-1.5 py-0.5 rounded bg-rose-950/90 border border-rose-500/80 text-[9px] font-bold text-rose-100">
                        {multiPersonHoldMs > 0
                          ? `>1 Person: ${(multiPersonHoldMs / 1000).toFixed(1)}s / 2.0s`
                          : `Gadget: ${(gadgetHoldMs / 1000).toFixed(1)}s / 2.0s`}
                      </div>
                    )}
                  </div>
                </div>
              )
            ) : (
              <video ref={videoRef} autoPlay muted playsInline className="w-1 h-1 opacity-0 pointer-events-none fixed" />
            )}
            <CodingWorkspace
              question={currentQuestion}
              questionIndex={currentIdx}
              totalQuestions={session.questions.length}
              code={codingCode}
              language={codingLanguage}
              remainingSeconds={codingRemainingSeconds}
              assignedTimeLimitSeconds={codingAssignedLimitSeconds}
              isLocked={codingLocked}
              isRunningTests={isRunningTests}
              isSubmitting={isSubmitting}
              activeWarningThreshold={activeWarningThreshold}
              runResult={codingRunResult}
              runError={codingRunError}
              submissionResult={codingSubmissionOverlay}
              onCodeChange={(nextCode) => {
                setCodingCode(nextCode);
                codingCodeRef.current = nextCode;
                if (problemRuntimeRef.current[currentQuestion.questionId]) {
                  problemRuntimeRef.current[currentQuestion.questionId].draftCode = nextCode;
                }
                persistDraftDebounced({
                  questionId: currentQuestion.questionId,
                  draftCode: nextCode,
                  draftLanguage: codingLanguageRef.current
                });
              }}
              onLanguageChange={(nextLang) => {
                const previousLang = codingLanguageRef.current;
                setCodingLanguage(nextLang);
                codingLanguageRef.current = nextLang;
                const prevStarter = getStarterCodeFor(currentQuestion, previousLang).trim();
                const currentTrim = codingCodeRef.current.trim();
                let nextCode = codingCodeRef.current;
                if (!currentTrim || currentTrim === prevStarter) {
                  nextCode = getStarterCodeFor(currentQuestion, nextLang);
                  setCodingCode(nextCode);
                  codingCodeRef.current = nextCode;
                }
                persistDraftDebounced({
                  questionId: currentQuestion.questionId,
                  draftCode: nextCode,
                  draftLanguage: nextLang
                });
              }}
              onResetCode={() => {
                const starter = getStarterCodeFor(currentQuestion, codingLanguage);
                setCodingCode(starter);
                codingCodeRef.current = starter;
                persistDraftDebounced({
                  questionId: currentQuestion.questionId,
                  draftCode: starter,
                  draftLanguage: codingLanguage
                });
              }}
              onRunCode={() => void handleRunCodingTests()}
              onSubmitCode={() => void submitCodingProblem(currentQuestion, 'manual')}
            />
          </>
        ) : (
          <>
            {/* Brief Honest Feedback Banner from Previous Problem */}
            {lastTurnFeedback && (
              <div
                className={`px-4 py-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                  lastTurnFeedback.isProperSolution
                    ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-100'
                    : lastTurnFeedback.score >= 30
                      ? 'bg-amber-500/10 border-amber-500/35 text-amber-100'
                      : 'bg-rose-500/10 border-rose-500/35 text-rose-100'
                }`}
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 font-bold">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        lastTurnFeedback.isProperSolution
                          ? 'text-emerald-400'
                          : lastTurnFeedback.score >= 30
                            ? 'text-amber-400'
                            : 'text-rose-400'
                      }`}
                    />
                    <span>
                      Previous Answer Feedback (Q{lastTurnFeedback.questionNumber} •{' '}
                      {lastTurnFeedback.submissionType === 'auto' ? 'Auto-Stopped at Timer' : 'Submitted'})
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-950/70 border border-slate-700/80 font-mono text-[10px]">
                      Score: {lastTurnFeedback.score}/100 •{' '}
                      {lastTurnFeedback.isProperSolution ? 'Valid Solution' : 'Needs Improvement'}
                    </span>
                  </div>
                  <p className="text-slate-200 leading-relaxed">{lastTurnFeedback.text}</p>
                  {(lastTurnFeedback.matchedKeywords.length > 0 || lastTurnFeedback.missingKeywords.length > 0) && (
                    <div className="flex flex-wrap gap-2 text-[10px] pt-0.5">
                      {lastTurnFeedback.matchedKeywords.length > 0 && (
                        <span className="text-emerald-300">
                          Matched: {lastTurnFeedback.matchedKeywords.slice(0, 4).join(', ')}
                        </span>
                      )}
                      {lastTurnFeedback.missingKeywords.length > 0 && (
                        <span className="text-amber-300">
                          Missing: {lastTurnFeedback.missingKeywords.slice(0, 3).join(', ')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setLastTurnFeedback(null)}
                  className="text-[11px] font-semibold underline text-slate-300 hover:text-white shrink-0 self-start sm:self-center cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Two Live Video Tiles + Live AI Conversation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tile 1: AI Interview Host */}
                <div
                  className={`relative rounded-2xl border overflow-hidden flex flex-col justify-between p-4 min-h-[290px] transition-all bg-linear-to-br from-slate-900 via-slate-900 to-indigo-950/60 ${
                    isAiSpeaking ? 'border-indigo-400 ring-2 ring-indigo-500/40' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950/85 border border-slate-800 text-xs font-semibold">
                      <Bot className="w-3.5 h-3.5 text-indigo-400" />
                      <span>AI Interview Host</span>
                      {isAiSpeaking && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                          <Radio className="w-3 h-3 animate-pulse" />
                          Speaking
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-mono text-[11px] font-bold tabular-nums ${
                          voiceRemainingSeconds <= 15
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                            : voiceRemainingSeconds <= 30
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                              : 'bg-slate-950/80 border-slate-700 text-indigo-300'
                        }`}
                        title="Time remaining for this question before mic stops & auto-advances"
                      >
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(voiceRemainingSeconds)}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-[10px] font-semibold text-indigo-300">
                        {turnLabel}
                      </span>
                    </div>
                  </div>

                  {/* Per-Question Voice Countdown Progress Bar + 30s / 15s Warning */}
                  <div className="mt-2 space-y-1">
                    <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          voiceRemainingSeconds <= 15
                            ? 'bg-rose-500'
                            : voiceRemainingSeconds <= 30
                              ? 'bg-amber-400'
                              : 'bg-indigo-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, Math.round((voiceRemainingSeconds / Math.max(1, voiceAssignedLimitSeconds)) * 100))
                          )}%`
                        }}
                      />
                    </div>
                    {voiceWarningThreshold && (
                      <div
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center justify-between ${
                          voiceWarningThreshold === 15
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        <span>
                          {voiceWarningThreshold}s left — mic will stop &amp; advance with brief feedback at 00:00
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="my-auto py-3 flex flex-col items-center text-center gap-3">
                    <div className="relative flex items-center justify-center">
                      {isAiSpeaking && (
                        <span className="absolute w-22 h-22 rounded-full bg-indigo-500/20 animate-ping" />
                      )}
                      <div
                        className={`relative w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${
                          isAiSpeaking
                            ? 'bg-indigo-600/30 border-indigo-400 shadow-lg shadow-indigo-500/30'
                            : 'bg-slate-800/90 border-slate-700'
                        }`}
                      >
                        <Bot className="w-7 h-7 text-indigo-300" />
                      </div>
                    </div>

                    <div className="w-full bg-slate-950/85 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-left">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-400">
                        <span>
                          Question {currentIdx + 1} of {session.questions.length}
                          {followUpsCount > 0 ? ' • Follow-up Probe' : ''}
                        </span>
                        {currentQuestion?.keyPoints && currentQuestion.keyPoints.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowKeyPoints((v) => !v)}
                            className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-300 cursor-pointer"
                          >
                            <HelpCircle className="w-3 h-3" />
                            <span>{showKeyPoints ? 'Hide Hints' : 'Hints'}</span>
                          </button>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                        {currentQuestion?.questionText}
                      </p>

                      {showKeyPoints && currentQuestion?.keyPoints && (
                        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                          <span className="font-semibold text-indigo-400">Cover: </span>
                          {currentQuestion.keyPoints.join(' • ')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isEvaluating || isAiTransitioning || isTranscribing}
                      onClick={() => void handleRepeatQuestion()}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3 h-3 text-indigo-400" />
                      <span>Repeat Question</span>
                    </button>

                    <button
                      type="button"
                      disabled={isEvaluating || isAiTransitioning || isTranscribing}
                      onClick={() => void handleClarifyQuestion()}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <MessageCircle className="w-3 h-3 text-purple-400" />
                      <span>Ask AI to Clarify</span>
                    </button>
                  </div>
                </div>

                {/* Tile 2: Candidate Live Camera & Mic Feed */}
                <div
                  className={`relative rounded-2xl border overflow-hidden flex flex-col justify-between bg-slate-900 min-h-[290px] transition-all ${
                    multiPersonError
                      ? 'border-rose-500 ring-2 ring-rose-500/60'
                      : gadgetError
                        ? 'border-orange-500 ring-2 ring-orange-500/60'
                        : audioLevel > 12 && hasMicStream
                          ? 'border-emerald-400 ring-2 ring-emerald-500/30'
                          : 'border-slate-800'
                  }`}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-200 ${
                      hasCameraStream ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  />

                  {/* Real-time Computer Vision Bounding Boxes Overlay (mirrored to match video) */}
                  {hasCameraStream &&
                    ((detectedPersonBoxes.length > 0 && detectedPersonCount > 1) || detectedGadgets.length > 0) && (
                      <div className="absolute inset-0 z-10 pointer-events-none">
                        {detectedPersonCount > 1 &&
                          detectedPersonBoxes.map((box, idx) => {
                            const mirroredLeftPct = Math.max(0, Math.min(100 - box.wPct, 100 - (box.xPct + box.wPct)));
                            return (
                              <div
                                key={`person-${idx}`}
                                style={{
                                  left: `${mirroredLeftPct}%`,
                                  top: `${box.yPct}%`,
                                  width: `${box.wPct}%`,
                                  height: `${box.hPct}%`
                                }}
                                className="absolute border-2 border-rose-500 bg-rose-500/10 rounded-lg transition-all duration-150"
                              >
                                <span className="inline-block px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-br-md">
                                  Person {idx + 1}
                                </span>
                              </div>
                            );
                          })}
                        {detectedGadgets.map((gadget, idx) => {
                          const mirroredLeftPct = Math.max(
                            0,
                            Math.min(100 - gadget.wPct, 100 - (gadget.xPct + gadget.wPct))
                          );
                          return (
                            <div
                              key={`gadget-${idx}`}
                              style={{
                                left: `${mirroredLeftPct}%`,
                                top: `${gadget.yPct}%`,
                                width: `${gadget.wPct}%`,
                                height: `${gadget.hPct}%`
                              }}
                              className="absolute border-2 border-orange-400 bg-orange-500/15 rounded-lg transition-all duration-150"
                            >
                              <span className="inline-block px-1.5 py-0.5 bg-orange-600 text-white text-[10px] font-bold rounded-br-md">
                                {gadget.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  {/* Prominent On-Video Warning Stack (>1 Person & Unauthorized Gadgets with live 2.0s Hold Timer) */}
                  {hasCameraStream &&
                    (detectedPersonCount > 1 || multiPersonError || gadgetError || detectedGadgets.length > 0) && (
                      <div className="absolute inset-x-3 top-13 z-20 flex flex-col gap-2 pointer-events-none">
                        {(detectedPersonCount > 1 || multiPersonError) && (
                          <div
                            role="alert"
                            className="p-2.5 rounded-xl bg-rose-950/90 border-2 border-rose-500 text-white shadow-xl backdrop-blur-xs space-y-1.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 min-w-0">
                                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                                <div className="min-w-0">
                                  <p className="text-xs font-extrabold text-rose-200">
                                    Multiple People Detected ({Math.max(2, detectedPersonCount)} in Frame)
                                  </p>
                                  <p className="text-[11px] text-rose-100 leading-snug mt-0.5">
                                    Only 1 candidate is allowed. Clear within 2s to avoid a strike.
                                  </p>
                                </div>
                              </div>
                              <span className="px-1.5 py-0.5 rounded bg-rose-600/90 font-mono text-[10px] font-bold shrink-0 tabular-nums">
                                {(Math.min(multiPersonHoldMs, DISCREPANCY_HOLD_MS) / 1000).toFixed(1)}s / 2.0s
                              </span>
                            </div>
                            <div className="h-1 w-full rounded-full bg-rose-900/80 overflow-hidden">
                              <div
                                className="h-full bg-rose-400 transition-all duration-150"
                                style={{
                                  width: `${Math.min(100, Math.round((multiPersonHoldMs / DISCREPANCY_HOLD_MS) * 100))}%`
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {(gadgetError || detectedGadgets.length > 0) && (
                          <div
                            role="alert"
                            className="p-2.5 rounded-xl bg-orange-950/90 border-2 border-orange-500 text-white shadow-xl backdrop-blur-xs space-y-1.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 min-w-0">
                                <Smartphone className="w-5 h-5 text-orange-400 shrink-0 mt-0.5 animate-pulse" />
                                <div className="min-w-0">
                                  <p className="text-xs font-extrabold text-orange-200">
                                    Unauthorized Gadget Detected
                                    {detectedGadgets.length > 0
                                      ? ` (${Array.from(new Set(detectedGadgets.map((g) => g.label))).join(', ')})`
                                      : ''}
                                  </p>
                                  <p className="text-[11px] text-orange-100 leading-snug mt-0.5">
                                    Remove device within 2s to avoid a discrepancy strike.
                                  </p>
                                </div>
                              </div>
                              <span className="px-1.5 py-0.5 rounded bg-orange-600/90 font-mono text-[10px] font-bold shrink-0 tabular-nums">
                                {(Math.min(gadgetHoldMs, DISCREPANCY_HOLD_MS) / 1000).toFixed(1)}s / 2.0s
                              </span>
                            </div>
                            <div className="h-1 w-full rounded-full bg-orange-900/80 overflow-hidden">
                              <div
                                className="h-full bg-orange-400 transition-all duration-150"
                                style={{
                                  width: `${Math.min(100, Math.round((gadgetHoldMs / DISCREPANCY_HOLD_MS) * 100))}%`
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  {!hasCameraStream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-slate-900 text-slate-400 px-4 text-center">
                      <div className="w-18 h-18 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <UserIcon className="w-8 h-8 text-slate-400" />
                      </div>
                      <span className="text-xs font-semibold text-slate-300">
                        {hardwareBlockedMsg ? 'Text Mode Active (Webcam Optional)' : 'Waiting for Webcam Feed...'}
                      </span>
                    </div>
                  )}

                  <div className="relative z-10 p-3 flex items-center justify-between gap-2 bg-linear-to-b from-slate-950/80 to-transparent">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/85 border border-slate-700/80 text-xs font-semibold text-white">
                      <Video className="w-3.5 h-3.5 text-emerald-400" />
                      <span>You</span>
                      {hasCameraStream && cvEngineActive && (
                        <span
                          className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            detectedPersonCount > 1
                              ? 'bg-rose-600 text-white'
                              : detectedPersonCount === 0
                                ? 'bg-amber-500/25 text-amber-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {detectedPersonCount} {detectedPersonCount === 1 ? 'Person' : 'People'}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {(multiPersonError || detectedPersonCount > 1) && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-600/95 border border-rose-300 text-white text-[10px] font-bold animate-pulse">
                          <Users className="w-3 h-3" />
                          <span>{Math.max(2, detectedPersonCount)} People</span>
                        </div>
                      )}
                      {(gadgetError || detectedGadgets.length > 0) && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-600/95 border border-orange-300 text-white text-[10px] font-bold animate-pulse">
                          <Smartphone className="w-3 h-3" />
                          <span>Gadget</span>
                        </div>
                      )}
                      {backgroundNoiseAlert && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/90 border border-amber-300 text-slate-950 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3" />
                          <span>
                            Excess Noise{noiseHoldMs > 0 ? ` (${(noiseHoldMs / 1000).toFixed(1)}s)` : ''}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950/85 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                        <Lock className="w-3 h-3" />
                        <span>Live Only • Not Saved</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 p-3 flex items-end justify-between gap-2 bg-linear-to-t from-slate-950/85 via-slate-950/40 to-transparent">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950/85 border border-slate-700/80">
                      {hasMicStream && !isMicPaused ? (
                        <Mic className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <MicOff className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <div className="flex items-end gap-0.5 h-4 w-10" aria-label="Microphone audio level">
                        {[12, 26, 42, 60, 80].map((threshold, idx) => (
                          <span
                            key={idx}
                            className={`w-1.5 rounded-full transition-all duration-100 ${
                              hasMicStream && !isMicPaused && audioLevel >= threshold
                                ? 'bg-emerald-400'
                                : 'bg-slate-700'
                            }`}
                            style={{ height: `${30 + idx * 16}%` }}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-medium text-slate-200">
                        {!hasMicStream ? 'Text Mode' : isMicPaused ? 'Paused' : isAiSpeaking ? 'Waiting' : 'Live Voice On'}
                      </span>
                    </div>

                    <div className="px-2.5 py-1 rounded-lg bg-slate-950/85 border border-slate-700/80 text-[11px] text-slate-200 font-mono">
                      {wordCount > 0 ? `${wordCount} words` : hasMicStream ? 'Listening live' : 'Type answer'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 4 Cols: Live AI Conversation Feed */}
              <aside className="lg:col-span-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col max-h-[360px] lg:max-h-[420px]">
                <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                    <MessageCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Live AI Conversation</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Say &ldquo;repeat&rdquo; or &ldquo;clarify&rdquo;</span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
                  {conversation.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-2.5 rounded-xl border leading-relaxed ${
                        msg.sender === 'ai'
                          ? 'bg-indigo-950/40 border-indigo-500/30 text-slate-100'
                          : msg.sender === 'monitor'
                            ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                            : 'bg-slate-950 border-slate-800 text-slate-200 ml-4'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span
                          className={`font-bold ${
                            msg.sender === 'ai'
                              ? 'text-indigo-400'
                              : msg.sender === 'monitor'
                                ? 'text-rose-400'
                                : 'text-emerald-400'
                          }`}
                        >
                          {msg.sender === 'ai'
                            ? 'AI Interviewer'
                            : msg.sender === 'monitor'
                              ? 'Proctor Monitor'
                              : 'You'}
                        </span>
                        <span className="text-slate-500 font-mono">{msg.time}</span>
                      </div>
                      <p>{msg.text}</p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </aside>
            </div>

            {/* Wispr-Flow Style Real-Time Voice Transcription & Editing Panel */}
            <section className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-200">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Live Speech Transcript</span>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${sttBadge.tone}`}>
                    {sttStatus === 'live' && !isMicPaused && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                    <span>{sttBadge.text}</span>
                  </span>
                  {isTranscribing && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Refining Technical Terms...
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {hasMicStream && (
                    <button
                      type="button"
                      onClick={handleToggleMicPause}
                      disabled={isSubmitting || isAiTransitioning || isEvaluating}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-slate-200 inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isMicPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
                      <span>{isMicPaused ? 'Resume Listening' : 'Stop Listening'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleRetryVoiceAnswer}
                    disabled={isSubmitting || isTranscribing || isAiTransitioning || isEvaluating}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-slate-200 inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3 h-3 text-indigo-400" />
                    <span>Retry Answer</span>
                  </button>
                </div>
              </div>

              {/* Distinct finalized vs interim live transcript preview strip */}
              {(answerInput || interimSpeech) && (
                <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs leading-relaxed">
                  <span className="text-slate-100">{answerInput}</span>
                  {interimSpeech && (
                    <span className="text-indigo-300 italic">
                      {answerInput ? ' ' : ''}
                      {interimSpeech}
                    </span>
                  )}
                </div>
              )}

              <textarea
                rows={2}
                disabled={voiceTimeExpiredLocked || isSubmitting || isEvaluating}
                value={combinedPreview}
                onChange={(e) => {
                  const val = e.target.value;
                  userManuallyEditedVoiceRef.current = true;
                  interimSpeechRef.current = '';
                  setInterimSpeech('');
                  setAnswerInput(val);
                  answerInputRef.current = val;
                  transcriberRef.current?.setFinalizedTextManual(val);
                  if (currentQuestion) {
                    persistDraftDebounced({
                      questionId: currentQuestion.questionId,
                      voiceDraft: val
                    });
                  }
                }}
                placeholder={
                  voiceTimeExpiredLocked
                    ? 'Time expired — saving your response and advancing...'
                    : hasMicStream
                      ? 'Speak naturally (technical terms like LIFO, FIFO, Big-O, async/await are recognized live) or edit text here...'
                      : 'Type your response clearly here (text fallback active)...'
                }
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed select-text disabled:opacity-60"
              />
            </section>
          </>
        )}
      </main>

      {/* Bottom Dock */}
      <footer className="px-4 sm:px-6 py-3 bg-slate-900/95 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${
                hasMicStream
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{hasMicStream ? 'Mic Active' : 'Text Fallback'}</span>
            </div>

            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${
                hasCameraStream
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{hasCameraStream ? 'Camera Active' : 'Camera Off'}</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-[11px] font-medium text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Privacy Safe • Zero Media Storage</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {!isCodingQuestion && (
              <>
                <button
                  type="button"
                  disabled={isSubmitting || isTranscribing || isAiTransitioning || isEvaluating}
                  onClick={() => void handleSubmitVoiceAnswer('(Candidate skipped to the next question)')}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 cursor-pointer disabled:opacity-50"
                >
                  Skip
                </button>

                <button
                  type="button"
                  disabled={isSubmitting || isTranscribing || isAiTransitioning || isEvaluating}
                  onClick={() => void handleSubmitVoiceAnswer()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>
                    {isTranscribing
                      ? 'Refining Speech...'
                      : isAiTransitioning
                        ? 'AI Evaluating...'
                        : isLastQuestion
                          ? 'Submit & Finish Interview'
                          : 'Submit Answer & Continue'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <button
              type="button"
              disabled={isEvaluating}
              onClick={() => setConfirmEndOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="End interview and evaluate"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">End Interview</span>
            </button>
          </div>
        </div>
      </footer>

      {completedSessionForReview && (
        <PostInterviewFeedbackModal
          session={completedSessionForReview}
          theme={theme}
          timedOut={didTimeOut}
          autoSubmitReason={autoSubmitReasonState || undefined}
          onComplete={() => onFinishSession(completedSessionForReview)}
        />
      )}
    </div>
  );
};
