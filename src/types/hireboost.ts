export type UserRole = 'Student' | 'Admin';
export type ExperienceLevel = 'Fresher' | 'Intermediate' | 'Experienced';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type InterviewMode = 'Technical' | 'HR' | 'Mixed';
export type RoundFormat = 'mixed_coding_voice' | 'coding_only' | 'voice_only';
export type QuestionSetType = 'Predefined' | 'AI-Generated' | 'Custom';
export type SessionStatus = 'Scheduled' | 'Ready' | 'In_Progress' | 'Completed' | 'Cancelled';
export type CodingSubmissionType = 'manual' | 'auto';
export type CodingLanguage = 'javascript' | 'python';

export interface CodingTestCase {
  id: string;
  input: string; // JSON-encoded array of arguments e.g. "[[2,7,11,15], 9]"
  expectedOutput: string; // JSON-encoded expected return value e.g. "[0,1]"
  description?: string;
  isHidden?: boolean;
}

export interface CodingTestCaseResult {
  id: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  error?: string;
}

export interface CodingExecutionResult {
  status: 'Passed' | 'Failed' | 'Runtime Error' | 'Timeout' | 'Evaluated';
  stdout?: string;
  stderr?: string;
  executionTimeMs?: number;
  passedCount: number;
  totalCount: number;
}

export interface CodingProblemEvaluation {
  technicalScore: number;
  codeQualityScore: number;
  efficiencyScore: number;
  overallScore: number;
  feedback: string;
  complexityAnalysis?: string;
}

export interface VoiceQuestionEvaluation {
  conceptualScore: number;
  communicationScore: number;
  assessment: string;
  feedback: string;
  followUpsCount?: number;
  isProperSolution?: boolean;
  matchedKeywords?: string[];
  missingKeywords?: string[];
  keywordCoveragePct?: number;
  submissionType?: CodingSubmissionType;
}

