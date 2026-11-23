import { DifficultyLevel, InterviewQuestionItem } from '../types/hireboost';
import { getCodingTimeLimitSeconds } from '../config/interviewConfig';

export interface CodingProblemTemplate {
  id: string;
  title: string;
  difficulty: DifficultyLevel;
  domains: string[];
  functionName: string;
  questionText: string;
  constraints: string[];
  examples: { input: string; output: string; explanation?: string }[];
  keyPoints: string[];
  starterCode: {
    javascript: string;
    python: string;
  };
  testCases: {
    id: string;
    input: string;
    expectedOutput: string;
    description?: string;
    isHidden?: boolean;
  }[];
}

export const CODING_PROBLEM_BANK: CodingProblemTemplate[] = [
  // EASY PROBLEMS (Default 10 minutes)
  {
    id: 'code_easy_two_sum',
    title: 'Two Sum Indices',
    difficulty: 'Easy',
    domains: ['Data Structures and Algorithms', 'Python', 'C++', 'Java', 'Web Development', 'Software Engineering'],
    functionName: 'twoSum',
    questionText:
      'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`. Assume each input has exactly one solution and you may not use the same element twice.',
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      'Return indices in ascending order [i, j]'
    ],
    examples: [
      { input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]', explanation: 'nums[0] + nums[1] == 9' },
      { input: 'nums = [3, 2, 4], target = 6', output: '[1, 2]' }
    ],
    keyPoints: ['O(N) Hash Map lookup', 'Single pass complement check', 'Avoid using same index twice'],
    starterCode: {
      javascript: `function twoSum(nums, target) {\n  // Return indices [i, j] whose values sum to target\n  \n}`,
      python: `def twoSum(nums, target):\n    # Return indices [i, j] whose values sum to target\n    pass`
    },
    testCases: [
      { id: 'tc_1', input: '[[2, 7, 11, 15], 9]', expectedOutput: '[0, 1]', description: 'Standard pair at start' },
      { id: 'tc_2', input: '[[3, 2, 4], 6]', expectedOutput: '[1, 2]', description: 'Non-adjacent pair' },
      { id: 'tc_3', input: '[[3, 3], 6]', expectedOutput: '[0, 1]', description: 'Duplicate values' },
      { id: 'tc_4', input: '[[-1, -2, -3, -4, -5], -8]', expectedOutput: '[2, 4]', isHidden: true, description: 'Negative numbers' }
    ]
  },
  {
    id: 'code_easy_valid_parens',
    title: 'Valid Balanced Brackets',
    difficulty: 'Easy',
    domains: ['Data Structures and Algorithms', 'Python', 'C++', 'Java', 'Web Development', 'Software Engineering'],
    functionName: 'isValidBrackets',
    questionText:
      'Given a string `s` containing only the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string has valid, properly nested brackets.',
    constraints: [
      '1 <= s.length <= 10^4',
      's consists strictly of brackets ()[]{}'
    ],
    examples: [
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "([)]"', output: 'false' }
    ],
    keyPoints: ['LIFO Stack tracking open brackets', 'O(N) time and O(N) space', 'Handle unclosed or mismatched brackets'],
    starterCode: {
      javascript: `function isValidBrackets(s) {\n  // Return true if brackets are balanced, false otherwise\n  \n}`,
      python: `def isValidBrackets(s):\n    # Return True if brackets are balanced, False otherwise\n    pass`
    },
    testCases: [
      { id: 'tc_1', input: '["()[]{}"]', expectedOutput: 'true', description: 'Sequential valid pairs' },
      { id: 'tc_2', input: '["({[]})"]', expectedOutput: 'true', description: 'Nested brackets' },
      { id: 'tc_3', input: '["([)]"]', expectedOutput: 'false', description: 'Interleaved invalid order' },
      { id: 'tc_4', input: '["("]', expectedOutput: 'false', isHidden: true, description: 'Single unclosed bracket' }
    ]
  },

  // MEDIUM PROBLEMS (Default 20 minutes)
  {
    id: 'code_med_longest_substring',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    domains: ['Data Structures and Algorithms', 'Python', 'C++', 'Java', 'Web Development', 'Software Engineering'],
    functionName: 'lengthOfLongestSubstring',
    questionText:
      'Given a string `s`, find the length of the longest contiguous substring without repeating characters.',
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's may contain letters, digits, symbols, and spaces'
    ],
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with length 3.' },
      { input: 's = "bbbbb"', output: '1' }
    ],
    keyPoints: ['Sliding window with two pointers', 'Last-seen character index map', 'O(N) single-pass window jump'],
    starterCode: {
      javascript: `function lengthOfLongestSubstring(s) {\n  // Return integer length of longest unique-char substring\n  \n}`,
      python: `def lengthOfLongestSubstring(s):\n    # Return integer length of longest unique-char substring\n    pass`
    },
    testCases: [
      { id: 'tc_1', input: '["abcabcbb"]', expectedOutput: '3', description: 'Repeating pattern' },
      { id: 'tc_2', input: '["bbbbb"]', expectedOutput: '1', description: 'All identical chars' },
      { id: 'tc_3', input: '["pwwkew"]', expectedOutput: '3', description: 'Window reset in middle' },
      { id: 'tc_4', input: '[""]', expectedOutput: '0', isHidden: true, description: 'Empty string edge case' }
    ]
  },
  {
    id: 'code_med_merge_intervals',
    title: 'Merge Overlapping Intervals',
    difficulty: 'Medium',
    domains: ['Data Structures and Algorithms', 'Python', 'C++', 'Java', 'Software Engineering'],
    functionName: 'mergeIntervals',
    questionText:
      'Given an array of intervals where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals and return an array of the non-overlapping intervals sorted by start time.',
    constraints: [
      '1 <= intervals.length <= 10^4',
      'intervals[i].length == 2',
      '0 <= start_i <= end_i <= 10^4'
    ],
    examples: [
      { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]' },
      { input: 'intervals = [[1,4],[4,5]]', output: '[[1,5]]' }
    ],
    keyPoints: ['Sort intervals by start time O(N log N)', 'Compare current start with previous merged end', 'Edge case: touching boundaries [1,4],[4,5]'],
    starterCode: {
      javascript: `function mergeIntervals(intervals) {\n  // Sort and merge overlapping [start, end] intervals\n  \n}`,
      python: `def mergeIntervals(intervals):\n    # Sort and merge overlapping [start, end] intervals\n    pass`
    },
    testCases: [
      { id: 'tc_1', input: '[[[1,3],[2,6],[8,10],[15,18]]]', expectedOutput: '[[1,6],[8,10],[15,18]]', description: 'Standard overlaps' },
      { id: 'tc_2', input: '[[[1,4],[4,5]]]', expectedOutput: '[[1,5]]', description: 'Touching endpoints' },
      { id: 'tc_3', input: '[[[5,7],[1,3],[2,6]]]', expectedOutput: '[[1,7]]', description: 'Unsorted cascading merge' },
      { id: 'tc_4', input: '[[[1,4],[2,3]]]', expectedOutput: '[[1,4]]', isHidden: true, description: 'Fully contained interval' }
    ]
  },

  // HARD PROBLEMS (Default 30 minutes)
  {
    id: 'code_hard_coin_change_min',
    title: 'Minimum Coins for Target Amount (DP)',
    difficulty: 'Hard',
    domains: ['Data Structures and Algorithms', 'Python', 'C++', 'Java', 'Software Engineering'],
    functionName: 'minCoins',
    questionText:
      'You are given an integer array `coins` representing coin denominations and an integer `amount`. Return the fewest number of coins needed to make up that amount. If the amount cannot be made up by any combination of the coins, return `-1`.',
    constraints: [
      '1 <= coins.length <= 12',
      '1 <= coins[i] <= 2^31 - 1',
      '0 <= amount <= 10^4'
    ],
    examples: [
      { input: 'coins = [1, 2, 5], amount = 11', output: '3', explanation: '11 = 5 + 5 + 1' },
      { input: 'coins = [2], amount = 3', output: '-1' }
    ],
    keyPoints: ['Bottom-up Dynamic Programming O(amount * coins)', 'Avoid greedy pitfalls on non-canonical coins', 'Handle amount = 0 and unreachable states (-1)'],
    starterCode: {
      javascript: `function minCoins(coins, amount) {\n  // Return minimum coin count or -1 if impossible\n  \n}`,
      python: `def minCoins(coins, amount):\n    # Return minimum coin count or -1 if impossible\n    pass`
    },
    testCases: [
      { id: 'tc_1', input: '[[1, 2, 5], 11]', expectedOutput: '3', description: 'Canonical coin set' },
      { id: 'tc_2', input: '[[2], 3]', expectedOutput: '-1', description: 'Unreachable amount' },
      { id: 'tc_3', input: '[[1, 3, 4], 6]', expectedOutput: '2', description: 'Greedy fails here (3+3=6 vs 4+1+1)' },
      { id: 'tc_4', input: '[[1], 0]', expectedOutput: '0', isHidden: true, description: 'Zero target amount' }
    ]
  },
  {
    id: 'code_hard_trapping_rain',
    title: 'Trapping Rain Water',
    difficulty: 'Hard',
    domains: ['Data Structures and Algorithms', 'Python', 'C++', 'Java', 'Web Development', 'Software Engineering'],
    functionName: 'trapRainWater',
    questionText:
      'Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
    constraints: [
      '1 <= height.length <= 2 * 10^4',
      '0 <= height[i] <= 10^5',
      'Target O(N) time and O(1) space with two pointers'
    ],
    examples: [
      { input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6' },
      { input: 'height = [4,2,0,3,2,5]', output: '9' }
    ],
    keyPoints: ['Two-pointer approach with leftMax and rightMax', 'O(N) time and O(1) space', 'Water trapped at i = min(leftMax, rightMax) - height[i]'],
    starterCode: {
      javascript: `function trapRainWater(height) {\n  // Return total units of trapped rain water\n  \n}`,
      python: `def trapRainWater(height):\n    # Return total units of trapped rain water\n    pass`
    },
    testCases: [
      { id: 'tc_1', input: '[[0,1,0,2,1,0,1,3,2,1,2,1]]', expectedOutput: '6', description: 'Classic elevation map' },
      { id: 'tc_2', input: '[[4,2,0,3,2,5]]', expectedOutput: '9', description: 'Deep central basin' },
      { id: 'tc_3', input: '[[3,0,2,0,4]]', expectedOutput: '7', description: 'Symmetric walls' },
      { id: 'tc_4', input: '[[1,2,3,4]]', expectedOutput: '0', isHidden: true, description: 'Monotonic ascending (no water)' }
    ]
  }
];

