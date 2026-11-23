import express from 'express';
import type { Request, Response } from 'express';
import http from 'node:http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import JSZip from 'jszip';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  executeCodeWithTestCases
} from './server/codeRunner';
import {
  activateProblemOnServer,
  completeServerSession,
  getServerCodingLimitsMinutes,
  getServerSession,
  getServerVoiceLimitsMinutes,
  getTimeLimitSecondsForDifficulty,
  getVoiceTimeLimitSecondsForDifficulty,
  initOrGetServerSession,
  recordCodingSubmissionOnServer,
  recordVoiceSubmissionOnServer,
  saveDraftOnServer,
  updateServerCodingLimitsMinutes,
  updateServerVoiceLimitsMinutes
} from './server/sessionStore';
import {
  attachLiveTranscribeWebSocket,
  buildTechnicalKeyterms,
  getDeepgramApiKey
} from './server/liveTranscribeWs';
import { selectCodingProblemsForConfig } from './src/data/codingProblems';
import { analyzeInterviewResponse } from './src/utils/responseAnalyzer';
import type {
  CodingLanguage,
  CustomResumeTemplateSpec,
  DifficultyLevel,
  ResumeIconName,
  ResumeSectionKey
} from './src/types/hireboost';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

const GEMINI_MODEL = 'gemini-4-hydrogen';

// Clean timeout wrapper that always clears timers and avoids unhandled rejections
async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  promise.catch(() => {});
  let timerId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timerId = setTimeout(() => reject(new Error(`${label} timeout (${ms}ms)`)), ms);
      })
    ]);
  } finally {
    if (timerId !== undefined) clearTimeout(timerId);
  }
}

// Initialize Google Gemini AI SDK if key exists
const apiKey = process.env.GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI with provided key, using demo mode fallback:', err);
  }
}

const FALLBACK_DAILY_TIPS = [
  {
    tip: 'State your approach and edge cases aloud before coding. Interviewers score clarity and trade-off reasoning alongside your final solution.',
    category: 'Technical Clarity'
  },
  {
    tip: 'Use the STAR format with one real number for behavioral answers. Quantifying impact turns vague stories into strong proof.',
    category: 'Behavioral Impact'
  },
  {
    tip: 'Pause for two seconds before answering hard questions to structure three clear points instead of rushing into filler words.',
    category: 'Confidence & Pacing'
  },
  {
    tip: 'Always mention time and space complexity unprompted at the end of a coding answer, then note one way to optimize further.',
    category: 'System & DSA'
  },
  {
    tip: 'Keep camera eye-level and look toward the lens when finishing key points to project calm confidence in video interviews.',
    category: 'Video Presence'
  }
];

// Predefined domain question sets for fallback and instant demo mode
const PREDEFINED_QUESTIONS: Record<string, Record<string, string[]>> = {
  'Data Structures and Algorithms': {
    Easy: [
      'Explain the difference between an Array and a Linked List in terms of memory layout and search time complexity.',
      'How would you detect a cycle in a singly linked list? Describe Floyd\'s Cycle Detection algorithm.',
      'Explain how a Hash Table works and how hash collisions are typically resolved.'
    ],
    Medium: [
      'Explain the concept of Dynamic Programming and how it differs from Divide and Conquer. Provide an example problem (e.g., Coin Change or Longest Common Subsequence).',
      'Given a Binary Search Tree, how do you validate whether it satisfies the BST property? What is the time and space complexity?',
      'Describe Dijkstra’s shortest path algorithm. How does it handle negative edge weights, and why?'
    ],
    Hard: [
      'Explain how you would design and implement an LRU (Least Recently Used) Cache with O(1) get and put operations.',
      'Describe the working principle of the Aho-Corasick automaton or Trie-based multi-pattern string matching.',
      'Explain how a B-Tree or Red-Black Tree maintains logarithmic search, insertion, and deletion guarantees during self-balancing.'
    ]
  },
  'Python': {
    Easy: [
      'What is the difference between a list and a tuple in Python, and when would you use each?',
      'Explain how memory management and garbage collection work in Python (reference counting and cyclic GC).',
      'What are Python decorators and how do they function under the hood?'
    ],
    Medium: [
      'Explain the Python GIL (Global Interpreter Lock). How does it affect multithreading vs multiprocessing in CPU-bound vs I/O-bound tasks?',
      'What is the difference between `@classmethod`, `@staticmethod`, and regular instance methods in Python?',
      'How do Python generators and the `yield` statement enable memory-efficient lazy evaluation?'
    ],
    Hard: [
      'Explain metaclasses in Python. How does `__new__` differ from `__init__`, and when would you construct a custom metaclass?',
      'How does Python’s `asyncio` event loop work under the hood? Explain cooperative multitasking and coroutine execution.',
      'Explain Python’s descriptor protocol (`__get__`, `__set__`, `__delete__`) and how property decorators are implemented using it.'
    ]
  },
  'HR Interview': {
    Easy: [
      'Tell me about yourself, your background, and what motivated you to pursue a career in technology.',
      'What are your top three strengths and one area you are actively working to improve?',
      'Where do you see yourself professionally in the next 3 to 5 years?'
    ],
    Medium: [
      'Describe a situation where you had a disagreement with a team member or manager. How did you resolve it constructively?',
      'Tell me about a time when a project didn\'t go as planned or you faced a major setback. What did you learn?',
      'How do you manage tight deadlines and prioritize competing tasks under high pressure?'
    ],
    Hard: [
      'Describe a scenario where you had to make a critical technical or ethical compromise. What framework guided your decision?',
      'If you joined a team with low morale or conflicting expectations, what specific steps would you take in your first 60 days to build trust and alignment?',
      'Tell me about an instance where you took initiative outside your defined responsibilities to solve an organizational bottleneck.'
    ]
  },
  'Web Development': {
    Easy: [
      'Explain the difference between client-side rendering (CSR) and server-side rendering (SSR) in modern web applications.',
      'What is the Document Object Model (DOM) and how does React\'s Virtual DOM optimize rendering updates?',
      'Explain how CORS (Cross-Origin Resource Sharing) works and how browsers enforce the Same-Origin Policy.'
    ],
    Medium: [
      'How do you optimize the performance of a high-traffic web application (Core Web Vitals, code-splitting, CDN caching)?',
      'Explain the security risks of XSS and CSRF, and how modern web frameworks defend against them.',
      'Describe how state management patterns (like Redux, Context, or Zustand) prevent prop drilling and handle async actions.'
    ],
    Hard: [
      'Design the frontend and micro-frontend architecture for a multi-tenant enterprise dashboard with real-time WebSocket feeds.',
      'Explain browser rendering pipeline stages (Parse, Style, Layout, Paint, Composite) and how to avoid layout thrashing and reflows.',
      'How would you implement zero-downtime blue/green deployment with edge routing and feature flags for a web frontend?'
    ]
  }
};

// API: Daily Interview Tip powered by Gemini Search Grounding
app.get('/api/ai/daily-tip', async (req: Request, res: Response) => {
  const role = typeof req.query.role === 'string' && req.query.role.trim()
    ? req.query.role.trim()
    : 'Software Engineering';
  const variation = typeof req.query.v === 'string' ? req.query.v : '';
  const todayStr = new Date().toISOString().split('T')[0];

  if (aiClient) {
    try {
      const prompt = `Search current best practices from engineering hiring managers and career coaches, then write ONE concise, actionable daily interview tip for a candidate preparing for a ${role} interview (date: ${todayStr}${variation ? `, variation #${variation}` : ''}).
Rules:
- Keep it to 2 short, plain-English sentences (under 42 words total).
- Give specific, practical advice candidates can apply immediately in a live video/audio interview.
- Do not include markdown headings, bullet lists, or intro filler like "Here is a tip:". Output only the tip text.`;

      const response: any = await withTimeout(
        aiClient.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
          }
        }),
        30000,
        'Gemini search daily-tip'
      );
      const rawText: string = (response?.text || '').trim();
      const cleanedTip = rawText
        .replace(/^(Here is .*?:|Daily Interview Tip:)\s*/i, '')
        .replace(/[*_`#]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      const rawChunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const seenUris = new Set<string>();
      const sources: { title: string; uri: string }[] = [];

      for (const chunk of rawChunks) {
        const uri = chunk?.web?.uri;
        const title = chunk?.web?.title;
        if (uri && !seenUris.has(uri)) {
          seenUris.add(uri);
          sources.push({
            title: title || new URL(uri).hostname.replace(/^www\./, ''),
            uri
          });
        }
        if (sources.length >= 3) break;
      }

      if (cleanedTip.length > 20) {
        return res.json({
          success: true,
          source: 'gemini-search',
          tip: cleanedTip,
          category: `${role} Focus`,
          sources,
          updatedAt: todayStr
        });
      }
    } catch (err) {
      console.info('Daily tip fallback used:', err instanceof Error ? err.message : 'unavailable');
    }
  }

  const daySeed = Math.floor(Date.now() / 86400000) + (parseInt(variation || '0', 10) || 0);
  const picked = FALLBACK_DAILY_TIPS[Math.abs(daySeed) % FALLBACK_DAILY_TIPS.length];

  return res.json({
    success: true,
    source: 'curated',
    tip: picked.tip,
    category: picked.category,
    sources: [],
    updatedAt: todayStr
  });
});

// API: Interview Platform Configuration (Configurable Coding & Voice Time Limits & Capabilities)
app.get('/api/interview/config', (_req: Request, res: Response) => {
  const dgKey = getDeepgramApiKey();
  const openAiKey = process.env.OPENAI_API_KEY?.trim() || '';
  return res.json({
    success: true,
    codingTimeLimitsMinutes: getServerCodingLimitsMinutes(),
    voiceTimeLimitsMinutes: getServerVoiceLimitsMinutes(),
    warningThresholdsSeconds: [120, 60, 30],
    voiceWarningThresholdsSeconds: [30, 15],
    sttCapabilities: {
      deepgram: Boolean(dgKey),
      geminiLive: Boolean(aiClient),
      geminiTranscribe: Boolean(aiClient),
      openaiWhisper: Boolean(openAiKey),
      primarySttProvider: dgKey
        ? 'deepgram-nova-3'
        : aiClient
          ? 'gemini-3.5-transcribe'
          : openAiKey
            ? 'openai-whisper'
            : 'browser-speech'
    }
  });
});

app.post('/api/interview/config', (req: Request, res: Response) => {
  const { codingTimeLimitsMinutes, voiceTimeLimitsMinutes } = req.body || {};
  if (!codingTimeLimitsMinutes && !voiceTimeLimitsMinutes) {
    return res.status(400).json({ error: 'codingTimeLimitsMinutes or voiceTimeLimitsMinutes object is required' });
  }
  const updatedCoding =
    codingTimeLimitsMinutes && typeof codingTimeLimitsMinutes === 'object'
      ? updateServerCodingLimitsMinutes(codingTimeLimitsMinutes)
      : getServerCodingLimitsMinutes();
  const updatedVoice =
    voiceTimeLimitsMinutes && typeof voiceTimeLimitsMinutes === 'object'
      ? updateServerVoiceLimitsMinutes(voiceTimeLimitsMinutes)
      : getServerVoiceLimitsMinutes();
  return res.json({
    success: true,
    codingTimeLimitsMinutes: updatedCoding,
    voiceTimeLimitsMinutes: updatedVoice
  });
});

