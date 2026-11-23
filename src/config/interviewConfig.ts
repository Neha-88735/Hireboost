import { DifficultyLevel, RoundFormat } from '../types/hireboost';

export const DEFAULT_CODING_TIME_LIMITS_MINUTES: Record<DifficultyLevel, number> = {
  Easy: 10,
  Medium: 20,
  Hard: 30
};

export const DEFAULT_VOICE_TIME_LIMITS_MINUTES: Record<DifficultyLevel, number> = {
  Easy: 2,
  Medium: 3,
  Hard: 4
};

export const CODING_WARNING_THRESHOLDS_SECONDS = [120, 60, 30] as const;
export const VOICE_WARNING_THRESHOLDS_SECONDS = [30, 15] as const;

export const CODING_CAPABLE_DOMAINS = new Set<string>([
  'Data Structures and Algorithms',
  'Python',
  'C++',
  'Java',
  'Web Development',
  'Software Engineering'
]);

const CODING_LIMITS_STORAGE_KEY = 'hireboost_coding_time_limits';
const VOICE_LIMITS_STORAGE_KEY = 'hireboost_voice_time_limits';

export function getStoredCodingTimeLimits(): Record<DifficultyLevel, number> {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_CODING_TIME_LIMITS_MINUTES };
  }
  try {
    const raw = localStorage.getItem(CODING_LIMITS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CODING_TIME_LIMITS_MINUTES };
    const parsed = JSON.parse(raw);
    return {
      Easy: clampMinutes(parsed?.Easy, DEFAULT_CODING_TIME_LIMITS_MINUTES.Easy),
      Medium: clampMinutes(parsed?.Medium, DEFAULT_CODING_TIME_LIMITS_MINUTES.Medium),
      Hard: clampMinutes(parsed?.Hard, DEFAULT_CODING_TIME_LIMITS_MINUTES.Hard)
    };
  } catch {
    return { ...DEFAULT_CODING_TIME_LIMITS_MINUTES };
  }
}

export function saveStoredCodingTimeLimits(limits: Record<DifficultyLevel, number>): Record<DifficultyLevel, number> {
  const sanitized: Record<DifficultyLevel, number> = {
    Easy: clampMinutes(limits.Easy, DEFAULT_CODING_TIME_LIMITS_MINUTES.Easy),
    Medium: clampMinutes(limits.Medium, DEFAULT_CODING_TIME_LIMITS_MINUTES.Medium),
    Hard: clampMinutes(limits.Hard, DEFAULT_CODING_TIME_LIMITS_MINUTES.Hard)
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CODING_LIMITS_STORAGE_KEY, JSON.stringify(sanitized));
    } catch {
      // ignore storage errors
    }
  }
  return sanitized;
}

export function getStoredVoiceTimeLimits(): Record<DifficultyLevel, number> {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_VOICE_TIME_LIMITS_MINUTES };
  }
  try {
    const raw = localStorage.getItem(VOICE_LIMITS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_VOICE_TIME_LIMITS_MINUTES };
    const parsed = JSON.parse(raw);
    return {
      Easy: clampVoiceMinutes(parsed?.Easy, DEFAULT_VOICE_TIME_LIMITS_MINUTES.Easy),
      Medium: clampVoiceMinutes(parsed?.Medium, DEFAULT_VOICE_TIME_LIMITS_MINUTES.Medium),
      Hard: clampVoiceMinutes(parsed?.Hard, DEFAULT_VOICE_TIME_LIMITS_MINUTES.Hard)
    };
  } catch {
    return { ...DEFAULT_VOICE_TIME_LIMITS_MINUTES };
  }
}

export function saveStoredVoiceTimeLimits(limits: Record<DifficultyLevel, number>): Record<DifficultyLevel, number> {
  const sanitized: Record<DifficultyLevel, number> = {
    Easy: clampVoiceMinutes(limits.Easy, DEFAULT_VOICE_TIME_LIMITS_MINUTES.Easy),
    Medium: clampVoiceMinutes(limits.Medium, DEFAULT_VOICE_TIME_LIMITS_MINUTES.Medium),
    Hard: clampVoiceMinutes(limits.Hard, DEFAULT_VOICE_TIME_LIMITS_MINUTES.Hard)
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(VOICE_LIMITS_STORAGE_KEY, JSON.stringify(sanitized));
    } catch {
      // ignore storage errors
    }
  }
  return sanitized;
}

export function clampMinutes(val: unknown, fallback: number): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(60, Math.max(1, Math.round(num)));
}

export function clampVoiceMinutes(val: unknown, fallback: number): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(15, Math.max(1, Math.round(num)));
}

export function getCodingTimeLimitSeconds(
  difficulty: DifficultyLevel = 'Medium',
  customLimits?: Partial<Record<DifficultyLevel, number>>
): number {
  const stored = getStoredCodingTimeLimits();
  const minutes = customLimits?.[difficulty] ?? stored[difficulty] ?? DEFAULT_CODING_TIME_LIMITS_MINUTES[difficulty];
  return clampMinutes(minutes, DEFAULT_CODING_TIME_LIMITS_MINUTES[difficulty]) * 60;
}

export function getVoiceTimeLimitSeconds(
  difficulty: DifficultyLevel = 'Medium',
  customLimits?: Partial<Record<DifficultyLevel, number>>
): number {
  const stored = getStoredVoiceTimeLimits();
  const minutes = customLimits?.[difficulty] ?? stored[difficulty] ?? DEFAULT_VOICE_TIME_LIMITS_MINUTES[difficulty];
  return clampVoiceMinutes(minutes, DEFAULT_VOICE_TIME_LIMITS_MINUTES[difficulty]) * 60;
}

export function getDefaultRoundFormat(domain: string, mode: string): RoundFormat {
  if (mode === 'HR') return 'voice_only';
  if (CODING_CAPABLE_DOMAINS.has(domain)) return 'mixed_coding_voice';
  return 'voice_only';
}
