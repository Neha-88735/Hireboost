import {
  User,
  UserProfile,
  InterviewConfig,
  InterviewSession,
  Transcript,
  EvaluationReport,
  EvaluationMediaSummary,
  ScoreBreakdown,
  ProgressTracker,
  UserFeedback,
  QuestionBankItem,
  ResumeData,
  DifficultyLevel,
  InterviewMode,
  ExperienceLevel,
  CareerTarget,
  TargetProgressSummary,
  TargetAccentColor,
  InterviewStreakSummary,
  InterviewStreakDay,
  InterviewQuestionItem,
  InterviewAnswerItem
} from '../types/hireboost';
import { getRoadmapForTarget } from '../data/targetRoadmaps';
import { analyzeInterviewResponse } from '../utils/responseAnalyzer';

export const INTERVIEW_DOMAINS = [
  'Data Structures and Algorithms',
  'C++',
  'Java',
  'Python',
  'Web Development',
  'Database Management Systems',
  'Operating Systems',
  'Computer Networks',
  'Software Engineering',
  'Artificial Intelligence',
  'Machine Learning',
  'HR Interview',
  'Behavioral Interview',
  'Custom Topic'
];

export const TARGET_PRESETS: Array<{
  roleName: string;
  targetScore: number;
  focusDomains: string[];
  description: string;
  accentColor: TargetAccentColor;
}> = [
  {
    roleName: 'Software Development Engineer',
    targetScore: 90,
    focusDomains: ['Data Structures and Algorithms', 'Python', 'Software Engineering', 'HR Interview'],
    description: 'Balanced readiness across core algorithms, coding, system engineering, and behavioral rounds.',
    accentColor: 'indigo'
  },
  {
    roleName: 'DSA & Algorithmic Specialist',
    targetScore: 85,
    focusDomains: ['Data Structures and Algorithms'],
    description: 'Focused mastery on arrays, trees, graphs, and dynamic programming interviews.',
    accentColor: 'emerald'
  },
  {
    roleName: 'Full-Stack Web Developer',
    targetScore: 85,
    focusDomains: ['Web Development', 'Software Engineering', 'Database Management Systems'],
    description: 'Frontend architecture, API design, browser performance, and relational/NoSQL databases.',
    accentColor: 'purple'
  },
  {
    roleName: 'Python & Backend Engineer',
    targetScore: 88,
    focusDomains: ['Python', 'Database Management Systems', 'Operating Systems', 'Computer Networks'],
    description: 'Concurrency, backend APIs, database internals, and systems fundamentals.',
    accentColor: 'cyan'
  },
  {
    roleName: 'AI / Machine Learning Engineer',
    targetScore: 88,
    focusDomains: ['Artificial Intelligence', 'Machine Learning', 'Python', 'Data Structures and Algorithms'],
    description: 'Model architecture, ML math, Python pipelines, and algorithmic problem solving.',
    accentColor: 'amber'
  },
  {
    roleName: 'HR & Leadership Readiness',
    targetScore: 85,
    focusDomains: ['HR Interview', 'Behavioral Interview'],
    description: 'STAR storytelling, conflict resolution, and executive communication confidence.',
    accentColor: 'pink'
  }
];

const DEFAULT_STUDENT_TARGETS: CareerTarget[] = [
  {
    targetId: 'tgt_sde_001',
    roleName: 'Software Development Engineer',
    targetScore: 90,
    focusDomains: ['Data Structures and Algorithms', 'Python', 'Software Engineering', 'HR Interview'],
    description: 'Comprehensive SWE placement readiness across DSA, Python, and HR rounds.',
    accentColor: 'indigo',
    createdAt: '2026-09-15T09:00:00Z'
  },
  {
    targetId: 'tgt_dsa_002',
    roleName: 'DSA & Algorithmic Specialist',
    targetScore: 85,
    focusDomains: ['Data Structures and Algorithms'],
    description: 'Dedicated technical problem solving, trees, graphs, and dynamic programming.',
    accentColor: 'emerald',
    createdAt: '2026-10-01T09:00:00Z'
  },
  {
    targetId: 'tgt_backend_003',
    roleName: 'Python & Backend Engineer',
    targetScore: 85,
    focusDomains: ['Python', 'Database Management Systems', 'Operating Systems', 'Computer Networks'],
    description: 'Backend concurrency, Python internals, databases, and networking.',
    accentColor: 'purple',
    createdAt: '2026-10-08T09:00:00Z'
  }
];

const STORAGE_KEYS = {
  USERS: 'hireboost_users',
  CURRENT_USER_ID: 'hireboost_current_user_id',
  PROFILES: 'hireboost_profiles',
  CONFIGS: 'hireboost_configs',
  SESSIONS: 'hireboost_sessions',
  TRANSCRIPTS: 'hireboost_transcripts',
  EVALUATIONS: 'hireboost_evaluations',
  PROGRESS_TRACKERS: 'hireboost_progress_trackers',
  FEEDBACK: 'hireboost_feedback',
  QUESTION_BANK: 'hireboost_question_bank',
  RESUMES: 'hireboost_resumes',
  THEME: 'hireboost_theme',
  STREAK_GOALS: 'hireboost_streak_goals',
  ACTIVE_SESSION_ID: 'hireboost_active_session_id'
};

// Initial Seed Data
const DEFAULT_STUDENT_ID = 'usr_student_001';
const DEFAULT_ADMIN_ID = 'usr_admin_001';

const INITIAL_USERS: User[] = [
  {
    userId: DEFAULT_STUDENT_ID,
    name: 'Aditi Aishwarya',
    email: 'aditiaishwarya003@gmail.com',
    role: 'Student',
    joinDate: '2026-09-15',
    profileId: 'prof_student_001'
  },
  {
    userId: DEFAULT_ADMIN_ID,
    name: 'Chief Admin',
    email: 'admin@hireboost.io',
    role: 'Admin',
    joinDate: '2026-01-10',
    profileId: 'prof_admin_001'
  }
];

const INITIAL_PROFILES: Record<string, UserProfile> = {
  [DEFAULT_STUDENT_ID]: {
    profileId: 'prof_student_001',
    userId: DEFAULT_STUDENT_ID,
    name: 'Aditi Aishwarya',
    email: 'aditiaishwarya003@gmail.com',
    role: 'Student',
    joinDate: '2026-09-15',
    skills: ['Data Structures & Algorithms', 'Python', 'React', 'SQL', 'System Design', 'Git'],
    experience: 'Fresher',
    targetRole: 'Software Development Engineer',
    activeTargetId: 'tgt_sde_001',
    targets: DEFAULT_STUDENT_TARGETS,
    resumeUrl: 'https://example.com/resumes/aditi_aishwarya_cv.pdf',
    resumeName: 'Aditi_Aishwarya_SDE_Resume.pdf',
    bio: 'Aspiring Software Development Engineer focused on algorithms, scalable web applications, and distributed systems.'
  },
  [DEFAULT_ADMIN_ID]: {
    profileId: 'prof_admin_001',
    userId: DEFAULT_ADMIN_ID,
    name: 'Chief Admin',
    email: 'admin@hireboost.io',
    role: 'Admin',
    joinDate: '2026-01-10',
    skills: ['Platform Architecture', 'Question Curation', 'Evaluation Analytics'],
    experience: 'Experienced',
    targetRole: 'Platform Administrator',
    bio: 'HireBoost Lead Platform & Curriculum Administrator.'
  }
};