// Helper: AI evaluate a coding submission (runs alongside real test cases)
async function evaluateCodingSubmissionWithAI(params: {
  questionText: string;
  difficulty: DifficultyLevel;
  code: string;
  language: CodingLanguage;
  executionResults: { status: string; passedCount: number; totalCount: number; stderr?: string };
  submissionType: 'manual' | 'auto';
  completedWithinTime: boolean;
}) {
  const { questionText, difficulty, code, language, executionResults, submissionType, completedWithinTime } = params;
  const total = Math.max(1, executionResults.totalCount);
  const passRatio = executionResults.passedCount / total;
  const trimmed = (code || '').trim();

  if (!trimmed) {
    return {
      technicalScore: 5,
      codeQualityScore: 5,
      efficiencyScore: 5,
      overallScore: 5,
      feedback:
        submissionType === 'auto'
          ? 'Time expired with no code written. Empty submission recorded.'
          : 'No code was submitted for this problem.',
      complexityAnalysis: 'N/A — empty submission'
    };
  }

  if (aiClient) {
    try {
      const prompt = `You are a senior software engineer evaluating a candidate's timed coding interview submission.
Difficulty: ${difficulty}
Language: ${language}
Submission Type: ${submissionType === 'auto' ? 'Automatic submission on timer expiration' : 'Manual submission'}
Completed Within Time: ${completedWithinTime ? 'Yes' : 'No'}
Automated Test Cases Passed: ${executionResults.passedCount}/${executionResults.totalCount} (Status: ${executionResults.status})
${executionResults.stderr ? `Runtime/Syntax Output: ${executionResults.stderr}` : ''}

Problem Statement:
"${questionText}"

Candidate Code:
\`\`\`${language}
${code}
\`\`\`

Evaluate the candidate fairly based on algorithmic correctness, partial progress (if incomplete on timeout), code readability, edge-case handling, and time/space complexity. Return concise JSON scores (0-100), 1-2 sentences of feedback, and complexityAnalysis.`;

      const response: any = await withTimeout(
        aiClient.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                technicalScore: { type: Type.INTEGER },
                codeQualityScore: { type: Type.INTEGER },
                efficiencyScore: { type: Type.INTEGER },
                overallScore: { type: Type.INTEGER },
                feedback: { type: Type.STRING },
                complexityAnalysis: { type: Type.STRING }
              },
              required: ['technicalScore', 'codeQualityScore', 'efficiencyScore', 'overallScore', 'feedback', 'complexityAnalysis']
            }
          }
        }),
        20000,
        'Gemini coding evaluation'
      );
      const parsed = JSON.parse((response?.text || '{}').trim());
      if (typeof parsed.overallScore === 'number') {
        return parsed;
      }
    } catch (err) {
      console.warn('Gemini coding evaluation fallback used:', err instanceof Error ? err.message : err);
    }
  }

  // Deterministic test-case-grounded fallback evaluation
  const lineCount = trimmed.split('\n').filter((l) => l.trim().length > 0).length;
  const technicalScore = Math.min(98, Math.max(15, Math.round(passRatio * 75 + (lineCount > 3 ? 15 : 5))));
  const codeQualityScore = Math.min(95, Math.max(25, Math.round(passRatio * 55 + (lineCount > 4 ? 28 : 15))));
  const efficiencyScore = Math.min(95, Math.max(20, Math.round(passRatio * 70 + 15)));
  const overallScore = Math.round(technicalScore * 0.5 + codeQualityScore * 0.25 + efficiencyScore * 0.25);

  return {
    technicalScore,
    codeQualityScore,
    efficiencyScore,
    overallScore,
    feedback:
      executionResults.passedCount === executionResults.totalCount && executionResults.totalCount > 0
        ? `All ${executionResults.totalCount} test cases passed cleanly (${submissionType === 'auto' ? 'auto-submitted at deadline' : 'submitted manually'}).`
        : `Passed ${executionResults.passedCount}/${executionResults.totalCount} test cases (${executionResults.status}). ${submissionType === 'auto' ? 'Current code was preserved and auto-submitted when time expired.' : 'Review failing edge cases and runtime constraints.'}`,
    complexityAnalysis: executionResults.status === 'Timeout' ? 'Exceeded execution time limit' : 'Evaluated via automated test suite'
  };
}

// API: Server-Authoritative Interview Session Lifecycle & Timer Sync
app.post('/api/interview/session/init', (req: Request, res: Response) => {
  const { sessionId, userId = 'anonymous', questions = [], sessionCodingLimits, sessionVoiceLimits } = req.body || {};
  if (!sessionId || !Array.isArray(questions)) {
    return res.status(400).json({ error: 'sessionId and questions are required' });
  }
  const serverSession = initOrGetServerSession({
    sessionId,
    userId,
    questions,
    sessionCodingLimits,
    sessionVoiceLimits
  });
  return res.json({
    success: true,
    serverNow: Date.now(),
    session: serverSession
  });
});

app.get('/api/interview/session/:sessionId/state', (req: Request, res: Response) => {
  const session = getServerSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Server session not found' });
  }
  return res.json({
    success: true,
    serverNow: Date.now(),
    session
  });
});

app.post('/api/interview/session/:sessionId/activate-problem', (req: Request, res: Response) => {
  const { questionId } = req.body || {};
  if (!questionId) {
    return res.status(400).json({ error: 'questionId is required' });
  }
  const result = activateProblemOnServer(req.params.sessionId, questionId);
  if (!result) {
    return res.status(404).json({ error: 'Session or question not found' });
  }
  return res.json({
    success: true,
    serverNow: Date.now(),
    problem: result.problem,
    activeQuestionIndex: result.session.activeQuestionIndex
  });
});

app.post('/api/interview/session/:sessionId/draft', (req: Request, res: Response) => {
  const { questionId, draftCode, draftLanguage, voiceDraft } = req.body || {};
  if (!questionId) {
    return res.status(400).json({ error: 'questionId is required' });
  }
  const updated = saveDraftOnServer({
    sessionId: req.params.sessionId,
    questionId,
    draftCode,
    draftLanguage,
    voiceDraft
  });
  if (!updated) {
    return res.status(404).json({ error: 'Session not found' });
  }
  return res.json({ success: true, serverNow: Date.now() });
});

app.post('/api/interview/session/:sessionId/run-code', async (req: Request, res: Response) => {
  const { code = '', language = 'javascript', functionName = 'solution', testCases = [] } = req.body || {};
  try {
    const { executionResults, testCaseResults } = await executeCodeWithTestCases({
      code: String(code),
      language: language === 'python' ? 'python' : 'javascript',
      functionName: String(functionName),
      testCases: Array.isArray(testCases) ? testCases : [],
      timeoutMs: 3500
    });
    return res.json({
      success: true,
      executionResults,
      testCaseResults
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Code execution failed'
    });
  }
});

app.post('/api/interview/session/:sessionId/submit-coding', async (req: Request, res: Response) => {
  const {
    questionId,
    questionText = '',
    difficulty = 'Medium',
    code = '',
    language = 'javascript',
    functionName = 'solution',
    testCases = [],
    submissionType = 'manual'
  } = req.body || {};

  if (!questionId) {
    return res.status(400).json({ error: 'questionId is required' });
  }

  const existingSession = getServerSession(req.params.sessionId);
  if (existingSession?.problems?.[questionId]?.submissionTimestamp) {
    return res.json({
      success: true,
      duplicatePrevented: true,
      serverNow: Date.now(),
      problem: existingSession.problems[questionId]
    });
  }

  const safeLang: CodingLanguage = language === 'python' ? 'python' : 'javascript';
  const safeSubmissionType = submissionType === 'auto' ? 'auto' : 'manual';

  const { executionResults, testCaseResults } = await executeCodeWithTestCases({
    code: String(code),
    language: safeLang,
    functionName: String(functionName),
    testCases: Array.isArray(testCases) ? testCases : [],
    timeoutMs: 3500
  });

  const existingProb = existingSession?.problems?.[questionId];
  const deadlineTs = existingProb?.deadlineTimestamp || Date.now() + 600000;
  const completedWithinTime = Date.now() <= deadlineTs + 3000;

  const codingEvaluation = await evaluateCodingSubmissionWithAI({
    questionText: String(questionText),
    difficulty: difficulty as DifficultyLevel,
    code: String(code),
    language: safeLang,
    executionResults,
    submissionType: safeSubmissionType,
    completedWithinTime
  });

  const recorded = recordCodingSubmissionOnServer({
    sessionId: req.params.sessionId,
    questionId,
    submittedCode: String(code),
    language: safeLang,
    submissionType: safeSubmissionType,
    executionResults,
    testCaseResults,
    evaluationScore: codingEvaluation.overallScore,
    codingEvaluation
  });

  if (!recorded) {
    return res.json({
      success: true,
      duplicatePrevented: false,
      serverNow: Date.now(),
      problem: {
        questionId,
        questionType: 'coding',
        difficulty,
        assignedTimeLimitSeconds: getTimeLimitSecondsForDifficulty(difficulty as DifficultyLevel),
        startTimestamp: Date.now(),
        submissionTimestamp: Date.now(),
        submittedCode: String(code),
        language: safeLang,
        submissionType: safeSubmissionType,
        completedWithinTime,
        executionResults,
        testCaseResults,
        evaluationScore: codingEvaluation.overallScore,
        codingEvaluation
      }
    });
  }

  return res.json({
    success: true,
    duplicatePrevented: recorded.duplicatePrevented,
    serverNow: Date.now(),
    problem: recorded.problem
  });
});

app.post('/api/interview/session/:sessionId/submit-voice', (req: Request, res: Response) => {
  const {
    questionId,
    originalTranscription,
    finalResponse = '',
    aiEvaluation,
    conversationContext,
    submissionType = 'manual',
    durationSeconds = 0
  } = req.body || {};

  if (!questionId) {
    return res.status(400).json({ error: 'questionId is required' });
  }

  const result = recordVoiceSubmissionOnServer({
    sessionId: req.params.sessionId,
    questionId,
    originalTranscription,
    finalResponse,
    aiEvaluation,
    conversationContext,
    submissionType: submissionType === 'auto' ? 'auto' : 'manual',
    durationSeconds
  });

  return res.json({
    success: true,
    duplicatePrevented: Boolean(result?.duplicatePrevented),
    serverNow: Date.now(),
    persisted: Boolean(result)
  });
});

app.post('/api/interview/session/:sessionId/complete', (req: Request, res: Response) => {
  const completed = completeServerSession(req.params.sessionId);
  return res.json({
    success: true,
    serverNow: Date.now(),
    persisted: Boolean(completed)
  });
});

