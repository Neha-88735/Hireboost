import { CareerTarget, DifficultyLevel } from '../types/hireboost';

export interface RoadmapMilestone {
  id: string;
  topic: string;
  subtopics: string;
  interviewTitle: string;
  interviewDomain: string;
  interviewDifficulty: DifficultyLevel;
  interviewDuration: number;
  samplePrompt: string;
}

export interface RoadmapPhase {
  stepNumber: string;
  title: string;
  shortLabel: string;
  subtitle: string;
  recommendedDomain: string;
  difficultyLabel: string;
  estimatedWeeks: string;
  interviewFocus: string;
  milestones: RoadmapMilestone[];
}

export interface RoleRoadmap {
  roleTitle: string;
  summary: string;
  phases: RoadmapPhase[];
}

const PRESET_ROADMAPS: Record<string, RoadmapPhase[]> = {
  'software development engineer': [
    {
      stepNumber: '01',
      title: 'Algorithmic Foundations & Language Fluency',
      shortLabel: 'DSA Foundations',
      subtitle: 'Master Big-O analysis, linear data structures, and clean implementation patterns.',
      recommendedDomain: 'Data Structures and Algorithms',
      difficultyLabel: 'Easy to Medium',
      estimatedWeeks: 'Weeks 1–2',
      interviewFocus: 'Interviewers test time/space complexity awareness, pointer manipulation, and clean brute-to-optimal reasoning.',
      milestones: [
        {
          id: 'sde_1_1',
          topic: 'Complexity Proofs & Asymptotic Analysis',
          subtopics: 'Big-O / Theta bounds, amortized cost, recursion stack memory.',
          interviewTitle: 'Time & Space Complexity Diagnostic Round',
          interviewDomain: 'Data Structures and Algorithms',
          interviewDifficulty: 'Easy',
          interviewDuration: 15,
          samplePrompt: 'Compare Array vs Linked List memory layout, cache locality, and lookup complexity.'
        },
        {
          id: 'sde_1_2',
          topic: 'Arrays, Two Pointers & Sliding Window',
          subtopics: 'Prefix sums, hash map frequency tables, fixed and dynamic windows.',
          interviewTitle: 'Linear Arrays & Sliding Window Coding Round',
          interviewDomain: 'Data Structures and Algorithms',
          interviewDifficulty: 'Easy',
          interviewDuration: 15,
          samplePrompt: 'Find the longest substring without repeating characters using a sliding window.'
        },
        {
          id: 'sde_1_3',
          topic: 'Linked Lists, Stacks & Monotonic Queues',
          subtopics: 'Fast/slow pointers, cycle detection, next-greater element stacks.',
          interviewTitle: 'Linked Structures & Stack Mechanics Round',
          interviewDomain: 'Data Structures and Algorithms',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Detect a cycle in a singly linked list in O(1) extra space and locate its entry node.'
        },
        {
          id: 'sde_1_4',
          topic: 'Core Programming Language Fluency',
          subtopics: 'Memory model, mutability, closures, and clean helper abstractions.',
          interviewTitle: 'Python Core & Memory Model Screening',
          interviewDomain: 'Python',
          interviewDifficulty: 'Easy',
          interviewDuration: 10,
          samplePrompt: 'Contrast mutable vs immutable objects and explain reference counting garbage collection.'
        }
      ]
    },
    {
      stepNumber: '02',
      title: 'Trees, Graphs & Dynamic Programming',
      shortLabel: 'Trees, Graphs & DP',
      subtitle: 'Build speed on non-linear traversals, state transitions, and optimization proofs.',
      recommendedDomain: 'Data Structures and Algorithms',
      difficultyLabel: 'Medium to Hard',
      estimatedWeeks: 'Weeks 3–4',
      interviewFocus: 'Focuses on recursive invariants, graph traversal trade-offs (BFS vs DFS), and converting recursion into memoized DP.',
      milestones: [
        {
          id: 'sde_2_1',
          topic: 'Binary Search Trees, Heaps & Tries',
          subtopics: 'BST range invariants, min/max heaps, top-K selection, prefix trees.',
          interviewTitle: 'Trees, Heaps & BST Validation Round',
          interviewDomain: 'Data Structures and Algorithms',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Validate whether a binary tree satisfies the BST property with O(H) space.'
        },
        {
          id: 'sde_2_2',
          topic: 'Graph Traversals & Shortest Paths',
          subtopics: 'BFS vs DFS, Kahn topological sort, Dijkstra, Union-Find.',
          interviewTitle: 'Graph Traversal & Dependency Ordering Round',
          interviewDomain: 'Data Structures and Algorithms',
          interviewDifficulty: 'Medium',
          interviewDuration: 20,
          samplePrompt: 'Detect cycles and compute a valid course build order in a directed graph.'
        },
        {
          id: 'sde_2_3',
          topic: 'Dynamic Programming & Memoization',
          subtopics: 'Overlapping subproblems, 1D/2D DP tables, space optimization.',
          interviewTitle: 'Dynamic Programming Optimization Round',
          interviewDomain: 'Data Structures and Algorithms',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'Contrast Dynamic Programming vs Divide & Conquer using knapsack state transitions.'
        },
        {
          id: 'sde_2_4',
          topic: 'Concurrency & Language Runtime Internals',
          subtopics: 'Threads vs processes, locks, async I/O, and memory profiling.',
          interviewTitle: 'Concurrency & Runtime Performance Round',
          interviewDomain: 'Python',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Explain the Python GIL and choose between threading and multiprocessing for CPU vs I/O tasks.'
        }
      ]
    },
    {
      stepNumber: '03',
      title: 'Software Design, Code Quality & Core Systems',
      shortLabel: 'Design & Systems',
      subtitle: 'Translate problem solving into modular architecture, APIs, and reliable code.',
      recommendedDomain: 'Software Engineering',
      difficultyLabel: 'Medium',
      estimatedWeeks: 'Weeks 5–6',
      interviewFocus: 'Evaluates API contract design, database indexing trade-offs, testing habits, and modular system thinking.',
      milestones: [
        {
          id: 'sde_3_1',
          topic: 'Object-Oriented Design & SOLID Principles',
          subtopics: 'Cohesion, coupling, interface segregation, extensible design patterns.',
          interviewTitle: 'OOP Architecture & SOLID Refactoring Round',
          interviewDomain: 'Software Engineering',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Apply SOLID principles to decouple a monolithic payment notification service.'
        },
        {
          id: 'sde_3_2',
          topic: 'REST APIs, Validation & Error Contracts',
          subtopics: 'Idempotency, pagination, rate limiting, and predictable status codes.',
          interviewTitle: 'API Design & Web Architecture Round',
          interviewDomain: 'Web Development',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Design a rate-limited REST API endpoint with cursor pagination and clear error schemas.'
        },
        {
          id: 'sde_3_3',
          topic: 'Database Indexing & Transactional Integrity',
          subtopics: 'B-Tree indexes, query plans, ACID guarantees, SQL vs NoSQL.',
          interviewTitle: 'Relational Data Modeling & Indexing Round',
          interviewDomain: 'Database Management Systems',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Explain how composite B-Tree indexes optimize WHERE and ORDER BY clauses.'
        },
        {
          id: 'sde_3_4',
          topic: 'Testing, Debugging & Production Scalability',
          subtopics: 'Unit/integration boundaries, caching invalidation, observability.',
          interviewTitle: 'Production Reliability & Caching Round',
          interviewDomain: 'Software Engineering',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'Compare write-through vs cache-aside invalidation under concurrent updates.'
        }
      ]
    },
    {
      stepNumber: '04',
      title: 'Behavioral Ownership & Final Loop Readiness',
      shortLabel: 'Behavioral & Loop',
      subtitle: 'Communicate project impact clearly using STAR storytelling and leadership framing.',
      recommendedDomain: 'HR Interview',
      difficultyLabel: 'Mixed',
      estimatedWeeks: 'Week 7+',
      interviewFocus: 'Checks ownership under pressure, constructive conflict resolution, and clear communication of real project impact.',
      milestones: [
        {
          id: 'sde_4_1',
          topic: 'STAR Conflict & Collaboration Stories',
          subtopics: 'Active listening, objective trade-off alignment, team velocity.',
          interviewTitle: 'Teamwork & Conflict Resolution Behavioral Round',
          interviewDomain: 'HR Interview',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Describe a technical disagreement with a teammate and how you resolved it constructively.'
        },
        {
          id: 'sde_4_2',
          topic: 'Flagship Project Architecture Walkthrough',
          subtopics: 'Bottleneck metrics, architectural decisions, lessons learned.',
          interviewTitle: 'Project Deep-Dive & Technical Ownership Round',
          interviewDomain: 'Behavioral Interview',
          interviewDifficulty: 'Medium',
          interviewDuration: 20,
          samplePrompt: 'Walk through the hardest bottleneck in your flagship project and how you measured the fix.'
        },
        {
          id: 'sde_4_3',
          topic: 'Ambiguity Handling & Career Trajectory',
          subtopics: 'Clarifying unclear specs, growth goals, company role fit.',
          interviewTitle: 'Culture Fit & Career Goals HR Round',
          interviewDomain: 'HR Interview',
          interviewDifficulty: 'Easy',
          interviewDuration: 15,
          samplePrompt: 'Where do you see your engineering impact growing over the next 3 to 5 years?'
        },
        {
          id: 'sde_4_4',
          topic: 'End-to-End Mixed Loop Simulation',
          subtopics: 'Switching cleanly between coding/design depth and concise behavioral answers.',
          interviewTitle: 'Full SDE Mixed Technical + HR Final Loop',
          interviewDomain: 'Data Structures and Algorithms',
          interviewDifficulty: 'Hard',
          interviewDuration: 25,
          samplePrompt: 'Solve a timed algorithmic problem followed by project trade-off follow-ups.'
        }
      ]
    }
  ],
  'dsa & algorithmic specialist': [
    {
      stepNumber: '01',
      title: 'Complexity & Linear Pattern Mastery',
      shortLabel: 'Linear Patterns',
      subtitle: 'Establish instant pattern recognition for arrays, strings, hashing, and search.',
      recommendedDomain: 'Data Structures and Algorithms',
      difficultyLabel: 'Easy',
      estimatedWeeks: 'Weeks 1–2',
      interviewFocus: 'Tests rapid identification of sliding window, binary search on answer space, and monotonic stack patterns.',
      milestones: [
        {
          id: 'dsa_1_1',
          topic: 'Prefix Sums, Sliding Windows & Monotonic Stacks',
          subtopics: 'Subarray sum hashing, shrinkable windows, O(N) next-greater spans.',
          interviewTitle: 'Sliding Window & Prefix Sum Screening',
          interviewDomain: 'Data Structures and Algorithms',
          interviewDifficulty: 'Easy',
          interviewDuration: 15,
          samplePrompt: 'Find the smallest subarray with sum >= target using an O(N) sliding window.'
        },
        {
          id: 'dsa_1_2',
          topic: 'Binary Search & Search on Answer Space',
          subtopics: 'Lower/upper bounds, rotated arrays, monotonic feasibility predicates.',
          interviewTitle: 'Binary Search Optimization Round',
          interviewDomain: 'Data Structures and Algorithms',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Use binary search on the answer space to minimize maximum allocation across partitions.'
        },
        {
          id: 'dsa_1_3',
          topic: 'Fast/Slow Pointers & In-Place List Reversal',
          subtopics: 'Cycle entry proof, K-group reversal, palindrome checks.',
          interviewTitle: 'Linked List Pointer Manipulation Round',
          interviewDomain: 'Data Structures and Algorithms',
          interviewDifficulty: 'Easy',
          interviewDuration: 15,
          samplePrompt: 'Reverse nodes in groups of K in O(1) auxiliary space.'
        },
        {
          id: 'dsa_1_4',
          topic: 'Hash Maps, Rolling Hashes & Bit Tricks',
          subtopics: 'Collision handling, Rabin-Karp string matching, XOR invariants.',
          interviewTitle: 'Hashing & String Matching Technical Round',
          interviewDomain: 'Data Structures and Algorithms',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Contrast hash map chaining vs open addressing under high load factors.'
        }
      ]
    },
    {
      stepNumber: '02',
      title: 'Hierarchical Structures & Backtracking',
      shortLabel: 'Trees & Recursion',
      subtitle: 'Solve recursive decomposition, tree traversals, and pruning problems cleanly.',
      recommendedDomain: 'Data Structures and Algorithms',
      difficultyLabel: 'Medium',
      estimatedWeeks: 'Weeks 3–4',
      interviewFocus: 'Evaluates recursion tree intuition, pruning bounds in backtracking, and heap-based K-selection.',
      milestones: [
        {
          id: 'dsa_2_1',
          topic: 'DFS/BFS Tree Traversals & Views',
          subtopics: 'Iterative stack traversals, level-order zigzag, vertical order.',
          interviewTitle: 'Binary Tree Traversal & Views Round',
          interviewDomain: 'Data Structures and Algorithms',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Compute the vertical order traversal of a binary tree without recursion overflow.'
        },
        {
          id: 'dsa_2_2',
          topic: 'Lowest Common Ancestor & Serialization',
          subtopics: 'Post-order LCA return values, BST bounds, preorder codec.',
          interviewTitle: 'LCA & Tree Serialization Round',
          interviewDomain: 'Data Structures and Algorithms',
          interviewDifficulty: 'Medium',
          interviewDuration: 20,
          samplePrompt: 'Serialize and deserialize a binary tree cleanly handling null branches.'
        },
        {
          id: 'dsa_2_3',
          topic: 'Backtracking & Pruning Search Trees',
          subtopics: 'Permutations, duplicate skipping, N-Queens, word search.',
          interviewTitle: 'Recursive Backtracking & Pruning Round',
          interviewDomain: 'Data Structures and Algorithms',
          interviewDifficulty: 'Medium',
          interviewDuration: 20,
          samplePrompt: 'Generate unique combination sums while pruning dead branches early.'
        },
        {
          id: 'dsa_2_4',
          topic: 'Priority Queues & Interval Scheduling',
          subtopics: 'Two-heap running median, merge K lists, sweep-line intervals.',
          interviewTitle: 'Heaps & Interval Sweep-Line Round',
          interviewDomain: 'Data Structures and Algorithms',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Merge K sorted streams using a min-heap and derive exact time complexity.'
        }
      ]
    },
    {
      stepNumber: '03',
      title: 'Graphs, Greedy Proofs & Dynamic Programming',
      shortLabel: 'Graphs & DP',
      subtitle: 'Tackle optimal substructure, network flows, and multi-dimensional state spaces.',
      recommendedDomain: 'Data Structures and Algorithms',
      difficultyLabel: 'Hard',
      estimatedWeeks: 'Weeks 5–6',
      interviewFocus: 'Focuses on state definition, DP space optimization, shortest-path variants, and Union-Find complexity.',
      milestones: [
        {
          id: 'dsa_3_1',
          topic: 'Shortest Paths, MST & Union-Find',
          subtopics: 'Dijkstra, Bellman-Ford, Kruskal MST, path-compressed DSU.',
          interviewTitle: 'Shortest Paths & Disjoint Sets Round',
          interviewDomain: 'Data Structures and Algorithms',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'Explain when Dijkstra fails and how Bellman-Ford handles negative edge weights.'
        },
        {
          id: 'dsa_3_2',
          topic: 'Knapsack, LIS & Edit Distance DP',
          subtopics: 'State transitions, rolling 1D array optimization, reconstruction.',
          interviewTitle: 'Classic 2D Dynamic Programming Round',
          interviewDomain: 'Data Structures and Algorithms',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'Optimize 2D knapsack DP down to a 1D rolling array without overwriting prior states.'
        },
        {
          id: 'dsa_3_3',
          topic: 'Greedy Exchange Proofs & Interval DP',
          subtopics: 'Activity selection correctness, burst balloons, matrix chain bounds.',
          interviewTitle: 'Greedy Proofs & Interval DP Round',
          interviewDomain: 'Data Structures and Algorithms',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'Prove why sorting by earliest end time yields optimal non-overlapping intervals.'
        },
        {
          id: 'dsa_3_4',
          topic: 'Tries & Range Query Trees',
          subtopics: 'Prefix autocomplete tries, Fenwick BIT, lazy segment trees.',
          interviewTitle: 'Tries & Range Query Structures Round',
          interviewDomain: 'Data Structures and Algorithms',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'Build an autocomplete dictionary with a Trie supporting top-K prefix suggestions.'
        }
      ]
    },
    {
      stepNumber: '04',
      title: 'Timed Communication & Stress Calibration',
      shortLabel: 'Timed Calibration',
      subtitle: 'Think aloud, test edge cases proactively, and optimize suboptimal solutions.',
      recommendedDomain: 'Data Structures and Algorithms',
      difficultyLabel: 'Hard',
      estimatedWeeks: 'Week 7+',
      interviewFocus: 'Simulates senior algorithmic bars: narrating brute-to-optimal pivots and dry-running tricky corner cases.',
      milestones: [
        {
          id: 'dsa_4_1',
          topic: 'Brute-to-Optimal Bottleneck Framing',
          subtopics: 'Identifying repeated work, trading memory for lookup speed.',
          interviewTitle: 'Optimization Storytelling Round',
          interviewDomain: 'Data Structures and Algorithms',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Walk through a brute-force solution and prove how you drop complexity from O(N^2) to O(N log N).'
        },
        {
          id: 'dsa_4_2',
          topic: 'Edge-Case Verification & Dry Runs',
          subtopics: 'Empty inputs, overflow, cycles, duplicate keys, off-by-one checks.',
          interviewTitle: 'Edge-Case & Code Verification Drill',
          interviewDomain: 'Data Structures and Algorithms',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Explain how you test integer overflow, empty inputs, and disconnected graphs.'
        },
        {
          id: 'dsa_4_3',
          topic: 'Rapid 15-Minute Speed Screening',
          subtopics: 'Zero-hint decomposition, concise complexity narration.',
          interviewTitle: 'Rapid DSA Technical Screening',
          interviewDomain: 'Data Structures and Algorithms',
          interviewDifficulty: 'Hard',
          interviewDuration: 15,
          samplePrompt: 'Solve an unfamiliar Hard problem aloud and defend every invariant.'
        },
        {
          id: 'dsa_4_4',
          topic: 'Behavioral Clarity Alongside Coding',
          subtopics: 'Staying composed under follow-up constraints and hints.',
          interviewTitle: 'Technical & Behavioral Calibration Round',
          interviewDomain: 'Behavioral Interview',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Describe receiving critical feedback on code clarity and how you adapted.'
        }
      ]
    }
  ],
  'full-stack web developer': [
    {
      stepNumber: '01',
      title: 'Modern Frontend, DOM & Browser Mechanics',
      shortLabel: 'Frontend & DOM',
      subtitle: 'Understand rendering pipelines, semantic HTML, accessibility, and core JS/TS.',
      recommendedDomain: 'Web Development',
      difficultyLabel: 'Easy to Medium',
      estimatedWeeks: 'Weeks 1–2',
      interviewFocus: 'Interviewers probe JS event loop microtasks, React re-render optimization, and browser layout performance.',
      milestones: [
        {
          id: 'fs_1_1',
          topic: 'JavaScript Event Loop & TypeScript',
          subtopics: 'Call stack, microtasks vs macrotasks, closures, discriminated unions.',
          interviewTitle: 'JS Runtime & Async Execution Round',
          interviewDomain: 'Web Development',
          interviewDifficulty: 'Easy',
          interviewDuration: 15,
          samplePrompt: 'Explain the JavaScript event loop ordering between Promises and setTimeout.'
        },
        {
          id: 'fs_1_2',
          topic: 'Critical Rendering Path & Core Web Vitals',
          subtopics: 'DOM/CSSOM tree, layout thrashing, LCP, INP, CLS optimization.',
          interviewTitle: 'Browser Performance & Rendering Round',
          interviewDomain: 'Web Development',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'What triggers browser reflow vs repaint, and how do you improve INP and LCP?'
        },
        {
          id: 'fs_1_3',
          topic: 'React Hooks, Reconciliation & State',
          subtopics: 'Fiber diffing, stale closures, effect cleanup, memoization limits.',
          interviewTitle: 'React Architecture & State Round',
          interviewDomain: 'Web Development',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'When do React useMemo and useCallback improve vs degrade render cost?'
        },
        {
          id: 'fs_1_4',
          topic: 'Semantic HTML & WCAG Accessibility',
          subtopics: 'Focus trapping, ARIA landmarks, keyboard controls, contrast ratios.',
          interviewTitle: 'Accessible Frontend Engineering Round',
          interviewDomain: 'Web Development',
          interviewDifficulty: 'Easy',
          interviewDuration: 10,
          samplePrompt: 'How do you make a custom modal dialog fully accessible to keyboard and screen-reader users?'
        }
      ]
    },
    {
      stepNumber: '02',
      title: 'APIs, Security & Network Boundaries',
      shortLabel: 'APIs & Security',
      subtitle: 'Master client-server communication, CORS, authentication, and caching.',
      recommendedDomain: 'Web Development',
      difficultyLabel: 'Medium',
      estimatedWeeks: 'Weeks 3–4',
      interviewFocus: 'Tests CORS preflight mechanics, auth token security (XSS/CSRF), and resilient HTTP/WebSocket patterns.',
      milestones: [
        {
          id: 'fs_2_1',
          topic: 'Same-Origin Policy, CORS & XSS/CSRF',
          subtopics: 'Preflight OPTIONS, CSP headers, escaping, SameSite cookies.',
          interviewTitle: 'Web Security & CORS Mechanics Round',
          interviewDomain: 'Web Development',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Explain CORS preflight OPTIONS requests and why browsers enforce Same-Origin Policy.'
        },
        {
          id: 'fs_2_2',
          topic: 'REST, GraphQL & Real-Time WebSockets',
          subtopics: 'Pagination, retries, SSE vs WebSockets, backpressure handling.',
          interviewTitle: 'API & Real-Time Communication Round',
          interviewDomain: 'Computer Networks',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Compare polling, Server-Sent Events, and WebSockets for live collaborative updates.'
        },
        {
          id: 'fs_2_3',
          topic: 'OAuth 2.0 & Session Security',
          subtopics: 'Authorization code + PKCE, JWT rotation, HttpOnly cookies.',
          interviewTitle: 'Authentication & Session Architecture Round',
          interviewDomain: 'Web Development',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Compare storing tokens in localStorage vs HttpOnly SameSite cookies.'
        },
        {
          id: 'fs_2_4',
          topic: 'HTTP Caching & Optimistic UI',
          subtopics: 'ETags, Cache-Control, stale-while-revalidate, rollback safety.',
          interviewTitle: 'Caching & Resilient UI Patterns Round',
          interviewDomain: 'Web Development',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Implement optimistic UI updates with safe rollback if the server request fails.'
        }
      ]
    },
    {
      stepNumber: '03',
      title: 'Databases, Persistence & System Engineering',
      shortLabel: 'Databases & Data',
      subtitle: 'Design resilient data layers and end-to-end full-stack architectures.',
      recommendedDomain: 'Database Management Systems',
      difficultyLabel: 'Medium to Hard',
      estimatedWeeks: 'Weeks 5–6',
      interviewFocus: 'Covers relational schema design, query indexing, ACID transactions, and safe production migrations.',
      milestones: [
        {
          id: 'fs_3_1',
          topic: 'SQL Normalization & B-Tree Indexes',
          subtopics: 'Joins, N+1 query fixes, EXPLAIN plans, covering indexes.',
          interviewTitle: 'Database Indexing & Query Tuning Round',
          interviewDomain: 'Database Management Systems',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'How do B-Tree indexes speed up reads and when do they slow down heavy writes?'
        },
        {
          id: 'fs_3_2',
          topic: 'ACID Transactions & SQL vs NoSQL',
          subtopics: 'Isolation levels, phantom reads, denormalization trade-offs.',
          interviewTitle: 'Transactions & Storage Trade-Offs Round',
          interviewDomain: 'Database Management Systems',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Explain ACID isolation levels and when eventual consistency is acceptable.'
        },
        {
          id: 'fs_3_3',
          topic: 'Error Boundaries, Logging & Testing',
          subtopics: 'Integration tests, E2E flows, structured telemetry.',
          interviewTitle: 'Testing & Production Observability Round',
          interviewDomain: 'Software Engineering',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'How do you structure unit, integration, and end-to-end tests for a full-stack app?'
        },
        {
          id: 'fs_3_4',
          topic: 'Zero-Downtime Migrations & CI/CD',
          subtopics: 'Expand-contract schema changes, feature flags, rollbacks.',
          interviewTitle: 'Deployment & Schema Evolution Round',
          interviewDomain: 'Software Engineering',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'Execute a zero-downtime column rename in production with active traffic.'
        }
      ]
    },
    {
      stepNumber: '04',
      title: 'Architecture Deep-Dive & Product Collaboration',
      shortLabel: 'Full-Stack Loop',
      subtitle: 'Defend real project trade-offs and collaborate seamlessly across product teams.',
      recommendedDomain: 'Software Engineering',
      difficultyLabel: 'Mixed',
      estimatedWeeks: 'Week 7+',
      interviewFocus: 'Assesses end-to-end system ownership, API/UI trade-off reasoning, and cross-functional collaboration.',
      milestones: [
        {
          id: 'fs_4_1',
          topic: 'End-to-End Feature Architecture Story',
          subtopics: 'Schema to UI state flow, latency measurements, bottlenecks.',
          interviewTitle: 'Full-Stack Project Deep-Dive Round',
          interviewDomain: 'Software Engineering',
          interviewDifficulty: 'Medium',
          interviewDuration: 20,
          samplePrompt: 'Walk through an end-to-end feature you shipped from database schema to UI state.'
        },
        {
          id: 'fs_4_2',
          topic: 'Bundle Size & Latency Optimization Case',
          subtopics: 'Code splitting, lazy loading, compression, server round-trips.',
          interviewTitle: 'Performance Optimization Case Study Round',
          interviewDomain: 'Web Development',
          interviewDifficulty: 'Hard',
          interviewDuration: 15,
          samplePrompt: 'How did you diagnose and reduce a real page-load or API latency bottleneck?'
        },
        {
          id: 'fs_4_3',
          topic: 'Cross-Functional Product Collaboration',
          subtopics: 'Working with designers/PMs, negotiating API contracts.',
          interviewTitle: 'Product Collaboration Behavioral Round',
          interviewDomain: 'Behavioral Interview',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Tell me about aligning with designers or backend teammates under a tight launch deadline.'
        },
        {
          id: 'fs_4_4',
          topic: 'Full-Stack Mixed Final Simulation',
          subtopics: 'Web architecture + database trade-offs + behavioral poise.',
          interviewTitle: 'Full-Stack Capstone Mock Interview',
          interviewDomain: 'Web Development',
          interviewDifficulty: 'Hard',
          interviewDuration: 25,
          samplePrompt: 'Architect a collaborative web dashboard including auth, live sync, and data persistence.'
        }
      ]
    }
  ],
  'python & backend engineer': [
    {
      stepNumber: '01',
      title: 'Python Internals & Clean Idiomatic Code',
      shortLabel: 'Python Internals',
      subtitle: 'Go beyond syntax into memory management, descriptors, generators, and typing.',
      recommendedDomain: 'Python',
      difficultyLabel: 'Easy to Medium',
      estimatedWeeks: 'Weeks 1–2',
      interviewFocus: 'Probes CPython GIL limits, decorators, generator memory savings, and mutable default argument pitfalls.',
      milestones: [
        {
          id: 'py_1_1',
          topic: 'Mutability, Reference Counting & Cyclic GC',
          subtopics: 'Shallow vs deep copy, mutable defaults, generational garbage collector.',
          interviewTitle: 'Python Memory & Object Model Round',
          interviewDomain: 'Python',
          interviewDifficulty: 'Easy',
          interviewDuration: 15,
          samplePrompt: 'Why are mutable default arguments dangerous in Python functions and how do you fix them?'
        },
        {
          id: 'py_1_2',
          topic: 'Decorators, Closures & Context Managers',
          subtopics: 'functools.wraps, __enter__/__exit__, resource cleanup.',
          interviewTitle: 'Python Decorators & Context Protocols Round',
          interviewDomain: 'Python',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Implement a retry decorator with exponential backoff preserving function metadata.'
        },
        {
          id: 'py_1_3',
          topic: 'Generators, Iterators & Streaming Data',
          subtopics: 'yield laziness, O(1) memory pipelines, itertools.',
          interviewTitle: 'Lazy Evaluation & Generators Round',
          interviewDomain: 'Python',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Contrast lists vs generators when processing multi-gigabyte log files.'
        },
        {
          id: 'py_1_4',
          topic: 'Python GIL, Threading, Multiprocessing & Asyncio',
          subtopics: 'CPython mutex behavior, event loops, CPU vs I/O concurrency.',
          interviewTitle: 'Python Concurrency & GIL Deep-Dive',
          interviewDomain: 'Python',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Explain the Python GIL and when to pick asyncio vs threading vs multiprocessing.'
        }
      ]
    },
    {
      stepNumber: '02',
      title: 'Databases, Indexing & Query Optimization',
      shortLabel: 'DB & Caching',
      subtitle: 'Build high-throughput storage layers with strong transactional guarantees.',
      recommendedDomain: 'Database Management Systems',
      difficultyLabel: 'Medium',
      estimatedWeeks: 'Weeks 3–4',
      interviewFocus: 'Evaluates EXPLAIN query tuning, composite index ordering, locking strategies, and idempotent writes.',
      milestones: [
        {
          id: 'py_2_1',
          topic: 'Composite & Covering Indexes + EXPLAIN',
          subtopics: 'Leftmost prefix rule, index-only scans, cardinality selectivity.',
          interviewTitle: 'SQL Indexing & Query Plan Optimization Round',
          interviewDomain: 'Database Management Systems',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Why does column order matter critically in a composite SQL index?'
        },
        {
          id: 'py_2_2',
          topic: 'ACID Isolation & Concurrency Locking',
          subtopics: 'Read committed, repeatable read, optimistic vs pessimistic locks.',
          interviewTitle: 'Transactions & Deadlock Prevention Round',
          interviewDomain: 'Database Management Systems',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Compare optimistic vs pessimistic locking under high write contention.'
        },
        {
          id: 'py_2_3',
          topic: 'Connection Pooling, Read Replicas & Redis',
          subtopics: 'Replication lag, cache stampedes, TTL jitter.',
          interviewTitle: 'Caching & Read Scaling Architecture Round',
          interviewDomain: 'Database Management Systems',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'How do you prevent cache stampedes when a hot Redis key expires?'
        },
        {
          id: 'py_2_4',
          topic: 'Idempotent Writes & Background Queues',
          subtopics: 'Idempotency keys, outbox pattern, dead-letter queues.',
          interviewTitle: 'Reliable Async Workers & Idempotency Round',
          interviewDomain: 'Software Engineering',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'Design an idempotent webhook ingestion worker with safe retries.'
        }
      ]
    },
    {
      stepNumber: '03',
      title: 'Operating Systems & Network Foundations',
      shortLabel: 'OS & Networks',
      subtitle: 'Understand processes, sockets, load balancing, and distributed reliability.',
      recommendedDomain: 'Operating Systems',
      difficultyLabel: 'Medium to Hard',
      estimatedWeeks: 'Weeks 5–6',
      interviewFocus: 'Tests concurrency synchronization primitives, virtual memory paging, and TCP/HTTP request lifecycles.',
      milestones: [
        {
          id: 'py_3_1',
          topic: 'Processes, Threads & Virtual Memory',
          subtopics: 'Page faults, copy-on-write fork, context switch overhead.',
          interviewTitle: 'OS Memory & Process Scheduling Round',
          interviewDomain: 'Operating Systems',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Contrast processes vs threads in memory isolation, context switching, and IPC.'
        },
        {
          id: 'py_3_2',
          topic: 'Mutexes, Semaphores & Deadlocks',
          subtopics: 'Coffman conditions, lock ordering, producer-consumer synchronization.',
          interviewTitle: 'Concurrency & Deadlock Synchronization Round',
          interviewDomain: 'Operating Systems',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Explain the four Coffman conditions for deadlock and practical prevention patterns.'
        },
        {
          id: 'py_3_3',
          topic: 'DNS, TCP, TLS & Load Balancing',
          subtopics: '3-way handshake, TLS termination, L4 vs L7 proxies.',
          interviewTitle: 'Networking & Request Lifecycle Round',
          interviewDomain: 'Computer Networks',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Trace an HTTPS request from DNS resolution and TCP handshake to load balancer routing.'
        },
        {
          id: 'py_3_4',
          topic: 'Health Checks & Graceful Shutdown',
          subtopics: 'SIGTERM draining, readiness vs liveness probes, backpressure.',
          interviewTitle: 'Service Lifecycle & Observability Round',
          interviewDomain: 'Operating Systems',
          interviewDifficulty: 'Hard',
          interviewDuration: 15,
          samplePrompt: 'How do you drain in-flight HTTP and worker connections cleanly during deployment?'
        }
      ]
    },
    {
      stepNumber: '04',
      title: 'Backend System Design & Production Scenarios',
      shortLabel: 'Backend Design',
      subtitle: 'Synthesize backend reliability, scaling bottlenecks, and debugging stories.',
      recommendedDomain: 'Computer Networks',
      difficultyLabel: 'Hard',
      estimatedWeeks: 'Week 7+',
      interviewFocus: 'Tests distributed rate limiting, latency debugging, CAP theorem trade-offs, and fault tolerance.',
      milestones: [
        {
          id: 'py_4_1',
          topic: 'Distributed Rate Limiting & Notification Design',
          subtopics: 'Token bucket, sliding window Redis Lua, fan-out queues.',
          interviewTitle: 'Distributed Rate Limiter System Design',
          interviewDomain: 'Computer Networks',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'Design a distributed sliding-window rate limiter across multiple stateless API instances.'
        },
        {
          id: 'py_4_2',
          topic: 'Diagnosing p99 Latency Spikes & Memory Leaks',
          subtopics: 'Flamegraphs, slow query logs, GC pauses, connection exhaustion.',
          interviewTitle: 'Production Debugging & Root Cause Round',
          interviewDomain: 'Software Engineering',
          interviewDifficulty: 'Hard',
          interviewDuration: 15,
          samplePrompt: 'How do you systematically isolate a sudden p99 latency spike in a Python API?'
        },
        {
          id: 'py_4_3',
          topic: 'CAP Theorem & Consistency Trade-Offs',
          subtopics: 'Strong vs eventual consistency, quorum reads, partition handling.',
          interviewTitle: 'Distributed Consistency & CAP Round',
          interviewDomain: 'Database Management Systems',
          interviewDifficulty: 'Hard',
          interviewDuration: 15,
          samplePrompt: 'Apply CAP theorem trade-offs to an inventory ledger vs a social notification feed.'
        },
        {
          id: 'py_4_4',
          topic: 'Backend Behavioral & Ownership Loop',
          subtopics: 'Incident response stories, mentoring, technical leadership.',
          interviewTitle: 'Backend Engineering Behavioral Round',
          interviewDomain: 'HR Interview',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Describe a production outage or critical bug you owned from detection through postmortem.'
        }
      ]
    }
  ],
  'ai / machine learning engineer': [
    {
      stepNumber: '01',
      title: 'Python Data Pipelines & Algorithmic Coding',
      shortLabel: 'Python & Math',
      subtitle: 'Solidify vectorized computation, data structures, and clean experiment code.',
      recommendedDomain: 'Python',
      difficultyLabel: 'Easy to Medium',
      estimatedWeeks: 'Weeks 1–2',
      interviewFocus: 'Checks data-leakage-free preprocessing, algorithmic coding speed, and vectorized Python efficiency.',
      milestones: [
        {
          id: 'ml_1_1',
          topic: 'Streaming Python Data Pipelines',
          subtopics: 'Generators, vectorization, memory-mapped batches, clean OOP loaders.',
          interviewTitle: 'Python Data Pipeline Efficiency Round',
          interviewDomain: 'Python',
          interviewDifficulty: 'Easy',
          interviewDuration: 15,
          samplePrompt: 'Use Python generators to stream and batch a 50GB dataset in constant RAM.'
        },
        {
          id: 'ml_1_2',
          topic: 'Data Leakage & Cross-Validation Hygiene',
          subtopics: 'Train/val/test isolation, time-series splits, scaling fit scope.',
          interviewTitle: 'ML Data Hygiene & Splitting Round',
          interviewDomain: 'Machine Learning',
          interviewDifficulty: 'Easy',
          interviewDuration: 15,
          samplePrompt: 'Why must feature scaling and target encoding fit strictly on training folds?'
        },
        {
          id: 'ml_1_3',
          topic: 'Algorithmic Coding for ML Engineers',
          subtopics: 'Sliding windows, trees, graphs, dynamic programming in Python.',
          interviewTitle: 'ML Coding & DSA Screening',
          interviewDomain: 'Data Structures and Algorithms',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Solve a graph traversal or top-K similarity problem cleanly in Python.'
        },
        {
          id: 'ml_1_4',
          topic: 'Probability, Linear Algebra & Gradients',
          subtopics: 'Bayes rule, matrix rank, eigenvalues, chain rule differentiation.',
          interviewTitle: 'ML Math Foundations Screening',
          interviewDomain: 'Machine Learning',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Derive the gradient update for logistic regression and interpret step stability.'
        }
      ]
    },
    {
      stepNumber: '02',
      title: 'Classical ML Theory & Evaluation Rigor',
      shortLabel: 'ML Theory',
      subtitle: 'Master bias-variance trade-offs, regularization, and metric selection.',
      recommendedDomain: 'Machine Learning',
      difficultyLabel: 'Medium',
      estimatedWeeks: 'Weeks 3–4',
      interviewFocus: 'Evaluates metric choice under class imbalance, L1 vs L2 sparsity, and tree boosting internals.',
      milestones: [
        {
          id: 'ml_2_1',
          topic: 'Linear Models, SVMs & Boosted Trees',
          subtopics: 'Bagging vs boosting, XGBoost residuals, kernel margins.',
          interviewTitle: 'Classical ML Algorithms Round',
          interviewDomain: 'Machine Learning',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Compare Random Forests vs Gradient Boosted Trees on bias, variance, and noise sensitivity.'
        },
        {
          id: 'ml_2_2',
          topic: 'Regularization & Overfitting Control',
          subtopics: 'L1 sparsity geometry, L2 weight shrinkage, early stopping.',
          interviewTitle: 'Regularization & Generalization Round',
          interviewDomain: 'Machine Learning',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Explain geometrically why L1 regularization produces sparse weights compared to L2.'
        },
        {
          id: 'ml_2_3',
          topic: 'Imbalanced Metrics & Calibration',
          subtopics: 'PR-AUC vs ROC-AUC, F-beta, log-loss calibration, threshold tuning.',
          interviewTitle: 'Model Evaluation & Metric Selection Round',
          interviewDomain: 'Machine Learning',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'When is Precision-Recall AUC far more informative than ROC-AUC?'
        },
        {
          id: 'ml_2_4',
          topic: 'Clustering & Dimensionality Reduction',
          subtopics: 'K-Means initialization, PCA variance explained, UMAP trade-offs.',
          interviewTitle: 'Unsupervised Learning & PCA Round',
          interviewDomain: 'Machine Learning',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'How does PCA choose orthogonal components and when can scaling alter results?'
        }
      ]
    },
    {
      stepNumber: '03',
      title: 'Deep Learning, Transformers & Applied AI',
      shortLabel: 'Deep Learning & AI',
      subtitle: 'Explain neural architectures, LLM workflows, retrieval, and fine-tuning.',
      recommendedDomain: 'Artificial Intelligence',
      difficultyLabel: 'Medium to Hard',
      estimatedWeeks: 'Weeks 5–6',
      interviewFocus: 'Probes self-attention scaling, RAG retrieval quality vs latency, and hallucination mitigation.',
      milestones: [
        {
          id: 'ml_3_1',
          topic: 'Backprop, Normalization & Optimizers',
          subtopics: 'Vanishing gradients, LayerNorm vs BatchNorm, AdamW momentum.',
          interviewTitle: 'Deep Learning Training Dynamics Round',
          interviewDomain: 'Artificial Intelligence',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Compare BatchNorm vs LayerNorm and explain why Transformers prefer LayerNorm.'
        },
        {
          id: 'ml_3_2',
          topic: 'Transformers & Self-Attention Scaling',
          subtopics: 'Q/K/V projections, sqrt(d_k) scaling, positional encodings, KV cache.',
          interviewTitle: 'Transformer Architecture Deep-Dive',
          interviewDomain: 'Artificial Intelligence',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'Explain scaled dot-product self-attention and why we divide by sqrt(d_k).'
        },
        {
          id: 'ml_3_3',
          topic: 'RAG Pipelines, Embeddings & Grounding',
          subtopics: 'Chunking, hybrid BM25 + vector search, reranking, faithfulness evals.',
          interviewTitle: 'RAG & LLM Evaluation Architecture Round',
          interviewDomain: 'Artificial Intelligence',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'How do you evaluate retrieval recall vs generation faithfulness in a RAG system?'
        },
        {
          id: 'ml_3_4',
          topic: 'Prompting vs Fine-Tuning & Serving Latency',
          subtopics: 'LoRA/QLoRA, quantization, dynamic batching, cost-latency budgets.',
          interviewTitle: 'LLM Adaptation & Model Serving Round',
          interviewDomain: 'Artificial Intelligence',
          interviewDifficulty: 'Hard',
          interviewDuration: 15,
          samplePrompt: 'When should a team choose structured prompting + RAG over LoRA fine-tuning?'
        }
      ]
    },
    {
      stepNumber: '04',
      title: 'ML System Design & Research Communication',
      shortLabel: 'ML Systems',
      subtitle: 'Walk through end-to-end production AI pipelines and model failure analyses.',
      recommendedDomain: 'Artificial Intelligence',
      difficultyLabel: 'Hard',
      estimatedWeeks: 'Week 7+',
      interviewFocus: 'Simulates senior ML design: cold-start handling, online A/B metrics, and drift detection.',
      milestones: [
        {
          id: 'ml_4_1',
          topic: 'Two-Stage Retrieval & Ranking Systems',
          subtopics: 'Candidate generation, feature store, lightweight ranker, cold start.',
          interviewTitle: 'Recommendation & Ranking ML System Design',
          interviewDomain: 'Artificial Intelligence',
          interviewDifficulty: 'Hard',
          interviewDuration: 25,
          samplePrompt: 'Design a two-stage retrieval and ranking architecture for personalized recommendations.'
        },
        {
          id: 'ml_4_2',
          topic: 'Data Drift & Online A/B Guardrails',
          subtopics: 'Covariate vs concept shift, shadow deployments, guardrail metrics.',
          interviewTitle: 'Production ML Monitoring & Drift Round',
          interviewDomain: 'Machine Learning',
          interviewDifficulty: 'Hard',
          interviewDuration: 15,
          samplePrompt: 'How do you detect covariate shift vs concept drift before online metrics degrade?'
        },
        {
          id: 'ml_4_3',
          topic: 'Experiment Failure & Diagnostic Storytelling',
          subtopics: 'Hypothesis debugging, ablation lessons, communicating uncertainty.',
          interviewTitle: 'Applied ML Project Walkthrough Round',
          interviewDomain: 'Behavioral Interview',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Explain an ML experiment that failed offline or online and what diagnostic uncovered the flaw.'
        },
        {
          id: 'ml_4_4',
          topic: 'Full AI/ML Capstone Mock Loop',
          subtopics: 'Theory + applied LLM/ML design + behavioral ownership.',
          interviewTitle: 'Full AI/ML Engineer Final Mock Loop',
          interviewDomain: 'Artificial Intelligence',
          interviewDifficulty: 'Hard',
          interviewDuration: 25,
          samplePrompt: 'Architect an end-to-end semantic search assistant with strict latency and accuracy SLAs.'
        }
      ]
    }
  ],
  'hr & leadership readiness': [
    {
      stepNumber: '01',
      title: 'Personal Narrative & Role Motivation',
      shortLabel: 'Core Narrative',
      subtitle: 'Craft a compelling, concise career arc tailored to company values.',
      recommendedDomain: 'HR Interview',
      difficultyLabel: 'Easy',
      estimatedWeeks: 'Week 1',
      interviewFocus: 'Assesses clarity of career motivation, self-awareness, and alignment with role expectations.',
      milestones: [
        {
          id: 'hr_1_1',
          topic: '60-Second Career Pitch',
          subtopics: 'Present, past highlights, why this role/team next.',
          interviewTitle: 'Personal Introduction & Pitch Screening',
          interviewDomain: 'HR Interview',
          interviewDifficulty: 'Easy',
          interviewDuration: 10,
          samplePrompt: 'Walk me through your background in 60 seconds and why this role fits next.'
        },
        {
          id: 'hr_1_2',
          topic: 'Evidence-Backed Core Strengths',
          subtopics: 'Connecting strengths directly to concrete engineering deliverables.',
          interviewTitle: 'Strengths & Impact Articulation Round',
          interviewDomain: 'HR Interview',
          interviewDifficulty: 'Easy',
          interviewDuration: 10,
          samplePrompt: 'What is your strongest engineering habit and how has a team benefited from it?'
        },
        {
          id: 'hr_1_3',
          topic: 'Growth-Oriented Weakness Framing',
          subtopics: 'Honest reflection paired with concrete systems/steps taken.',
          interviewTitle: 'Self-Awareness & Growth Mindset Round',
          interviewDomain: 'HR Interview',
          interviewDifficulty: 'Easy',
          interviewDuration: 10,
          samplePrompt: 'Tell me about a skill gap you identified recently and how you actively closed it.'
        },
        {
          id: 'hr_1_4',
          topic: '3–5 Year Role & Culture Alignment',
          subtopics: 'Matching personal learning trajectory with company mission.',
          interviewTitle: 'Culture Fit & Long-Term Goals Round',
          interviewDomain: 'HR Interview',
          interviewDifficulty: 'Easy',
          interviewDuration: 15,
          samplePrompt: 'Where do you see yourself growing professionally over the next 3 to 5 years?'
        }
      ]
    },
    {
      stepNumber: '02',
      title: 'STAR Storytelling Bank',
      shortLabel: 'STAR Stories',
      subtitle: 'Build versatile stories covering ownership, teamwork, failure, and delivery.',
      recommendedDomain: 'Behavioral Interview',
      difficultyLabel: 'Medium',
      estimatedWeeks: 'Weeks 2–3',
      interviewFocus: 'Looks for concrete personal actions ("I" vs "we") and measurable outcomes under real constraints.',
      milestones: [
        {
          id: 'hr_2_1',
          topic: 'Constructive Conflict Resolution',
          subtopics: 'Disagreeing respectfully with benchmarks, empathy, and shared goals.',
          interviewTitle: 'Team Conflict & Alignment Behavioral Round',
          interviewDomain: 'Behavioral Interview',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Describe a disagreement with a teammate or manager and how you reached consensus.'
        },
        {
          id: 'hr_2_2',
          topic: 'Handling Mistakes & Missed Milestones',
          subtopics: 'Accountability without blame, root-cause fixes, process prevention.',
          interviewTitle: 'Accountability & Recovery Behavioral Round',
          interviewDomain: 'Behavioral Interview',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Tell me about a mistake or missed deadline and what changed permanently afterward.'
        },
        {
          id: 'hr_2_3',
          topic: 'Ownership Beyond Assigned Scope',
          subtopics: 'Spotting gaps proactively, shipping fixes without waiting to be asked.',
          interviewTitle: 'Proactive Ownership Behavioral Round',
          interviewDomain: 'Behavioral Interview',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Share a project where you took initiative well beyond your assigned scope.'
        },
        {
          id: 'hr_2_4',
          topic: 'Quantifying Impact With Hard Metrics',
          subtopics: 'Latency drops, adoption numbers, error reductions, time saved.',
          interviewTitle: 'Outcome-Driven STAR Calibration Round',
          interviewDomain: 'HR Interview',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Describe your proudest deliverable and quantify its measurable impact.'
        }
      ]
    },
    {
      stepNumber: '03',
      title: 'Leadership, Ambiguity & Cross-Team Influence',
      shortLabel: 'Leadership & Scope',
      subtitle: 'Demonstrate maturity in mentoring, prioritization, and stakeholder alignment.',
      recommendedDomain: 'Behavioral Interview',
      difficultyLabel: 'Medium to Hard',
      estimatedWeeks: 'Weeks 4–5',
      interviewFocus: 'Evaluates decision-making without full information and cross-functional persuasion.',
      milestones: [
        {
          id: 'hr_3_1',
          topic: 'Influencing Without Formal Authority',
          subtopics: 'Data-backed RFCs, aligning competing team priorities.',
          interviewTitle: 'Cross-Team Influence Behavioral Round',
          interviewDomain: 'Behavioral Interview',
          interviewDifficulty: 'Hard',
          interviewDuration: 15,
          samplePrompt: 'Tell me about driving consensus when two teams had conflicting priorities.'
        },
        {
          id: 'hr_3_2',
          topic: 'Navigating Ambiguous Requirements',
          subtopics: 'Prototyping, stakeholder discovery, defining MVP scope.',
          interviewTitle: 'Ambiguity & Problem Scoping Round',
          interviewDomain: 'Behavioral Interview',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'How did you turn an open-ended, ambiguous request into a shipped deliverable?'
        },
        {
          id: 'hr_3_3',
          topic: 'Mentorship & Constructive Feedback',
          subtopics: 'Code review kindness + rigor, unblocking peers.',
          interviewTitle: 'Mentoring & Bar-Raising Round',
          interviewDomain: 'Behavioral Interview',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Describe mentoring a teammate or giving tough feedback constructively.'
        },
        {
          id: 'hr_3_4',
          topic: 'Quality vs Deadline Prioritization',
          subtopics: 'Technical debt trade-offs, risk communication to leadership.',
          interviewTitle: 'Engineering Trade-Off & Priority Round',
          interviewDomain: 'Behavioral Interview',
          interviewDifficulty: 'Hard',
          interviewDuration: 15,
          samplePrompt: 'Tell me about cutting scope or managing tech debt to hit a critical launch.'
        }
      ]
    },
    {
      stepNumber: '04',
      title: 'Executive Presence & Mock Calibration',
      shortLabel: 'Vocal Polish',
      subtitle: 'Refine pacing, vocal confidence, and thoughtful closing questions.',
      recommendedDomain: 'HR Interview',
      difficultyLabel: 'Mixed',
      estimatedWeeks: 'Week 6+',
      interviewFocus: 'Refines crisp 2-minute delivery, poise under probing follow-ups, and thoughtful reverse questions.',
      milestones: [
        {
          id: 'hr_4_1',
          topic: 'Concise 2-Minute Delivery & Pacing',
          subtopics: 'Cutting rambling setup, leading with headline result.',
          interviewTitle: 'Concise Communication Pacing Drill',
          interviewDomain: 'HR Interview',
          interviewDifficulty: 'Medium',
          interviewDuration: 10,
          samplePrompt: 'Summarize your proudest technical impact clearly in under 90 seconds.'
        },
        {
          id: 'hr_4_2',
          topic: 'Handling Sharp Follow-Up Probes',
          subtopics: 'Staying calm when challenged on edge cases or hindsight.',
          interviewTitle: 'Stress & Follow-Up Calibration Round',
          interviewDomain: 'Behavioral Interview',
          interviewDifficulty: 'Hard',
          interviewDuration: 15,
          samplePrompt: 'Defend a past design choice while honestly explaining what you would change today.'
        },
        {
          id: 'hr_4_3',
          topic: 'High-Signal Reverse Questions',
          subtopics: 'Tailored questions on team culture, engineering rigor, roadmap.',
          interviewTitle: 'Hiring Manager Alignment Simulation',
          interviewDomain: 'HR Interview',
          interviewDifficulty: 'Easy',
          interviewDuration: 15,
          samplePrompt: 'Present three thoughtful questions you would ask an engineering manager.'
        },
        {
          id: 'hr_4_4',
          topic: 'Full Behavioral + HR Voice Loop',
          subtopics: 'End-to-end spoken presence and leadership consistency.',
          interviewTitle: 'Final HR & Leadership Capstone Round',
          interviewDomain: 'Behavioral Interview',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'Complete a multi-question leadership and culture fit voice evaluation.'
        }
      ]
    }
  ],
  'python': [
    {
      stepNumber: '01',
      title: 'Python Basics & Data Structures',
      shortLabel: 'Python Core',
      subtitle: 'Master built-in types, memory references, and clean Pythonic code.',
      recommendedDomain: 'Python',
      difficultyLabel: 'Easy',
      estimatedWeeks: 'Weeks 1–2',
      interviewFocus: 'Covers lists, dicts, sets, mutability, and reference counting.',
      milestones: [
        {
          id: 'py_lang_1_1',
          topic: 'Variables, Memory & Mutability',
          subtopics: 'Lists vs tuples, mutable defaults, reference counting & garbage collection.',
          interviewTitle: 'Python Data Types & Memory Round',
          interviewDomain: 'Python',
          interviewDifficulty: 'Easy',
          interviewDuration: 15,
          samplePrompt: 'Contrast mutable vs immutable objects and explain why mutable default arguments cause bugs.'
        },
        {
          id: 'py_lang_1_2',
          topic: 'Dicts, Sets & Comprehensions',
          subtopics: 'Hash lookups, set operations, clean list and dict comprehensions.',
          interviewTitle: 'Python Collections & Idioms Round',
          interviewDomain: 'Python',
          interviewDifficulty: 'Easy',
          interviewDuration: 15,
          samplePrompt: 'Explain how Python dictionaries handle hash collisions and when to prefer sets over lists.'
        },
        {
          id: 'py_lang_1_3',
          topic: 'Strings, Slicing & Iteration',
          subtopics: 'Slicing, enumerate, zip, string joining, clean loops.',
          interviewTitle: 'Python Iteration & Slicing Round',
          interviewDomain: 'Python',
          interviewDifficulty: 'Easy',
          interviewDuration: 10,
          samplePrompt: 'Why is str.join() faster than repeated + concatenation inside a loop?'
        }
      ]
    },
    {
      stepNumber: '02',
      title: 'Functions, Decorators & OOP',
      shortLabel: 'Functions & OOP',
      subtitle: 'Write reusable decorators, lazy generators, and clean classes.',
      recommendedDomain: 'Python',
      difficultyLabel: 'Medium',
      estimatedWeeks: 'Weeks 3–4',
      interviewFocus: 'Tests closures, decorators, yield generators, and Python class design.',
      milestones: [
        {
          id: 'py_lang_2_1',
          topic: 'Closures, *args/**kwargs & Decorators',
          subtopics: 'First-class functions, wrapping logic, functools.wraps.',
          interviewTitle: 'Python Decorators & Closures Round',
          interviewDomain: 'Python',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Write a timing decorator that preserves function metadata using functools.wraps.'
        },
        {
          id: 'py_lang_2_2',
          topic: 'Generators, Yield & Lazy Iterators',
          subtopics: 'Memory-efficient streaming, yield vs return, generator expressions.',
          interviewTitle: 'Python Generators & Iterators Round',
          interviewDomain: 'Python',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Compare returning a list vs yielding items from a generator when reading huge files.'
        },
        {
          id: 'py_lang_2_3',
          topic: 'Classes, Dunder Methods & Dataclasses',
          subtopics: '__init__, __repr__, inheritance, MRO, dataclasses, ABCs.',
          interviewTitle: 'Python OOP Design Round',
          interviewDomain: 'Python',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Explain Python method resolution order (MRO) and when to use @dataclass.'
        }
      ]
    },
    {
      stepNumber: '03',
      title: 'Concurrency, Async & Testing',
      shortLabel: 'Async & Testing',
      subtitle: 'Handle concurrent tasks safely and write reliable tests.',
      recommendedDomain: 'Python',
      difficultyLabel: 'Medium to Hard',
      estimatedWeeks: 'Weeks 5–6',
      interviewFocus: 'Evaluates GIL trade-offs, asyncio, context managers, and pytest.',
      milestones: [
        {
          id: 'py_lang_3_1',
          topic: 'GIL, Threading vs Multiprocessing',
          subtopics: 'CPU-bound vs I/O-bound work, pools, race conditions.',
          interviewTitle: 'Python GIL & Concurrency Round',
          interviewDomain: 'Python',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'Explain the Python GIL and choose between threading, multiprocessing, and asyncio.'
        },
        {
          id: 'py_lang_3_2',
          topic: 'Asyncio & Non-Blocking I/O',
          subtopics: 'async/await, event loop, asyncio.gather concurrency.',
          interviewTitle: 'Python Asyncio Patterns Round',
          interviewDomain: 'Python',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'How does the asyncio event loop run thousands of I/O tasks on one thread?'
        },
        {
          id: 'py_lang_3_3',
          topic: 'Exceptions, Context Managers & Pytest',
          subtopics: 'with blocks, custom exceptions, pytest fixtures and mocks.',
          interviewTitle: 'Python Testing & Error Handling Round',
          interviewDomain: 'Python',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Implement a custom context manager using __enter__/__exit__ or @contextmanager.'
        }
      ]
    },
    {
      stepNumber: '04',
      title: 'APIs, Typing & Performance',
      shortLabel: 'Applied Python',
      subtitle: 'Ship fast, typed, production-ready Python applications.',
      recommendedDomain: 'Python',
      difficultyLabel: 'Hard',
      estimatedWeeks: 'Week 7+',
      interviewFocus: 'Focuses on type safety, backend frameworks, and profiling bottlenecks.',
      milestones: [
        {
          id: 'py_lang_4_1',
          topic: 'Type Hints, Virtual Envs & Packaging',
          subtopics: 'typing, mypy checks, venv, pyproject.toml structure.',
          interviewTitle: 'Python Typing & Packaging Round',
          interviewDomain: 'Python',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'How do type hints and tools like mypy improve large Python codebases?'
        },
        {
          id: 'py_lang_4_2',
          topic: 'FastAPI / Flask Web Services',
          subtopics: 'Request validation, Pydantic schemas, dependency injection.',
          interviewTitle: 'Python Web API Design Round',
          interviewDomain: 'Python',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'Design a FastAPI service with Pydantic validation and async database calls.'
        },
        {
          id: 'py_lang_4_3',
          topic: 'Profiling & Memory Optimization',
          subtopics: 'cProfile, __slots__, lru_cache memoization, avoiding copies.',
          interviewTitle: 'Python Performance Capstone Round',
          interviewDomain: 'Python',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'How do __slots__ and functools.lru_cache reduce memory and runtime overhead?'
        }
      ]
    }
  ],
  'c++': [
    {
      stepNumber: '01',
      title: 'Pointers, References & Memory',
      shortLabel: 'C++ Core',
      subtitle: 'Build confidence with stack/heap memory, pointers, and value semantics.',
      recommendedDomain: 'C++',
      difficultyLabel: 'Easy',
      estimatedWeeks: 'Weeks 1–2',
      interviewFocus: 'Tests pointers vs references, const correctness, and memory layout.',
      milestones: [
        {
          id: 'cpp_lang_1_1',
          topic: 'Pointers, References & Stack vs Heap',
          subtopics: 'Memory addresses, pass-by-reference, dangling pointers.',
          interviewTitle: 'C++ Pointers & Memory Basics Round',
          interviewDomain: 'C++',
          interviewDifficulty: 'Easy',
          interviewDuration: 15,
          samplePrompt: 'Compare pointers vs references in C++ and explain when each is safer.'
        },
        {
          id: 'cpp_lang_1_2',
          topic: 'RAII & Smart Pointers',
          subtopics: 'unique_ptr, shared_ptr, weak_ptr, deterministic cleanup.',
          interviewTitle: 'C++ RAII & Smart Pointers Round',
          interviewDomain: 'C++',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'How does RAII prevent memory leaks and how does weak_ptr break reference cycles?'
        }
      ]
    },
    {
      stepNumber: '02',
      title: 'STL Containers & Algorithms',
      shortLabel: 'STL Mastery',
      subtitle: 'Pick the right STL container and write fast generic code.',
      recommendedDomain: 'C++',
      difficultyLabel: 'Medium',
      estimatedWeeks: 'Weeks 3–4',
      interviewFocus: 'Covers vector, unordered_map, iterators, and complexity guarantees.',
      milestones: [
        {
          id: 'cpp_lang_2_1',
          topic: 'Vectors, Maps & Iterator Invalidation',
          subtopics: 'vector capacity growth, map vs unordered_map, iterator safety.',
          interviewTitle: 'C++ STL Containers Round',
          interviewDomain: 'C++',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'When does inserting into a std::vector invalidate existing iterators?'
        },
        {
          id: 'cpp_lang_2_2',
          topic: 'Lambdas, Templates & Algorithms',
          subtopics: 'std::sort, capture lists, compile-time type deduction.',
          interviewTitle: 'C++ Templates & Lambdas Round',
          interviewDomain: 'C++',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Explain value vs reference captures in C++ lambda expressions.'
        }
      ]
    },
    {
      stepNumber: '03',
      title: 'OOP, Virtual Tables & Move Semantics',
      shortLabel: 'OOP & Moves',
      subtitle: 'Understand polymorphism internals and zero-copy move semantics.',
      recommendedDomain: 'C++',
      difficultyLabel: 'Hard',
      estimatedWeeks: 'Weeks 5–6',
      interviewFocus: 'Tests vtables, virtual destructors, and rvalue move semantics.',
      milestones: [
        {
          id: 'cpp_lang_3_1',
          topic: 'Virtual Functions & Vtable Dispatch',
          subtopics: 'Runtime polymorphism, virtual destructors, slicing.',
          interviewTitle: 'C++ OOP & Virtual Table Round',
          interviewDomain: 'C++',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'Why must base class destructors be virtual when deleting derived objects?'
        },
        {
          id: 'cpp_lang_3_2',
          topic: 'Move Semantics & Rule of Five',
          subtopics: 'Lvalues vs rvalues, std::move, copy vs move constructors.',
          interviewTitle: 'C++ Move Semantics Round',
          interviewDomain: 'C++',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'How do move constructors eliminate expensive deep copies?'
        }
      ]
    },
    {
      stepNumber: '04',
      title: 'Concurrency & Low-Latency Systems',
      shortLabel: 'C++ Systems',
      subtitle: 'Write lock-safe multi-threaded C++ and avoid UB.',
      recommendedDomain: 'C++',
      difficultyLabel: 'Hard',
      estimatedWeeks: 'Week 7+',
      interviewFocus: 'Checks mutexes, atomics, deadlock avoidance, and cache-friendly code.',
      milestones: [
        {
          id: 'cpp_lang_4_1',
          topic: 'Threads, Mutexes & Atomics',
          subtopics: 'std::thread, lock_guard, condition_variable, race freedom.',
          interviewTitle: 'C++ Concurrency & Thread Safety Round',
          interviewDomain: 'C++',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'Compare std::mutex with std::atomic and explain lock_guard vs unique_lock.'
        }
      ]
    }
  ],
  'java': [
    {
      stepNumber: '01',
      title: 'Core Java & JVM Internals',
      shortLabel: 'Java & JVM',
      subtitle: 'Understand Java types, memory areas, and garbage collection.',
      recommendedDomain: 'Java',
      difficultyLabel: 'Easy',
      estimatedWeeks: 'Weeks 1–2',
      interviewFocus: 'Covers OOP basics, Strings, JVM heap/stack, and GC cycles.',
      milestones: [
        {
          id: 'java_lang_1_1',
          topic: 'Strings, Primitives & Immutability',
          subtopics: 'String pool, equals vs ==, StringBuilder, final keyword.',
          interviewTitle: 'Java Core & Strings Round',
          interviewDomain: 'Java',
          interviewDifficulty: 'Easy',
          interviewDuration: 15,
          samplePrompt: 'Why are Java Strings immutable and how does the String pool save memory?'
        },
        {
          id: 'java_lang_1_2',
          topic: 'JVM Memory & Garbage Collection',
          subtopics: 'Heap generations, stack frames, G1GC basics.',
          interviewTitle: 'JVM & Garbage Collection Round',
          interviewDomain: 'Java',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Explain how JVM heap generations and garbage collection work.'
        }
      ]
    },
    {
      stepNumber: '02',
      title: 'Collections, Generics & Hashing',
      shortLabel: 'Collections',
      subtitle: 'Use Lists, Maps, Sets, and hashCode/equals contracts properly.',
      recommendedDomain: 'Java',
      difficultyLabel: 'Medium',
      estimatedWeeks: 'Weeks 3–4',
      interviewFocus: 'Tests HashMap internals, Comparable vs Comparator, and generics.',
      milestones: [
        {
          id: 'java_lang_2_1',
          topic: 'HashMap, TreeMap & hashCode/equals',
          subtopics: 'Bucket collisions, treeification, contract rules.',
          interviewTitle: 'Java Collections & HashMap Round',
          interviewDomain: 'Java',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Walk through how Java HashMap handles collisions and why equals() needs hashCode().'
        }
      ]
    },
    {
      stepNumber: '03',
      title: 'Streams, Lambdas & Exceptions',
      shortLabel: 'Modern Java',
      subtitle: 'Write clean functional pipelines with Streams and Optionals.',
      recommendedDomain: 'Java',
      difficultyLabel: 'Medium',
      estimatedWeeks: 'Weeks 5–6',
      interviewFocus: 'Evaluates Stream pipelines, Optional safety, and checked exceptions.',
      milestones: [
        {
          id: 'java_lang_3_1',
          topic: 'Streams, Optional & Functional Interfaces',
          subtopics: 'map/filter/reduce, lazy evaluation, avoiding null checks.',
          interviewTitle: 'Java Streams & Lambdas Round',
          interviewDomain: 'Java',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'How do intermediate vs terminal Stream operations enable lazy evaluation?'
        }
      ]
    },
    {
      stepNumber: '04',
      title: 'Multithreading & Spring Backend',
      shortLabel: 'Concurrency',
      subtitle: 'Build thread-safe concurrent services and Spring Boot APIs.',
      recommendedDomain: 'Java',
      difficultyLabel: 'Hard',
      estimatedWeeks: 'Week 7+',
      interviewFocus: 'Covers synchronized, ConcurrentHashMap, ExecutorService, and Spring DI.',
      milestones: [
        {
          id: 'java_lang_4_1',
          topic: 'Executors, Locks & ConcurrentHashMap',
          subtopics: 'volatile, synchronized, CompletableFuture, thread pools.',
          interviewTitle: 'Java Multithreading & Spring Capstone',
          interviewDomain: 'Java',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'Compare synchronized blocks, volatile variables, and ConcurrentHashMap.'
        }
      ]
    }
  ],
  'database management systems': [
    {
      stepNumber: '01',
      title: 'Relational Modeling & SQL Basics',
      shortLabel: 'Schema & SQL',
      subtitle: 'Design clean tables with keys, joins, and normalization.',
      recommendedDomain: 'Database Management Systems',
      difficultyLabel: 'Easy',
      estimatedWeeks: 'Weeks 1–2',
      interviewFocus: 'Covers primary/foreign keys, 1NF–BCNF normalization, and SQL joins.',
      milestones: [
        {
          id: 'dbms_sub_1_1',
          topic: 'Keys, Joins & Normalization (1NF–BCNF)',
          subtopics: 'Reducing redundancy, foreign keys, inner vs outer joins.',
          interviewTitle: 'Schema Design & Normalization Round',
          interviewDomain: 'Database Management Systems',
          interviewDifficulty: 'Easy',
          interviewDuration: 15,
          samplePrompt: 'Explain 1NF, 2NF, 3NF, and when denormalization makes sense.'
        },
        {
          id: 'dbms_sub_1_2',
          topic: 'SQL Aggregations & Subqueries',
          subtopics: 'GROUP BY, HAVING, window functions, CTEs.',
          interviewTitle: 'SQL Query Writing Round',
          interviewDomain: 'Database Management Systems',
          interviewDifficulty: 'Easy',
          interviewDuration: 15,
          samplePrompt: 'Compare WHERE vs HAVING and rank top rows per group with window functions.'
        }
      ]
    },
    {
      stepNumber: '02',
      title: 'Indexing & Query Tuning',
      shortLabel: 'Indexes & Tuning',
      subtitle: 'Speed up slow queries using indexes and execution plans.',
      recommendedDomain: 'Database Management Systems',
      difficultyLabel: 'Medium',
      estimatedWeeks: 'Weeks 3–4',
      interviewFocus: 'Tests B-Tree indexes, composite keys, and EXPLAIN plans.',
      milestones: [
        {
          id: 'dbms_sub_2_1',
          topic: 'B-Tree vs Hash Indexes & EXPLAIN',
          subtopics: 'Composite index column order, full table scans, write overhead.',
          interviewTitle: 'B-Tree Indexing & Query Plan Round',
          interviewDomain: 'Database Management Systems',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'How does a composite B-Tree index on (a, b) help queries and hurt writes?'
        },
        {
          id: 'dbms_sub_2_2',
          topic: 'Fixing N+1 & Slow Joins',
          subtopics: 'Batching queries, covering indexes, pagination strategies.',
          interviewTitle: 'Query Optimization Round',
          interviewDomain: 'Database Management Systems',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'How do you find and fix an N+1 query bottleneck in production?'
        }
      ]
    },
    {
      stepNumber: '03',
      title: 'Transactions, ACID & Locks',
      shortLabel: 'ACID & Isolation',
      subtitle: 'Keep data consistent when many users read and write at once.',
      recommendedDomain: 'Database Management Systems',
      difficultyLabel: 'Hard',
      estimatedWeeks: 'Weeks 5–6',
      interviewFocus: 'Covers ACID properties, isolation levels, MVCC, and deadlocks.',
      milestones: [
        {
          id: 'dbms_sub_3_1',
          topic: 'ACID Guarantees & Isolation Levels',
          subtopics: 'Dirty reads, phantom reads, Read Committed vs Serializable, MVCC.',
          interviewTitle: 'Transactions & Isolation Round',
          interviewDomain: 'Database Management Systems',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'Explain ACID properties and compare Read Committed vs Repeatable Read.'
        },
        {
          id: 'dbms_sub_3_2',
          topic: 'Deadlocks & Optimistic vs Pessimistic Locking',
          subtopics: 'Row locks, version columns, deadlock detection.',
          interviewTitle: 'Database Concurrency & Locking Round',
          interviewDomain: 'Database Management Systems',
          interviewDifficulty: 'Hard',
          interviewDuration: 15,
          samplePrompt: 'When should you use optimistic locking instead of row-level locks?'
        }
      ]
    },
    {
      stepNumber: '04',
      title: 'Scaling, Sharding & NoSQL',
      shortLabel: 'Scale & NoSQL',
      subtitle: 'Scale databases across servers with replication and sharding.',
      recommendedDomain: 'Database Management Systems',
      difficultyLabel: 'Hard',
      estimatedWeeks: 'Week 7+',
      interviewFocus: 'Tests read replicas, sharding keys, CAP theorem, and SQL vs NoSQL.',
      milestones: [
        {
          id: 'dbms_sub_4_1',
          topic: 'Replication, Sharding & SQL vs NoSQL',
          subtopics: 'Read replicas, shard key trade-offs, CAP theorem.',
          interviewTitle: 'Distributed Database Scaling Round',
          interviewDomain: 'Database Management Systems',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'Compare vertical scaling, read replicas, and horizontal sharding trade-offs.'
        }
      ]
    }
  ],
  'operating systems': [
    {
      stepNumber: '01',
      title: 'Processes, Threads & Context Switching',
      shortLabel: 'Processes',
      subtitle: 'Learn how the OS runs programs and shares CPU cores.',
      recommendedDomain: 'Operating Systems',
      difficultyLabel: 'Easy',
      estimatedWeeks: 'Weeks 1–2',
      interviewFocus: 'Covers process vs thread memory, PCBs, and context switch cost.',
      milestones: [
        {
          id: 'os_sub_1_1',
          topic: 'Processes vs Threads & Memory Layout',
          subtopics: 'Address space isolation, stack vs heap, context switching.',
          interviewTitle: 'Processes & Threads Fundamentals Round',
          interviewDomain: 'Operating Systems',
          interviewDifficulty: 'Easy',
          interviewDuration: 15,
          samplePrompt: 'Compare processes and threads in memory sharing, isolation, and switch cost.'
        },
        {
          id: 'os_sub_1_2',
          topic: 'System Calls & Kernel vs User Mode',
          subtopics: 'Privilege rings, traps, I/O interrupts.',
          interviewTitle: 'System Calls & Kernel Mode Round',
          interviewDomain: 'Operating Systems',
          interviewDifficulty: 'Easy',
          interviewDuration: 15,
          samplePrompt: 'What happens inside the CPU when an app makes a read() system call?'
        }
      ]
    },
    {
      stepNumber: '02',
      title: 'CPU Scheduling & Deadlocks',
      shortLabel: 'Scheduling',
      subtitle: 'Schedule tasks fairly and prevent threads from freezing.',
      recommendedDomain: 'Operating Systems',
      difficultyLabel: 'Medium',
      estimatedWeeks: 'Weeks 3–4',
      interviewFocus: 'Tests scheduling algorithms and Coffman deadlock conditions.',
      milestones: [
        {
          id: 'os_sub_2_1',
          topic: 'CPU Scheduling & Starvation',
          subtopics: 'Round Robin, SJF, priority inversion, multi-level queues.',
          interviewTitle: 'CPU Scheduling Trade-Offs Round',
          interviewDomain: 'Operating Systems',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Compare Round Robin and Shortest Job First on latency and starvation.'
        },
        {
          id: 'os_sub_2_2',
          topic: 'Deadlock Conditions & Prevention',
          subtopics: 'Mutual exclusion, hold & wait, circular wait, lock ordering.',
          interviewTitle: 'Deadlock Prevention & Recovery Round',
          interviewDomain: 'Operating Systems',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'List the 4 conditions for a deadlock and how strict lock ordering prevents it.'
        }
      ]
    },
    {
      stepNumber: '03',
      title: 'Synchronization & Concurrency',
      shortLabel: 'Sync & Locks',
      subtitle: 'Coordinate shared resources safely without race conditions.',
      recommendedDomain: 'Operating Systems',
      difficultyLabel: 'Medium to Hard',
      estimatedWeeks: 'Weeks 5–6',
      interviewFocus: 'Covers mutexes, semaphores, condition variables, and spinlocks.',
      milestones: [
        {
          id: 'os_sub_3_1',
          topic: 'Mutexes, Semaphores & Producer-Consumer',
          subtopics: 'Critical sections, race conditions, busy waiting vs blocking.',
          interviewTitle: 'Mutex & Semaphore Synchronization Round',
          interviewDomain: 'Operating Systems',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Contrast a mutex with a counting semaphore using a producer-consumer example.'
        }
      ]
    },
    {
      stepNumber: '04',
      title: 'Virtual Memory, Paging & File Systems',
      shortLabel: 'Memory & I/O',
      subtitle: 'Understand virtual addresses, page faults, and disk caching.',
      recommendedDomain: 'Operating Systems',
      difficultyLabel: 'Hard',
      estimatedWeeks: 'Week 7+',
      interviewFocus: 'Tests page tables, TLB caching, thrashing, and page replacement.',
      milestones: [
        {
          id: 'os_sub_4_1',
          topic: 'Virtual Memory, TLB & Page Replacement',
          subtopics: 'Paging, TLB misses, LRU replacement, thrashing.',
          interviewTitle: 'Virtual Memory & Paging Capstone',
          interviewDomain: 'Operating Systems',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'Walk through address translation using the TLB and what causes a page fault.'
        }
      ]
    }
  ],
  'computer networks': [
    {
      stepNumber: '01',
      title: 'OSI Model, IP & Subnets',
      shortLabel: 'OSI & IP',
      subtitle: 'Understand how packets move from app layer to physical wire.',
      recommendedDomain: 'Computer Networks',
      difficultyLabel: 'Easy',
      estimatedWeeks: 'Weeks 1–2',
      interviewFocus: 'Covers OSI/TCP-IP layers, IPv4 vs IPv6, CIDR, and NAT.',
      milestones: [
        {
          id: 'cn_sub_1_1',
          topic: 'OSI Layers, IP Addressing & Subnetting',
          subtopics: 'Layer responsibilities, CIDR masks, NAT.',
          interviewTitle: 'Network Layers & IP Basics Round',
          interviewDomain: 'Computer Networks',
          interviewDifficulty: 'Easy',
          interviewDuration: 15,
          samplePrompt: 'Trace a packet through the TCP/IP layers and explain why NAT is needed.'
        }
      ]
    },
    {
      stepNumber: '02',
      title: 'TCP, UDP & Flow Control',
      shortLabel: 'TCP & UDP',
      subtitle: 'Compare reliable streams with fast low-latency packets.',
      recommendedDomain: 'Computer Networks',
      difficultyLabel: 'Medium',
      estimatedWeeks: 'Weeks 3–4',
      interviewFocus: 'Tests 3-way handshake, congestion control, and TCP vs UDP.',
      milestones: [
        {
          id: 'cn_sub_2_1',
          topic: 'TCP Handshake, Congestion & UDP',
          subtopics: 'SYN/SYN-ACK/ACK, sliding window, congestion vs flow control.',
          interviewTitle: 'TCP vs UDP & Handshake Round',
          interviewDomain: 'Computer Networks',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Walk through the TCP 3-way handshake and when UDP is preferred over TCP.'
        }
      ]
    },
    {
      stepNumber: '03',
      title: 'DNS, HTTP/HTTPS & TLS',
      shortLabel: 'HTTP & TLS',
      subtitle: 'Trace every step from typing a URL to secure HTTPS responses.',
      recommendedDomain: 'Computer Networks',
      difficultyLabel: 'Medium',
      estimatedWeeks: 'Weeks 5–6',
      interviewFocus: 'Covers DNS lookup, TLS handshake, HTTP/2, and HTTP/3.',
      milestones: [
        {
          id: 'cn_sub_3_1',
          topic: 'DNS Lookup & TLS Encryption Handshake',
          subtopics: 'Recursive DNS, asymmetric + symmetric keys, certificates.',
          interviewTitle: 'Browser-to-Server DNS & HTTPS Round',
          interviewDomain: 'Computer Networks',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Explain what happens step by step when you open https://example.com.'
        }
      ]
    },
    {
      stepNumber: '04',
      title: 'Load Balancers, CDNs & WebSockets',
      shortLabel: 'Scale & Real-Time',
      subtitle: 'Route traffic reliably at scale with low latency.',
      recommendedDomain: 'Computer Networks',
      difficultyLabel: 'Hard',
      estimatedWeeks: 'Week 7+',
      interviewFocus: 'Tests L4 vs L7 load balancing, CDN caching, and WebSockets.',
      milestones: [
        {
          id: 'cn_sub_4_1',
          topic: 'Load Balancing, CDNs & Long Connections',
          subtopics: 'L4 vs L7 proxies, health checks, WebSockets vs SSE.',
          interviewTitle: 'Load Balancing & Real-Time Network Round',
          interviewDomain: 'Computer Networks',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'Compare Layer 4 and Layer 7 load balancing and explain when to use WebSockets.'
        }
      ]
    }
  ],
  'web development': [
    {
      stepNumber: '01',
      title: 'HTML, CSS, DOM & Browser Basics',
      shortLabel: 'Web Core',
      subtitle: 'Understand semantic markup, layout engines, and browser rendering.',
      recommendedDomain: 'Web Development',
      difficultyLabel: 'Easy',
      estimatedWeeks: 'Weeks 1–2',
      interviewFocus: 'Covers DOM events, event bubbling, Flexbox/Grid, and event loop.',
      milestones: [
        {
          id: 'web_sub_1_1',
          topic: 'DOM, Event Bubbling & JS Event Loop',
          subtopics: 'Delegation, microtasks vs macrotasks, async/await.',
          interviewTitle: 'Browser DOM & Event Loop Round',
          interviewDomain: 'Web Development',
          interviewDifficulty: 'Easy',
          interviewDuration: 15,
          samplePrompt: 'Explain event delegation and how the JavaScript event loop schedules Promises.'
        }
      ]
    },
    {
      stepNumber: '02',
      title: 'React Architecture & State',
      shortLabel: 'React & State',
      subtitle: 'Build fast, predictable component trees with clean state flow.',
      recommendedDomain: 'Web Development',
      difficultyLabel: 'Medium',
      estimatedWeeks: 'Weeks 3–4',
      interviewFocus: 'Tests reconciliation, hooks, memoization, and state lifting.',
      milestones: [
        {
          id: 'web_sub_2_1',
          topic: 'Hooks, Re-renders & State Management',
          subtopics: 'useEffect dependencies, keys, avoiding prop drilling.',
          interviewTitle: 'React Hooks & Rendering Round',
          interviewDomain: 'Web Development',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Why do list items need stable keys and how do you prevent unnecessary re-renders?'
        }
      ]
    },
    {
      stepNumber: '03',
      title: 'APIs, Auth & Web Security',
      shortLabel: 'APIs & Security',
      subtitle: 'Secure user sessions, cookies, CORS, and backend endpoints.',
      recommendedDomain: 'Web Development',
      difficultyLabel: 'Medium to Hard',
      estimatedWeeks: 'Weeks 5–6',
      interviewFocus: 'Covers CORS, XSS/CSRF defense, JWT vs cookies, REST vs GraphQL.',
      milestones: [
        {
          id: 'web_sub_3_1',
          topic: 'CORS, Cookies, Auth & XSS/CSRF',
          subtopics: 'Same-origin policy, HttpOnly cookies, sanitization.',
          interviewTitle: 'Web Auth, CORS & Security Round',
          interviewDomain: 'Web Development',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Explain CORS preflight requests and how HttpOnly cookies protect auth tokens.'
        }
      ]
    },
    {
      stepNumber: '04',
      title: 'Web Vitals & Frontend Performance',
      shortLabel: 'Performance',
      subtitle: 'Optimize page load speed, caching, and responsiveness.',
      recommendedDomain: 'Web Development',
      difficultyLabel: 'Hard',
      estimatedWeeks: 'Week 7+',
      interviewFocus: 'Tests LCP/CLS/INP metrics, code splitting, and HTTP caching.',
      milestones: [
        {
          id: 'web_sub_4_1',
          topic: 'Core Web Vitals, Bundling & Caching',
          subtopics: 'Lazy loading, Cache-Control, SSR vs CSR trade-offs.',
          interviewTitle: 'Web Performance & Caching Capstone',
          interviewDomain: 'Web Development',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'How would you diagnose and improve a slow Largest Contentful Paint (LCP)?'
        }
      ]
    }
  ],
  'artificial intelligence': [
    {
      stepNumber: '01',
      title: 'Search, Agents & AI Foundations',
      shortLabel: 'AI Core',
      subtitle: 'Learn search heuristics, reasoning loops, and agent basics.',
      recommendedDomain: 'Artificial Intelligence',
      difficultyLabel: 'Easy',
      estimatedWeeks: 'Weeks 1–2',
      interviewFocus: 'Covers informed search, heuristics, and foundational AI concepts.',
      milestones: [
        {
          id: 'ai_sub_1_1',
          topic: 'Heuristic Search & Decision Trees',
          subtopics: 'A* search, admissible heuristics, planning trade-offs.',
          interviewTitle: 'Search Heuristics & AI Basics Round',
          interviewDomain: 'Artificial Intelligence',
          interviewDifficulty: 'Easy',
          interviewDuration: 15,
          samplePrompt: 'Explain how A* uses heuristics and what makes a heuristic admissible.'
        }
      ]
    },
    {
      stepNumber: '02',
      title: 'LLM Prompting & Context Engineering',
      shortLabel: 'Prompting',
      subtitle: 'Design reliable prompts, structured outputs, and tool calling.',
      recommendedDomain: 'Artificial Intelligence',
      difficultyLabel: 'Medium',
      estimatedWeeks: 'Weeks 3–4',
      interviewFocus: 'Tests few-shot prompting, JSON schemas, and hallucination reduction.',
      milestones: [
        {
          id: 'ai_sub_2_1',
          topic: 'Structured Outputs & Tool Calling',
          subtopics: 'Few-shot examples, schemas, temperature vs determinism.',
          interviewTitle: 'LLM Prompting & Tool Design Round',
          interviewDomain: 'Artificial Intelligence',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'How do you make LLM outputs reliable and schema-valid in production?'
        }
      ]
    },
    {
      stepNumber: '03',
      title: 'RAG Pipelines & Vector Search',
      shortLabel: 'RAG Systems',
      subtitle: 'Ground answers in real documents with embeddings and retrieval.',
      recommendedDomain: 'Artificial Intelligence',
      difficultyLabel: 'Medium to Hard',
      estimatedWeeks: 'Weeks 5–6',
      interviewFocus: 'Covers chunking, embeddings, hybrid search, and reranking.',
      milestones: [
        {
          id: 'ai_sub_3_1',
          topic: 'Chunking, Embeddings & Reranking',
          subtopics: 'Dense vs sparse retrieval, chunk size trade-offs, citations.',
          interviewTitle: 'RAG Architecture & Retrieval Round',
          interviewDomain: 'Artificial Intelligence',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'Design a RAG pipeline and explain how you would fix poor retrieval recall.'
        }
      ]
    },
    {
      stepNumber: '04',
      title: 'AI Evaluation, Safety & Latency',
      shortLabel: 'Eval & Safety',
      subtitle: 'Measure AI quality, guardrails, and cost at scale.',
      recommendedDomain: 'Artificial Intelligence',
      difficultyLabel: 'Hard',
      estimatedWeeks: 'Week 7+',
      interviewFocus: 'Tests offline evals, prompt injection defense, and latency budgets.',
      milestones: [
        {
          id: 'ai_sub_4_1',
          topic: 'Evaluation Metrics & Guardrails',
          subtopics: 'Groundedness checks, prompt injection defense, token caching.',
          interviewTitle: 'AI Safety & Evaluation Capstone',
          interviewDomain: 'Artificial Intelligence',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'How do you evaluate an AI assistant before shipping prompt or model changes?'
        }
      ]
    }
  ],
  'machine learning': [
    {
      stepNumber: '01',
      title: 'Supervised vs Unsupervised Basics',
      shortLabel: 'ML Core',
      subtitle: 'Understand core ML algorithms, loss functions, and features.',
      recommendedDomain: 'Machine Learning',
      difficultyLabel: 'Easy',
      estimatedWeeks: 'Weeks 1–2',
      interviewFocus: 'Covers regression, classification, clustering, and feature scaling.',
      milestones: [
        {
          id: 'ml_sub_1_1',
          topic: 'Regression, Trees & Clustering',
          subtopics: 'Linear vs tree models, k-means, feature scaling.',
          interviewTitle: 'ML Fundamentals & Algorithms Round',
          interviewDomain: 'Machine Learning',
          interviewDifficulty: 'Easy',
          interviewDuration: 15,
          samplePrompt: 'Compare linear models vs decision trees when features have different scales.'
        }
      ]
    },
    {
      stepNumber: '02',
      title: 'Bias-Variance & Regularization',
      shortLabel: 'Generalization',
      subtitle: 'Stop overfitting with regularization and clean validation splits.',
      recommendedDomain: 'Machine Learning',
      difficultyLabel: 'Medium',
      estimatedWeeks: 'Weeks 3–4',
      interviewFocus: 'Tests bias-variance trade-off, L1/L2, cross-validation, and leakage.',
      milestones: [
        {
          id: 'ml_sub_2_1',
          topic: 'Overfitting, L1/L2 & Data Leakage',
          subtopics: 'k-fold validation, Ridge vs Lasso, train/test contamination.',
          interviewTitle: 'Bias-Variance & Validation Round',
          interviewDomain: 'Machine Learning',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Explain the bias-variance trade-off and how L1 vs L2 regularization helps.'
        }
      ]
    },
    {
      stepNumber: '03',
      title: 'Metrics, Imbalance & Ensembles',
      shortLabel: 'Metrics & Boost',
      subtitle: 'Pick the right metrics and boost accuracy with ensembles.',
      recommendedDomain: 'Machine Learning',
      difficultyLabel: 'Medium to Hard',
      estimatedWeeks: 'Weeks 5–6',
      interviewFocus: 'Covers Precision/Recall/ROC-AUC, class imbalance, bagging vs boosting.',
      milestones: [
        {
          id: 'ml_sub_3_1',
          topic: 'Precision-Recall, AUC & Gradient Boosting',
          subtopics: 'Imbalanced datasets, Random Forest vs XGBoost.',
          interviewTitle: 'ML Metrics & Ensembles Round',
          interviewDomain: 'Machine Learning',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'Why is accuracy misleading on imbalanced data and how do bagging and boosting differ?'
        }
      ]
    },
    {
      stepNumber: '04',
      title: 'Model Serving, Drift & Monitoring',
      shortLabel: 'ML Production',
      subtitle: 'Deploy models cleanly and catch data drift early.',
      recommendedDomain: 'Machine Learning',
      difficultyLabel: 'Hard',
      estimatedWeeks: 'Week 7+',
      interviewFocus: 'Tests batch vs real-time serving, data drift, and retraining loops.',
      milestones: [
        {
          id: 'ml_sub_4_1',
          topic: 'Serving Latency & Data Drift Monitoring',
          subtopics: 'Batch vs online inference, feature stores, drift alerts.',
          interviewTitle: 'Production ML Systems Capstone',
          interviewDomain: 'Machine Learning',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'How do you detect feature drift and decide when to retrain a live model?'
        }
      ]
    }
  ],
  'software engineering': [
    {
      stepNumber: '01',
      title: 'Clean Code & OOP Principles',
      shortLabel: 'OOP & SOLID',
      subtitle: 'Write modular, easy-to-change code with clear boundaries.',
      recommendedDomain: 'Software Engineering',
      difficultyLabel: 'Easy',
      estimatedWeeks: 'Weeks 1–2',
      interviewFocus: 'Covers SOLID principles, cohesion, coupling, and clean abstractions.',
      milestones: [
        {
          id: 'swe_sub_1_1',
          topic: 'SOLID Principles & Modular Design',
          subtopics: 'Single responsibility, dependency inversion, readable interfaces.',
          interviewTitle: 'Clean Code & SOLID Round',
          interviewDomain: 'Software Engineering',
          interviewDifficulty: 'Easy',
          interviewDuration: 15,
          samplePrompt: 'Explain Dependency Inversion with a real service refactoring example.'
        }
      ]
    },
    {
      stepNumber: '02',
      title: 'Design Patterns & API Contracts',
      shortLabel: 'Patterns & APIs',
      subtitle: 'Design clean APIs, pagination, idempotency, and error schemas.',
      recommendedDomain: 'Software Engineering',
      difficultyLabel: 'Medium',
      estimatedWeeks: 'Weeks 3–4',
      interviewFocus: 'Tests API versioning, idempotency keys, and common design patterns.',
      milestones: [
        {
          id: 'swe_sub_2_1',
          topic: 'REST Contracts, Idempotency & Patterns',
          subtopics: 'Retry safety, factory/strategy patterns, error handling.',
          interviewTitle: 'API Design & Patterns Round',
          interviewDomain: 'Software Engineering',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'How do idempotency keys make payment or booking APIs safe to retry?'
        }
      ]
    },
    {
      stepNumber: '03',
      title: 'Testing, CI/CD & Code Reviews',
      shortLabel: 'Testing & CI',
      subtitle: 'Catch bugs early with unit, integration, and automated checks.',
      recommendedDomain: 'Software Engineering',
      difficultyLabel: 'Medium',
      estimatedWeeks: 'Weeks 5–6',
      interviewFocus: 'Covers test pyramid, mocking boundaries, and safe rollouts.',
      milestones: [
        {
          id: 'swe_sub_3_1',
          topic: 'Testing Pyramid & Safe Deployments',
          subtopics: 'Unit vs integration tests, feature flags, rollback plans.',
          interviewTitle: 'Testing & Release Engineering Round',
          interviewDomain: 'Software Engineering',
          interviewDifficulty: 'Medium',
          interviewDuration: 15,
          samplePrompt: 'How do you balance fast unit tests with reliable integration tests in CI?'
        }
      ]
    },
    {
      stepNumber: '04',
      title: 'Scalability, Caching & Reliability',
      shortLabel: 'System Design',
      subtitle: 'Design fault-tolerant systems with caching, queues, and rate limits.',
      recommendedDomain: 'Software Engineering',
      difficultyLabel: 'Hard',
      estimatedWeeks: 'Week 7+',
      interviewFocus: 'Tests caching patterns, async queues, rate limiting, and observability.',
      milestones: [
        {
          id: 'swe_sub_4_1',
          topic: 'Caching, Queues & Rate Limiting',
          subtopics: 'Cache-aside invalidation, backpressure, structured logging.',
          interviewTitle: 'Scalable Systems Design Capstone',
          interviewDomain: 'Software Engineering',
          interviewDifficulty: 'Hard',
          interviewDuration: 20,
          samplePrompt: 'Compare cache-aside vs write-through caching under concurrent updates.'
        }
      ]
    }
  ]
};