const INITIAL_SESSIONS: InterviewSession[] = [
  {
    sessionId: 'sess_001',
    userId: DEFAULT_STUDENT_ID,
    configId: 'cfg_001',
    config: {
      configId: 'cfg_001',
      domain: 'Data Structures and Algorithms',
      difficulty: 'Easy',
      mode: 'Technical',
      experienceLevel: 'Fresher',
      durationMinutes: 15,
      questionSetType: 'Predefined',
      title: 'DSA Fundamentals & Array Logic',
      description: 'Foundational array, linked list, and time complexity evaluation.'
    },
    status: 'Completed',
    startTime: '2026-10-02T10:00:00Z',
    endTime: '2026-10-02T10:14:20Z',
    durationSeconds: 860,
    currentQuestionIndex: 2,
    questions: [
      {
        questionId: 'q_dsa_1',
        questionText: 'Explain the difference between an Array and a Linked List in terms of memory layout and search time complexity.'
      },
      {
        questionId: 'q_dsa_2',
        questionText: 'How would you detect a cycle in a singly linked list? Describe Floyd\'s Cycle Detection algorithm.'
      }
    ],
    answers: [
      {
        questionId: 'q_dsa_1',
        questionText: 'Explain the difference between an Array and a Linked List in terms of memory layout and search time complexity.',
        answerText: 'Arrays store elements in contiguous memory locations so index lookup is O(1), but insertion takes O(n). Linked lists use node pointers.',
        submittedAt: '2026-10-02T10:07:00Z',
        durationSeconds: 420
      },
      {
        questionId: 'q_dsa_2',
        questionText: 'How would you detect a cycle in a singly linked list? Describe Floyd\'s Cycle Detection algorithm.',
        answerText: 'We can use a slow and fast pointer. Slow moves one step and fast moves two steps. If they meet, there is a cycle.',
        submittedAt: '2026-10-02T10:14:00Z',
        durationSeconds: 440
      }
    ],
    transcriptId: 'tr_001',
    evaluationReportId: 'rep_001',
    createdAt: '2026-10-02T09:55:00Z'
  },
  {
    sessionId: 'sess_002',
    userId: DEFAULT_STUDENT_ID,
    configId: 'cfg_002',
    config: {
      configId: 'cfg_002',
      domain: 'Python',
      difficulty: 'Easy',
      mode: 'Technical',
      experienceLevel: 'Fresher',
      durationMinutes: 10,
      questionSetType: 'Predefined',
      title: 'Python Core & Memory Basics',
      description: 'List vs Tuple, Garbage Collection, and Decorators in Python.'
    },
    status: 'Completed',
    startTime: '2026-10-10T14:30:00Z',
    endTime: '2026-10-10T14:39:45Z',
    durationSeconds: 585,
    currentQuestionIndex: 2,
    questions: [
      {
        questionId: 'q_py_1',
        questionText: 'What is the difference between a list and a tuple in Python, and when would you use each?'
      },
      {
        questionId: 'q_py_2',
        questionText: 'What are Python decorators and how do they function under the hood?'
      }
    ],
    answers: [
      {
        questionId: 'q_py_1',
        questionText: 'What is the difference between a list and a tuple in Python, and when would you use each?',
        answerText: 'Lists are mutable while tuples are immutable. Tuples are faster and used for fixed constants or dictionary keys.',
        submittedAt: '2026-10-10T14:34:00Z',
        durationSeconds: 240
      },
      {
        questionId: 'q_py_2',
        questionText: 'What are Python decorators and how do they function under the hood?',
        answerText: 'A decorator is a callable that takes another function as input and returns a modified function wrapper without modifying the original code.',
        submittedAt: '2026-10-10T14:39:00Z',
        durationSeconds: 345
      }
    ],
    transcriptId: 'tr_002',
    evaluationReportId: 'rep_002',
    createdAt: '2026-10-10T14:25:00Z'
  },
  {
    sessionId: 'sess_003',
    userId: DEFAULT_STUDENT_ID,
    configId: 'cfg_003',
    config: {
      configId: 'cfg_003',
      domain: 'HR Interview',
      difficulty: 'Medium',
      mode: 'HR',
      experienceLevel: 'Fresher',
      durationMinutes: 20,
      questionSetType: 'Predefined',
      title: 'Behavioral & Culture Fit Assessment',
      description: 'STAR methodology, conflict resolution, and career trajectory.'
    },
    status: 'Completed',
    startTime: '2026-10-18T16:00:00Z',
    endTime: '2026-10-18T16:18:10Z',
    durationSeconds: 1090,
    currentQuestionIndex: 2,
    questions: [
      {
        questionId: 'q_hr_1',
        questionText: 'Describe a situation where you had a disagreement with a team member. How did you resolve it constructively?'
      },
      {
        questionId: 'q_hr_2',
        questionText: 'Where do you see yourself professionally in the next 3 to 5 years?'
      }
    ],
    answers: [
      {
        questionId: 'q_hr_1',
        questionText: 'Describe a situation where you had a disagreement with a team member. How did you resolve it constructively?',
        answerText: 'During a hackathon, we disagreed on database choice. I organized an objective benchmark comparing MongoDB vs PostgreSQL for our write patterns, and we chose Postgres collaboratively.',
        submittedAt: '2026-10-18T16:09:00Z',
        durationSeconds: 540
      },
      {
        questionId: 'q_hr_2',
        questionText: 'Where do you see yourself professionally in the next 3 to 5 years?',
        answerText: 'Growing into a high-impact SDE II, driving critical microservices and mentoring junior engineers while deepening domain mastery in distributed systems.',
        submittedAt: '2026-10-18T16:17:00Z',
        durationSeconds: 550
      }
    ],
    transcriptId: 'tr_003',
    evaluationReportId: 'rep_003',
    createdAt: '2026-10-18T15:50:00Z'
  },
  {
    sessionId: 'sess_004',
    userId: DEFAULT_STUDENT_ID,
    configId: 'cfg_004',
    config: {
      configId: 'cfg_004',
      domain: 'Data Structures and Algorithms',
      difficulty: 'Medium',
      mode: 'Technical',
      experienceLevel: 'Fresher',
      durationMinutes: 15,
      questionSetType: 'Predefined',
      title: 'Dynamic Programming & Graph Traversal',
      description: 'Medium level algorithmic optimization and BST validation.'
    },
    status: 'Completed',
    startTime: '2026-10-27T11:00:00Z',
    endTime: '2026-10-27T11:14:50Z',
    durationSeconds: 890,
    currentQuestionIndex: 2,
    questions: [
      {
        questionId: 'q_dsa_m1',
        questionText: 'Explain the concept of Dynamic Programming and how it differs from Divide and Conquer. Provide an example problem.'
      },
      {
        questionId: 'q_dsa_m2',
        questionText: 'Given a Binary Search Tree, how do you validate whether it satisfies the BST property? What is the time and space complexity?'
      }
    ],
    answers: [
      {
        questionId: 'q_dsa_m1',
        questionText: 'Explain the concept of Dynamic Programming and how it differs from Divide and Conquer. Provide an example problem.',
        answerText: 'Dynamic programming solves problems with overlapping subproblems and optimal substructure by memoizing results. Unlike divide and conquer which recalculates independent subproblems, DP stores state in a table.',
        submittedAt: '2026-10-27T11:07:00Z',
        durationSeconds: 420
      },
      {
        questionId: 'q_dsa_m2',
        questionText: 'Given a Binary Search Tree, how do you validate whether it satisfies the BST property? What is the time and space complexity?',
        answerText: 'We do a recursive traversal maintaining valid (min, max) range boundaries for every node, or do an in-order traversal and assert strictly ascending order. Time complexity is O(N) and space is O(H).',
        submittedAt: '2026-10-27T11:14:00Z',
        durationSeconds: 470
      }
    ],
    transcriptId: 'tr_004',
    evaluationReportId: 'rep_004',
    createdAt: '2026-10-27T10:45:00Z'
  }
];

const INITIAL_EVALUATIONS: Record<string, EvaluationReport> = {
  rep_001: {
    reportId: 'rep_001',
    sessionId: 'sess_001',
    userId: DEFAULT_STUDENT_ID,
    technicalScore: 54,
    communicationScore: 58,
    confidenceScore: 52,
    responseQualityScore: 56,
    overallScore: 55, // Interview 1: 55%
    writtenFeedback: 'Good conceptual start on linked lists and arrays. Time complexities need rigorous justification with edge-case handling.',
    strengths: ['Identified array contiguous memory allocation', 'Knew Floyd slow/fast pointer concept'],
    weaknesses: ['Did not explain how pointers reset to find cycle start node', 'Skipped cache locality explanation for arrays'],
    suggestions: ['Revise two-pointer mathematical proofs', 'Explain Big-O worst vs amortized complexity'],
    breakdown: {
      breakdownId: 'bd_001',
      reportId: 'rep_001',
      technicalScore: 54,
      communicationScore: 58,
      confidenceScore: 52,
      responseQualityScore: 56
    },
    evaluatedAt: '2026-10-02T10:15:00Z'
  },
  rep_002: {
    reportId: 'rep_002',
    sessionId: 'sess_002',
    userId: DEFAULT_STUDENT_ID,
    technicalScore: 64,
    communicationScore: 66,
    confidenceScore: 60,
    responseQualityScore: 62,
    overallScore: 63, // Interview 2: 63%
    writtenFeedback: 'Clear improvement in structural answers. Python decorators were accurately defined. Deepen memory profiling knowledge.',
    strengths: ['Clear definition of mutability in Python', 'Understood closure wrapper mechanism'],
    weaknesses: ['Missed reference counting cycle handling (gc module)', 'Could mention functools.wraps preservation of metadata'],
    suggestions: ['Always mention `functools.wraps` when explaining decorators in interviews', 'Review Python GIL implications'],
    breakdown: {
      breakdownId: 'bd_002',
      reportId: 'rep_002',
      technicalScore: 64,
      communicationScore: 66,
      confidenceScore: 60,
      responseQualityScore: 62
    },
    evaluatedAt: '2026-10-10T14:40:00Z'
  },
  rep_003: {
    reportId: 'rep_003',
    sessionId: 'sess_003',
    userId: DEFAULT_STUDENT_ID,
    technicalScore: 70,
    communicationScore: 74,
    confidenceScore: 70,
    responseQualityScore: 70,
    overallScore: 71, // Interview 3: 71%
    writtenFeedback: 'Very good behavioral performance. The hackathon database benchmark story was a compelling use of the STAR framework.',
    strengths: ['Effective STAR storytelling', 'Objective conflict resolution using metrics', 'Positive professional outlook'],
    weaknesses: ['Could articulate personal leadership impact more strongly', 'Slight hesitation during opening thoughts'],
    suggestions: ['State the measurable outcome at the beginning of behavioral answers', 'Quantify project results (e.g., latency, users)'],
    breakdown: {
      breakdownId: 'bd_003',
      reportId: 'rep_003',
      technicalScore: 70,
      communicationScore: 74,
      confidenceScore: 70,
      responseQualityScore: 70
    },
    evaluatedAt: '2026-10-18T16:19:00Z'
  },
  rep_004: {
    reportId: 'rep_004',
    sessionId: 'sess_004',
    userId: DEFAULT_STUDENT_ID,
    technicalScore: 82,
    communicationScore: 80,
    confidenceScore: 78,
    responseQualityScore: 80,
    overallScore: 80, // Interview 4: 80%
    writtenFeedback: 'Excellent performance! Precise distinction between Dynamic Programming and Divide-and-Conquer. Clear BST boundary analysis.',
    strengths: ['Optimal substructure and overlapping subproblems explained accurately', 'In-order traversal vs min-max boundary nuances highlighted', 'Strong technical vocabulary'],
    weaknesses: ['Could explicitly compare top-down memoization vs bottom-up tabulation space overhead'],
    suggestions: ['Practice drawing recursion trees during system/whiteboard interviews', 'Address unbalanced tree recursion stack O(N) edge case'],
    breakdown: {
      breakdownId: 'bd_004',
      reportId: 'rep_004',
      technicalScore: 82,
      communicationScore: 80,
      confidenceScore: 78,
      responseQualityScore: 80
    },
    evaluatedAt: '2026-10-27T11:15:00Z'
  }
};

const INITIAL_TRANSCRIPTS: Record<string, Transcript> = {
  tr_001: {
    transcriptId: 'tr_001',
    sessionId: 'sess_001',
    userId: DEFAULT_STUDENT_ID,
    interviewTitle: 'DSA Fundamentals & Array Logic',
    domain: 'Data Structures and Algorithms',
    difficulty: 'Easy',
    durationMinutes: 15,
    language: 'English',
    generatedAt: '2026-10-02T10:14:30Z',
    conversation: [
      {
        questionNumber: 1,
        questionText: 'Explain the difference between an Array and a Linked List in terms of memory layout and search time complexity.',
        answerText: 'Arrays store elements in contiguous memory locations so index lookup is O(1), but insertion takes O(n). Linked lists use node pointers.',
        timestamp: '10:07 AM',
        durationSeconds: 420,
        interviewerNotes: 'Good foundation on basic lookup. Mention memory cache locality next time.'
      },
      {
        questionNumber: 2,
        questionText: 'How would you detect a cycle in a singly linked list? Describe Floyd\'s Cycle Detection algorithm.',
        answerText: 'We can use a slow and fast pointer. Slow moves one step and fast moves two steps. If they meet, there is a cycle.',
        timestamp: '10:14 AM',
        durationSeconds: 440,
        interviewerNotes: 'Captured pointer movement. Also explain the phase 2 reset to head.'
      }
    ]
  },
  tr_002: {
    transcriptId: 'tr_002',
    sessionId: 'sess_002',
    userId: DEFAULT_STUDENT_ID,
    interviewTitle: 'Python Core & Memory Basics',
    domain: 'Python',
    difficulty: 'Easy',
    durationMinutes: 10,
    language: 'English',
    generatedAt: '2026-10-10T14:39:50Z',
    conversation: [
      {
        questionNumber: 1,
        questionText: 'What is the difference between a list and a tuple in Python, and when would you use each?',
        answerText: 'Lists are mutable while tuples are immutable. Tuples are faster and used for fixed constants or dictionary keys.',
        timestamp: '02:34 PM',
        durationSeconds: 240
      },
      {
        questionNumber: 2,
        questionText: 'What are Python decorators and how do they function under the hood?',
        answerText: 'A decorator is a callable that takes another function as input and returns a modified function wrapper without modifying the original code.',
        timestamp: '02:39 PM',
        durationSeconds: 345
      }
    ]
  },
  tr_003: {
    transcriptId: 'tr_003',
    sessionId: 'sess_003',
    userId: DEFAULT_STUDENT_ID,
    interviewTitle: 'Behavioral & Culture Fit Assessment',
    domain: 'HR Interview',
    difficulty: 'Medium',
    durationMinutes: 20,
    language: 'English',
    generatedAt: '2026-10-18T16:18:20Z',
    conversation: [
      {
        questionNumber: 1,
        questionText: 'Describe a situation where you had a disagreement with a team member. How did you resolve it constructively?',
        answerText: 'During a hackathon, we disagreed on database choice. I organized an objective benchmark comparing MongoDB vs PostgreSQL for our write patterns, and we chose Postgres collaboratively.',
        timestamp: '04:09 PM',
        durationSeconds: 540
      },
      {
        questionNumber: 2,
        questionText: 'Where do you see yourself professionally in the next 3 to 5 years?',
        answerText: 'Growing into a high-impact SDE II, driving critical microservices and mentoring junior engineers while deepening domain mastery in distributed systems.',
        timestamp: '04:17 PM',
        durationSeconds: 550
      }
    ]
  },
  tr_004: {
    transcriptId: 'tr_004',
    sessionId: 'sess_004',
    userId: DEFAULT_STUDENT_ID,
    interviewTitle: 'Dynamic Programming & Graph Traversal',
    domain: 'Data Structures and Algorithms',
    difficulty: 'Medium',
    durationMinutes: 15,
    language: 'English',
    generatedAt: '2026-10-27T11:14:55Z',
    conversation: [
      {
        questionNumber: 1,
        questionText: 'Explain the concept of Dynamic Programming and how it differs from Divide and Conquer. Provide an example problem.',
        answerText: 'Dynamic programming solves problems with overlapping subproblems and optimal substructure by memoizing results. Unlike divide and conquer which recalculates independent subproblems, DP stores state in a table.',
        timestamp: '11:07 AM',
        durationSeconds: 420
      },
      {
        questionNumber: 2,
        questionText: 'Given a Binary Search Tree, how do you validate whether it satisfies the BST property? What is the time and space complexity?',
        answerText: 'We do a recursive traversal maintaining valid (min, max) range boundaries for every node, or do an in-order traversal and assert strictly ascending order. Time complexity is O(N) and space is O(H).',
        timestamp: '11:14 AM',
        durationSeconds: 470
      }
    ]
  }
};