// API: Generate Interview Questions (Voice & Timed Coding Support)
app.post('/api/ai/generate-questions', async (req: Request, res: Response) => {
  const {
    domain,
    subtopic = '',
    difficulty = 'Medium',
    mode = 'Technical',
    roundFormat = 'voice_only',
    codingTimeLimits,
    count = 3,
    customTopic = ''
  } = req.body;
  const effectiveDomain = customTopic ? customTopic : domain || 'Data Structures and Algorithms';
  const cleanSubtopic = typeof subtopic === 'string' ? subtopic.trim() : '';
  const diff = (['Easy', 'Medium', 'Hard'].includes(difficulty) ? difficulty : 'Medium') as DifficultyLevel;

  const codingCount =
    roundFormat === 'coding_only'
      ? Math.max(2, Math.min(3, count))
      : roundFormat === 'mixed_coding_voice'
        ? 2
        : 0;
  const voiceCount =
    roundFormat === 'coding_only'
      ? 0
      : roundFormat === 'mixed_coding_voice'
        ? 2
        : Math.max(1, count);

  let voiceQuestions: any[] = [];
  let codingQuestions: any[] = [];
  let source = 'predefined';

  // 1. Generate voice questions if needed
  if (voiceCount > 0 && aiClient) {
    try {
      const prompt = `Generate exactly ${voiceCount} distinct, realistic ${mode} spoken interview questions at ${diff} difficulty for ${effectiveDomain}${cleanSubtopic ? ` focusing specifically on "${cleanSubtopic}"` : ''}.
Keep each question concise (1-2 sentences) and each keyPoint concise (3-6 words, 3-4 items per question).`;

      const questionConfig = {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              questionText: { type: Type.STRING },
              keyPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['questionText', 'keyPoints']
          }
        }
      };

      let response: any;
      try {
        response = await withTimeout(
          aiClient.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
              ...questionConfig,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
            }
          }),
          25000,
          'Gemini generate-questions'
        );
      } catch {
        response = await withTimeout(
          aiClient.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: prompt,
            config: {
              ...questionConfig,
              thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL }
            }
          }),
          12000,
          'Gemini lite generate-questions'
        );
      }

      const rawText = (response?.text || '[]').replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(rawText);
      const validQuestions = Array.isArray(parsed)
        ? parsed.filter((q: any) => q && typeof q.questionText === 'string' && q.questionText.trim().length > 5)
        : [];

      if (validQuestions.length > 0) {
        source = 'gemini';
        voiceQuestions = validQuestions.slice(0, voiceCount).map((q: any) => ({
          questionType: 'voice',
          difficulty: diff,
          timeLimitSeconds: getVoiceTimeLimitSecondsForDifficulty(diff, req.body?.voiceTimeLimits),
          questionText: q.questionText.trim(),
          keyPoints:
            Array.isArray(q.keyPoints) && q.keyPoints.length > 0
              ? q.keyPoints.slice(0, 4).map((p: unknown) => String(p))
              : ['Core concept', 'Edge cases', 'Trade-offs']
        }));
      }
    } catch (err) {
      console.info('Voice question generation fallback used:', err instanceof Error ? err.message : 'unavailable');
    }
  }

  // Fallback for voice questions
  if (voiceCount > 0 && voiceQuestions.length === 0) {
    const voiceLimitSec = getVoiceTimeLimitSecondsForDifficulty(diff, req.body?.voiceTimeLimits);
    if (cleanSubtopic) {
      const subtopicQuestions = [
        `Walk me through the core mechanics and practical use cases of ${cleanSubtopic} within ${effectiveDomain}.`,
        `What are the most common performance bottlenecks or edge cases when implementing ${cleanSubtopic}, and how do you handle them?`,
        `Describe how you would design or optimize a real-world ${effectiveDomain} system relying heavily on ${cleanSubtopic}.`
      ].slice(0, voiceCount);
      source = 'subtopic-fallback';
      voiceQuestions = subtopicQuestions.map((q) => ({
        questionType: 'voice',
        difficulty: diff,
        timeLimitSeconds: voiceLimitSec,
        questionText: q,
        keyPoints: [
          cleanSubtopic,
          'Edge cases & error handling',
          'Performance & scalability trade-offs'
        ]
      }));
    } else {
      const domainQuestions = PREDEFINED_QUESTIONS[effectiveDomain] || PREDEFINED_QUESTIONS['Data Structures and Algorithms'];
      const questionsList = domainQuestions[diff] || domainQuestions['Medium'] || domainQuestions['Easy'];
      voiceQuestions = questionsList.slice(0, voiceCount).map((q) => ({
        questionType: 'voice',
        difficulty: diff,
        timeLimitSeconds: voiceLimitSec,
        questionText: q,
        keyPoints: [
          'Core mechanism & definition',
          'Trade-offs and edge cases',
          'Time/space complexity or practical example'
        ]
      }));
    }
  }

  // 2. Select executable coding problems with configurable difficulty time limits
  if (codingCount > 0) {
    const selectedCoding = selectCodingProblemsForConfig(
      effectiveDomain,
      diff,
      codingCount,
      codingTimeLimits || getServerCodingLimitsMinutes()
    );
    // Ensure server-side configurable time limits are strictly applied
    codingQuestions = selectedCoding.map((cp) => {
      const cpDiff = (cp.difficulty || diff) as DifficultyLevel;
      return {
        ...cp,
        timeLimitSeconds: getTimeLimitSecondsForDifficulty(cpDiff, codingTimeLimits)
      };
    });
  }

  const combined = [...voiceQuestions, ...codingQuestions];
  return res.json({
    success: true,
    source,
    questions: combined
  });
});