export function buildCodingQuestionItem(
  template: CodingProblemTemplate,
  customLimits?: Partial<Record<DifficultyLevel, number>>,
  preferredLang: 'javascript' | 'python' = 'javascript'
): InterviewQuestionItem {
  return {
    questionId: `${template.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    questionType: 'coding',
    title: template.title,
    questionText: template.questionText,
    difficulty: template.difficulty,
    timeLimitSeconds: getCodingTimeLimitSeconds(template.difficulty, customLimits),
    functionName: template.functionName,
    starterCode: { ...template.starterCode },
    defaultLanguage: preferredLang,
    constraints: template.constraints,
    examples: template.examples,
    keyPoints: template.keyPoints,
    testCases: template.testCases
  };
}

export function selectCodingProblemsForConfig(
  domain: string,
  difficulty: DifficultyLevel,
  count: number,
  customLimits?: Partial<Record<DifficultyLevel, number>>
): InterviewQuestionItem[] {
  const preferredLang: 'javascript' | 'python' = domain === 'Python' ? 'python' : 'javascript';
  const primary = CODING_PROBLEM_BANK.filter(
    (p) => p.difficulty === difficulty && (p.domains.includes(domain) || domain === 'Custom Topic')
  );
  const secondary = CODING_PROBLEM_BANK.filter(
    (p) => p.difficulty !== difficulty && (p.domains.includes(domain) || domain === 'Custom Topic')
  );
  const fallback = CODING_PROBLEM_BANK;

  const ordered: CodingProblemTemplate[] = [];
  const seen = new Set<string>();
  for (const list of [primary, secondary, fallback]) {
    for (const item of list) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        ordered.push(item);
      }
    }
  }

  return ordered.slice(0, count).map((tpl) => buildCodingQuestionItem(tpl, customLimits, preferredLang));
}