const INITIAL_FEEDBACKS: UserFeedback[] = [
  {
    feedbackId: 'fb_001',
    sessionId: 'sess_004',
    userId: DEFAULT_STUDENT_ID,
    userName: 'Aditi A.',
    interviewTopic: 'Dynamic Programming & Graph Traversal',
    domain: 'Data Structures and Algorithms',
    overallRating: 5,
    difficultyRating: 4,
    questionQualityRating: 5,
    interviewExperienceRating: 5,
    writtenFeedback: 'The AI feedback highlighted exactly where my BST recursion boundary reasoning had gaps. Highly realistic!',
    suggestions: 'Add optional syntax highlighted coding scratchpad.',
    createdAt: '2026-10-27T11:20:00Z',
    isPublic: true
  },
  {
    feedbackId: 'fb_002',
    sessionId: 'sess_ext_01',
    userId: 'usr_ext_01',
    userName: 'Rohan Sharma',
    interviewTopic: 'System Design & High Concurrency',
    domain: 'Software Engineering',
    overallRating: 5,
    difficultyRating: 5,
    questionQualityRating: 5,
    interviewExperienceRating: 5,
    writtenFeedback: 'Felt like a real L4 Amazon interview. The timer kept me focused and the speech recognition worked smoothly.',
    suggestions: 'Include more caching and CDN edge routing questions.',
    createdAt: '2026-10-29T15:10:00Z',
    isPublic: true
  },
  {
    feedbackId: 'fb_003',
    sessionId: 'sess_ext_02',
    userId: 'usr_ext_02',
    userName: 'Priya Mehta',
    interviewTopic: 'HR & Leadership Competency',
    domain: 'HR Interview',
    overallRating: 4,
    difficultyRating: 3,
    questionQualityRating: 4,
    interviewExperienceRating: 4,
    writtenFeedback: 'Great STAR framework questions. Helped me overcome interview anxiety before campus placement drives.',
    suggestions: 'Provide a breakdown of speech pacing.',
    createdAt: '2026-11-01T09:45:00Z',
    isPublic: true
  },
  {
    feedbackId: 'fb_004',
    sessionId: 'sess_ext_03',
    userId: 'usr_ext_03',
    userName: 'Kavita Nair',
    interviewTopic: 'Python AsyncIO & Architecture',
    domain: 'Python',
    overallRating: 5,
    difficultyRating: 4,
    questionQualityRating: 5,
    interviewExperienceRating: 5,
    writtenFeedback: 'The question on Python GIL vs multiprocessing was top notch. Really helped solidify my concepts.',
    suggestions: 'Add more FastAPI / microservices topics.',
    createdAt: '2026-11-03T18:30:00Z',
    isPublic: true
  },
  {
    feedbackId: 'fb_005',
    sessionId: 'sess_ext_04',
    userId: 'usr_ext_04',
    userName: 'Siddharth V.',
    interviewTopic: 'Data Structures and Algorithms – Core Competency Round',
    domain: 'Data Structures and Algorithms',
    overallRating: 5,
    difficultyRating: 4,
    questionQualityRating: 5,
    interviewExperienceRating: 5,
    writtenFeedback: 'Great progression from array memory layout to graph optimization. Felt very close to an actual product-company technical screen.',
    suggestions: 'Keep the Big-O complexity prompts coming.',
    createdAt: '2026-11-05T14:20:00Z',
    isPublic: true
  },
  {
    feedbackId: 'fb_006',
    sessionId: 'sess_ext_05',
    userId: 'usr_ext_05',
    userName: 'Meera K.',
    interviewTopic: 'Data Structures and Algorithms – Rapid Technical Screening',
    domain: 'Data Structures and Algorithms',
    overallRating: 4,
    difficultyRating: 4,
    questionQualityRating: 5,
    interviewExperienceRating: 4,
    writtenFeedback: 'The 15-minute pacing forced me to stay concise and jump straight to time/space trade-offs.',
    suggestions: '',
    createdAt: '2026-11-06T10:15:00Z',
    isPublic: true
  },
  {
    feedbackId: 'fb_007',
    sessionId: 'sess_ext_06',
    userId: 'usr_ext_06',
    userName: 'Ananya R.',
    interviewTopic: 'Web Development – Core Competency Round',
    domain: 'Web Development',
    overallRating: 5,
    difficultyRating: 4,
    questionQualityRating: 5,
    interviewExperienceRating: 5,
    writtenFeedback: 'Covered CORS, browser rendering pipeline, and Core Web Vitals clearly. Voice dictation worked seamlessly.',
    suggestions: 'Include React server components follow-ups.',
    createdAt: '2026-11-08T16:40:00Z',
    isPublic: true
  },
  {
    feedbackId: 'fb_008',
    sessionId: 'sess_ext_07',
    userId: 'usr_ext_07',
    userName: 'Vikram D.',
    feedbackType: 'interview',
    interviewTopic: 'Database Management Systems – Core Competency Round',
    domain: 'Database Management Systems',
    overallRating: 4,
    difficultyRating: 4,
    questionQualityRating: 4,
    interviewExperienceRating: 5,
    writtenFeedback: 'Good indexing and ACID transaction questions with practical query optimization takeaways.',
    suggestions: '',
    createdAt: '2026-11-09T11:10:00Z',
    isPublic: true
  },
  {
    feedbackId: 'fb_app_001',
    sessionId: 'app_review_001',
    userId: 'usr_ext_08',
    userName: 'Karthik V.',
    feedbackType: 'app',
    interviewTopic: 'Overall Platform Experience',
    domain: 'Overall App',
    overallRating: 5,
    difficultyRating: 5,
    questionQualityRating: 5,
    interviewExperienceRating: 5,
    writtenFeedback: 'HireBoost brought together mock interviews, instant score breakdowns, multi-target tracking, and a clean resume builder in one place. My placement confidence improved noticeably within two weeks.',
    suggestions: 'Would love a dark-mode PDF export option for transcripts too.',
    createdAt: '2026-11-10T09:30:00Z',
    isPublic: true
  },
  {
    feedbackId: 'fb_app_002',
    sessionId: 'app_review_002',
    userId: 'usr_ext_09',
    userName: 'Sneha P.',
    feedbackType: 'app',
    interviewTopic: 'AI Interview & Voice Mode',
    domain: 'Overall App',
    overallRating: 5,
    difficultyRating: 4,
    questionQualityRating: 5,
    interviewExperienceRating: 5,
    writtenFeedback: 'The voice interview simulation and immediate post-session review flow feel realistic and intuitive. Tracking separate targets for SDE and Backend roles made prep much clearer.',
    suggestions: 'Keep expanding the Behavioral & Leadership prompt library.',
    createdAt: '2026-11-11T15:45:00Z',
    isPublic: true
  },
  {
    feedbackId: 'fb_app_003',
    sessionId: 'app_review_003',
    userId: 'usr_ext_10',
    userName: 'Arjun N.',
    feedbackType: 'app',
    interviewTopic: 'Resume Builder & Progress Insights',
    domain: 'Overall App',
    overallRating: 4,
    difficultyRating: 4,
    questionQualityRating: 5,
    interviewExperienceRating: 4,
    writtenFeedback: 'Clean interface without clutter. Having history, target-role sorting, and progress analytics unified under one view makes it easy to spot which domain needs work next.',
    suggestions: 'Add calendar reminders for maintaining interview streaks.',
    createdAt: '2026-11-12T12:20:00Z',
    isPublic: true
  }
];

const INITIAL_QUESTION_BANK: QuestionBankItem[] = [
  {
    questionId: 'qb_1',
    domain: 'Data Structures and Algorithms',
    difficulty: 'Easy',
    mode: 'Technical',
    category: 'Linear Data Structures',
    questionText: 'Explain the difference between an Array and a Linked List in terms of memory layout and search time complexity.',
    sampleAnswer: 'Arrays are stored contiguously in memory enabling O(1) random access via index, whereas linked lists use disparate nodes linked via pointers requiring O(N) sequential search.',
    keyPoints: ['Contiguous vs pointer memory', 'O(1) index access vs O(N) traversal', 'Cache locality advantages of arrays', 'Dynamic insertion cost differences']
  },
  {
    questionId: 'qb_2',
    domain: 'Data Structures and Algorithms',
    difficulty: 'Medium',
    mode: 'Technical',
    category: 'Dynamic Programming',
    questionText: 'Explain the concept of Dynamic Programming and how it differs from Divide and Conquer. Provide an example problem.',
    sampleAnswer: 'DP optimizes problems exhibiting overlapping subproblems and optimal substructure by caching results (memoization/tabulation), whereas Divide & Conquer solves non-overlapping independent subproblems independently.',
    keyPoints: ['Overlapping subproblems', 'Optimal substructure', 'Memoization vs Tabulation', 'Coin Change or Fibonacci contrast']
  },
  {
    questionId: 'qb_3',
    domain: 'Python',
    difficulty: 'Medium',
    mode: 'Technical',
    category: 'Concurrency',
    questionText: 'Explain the Python GIL (Global Interpreter Lock). How does it affect multithreading vs multiprocessing in CPU-bound vs I/O-bound tasks?',
    sampleAnswer: 'The GIL is a mutex that allows only one native thread to execute Python bytecode at a time. It does not hinder I/O-bound tasks where threads release GIL during system calls, but for CPU-bound tasks, multiprocessing or C-extensions are required to utilize multi-core CPUs.',
    keyPoints: ['Mutex protecting reference counts', 'Thread safety in CPython', 'CPU-bound vs I/O-bound behavior', 'Multiprocessing as a workaround']
  },
  {
    questionId: 'qb_4',
    domain: 'HR Interview',
    difficulty: 'Medium',
    mode: 'HR',
    category: 'Behavioral',
    questionText: 'Describe a situation where you had a disagreement with a team member. How did you resolve it constructively?',
    sampleAnswer: 'Using STAR format: describe the technical or process conflict, active listening to teammate concerns, relying on measurable benchmarks/data, and committing together to the chosen direction.',
    keyPoints: ['STAR format (Situation, Task, Action, Result)', 'Active listening and empathy', 'Data-driven decision making', 'Commitment to team velocity']
  },
  {
    questionId: 'qb_5',
    domain: 'Web Development',
    difficulty: 'Medium',
    mode: 'Technical',
    category: 'Frontend & Network',
    questionText: 'Explain CORS (Cross-Origin Resource Sharing) and how modern browsers enforce the Same-Origin Policy.',
    sampleAnswer: 'Same-Origin Policy restricts scripts in one origin from loading resources from another origin. CORS uses HTTP headers (Access-Control-Allow-Origin, preflight OPTIONS requests) to grant safe cross-origin access.',
    keyPoints: ['Protocol, domain, and port matching', 'Preflight OPTIONS request', 'Access-Control-Allow-Origin headers', 'Security against unauthorized ambient credential abuse']
  }
];