// API: High-Accuracy Technical Speech-to-Text (Deepgram Nova-3 Primary + Gemini 3.5 Transcribe + optional OpenAI Whisper)
app.post('/api/ai/transcribe-answer', async (req: Request, res: Response) => {
  const { audioBase64, mimeType = 'audio/webm', domain = '', currentQuestion = '' } = req.body || {};
  if (!audioBase64 || typeof audioBase64 !== 'string') {
    return res.status(400).json({ error: 'Audio data is required' });
  }

  const cleanMime =
    typeof mimeType === 'string' && mimeType.includes(';')
      ? mimeType.split(';')[0].trim()
      : mimeType || 'audio/webm';

  const deepgramKey = getDeepgramApiKey();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();

  // Priority 1: Deepgram Nova-3 Pre-Recorded Audio API
  if (deepgramKey) {
    try {
      const params = new URLSearchParams({
        model: 'nova-3',
        language: 'en',
        smart_format: 'true',
        punctuate: 'true'
      });
      for (const term of buildTechnicalKeyterms(domain, currentQuestion)) {
        params.append('keyterm', term);
      }

      const audioBuffer = Buffer.from(audioBase64, 'base64');
      const dgResp = await withTimeout(
        fetch(`https://api.deepgram.com/v1/listen?${params.toString()}`, {
          method: 'POST',
          headers: {
            Authorization: `Token ${deepgramKey}`,
            'Content-Type': cleanMime
          },
          body: audioBuffer
        }),
        25000,
        'Deepgram audio transcription'
      );

      if (dgResp.ok) {
        const dgData: any = await dgResp.json();
        const transcript = String(dgData?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '')
          .replace(/\s+/g, ' ')
          .trim();

        return res.json({
          success: true,
          source: 'deepgram-nova-3',
          transcript
        });
      }
      console.warn(`Deepgram REST transcription returned HTTP ${dgResp.status}; trying fallback STT.`);
    } catch (err) {
      console.warn('Deepgram REST transcription failed or timed out:', err instanceof Error ? err.message : err);
    }
  }

  // Priority 2: Gemini Transcribe Fallback
  if (aiClient) {
    const contextHint = [
      domain ? `Interview domain: ${domain}.` : '',
      currentQuestion ? `Interviewer question: "${currentQuestion}".` : ''
    ]
      .filter(Boolean)
      .join(' ');

    for (const geminiAudioModel of ['gemini-3.5-transcribe', GEMINI_MODEL]) {
      try {
        const response: any = await withTimeout(
          aiClient.models.generateContent({
            model: geminiAudioModel,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: cleanMime,
                    data: audioBase64
                  }
                },
                {
                  text: `Transcribe the spoken English speech in this technical interview recording accurately.
${contextHint}
Preserve technical programming terminology accurately (e.g., LIFO, FIFO, Big-O, O(1), O(N log N), REST, SQL, NoSQL, mutex, GIL, asyncio, React hooks, B-Tree, Dijkstra, memoization).
Handle natural pauses and filler words cleanly without inventing words.
Output ONLY the transcribed words with proper punctuation. If there is only silence or background noise, return an empty string.`
                }
              ]
            }
          }),
          25000,
          `Gemini audio transcription (${geminiAudioModel})`
        );

        const transcript = (response?.text || '')
          .replace(/^["'`]+|["'`]+$/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        return res.json({
          success: true,
          source: geminiAudioModel,
          transcript
        });
      } catch (err) {
        console.warn(
          `Audio transcription (${geminiAudioModel}) failed or timed out:`,
          err instanceof Error ? err.message : err
        );
      }
    }
  }

  // Optional OpenAI Whisper provider if OPENAI_API_KEY is configured (or as fallback when Gemini fails)
  if (openAiKey) {
    try {
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      const ext = cleanMime.includes('mp4') ? 'm4a' : cleanMime.includes('wav') ? 'wav' : 'webm';
      const formData = new FormData();
      formData.append('file', new Blob([audioBuffer], { type: cleanMime }), `answer.${ext}`);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      formData.append(
        'prompt',
        `Technical software engineering interview about ${domain || 'computer science'}. Vocabulary includes LIFO, FIFO, Big-O, O(n), O(log n), memoization, recursion, hash table, mutex, async/await, API, REST, SQL.`
      );

      const whisperResp = await withTimeout(
        fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${openAiKey}` },
          body: formData
        }),
        25000,
        'OpenAI Whisper transcription'
      );
      if (whisperResp.ok) {
        const wData: any = await whisperResp.json();
        const transcript = String(wData?.text || '').trim();
        if (transcript) {
          return res.json({
            success: true,
            source: 'openai-whisper',
            transcript
          });
        }
      }
    } catch (err) {
      console.warn('OpenAI Whisper fallback error:', err instanceof Error ? err.message : err);
    }
  }

  return res.json({
    success: true,
    source: 'unavailable',
    transcript: ''
  });
});

// API: Context-Aware AI Technical Interviewer Dialogue Engine (with strict keyword/validity parsing)
app.post('/api/ai/converse', async (req: Request, res: Response) => {
  const {
    action = 'respond',
    submissionMode = 'manual',
    domain = 'General',
    subtopic = '',
    difficulty = 'Medium',
    currentQuestion = '',
    keyPoints = [],
    nextQuestion = '',
    candidateUtterance = '',
    conversationHistory = [],
    askedFollowUps = [],
    followUpsCount = 0,
    questionNumber = 1,
    totalQuestions = 3
  } = req.body || {};

  if (action === 'repeat') {
    return res.json({
      success: true,
      nextAction: 'repeat',
      shouldRepeatQuestion: true,
      replyText: `Of course. Let me repeat question ${questionNumber} clearly for you.`
    });
  }

  const isTimeoutSubmission = submissionMode === 'timeout';
  const trimmedUtterance = String(candidateUtterance || '').trim();
  const parsedAnalysis = analyzeInterviewResponse({
    questionText: String(currentQuestion),
    keyPoints: Array.isArray(keyPoints) ? keyPoints.map(String) : [],
    domain: String(domain),
    answerText: trimmedUtterance
  });

  if (parsedAnalysis.verdict === 'no_response' && action !== 'clarify') {
    const timeoutPrefix = isTimeoutSubmission ? "Time's up for this question. " : '';
    return res.json({
      success: true,
      source: 'skipped',
      assessment: 'skipped',
      nextAction: 'advance',
      shouldRepeatQuestion: false,
      isProperSolution: false,
      matchedKeywords: parsedAnalysis.matchedKeywords,
      missingKeywords: parsedAnalysis.missingKeywords,
      keywordCoveragePct: 0,
      conceptualFeedback: parsedAnalysis.honestFeedback,
      conceptualScore: parsedAnalysis.conceptualScore,
      replyText: nextQuestion
        ? `${timeoutPrefix}No answer was captured for that question. Let's move on to the next one.`
        : `${timeoutPrefix}No answer was captured for the final question. Let me compile your performance evaluation.`
    });
  }

  // Deterministic hard guard against random gibberish / spam so AI never hallucinates fake praise
  if (parsedAnalysis.isGibberishOrNoise && action !== 'clarify') {
    const timeoutPrefix = isTimeoutSubmission ? "Time's up. " : '';
    return res.json({
      success: true,
      source: 'keyword-validator',
      assessment: 'off_topic',
      nextAction: 'advance',
      shouldRepeatQuestion: false,
      isProperSolution: false,
      matchedKeywords: parsedAnalysis.matchedKeywords,
      missingKeywords: parsedAnalysis.missingKeywords,
      keywordCoveragePct: parsedAnalysis.keywordCoveragePct,
      conceptualFeedback: parsedAnalysis.honestFeedback,
      conceptualScore: parsedAnalysis.conceptualScore,
      replyText: `${timeoutPrefix}${parsedAnalysis.honestFeedback}`
    });
  }

  if (aiClient) {
    try {
      const topicLabel = subtopic ? `${domain} (${subtopic})` : domain;
      const historyLines = Array.isArray(conversationHistory)
        ? conversationHistory
            .slice(-8)
            .map((m: any) => `${m.sender === 'ai' ? 'Interviewer' : 'Candidate'}: ${m.text}`)
            .join('\n')
        : '';

      if (action === 'clarify') {
        const prompt = `You are a seasoned senior engineer conducting a live technical interview on ${topicLabel} (${difficulty}).
Current question: "${currentQuestion}"
Candidate asked for clarification: "${trimmedUtterance}"
${historyLines ? `Recent conversation:\n${historyLines}\n` : ''}
Respond in 1-2 natural spoken sentences clarifying what the question is asking WITHOUT giving away the solution or key answer terms. Plain spoken text only.`;

        const response: any = await withTimeout(
          aiClient.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
            }
          }),
          12000,
          'Gemini clarify turn'
        );

        const clean = (response?.text || '').replace(/[*_`#]/g, '').replace(/\s+/g, ' ').trim();
        if (clean.length > 8) {
          return res.json({
            success: true,
            source: 'gemini',
            assessment: 'clarification',
            nextAction: 'clarify',
            shouldRepeatQuestion: false,
            replyText: clean
          });
        }
      } else {
        const allowFollowUp = !isTimeoutSubmission && Number(followUpsCount) < 1;
        const prompt = `You are a strict, honest Senior Technical Interviewer conducting a live interview on ${topicLabel} (${difficulty}).
Current Question (${questionNumber} of ${totalQuestions}): "${currentQuestion}"
Core Concepts Usually Expected: ${JSON.stringify(keyPoints || [])}
Keyword Parser Check:
- Word count: ${parsedAnalysis.wordCount}
- Matched concepts/keywords: ${JSON.stringify(parsedAnalysis.matchedKeywords)}
- Missing concepts/keywords: ${JSON.stringify(parsedAnalysis.missingKeywords)}
- Keyword coverage: ${parsedAnalysis.keywordCoveragePct}%
${historyLines ? `Conversation History so far:\n${historyLines}\n` : ''}
${Array.isArray(askedFollowUps) && askedFollowUps.length > 0 ? `Follow-ups ALREADY asked (DO NOT repeat these): ${JSON.stringify(askedFollowUps)}\n` : ''}
Candidate's latest spoken response: "${trimmedUtterance}"
Submission Mode: ${isTimeoutSubmission ? 'TIMER EXPIRED — MUST ADVANCE with brief honest feedback on what they answered' : 'Candidate submitted turn'}
${nextQuestion ? `Next question in queue: "${nextQuestion}"` : 'This is the final question.'}
Follow-up allowance remaining on this question: ${allowFollowUp ? '1 probing follow-up allowed if needed' : '0 (MUST advance now)'}

STRICT HONESTY & EVALUATION RULES:
1. Check whether the candidate ACTUALLY gave a valid solution/explanation for the question. Recognize conceptually accurate concise phrasing (e.g., "A stack follows LIFO whereas a queue follows FIFO"), BUT NEVER praise random words, irrelevant chatter, filler, or wrong answers!
2. If the response is off-topic, nonsensical, or wrong: set "assessment" to "off_topic" or "misconception", set "isProperSolution" to false, set "conceptualScore" <= 25, and honestly tell the candidate in 1-2 polite sentences that their answer did not address the question and briefly mention what was expected.
3. If the response is very short / lacks depth (e.g., < 18 words and missing key concepts): set "isProperSolution" based on whether the core was truly answered; if incomplete, tell them directly e.g. "The answer you gave is too brief — you could have expanded a bit more on [missing concept]."
4. Choose "nextAction":
   - If Submission Mode is TIMER EXPIRED or follow-up allowance is 0, you MUST choose "advance".
   - If "correct", choose "advance".
   - If "partial", "misconception", or "off_topic" AND follow-up allowance > 0, choose "follow_up" and ask ONE concise probing question WITHOUT giving away the answer.
5. Write "replyText": Natural spoken interviewer feedback (1-2 concise sentences, max 42 words). ${isTimeoutSubmission ? 'Start with a brief note like "Time\'s up." then give honest feedback on their previous answer before moving on.' : ''} Plain spoken text, no markdown.`;

        const response: any = await withTimeout(
          aiClient.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  assessment: { type: Type.STRING },
                  isProperSolution: { type: Type.BOOLEAN },
                  nextAction: { type: Type.STRING },
                  replyText: { type: Type.STRING },
                  followUpQuestion: { type: Type.STRING },
                  conceptualFeedback: { type: Type.STRING },
                  conceptualScore: { type: Type.INTEGER }
                },
                required: [
                  'assessment',
                  'isProperSolution',
                  'nextAction',
                  'replyText',
                  'conceptualFeedback',
                  'conceptualScore'
                ]
              }
            }
          }),
          15000,
          'Gemini context-aware converse turn'
        );

        const parsed = JSON.parse((response?.text || '{}').trim());
        const normalizedAction =
          !allowFollowUp || parsed.nextAction !== 'follow_up' ? 'advance' : 'follow_up';
        const cleanReply = String(parsed.replyText || '')
          .replace(/[*_`#]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        // Guard against Gemini hallucinating a high score when parser found zero relevance and short/empty text
        const rawScore =
          typeof parsed.conceptualScore === 'number'
            ? Math.min(100, Math.max(0, Math.round(parsed.conceptualScore)))
            : parsedAnalysis.conceptualScore;
        const honestScore =
          parsedAnalysis.verdict === 'off_topic' && parsed.assessment === 'off_topic'
            ? Math.min(rawScore, 28)
            : rawScore;

        if (cleanReply.length > 8) {
          return res.json({
            success: true,
            source: 'gemini-contextual',
            assessment: parsed.assessment || parsedAnalysis.verdict,
            isProperSolution: Boolean(parsed.isProperSolution),
            matchedKeywords: parsedAnalysis.matchedKeywords,
            missingKeywords: parsedAnalysis.missingKeywords,
            keywordCoveragePct: parsedAnalysis.keywordCoveragePct,
            nextAction: normalizedAction,
            shouldRepeatQuestion: false,
            replyText: cleanReply,
            followUpQuestion:
              normalizedAction === 'follow_up' ? String(parsed.followUpQuestion || cleanReply) : '',
            conceptualFeedback: String(parsed.conceptualFeedback || parsedAnalysis.honestFeedback),
            conceptualScore: honestScore
          });
        }
      }
    } catch (err) {
      console.info('Converse turn fallback used:', err instanceof Error ? err.message : 'unavailable');
    }
  }

  if (action === 'clarify') {
    return res.json({
      success: true,
      source: 'fallback',
      assessment: 'clarification',
      nextAction: 'clarify',
      shouldRepeatQuestion: false,
      replyText:
        'Sure! Focus on explaining the core mechanism first, then mention one practical example and any key trade-offs.'
    });
  }

  // Honest keyword-parsed fallback (NEVER returns fake "correct" for brief/off-topic/garbage answers!)
  const timeoutPrefix = isTimeoutSubmission ? "Time's up. " : '';
  const shouldAskBriefFollowUp =
    !isTimeoutSubmission &&
    Number(followUpsCount) < 1 &&
    (parsedAnalysis.verdict === 'too_brief' || parsedAnalysis.verdict === 'partial_solution') &&
    parsedAnalysis.missingKeywords.length > 0;

  if (shouldAskBriefFollowUp) {
    const missingFocus = parsedAnalysis.missingKeywords.slice(0, 2).join(' and ');
    const probeText = `The answer you gave is a bit brief — could you expand on ${missingFocus}?`;
    return res.json({
      success: true,
      source: 'keyword-validator',
      assessment: parsedAnalysis.verdict === 'too_brief' ? 'partial' : parsedAnalysis.verdict,
      isProperSolution: parsedAnalysis.isProperSolution,
      matchedKeywords: parsedAnalysis.matchedKeywords,
      missingKeywords: parsedAnalysis.missingKeywords,
      keywordCoveragePct: parsedAnalysis.keywordCoveragePct,
      nextAction: 'follow_up',
      shouldRepeatQuestion: false,
      followUpQuestion: probeText,
      conceptualFeedback: parsedAnalysis.honestFeedback,
      conceptualScore: parsedAnalysis.conceptualScore,
      replyText: probeText
    });
  }

  return res.json({
    success: true,
    source: 'keyword-validator',
    assessment:
      parsedAnalysis.verdict === 'proper_solution'
        ? 'correct'
        : parsedAnalysis.verdict === 'off_topic'
          ? 'off_topic'
          : 'partial',
    isProperSolution: parsedAnalysis.isProperSolution,
    matchedKeywords: parsedAnalysis.matchedKeywords,
    missingKeywords: parsedAnalysis.missingKeywords,
    keywordCoveragePct: parsedAnalysis.keywordCoveragePct,
    nextAction: 'advance',
    shouldRepeatQuestion: false,
    conceptualFeedback: parsedAnalysis.honestFeedback,
    conceptualScore: parsedAnalysis.conceptualScore,
    replyText: `${timeoutPrefix}${parsedAnalysis.honestFeedback}`
  });
});

// API: Live Privacy-First Proctoring Frame Check (detects multiple people, gadgets, or camera obstruction in memory without saving)
app.post('/api/ai/proctor-frame', async (req: Request, res: Response) => {
  const { imageBase64, mimeType = 'image/jpeg' } = req.body || {};
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  if (!aiClient) {
    return res.json({
      success: true,
      source: 'unavailable',
      personCount: 1,
      multiplePeopleDetected: false,
      gadgetDetected: false,
      detectedGadgets: [],
      cameraObstructed: false,
      summary: 'Vision proctoring unavailable'
    });
  }

  try {
    const cleanMime = typeof mimeType === 'string' && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';
    const response: any = await withTimeout(
      aiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: cleanMime,
                data: imageBase64
              }
            },
            {
              text: `Analyze this live webcam proctoring frame for an online interview.
1. Count how many distinct human people/faces are visible anywhere in the frame (foreground or background).
   - Set personCount to the exact integer count of visible people (0, 1, 2, etc.).
   - Set multiplePeopleDetected to true ONLY if 2 or more distinct people or faces are visible in the frame.
2. Check for unauthorized electronic gadgets visible in the candidate's hands or in frame (e.g., smartphone/cell phone, tablet/iPad, secondary laptop, secondary monitor/screen, or smartwatch held up for reading).
   - Set gadgetDetected to true ONLY if you clearly see such a device in frame.
   - List concise gadget names in detectedGadgets (e.g., ["Cell Phone"]). Do NOT flag normal room furniture, wall decor, or glasses.
3. Set cameraObstructed to true ONLY if the camera is completely covered, pitch black, or blocked.
4. Provide a brief 1-sentence summary.`
            }
          ]
        },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              personCount: { type: Type.INTEGER },
              multiplePeopleDetected: { type: Type.BOOLEAN },
              gadgetDetected: { type: Type.BOOLEAN },
              detectedGadgets: { type: Type.ARRAY, items: { type: Type.STRING } },
              cameraObstructed: { type: Type.BOOLEAN },
              summary: { type: Type.STRING }
            },
            required: [
              'personCount',
              'multiplePeopleDetected',
              'gadgetDetected',
              'detectedGadgets',
              'cameraObstructed',
              'summary'
            ]
          }
        }
      }),
      12000,
      'Gemini proctor frame check'
    );

    const parsed = JSON.parse((response?.text || '{}').trim());
    const personCount = Math.max(0, Number(parsed.personCount ?? 1) || 0);
    const multiplePeopleDetected = Boolean(parsed.multiplePeopleDetected) || personCount > 1;
    const detectedGadgets = Array.isArray(parsed.detectedGadgets)
      ? parsed.detectedGadgets.map((g: unknown) => String(g || '').trim()).filter(Boolean)
      : [];
    const gadgetDetected = Boolean(parsed.gadgetDetected) || detectedGadgets.length > 0;
    const cameraObstructed = Boolean(parsed.cameraObstructed);

    return res.json({
      success: true,
      source: 'gemini-vision-proctor',
      personCount,
      multiplePeopleDetected,
      gadgetDetected,
      detectedGadgets,
      cameraObstructed,
      summary: String(parsed.summary || '')
    });
  } catch (err) {
    console.warn('Proctor frame check error:', err instanceof Error ? err.message : err);
    return res.json({
      success: true,
      source: 'fallback',
      personCount: 1,
      multiplePeopleDetected: false,
      gadgetDetected: false,
      detectedGadgets: [],
      cameraObstructed: false,
      summary: 'Check skipped'
    });
  }
});

