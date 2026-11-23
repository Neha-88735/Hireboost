export type ResponseVerdict =
  | 'proper_solution'
  | 'partial_solution'
  | 'too_brief'
  | 'off_topic'
  | 'no_response';

export interface ParsedResponseAnalysis {
  wordCount: number;
  isProperSolution: boolean;
  isGibberishOrNoise: boolean;
  verdict: ResponseVerdict;
  matchedKeywords: string[];
  missingKeywords: string[];
  keywordCoveragePct: number;
  conceptualScore: number;
  communicationScore: number;
  honestFeedback: string;
}

const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'of', 'for', 'with',
  'by', 'from', 'as', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must',
  'what', 'how', 'why', 'when', 'where', 'who', 'explain', 'describe', 'tell', 'about',
  'between', 'difference', 'differences', 'provide', 'example', 'examples', 'your', 'you',
  'they', 'their', 'them', 'this', 'that', 'these', 'those', 'into', 'using', 'used',
  'use', 'such', 'more', 'most', 'some', 'any', 'both', 'each', 'than', 'then', 'there',
  'here', 'just', 'like', 'very', 'really', 'basically', 'actually', 'well', 'also',
  'vs', 'versus', 'under', 'hood', 'work', 'works', 'working', 'concept', 'concepts',
  'question', 'answer', 'situation', 'time', 'way', 'make', 'made', 'give', 'given'
]);

const FILLER_WORDS = new Set([
  'um', 'uh', 'umm', 'uhh', 'hmm', 'er', 'ah', 'like', 'okay', 'ok', 'yeah', 'yes',
  'no', 'nope', 'idk', 'dunno', 'nothing', 'none', 'skip', 'pass', 'test', 'testing',
  'hello', 'hi', 'hey', 'blah', 'stuff', 'things', 'whatever', 'random', 'shit', 'crap',
  'asdf', 'qwerty', 'xyz', 'abc', 'foo', 'bar', 'something', 'anything', 'sorry', 'wait'
]);

// Concept synonym clusters so natural explanations ("last in first out" for "LIFO") are parsed fairly
const CONCEPT_SYNONYMS: string[][] = [
  ['lifo', 'last in first out', 'last-in first-out', 'top of stack', 'push and pop'],
  ['fifo', 'first in first out', 'first-in first-out', 'enqueue', 'dequeue', 'front and rear'],
  ['contiguous', 'adjacent', 'indexed', 'random access', 'o(1) access', 'cache locality'],
  ['linked list', 'pointer', 'pointers', 'node', 'nodes', 'next pointer', 'non-contiguous'],
  ['slow', 'fast', 'two pointer', 'floyd', 'tortoise', 'hare', 'cycle'],
  ['hash', 'hashing', 'hash function', 'bucket', 'buckets', 'collision', 'chaining', 'probing', 'open addressing'],
  ['dynamic programming', 'dp', 'overlapping subproblems', 'optimal substructure', 'memoization', 'tabulation', 'cache'],
  ['divide and conquer', 'independent subproblems', 'recursion', 'recursive'],
  ['bst', 'binary search tree', 'inorder', 'in-order', 'left subtree', 'right subtree', 'min max', 'bounds'],
  ['dijkstra', 'shortest path', 'priority queue', 'min heap', 'greedy', 'negative weight', 'bellman'],
  ['lru', 'least recently used', 'doubly linked list', 'hashmap', 'hash map', 'eviction', 'o(1)'],
  ['mutable', 'immutable', 'modify', 'hashable', 'tuple', 'list'],
  ['decorator', 'wrapper', 'closure', 'higher order', 'callable', 'functools'],
  ['gil', 'global interpreter lock', 'mutex', 'cpu bound', 'cpu-bound', 'io bound', 'i/o bound', 'multiprocessing', 'threads'],
  ['garbage collection', 'reference counting', 'cyclic', 'memory leak', 'gc'],
  ['generator', 'yield', 'lazy evaluation', 'iterator', 'memory efficient'],
  ['asyncio', 'event loop', 'coroutine', 'await', 'async', 'cooperative multitasking', 'non-blocking'],
  ['cors', 'same-origin', 'same origin', 'preflight', 'options', 'access-control-allow-origin', 'header', 'headers'],
  ['xss', 'csrf', 'cross-site scripting', 'cross-site request forgery', 'sanitize', 'token', 'csp', 'httponly'],
  ['ssr', 'csr', 'server-side rendering', 'client-side rendering', 'hydration', 'seo', 'ttfb'],
  ['virtual dom', 'reconciliation', 'diffing', 'dom', 'render', 're-render'],
  ['acid', 'atomicity', 'consistency', 'isolation', 'durability', 'transaction', 'rollback', 'commit'],
  ['index', 'indexing', 'b-tree', 'btree', 'lookup', 'query plan', 'scan'],
  ['normalization', 'normal form', 'redundancy', 'foreign key', 'schema'],
  ['process', 'thread', 'context switch', 'shared memory', 'address space', 'deadlock', 'semaphore'],
  ['virtual memory', 'paging', 'page fault', 'tlb', 'swap', 'mmu'],
  ['tcp', 'udp', 'handshake', 'http', 'https', 'tls', 'dns', 'load balancer', 'websocket'],
  ['time complexity', 'space complexity', 'big o', 'big-o', 'o(1)', 'o(n)', 'o(log n)', 'o(n log n)', 'amortized', 'worst case'],
  ['trade-off', 'tradeoff', 'trade offs', 'tradeoffs', 'bottleneck', 'latency', 'throughput', 'scalability'],
  ['star', 'situation', 'task', 'action', 'result', 'conflict', 'benchmark', 'data', 'team', 'resolved', 'learned', 'outcome', 'impact', 'deadline', 'priority']
];

