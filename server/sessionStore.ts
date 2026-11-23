import fs from 'node:fs';
import path from 'node:path';
import type {
  CodingExecutionResult,
  CodingLanguage,
  CodingProblemEvaluation,
  CodingSubmissionType,
  CodingTestCaseResult,
  ConversationTurnContext,
  DifficultyLevel,
  VoiceQuestionEvaluation
} from '../src/types/hireboost';

export interface ServerProblemState {
  questionId: string;
  questionType: 'voice' | 'coding';
  difficulty: DifficultyLevel;
  assignedTimeLimitSeconds: number;
  startTimestamp?: number;
  deadlineTimestamp?: number;
  submissionTimestamp?: number;
  submittedCode?: string;
  language?: CodingLanguage;
  submissionType?: CodingSubmissionType;
  completedWithinTime?: boolean;
  executionResults?: CodingExecutionResult;
  testCaseResults?: CodingTestCaseResult[];
  evaluationScore?: number;
  codingEvaluation?: CodingProblemEvaluation;
  draftCode?: string;
  draftLanguage?: CodingLanguage;
}

export interface ServerVoiceState {
  questionId: string;
  originalTranscription?: string;
  finalResponse: string;
  aiEvaluation?: VoiceQuestionEvaluation;
  conversationContext?: ConversationTurnContext[];
  submissionType?: CodingSubmissionType;
  durationSeconds: number;
  submittedAt: number;
}

export interface ServerInterviewSession {
  sessionId: string;
  userId: string;
  createdAt: number;
  startedAt: number;
  completedAt?: number;
  status: 'In_Progress' | 'Completed';
  activeQuestionIndex: number;
  questionOrder: string[];
  problems: Record<string, ServerProblemState>;
  voiceAnswers: Record<string, ServerVoiceState>;
  voiceDrafts: Record<string, string>;
}

const STORE_FILE = path.resolve(process.cwd(), '.hireboost-sessions.json');
const sessionsMap = new Map<string, ServerInterviewSession>();

function parseEnvMinutes(envVal: string | undefined, fallback: number, max = 60): number {
  const n = Number(envVal);
  if (!Number.isFinite(n) || n < 1 || n > max) return fallback;
  return Math.round(n);
}

let serverCodingLimitsMinutes: Record<DifficultyLevel, number> = {
  Easy: parseEnvMinutes(process.env.CODING_LIMIT_EASY_MIN, 10, 60),
  Medium: parseEnvMinutes(process.env.CODING_LIMIT_MEDIUM_MIN, 20, 60),
  Hard: parseEnvMinutes(process.env.CODING_LIMIT_HARD_MIN, 30, 60)
};

let serverVoiceLimitsMinutes: Record<DifficultyLevel, number> = {
  Easy: parseEnvMinutes(process.env.VOICE_LIMIT_EASY_MIN, 2, 15),
  Medium: parseEnvMinutes(process.env.VOICE_LIMIT_MEDIUM_MIN, 3, 15),
  Hard: parseEnvMinutes(process.env.VOICE_LIMIT_HARD_MIN, 4, 15)
};

function loadFromDisk() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (parsed.codingLimits) {
          serverCodingLimitsMinutes = {
            Easy: parseEnvMinutes(String(parsed.codingLimits.Easy), serverCodingLimitsMinutes.Easy, 60),
            Medium: parseEnvMinutes(String(parsed.codingLimits.Medium), serverCodingLimitsMinutes.Medium, 60),
            Hard: parseEnvMinutes(String(parsed.codingLimits.Hard), serverCodingLimitsMinutes.Hard, 60)
          };
        }
        if (parsed.voiceLimits) {
          serverVoiceLimitsMinutes = {
            Easy: parseEnvMinutes(String(parsed.voiceLimits.Easy), serverVoiceLimitsMinutes.Easy, 15),
            Medium: parseEnvMinutes(String(parsed.voiceLimits.Medium), serverVoiceLimitsMinutes.Medium, 15),
            Hard: parseEnvMinutes(String(parsed.voiceLimits.Hard), serverVoiceLimitsMinutes.Hard, 15)
          };
        }
        if (parsed.sessions && typeof parsed.sessions === 'object') {
          for (const [k, v] of Object.entries(parsed.sessions)) {
            sessionsMap.set(k, v as ServerInterviewSession);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Could not load session store from disk, starting fresh:', err);
  }
}