const INITIAL_RESUME: ResumeData = {
  resumeId: 'res_001',
  userId: DEFAULT_STUDENT_ID,
  personalInfo: {
    fullName: 'Aditi Aishwarya',
    email: 'aditiaishwarya003@gmail.com',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA / Hybrid',
    portfolioUrl: 'https://aditi-dev.tech',
    linkedinUrl: 'https://linkedin.com/in/aditi-aishwarya',
    githubUrl: 'https://github.com/aditiaishwarya'
  },
  careerObjective: 'Motivated Computer Science graduate with strong foundations in Data Structures, Algorithms, Full-Stack Engineering, and AI application development seeking a Software Development Engineer role to build scalable systems.',
  education: [
    {
      id: 'edu_1',
      degree: 'B.Tech in Computer Science & Engineering',
      institution: 'Institute of Technology & Science',
      year: '2022 - 2026',
      gradeOrGpa: '8.8 / 10 CGPA'
    }
  ],
  skills: [
    {
      category: 'Programming Languages',
      items: ['Python', 'TypeScript', 'JavaScript', 'C++', 'SQL']
    },
    {
      category: 'Frameworks & Libraries',
      items: ['React', 'Express', 'Tailwind CSS', 'Node.js', 'Next.js']
    },
    {
      category: 'Databases & Tools',
      items: ['PostgreSQL', 'SQLite', 'Git', 'Docker', 'RESTful APIs']
    }
  ],
  projects: [
    {
      id: 'proj_1',
      title: 'HireBoost – AI Interview Preparation Platform',
      techStack: 'React, Express, Google Gemini AI, TypeScript, Tailwind CSS',
      description: 'Built an end-to-end AI mock interview room with real-time speech evaluation, dynamic question scoring, and automated resume builder.',
      liveUrl: 'https://hireboost.dev'
    },
    {
      id: 'proj_2',
      title: 'Distributed Real-Time Collaborative Canvas',
      techStack: 'TypeScript, WebSocket, Canvas API, Redis',
      description: 'Engineered a low-latency collaborative diagramming canvas supporting up to 50 concurrent users with CRDT conflict resolution.',
      liveUrl: 'https://canvas-sync.io'
    }
  ],
  workExperience: [
    {
      id: 'work_1',
      role: 'Software Engineering Fellow',
      company: 'TechCraft Labs',
      duration: 'May 2025 - August 2025',
      description: 'Optimized API payload serializations resulting in a 28% drop in network latency. Automated end-to-end testing pipelines.'
    }
  ],
  internships: [
    {
      id: 'intern_1',
      role: 'Full-Stack Developer Intern',
      organization: 'CloudScale Solutions',
      duration: 'Jan 2025 - Apr 2025',
      details: 'Developed responsive dashboard widgets and integrated OAuth2 authentication flows used by over 12,000 active monthly users.'
    }
  ],
  certifications: [
    'AWS Certified Cloud Practitioner',
    'Meta Front-End Developer Professional Certificate',
    'DeepLearning.AI Prompt Engineering for Developers'
  ],
  achievements: [
    'Winner of National Smart Hackathon 2025 (1st out of 450+ engineering teams)',
    'Solved 450+ Data Structures and Algorithms problems on LeetCode & Codeforces',
    'Core Technical Lead at University Open-Source Developer Club'
  ],
  templateId: 'modern',
  updatedAt: '2026-11-04T12:00:00Z'
};

// Safe LocalStorage Helper
function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Storage set error:', err);
  }
}