export interface ConversationTurnContext {
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export interface User {
  userId: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  joinDate: string;
  profileId: string;
}

export type TargetAccentColor = 'indigo' | 'purple' | 'emerald' | 'amber' | 'pink' | 'cyan';

export interface CareerTarget {
  targetId: string;
  roleName: string;
  targetScore: number; // e.g., 75-98
  focusDomains: string[]; // empty array = All Domains
  description?: string;
  accentColor?: TargetAccentColor;
  createdAt: string;
}

export interface TargetProgressSummary {
  target: CareerTarget;
  sessionCount: number;
  avgScore: number;
  highestScore: number;
  latestScore: number;
  improvementPercentage: number;
  readinessPercentage: number;
  gapToTarget: number;
  avgTechnicalScore: number;
  avgCommunicationScore: number;
  avgConfidenceScore: number;
  avgResponseQualityScore: number;
  strongestSkill: string;
  weakestSkill: string;
  sessions: {
    sessionId: string;
    interviewTitle: string;
    domain: string;
    score: number;
    date: string;
    technicalScore: number;
    communicationScore: number;
    confidenceScore: number;
    responseQualityScore: number;
    targetId?: string;
  }[];
}

export interface UserProfile {
  profileId: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  joinDate: string;
  skills: string[];
  experience: ExperienceLevel;
  targetRole: string;
  activeTargetId?: string;
  targets?: CareerTarget[];
  resumeUrl?: string;
  resumeName?: string;
  bio?: string;
}

export interface InterviewConfig {
  configId: string;
  domain: string;
  subtopic?: string;
  customTopic?: string;
  difficulty: DifficultyLevel;
  mode: InterviewMode;
  roundFormat?: RoundFormat;
  codingTimeLimits?: Partial<Record<DifficultyLevel, number>>;
  voiceTimeLimits?: Partial<Record<DifficultyLevel, number>>;
  experienceLevel: ExperienceLevel;
  durationMinutes: number; // 5, 10, 15, 20, 25, 30 max
  questionSetType: QuestionSetType;
  title: string;
  description: string;
  targetId?: string;
  targetRole?: string;
  roadmapMilestoneId?: string;
  roadmapTargetId?: string;
}

export interface InterviewQuestionItem {
  questionId: string;
  questionText: string;
  questionType?: 'voice' | 'coding';
  difficulty?: DifficultyLevel;
  timeLimitSeconds?: number;
  keyPoints?: string[];
  sampleAnswer?: string;
  title?: string;
  functionName?: string;
  starterCode?: Partial<Record<CodingLanguage, string>>;
  defaultLanguage?: CodingLanguage;
  constraints?: string[];
  examples?: { input: string; output: string; explanation?: string }[];
  testCases?: CodingTestCase[];
}

export interface InterviewAnswerItem {
  questionId: string;
  questionText: string;
  answerText: string;
  submittedAt: string;
  durationSeconds: number;
  questionType?: 'voice' | 'coding';
  // Coding problem persistence fields
  problemId?: string;
  difficulty?: DifficultyLevel;
  assignedTimeLimitSeconds?: number;
  startTimestamp?: string;
  submissionTimestamp?: string;
  submittedCode?: string;
  language?: CodingLanguage;
  submissionType?: CodingSubmissionType;
  completedWithinTime?: boolean;
  executionResults?: CodingExecutionResult;
  testCaseResults?: CodingTestCaseResult[];
  evaluationScore?: number;
  codingEvaluation?: CodingProblemEvaluation;
  // Voice question persistence fields
  originalTranscription?: string;
  finalResponse?: string;
  voiceEvaluation?: VoiceQuestionEvaluation;
  conversationContext?: ConversationTurnContext[];
}

export interface TranscriptExchange {
  questionNumber: number;
  questionText: string;
  answerText: string;
  timestamp: string;
  durationSeconds: number;
  interviewerNotes?: string;
  questionType?: 'voice' | 'coding';
  difficulty?: DifficultyLevel;
  submissionType?: CodingSubmissionType;
  submittedCode?: string;
  language?: CodingLanguage;
  assignedTimeLimitSeconds?: number;
  completedWithinTime?: boolean;
  executionSummary?: string;
  evaluationScore?: number;
  originalTranscription?: string;
  finalResponse?: string;
  isProperSolution?: boolean;
  matchedKeywords?: string[];
  missingKeywords?: string[];
  keywordCoveragePct?: number;
}

export interface Transcript {
  transcriptId: string;
  sessionId: string;
  userId: string;
  interviewTitle: string;
  domain: string;
  difficulty: DifficultyLevel;
  durationMinutes: number;
  conversation: TranscriptExchange[];
  generatedAt: string;
  language: string;
}

export interface ScoreBreakdown {
  breakdownId: string;
  reportId: string;
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  responseQualityScore: number;
}

export interface EvaluationMediaSummary {
  cameraUsed: boolean;
  micUsed: boolean;
  recordingDurationSeconds: number;
  wordsPerMinute: number;
  totalWords: number;
  snapshotCount?: number;
  evaluationSource?: string;
  tabSwitches?: number;
  cameraAlerts?: number;
  multiplePeopleAlerts?: number;
  backgroundNoiseAlerts?: number;
  gadgetAlerts?: number;
  discrepancyStrikes?: number;
  autoSubmittedDueToDiscrepancy?: boolean;
  autoSubmitReason?: string;
}

export interface EvaluationReport {
  reportId: string;
  sessionId: string;
  userId: string;
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  responseQualityScore: number;
  overallScore: number;
  writtenFeedback: string;
  deliveryNotes?: string;
  mediaSummary?: EvaluationMediaSummary;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  breakdown: ScoreBreakdown;
  evaluatedAt: string;
}

export interface InterviewSession {
  sessionId: string;
  userId: string;
  configId: string;
  config: InterviewConfig;
  status: SessionStatus;
  startTime?: string;
  endTime?: string;
  durationSeconds: number;
  recordedDurationSeconds?: number;
  currentQuestionIndex: number;
  questions: InterviewQuestionItem[];
  answers: InterviewAnswerItem[];
  transcriptId?: string;
  evaluationReportId?: string;
  createdAt: string;
}

export interface GoalProgress {
  targetId?: string;
  targetRole: string;
  currentAverageScore: number;
  targetScore: number;
  progressPercentage: number;
  focusDomains?: string[];
  matchingSessionsCount?: number;
}

export interface ProgressTracker {
  trackerId: string;
  userId: string;
  totalInterviews: number;
  avgScore: number;
  highestScore: number;
  latestScore: number;
  improvementPercentage: number;
  lastUpdated: string;
  scoreHistory: {
    sessionId: string;
    interviewTitle: string;
    domain: string;
    score: number;
    date: string;
    technicalScore: number;
    communicationScore: number;
    confidenceScore: number;
    responseQualityScore?: number;
    targetId?: string;
  }[];
  goalProgress: GoalProgress;
}

export interface InterviewHistory {
  historyId: string;
  userId: string;
  sessions: InterviewSession[];
}

export interface InterviewStreakDay {
  date: string;
  dayLabel: string;
  dayNumber: string;
  isToday: boolean;
  completedCount: number;
}

export interface InterviewStreakSummary {
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
  totalPracticeDays: number;
  activeDaysLast7: number;
  weeklyTargetDays: number;
  lastPracticeDate: string | null;
  days: InterviewStreakDay[];
  countsByDate: Record<string, number>;
  freezeDates: string[];
}

export interface UserFeedback {
  feedbackId: string;
  sessionId: string;
  userId: string;
  userName: string;
  feedbackType?: 'app' | 'interview';
  interviewTopic: string;
  domain: string;
  overallRating: number; // 1-5
  difficultyRating: number; // 1-5
  questionQualityRating: number; // 1-5
  interviewExperienceRating: number; // 1-5
  writtenFeedback: string;
  suggestions: string;
  createdAt: string;
  isPublic: boolean;
}

export interface QuestionBankItem {
  questionId: string;
  domain: string;
  difficulty: DifficultyLevel;
  mode: InterviewMode;
  questionText: string;
  sampleAnswer: string;
  keyPoints: string[];
  category: string;
}

export type ResumeTemplateId = 'modern' | 'minimal' | 'executive' | 'compact' | 'custom';

export type ResumeSectionKey =
  | 'summary'
  | 'skills'
  | 'projects'
  | 'experience'
  | 'education'
  | 'achievements';

export type ResumeIconName =
  | 'user'
  | 'sparkles'
  | 'code'
  | 'briefcase'
  | 'graduation'
  | 'award'
  | 'layers'
  | 'terminal'
  | 'target'
  | 'star'
  | 'globe';

export interface CustomResumeTemplateSpec {
  templateName: string;
  layoutType: 'sidebar-left' | 'sidebar-right' | 'single-column' | 'two-column-header' | 'banner-top';
  fontStyle: 'sans' | 'serif' | 'mono';
  primaryColor: string;
  accentColor: string;
  sidebarBgColor: string;
  headerBgColor: string;
  textColor: string;
  mutedColor: string;
  headerAlignment: 'left' | 'center' | 'split';
  iconStyle: 'lucide-outline' | 'circle-badge' | 'square-badge' | 'minimal-dot' | 'none';
  showContactIcons: boolean;
  showSectionIcons: boolean;
  logoStyle: 'monogram-circle' | 'monogram-square' | 'crest-emblem' | 'initials-pill' | 'uploaded-image' | 'none';
  logoText?: string;
  hasEmbeddedLogo: boolean;
  logoCropBox?: {
    xPct: number;
    yPct: number;
    wPct: number;
    hPct: number;
  };
  sectionHeadings: Record<ResumeSectionKey, string>;
  sectionOrder: ResumeSectionKey[];
  sectionIcons: Record<ResumeSectionKey, ResumeIconName>;
  dividerStyle: 'solid' | 'double' | 'accent-bar' | 'dashed' | 'none';
  bulletStyle: 'disc' | 'square' | 'arrow' | 'dash';
  designSummary: string;
}

export interface CustomResumeTemplate {
  fileName: string;
  mimeType: string;
  uploadedAt: string;
  logoDataUrl?: string;
  spec: CustomResumeTemplateSpec;
}

export interface ResumeData {
  resumeId: string;
  userId: string;
  targetRole?: string;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    portfolioUrl: string;
    linkedinUrl: string;
    githubUrl: string;
  };
  careerObjective: string;
  education: {
    id: string;
    degree: string;
    institution: string;
    year: string;
    gradeOrGpa: string;
  }[];
  skills: {
    category: string;
    items: string[];
  }[];
  projects: {
    id: string;
    title: string;
    techStack: string;
    description: string;
    rawNotes?: string;
    liveUrl?: string;
  }[];
  workExperience: {
    id: string;
    role: string;
    company: string;
    duration: string;
    description: string;
  }[];
  internships: {
    id: string;
    role: string;
    organization: string;
    duration: string;
    details: string;
  }[];
  certifications: string[];
  achievements: string[];
  templateId: ResumeTemplateId;
  customTemplate?: CustomResumeTemplate;
  updatedAt: string;
}
