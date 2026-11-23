import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code2,
  Compass,
  Cpu,
  Database,
  Flame,
  Globe,
  Info,
  Layers,
  LayoutGrid,
  Lock,
  Network,
  Snowflake,
  Target,
  Users
} from 'lucide-react';
import { StorageService, INTERVIEW_DOMAINS } from '../services/storage';
import { CareerTarget, User } from '../types/hireboost';
import { TargetRoadmapFlowchart } from '../components/TargetRoadmapFlowchart';
import { DailyInterviewTipWidget } from '../components/DailyInterviewTipWidget';
import { getRoadmapForTarget } from '../data/targetRoadmaps';

interface StudentDashboardProps {
  currentUser: User;
  onNavigate: (view: string, extraParam?: string) => void;
  theme: 'dark' | 'light';
}

type DomainCategoryTab = 'all' | 'target' | 'related' | 'systems' | 'ai' | 'behavioral';

const DOMAIN_BRIEFS: Record<string, string> = {
  'Data Structures and Algorithms': 'Arrays, trees, graphs, dynamic programming, and complexity proofs.',
  'C++': 'Pointers, smart pointers, STL containers, OOP, and memory safety.',
  'Java': 'JVM internals, garbage collection, collections, and multithreading.',
  'Python': 'Memory management, GIL concurrency, decorators, and Pythonic patterns.',
  'Web Development': 'Browser rendering, CORS, state architecture, and Core Web Vitals.',
  'Software Engineering': 'System design trade-offs, modularity, testing, and API contracts.',
  'Database Management Systems': 'Indexing, ACID guarantees, query optimization, and schema design.',
  'Operating Systems': 'Processes, threads, scheduling, deadlocks, and virtual memory.',
  'Computer Networks': 'TCP/IP, HTTP lifecycle, DNS resolution, and load balancing.',
  'HR Interview': 'Culture fit, conflict resolution, ownership, and career goals.',
  'Behavioral Interview': 'Structured STAR storytelling, leadership, and ambiguity handling.',
  'Artificial Intelligence': 'Search heuristics, LLM prompting, reasoning pipelines, and evaluation.',
  'Machine Learning': 'Bias-variance trade-offs, regularization, validation, and model serving.'
};

const RELATED_DOMAIN_MAP: Record<string, string[]> = {
  'Data Structures and Algorithms': ['Operating Systems', 'C++', 'Java', 'Database Management Systems'],
  'Software Engineering': ['Database Management Systems', 'Computer Networks', 'Operating Systems', 'Web Development'],
  'Python': ['Database Management Systems', 'Artificial Intelligence', 'Machine Learning', 'Web Development'],
  'Web Development': ['Computer Networks', 'Database Management Systems', 'Behavioral Interview', 'Software Engineering'],
  'Database Management Systems': ['Computer Networks', 'Operating Systems', 'Software Engineering', 'Python'],
  'Operating Systems': ['Computer Networks', 'C++', 'Database Management Systems', 'Software Engineering'],
  'Computer Networks': ['Operating Systems', 'Database Management Systems', 'Web Development', 'Software Engineering'],
  'Artificial Intelligence': ['Database Management Systems', 'Software Engineering', 'Behavioral Interview', 'Python'],
  'Machine Learning': ['Database Management Systems', 'Software Engineering', 'Behavioral Interview', 'Python'],
  'HR Interview': ['Behavioral Interview', 'Software Engineering', 'Web Development', 'Data Structures and Algorithms'],
  'Behavioral Interview': ['HR Interview', 'Software Engineering', 'Data Structures and Algorithms', 'Web Development'],
  'C++': ['Operating Systems', 'Data Structures and Algorithms', 'Computer Networks', 'Software Engineering'],
  'Java': ['Database Management Systems', 'Software Engineering', 'Data Structures and Algorithms', 'Web Development']
};

const DOMAIN_VISUALS: Record<
  string,
  {
    icon: React.FC<{ className?: string }>;
    washLight: string;
    washDark: string;
    iconBgLight: string;
    iconBgDark: string;
    ringColor: string;
    category: Exclude<DomainCategoryTab, 'all' | 'target' | 'related'>;
    topicsCount: number;
  }