// API: Evaluate Full Live Video/Audio/Coding Interview Session (Strict honesty & keyword-verified)
app.post('/api/ai/evaluate-session', async (req: Request, res: Response) => {
  const {
    questions = [],
    answers = [],
    domain = 'General',
    difficulty = 'Medium',
    mode = 'Technical',
    targetRole = 'Software Engineer',
    mediaMetrics = {},
    proctoringSummary = {}
  } = req.body || {};

  const qaPairs = (Array.isArray(questions) ? questions : []).map((q: any, idx: number) => {
    const matched = (Array.isArray(answers) ? answers : []).find((a: any) => a.questionId === q.questionId);
    const qType = q.questionType || matched?.questionType || 'voice';
    const answerText = matched?.answerText || '(No response recorded)';
    const parsedVoice =
      qType === 'voice'
        ? analyzeInterviewResponse({
            questionText: q.questionText || '',
            keyPoints: q.keyPoints || [],
            domain,
            answerText
          })
        : null;

    return {
      number: idx + 1,
      questionType: qType,
      difficulty: q.difficulty || matched?.difficulty || difficulty,
      question: q.questionText || '',
      keyPoints: q.keyPoints || [],
      answer: answerText,
      durationSeconds: matched?.durationSeconds || 0,
      submittedCode: matched?.submittedCode,
      language: matched?.language,
      submissionType: matched?.submissionType,
      completedWithinTime: matched?.completedWithinTime,
      executionResults: matched?.executionResults,
      codingEvaluation: matched?.codingEvaluation,
      voiceEvaluation: matched?.voiceEvaluation,
      parsedVoice
    };
  });

  const totalWords =
    Number(mediaMetrics?.totalWords) ||
    qaPairs.reduce((acc, item) => {
      if (!item.answer || item.answer.startsWith('(No ') || item.answer.startsWith('(Candidate skipped')) return acc;
      return acc + item.answer.trim().split(/\s+/).length;
    }, 0);

  const validAnsweredCount = qaPairs.filter((item) => {
    if (item.questionType === 'coding') {
      return Boolean(item.submittedCode && item.submittedCode.trim().length > 0);
    }
    if (item.voiceEvaluation?.isProperSolution === true) return true;
    return Boolean(item.parsedVoice && !item.parsedVoice.isGibberishOrNoise && item.parsedVoice.verdict !== 'no_response' && item.parsedVoice.verdict !== 'off_topic');
  }).length;

  const totalQuestions = Math.max(1, qaPairs.length);
  const cameraActive = Boolean(mediaMetrics?.cameraUsed);
  const micActive = Boolean(mediaMetrics?.micUsed);
  const wpm = Number(mediaMetrics?.wordsPerMinute) || 0;
  const avgAudioLevel = Number(mediaMetrics?.avgAudioLevel) || 0;
  const cameraActivePct = Number(mediaMetrics?.cameraActivePct) || (cameraActive ? 100 : 0);
  const voiceActivityPct = Number(mediaMetrics?.voiceActivityPct) || (avgAudioLevel > 8 ? 75 : 0);
  const tabSwitches = Number(proctoringSummary?.tabSwitches) || 0;
  const cameraAlerts = Number(proctoringSummary?.cameraCoveredCount) || 0;
  const multiplePeopleAlerts = Number(proctoringSummary?.multiplePeopleAlerts) || 0;
  const backgroundNoiseAlerts = Number(proctoringSummary?.backgroundNoiseAlerts) || 0;
  const gadgetAlerts = Number(proctoringSummary?.gadgetAlerts) || 0;
  const discrepancyStrikes = Number(proctoringSummary?.discrepancyStrikes) || 0;
  const autoSubmittedDueToDiscrepancy = Boolean(proctoringSummary?.autoSubmittedDueToDiscrepancy);
  const autoSubmitReason =
    typeof proctoringSummary?.autoSubmitReason === 'string' ? proctoringSummary.autoSubmitReason.trim() : '';

  if (aiClient && qaPairs.length > 0) {
    try {
      const formattedItems = qaPairs
        .map((p) => {
          if (p.questionType === 'coding') {
            return `Q${p.number} [CODING - ${p.difficulty}]: ${p.question}
Submission Type: ${p.submissionType || 'manual'} | Within Time: ${p.completedWithinTime ? 'Yes' : 'No'} | Language: ${p.language || 'javascript'}
Test Results: ${p.executionResults ? `${p.executionResults.passedCount}/${p.executionResults.totalCount} (${p.executionResults.status})` : 'Not executed'}
Submitted Code:\n${p.submittedCode || '(Empty)'}`;
          }
          const matchedKw = p.voiceEvaluation?.matchedKeywords || p.parsedVoice?.matchedKeywords || [];
          const missingKw = p.voiceEvaluation?.missingKeywords || p.parsedVoice?.missingKeywords || [];
          return `Q${p.number} [VOICE - ${p.difficulty}]: ${p.question}
Expected concepts: ${(p.keyPoints || []).join(', ')}
Keyword Parser Check: Verdict=${p.parsedVoice?.verdict || 'unknown'} | Matched=[${matchedKw.join(', ')}] | Missing=[${missingKw.join(', ')}]
Candidate answer (${p.durationSeconds}s): ${p.answer}`;
        })
        .join('\n\n');

      const promptText = `You are a strict, honest technical and behavioral interview panelist evaluating a live privacy-first AI interview (no user audio/video stored).
Role: ${targetRole}
Domain: ${domain} | Difficulty: ${difficulty} | Mode: ${mode}

Live Real-Time Audio, Video & Proctoring Telemetry:
- Live camera presence active: ${cameraActive ? `Yes (${cameraActivePct}% steady live presence)` : 'No'}
- Live microphone audio active: ${micActive ? 'Yes' : 'No'}
- Speaking pace estimate: ${wpm} words/min
- Vocal projection / voice activity level: avg energy ${avgAudioLevel}/100 (${voiceActivityPct}% active speech)
- Total spoken/written words: ${totalWords}
- Substantive/valid answers: ${validAnsweredCount} of ${totalQuestions}
- AI Live Monitoring Integrity: ${tabSwitches} tab focus switches, ${cameraAlerts} camera obstruction alerts, ${multiplePeopleAlerts} multiple-people-in-frame alerts, ${gadgetAlerts} unauthorized gadget alerts, ${backgroundNoiseAlerts} excessive background noise alerts (${discrepancyStrikes} integrity discrepancy strikes${autoSubmittedDueToDiscrepancy ? ` — SESSION AUTO-SUBMITTED: ${autoSubmitReason || 'Repeated proctoring discrepancies'}` : ''})

Candidate Session Transcript & Coding Submissions:
${formattedItems}

CRITICAL HONESTY RULE:
Do NOT inflate scores or write false praise if the candidate typed/spoke random gibberish, filler, irrelevant answers, very brief incomplete phrases, or empty submissions!
- If answers are gibberish, off-topic, or empty, score technicalScore and responseQualityScore very low (5–30) and explicitly state in writtenFeedback & weaknesses which responses were brief, off-topic, or missing core concepts.
- If answers are conceptually accurate and cover expected concepts, reward fairly.
${
  autoSubmittedDueToDiscrepancy
    ? `- INTEGRITY AUTO-SUBMISSION RULE: This interview was automatically submitted because repeated proctoring discrepancies occurred (${autoSubmitReason || `${discrepancyStrikes} strikes`}). Explicitly state at the start of writtenFeedback that the session was automatically submitted due to repeated integrity discrepancies and include this in weaknesses, while still fairly grading any valid responses recorded prior to auto-submission.`
    : ''
}

Return:
1. technicalScore (0-100): accuracy, algorithmic depth, keyword/concept coverage, code correctness & complexity
2. communicationScore (0-100): clarity, structure, conciseness, pacing
3. confidenceScore (0-100): vocal/live presence steadiness, speaking pace, time management
4. responseQualityScore (0-100): relevance and completeness
5. overallScore (0-100): weighted holistic score
6. writtenFeedback: 2-3 honest, specific sentences summarizing actual performance
7. deliveryNotes: 1-2 sentences evaluating live audio pacing, per-question time management, and live camera presence
8. strengths: 2-3 truthful bullet strings
9. weaknesses: 2-3 honest bullet strings referencing actual gaps
10. suggestions: 2-3 concrete, actionable next steps`;

      const response: any = await withTimeout(
        aiClient.models.generateContent({
          model: GEMINI_MODEL,
          contents: promptText,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                technicalScore: { type: Type.INTEGER },
                communicationScore: { type: Type.INTEGER },
                confidenceScore: { type: Type.INTEGER },
                responseQualityScore: { type: Type.INTEGER },
                overallScore: { type: Type.INTEGER },
                writtenFeedback: { type: Type.STRING },
                deliveryNotes: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: [
                'technicalScore',
                'communicationScore',
                'confidenceScore',
                'responseQualityScore',
                'overallScore',
                'writtenFeedback',
                'deliveryNotes',
                'strengths',
                'weaknesses',
                'suggestions'
              ]
            }
          }
        }),
        35000,
        'Gemini session evaluation'
      );

      const parsed = JSON.parse((response?.text || '{}').trim());

      return res.json({
        success: true,
        source: 'gemini-live-telemetry',
        evaluation: parsed
      });
    } catch (err) {
      console.warn('Gemini session evaluation fallback used:', err instanceof Error ? err.message : err);
    }
  }

  // Honest keyword-verified fallback scoring (never rewards gibberish or empty answers!)
  const questionScores = qaPairs.map((p) => {
    if (p.questionType === 'coding') {
      return {
        tech: p.codingEvaluation?.overallScore ?? (p.submittedCode?.trim() ? 35 : 5),
        comm: p.submittedCode?.trim() ? 55 : 10,
        verdict: p.submittedCode?.trim() ? 'coding' : 'no_response'
      };
    }
    const storedScore = p.voiceEvaluation?.conceptualScore;
    const parsed = p.parsedVoice!;
    const tech = typeof storedScore === 'number' ? Math.min(storedScore, parsed.isGibberishOrNoise ? 22 : storedScore) : parsed.conceptualScore;
    const comm = typeof p.voiceEvaluation?.communicationScore === 'number' ? p.voiceEvaluation.communicationScore : parsed.communicationScore;
    return { tech, comm, verdict: parsed.verdict };
  });

  const avgTech =
    questionScores.length > 0
      ? Math.round(questionScores.reduce((acc, s) => acc + s.tech, 0) / questionScores.length)
      : 10;
  const avgComm =
    questionScores.length > 0
      ? Math.round(questionScores.reduce((acc, s) => acc + s.comm, 0) / questionScores.length)
      : 15;

  const validRatio = validAnsweredCount / totalQuestions;
  const deliveryBonus = (cameraActive ? 4 : 0) + (micActive && avgAudioLevel > 8 ? 4 : 0);
  const technicalScore = Math.min(98, Math.max(5, avgTech));
  const communicationScore = Math.min(97, Math.max(10, avgComm));
  const confidenceScore = Math.min(
    96,
    Math.max(15, Math.round(avgTech * 0.6 + validRatio * 28 + deliveryBonus))
  );
  const responseQualityScore = Math.round(
    technicalScore * 0.45 + communicationScore * 0.3 + confidenceScore * 0.25
  );
  const overallScore = Math.round(
    (technicalScore + communicationScore + confidenceScore + responseQualityScore) / 4
  );

  const briefOrOffTopicCount = questionScores.filter(
    (q) => q.verdict === 'too_brief' || q.verdict === 'off_topic' || q.verdict === 'no_response'
  ).length;

  const baseWrittenFeedback =
    overallScore >= 78
      ? `Strong session in ${domain}. You gave valid solutions covering core concepts on ${validAnsweredCount}/${totalQuestions} questions.`
      : overallScore >= 45
        ? `Partial performance in ${domain} (${validAnsweredCount}/${totalQuestions} solid responses). Several answers were too brief or missed expected technical keywords.`
        : `Low readiness score in ${domain}. Most responses (${briefOrOffTopicCount}/${totalQuestions}) were off-topic, too brief, or lacked valid technical concepts.`;

  const fallbackAutoPrefix = autoSubmittedDueToDiscrepancy
    ? `${autoSubmitReason || `This interview was automatically submitted after ${discrepancyStrikes} proctoring discrepancies were detected.`} `
    : '';

  const fallbackWeaknesses = [
    ...(autoSubmittedDueToDiscrepancy
      ? [
          `Session auto-submitted due to repeated proctoring discrepancies (${multiplePeopleAlerts} multiple-person, ${gadgetAlerts} gadget, ${backgroundNoiseAlerts} excessive-noise alerts)`
        ]
      : []),
    briefOrOffTopicCount > 0
      ? `${briefOrOffTopicCount} response(s) lacked required technical keywords, were off-topic, or were too brief`
      : 'Could deepen complexity analysis and edge-case coverage',
    !cameraActive
      ? 'Enable camera permission for full live presence feedback'
      : 'Expand explanations with concrete examples before timer expiration'
  ];

  return res.json({
    success: true,
    source: 'keyword-verified',
    evaluation: {
      technicalScore,
      communicationScore,
      confidenceScore,
      responseQualityScore,
      overallScore,
      writtenFeedback: `${fallbackAutoPrefix}${baseWrittenFeedback}`,
      deliveryNotes: `${cameraActive ? `Live camera maintained (${cameraActivePct}% steady presence).` : 'Camera unavailable during call.'} ${micActive ? `Live voice clarity analyzed${wpm > 0 ? ` (~${wpm} WPM)` : ''}.` : 'Completed via text/code input.'}`,
      strengths:
        validAnsweredCount > 0
          ? [
              `Provided relevant technical points on ${validAnsweredCount}/${totalQuestions} questions`,
              cameraActive ? 'Maintained live video presence' : 'Completed the session flow'
            ]
          : ['Started and completed the interview workflow'],
      weaknesses: fallbackWeaknesses,
      suggestions: autoSubmittedDueToDiscrepancy
        ? [
            'Ensure a quiet, private room with only yourself on camera and no phones/secondary screens visible',
            'Directly address the core mechanism and technical keywords asked in each question'
          ]
        : [
            'Directly address the core mechanism and technical keywords asked in each question',
            'Aim for structured 30-60 second explanations covering definition, example, and complexity'
          ]
    }
  });
});