// Storage API with UML operations
export const StorageService = {
  // Theme
  getTheme(): 'dark' | 'light' {
    return getStored<'dark' | 'light'>(STORAGE_KEYS.THEME, 'dark');
  },
  setTheme(theme: 'dark' | 'light'): void {
    setStored(STORAGE_KEYS.THEME, theme);
  },

  // 1. User: register(), login(), updateProfile()
  getUsers(): User[] {
    return getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  getCurrentUser(): User {
    const users = this.getUsers();
    const currentId = getStored<string>(STORAGE_KEYS.CURRENT_USER_ID, DEFAULT_STUDENT_ID);
    const found = users.find(u => u.userId === currentId);
    return found || users[0];
  },

  setCurrentUser(userId: string): void {
    setStored(STORAGE_KEYS.CURRENT_USER_ID, userId);
  },

  register(data: { name: string; email: string; password?: string; role: 'Student' | 'Admin'; joinDate?: string }): User {
    const users = this.getUsers();
    const existing = users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw new Error('A user with this email address already exists.');
    }

    const userId = `usr_${Date.now()}`;
    const profileId = `prof_${Date.now()}`;
    const joinDate = data.joinDate || new Date().toISOString().split('T')[0];

    const newUser: User = {
      userId,
      name: data.name,
      email: data.email,
      role: data.role,
      joinDate,
      profileId
    };

    users.push(newUser);
    setStored(STORAGE_KEYS.USERS, users);
    this.setCurrentUser(userId);

    // Automatically create associated UserProfile
    const defaultRole = data.role === 'Student' ? 'Software Development Engineer' : 'Administrator';
    const initialTarget: CareerTarget = {
      targetId: `tgt_${Date.now()}`,
      roleName: defaultRole,
      targetScore: 90,
      focusDomains: [],
      description: `Primary career target for ${defaultRole}.`,
      accentColor: 'indigo',
      createdAt: new Date().toISOString()
    };

    const profiles = this.getAllProfiles();
    profiles[userId] = {
      profileId,
      userId,
      name: data.name,
      email: data.email,
      role: data.role,
      joinDate,
      skills: data.role === 'Student' ? ['Problem Solving', 'Data Structures', 'Communication'] : ['Administration'],
      experience: 'Fresher',
      targetRole: defaultRole,
      activeTargetId: initialTarget.targetId,
      targets: [initialTarget],
      bio: `Hello! I am ${data.name}, preparing for success with HireBoost.`
    };
    setStored(STORAGE_KEYS.PROFILES, profiles);

    return newUser;
  },

  login(email: string, _password?: string): User {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('Invalid email or user not found. Please register first.');
    }
    this.setCurrentUser(user.userId);
    return user;
  },

  loginDemoUser(role: 'Student' | 'Admin'): User {
    const targetId = role === 'Admin' ? DEFAULT_ADMIN_ID : DEFAULT_STUDENT_ID;
    const users = this.getUsers();
    let user = users.find(u => u.userId === targetId);
    if (!user) {
      user = users.find(u => u.role === role) || users[0];
    }
    this.setCurrentUser(user.userId);
    return user;
  },

  logout(): void {
    setStored(STORAGE_KEYS.CURRENT_USER_ID, '');
    setStored(STORAGE_KEYS.ACTIVE_SESSION_ID, null);
  },

  getActiveSessionId(): string | null {
    return getStored<string | null>(STORAGE_KEYS.ACTIVE_SESSION_ID, null);
  },

  setActiveSessionId(sessionId: string | null): void {
    setStored(STORAGE_KEYS.ACTIVE_SESSION_ID, sessionId);
  },

  // 2. UserProfile: updateSkills(), uploadResume(), updateProfile()
  getAllProfiles(): Record<string, UserProfile> {
    return getStored<Record<string, UserProfile>>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
  },

  getUserProfile(userId: string): UserProfile {
    const profiles = this.getAllProfiles();
    if (profiles[userId]) {
      const existing = profiles[userId];
      // Ensure targets are hydrated for legacy stored profiles
      if (!existing.targets || existing.targets.length === 0) {
        if (userId === DEFAULT_STUDENT_ID && (!existing.targetRole || existing.targetRole === 'Software Development Engineer')) {
          existing.targets = DEFAULT_STUDENT_TARGETS;
          existing.activeTargetId = 'tgt_sde_001';
          existing.targetRole = 'Software Development Engineer';
        } else {
          const fallbackTarget: CareerTarget = {
            targetId: `tgt_${userId}_default`,
            roleName: existing.targetRole || 'Software Development Engineer',
            targetScore: 90,
            focusDomains: [],
            description: 'Primary career preparation benchmark.',
            accentColor: 'indigo',
            createdAt: existing.joinDate || new Date().toISOString()
          };
          existing.targets = [fallbackTarget];
          existing.activeTargetId = fallbackTarget.targetId;
        }
        profiles[userId] = existing;
        setStored(STORAGE_KEYS.PROFILES, profiles);
      }
      return existing;
    }

    // Fallback if not found
    const users = this.getUsers();
    const user = users.find(u => u.userId === userId) || users[0];
    const fallbackTarget: CareerTarget = {
      targetId: `tgt_${user.userId}_default`,
      roleName: 'Software Development Engineer',
      targetScore: 90,
      focusDomains: ['Data Structures and Algorithms', 'Python', 'Software Engineering', 'HR Interview'],
      description: 'Core engineering readiness benchmark.',
      accentColor: 'indigo',
      createdAt: new Date().toISOString()
    };
    const newProf: UserProfile = {
      profileId: `prof_${userId}`,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      joinDate: user.joinDate,
      skills: ['Data Structures', 'Python', 'Communication'],
      experience: 'Fresher',
      targetRole: 'Software Development Engineer',
      activeTargetId: fallbackTarget.targetId,
      targets: [fallbackTarget],
      bio: 'Ready to ace interviews.'
    };
    profiles[userId] = newProf;
    setStored(STORAGE_KEYS.PROFILES, profiles);
    return newProf;
  },

  updateProfile(profile: UserProfile): UserProfile {
    const profiles = this.getAllProfiles();
    const updatedProfile = { ...profile };

    // Keep active target roleName synchronized if edited directly via Profile form
    if (updatedProfile.targets && updatedProfile.targets.length > 0) {
      const activeIdx = updatedProfile.targets.findIndex(t => t.targetId === updatedProfile.activeTargetId);
      if (activeIdx !== -1 && updatedProfile.targetRole.trim()) {
        updatedProfile.targets[activeIdx] = {
          ...updatedProfile.targets[activeIdx],
          roleName: updatedProfile.targetRole.trim()
        };
      }
    }

    profiles[updatedProfile.userId] = updatedProfile;
    setStored(STORAGE_KEYS.PROFILES, profiles);

    // Keep User sync
    const users = this.getUsers();
    const idx = users.findIndex(u => u.userId === updatedProfile.userId);
    if (idx !== -1) {
      users[idx].name = updatedProfile.name;
      users[idx].email = updatedProfile.email;
      setStored(STORAGE_KEYS.USERS, users);
    }

    // Recompute progress tracker to reflect any target role updates
    this.trackProgress(updatedProfile.userId);
    return updatedProfile;
  },

  // Target Goal Management: getUserTargets(), getActiveTarget(), setActiveTarget(), upsertTarget(), deleteTarget()
  getUserTargets(userId: string): CareerTarget[] {
    const profile = this.getUserProfile(userId);
    return profile.targets || [];
  },

  getActiveTarget(userId: string): CareerTarget {
    const profile = this.getUserProfile(userId);
    const targets = profile.targets || [];
    const found = targets.find(t => t.targetId === profile.activeTargetId);
    if (found) return found;
    if (targets.length > 0) return targets[0];
    return {
      targetId: `tgt_${userId}_default`,
      roleName: profile.targetRole || 'Software Development Engineer',
      targetScore: 90,
      focusDomains: [],
      accentColor: 'indigo',
      createdAt: new Date().toISOString()
    };
  },

  setActiveTarget(userId: string, targetId: string): UserProfile {
    const profile = this.getUserProfile(userId);
    const targets = profile.targets || [];
    const selected = targets.find(t => t.targetId === targetId);
    if (!selected) return profile;

    profile.activeTargetId = selected.targetId;
    profile.targetRole = selected.roleName;
    return this.updateProfile(profile);
  },

  resolveTargetById(userId: string, targetId?: string): CareerTarget {
    const active = this.getActiveTarget(userId);
    if (!targetId) return active;

    const saved = this.getUserTargets(userId).find(t => t.targetId === targetId);
    if (saved) return saved;

    const matchingPreset = TARGET_PRESETS.find(
      p => `preset_${p.roleName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}` === targetId
    );
    if (matchingPreset) {
      return {
        targetId,
        roleName: matchingPreset.roleName,
        targetScore: matchingPreset.targetScore,
        focusDomains: matchingPreset.focusDomains,
        description: matchingPreset.description,
        accentColor: matchingPreset.accentColor,
        createdAt: '2026-01-01T00:00:00Z'
      };
    }

    if (targetId.startsWith('domain_')) {
      const domain = decodeURIComponent(targetId.slice('domain_'.length));
      return {
        targetId,
        roleName: domain,
        targetScore: active.targetScore,
        focusDomains: [domain],
        accentColor: 'indigo',
        createdAt: '2026-01-01T00:00:00Z'
      };
    }

    return active;
  },

  getRespectiveTargetForDomain(userId: string, domain: string): { target: CareerTarget; stepNumber: string } {
    const findStageForDomain = (target: CareerTarget): string | undefined => {
      const rm = getRoadmapForTarget(target);
      const exact = rm.phases.find(p => p.recommendedDomain === domain);
      if (exact) return exact.stepNumber;
      const byMilestone = rm.phases.find(p => p.milestones.some(m => m.interviewDomain === domain));
      return byMilestone?.stepNumber;
    };

    const activeTarget = this.getActiveTarget(userId);

    // If the active target itself is already dedicated to this single domain, stay on it
    const isAlreadyDedicatedActiveTarget =
      activeTarget.roleName.trim().toLowerCase() === domain.toLowerCase() ||
      (activeTarget.focusDomains?.length === 1 && activeTarget.focusDomains[0] === domain);

    if (isAlreadyDedicatedActiveTarget) {
      return { target: activeTarget, stepNumber: findStageForDomain(activeTarget) || '01' };
    }

    // Every topic card opens its own dedicated 4-stage subject/language roadmap
    const domainTarget: CareerTarget = {
      targetId: `domain_${encodeURIComponent(domain)}`,
      roleName: domain,
      targetScore: activeTarget.targetScore,
      focusDomains: [domain],
      accentColor: 'indigo',
      createdAt: '2026-01-01T00:00:00Z'
    };

    return { target: domainTarget, stepNumber: findStageForDomain(domainTarget) || '01' };
  },

  upsertTarget(
    userId: string,
    targetInput: Omit<CareerTarget, 'targetId' | 'createdAt'> & { targetId?: string },
    setAsActive = true
  ): CareerTarget {
    const profile = this.getUserProfile(userId);
    const targets = [...(profile.targets || [])];

    let savedTarget: CareerTarget;
    if (targetInput.targetId) {
      const existingIdx = targets.findIndex(t => t.targetId === targetInput.targetId);
      if (existingIdx !== -1) {
        savedTarget = {
          ...targets[existingIdx],
          roleName: targetInput.roleName.trim(),
          targetScore: Math.min(100, Math.max(50, targetInput.targetScore)),
          focusDomains: targetInput.focusDomains,
          description: targetInput.description,
          accentColor: targetInput.accentColor || targets[existingIdx].accentColor || 'indigo'
        };
        targets[existingIdx] = savedTarget;
      } else {
        savedTarget = {
          targetId: targetInput.targetId,
          roleName: targetInput.roleName.trim(),
          targetScore: Math.min(100, Math.max(50, targetInput.targetScore)),
          focusDomains: targetInput.focusDomains,
          description: targetInput.description,
          accentColor: targetInput.accentColor || 'indigo',
          createdAt: new Date().toISOString()
        };
        targets.push(savedTarget);
      }
    } else {
      savedTarget = {
        targetId: `tgt_${Date.now()}`,
        roleName: targetInput.roleName.trim(),
        targetScore: Math.min(100, Math.max(50, targetInput.targetScore)),
        focusDomains: targetInput.focusDomains,
        description: targetInput.description,
        accentColor: targetInput.accentColor || 'indigo',
        createdAt: new Date().toISOString()
      };
      targets.push(savedTarget);
    }

    profile.targets = targets;
    if (setAsActive || !profile.activeTargetId) {
      profile.activeTargetId = savedTarget.targetId;
      profile.targetRole = savedTarget.roleName;
    } else {
      // Keep targetRole synced if the currently active target was edited
      const active = targets.find(t => t.targetId === profile.activeTargetId);
      if (active) {
        profile.targetRole = active.roleName;
      }
    }

    this.updateProfile(profile);
    return savedTarget;
  },

  deleteTarget(userId: string, targetId: string): UserProfile {
    const profile = this.getUserProfile(userId);
    const targets = profile.targets || [];
    if (targets.length <= 1) {
      return profile; // Keep at least one active target
    }

    const remaining = targets.filter(t => t.targetId !== targetId);
    profile.targets = remaining;
    if (profile.activeTargetId === targetId && remaining.length > 0) {
      profile.activeTargetId = remaining[0].targetId;
      profile.targetRole = remaining[0].roleName;
    }
    return this.updateProfile(profile);
  },

  doesSessionMatchTarget(session: InterviewSession, target: CareerTarget): boolean {
    if (session.config.targetId && session.config.targetId === target.targetId) {
      return true;
    }
    if (!target.focusDomains || target.focusDomains.length === 0) {
      return true;
    }
    return target.focusDomains.includes(session.config.domain);
  },

  updateSkills(userId: string, skills: string[]): UserProfile {
    const profile = this.getUserProfile(userId);
    profile.skills = skills;
    return this.updateProfile(profile);
  },

  uploadResume(userId: string, resumeUrl: string, resumeName: string): UserProfile {
    const profile = this.getUserProfile(userId);
    profile.resumeUrl = resumeUrl;
    profile.resumeName = resumeName;
    return this.updateProfile(profile);
  },

  // 3. InterviewConfig: configureSession()
  configureSession(config: Omit<InterviewConfig, 'configId'>): InterviewConfig {
    const configs = getStored<InterviewConfig[]>(STORAGE_KEYS.CONFIGS, []);
    const newConfig: InterviewConfig = {
      ...config,
      configId: `cfg_${Date.now()}`
    };
    configs.push(newConfig);
    setStored(STORAGE_KEYS.CONFIGS, configs);
    return newConfig;
  },

  // 4. InterviewSession: startSession(), endSession()
  getAllSessions(): InterviewSession[] {
    return getStored<InterviewSession[]>(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
  },

  getUserSessions(userId: string): InterviewSession[] {
    const sessions = this.getAllSessions();
    return sessions.filter(s => s.userId === userId);
  },

  getSessionById(sessionId: string): InterviewSession | undefined {
    return this.getAllSessions().find(s => s.sessionId === sessionId);
  },

  createSession(userId: string, config: InterviewConfig, questions: InterviewQuestionItem[]): InterviewSession {
    const sessions = this.getAllSessions();
    const newSession: InterviewSession = {
      sessionId: `sess_${Date.now()}`,
      userId,
      configId: config.configId,
      config,
      status: 'Ready',
      durationSeconds: config.durationMinutes * 60,
      currentQuestionIndex: 0,
      questions,
      answers: [],
      createdAt: new Date().toISOString()
    };
    sessions.unshift(newSession);
    setStored(STORAGE_KEYS.SESSIONS, sessions);
    return newSession;
  },

  startSession(sessionId: string): InterviewSession {
    const sessions = this.getAllSessions();
    const session = sessions.find(s => s.sessionId === sessionId);
    if (!session) throw new Error('Session not found');
    session.status = 'In_Progress';
    if (!session.startTime) {
      session.startTime = new Date().toISOString();
    }
    setStored(STORAGE_KEYS.SESSIONS, sessions);
    this.setActiveSessionId(sessionId);
    return session;
  },

  saveAnswer(
    sessionId: string,
    answer: Omit<InterviewAnswerItem, 'submittedAt'> & { submittedAt?: string }
  ): InterviewSession {
    const sessions = this.getAllSessions();
    const session = sessions.find(s => s.sessionId === sessionId);
    if (!session) throw new Error('Session not found');

    const existingIdx = session.answers.findIndex(a => a.questionId === answer.questionId);
    const item: InterviewAnswerItem = {
      ...answer,
      submittedAt: answer.submittedAt || new Date().toISOString()
    };

    if (existingIdx >= 0) {
      session.answers[existingIdx] = item;
    } else {
      session.answers.push(item);
    }

    const qIdx = session.questions.findIndex(q => q.questionId === answer.questionId);
    if (qIdx >= 0) {
      session.currentQuestionIndex = Math.max(
        session.currentQuestionIndex,
        Math.min(session.questions.length - 1, qIdx + 1)
      );
    } else {
      session.currentQuestionIndex = Math.min(session.questions.length - 1, session.currentQuestionIndex + 1);
    }
    setStored(STORAGE_KEYS.SESSIONS, sessions);
    return session;
  },

  endSession(
    sessionId: string,
    aiOverride?: {
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
      recordedDurationSeconds?: number;
    }
  ): InterviewSession {
    const sessions = this.getAllSessions();
    const session = sessions.find(s => s.sessionId === sessionId);
    if (!session) throw new Error('Session not found');

    session.status = 'Completed';
    session.endTime = new Date().toISOString();
    if (typeof aiOverride?.recordedDurationSeconds === 'number') {
      session.recordedDurationSeconds = aiOverride.recordedDurationSeconds;
    }
    if (this.getActiveSessionId() === sessionId) {
      this.setActiveSessionId(null);
    }

    // Trigger transcript & evaluation generation
    const transcript = this.generateTranscript(session);
    session.transcriptId = transcript.transcriptId;

    const evaluation = this.evaluate(session, aiOverride);
    session.evaluationReportId = evaluation.reportId;

    setStored(STORAGE_KEYS.SESSIONS, sessions);

    // Automatically tick matching roadmap milestone(s) for active & target roadmaps
    const targets = this.getUserTargets(session.userId);
    const activeTarget = this.getActiveTarget(session.userId);
    const targetIdsToSync = new Set<string>([activeTarget.targetId]);
    if (session.config.roadmapTargetId) targetIdsToSync.add(session.config.roadmapTargetId);
    if (session.config.targetId) targetIdsToSync.add(session.config.targetId);
    const syncedTargetIds = new Set<string>();
    targets.forEach((t) => {
      if (targetIdsToSync.has(t.targetId)) {
        syncedTargetIds.add(t.targetId);
        this.syncCompletedSessionsToRoadmap(session.userId, t);
      }
    });
    targetIdsToSync.forEach((tid) => {
      if (!syncedTargetIds.has(tid)) {
        const resolved = this.resolveTargetById(session.userId, tid);
        if (resolved.targetId === tid) {
          this.syncCompletedSessionsToRoadmap(session.userId, resolved);
        }
      }
    });

    // Update ProgressTracker automatically
    this.trackProgress(session.userId);

    return session;
  },

  syncCompletedSessionsToRoadmap(userId: string, target: CareerTarget): string[] {
    const checkedKey = `hireboost_roadmap_${userId}_${target.targetId}`;
    const syncedKey = `hireboost_roadmap_synced_${userId}_${target.targetId}`;

    let checkedIds: string[] = [];
    let syncedSessionIds: string[] = [];
    try {
      const rawChecked = localStorage.getItem(checkedKey);
      checkedIds = rawChecked ? JSON.parse(rawChecked) : [];
    } catch {
      checkedIds = [];
    }
    try {
      const rawSynced = localStorage.getItem(syncedKey);
      syncedSessionIds = rawSynced ? JSON.parse(rawSynced) : [];
    } catch {
      syncedSessionIds = [];
    }

    const roadmap = getRoadmapForTarget(target);
    const allMilestones = roadmap.phases.flatMap(p => p.milestones);
    const milestoneIdSet = new Set(allMilestones.map(m => m.id));
    const checkedSet = new Set(checkedIds);
    const syncedSet = new Set(syncedSessionIds);

    const completedSessions = this.getUserSessions(userId)
      .filter(s => s.status === 'Completed')
      .sort((a, b) => new Date(a.startTime || a.createdAt).getTime() - new Date(b.startTime || b.createdAt).getTime());

    let changed = false;

    for (const sess of completedSessions) {
      if (syncedSet.has(sess.sessionId)) continue;

      const explicitId = sess.config.roadmapMilestoneId;
      if (explicitId && milestoneIdSet.has(explicitId)) {
        if (!checkedSet.has(explicitId)) {
          checkedSet.add(explicitId);
          changed = true;
        }
        syncedSet.add(sess.sessionId);
        continue;
      }

      // Auto-match by domain + difficulty (then domain fallback) to first unticked milestone
      const exactMatch = allMilestones.find(
        m =>
          !checkedSet.has(m.id) &&
          m.interviewDomain === sess.config.domain &&
          m.interviewDifficulty === sess.config.difficulty
      );
      const domainMatch =
        exactMatch ||
        allMilestones.find(m => !checkedSet.has(m.id) && m.interviewDomain === sess.config.domain);

      if (domainMatch) {
        checkedSet.add(domainMatch.id);
        changed = true;
      }
      syncedSet.add(sess.sessionId);
    }

    const updatedChecked = Array.from(checkedSet);
    const updatedSynced = Array.from(syncedSet);

    if (changed || updatedSynced.length !== syncedSessionIds.length) {
      try {
        localStorage.setItem(checkedKey, JSON.stringify(updatedChecked));
        localStorage.setItem(syncedKey, JSON.stringify(updatedSynced));
      } catch {
        // ignore storage errors
      }
    }

    return updatedChecked;
  },

  // 5. Transcript: generateTranscript()
  getAllTranscripts(): Record<string, Transcript> {
    return getStored<Record<string, Transcript>>(STORAGE_KEYS.TRANSCRIPTS, INITIAL_TRANSCRIPTS);
  },

  getTranscript(transcriptId: string): Transcript | undefined {
    return this.getAllTranscripts()[transcriptId];
  },

  generateTranscript(session: InterviewSession): Transcript {
    const transcripts = this.getAllTranscripts();
    const transcriptId = `tr_${session.sessionId.replace('sess_', '')}`;

    const conversation = session.questions.map((q, idx) => {
      const ans = session.answers.find(a => a.questionId === q.questionId);
      const qType = q.questionType || ans?.questionType || 'voice';
      const execSummary = ans?.executionResults
        ? `${ans.executionResults.status} (${ans.executionResults.passedCount}/${ans.executionResults.totalCount} test cases passed)`
        : undefined;

      const parsedVoice =
        qType === 'voice'
          ? analyzeInterviewResponse({
              questionText: q.questionText,
              keyPoints: q.keyPoints || [],
              domain: session.config.domain,
              answerText: ans?.finalResponse || ans?.answerText || ''
            })
          : null;

      const defaultNote =
        qType === 'coding'
          ? ans?.codingEvaluation?.feedback || execSummary || 'Coding submission recorded.'
          : ans?.voiceEvaluation?.feedback || parsedVoice?.honestFeedback || 'Response recorded.';

      const resolvedScore =
        ans?.evaluationScore ??
        ans?.codingEvaluation?.overallScore ??
        ans?.voiceEvaluation?.conceptualScore ??
        (qType === 'voice' ? parsedVoice?.conceptualScore : undefined);

      return {
        questionNumber: idx + 1,
        questionText: q.title ? `${q.title}: ${q.questionText}` : q.questionText,
        answerText: ans
          ? ans.answerText || (ans.submittedCode ? `[${ans.language || 'code'} submission]` : '(Empty submission)')
          : '(Candidate skipped or provided no response)',
        timestamp: ans ? new Date(ans.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        durationSeconds: ans ? ans.durationSeconds : 0,
        interviewerNotes: defaultNote,
        questionType: qType,
        difficulty: q.difficulty || ans?.difficulty || session.config.difficulty,
        submissionType: ans?.submissionType || ans?.voiceEvaluation?.submissionType,
        submittedCode: ans?.submittedCode,
        language: ans?.language,
        assignedTimeLimitSeconds: q.timeLimitSeconds || ans?.assignedTimeLimitSeconds,
        completedWithinTime: ans?.completedWithinTime,
        executionSummary: execSummary,
        evaluationScore: resolvedScore,
        originalTranscription: ans?.originalTranscription,
        finalResponse: ans?.finalResponse,
        isProperSolution:
          qType === 'coding'
            ? Boolean((ans?.executionResults?.passedCount || 0) > 0 && (ans?.evaluationScore ?? 0) >= 60)
            : ans?.voiceEvaluation?.isProperSolution ?? parsedVoice?.isProperSolution,
        matchedKeywords: ans?.voiceEvaluation?.matchedKeywords ?? parsedVoice?.matchedKeywords,
        missingKeywords: ans?.voiceEvaluation?.missingKeywords ?? parsedVoice?.missingKeywords,
        keywordCoveragePct: ans?.voiceEvaluation?.keywordCoveragePct ?? parsedVoice?.keywordCoveragePct
      };
    });

    const transcript: Transcript = {
      transcriptId,
      sessionId: session.sessionId,
      userId: session.userId,
      interviewTitle: session.config.title,
      domain: session.config.domain,
      difficulty: session.config.difficulty,
      durationMinutes: session.config.durationMinutes,
      conversation,
      generatedAt: new Date().toISOString(),
      language: 'English'
    };

    transcripts[transcriptId] = transcript;
    setStored(STORAGE_KEYS.TRANSCRIPTS, transcripts);
    return transcript;
  },

  // 6. EvaluationReport & 7. ScoreBreakdown: evaluate(), calculateBreakdown()
  getAllEvaluations(): Record<string, EvaluationReport> {
    return getStored<Record<string, EvaluationReport>>(STORAGE_KEYS.EVALUATIONS, INITIAL_EVALUATIONS);
  },

  getEvaluation(reportId: string): EvaluationReport | undefined {
    return this.getAllEvaluations()[reportId];
  },

  calculateBreakdown(session: InterviewSession): ScoreBreakdown {
    const questions = session.questions || [];
    const voiceTechScores: number[] = [];
    const voiceCommScores: number[] = [];
    const codingScores: number[] = [];

    for (const q of questions) {
      const ans = session.answers.find(a => a.questionId === q.questionId);
      const qType = q.questionType || ans?.questionType || 'voice';

      if (qType === 'coding') {
        const cScore =
          ans?.evaluationScore ??
          ans?.codingEvaluation?.overallScore ??
          (ans?.submittedCode && ans.submittedCode.trim() ? 35 : 5);
        codingScores.push(cScore);
      } else {
        const parsed = analyzeInterviewResponse({
          questionText: q.questionText,
          keyPoints: q.keyPoints || [],
          domain: session.config.domain,
          answerText: ans?.finalResponse || ans?.answerText || ''
        });
        const techScore =
          typeof ans?.voiceEvaluation?.conceptualScore === 'number'
            ? ans.voiceEvaluation.conceptualScore
            : parsed.conceptualScore;
        const commScore =
          typeof ans?.voiceEvaluation?.communicationScore === 'number'
            ? ans.voiceEvaluation.communicationScore
            : parsed.communicationScore;
        voiceTechScores.push(techScore);
        voiceCommScores.push(commScore);
      }
    }

    const allTech = [...voiceTechScores, ...codingScores];
    const technicalScore =
      allTech.length > 0
        ? Math.min(98, Math.max(5, Math.round(allTech.reduce((a, b) => a + b, 0) / allTech.length)))
        : 10;

    const communicationScore =
      voiceCommScores.length > 0
        ? Math.min(98, Math.max(8, Math.round(voiceCommScores.reduce((a, b) => a + b, 0) / voiceCommScores.length)))
        : Math.min(92, Math.max(15, technicalScore));

    const confidenceScore = Math.min(
      95,
      Math.max(10, Math.round(technicalScore * 0.55 + communicationScore * 0.45))
    );
    const responseQualityScore = Math.round(
      technicalScore * 0.5 + communicationScore * 0.3 + confidenceScore * 0.2
    );

    return {
      breakdownId: `bd_${session.sessionId}`,
      reportId: `rep_${session.sessionId}`,
      technicalScore,
      communicationScore,
      confidenceScore,
      responseQualityScore
    };
  },

  evaluate(
    session: InterviewSession,
    aiOverride?: {
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
    }
  ): EvaluationReport {
    const evaluations = this.getAllEvaluations();
    const reportId = `rep_${session.sessionId.replace('sess_', '')}`;
    const fallbackBreakdown = this.calculateBreakdown(session);

    const clampScore = (val: number | undefined, fb: number) =>
      typeof val === 'number' && !Number.isNaN(val)
        ? Math.min(100, Math.max(0, Math.round(val)))
        : fb;

    const technicalScore = clampScore(aiOverride?.technicalScore, fallbackBreakdown.technicalScore);
    const communicationScore = clampScore(aiOverride?.communicationScore, fallbackBreakdown.communicationScore);
    const confidenceScore = clampScore(aiOverride?.confidenceScore, fallbackBreakdown.confidenceScore);
    const responseQualityScore = clampScore(aiOverride?.responseQualityScore, fallbackBreakdown.responseQualityScore);

    const breakdown: ScoreBreakdown = {
      breakdownId: `bd_${session.sessionId}`,
      reportId,
      technicalScore,
      communicationScore,
      confidenceScore,
      responseQualityScore
    };

    const overallScore = clampScore(
      aiOverride?.overallScore,
      Math.round((technicalScore + communicationScore + confidenceScore + responseQualityScore) / 4)
    );

    const domain = session.config.domain;
    let writtenFeedback = aiOverride?.writtenFeedback || '';
    let strengths: string[] = Array.isArray(aiOverride?.strengths) && aiOverride.strengths.length > 0 ? aiOverride.strengths : [];
    let weaknesses: string[] = Array.isArray(aiOverride?.weaknesses) && aiOverride.weaknesses.length > 0 ? aiOverride.weaknesses : [];
    let suggestions: string[] = Array.isArray(aiOverride?.suggestions) && aiOverride.suggestions.length > 0 ? aiOverride.suggestions : [];

    if (!writtenFeedback) {
      const voiceAnalyses = session.questions
        .filter(q => q.questionType !== 'coding')
        .map(q => {
          const ans = session.answers.find(a => a.questionId === q.questionId);
          return analyzeInterviewResponse({
            questionText: q.questionText,
            keyPoints: q.keyPoints || [],
            domain,
            answerText: ans?.finalResponse || ans?.answerText || ''
          });
        });

      const validCount = voiceAnalyses.filter(v => v.isProperSolution).length;
      const missingTerms = Array.from(new Set(voiceAnalyses.flatMap(v => v.missingKeywords))).slice(0, 4);

      if (overallScore >= 78) {
        writtenFeedback = `Strong interview performance! You demonstrated solid command of ${domain} concepts with structured explanations.`;
        if (strengths.length === 0) {
          strengths = [
            `Accurate coverage of core ${domain} keywords and reasoning`,
            'Clear, structured explanations across questions',
            'Consistent delivery under timed conditions'
          ];
        }
        if (weaknesses.length === 0) {
          weaknesses = missingTerms.length > 0
            ? [`Could elaborate further on ${missingTerms.slice(0, 2).join(' and ')}`]
            : ['Explore edge cases and runtime trade-offs slightly deeper'];
        }
        if (suggestions.length === 0) {
          suggestions = [
            'Practice comparing alternative architectures and space/time trade-offs',
            'Keep answers crisp with concrete production examples'
          ];
        }
      } else if (overallScore >= 52) {
        writtenFeedback = `Partial ${domain} performance (${validCount}/${Math.max(1, voiceAnalyses.length)} voice questions fully answered). Several responses were too brief or missed expected technical terms.`;
        if (strengths.length === 0) {
          strengths = validCount > 0
            ? [`Covered foundational ${domain} ideas on ${validCount} question(s)`]
            : ['Completed the session and engaged with prompts'];
        }
        if (weaknesses.length === 0) {
          weaknesses = [
            missingTerms.length > 0
              ? `Missed key expected concepts: ${missingTerms.join(', ')}`
              : 'Responses lacked sufficient depth and complexity analysis',
            'Some answers were too brief before time expired'
          ];
        }
        if (suggestions.length === 0) {
          suggestions = [
            missingTerms.length > 0
              ? `Review and explain ${missingTerms.slice(0, 3).join(', ')} explicitly`
              : 'Expand each answer with definition, mechanism, and example',
            'Aim for complete multi-sentence explanations within each question timer'
          ];
        }
      } else {
        writtenFeedback = `Weak ${domain} performance — responses were mostly off-topic, too brief, or uncaptured and did not demonstrate a proper solution.`;
        if (strengths.length === 0) {
          strengths = ['Joined and completed the timed evaluation workflow'];
        }
        if (weaknesses.length === 0) {
          weaknesses = [
            'Answers did not address the expected domain concepts or keywords',
            missingTerms.length > 0
              ? `Key concepts omitted: ${missingTerms.join(', ')}`
              : 'Insufficient technical detail provided'
          ];
        }
        if (suggestions.length === 0) {
          suggestions = [
            'Directly address what the prompt asks instead of brief or off-topic remarks',
            missingTerms.length > 0
              ? `Study core ${domain} topics including ${missingTerms.slice(0, 3).join(', ')}`
              : `Review ${domain} fundamentals and practice full explanations aloud`
          ];
        }
      }
    }

    const report: EvaluationReport = {
      reportId,
      sessionId: session.sessionId,
      userId: session.userId,
      technicalScore,
      communicationScore,
      confidenceScore,
      responseQualityScore,
      overallScore,
      writtenFeedback,
      deliveryNotes: aiOverride?.deliveryNotes,
      mediaSummary: aiOverride?.mediaSummary,
      strengths,
      weaknesses,
      suggestions,
      breakdown,
      evaluatedAt: new Date().toISOString()
    };

    evaluations[reportId] = report;
    setStored(STORAGE_KEYS.EVALUATIONS, evaluations);
    return report;
  },

  // 8. ProgressTracker: trackProgress(), getTargetProgressSummaries()
  getTargetProgressSummaries(userId: string): TargetProgressSummary[] {
    const targets = this.getUserTargets(userId);
    const evaluations = this.getAllEvaluations();
    const completedSessions = this.getUserSessions(userId)
      .filter(s => s.status === 'Completed')
      .sort((a, b) => {
        const dateA = new Date(a.endTime || a.createdAt).getTime();
        const dateB = new Date(b.endTime || b.createdAt).getTime();
        return dateA - dateB;
      });

    return targets.map(target => {
      const matching = completedSessions.filter(s => this.doesSessionMatchTarget(s, target));
      const sessions = matching.map(sess => {
        const evalRep = sess.evaluationReportId ? evaluations[sess.evaluationReportId] : undefined;
        const score = evalRep ? evalRep.overallScore : 60;
        return {
          sessionId: sess.sessionId,
          interviewTitle: sess.config.title,
          domain: sess.config.domain,
          score,
          date: sess.endTime ? sess.endTime.split('T')[0] : sess.createdAt.split('T')[0],
          technicalScore: evalRep ? evalRep.technicalScore : score,
          communicationScore: evalRep ? evalRep.communicationScore : score,
          confidenceScore: evalRep ? evalRep.confidenceScore : score,
          responseQualityScore: evalRep ? evalRep.responseQualityScore : score,
          targetId: sess.config.targetId
        };
      });

      const sessionCount = sessions.length;
      const avgScore = sessionCount > 0
        ? Math.round((sessions.reduce((acc, s) => acc + s.score, 0) / sessionCount) * 10) / 10
        : 0;
      const highestScore = sessionCount > 0 ? Math.max(...sessions.map(s => s.score)) : 0;
      const latestScore = sessionCount > 0 ? sessions[sessionCount - 1].score : 0;
      const firstScore = sessionCount > 0 ? sessions[0].score : 0;
      const improvementPercentage =
        firstScore > 0 && sessionCount > 1
          ? Math.round(((latestScore - firstScore) / firstScore) * 100)
          : 0;

      const readinessPercentage =
        sessionCount > 0 && target.targetScore > 0
          ? Math.min(100, Math.round((avgScore / target.targetScore) * 100))
          : 0;
      const gapToTarget =
        sessionCount > 0
          ? Math.max(0, Math.round((target.targetScore - avgScore) * 10) / 10)
          : target.targetScore;

      const avgTechnicalScore = sessionCount > 0
        ? Math.round(sessions.reduce((acc, s) => acc + s.technicalScore, 0) / sessionCount)
        : 0;
      const avgCommunicationScore = sessionCount > 0
        ? Math.round(sessions.reduce((acc, s) => acc + s.communicationScore, 0) / sessionCount)
        : 0;
      const avgConfidenceScore = sessionCount > 0
        ? Math.round(sessions.reduce((acc, s) => acc + s.confidenceScore, 0) / sessionCount)
        : 0;
      const avgResponseQualityScore = sessionCount > 0
        ? Math.round(sessions.reduce((acc, s) => acc + s.responseQualityScore, 0) / sessionCount)
        : 0;

      let strongestSkill = 'N/A';
      let weakestSkill = 'N/A';
      if (sessionCount > 0) {
        const pillars = [
          { name: 'Technical', score: avgTechnicalScore },
          { name: 'Communication', score: avgCommunicationScore },
          { name: 'Confidence', score: avgConfidenceScore },
          { name: 'Response Quality', score: avgResponseQualityScore }
        ].sort((a, b) => b.score - a.score);
        strongestSkill = `${pillars[0].name} (${pillars[0].score}%)`;
        weakestSkill = `${pillars[pillars.length - 1].name} (${pillars[pillars.length - 1].score}%)`;
      }

      return {
        target,
        sessionCount,
        avgScore,
        highestScore,
        latestScore,
        improvementPercentage,
        readinessPercentage,
        gapToTarget,
        avgTechnicalScore,
        avgCommunicationScore,
        avgConfidenceScore,
        avgResponseQualityScore,
        strongestSkill,
        weakestSkill,
        sessions
      };
    });
  },

  trackProgress(userId: string): ProgressTracker {
    const userSessions = this.getUserSessions(userId)
      .filter(s => s.status === 'Completed')
      .sort((a, b) => {
        const dateA = new Date(a.endTime || a.createdAt).getTime();
        const dateB = new Date(b.endTime || b.createdAt).getTime();
        return dateA - dateB;
      });
    const evaluations = this.getAllEvaluations();
    const activeTarget = this.getActiveTarget(userId);

    const historyScores = userSessions.map(sess => {
      const evalRep = sess.evaluationReportId ? evaluations[sess.evaluationReportId] : undefined;
      const score = evalRep ? evalRep.overallScore : 60;
      return {
        sessionId: sess.sessionId,
        interviewTitle: sess.config.title,
        domain: sess.config.domain,
        score,
        date: sess.endTime ? sess.endTime.split('T')[0] : sess.createdAt.split('T')[0],
        technicalScore: evalRep ? evalRep.technicalScore : score,
        communicationScore: evalRep ? evalRep.communicationScore : score,
        confidenceScore: evalRep ? evalRep.confidenceScore : score,
        responseQualityScore: evalRep ? evalRep.responseQualityScore : score,
        targetId: sess.config.targetId
      };
    });

    const totalInterviews = historyScores.length;
    let avgScore = 0;
    let highestScore = 0;
    let latestScore = 0;
    let improvementPercentage = 0;

    if (totalInterviews > 0) {
      const sum = historyScores.reduce((acc, h) => acc + h.score, 0);
      avgScore = Math.round((sum / totalInterviews) * 10) / 10;
      highestScore = Math.max(...historyScores.map(h => h.score));
      latestScore = historyScores[historyScores.length - 1].score;

      const firstScore = historyScores[0].score;
      if (firstScore > 0 && totalInterviews > 1) {
        improvementPercentage = Math.round(((latestScore - firstScore) / firstScore) * 100);
      } else {
        improvementPercentage = 0;
      }
    }

    // Active Career Target Goal Progress
    const matchingSessions = userSessions.filter(s => this.doesSessionMatchTarget(s, activeTarget));
    const matchingScores = matchingSessions.map(sess => {
      const evalRep = sess.evaluationReportId ? evaluations[sess.evaluationReportId] : undefined;
      return evalRep ? evalRep.overallScore : 60;
    });

    const targetScore = activeTarget.targetScore || 90;
    const currentScore = matchingScores.length > 0
      ? Math.round((matchingScores.reduce((acc, s) => acc + s, 0) / matchingScores.length) * 10) / 10
      : 0;
    const progressPercentage = matchingScores.length > 0
      ? Math.min(100, Math.round((currentScore / targetScore) * 100))
      : 0;

    const tracker: ProgressTracker = {
      trackerId: `trck_${userId}`,
      userId,
      totalInterviews,
      avgScore,
      highestScore,
      latestScore,
      improvementPercentage,
      lastUpdated: new Date().toISOString(),
      scoreHistory: historyScores,
      goalProgress: {
        targetId: activeTarget.targetId,
        targetRole: activeTarget.roleName,
        currentAverageScore: currentScore,
        targetScore,
        progressPercentage,
        focusDomains: activeTarget.focusDomains,
        matchingSessionsCount: matchingSessions.length
      }
    };

    const trackers = getStored<Record<string, ProgressTracker>>(STORAGE_KEYS.PROGRESS_TRACKERS, {});
    trackers[userId] = tracker;
    setStored(STORAGE_KEYS.PROGRESS_TRACKERS, trackers);

    return tracker;
  },

  getProgressTracker(userId: string): ProgressTracker {
    return this.trackProgress(userId);
  },

  // 9. InterviewHistory & Streaks
  viewHistory(userId: string): InterviewSession[] {
    return this.getUserSessions(userId);
  },

  getWeeklyStreakGoal(userId: string): number {
    const goals = getStored<Record<string, number>>(STORAGE_KEYS.STREAK_GOALS, {});
    return goals[userId] || 3;
  },

  setWeeklyStreakGoal(userId: string, daysPerWeek: number): number {
    const clamped = Math.min(7, Math.max(1, Math.round(daysPerWeek)));
    const goals = getStored<Record<string, number>>(STORAGE_KEYS.STREAK_GOALS, {});
    goals[userId] = clamped;
    setStored(STORAGE_KEYS.STREAK_GOALS, goals);
    return clamped;
  },

  getInterviewStreak(userId: string): InterviewStreakSummary {
    const pad = (n: number) => String(n).padStart(2, '0');
    const toLocalDateKey = (dt: Date) =>
      `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
    const shiftDateKey = (key: string, deltaDays: number) => {
      const [y, m, d] = key.split('-').map(Number);
      const utc = new Date(Date.UTC(y, m - 1, d + deltaDays));
      return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;
    };

    const completed = this.getUserSessions(userId).filter(s => s.status === 'Completed');
    const countsByDate: Record<string, number> = {};

    completed.forEach((sess) => {
      const raw = sess.endTime || sess.createdAt;
      const dt = new Date(raw);
      if (!Number.isNaN(dt.getTime())) {
        const key = toLocalDateKey(dt);
        countsByDate[key] = (countsByDate[key] || 0) + 1;
      }
    });

    const uniqueDates = Object.keys(countsByDate).sort();
    const dateSet = new Set(uniqueDates);
    const todayKey = toLocalDateKey(new Date());
    const yesterdayKey = shiftDateKey(todayKey, -1);

    // Longest streak across all unique practice dates
    let longestStreak = 0;
    let running = 0;
    let prevKey: string | null = null;
    for (const key of uniqueDates) {
      if (prevKey && shiftDateKey(prevKey, 1) === key) {
        running += 1;
      } else {
        running = 1;
      }
      if (running > longestStreak) longestStreak = running;
      prevKey = key;
    }

    // Current consecutive-day streak (active if practiced today or yesterday)
    let currentStreak = 0;
    if (dateSet.has(todayKey) || dateSet.has(yesterdayKey)) {
      let cursor = dateSet.has(todayKey) ? todayKey : yesterdayKey;
      while (dateSet.has(cursor)) {
        currentStreak += 1;
        cursor = shiftDateKey(cursor, -1);
      }
    }

    // Last 7 days calendar strip
    const weekdayFmt = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
    const days: InterviewStreakDay[] = [];
    for (let offset = -6; offset <= 0; offset++) {
      const key = shiftDateKey(todayKey, offset);
      const [y, m, d] = key.split('-').map(Number);
      const displayDate = new Date(y, m - 1, d);
      days.push({
        date: key,
        dayLabel: weekdayFmt.format(displayDate),
        dayNumber: String(d),
        isToday: offset === 0,
        completedCount: countsByDate[key] || 0
      });
    }

    const activeDaysLast7 = days.filter(d => d.completedCount > 0).length;
    const weeklyTargetDays = this.getWeeklyStreakGoal(userId);
    const lastPracticeDate = uniqueDates.length > 0 ? uniqueDates[uniqueDates.length - 1] : null;

    // Single-day freeze gaps bridged between two active practice dates
    const freezeDates: string[] = [];
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = uniqueDates[i - 1];
      const curr = uniqueDates[i];
      if (shiftDateKey(prev, 2) === curr) {
        freezeDates.push(shiftDateKey(prev, 1));
      }
    }

    return {
      currentStreak,
      longestStreak,
      completedToday: dateSet.has(todayKey),
      totalPracticeDays: uniqueDates.length,
      activeDaysLast7,
      weeklyTargetDays,
      lastPracticeDate,
      days,
      countsByDate,
      freezeDates
    };
  },

  // 10. UserFeedback
  getAllFeedback(): UserFeedback[] {
    return getStored<UserFeedback[]>(STORAGE_KEYS.FEEDBACK, INITIAL_FEEDBACKS);
  },

  getAppReviews(): UserFeedback[] {
    return this.getAllFeedback()
      .filter(f => f.isPublic && (f.feedbackType === 'app' || f.domain === 'Overall App'))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getReviewsForInterview(domain: string, title?: string): UserFeedback[] {
    const publicReviews = this.getAllFeedback().filter(
      f => f.isPublic && f.feedbackType !== 'app' && f.domain !== 'Overall App'
    );
    const normDomain = domain.trim().toLowerCase();
    const normTitle = title ? title.trim().toLowerCase() : '';

    const matching = publicReviews.filter(f => {
      const fbDomain = f.domain.trim().toLowerCase();
      const fbTopic = f.interviewTopic.trim().toLowerCase();
      return (
        fbDomain === normDomain ||
        (normTitle && fbTopic === normTitle) ||
        fbTopic.includes(normDomain)
      );
    });

    // Prioritize exact topic matches first, then most recent
    return matching.sort((a, b) => {
      const aExact = normTitle && a.interviewTopic.trim().toLowerCase() === normTitle ? 1 : 0;
      const bExact = normTitle && b.interviewTopic.trim().toLowerCase() === normTitle ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },

  getFeedbackBySessionId(sessionId: string): UserFeedback | undefined {
    return this.getAllFeedback().find(f => f.sessionId === sessionId);
  },

  submitFeedback(data: Omit<UserFeedback, 'feedbackId' | 'createdAt'>): UserFeedback {
    const list = this.getAllFeedback();
    if (data.feedbackType !== 'app') {
      const existingIdx = list.findIndex(
        f => f.sessionId === data.sessionId && f.userId === data.userId
      );

      if (existingIdx !== -1) {
        const updated: UserFeedback = {
          ...list[existingIdx],
          ...data,
          createdAt: new Date().toISOString()
        };
        list[existingIdx] = updated;
        setStored(STORAGE_KEYS.FEEDBACK, list);
        return updated;
      }
    }

    const newFeedback: UserFeedback = {
      ...data,
      feedbackId: `fb_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    list.unshift(newFeedback);
    setStored(STORAGE_KEYS.FEEDBACK, list);
    return newFeedback;
  },

  // 11. QuestionBank (Admin managed)
  getQuestionBank(): QuestionBankItem[] {
    return getStored<QuestionBankItem[]>(STORAGE_KEYS.QUESTION_BANK, INITIAL_QUESTION_BANK);
  },

  addQuestionToBank(item: Omit<QuestionBankItem, 'questionId'>): QuestionBankItem {
    const bank = this.getQuestionBank();
    const newItem: QuestionBankItem = {
      ...item,
      questionId: `qb_${Date.now()}`
    };
    bank.unshift(newItem);
    setStored(STORAGE_KEYS.QUESTION_BANK, bank);
    return newItem;
  },

  deleteQuestionFromBank(questionId: string): void {
    const bank = this.getQuestionBank().filter(q => q.questionId !== questionId);
    setStored(STORAGE_KEYS.QUESTION_BANK, bank);
  },

  // 12. Resume Builder
  getResume(userId: string): ResumeData {
    const resumes = getStored<Record<string, ResumeData>>(STORAGE_KEYS.RESUMES, { [DEFAULT_STUDENT_ID]: INITIAL_RESUME });
    if (resumes[userId]) return resumes[userId];

    const profile = this.getUserProfile(userId);
    const newResume: ResumeData = {
      ...INITIAL_RESUME,
      resumeId: `res_${userId}`,
      userId,
      personalInfo: {
        fullName: profile.name,
        email: profile.email,
        phone: '+1 (555) 019-2834',
        location: 'Bengaluru / Remote',
        portfolioUrl: 'https://hireboost.io',
        linkedinUrl: 'https://linkedin.com',
        githubUrl: 'https://github.com'
      },
      skills: [
        {
          category: 'Core Competencies',
          items: profile.skills.length > 0 ? profile.skills : ['Python', 'Data Structures', 'Web Development']
        }
      ],
      updatedAt: new Date().toISOString()
    };
    resumes[userId] = newResume;
    setStored(STORAGE_KEYS.RESUMES, resumes);
    return newResume;
  },

  saveResume(resume: ResumeData): ResumeData {
    const resumes = getStored<Record<string, ResumeData>>(STORAGE_KEYS.RESUMES, { [DEFAULT_STUDENT_ID]: INITIAL_RESUME });
    resume.updatedAt = new Date().toISOString();
    resumes[resume.userId] = resume;
    setStored(STORAGE_KEYS.RESUMES, resumes);
    return resume;
  }
};