let writePending = false;
function persistToDisk() {
  if (writePending) return;
  writePending = true;
  setTimeout(() => {
    writePending = false;
    try {
      const allSessions: Record<string, ServerInterviewSession> = {};
      const entries = Array.from(sessionsMap.entries()).slice(-100);
      for (const [k, v] of entries) {
        allSessions[k] = v;
      }
      fs.writeFileSync(
        STORE_FILE,
        JSON.stringify(
          {
            codingLimits: serverCodingLimitsMinutes,
            voiceLimits: serverVoiceLimitsMinutes,
            sessions: allSessions
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch (err) {
      console.warn('Failed to persist session store:', err);
    }
  }, 100);
}

loadFromDisk();

export function getServerCodingLimitsMinutes(): Record<DifficultyLevel, number> {
  return { ...serverCodingLimitsMinutes };
}

export function getServerVoiceLimitsMinutes(): Record<DifficultyLevel, number> {
  return { ...serverVoiceLimitsMinutes };
}

export function updateServerCodingLimitsMinutes(
  next: Partial<Record<DifficultyLevel, number>>
): Record<DifficultyLevel, number> {
  serverCodingLimitsMinutes = {
    Easy: parseEnvMinutes(next.Easy !== undefined ? String(next.Easy) : undefined, serverCodingLimitsMinutes.Easy, 60),
    Medium: parseEnvMinutes(next.Medium !== undefined ? String(next.Medium) : undefined, serverCodingLimitsMinutes.Medium, 60),
    Hard: parseEnvMinutes(next.Hard !== undefined ? String(next.Hard) : undefined, serverCodingLimitsMinutes.Hard, 60)
  };
  persistToDisk();
  return { ...serverCodingLimitsMinutes };
}

export function updateServerVoiceLimitsMinutes(
  next: Partial<Record<DifficultyLevel, number>>
): Record<DifficultyLevel, number> {
  serverVoiceLimitsMinutes = {
    Easy: parseEnvMinutes(next.Easy !== undefined ? String(next.Easy) : undefined, serverVoiceLimitsMinutes.Easy, 15),
    Medium: parseEnvMinutes(next.Medium !== undefined ? String(next.Medium) : undefined, serverVoiceLimitsMinutes.Medium, 15),
    Hard: parseEnvMinutes(next.Hard !== undefined ? String(next.Hard) : undefined, serverVoiceLimitsMinutes.Hard, 15)
  };
  persistToDisk();
  return { ...serverVoiceLimitsMinutes };
}

export function getTimeLimitSecondsForDifficulty(
  difficulty: DifficultyLevel,
  sessionLimits?: Partial<Record<DifficultyLevel, number>>
): number {
  const mins = sessionLimits?.[difficulty] ?? serverCodingLimitsMinutes[difficulty] ?? 20;
  return Math.max(60, Math.round(mins * 60));
}

export function getVoiceTimeLimitSecondsForDifficulty(
  difficulty: DifficultyLevel,
  sessionLimits?: Partial<Record<DifficultyLevel, number>>
): number {
  const mins = sessionLimits?.[difficulty] ?? serverVoiceLimitsMinutes[difficulty] ?? 3;
  return Math.max(45, Math.round(mins * 60));
}

export function initOrGetServerSession(params: {
  sessionId: string;
  userId: string;
  questions: Array<{
    questionId: string;
    questionType?: 'voice' | 'coding';
    difficulty?: DifficultyLevel;
    timeLimitSeconds?: number;
  }>;
  sessionCodingLimits?: Partial<Record<DifficultyLevel, number>>;
  sessionVoiceLimits?: Partial<Record<DifficultyLevel, number>>;
}): ServerInterviewSession {
  const existing = sessionsMap.get(params.sessionId);
  if (existing) {
    return existing;
  }

  const now = Date.now();
  const problems: Record<string, ServerProblemState> = {};
  const questionOrder: string[] = [];

  for (const q of params.questions) {
    questionOrder.push(q.questionId);
    const diff: DifficultyLevel = q.difficulty || 'Medium';
    const qType = q.questionType || 'voice';
    const limitSecs =
      qType === 'coding'
        ? q.timeLimitSeconds && q.timeLimitSeconds > 0
          ? q.timeLimitSeconds
          : getTimeLimitSecondsForDifficulty(diff, params.sessionCodingLimits)
        : q.timeLimitSeconds && q.timeLimitSeconds > 0
          ? q.timeLimitSeconds
          : getVoiceTimeLimitSecondsForDifficulty(diff, params.sessionVoiceLimits);

    problems[q.questionId] = {
      questionId: q.questionId,
      questionType: qType,
      difficulty: diff,
      assignedTimeLimitSeconds: limitSecs
    };
  }

  // Activate the first problem timer automatically
  const firstId = questionOrder[0];
  if (firstId && problems[firstId]) {
    problems[firstId].startTimestamp = now;
    problems[firstId].deadlineTimestamp = now + problems[firstId].assignedTimeLimitSeconds * 1000;
  }

  const created: ServerInterviewSession = {
    sessionId: params.sessionId,
    userId: params.userId,
    createdAt: now,
    startedAt: now,
    status: 'In_Progress',
    activeQuestionIndex: 0,
    questionOrder,
    problems,
    voiceAnswers: {},
    voiceDrafts: {}
  };

  sessionsMap.set(params.sessionId, created);
  persistToDisk();
  return created;
}

export function getServerSession(sessionId: string): ServerInterviewSession | undefined {
  return sessionsMap.get(sessionId);
}

export function activateProblemOnServer(
  sessionId: string,
  questionId: string
): { session: ServerInterviewSession; problem: ServerProblemState } | null {
  const session = sessionsMap.get(sessionId);
  if (!session) return null;

  const prob = session.problems[questionId];
  if (!prob) return null;

  const idx = session.questionOrder.indexOf(questionId);
  if (idx >= 0 && idx > session.activeQuestionIndex) {
    session.activeQuestionIndex = idx;
  }

  // Idempotent for BOTH coding and voice questions: NEVER reset startTimestamp if already started!
  if (!prob.startTimestamp) {
    const now = Date.now();
    prob.startTimestamp = now;
    prob.deadlineTimestamp = now + prob.assignedTimeLimitSeconds * 1000;
    persistToDisk();
  }

  return { session, problem: prob };
}

export function saveDraftOnServer(params: {
  sessionId: string;
  questionId: string;
  draftCode?: string;
  draftLanguage?: CodingLanguage;
  voiceDraft?: string;
}) {
  const session = sessionsMap.get(params.sessionId);
  if (!session) return null;

  const prob = session.problems[params.questionId];
  if (prob && !prob.submissionTimestamp) {
    if (typeof params.draftCode === 'string') prob.draftCode = params.draftCode;
    if (params.draftLanguage) prob.draftLanguage = params.draftLanguage;
  }
  if (typeof params.voiceDraft === 'string') {
    session.voiceDrafts[params.questionId] = params.voiceDraft;
  }
  persistToDisk();
  return session;
}

export function recordCodingSubmissionOnServer(params: {
  sessionId: string;
  questionId: string;
  submittedCode: string;
  language: CodingLanguage;
  submissionType: CodingSubmissionType;
  executionResults: CodingExecutionResult;
  testCaseResults: CodingTestCaseResult[];
  evaluationScore: number;
  codingEvaluation: CodingProblemEvaluation;
}): { duplicatePrevented: boolean; problem: ServerProblemState; session: ServerInterviewSession } | null {
  const session = sessionsMap.get(params.sessionId);
  if (!session) return null;

  const prob = session.problems[params.questionId];
  if (!prob) return null;

  if (prob.submissionTimestamp) {
    return { duplicatePrevented: true, problem: prob, session };
  }

  const now = Date.now();
  const startTs = prob.startTimestamp || now;
  const deadlineTs = prob.deadlineTimestamp || startTs + prob.assignedTimeLimitSeconds * 1000;
  const completedWithinTime = now <= deadlineTs + 3000;

  prob.startTimestamp = startTs;
  prob.deadlineTimestamp = deadlineTs;
  prob.submissionTimestamp = now;
  prob.submittedCode = params.submittedCode;
  prob.language = params.language;
  prob.submissionType = params.submissionType;
  prob.completedWithinTime = completedWithinTime;
  prob.executionResults = params.executionResults;
  prob.testCaseResults = params.testCaseResults;
  prob.evaluationScore = params.evaluationScore;
  prob.codingEvaluation = params.codingEvaluation;

  const curIdx = session.questionOrder.indexOf(params.questionId);
  if (curIdx >= 0 && curIdx + 1 < session.questionOrder.length) {
    session.activeQuestionIndex = curIdx + 1;
  }

  persistToDisk();
  return { duplicatePrevented: false, problem: prob, session };
}

export function recordVoiceSubmissionOnServer(params: {
  sessionId: string;
  questionId: string;
  originalTranscription?: string;
  finalResponse: string;
  aiEvaluation?: VoiceQuestionEvaluation;
  conversationContext?: ConversationTurnContext[];
  submissionType?: CodingSubmissionType;
  durationSeconds: number;
}): { duplicatePrevented: boolean; voiceAnswer: ServerVoiceState; session: ServerInterviewSession } | null {
  const session = sessionsMap.get(params.sessionId);
  if (!session) return null;

  const existing = session.voiceAnswers[params.questionId];
  if (existing) {
    return { duplicatePrevented: true, voiceAnswer: existing, session };
  }

  const voiceAnswer: ServerVoiceState = {
    questionId: params.questionId,
    originalTranscription: params.originalTranscription,
    finalResponse: params.finalResponse,
    aiEvaluation: params.aiEvaluation,
    conversationContext: params.conversationContext,
    submissionType: params.submissionType || 'manual',
    durationSeconds: params.durationSeconds,
    submittedAt: Date.now()
  };

  session.voiceAnswers[params.questionId] = voiceAnswer;

  const prob = session.problems[params.questionId];
  if (prob && !prob.submissionTimestamp) {
    prob.submissionTimestamp = voiceAnswer.submittedAt;
    prob.submissionType = voiceAnswer.submissionType;
  }

  const curIdx = session.questionOrder.indexOf(params.questionId);
  if (curIdx >= 0 && curIdx + 1 < session.questionOrder.length) {
    session.activeQuestionIndex = curIdx + 1;
  }

  persistToDisk();
  return { duplicatePrevented: false, voiceAnswer, session };
}

export function completeServerSession(sessionId: string): ServerInterviewSession | null {
  const session = sessionsMap.get(sessionId);
  if (!session) return null;
  session.status = 'Completed';
  session.completedAt = Date.now();
  persistToDisk();
  return session;
}