function normalizeText(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[`'".,!?;:()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function looksLikeKeyboardMash(token: string): boolean {
  if (token.length < 4) return false;
  // Repeated single character e.g. aaaaa
  if (/^(.)\1{3,}$/.test(token)) return true;
  // High consonant run (6+ consonants in a row like xkcdqwz) unless known tech acronym
  if (/[bcdfghjklmnpqrstvwxyz]{6,}/i.test(token)) return true;
  // No vowels at all in long non-acronym words (>5 chars)
  if (token.length >= 6 && !/[aeiouy]/i.test(token)) return true;
  return false;
}

function extractExpectedKeywords(questionText: string, keyPoints: string[] = []): string[] {
  const keywords: string[] = [];
  const seen = new Set<string>();

  const addCandidate = (phrase: string) => {
    const cleaned = phrase
      .replace(/[*_`#]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleaned || cleaned.length < 2) return;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    keywords.push(cleaned);
  };

  // Extract concise phrases and significant terms from keyPoints
  for (const kp of keyPoints) {
    const cleanKp = String(kp || '').trim();
    if (!cleanKp) continue;
    // Skip ultra-generic template phrases like "Clarity of core concept and structure"
    const words = normalizeText(cleanKp)
      .split(' ')
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
    if (words.length > 0 && words.length <= 4) {
      addCandidate(cleanKp);
    } else {
      for (const w of words) {
        addCandidate(w);
      }
    }
  }

  // Extract core subject terms from the question text itself
  const qNorm = normalizeText(questionText);
  const qTokens = qNorm
    .split(' ')
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
  for (const tok of qTokens) {
    if (!seen.has(tok) && keywords.length < 10) {
      addCandidate(tok);
    }
  }

  return keywords.slice(0, 8);
}

function doesAnswerMatchKeyword(answerNorm: string, answerTokens: Set<string>, keyword: string): boolean {
  const kwNorm = normalizeText(keyword);
  if (!kwNorm) return false;

  // Direct substring match for multi-word phrases or acronyms
  if (answerNorm.includes(kwNorm)) return true;

  // Token overlap for multi-word keyPoints (e.g. "Mutex protecting reference counts" -> matches if "mutex" or "reference" present)
  const kwTokens = kwNorm.split(' ').filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
  if (kwTokens.length > 0) {
    const hits = kwTokens.filter((t) => answerTokens.has(t) || answerNorm.includes(t));
    if (hits.length >= Math.max(1, Math.ceil(kwTokens.length * 0.5))) {
      return true;
    }
  }

  // Concept synonym cluster check
  for (const cluster of CONCEPT_SYNONYMS) {
    const kwInCluster = cluster.some((syn) => kwNorm.includes(syn) || syn.includes(kwNorm));
    if (kwInCluster) {
      const ansInCluster = cluster.some((syn) => answerNorm.includes(syn));
      if (ansInCluster) return true;
    }
  }

  return false;
}