> = {
  'Data Structures and Algorithms': {
    icon: Code2,
    washLight: 'from-rose-100/70 via-white to-white',
    washDark: 'from-rose-950/35 via-slate-900 to-slate-900',
    iconBgLight: 'bg-rose-100 text-rose-600 border-rose-200',
    iconBgDark: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    ringColor: 'text-rose-500',
    category: 'systems',
    topicsCount: 4
  },
  'Python': {
    icon: Code2,
    washLight: 'from-indigo-100/70 via-white to-white',
    washDark: 'from-indigo-950/35 via-slate-900 to-slate-900',
    iconBgLight: 'bg-indigo-100 text-indigo-600 border-indigo-200',
    iconBgDark: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    ringColor: 'text-indigo-500',
    category: 'systems',
    topicsCount: 4
  },
  'C++': {
    icon: Cpu,
    washLight: 'from-amber-100/70 via-white to-white',
    washDark: 'from-amber-950/30 via-slate-900 to-slate-900',
    iconBgLight: 'bg-amber-100 text-amber-600 border-amber-200',
    iconBgDark: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    ringColor: 'text-amber-500',
    category: 'systems',
    topicsCount: 4
  },
  'Java': {
    icon: Layers,
    washLight: 'from-orange-100/70 via-white to-white',
    washDark: 'from-orange-950/30 via-slate-900 to-slate-900',
    iconBgLight: 'bg-orange-100 text-orange-600 border-orange-200',
    iconBgDark: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    ringColor: 'text-orange-500',
    category: 'systems',
    topicsCount: 4
  },
  'Web Development': {
    icon: Globe,
    washLight: 'from-sky-100/70 via-white to-white',
    washDark: 'from-sky-950/35 via-slate-900 to-slate-900',
    iconBgLight: 'bg-sky-100 text-sky-600 border-sky-200',
    iconBgDark: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    ringColor: 'text-sky-500',
    category: 'systems',
    topicsCount: 4
  },
  'Software Engineering': {
    icon: Layers,
    washLight: 'from-violet-100/70 via-white to-white',
    washDark: 'from-violet-950/35 via-slate-900 to-slate-900',
    iconBgLight: 'bg-violet-100 text-violet-600 border-violet-200',
    iconBgDark: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    ringColor: 'text-violet-500',
    category: 'systems',
    topicsCount: 4
  },
  'Database Management Systems': {
    icon: Database,
    washLight: 'from-emerald-100/70 via-white to-white',
    washDark: 'from-emerald-950/30 via-slate-900 to-slate-900',
    iconBgLight: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    iconBgDark: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    ringColor: 'text-emerald-500',
    category: 'systems',
    topicsCount: 4
  },
  'Operating Systems': {
    icon: Cpu,
    washLight: 'from-amber-100/70 via-white to-white',
    washDark: 'from-amber-950/30 via-slate-900 to-slate-900',
    iconBgLight: 'bg-amber-100 text-amber-600 border-amber-200',
    iconBgDark: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    ringColor: 'text-amber-500',
    category: 'systems',
    topicsCount: 4
  },
  'Computer Networks': {
    icon: Network,
    washLight: 'from-cyan-100/70 via-white to-white',
    washDark: 'from-cyan-950/30 via-slate-900 to-slate-900',
    iconBgLight: 'bg-cyan-100 text-cyan-600 border-cyan-200',
    iconBgDark: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    ringColor: 'text-cyan-500',
    category: 'systems',
    topicsCount: 4
  },
  'Artificial Intelligence': {
    icon: BrainCircuit,
    washLight: 'from-purple-100/70 via-white to-white',
    washDark: 'from-purple-950/35 via-slate-900 to-slate-900',
    iconBgLight: 'bg-purple-100 text-purple-600 border-purple-200',
    iconBgDark: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    ringColor: 'text-purple-500',
    category: 'ai',
    topicsCount: 4
  },
  'Machine Learning': {
    icon: BrainCircuit,
    washLight: 'from-fuchsia-100/70 via-white to-white',
    washDark: 'from-fuchsia-950/30 via-slate-900 to-slate-900',
    iconBgLight: 'bg-fuchsia-100 text-fuchsia-600 border-fuchsia-200',
    iconBgDark: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30',
    ringColor: 'text-fuchsia-500',
    category: 'ai',
    topicsCount: 4
  },
  'HR Interview': {
    icon: Users,
    washLight: 'from-teal-100/70 via-white to-white',
    washDark: 'from-teal-950/30 via-slate-900 to-slate-900',
    iconBgLight: 'bg-teal-100 text-teal-600 border-teal-200',
    iconBgDark: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    ringColor: 'text-teal-500',
    category: 'behavioral',
    topicsCount: 4
  },
  'Behavioral Interview': {
    icon: BookOpen,
    washLight: 'from-pink-100/70 via-white to-white',
    washDark: 'from-pink-950/30 via-slate-900 to-slate-900',
    iconBgLight: 'bg-pink-100 text-pink-600 border-pink-200',
    iconBgDark: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    ringColor: 'text-pink-500',
    category: 'behavioral',
    topicsCount: 4
  }
};