// API: Evaluate Candidate Answer / Interview Session
app.post('/api/ai/evaluate-answer', async (req: Request, res: Response) => {
  const { questionText, answerText, domain, difficulty, keyPoints } = req.body;

  if (!answerText || answerText.trim().length === 0) {
    return res.json({
      success: true,
      evaluation: {
        technicalScore: 10,
        communicationScore: 20,
        confidenceScore: 15,
        responseQualityScore: 15,
        overallScore: 15,
        feedback: 'No substantive answer was provided. Attempting every question is critical in professional interviews.',
        strengths: ['Attended the question'],
        weaknesses: ['Missing technical detail', 'No concrete examples', 'Incomplete formulation'],
        suggestions: ['Structure your response using the STAR or PEEL method', 'Address core architectural/algorithmic details directly']
      }
    });
  }

  if (aiClient) {
    try {
      const prompt = `You are an expert technical interviewer evaluating a candidate's answer.
Domain: ${domain || 'General'}
Difficulty: ${difficulty || 'Medium'}
Question: "${questionText}"
Key Expected Points: ${JSON.stringify(keyPoints || [])}
Candidate's Answer: "${answerText}"

Provide an objective evaluation with concise strengths, weaknesses, suggestions, and 2-3 sentences of feedback.`;

      const response: any = await withTimeout(
        aiClient.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                technicalScore: { type: Type.INTEGER },
                communicationScore: { type: Type.INTEGER },
                confidenceScore: { type: Type.INTEGER },
                responseQualityScore: { type: Type.INTEGER },
                overallScore: { type: Type.INTEGER },
                feedback: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: [
                'technicalScore',
                'communicationScore',
                'confidenceScore',
                'responseQualityScore',
                'overallScore',
                'feedback',
                'strengths',
                'weaknesses',
                'suggestions'
              ]
            }
          }
        }),
        30000,
        'Gemini evaluate-answer'
      );
      const parsed = JSON.parse((response?.text || '{}').trim());
      return res.json({ success: true, source: 'gemini', evaluation: parsed });
    } catch (err) {
      console.info('Answer evaluation fallback used:', err instanceof Error ? err.message : 'unavailable');
    }
  }

  // Rule-based high-fidelity evaluation fallback
  const wordCount = answerText.trim().split(/\s+/).length;
  let baseScore = 65;
  if (wordCount > 60) baseScore += 18;
  else if (wordCount > 30) baseScore += 12;
  else if (wordCount < 15) baseScore -= 20;

  const technicalScore = Math.min(96, Math.max(40, baseScore + Math.floor(Math.random() * 8) - 2));
  const communicationScore = Math.min(98, Math.max(45, baseScore + 4 + Math.floor(Math.random() * 6)));
  const confidenceScore = Math.min(95, Math.max(50, baseScore + 2 + Math.floor(Math.random() * 5)));
  const responseQualityScore = Math.round((technicalScore * 0.4) + (communicationScore * 0.3) + (confidenceScore * 0.3));
  const overallScore = Math.round((technicalScore + communicationScore + confidenceScore + responseQualityScore) / 4);

  return res.json({
    success: true,
    source: 'rule-based',
    evaluation: {
      technicalScore,
      communicationScore,
      confidenceScore,
      responseQualityScore,
      overallScore,
      feedback: overallScore >= 80
        ? 'Strong and articulate response. Demonstrates solid grasp of foundational concepts with clear structural flow.'
        : 'Good effort with valid points. Further elaboration on implementation edge cases and quantitative trade-offs will elevate the response.',
      strengths: [
        'Clear terminology and structured thought process',
        'Directly addressed the primary intent of the question',
        'Professional tone and coherent explanation'
      ],
      weaknesses: [
        'Could provide deeper time/space complexity analysis',
        'Could include a real-world concrete production scenario'
      ],
      suggestions: [
        'Mention edge cases and potential failure modes',
        'Explain your thought process step-by-step before arriving at the conclusion',
        'Practice concise summary wrap-ups at the end of each answer'
      ]
    }
  });
});

const ALL_RESUME_SECTIONS: ResumeSectionKey[] = [
  'summary',
  'skills',
  'projects',
  'experience',
  'education',
  'achievements'
];

const VALID_RESUME_ICONS: ResumeIconName[] = [
  'user',
  'sparkles',
  'code',
  'briefcase',
  'graduation',
  'award',
  'layers',
  'terminal',
  'target',
  'star',
  'globe'
];

const DEFAULT_SECTION_HEADINGS: Record<ResumeSectionKey, string> = {
  summary: 'Professional Summary',
  skills: 'Core Competencies & Tech Stack',
  projects: 'Key Engineering Projects',
  experience: 'Professional Experience',
  education: 'Academic Background',
  achievements: 'Honors & Certifications'
};

const DEFAULT_SECTION_ICONS: Record<ResumeSectionKey, ResumeIconName> = {
  summary: 'user',
  skills: 'layers',
  projects: 'code',
  experience: 'briefcase',
  education: 'graduation',
  achievements: 'award'
};