export function analyzeInterviewResponse(params: {
  questionText: string;
  keyPoints?: string[];
  domain?: string;
  answerText: string;
}): ParsedResponseAnalysis {
  const raw = String(params.answerText || '').trim();
  const keyPoints = Array.isArray(params.keyPoints) ? params.keyPoints : [];
  const expectedKeywords = extractExpectedKeywords(params.questionText || '', keyPoints);

  if (
    !raw ||
    raw.startsWith('(No ') ||
    raw.startsWith('(Candidate skipped') ||
    raw === '(Empty submission)'
  ) {
    return {
      wordCount: 0,
      isProperSolution: false,
      isGibberishOrNoise: false,
      verdict: 'no_response',
      matchedKeywords: [],
      missingKeywords: expectedKeywords.slice(0, 4),
      keywordCoveragePct: 0,
      conceptualScore: 5,
      communicationScore: 10,
      honestFeedback: expectedKeywords.length > 0
        ? `No answer was captured for this question. Key points to cover include: ${expectedKeywords.slice(0, 3).join(', ')}.`
        : 'No answer was captured for this question.'
    };
  }

  const answerNorm = normalizeText(raw);
  const rawTokens = answerNorm.split(' ').filter(Boolean);
  const wordCount = rawTokens.length;
  const answerTokenSet = new Set(rawTokens);

  const nonFillerTokens = rawTokens.filter((t) => !FILLER_WORDS.has(t));
  const mashCount = rawTokens.filter(looksLikeKeyboardMash).length;
  const uniqueTokens = new Set(rawTokens);
  const repetitionRatio = wordCount > 0 ? uniqueTokens.size / wordCount : 0;

  // Match against extracted expected keywords + domain concept vocabulary
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];
  for (const kw of expectedKeywords) {
    if (doesAnswerMatchKeyword(answerNorm, answerTokenSet, kw)) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  }

  // Also check if ANY broader technical or structured explanation concepts appear
  let conceptClusterHits = 0;
  for (const cluster of CONCEPT_SYNONYMS) {
    if (cluster.some((syn) => answerNorm.includes(syn))) {
      conceptClusterHits += 1;
    }
  }

  const keywordCoveragePct =
    expectedKeywords.length > 0
      ? Math.round((matchedKeywords.length / expectedKeywords.length) * 100)
      : conceptClusterHits > 0
        ? 60
        : 0;

  const isOnlyFillers = nonFillerTokens.length <= 1;
  const isExcessiveRepetition = wordCount >= 5 && repetitionRatio < 0.35;
  const isMostlyKeyboardMash = wordCount > 0 && mashCount / wordCount >= 0.35;
  const hasZeroRelevance =
    matchedKeywords.length === 0 &&
    conceptClusterHits === 0 &&
    nonFillerTokens.filter((t) => !STOP_WORDS.has(t)).length <= 3;

  const isGibberishOrNoise =
    isOnlyFillers ||
    isExcessiveRepetition ||
    isMostlyKeyboardMash ||
    (wordCount >= 3 && matchedKeywords.length === 0 && conceptClusterHits === 0 && rawTokens.some((t) => FILLER_WORDS.has(t)) && nonFillerTokens.length < 6) ||
    hasZeroRelevance;

  if (isGibberishOrNoise) {
    const missingHint =
      missingKeywords.length > 0
        ? ` Expected key concepts: ${missingKeywords.slice(0, 3).join(', ')}.`
        : '';
    return {
      wordCount,
      isProperSolution: false,
      isGibberishOrNoise: true,
      verdict: 'off_topic',
      matchedKeywords: [],
      missingKeywords: expectedKeywords.slice(0, 4),
      keywordCoveragePct: 0,
      conceptualScore: wordCount <= 3 ? 10 : 18,
      communicationScore: wordCount <= 3 ? 15 : 24,
      honestFeedback: `Your response did not provide a valid technical explanation for this question.${missingHint}`
    };
  }

  // Evaluate brevity vs depth honestly
  const isConciseAccurate =
    wordCount >= 6 &&
    (keywordCoveragePct >= 45 || (matchedKeywords.length >= 2 && conceptClusterHits >= 2));

  if (wordCount < 14 && !isConciseAccurate) {
    const expandHint =
      missingKeywords.length > 0
        ? ` — you could have expanded a bit more on ${missingKeywords.slice(0, 3).join(', ')}.`
        : ' — you could have elaborated a bit more with reasoning and a concrete example.';
    const score = Math.min(48, 24 + matchedKeywords.length * 10 + Math.min(10, wordCount));
    return {
      wordCount,
      isProperSolution: false,
      isGibberishOrNoise: false,
      verdict: 'too_brief',
      matchedKeywords,
      missingKeywords,
      keywordCoveragePct,
      conceptualScore: score,
      communicationScore: Math.min(55, score + 6),
      honestFeedback: `The answer you gave is too brief${expandHint}`
    };
  }

  // Zero keyword overlap even in a longer response -> off-topic
  if (matchedKeywords.length === 0 && conceptClusterHits === 0) {
    const missingHint =
      missingKeywords.length > 0
        ? ` Try directly addressing ${missingKeywords.slice(0, 3).join(', ')}.`
        : '';
    return {
      wordCount,
      isProperSolution: false,
      isGibberishOrNoise: false,
      verdict: 'off_topic',
      matchedKeywords: [],
      missingKeywords,
      keywordCoveragePct: 0,
      conceptualScore: 22,
      communicationScore: Math.min(48, 25 + Math.min(20, wordCount)),
      honestFeedback: `Your response appeared off-topic and didn't cover the core concepts of the question.${missingHint}`
    };
  }

  // Check if partial vs proper solution
  const lengthStrength = Math.min(22, Math.round((Math.min(wordCount, 55) / 55) * 22));
  const coveragePoints = Math.round((keywordCoveragePct / 100) * 62);
  const conceptBonus = Math.min(14, conceptClusterHits * 4);
  const computedScore = Math.min(96, Math.max(32, 12 + coveragePoints + lengthStrength + conceptBonus));

  const isProperSolution =
    (keywordCoveragePct >= 45 && wordCount >= 14) ||
    (matchedKeywords.length >= 2 && conceptClusterHits >= 2 && wordCount >= 10) ||
    isConciseAccurate;

  if (!isProperSolution || (keywordCoveragePct < 55 && missingKeywords.length > 0)) {
    const coveredPart =
      matchedKeywords.length > 0
        ? `You mentioned ${matchedKeywords.slice(0, 2).join(' and ')}`
        : 'You touched on part of the idea';
    const missingPart =
      missingKeywords.length > 0
        ? `, though you could have expanded a bit more on ${missingKeywords.slice(0, 2).join(' and ')}.`
        : ', though elaborating further on trade-offs and edge cases would make it stronger.';
    return {
      wordCount,
      isProperSolution,
      isGibberishOrNoise: false,
      verdict: wordCount < 18 ? 'too_brief' : 'partial_solution',
      matchedKeywords,
      missingKeywords,
      keywordCoveragePct,
      conceptualScore: Math.min(72, computedScore),
      communicationScore: Math.min(76, Math.max(40, computedScore + 4)),
      honestFeedback:
        wordCount < 18
          ? `The answer you gave is a bit brief. ${coveredPart}${missingPart}`
          : `${coveredPart}${missingPart}`
    };
  }

  const strongSummary =
    matchedKeywords.length > 0
      ? `Good answer — you clearly explained ${matchedKeywords.slice(0, 3).join(', ')}.`
      : 'Good conceptual explanation with clear reasoning.';

  return {
    wordCount,
    isProperSolution: true,
    isGibberishOrNoise: false,
    verdict: 'proper_solution',
    matchedKeywords,
    missingKeywords,
    keywordCoveragePct,
    conceptualScore: Math.max(72, computedScore),
    communicationScore: Math.min(96, Math.max(70, computedScore + 2)),
    honestFeedback:
      missingKeywords.length > 0 && keywordCoveragePct < 80
        ? `${strongSummary} Adding a quick note on ${missingKeywords[0]} would round it out completely.`
        : strongSummary
  };
}