const QUEST_TIERS = [
  { id: 'rookie', label: 'Starter', threshold: 15, accent: 'from-rose-400 to-orange-500', halo: 'ring-4 ring-rose-500/15' },
  { id: 'solver', label: 'Builder', threshold: 35, accent: 'from-slate-400 to-slate-500', halo: 'ring-4 ring-slate-400/15' },
  { id: 'challenger', label: 'Challenger', threshold: 55, accent: 'from-amber-400 to-yellow-500', halo: 'ring-4 ring-amber-500/20' },
  { id: 'specialist', label: 'Specialist', threshold: 75, accent: 'from-sky-400 to-indigo-500', halo: 'ring-4 ring-sky-500/20' },
  { id: 'ready', label: 'Ready', threshold: 90, accent: 'from-indigo-500 to-purple-500', halo: 'ring-4 ring-indigo-500/20' }
];

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  onNavigate,
  theme
}) => {
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<DomainCategoryTab>('all');
  const [showAllRelated, setShowAllRelated] = useState(false);
  const [showStreakInfo, setShowStreakInfo] = useState(false);
  const [showQuestInfo, setShowQuestInfo] = useState(false);
  const [streakMonth, setStreakMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const profile = StorageService.getUserProfile(currentUser.userId);
  const activeTarget = StorageService.getActiveTarget(currentUser.userId);
  const targetSummaries = StorageService.getTargetProgressSummaries(currentUser.userId);
  const userSessions = StorageService.getUserSessions(currentUser.userId);
  const streak = StorageService.getInterviewStreak(currentUser.userId);

  const [displayedRoadmapTarget, setDisplayedRoadmapTarget] = useState<CareerTarget>(activeTarget);
  const [requestedStage, setRequestedStage] = useState<
    { targetId: string; stepNumber: string | null; trigger: number } | undefined
  >(undefined);

  const completedSessions = userSessions.filter(s => s.status === 'Completed');

  const focusDomains =
    activeTarget.focusDomains && activeTarget.focusDomains.length > 0
      ? activeTarget.focusDomains
      : ['Data Structures and Algorithms', 'Python', 'Web Development', 'HR Interview'];

  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    completedSessions.forEach(s => {
      counts[s.config.domain] = (counts[s.config.domain] || 0) + 1;
    });
    return counts;
  }, [completedSessions]);

  const roadmapCheckedIds = useMemo(() => {
    return new Set<string>(
      StorageService.syncCompletedSessionsToRoadmap(currentUser.userId, activeTarget)
    );
  }, [currentUser.userId, activeTarget]);

  const activeRoadmap = useMemo(() => getRoadmapForTarget(activeTarget), [activeTarget]);

  const handleTopicCardClick = (domain: string) => {
    const { target: nextTarget, stepNumber } = StorageService.getRespectiveTargetForDomain(
      currentUser.userId,
      domain
    );

    setDisplayedRoadmapTarget(nextTarget);
    setRequestedStage({
      targetId: nextTarget.targetId,
      stepNumber,
      trigger: Date.now()
    });

    setTimeout(() => {
      document.getElementById('career-roadmap-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 40);
  };

  const getDomainCompletionPct = (domain: string) => {
    const matchingMilestones = activeRoadmap.phases
      .flatMap(p => p.milestones)
      .filter(m => m.interviewDomain === domain);
    const sessionsInDomain = domainCounts[domain] || 0;

    if (matchingMilestones.length > 0) {
      const checkedCount = matchingMilestones.filter(m => roadmapCheckedIds.has(m.id)).length;
      const topicRatio = checkedCount / matchingMilestones.length;
      const sessionBoost = Math.min(0.4, sessionsInDomain * 0.2);
      return Math.min(100, Math.round((topicRatio * 0.6 + sessionBoost) * 100));
    }

    return Math.min(100, sessionsInDomain * 25);
  };

  const unpracticedDomain = focusDomains.find(d => !domainCounts[d]);
  const leastPracticedDomain = [...focusDomains].sort(
    (a, b) => (domainCounts[a] || 0) - (domainCounts[b] || 0)
  )[0];
  const recommendedDomain = unpracticedDomain || leastPracticedDomain || focusDomains[0];

  const nextIncompleteMilestone = useMemo(() => {
    const all = activeRoadmap.phases.flatMap(p => p.milestones);
    return all.find(m => !roadmapCheckedIds.has(m.id)) || all[0];
  }, [activeRoadmap, roadmapCheckedIds]);

  const relatedTargetDomains = useMemo(() => {
    const picked = new Map<string, string>();
    const activeFocusSet = new Set(focusDomains);
    const normalizedSkills = profile.skills.map(s => s.toLowerCase());

    const languageDomains = new Set(['Python', 'C++', 'Java']);
    const badgeFor = (dom: string, fallback: string) =>
      languageDomains.has(dom) ? 'Language roadmap' : fallback;

    for (const summary of targetSummaries) {
      if (summary.target.targetId === activeTarget.targetId) continue;
      for (const dom of summary.target.focusDomains || []) {
        if (!activeFocusSet.has(dom) && !picked.has(dom)) {
          picked.set(dom, badgeFor(dom, 'Topic roadmap'));
        }
      }
    }

    for (const sourceDomain of focusDomains) {
      const neighbors = RELATED_DOMAIN_MAP[sourceDomain] || [];
      for (const neighbor of neighbors) {
        if (!activeFocusSet.has(neighbor) && !picked.has(neighbor)) {
          const skillMatch = normalizedSkills.some(
            sk => neighbor.toLowerCase().includes(sk) || sk.includes(neighbor.toLowerCase())
          );
          picked.set(
            neighbor,
            badgeFor(neighbor, skillMatch ? 'Matches your skills' : 'Topic roadmap')
          );
        }
      }
    }

    for (const d of INTERVIEW_DOMAINS) {
      if (picked.size >= 4) break;
      if (d !== 'Custom Topic' && !activeFocusSet.has(d) && !picked.has(d)) {
        picked.set(d, badgeFor(d, 'Topic roadmap'));
      }
    }

    return Array.from(picked.entries())
      .slice(0, 4)
      .map(([domain, relation]) => ({ domain, relation }));
  }, [focusDomains, targetSummaries, activeTarget.targetId, profile.skills]);

  const calendarMeta = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const year = streakMonth.getFullYear();
    const month = streakMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Monday = 0 ... Sunday = 6
    const leadingEmpty = (firstDayOfMonth.getDay() + 6) % 7;

    const monthLabel = firstDayOfMonth
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      .toUpperCase();

    const freezeSet = new Set(streak.freezeDates || []);
    const cells: Array<
      | { empty: true; key: string }
      | {
          empty: false;
          key: string;
          dayNum: number;
          dateKey: string;
          isToday: boolean;
          isFuture: boolean;
          achievedCount: number;
          isFreeze: boolean;
        }
    > = [];

    for (let i = 0; i < leadingEmpty; i++) {
      cells.push({ empty: true, key: `empty_${i}` });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${pad(month + 1)}-${pad(day)}`;
      cells.push({
        empty: false,
        key: dateKey,
        dayNum: day,
        dateKey,
        isToday: dateKey === todayKey,
        isFuture: dateKey > todayKey,
        achievedCount: streak.countsByDate?.[dateKey] || 0,
        isFreeze: freezeSet.has(dateKey)
      });
    }

    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
    return { monthLabel, cells, isCurrentMonth };
  }, [streakMonth, streak.countsByDate, streak.freezeDates]);

  const activeSummary = useMemo(
    () => targetSummaries.find(s => s.target.targetId === activeTarget.targetId) || targetSummaries[0],
    [targetSummaries, activeTarget.targetId]
  );

  const roadmapStats = useMemo(() => {
    const allMilestones = activeRoadmap.phases.flatMap(p => p.milestones);
    const total = allMilestones.length;
    const done = allMilestones.filter(m => roadmapCheckedIds.has(m.id)).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, pct };
  }, [activeRoadmap, roadmapCheckedIds]);

  const targetInterviewCount = activeSummary?.sessionCount ?? 0;
  const scoreReadinessPct = activeSummary?.readinessPercentage ?? 0;
  const overallReadinessPct =
    targetInterviewCount > 0
      ? Math.min(100, Math.round(scoreReadinessPct * 0.6 + roadmapStats.pct * 0.4))
      : 0;

  const nextQuestTier = QUEST_TIERS.find(t => overallReadinessPct < t.threshold);
  const remainingReadinessPct = nextQuestTier ? nextQuestTier.threshold - overallReadinessPct : 0;

  const questTrackFillPct = useMemo(() => {
    const lastIdx = QUEST_TIERS.length - 1;
    if (overallReadinessPct <= QUEST_TIERS[0].threshold) return 0;
    if (overallReadinessPct >= QUEST_TIERS[lastIdx].threshold) return 100;
    for (let i = 0; i < lastIdx; i++) {
      const start = QUEST_TIERS[i].threshold;
      const end = QUEST_TIERS[i + 1].threshold;
      if (overallReadinessPct < end) {
        const segmentRatio = (overallReadinessPct - start) / Math.max(1, end - start);
        return Math.round(((i + segmentRatio) / lastIdx) * 100);
      }
    }
    return 100;
  }, [overallReadinessPct]);

  const filteredSystemsOrCategory = useMemo(() => {
    const allClean = INTERVIEW_DOMAINS.filter(d => d !== 'Custom Topic');
    if (activeTab === 'systems') {
      return allClean.filter(d => DOMAIN_VISUALS[d]?.category === 'systems');
    }
    if (activeTab === 'ai') {
      return allClean.filter(d => DOMAIN_VISUALS[d]?.category === 'ai');
    }
    if (activeTab === 'behavioral') {
      return allClean.filter(d => DOMAIN_VISUALS[d]?.category === 'behavioral');
    }
    return [];
  }, [activeTab]);

  const renderDomainCard = (domain: string, relationBadge?: string) => {
    const visual = DOMAIN_VISUALS[domain] || {
      icon: BookOpen,
      washLight: 'from-indigo-100/70 via-white to-white',
      washDark: 'from-indigo-950/35 via-slate-900 to-slate-900',
      iconBgLight: 'bg-indigo-100 text-indigo-600 border-indigo-200',
      iconBgDark: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      ringColor: 'text-indigo-500',
      topicsCount: 4
    };
    const Icon = visual.icon;
    const pct = getDomainCompletionPct(domain);
    const radius = 10;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (pct / 100) * circumference;
    const roundCount = domainCounts[domain] || 0;

    return (
      <button
        key={domain}
        type="button"
        onClick={() => handleTopicCardClick(domain)}
        title={DOMAIN_BRIEFS[domain] || 'Jump to roadmap topics & interviews'}
        className={`group rounded-xl border p-3.5 text-left transition-all duration-150 cursor-pointer flex flex-col justify-between gap-2.5 bg-linear-to-br ${
          isDark
            ? `${visual.washDark} border-slate-800 hover:border-indigo-500/60`
            : `${visual.washLight} border-slate-200 hover:border-indigo-300 shadow-xs`
        }`}
      >
        <div className="flex items-start justify-between gap-2.5">
          <div
            className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
              isDark ? visual.iconBgDark : visual.iconBgLight
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <svg className="w-6 h-6 -rotate-90" viewBox="0 0 28 28" aria-hidden="true">
              <circle
                cx="14"
                cy="14"
                r={radius}
                fill="none"
                strokeWidth="2.75"
                className={isDark ? 'stroke-slate-800' : 'stroke-slate-200'}
              />
              <circle
                cx="14"
                cy="14"
                r={radius}
                fill="none"
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className={`stroke-current ${visual.ringColor} transition-all duration-300`}
              />
            </svg>
            <span className={`text-[11px] font-semibold font-mono tabular-nums ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {pct}%
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-bold leading-snug truncate group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
            {domain}
          </h3>

          <div
            className={`flex items-center justify-between gap-2 text-[11px] tabular-nums ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1">
                <BookOpen className="w-3 h-3 opacity-80" />
                <span>{visual.topicsCount} Topics</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Layers className="w-3 h-3 opacity-80" />
                <span>{roundCount} {roundCount === 1 ? 'Round' : 'Rounds'}</span>
              </span>
            </div>

            {relationBadge && (
              <span className={`truncate font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                {relationBadge}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  const visibleRelatedDomains =
    activeTab === 'all' && !showAllRelated
      ? relatedTargetDomains.slice(0, 2)
      : relatedTargetDomains;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
      {/* Row 1: Category Tabs + Topic Cards */}
      <div className="space-y-3.5">
        {/* Underline Category Filter Tabs */}
        <div
          className={`flex items-center gap-5 overflow-x-auto border-b ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          {[
            { id: 'all' as DomainCategoryTab, label: 'All', icon: LayoutGrid },
            { id: 'target' as DomainCategoryTab, label: activeTarget.roleName, icon: Target },
            { id: 'related' as DomainCategoryTab, label: 'Related', icon: Compass },
            { id: 'systems' as DomainCategoryTab, label: 'Coding & CS', icon: Code2 },
            { id: 'ai' as DomainCategoryTab, label: 'AI & ML', icon: BrainCircuit },
            { id: 'behavioral' as DomainCategoryTab, label: 'HR & Soft Skills', icon: Users }
          ].map((tab) => {
            const active = activeTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2.5 flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                  active
                    ? isDark
                      ? 'border-indigo-400 text-indigo-400'
                      : 'border-indigo-600 text-indigo-600'
                    : isDark
                      ? 'border-transparent text-slate-400 hover:text-slate-200'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Target Domains */}
        {(activeTab === 'all' || activeTab === 'target') && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold tracking-tight">
                {activeTarget.roleName} ({focusDomains.length})
              </h2>
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Main topics
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {focusDomains.map((domain) => renderDomainCard(domain))}
            </div>
          </section>
        )}

        {/* Related Domains with "View More" Toggle */}
        {(activeTab === 'all' || activeTab === 'related') && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold tracking-tight">
                Related Topics ({relatedTargetDomains.length})
              </h2>

              {activeTab === 'all' && relatedTargetDomains.length > 2 && (
                <button
                  type="button"
                  onClick={() => setShowAllRelated(v => !v)}
                  className={`inline-flex items-center gap-1 text-xs font-semibold cursor-pointer transition-colors ${
                    isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
                  }`}
                >
                  <span>{showAllRelated ? 'Show Less' : 'View More'}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${
                      showAllRelated ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              )}
            </div>

            <div
              className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${
                showAllRelated || activeTab === 'related' ? 'lg:grid-cols-4' : ''
              }`}
            >
              {visibleRelatedDomains.map(({ domain, relation }) =>
                renderDomainCard(domain, relation)
              )}
            </div>
          </section>
        )}

        {/* Filtered Category View */}
        {(activeTab === 'systems' || activeTab === 'ai' || activeTab === 'behavioral') && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold tracking-tight">
                {activeTab === 'systems'
                  ? 'Coding & CS'
                  : activeTab === 'ai'
                    ? 'AI & ML'
                    : 'HR & Soft Skills'}{' '}
                ({filteredSystemsOrCategory.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {filteredSystemsOrCategory.map((domain) =>
                renderDomainCard(
                  domain,
                  focusDomains.includes(domain) ? 'Active' : undefined
                )
              )}
            </div>
          </section>
        )}
      </div>

      {/* Daily Search-Grounded Interview Tip Widget */}
      <DailyInterviewTipWidget roleName={activeTarget.roleName} theme={theme} />

      {/* Row 2: Readiness Quest & Compact Streak Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
        {/* 1. Readiness Quest Milestone Card */}
        <section
          className={`md:col-span-7 rounded-xl border overflow-hidden flex flex-col justify-between ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="p-4 space-y-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold tracking-tight">Readiness Quest</h2>
                  <span className="font-mono text-xs font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                    {overallReadinessPct}% Ready
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowQuestInfo(v => !v)}
                    aria-label="How Readiness Quest works"
                    className={`p-0.5 rounded-full transition-colors cursor-pointer ${
                      isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {activeTarget.roleName} · Target {activeTarget.targetScore}%
                </p>
              </div>
              <button
                type="button"
                title={
                  nextIncompleteMilestone
                    ? `Next: ${nextIncompleteMilestone.interviewTitle}`
                    : 'Practice next interview'
                }
                onClick={() =>
                  nextIncompleteMilestone
                    ? onNavigate('roadmap_interview', `${activeTarget.targetId}::${nextIncompleteMilestone.id}`)
                    : onNavigate('book_interview', recommendedDomain)
                }
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition-colors whitespace-nowrap shrink-0"
              >
                Practice
              </button>
            </div>

            {showQuestInfo && (
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Readiness blends your score vs. {activeTarget.targetScore}% target (60%) and {activeTarget.roleName} roadmap coverage (40%).
              </p>
            )}

            {/* Verified Readiness Breakdown Row */}
            <div
              className={`grid grid-cols-3 gap-2 rounded-lg border px-3 py-2 text-center ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/90 border-slate-200/80'
              }`}
            >
              <div>
                <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Score vs Goal
                </div>
                <div className="text-xs font-bold font-mono tabular-nums">
                  {targetInterviewCount > 0 ? `${activeSummary?.avgScore ?? 0}%` : '—'}{' '}
                  <span className={`font-normal text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    / {activeTarget.targetScore}%
                  </span>
                </div>
              </div>
              <div className={`border-x ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Roadmap
                </div>
                <div className="text-xs font-bold font-mono tabular-nums">
                  {roadmapStats.done}/{roadmapStats.total}{' '}
                  <span className={`font-normal text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    ({roadmapStats.pct}%)
                  </span>
                </div>
              </div>
              <div>
                <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Goal Rounds
                </div>
                <div className="text-xs font-bold font-mono tabular-nums">
                  {targetInterviewCount}
                </div>
              </div>
            </div>

            {/* Connected Milestone Nodes with Accurate Track Fill */}
            <div className="relative flex items-start justify-between pt-1">
              <div
                aria-hidden="true"
                className={`absolute top-5 -translate-y-1/2 left-7 right-7 h-1 rounded-full overflow-hidden ${
                  isDark ? 'bg-slate-800' : 'bg-slate-200'
                }`}
              >
                <div
                  className="h-full bg-linear-to-r from-rose-400 via-amber-400 to-indigo-500 transition-all duration-500"
                  style={{ width: `${questTrackFillPct}%` }}
                />
              </div>

              {QUEST_TIERS.map((tier, idx) => {
                const unlocked = overallReadinessPct >= tier.threshold;
                const isCurrent =
                  !unlocked && (idx === 0 || overallReadinessPct >= QUEST_TIERS[idx - 1].threshold);

                return (
                  <div key={tier.id} className="relative z-10 flex flex-col items-center gap-1 w-14">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${tier.halo} ${
                        unlocked
                          ? `bg-linear-to-br ${tier.accent} text-white shadow-xs`
                          : isCurrent
                            ? `bg-linear-to-br ${tier.accent} opacity-90 text-white`
                            : isDark
                              ? 'bg-slate-800 text-slate-300'
                              : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {unlocked ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3" />}
                    </div>

                    <span
                      className={`text-[10px] font-semibold text-center leading-tight ${
                        unlocked || isCurrent
                          ? isDark
                            ? 'text-slate-100'
                            : 'text-slate-900'
                          : isDark
                            ? 'text-slate-400'
                            : 'text-slate-500'
                      }`}
                    >
                      {tier.label}
                    </span>

                    <span
                      className={`text-[9px] font-mono tabular-nums ${
                        isCurrent
                          ? 'px-1.5 py-0.5 rounded-md font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                          : isDark
                            ? 'text-slate-500'
                            : 'text-slate-400'
                      }`}
                    >
                      {isCurrent ? `${overallReadinessPct}/${tier.threshold}%` : `${tier.threshold}%`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className={`px-4 py-2 border-t text-[11px] font-medium text-center ${
              isDark
                ? 'bg-slate-950/60 border-slate-800 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            {targetInterviewCount === 0 ? (
              <span>
                Complete your first <strong>{activeTarget.roleName}</strong> interview to unlock{' '}
                <strong>Starter ({QUEST_TIERS[0].threshold}%)</strong>
              </span>
            ) : nextQuestTier ? (
              <span>
                Need <strong className="tabular-nums">+{remainingReadinessPct}%</strong> readiness to unlock{' '}
                <strong>{nextQuestTier.label}</strong> ({nextQuestTier.threshold}%)
              </span>
            ) : (
              <span>Interview Ready for {activeTarget.roleName} — all badges unlocked</span>
            )}
          </div>
        </section>

        {/* 2. Compact Streak Card */}
        <section
          id="streak-calendar-card"
          className={`md:col-span-5 rounded-xl border overflow-hidden flex flex-col justify-between ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          {/* Compact Card Header */}
          <div
            className={`px-3.5 py-2 border-b flex items-center justify-between gap-2 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold tracking-tight">Streak</h2>
              <button
                type="button"
                onClick={() => setShowStreakInfo(v => !v)}
                aria-label="How interview streaks work"
                title="Do 1 interview a day to grow your streak."
                className={`p-0.5 rounded-full transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-semibold tabular-nums">
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500/20" />
              <span className={isDark ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}>
                Max:
              </span>
              <span className={`font-mono font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {String(streak.longestStreak).padStart(2, '0')}
              </span>
            </div>
          </div>

          {showStreakInfo && (
            <div
              className={`px-3.5 py-1.5 border-b text-[11px] ${
                isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              Do 1 interview a day to grow your streak. Now:{' '}
              <strong className="font-mono">{String(streak.currentStreak).padStart(2, '0')}</strong>{' '}
              {streak.currentStreak === 1 ? 'day' : 'days'}.
            </div>
          )}

          {/* Compact Calendar Grid */}
          <div className="px-3 py-2 space-y-1">
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() =>
                  setStreakMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                }
                className={`p-0.5 rounded-md transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="text-[11px] font-bold tracking-wide">
                {calendarMeta.monthLabel}
              </span>

              <button
                type="button"
                aria-label="Next month"
                disabled={calendarMeta.isCurrentMonth}
                onClick={() =>
                  setStreakMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                }
                className={`p-0.5 rounded-md transition-colors ${
                  calendarMeta.isCurrentMonth
                    ? 'opacity-30 cursor-not-allowed text-slate-400'
                    : isDark
                      ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-100 cursor-pointer'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer'
                }`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className={`grid grid-cols-7 text-center text-[9px] font-semibold ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((wd, idx) => (
                <div key={idx}>{wd}</div>
              ))}
            </div>

            {/* Compact Day Cells */}
            <div className="grid grid-cols-7 gap-y-0.5 text-center">
              {calendarMeta.cells.map((cell) => {
                if (cell.empty) {
                  return <div key={cell.key} className="h-5" />;
                }

                const isAchieved = cell.achievedCount > 0;
                const tooltip = isAchieved
                  ? `${cell.dateKey}: ${cell.achievedCount} ${cell.achievedCount === 1 ? 'interview' : 'interviews'}`
                  : cell.isFreeze
                    ? `${cell.dateKey}: Freeze`
                    : cell.isToday
                      ? `${cell.dateKey}: Today`
                      : cell.dateKey;

                let circleClasses = '';
                if (cell.isToday && isAchieved) {
                  circleClasses =
                    'border border-emerald-500 bg-orange-500/20 text-orange-500 dark:text-orange-400 font-bold';
                } else if (isAchieved) {
                  circleClasses =
                    'bg-orange-500/15 border border-orange-500/50 text-orange-600 dark:text-orange-400 font-bold';
                } else if (cell.isFreeze) {
                  circleClasses =
                    'bg-sky-500/15 border border-sky-500/40 text-sky-600 dark:text-sky-400 font-semibold';
                } else if (cell.isToday) {
                  circleClasses =
                    'border border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold';
                } else if (cell.isFuture) {
                  circleClasses = isDark ? 'text-slate-600' : 'text-slate-400';
                } else {
                  circleClasses = isDark ? 'text-slate-300' : 'text-slate-700';
                }

                return (
                  <div key={cell.key} className="flex items-center justify-center">
                    <span
                      title={tooltip}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono tabular-nums transition-colors ${circleClasses}`}
                    >
                      {cell.dayNum}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compact Footer Legend */}
          <div
            className={`px-3.5 py-1.5 border-t flex items-center justify-between gap-2 text-[10px] ${
              isDark ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center gap-1">
              <Flame className="w-2.5 h-2.5 text-orange-500 fill-orange-500/30 shrink-0" />
              <span>Achieved</span>
            </div>
            <div className="flex items-center gap-1">
              <Snowflake className="w-2.5 h-2.5 text-sky-500 shrink-0" />
              <span>Freeze</span>
            </div>
            <div className="flex items-center gap-1">
              <span
                aria-hidden="true"
                className="w-2 h-2 rounded-full bg-emerald-500/25 border border-emerald-500 shrink-0"
              />
              <span>Today</span>
            </div>
          </div>
        </section>
      </div>

      {/* Full-Width Career Preparation Roadmap with Interactive Stage Dropdowns at the End */}
      <TargetRoadmapFlowchart
        userId={currentUser.userId}
        activeTarget={displayedRoadmapTarget}
        requestedStage={requestedStage}
        resetToRoleName={
          displayedRoadmapTarget.targetId !== activeTarget.targetId
            ? activeTarget.roleName
            : undefined
        }
        onResetTarget={() => {
          setDisplayedRoadmapTarget(activeTarget);
          setRequestedStage(undefined);
        }}
        onPracticeTopicInterview={(milestone) =>
          onNavigate('roadmap_interview', `${displayedRoadmapTarget.targetId}::${milestone.id}`)
        }
        theme={theme}
      />
    </div>
  );
};