function normalizeHexColor(val: unknown, fallback: string): string {
  if (typeof val !== 'string') return fallback;
  const trimmed = val.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed.toLowerCase()}`;
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const r = trimmed[1], g = trimmed[2], b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

function normalizeSectionOrder(raw: unknown): ResumeSectionKey[] {
  const seen = new Set<ResumeSectionKey>();
  const ordered: ResumeSectionKey[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === 'string' && ALL_RESUME_SECTIONS.includes(item as ResumeSectionKey) && !seen.has(item as ResumeSectionKey)) {
        seen.add(item as ResumeSectionKey);
        ordered.push(item as ResumeSectionKey);
      }
    }
  }
  for (const key of ALL_RESUME_SECTIONS) {
    if (!seen.has(key)) ordered.push(key);
  }
  return ordered;
}

function normalizeTemplateSpec(
  raw: any,
  fileName: string,
  hasExtractedLogo: boolean
): CustomResumeTemplateSpec {
  const allowedLayouts = ['sidebar-left', 'sidebar-right', 'single-column', 'two-column-header', 'banner-top'] as const;
  const allowedFonts = ['sans', 'serif', 'mono'] as const;
  const allowedAlign = ['left', 'center', 'split'] as const;
  const allowedIconStyles = ['lucide-outline', 'circle-badge', 'square-badge', 'minimal-dot', 'none'] as const;
  const allowedLogoStyles = ['monogram-circle', 'monogram-square', 'crest-emblem', 'initials-pill', 'uploaded-image', 'none'] as const;
  const allowedDividers = ['solid', 'double', 'accent-bar', 'dashed', 'none'] as const;
  const allowedBullets = ['disc', 'square', 'arrow', 'dash'] as const;

  const layoutType = allowedLayouts.includes(raw?.layoutType) ? raw.layoutType : 'sidebar-left';
  const fontStyle = allowedFonts.includes(raw?.fontStyle) ? raw.fontStyle : 'sans';
  const headerAlignment = allowedAlign.includes(raw?.headerAlignment) ? raw.headerAlignment : 'left';
  const iconStyle = allowedIconStyles.includes(raw?.iconStyle) ? raw.iconStyle : 'circle-badge';
  let logoStyle: CustomResumeTemplateSpec['logoStyle'] = allowedLogoStyles.includes(raw?.logoStyle)
    ? raw.logoStyle
    : hasExtractedLogo
      ? 'uploaded-image'
      : 'monogram-circle';
  if (hasExtractedLogo && logoStyle === 'none') {
    logoStyle = 'uploaded-image';
  }
  const dividerStyle = allowedDividers.includes(raw?.dividerStyle) ? raw.dividerStyle : 'accent-bar';
  const bulletStyle = allowedBullets.includes(raw?.bulletStyle) ? raw.bulletStyle : 'disc';

  const sectionHeadings: Record<ResumeSectionKey, string> = { ...DEFAULT_SECTION_HEADINGS };
  if (raw?.sectionHeadings && typeof raw.sectionHeadings === 'object') {
    for (const key of ALL_RESUME_SECTIONS) {
      const h = raw.sectionHeadings[key];
      if (typeof h === 'string' && h.trim().length > 0) {
        sectionHeadings[key] = h.trim().slice(0, 60);
      }
    }
  }

  const sectionIcons: Record<ResumeSectionKey, ResumeIconName> = { ...DEFAULT_SECTION_ICONS };
  if (raw?.sectionIcons && typeof raw.sectionIcons === 'object') {
    for (const key of ALL_RESUME_SECTIONS) {
      const ic = raw.sectionIcons[key];
      if (typeof ic === 'string' && VALID_RESUME_ICONS.includes(ic as ResumeIconName)) {
        sectionIcons[key] = ic as ResumeIconName;
      }
    }
  }

  const crop = raw?.logoCropBox;
  const validCrop =
    crop &&
    typeof crop.xPct === 'number' &&
    typeof crop.yPct === 'number' &&
    typeof crop.wPct === 'number' &&
    typeof crop.hPct === 'number' &&
    crop.wPct > 1 &&
    crop.hPct > 1 &&
    crop.xPct >= 0 &&
    crop.yPct >= 0 &&
    crop.xPct + crop.wPct <= 101 &&
    crop.yPct + crop.hPct <= 101
      ? {
          xPct: Math.max(0, Math.min(98, crop.xPct)),
          yPct: Math.max(0, Math.min(98, crop.yPct)),
          wPct: Math.max(2, Math.min(45, crop.wPct)),
          hPct: Math.max(2, Math.min(45, crop.hPct))
        }
      : undefined;

  const baseName = fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();

  return {
    templateName: typeof raw?.templateName === 'string' && raw.templateName.trim()
      ? raw.templateName.trim().slice(0, 60)
      : baseName || 'Custom Uploaded Template',
    layoutType,
    fontStyle,
    primaryColor: normalizeHexColor(raw?.primaryColor, '#1e3a8a'),
    accentColor: normalizeHexColor(raw?.accentColor, '#4f46e5'),
    sidebarBgColor: normalizeHexColor(raw?.sidebarBgColor, '#0f172a'),
    headerBgColor: normalizeHexColor(raw?.headerBgColor, '#1e293b'),
    textColor: normalizeHexColor(raw?.textColor, '#1e293b'),
    mutedColor: normalizeHexColor(raw?.mutedColor, '#64748b'),
    headerAlignment,
    iconStyle,
    showContactIcons: typeof raw?.showContactIcons === 'boolean' ? raw.showContactIcons : true,
    showSectionIcons: typeof raw?.showSectionIcons === 'boolean' ? raw.showSectionIcons : true,
    logoStyle,
    logoText: typeof raw?.logoText === 'string' ? raw.logoText.trim().slice(0, 6) : undefined,
    hasEmbeddedLogo: Boolean(raw?.hasEmbeddedLogo || hasExtractedLogo),
    logoCropBox: validCrop,
    sectionHeadings,
    sectionOrder: normalizeSectionOrder(raw?.sectionOrder),
    sectionIcons,
    dividerStyle,
    bulletStyle,
    designSummary:
      typeof raw?.designSummary === 'string' && raw.designSummary.trim()
        ? raw.designSummary.trim()
        : `Replicated ${layoutType} layout with matched colors, headings, icons, and emblem styling.`
  };
}

function buildDeterministicProjectPolish(
  rawText: string,
  targetRole: string,
  projectTitle?: string,
  techStack?: string
) {
  const cleanText = rawText.trim().replace(/\s+/g, ' ').replace(/\.$/, '');
  const stackList = (techStack || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const stackPhrase = stackList.length > 0 ? stackList.join(', ') : 'modern engineering tools';
  const titleLabel = projectTitle?.trim() || 'the platform';
  const roleLabel = targetRole.trim() || 'Software Engineer';

  // Strip casual starter phrases ("I made", "made", "built", "created") for natural grammatical flow
  const stripped = cleanText
    .replace(/^(i\s+)?(made|built|created|developed|designed|wrote|did)\s+/i, '')
    .trim();
  const clause = stripped ? stripped.charAt(0).toLowerCase() + stripped.slice(1) : cleanText.toLowerCase();

  const option1 = `Engineered ${titleLabel} using ${stackPhrase}, delivering ${clause} with production-ready reliability tailored for ${roleLabel} standards.`;
  const option2 = `Architected and implemented ${titleLabel} (${stackPhrase}) featuring ${clause}, optimizing modular code quality, responsiveness, and end-to-end usability.`;
  const option3 = `Spearheaded full-lifecycle development of ${titleLabel} leveraging ${stackPhrase}, translating core capabilities (${clause}) into a scalable solution aligned with ${roleLabel} best practices.`;

  return {
    recommendedDescription: option1,
    enhancedBullets: [option1, option2, option3],
    critique: `Tailored your plain-language notes around ${roleLabel} priorities while preserving your exact project details and ${stackPhrase}.`
  };
}

function extractReadableTextFromDocBuffer(buffer: Buffer): string {
  const chunks: string[] = [];
  const asciiMatches = buffer.toString('latin1').match(/[A-Za-z0-9][A-Za-z0-9 ,.;:()\/&+\-#@]{3,}/g) || [];
  chunks.push(...asciiMatches.slice(0, 220));

  // Extract UTF-16LE runs commonly stored in Word .doc streams
  const utf16Text = buffer.toString('utf16le');
  const utf16Matches = utf16Text.match(/[A-Za-z0-9][A-Za-z0-9 ,.;:()\/&+\-#@]{4,}/g) || [];
  chunks.push(...utf16Matches.slice(0, 220));

  const deduped = Array.from(new Set(chunks.map((c) => c.trim()).filter((c) => c.length >= 4 && !/^(Microsoft|Normal|Times New Roman|Calibri|Word\.Document)/i.test(c))));
  return deduped.join('\n').slice(0, 12000);
}

function inferHeadingsFromPlainText(rawText: string): Partial<Record<ResumeSectionKey, string>> {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 3 && l.length <= 55);
  const headings: Partial<Record<ResumeSectionKey, string>> = {};
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (!headings.summary && /\b(summary|objective|profile|about me)\b/.test(lower)) headings.summary = line;
    else if (!headings.skills && /\b(skills|technologies|competencies|expertise|tech stack)\b/.test(lower)) headings.skills = line;
    else if (!headings.projects && /\b(projects|portfolio|key projects)\b/.test(lower)) headings.projects = line;
    else if (!headings.experience && /\b(experience|employment|work history|career)\b/.test(lower)) headings.experience = line;
    else if (!headings.education && /\b(education|academic|qualifications)\b/.test(lower)) headings.education = line;
    else if (!headings.achievements && /\b(achievements|awards|certifications|honors)\b/.test(lower)) headings.achievements = line;
  }
  return headings;
}

// API: Resume Bullet & Role-Targeted Project Description Improviser
app.post('/api/ai/enhance-resume', async (req: Request, res: Response) => {
  const {
    text,
    targetRole = 'Software Development Engineer',
    type = 'project',
    projectTitle,
    techStack
  } = req.body || {};

  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: 'Text or simple project notes are required' });
  }

  const cleanText = String(text).trim();
  const cleanRole = String(targetRole || 'Software Development Engineer').trim();

  if (aiClient) {
    try {
      const prompt =
        type === 'project'
          ? `You are a FAANG Executive Resume Writer and Technical Recruiter.
The candidate wrote simple/casual words describing their project and wants it rewritten into sharp, authentic, ATS-optimized professional resume language tailored specifically for the target job role.

Target Job Role: ${cleanRole}
Project Title: ${projectTitle || 'Not specified'}
Tech Stack: ${techStack || 'Not specified'}
Candidate's Simple Words / Draft Notes: "${cleanText}"

Instructions:
1. Keep every claim truthful to what the candidate described—do NOT fabricate fake dollar amounts or invented company names.
2. Elevate casual phrasing into strong action verbs, engineering impact, and terminology that hiring managers look for in a "${cleanRole}" resume.
3. Provide:
   - "recommendedDescription": the single strongest 1-2 sentence polished project description for the resume.
   - "enhancedBullets": 3 distinct polished variations (1: Impact-focused concise version, 2: Architecture & technical depth version aligned to ${cleanRole}, 3: Crisp bullet-ready version).
   - "critique": 1-2 sentences explaining how the phrasing was tailored for "${cleanRole}".`
          : `You are a FAANG Executive Resume Coach.
Target Job Role: ${cleanRole}
Section Type: ${type}
Input draft: "${cleanText}"