export function getRoadmapForTarget(target: CareerTarget): RoleRoadmap {
  const key = target.roleName.trim().toLowerCase();
  const DOMAIN_PRESET_ALIASES: Record<string, string> = {
    'data structures and algorithms': 'dsa & algorithmic specialist',
    'hr interview': 'hr & leadership readiness',
    'behavioral interview': 'hr & leadership readiness'
  };
  const resolvedKey = DOMAIN_PRESET_ALIASES[key] || key;

  if (PRESET_ROADMAPS[resolvedKey]) {
    return {
      roleTitle: target.roleName,
      summary:
        target.description ||
        `Sequential 4-stage preparation flowchart for ${target.roleName}. Click any stage box to view topics and topic-wise interviews.`,
      phases: PRESET_ROADMAPS[resolvedKey]
    };
  }

  const domains =
    target.focusDomains && target.focusDomains.length > 0
      ? target.focusDomains
      : ['Data Structures and Algorithms', 'Software Engineering', 'HR Interview'];

  const d1 = domains[0];
  const d2 = domains[1] || domains[0];
  const d3 = domains[2] || domains[1] || domains[0];
  const d4 = domains.includes('HR Interview') ? 'HR Interview' : d1;

  return {
    roleTitle: target.roleName,
    summary:
      target.description ||
      `Custom 4-stage preparation flowchart tailored around ${domains.join(', ')} for ${target.roleName}.`,
    phases: [
      {
        stepNumber: '01',
        title: `${d1} Fundamentals`,
        shortLabel: d1.length > 18 ? `${d1.slice(0, 16)}…` : d1,
        subtitle: `Build rock-solid core concepts and fluency in ${d1}.`,
        recommendedDomain: d1,
        difficultyLabel: 'Easy to Medium',
        estimatedWeeks: 'Weeks 1–2',
        interviewFocus: `Focuses on foundational definitions, clean mental models, and core problem-solving in ${d1}.`,
        milestones: [
          {
            id: `${target.targetId}_1_1`,
            topic: `Core Concepts & Mental Models in ${d1}`,
            subtopics: `Fundamental primitives, terminology, and baseline patterns in ${d1}.`,
            interviewTitle: `${d1} Core Concepts Screening`,
            interviewDomain: d1,
            interviewDifficulty: 'Easy',
            interviewDuration: 15,
            samplePrompt: `Explain a foundational principle in ${d1} and where beginners commonly misuse it.`
          },
          {
            id: `${target.targetId}_1_2`,
            topic: `Foundational Problem Solving in ${d1}`,
            subtopics: `Clean execution on standard prompts with clear complexity bounds.`,
            interviewTitle: `${d1} Guided Problem-Solving Round`,
            interviewDomain: d1,
            interviewDifficulty: 'Easy',
            interviewDuration: 15,
            samplePrompt: `Walk through solving a core ${d1} problem step by step while stating trade-offs.`
          },
          {
            id: `${target.targetId}_1_3`,
            topic: `Edge Cases & Trade-Off Articulation`,
            subtopics: `Boundary validation and concise 3-minute verbal explanations.`,
            interviewTitle: `${d1} Clarity & Edge-Case Check`,
            interviewDomain: d1,
            interviewDifficulty: 'Medium',
            interviewDuration: 15,
            samplePrompt: `How do edge cases affect memory and runtime guarantees in ${d1}?`
          }
        ]
      },
      {
        stepNumber: '02',
        title: `Applied Mastery in ${d2}`,
        shortLabel: d2.length > 18 ? `${d2.slice(0, 16)}…` : d2,
        subtitle: `Move from fundamentals into practical problem-solving for ${target.roleName}.`,
        recommendedDomain: d2,
        difficultyLabel: 'Medium',
        estimatedWeeks: 'Weeks 3–4',
        interviewFocus: `Evaluates practical debugging, trade-off analysis, and project-grounded scenarios in ${d2}.`,
        milestones: [
          {
            id: `${target.targetId}_2_1`,
            topic: `Real-World Scenarios in ${d2}`,
            subtopics: `Production architecture patterns and practical constraints.`,
            interviewTitle: `${d2} Practical Architecture Round`,
            interviewDomain: d2,
            interviewDifficulty: 'Medium',
            interviewDuration: 15,
            samplePrompt: `Compare two competing implementation approaches in ${d2} for a production workload.`
          },
          {
            id: `${target.targetId}_2_2`,
            topic: `Debugging & Suboptimal Refactoring`,
            subtopics: `Root-cause isolation, profiling bottlenecks, stepwise optimization.`,
            interviewTitle: `${d2} Debugging & Optimization Round`,
            interviewDomain: d2,
            interviewDifficulty: 'Medium',
            interviewDuration: 15,
            samplePrompt: `Describe diagnosing a challenging bug or bottleneck involving ${d2}.`
          },
          {
            id: `${target.targetId}_2_3`,
            topic: `Connecting ${d2} to Resume Projects`,
            subtopics: `Defending your own past design decisions with concrete metrics.`,
            interviewTitle: `${d2} Project Deep-Dive Round`,
            interviewDomain: d2,
            interviewDifficulty: 'Medium',
            interviewDuration: 15,
            samplePrompt: `How did you apply ${d2} in your strongest project and what measurable outcome did it produce?`
          }
        ]
      },
      {
        stepNumber: '03',
        title: `Advanced Depth & ${d3}`,
        shortLabel: d3.length > 18 ? `${d3.slice(0, 16)}…` : d3,
        subtitle: `Stress-test high-complexity questions and cross-domain trade-offs.`,
        recommendedDomain: d3,
        difficultyLabel: 'Medium to Hard',
        estimatedWeeks: 'Weeks 5–6',
        interviewFocus: `Tests scalability constraints, concurrency, and Hard-level reasoning across ${d3}.`,
        milestones: [
          {
            id: `${target.targetId}_3_1`,
            topic: `Scaling & High-Throughput Constraints in ${d3}`,
            subtopics: `Concurrency, latency budgets, fault tolerance under load.`,
            interviewTitle: `${d3} Scalability & Stress Round`,
            interviewDomain: d3,
            interviewDifficulty: 'Hard',
            interviewDuration: 20,
            samplePrompt: `How does ${d3} behave under high-throughput or distributed load?`
          },
          {
            id: `${target.targetId}_3_2`,
            topic: `Cross-Domain Synthesis (${domains.slice(0, 2).join(' + ')})`,
            subtopics: `Combining data models, algorithms, and system boundaries cleanly.`,
            interviewTitle: `${d3} Multi-Part System Round`,
            interviewDomain: d3,
            interviewDifficulty: 'Hard',
            interviewDuration: 20,
            samplePrompt: `Design a resilient solution combining ${domains.slice(0, 2).join(' and ')}.`
          }
        ]
      },
      {
        stepNumber: '04',
        title: `${target.roleName} Final Loop Readiness`,
        shortLabel: 'Final Loop',
        subtitle: `Pair technical confidence with STAR behavioral clarity for full interview loops.`,
        recommendedDomain: d4,
        difficultyLabel: 'Mixed',
        estimatedWeeks: 'Week 7+',
        interviewFocus: `Combines technical walkthroughs with structured STAR storytelling tailored to ${target.roleName}.`,
        milestones: [
          {
            id: `${target.targetId}_4_1`,
            topic: `STAR Ownership & Leadership Stories`,
            subtopics: `Conflict resolution, ownership, ambiguity handling.`,
            interviewTitle: `${target.roleName} Behavioral & Culture Round`,
            interviewDomain: 'HR Interview',
            interviewDifficulty: 'Medium',
            interviewDuration: 15,
            samplePrompt: `Tell me about resolving ambiguity or conflict on a challenging deliverable.`
          },
          {
            id: `${target.targetId}_4_2`,
            topic: `Timed Mixed Final Simulation`,
            subtopics: `Technical depth + behavioral articulation calibrated to ${target.targetScore}%.`,
            interviewTitle: `${target.roleName} Capstone Mock Loop`,
            interviewDomain: d4,
            interviewDifficulty: 'Hard',
            interviewDuration: 25,
            samplePrompt: `Walk through your highest-impact project relevant to ${target.roleName} under follow-up probes.`
          }
        ]
      }
    ]
  };
}