Rewrite and enhance this into:
- "recommendedDescription": the best polished single paragraph/bullet ready to paste into the resume.
- "enhancedBullets": 3 impactful variations tailored specifically for a "${cleanRole}" role.
- "critique": 1-2 sentence explanation of improvements.`;

      const response: any = await withTimeout(
        aiClient.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                recommendedDescription: { type: Type.STRING },
                enhancedBullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                critique: { type: Type.STRING }
              },
              required: ['recommendedDescription', 'enhancedBullets', 'critique']
            }
          }
        }),
        30000,
        'Gemini enhance-resume'
      );
      const parsed = JSON.parse((response?.text || '{}').trim());
      if (Array.isArray(parsed?.enhancedBullets) && parsed.enhancedBullets.length > 0) {
        return res.json({
          success: true,
          source: 'gemini',
          recommendedDescription: parsed.recommendedDescription || parsed.enhancedBullets[0],
          enhancedBullets: parsed.enhancedBullets,
          critique: parsed.critique || `Tailored for ${cleanRole}.`
        });
      }
    } catch (err) {
      console.info('Resume enhancement fallback used:', err instanceof Error ? err.message : 'unavailable');
    }
  }

  if (type === 'project') {
    const fallback = buildDeterministicProjectPolish(cleanText, cleanRole, projectTitle, techStack);
    return res.json({
      success: true,
      source: 'template',
      ...fallback
    });
  }

  const workFallback = [
    `Spearheaded core ${cleanRole} initiatives to ${cleanText.charAt(0).toLowerCase() + cleanText.slice(1).replace(/\.$/, '')}, elevating system quality and delivery speed.`,
    `Executed end-to-end implementation aligned with ${cleanRole} standards, strengthening reliability, maintainability, and cross-team collaboration.`,
    `Delivered measurable improvements across production workflows through structured engineering practices tailored to ${cleanRole} objectives.`
  ];

  return res.json({
    success: true,
    source: 'template',
    recommendedDescription: workFallback[0],
    enhancedBullets: workFallback,
    critique: `Action verbs and role-relevant terminology tailored for ${cleanRole} strengthen recruiter engagement.`
  });
});

// API: Parse Uploaded Resume Template (JPG, JPEG, PNG, PDF, DOC, DOCX)
app.post('/api/ai/parse-resume-template', async (req: Request, res: Response) => {
  try {
    const { fileBase64, fileName = 'uploaded_template', mimeType = '' } = req.body || {};
    if (!fileBase64 || typeof fileBase64 !== 'string') {
      return res.status(400).json({ error: 'Uploaded template file payload is required.' });
    }

    const lowerName = String(fileName).toLowerCase();
    const ext = lowerName.includes('.') ? lowerName.split('.').pop() || '' : '';
    const base64Clean = fileBase64.includes(',') ? fileBase64.split(',').pop() || '' : fileBase64;
    const fileBuffer = Buffer.from(base64Clean, 'base64');

    if (fileBuffer.length === 0) {
      return res.status(400).json({ error: 'Uploaded file appears empty.' });
    }

    const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) || mimeType.startsWith('image/');
    const isPdf = ext === 'pdf' || mimeType === 'application/pdf';
    const isDocx =
      ext === 'docx' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const isDoc = ext === 'doc' || mimeType === 'application/msword';

    if (!isImage && !isPdf && !isDocx && !isDoc) {
      return res.status(400).json({
        error: 'Unsupported format. Please upload a .jpg, .jpeg, .png, .pdf, .doc, or .docx template.'
      });
    }

    let extractedLogoDataUrl: string | undefined;
    let extractedContextText = '';
    let inferredHeadings: Partial<Record<ResumeSectionKey, string>> = {};
    const detectedHexColors: string[] = [];

    if (isDocx) {
      try {
        const zip = await JSZip.loadAsync(fileBuffer);
        const docXml = (await zip.file('word/document.xml')?.async('string')) || '';
        const stylesXml = (await zip.file('word/styles.xml')?.async('string')) || '';
        const themeXml = (await zip.file('word/theme/theme1.xml')?.async('string')) || '';

        const textMatches = Array.from(docXml.matchAll(/<w:t[^>]*>([^<]+)<\/w:t>/g)).map((m) => m[1]);
        const plainDocxText = textMatches.join(' ').replace(/\s+/g, ' ').trim();

        // Extract paragraph-level structure with style clues
        const paragraphs = docXml.split(/<\/w:p>/).slice(0, 90);
        const structuredLines = paragraphs
          .map((p) => {
            const texts = Array.from(p.matchAll(/<w:t[^>]*>([^<]+)<\/w:t>/g))
              .map((m) => m[1])
              .join('')
              .trim();
            const styleMatch = p.match(/<w:pStyle w:val="([^"]+)"/);
            return texts ? `${styleMatch ? `[${styleMatch[1]}] ` : ''}${texts}` : '';
          })
          .filter(Boolean);

        inferredHeadings = inferHeadingsFromPlainText(structuredLines.map((l) => l.replace(/^\[[^\]]+\]\s*/, '')).join('\n'));

        const colorMatches = [...docXml.matchAll(/w:color w:val="([0-9A-Fa-f]{6})"/g), ...stylesXml.matchAll(/w:color w:val="([0-9A-Fa-f]{6})"/g), ...themeXml.matchAll(/val="([0-9A-Fa-f]{6})"/g)]
          .map((m) => `#${m[1].toLowerCase()}`)
          .filter((c) => c !== '#000000' && c !== '#ffffff');
        detectedHexColors.push(...Array.from(new Set(colorMatches)).slice(0, 6));

        const hasTables = /<w:tbl>/.test(docXml);
        const hasGridCols = (docXml.match(/<w:gridCol/g) || []).length;

        // Inspect embedded images in word/media/* for a logo/emblem/photo
        const mediaFiles = Object.keys(zip.files).filter((k) => /^word\/media\/.+\.(png|jpg|jpeg)$/i.test(k));
        if (mediaFiles.length > 0) {
          const logoFile = zip.file(mediaFiles[0]);
          if (logoFile) {
            const imgBuf = await logoFile.async('nodebuffer');
            if (imgBuf.length > 0 && imgBuf.length < 1_500_000) {
              const imgExt = mediaFiles[0].toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
              extractedLogoDataUrl = `data:${imgExt};base64,${imgBuf.toString('base64')}`;
            }
          }
        }

        extractedContextText = [
          `DOCX File: ${fileName}`,
          `Contains multi-column table layout: ${hasTables} (grid columns: ${hasGridCols})`,
          `Detected non-neutral hex colors: ${detectedHexColors.join(', ') || 'none'}`,
          `Embedded logo/media found: ${Boolean(extractedLogoDataUrl)}`,
          `Document structured lines:\n${structuredLines.slice(0, 70).join('\n')}`,
          plainDocxText ? `\nPlain snippet: ${plainDocxText.slice(0, 2000)}` : ''
        ].join('\n');
      } catch (zipErr) {
        console.warn('DOCX inspect fallback:', zipErr);
        extractedContextText = extractReadableTextFromDocBuffer(fileBuffer);
        inferredHeadings = inferHeadingsFromPlainText(extractedContextText);
      }
    } else if (isDoc) {
      extractedContextText = extractReadableTextFromDocBuffer(fileBuffer);
      inferredHeadings = inferHeadingsFromPlainText(extractedContextText);
    }

    const templateSchema = {
      type: Type.OBJECT,
      properties: {
        templateName: { type: Type.STRING },
        layoutType: {
          type: Type.STRING,
          enum: ['sidebar-left', 'sidebar-right', 'single-column', 'two-column-header', 'banner-top']
        },
        fontStyle: { type: Type.STRING, enum: ['sans', 'serif', 'mono'] },
        primaryColor: { type: Type.STRING },
        accentColor: { type: Type.STRING },
        sidebarBgColor: { type: Type.STRING },
        headerBgColor: { type: Type.STRING },
        textColor: { type: Type.STRING },
        mutedColor: { type: Type.STRING },
        headerAlignment: { type: Type.STRING, enum: ['left', 'center', 'split'] },
        iconStyle: {
          type: Type.STRING,
          enum: ['lucide-outline', 'circle-badge', 'square-badge', 'minimal-dot', 'none']
        },
        showContactIcons: { type: Type.BOOLEAN },
        showSectionIcons: { type: Type.BOOLEAN },
        logoStyle: {
          type: Type.STRING,
          enum: ['monogram-circle', 'monogram-square', 'crest-emblem', 'initials-pill', 'uploaded-image', 'none']
        },
        logoText: { type: Type.STRING },
        hasEmbeddedLogo: { type: Type.BOOLEAN },
        logoCropBox: {
          type: Type.OBJECT,
          properties: {
            xPct: { type: Type.NUMBER },
            yPct: { type: Type.NUMBER },
            wPct: { type: Type.NUMBER },
            hPct: { type: Type.NUMBER }
          }
        },
        sectionHeadings: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            skills: { type: Type.STRING },
            projects: { type: Type.STRING },
            experience: { type: Type.STRING },
            education: { type: Type.STRING },
            achievements: { type: Type.STRING }
          },
          required: ['summary', 'skills', 'projects', 'experience', 'education', 'achievements']
        },
        sectionOrder: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            enum: ['summary', 'skills', 'projects', 'experience', 'education', 'achievements']
          }
        },
        sectionIcons: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, enum: VALID_RESUME_ICONS },
            skills: { type: Type.STRING, enum: VALID_RESUME_ICONS },
            projects: { type: Type.STRING, enum: VALID_RESUME_ICONS },
            experience: { type: Type.STRING, enum: VALID_RESUME_ICONS },
            education: { type: Type.STRING, enum: VALID_RESUME_ICONS },
            achievements: { type: Type.STRING, enum: VALID_RESUME_ICONS }
          },
          required: ['summary', 'skills', 'projects', 'experience', 'education', 'achievements']
        },
        dividerStyle: { type: Type.STRING, enum: ['solid', 'double', 'accent-bar', 'dashed', 'none'] },
        bulletStyle: { type: Type.STRING, enum: ['disc', 'square', 'arrow', 'dash'] },
        designSummary: { type: Type.STRING }
      },
      required: [
        'templateName',
        'layoutType',
        'fontStyle',
        'primaryColor',
        'accentColor',
        'sidebarBgColor',
        'headerBgColor',
        'textColor',
        'mutedColor',
        'headerAlignment',
        'iconStyle',
        'showContactIcons',
        'showSectionIcons',
        'logoStyle',
        'hasEmbeddedLogo',
        'sectionHeadings',
        'sectionOrder',
        'sectionIcons',
        'dividerStyle',
        'bulletStyle',
        'designSummary'
      ]
    };

    const instructionPrompt = `You are a precision Document Design & Resume Layout Reverse-Engineer.
Analyze the uploaded resume template and extract its EXACT visual format so we can generate the user's resume matching that exact layout, color scheme, typography, icons, logos/emblems, and section headings.

Specifically inspect and output:
1. layoutType: Does it have a left sidebar ('sidebar-left'), right sidebar ('sidebar-right'), single clean column ('single-column'), top colored banner ('banner-top'), or split 2-column header ('two-column-header')?
2. Exact 6-character hex colors (#rrggbb): primaryColor, accentColor, sidebarBgColor (if sidebar or tinted area exists), headerBgColor (for banner/header), textColor, mutedColor.
3. Exact section headings used in the uploaded template mapped onto keys: summary, skills, projects, experience, education, achievements (keep the template's exact wording/casing like "CAREER PROFILE", "CORE SKILLS", "KEY PROJECTS", "WORK HISTORY", etc.).
4. Exact top-to-bottom sectionOrder array containing all 6 keys.
5. Icons & Logos:
   - iconStyle & showSectionIcons & showContactIcons: match whether section headings have circle icon badges, square icon badges, outline icons, dots, or plain text.
   - sectionIcons: pick the closest icon name for each of the 6 sections from: ${VALID_RESUME_ICONS.join(', ')}.
   - logoStyle & hasEmbeddedLogo: if the template displays a logo, personal monogram circle/square, crest, or emblem/photo badge in the header/sidebar, set hasEmbeddedLogo=true and pick the matching logoStyle. If this is an image (.jpg/.png), also supply logoCropBox ({ xPct, yPct, wPct, hPct } as 0-100 percentages of the page width/height) around that logo/emblem so the client can crop the exact logo!
6. dividerStyle & bulletStyle & fontStyle ('sans' | 'serif' | 'mono').
7. designSummary: brief 1-sentence description of the detected design.`;

    if (aiClient) {
      try {
        let contents: any;
        if (isImage || isPdf) {
          const normalizedMime = isPdf
            ? 'application/pdf'
            : ext === 'png'
              ? 'image/png'
              : ext === 'webp'
                ? 'image/webp'
                : 'image/jpeg';
          contents = [
            {
              inlineData: {
                mimeType: normalizedMime,
                data: base64Clean
              }
            },
            { text: `${instructionPrompt}\nUploaded filename: ${fileName}` }
          ];
        } else {
          contents = `${instructionPrompt}\n\nExtracted Document Structure & Text:\n${extractedContextText || `Filename: ${fileName}`}`;
        }

        const response: any = await withTimeout(
          aiClient.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              responseMimeType: 'application/json',
              responseSchema: templateSchema
            }
          }),
          45000,
          'Gemini parse-resume-template'
        );

        const parsed = JSON.parse((response?.text || '{}').trim());
        const normalizedSpec = normalizeTemplateSpec(parsed, fileName, Boolean(extractedLogoDataUrl));
        return res.json({
          success: true,
          source: 'gemini',
          spec: normalizedSpec,
          extractedLogoDataUrl
        });
      } catch (aiErr) {
        console.warn('Template vision/AI parse fallback used:', aiErr instanceof Error ? aiErr.message : 'unavailable');
      }
    }

    // Deterministic fallback spec if Gemini key is missing or request failed
    const fallbackLayout: CustomResumeTemplateSpec['layoutType'] =
      extractedContextText.includes('Contains multi-column table layout: true')
        ? 'sidebar-left'
        : isImage || isPdf
          ? 'banner-top'
          : 'single-column';

    const fallbackSpec = normalizeTemplateSpec(
      {
        templateName: fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Uploaded Template',
        layoutType: fallbackLayout,
        fontStyle: lowerName.includes('exec') || lowerName.includes('classic') ? 'serif' : 'sans',
        primaryColor: detectedHexColors[0] || '#1e3a8a',
        accentColor: detectedHexColors[1] || detectedHexColors[0] || '#0ea5e9',
        sidebarBgColor: '#0f172a',
        headerBgColor: detectedHexColors[0] || '#1e293b',
        textColor: '#1e293b',
        mutedColor: '#64748b',
        headerAlignment: fallbackLayout === 'single-column' ? 'center' : 'left',
        iconStyle: 'circle-badge',
        showContactIcons: true,
        showSectionIcons: true,
        logoStyle: extractedLogoDataUrl ? 'uploaded-image' : 'monogram-circle',
        hasEmbeddedLogo: Boolean(extractedLogoDataUrl),
        sectionHeadings: { ...DEFAULT_SECTION_HEADINGS, ...inferredHeadings },
        sectionOrder: ALL_RESUME_SECTIONS,
        sectionIcons: DEFAULT_SECTION_ICONS,
        dividerStyle: 'accent-bar',
        bulletStyle: 'disc',
        designSummary: `Matched ${fallbackLayout} structure from ${fileName} with extracted headings, icons, and palette.`
      },
      fileName,
      Boolean(extractedLogoDataUrl)
    );

    return res.json({
      success: true,
      source: 'structural-fallback',
      spec: fallbackSpec,
      extractedLogoDataUrl
    });
  } catch (err) {
    console.error('parse-resume-template error:', err);
    return res.status(500).json({ error: 'Failed to parse uploaded template file.' });
  }
});

// Setup HTTP server + WebSocket live transcription + Vite / static serving
async function startServer() {
  const server = http.createServer(app);
  attachLiveTranscribeWebSocket(server, aiClient);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`HireBoost platform server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
