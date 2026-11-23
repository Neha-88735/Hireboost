import React, { useState, useEffect, useCallback } from 'react';
import { ExternalLink, Globe, Lightbulb, RefreshCw } from 'lucide-react';

interface DailyTipSource {
  title: string;
  uri: string;
}

interface DailyTipData {
  tip: string;
  category: string;
  source: string;
  sources: DailyTipSource[];
  updatedAt: string;
}

interface DailyInterviewTipWidgetProps {
  roleName: string;
  theme: 'dark' | 'light';
}

export const DailyInterviewTipWidget: React.FC<DailyInterviewTipWidgetProps> = ({
  roleName,
  theme
}) => {
  const isDark = theme === 'dark';
  const [tipData, setTipData] = useState<DailyTipData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [variation, setVariation] = useState<number>(0);

  const todayKey = new Date().toISOString().split('T')[0];
  const cacheKey = `hireboost_daily_tip_${todayKey}_${roleName.toLowerCase().replace(/\s+/g, '_')}`;

  const fetchTip = useCallback(
    async (forceRefresh = false, nextVariation = 0) => {
      if (!forceRefresh) {
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const parsed: DailyTipData = JSON.parse(cached);
            if (parsed?.tip) {
              setTipData(parsed);
              setLoading(false);
              return;
            }
          }
        } catch {
          // ignore cache read failures
        }
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({
          role: roleName,
          ...(nextVariation > 0 ? { v: String(nextVariation) } : {})
        });
        const resp = await fetch(`/api/ai/daily-tip?${params.toString()}`);
        if (!resp.ok) throw new Error('Tip fetch failed');
        const json = await resp.json();
        const next: DailyTipData = {
          tip: json.tip,
          category: json.category || `${roleName} Focus`,
          source: json.source || 'curated',
          sources: Array.isArray(json.sources) ? json.sources : [],
          updatedAt: json.updatedAt || todayKey
        };
        setTipData(next);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(next));
        } catch {
          // ignore quota error
        }
      } catch {
        setTipData({
          tip: 'Pause briefly before answering technical questions, outline your core approach first, and state time and space complexity aloud.',
          category: `${roleName} Focus`,
          source: 'curated',
          sources: [],
          updatedAt: todayKey
        });
      } finally {
        setLoading(false);
      }
    },
    [cacheKey, roleName, todayKey]
  );

  useEffect(() => {
    fetchTip(false, 0);
  }, [fetchTip]);

  const handleRefresh = () => {
    const nextVar = variation + 1;
    setVariation(nextVar);
    fetchTip(true, nextVar);
  };

  return (
    <section
      aria-label="Daily Interview Tip"
      className={`rounded-xl border px-4 py-3 transition-colors ${
        isDark
          ? 'bg-linear-to-r from-indigo-950/50 via-slate-900 to-slate-900 border-indigo-500/30'
          : 'bg-linear-to-r from-indigo-50/80 via-white to-white border-indigo-200 shadow-xs'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
              isDark
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : 'bg-amber-100 border-amber-200 text-amber-600'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold tracking-tight">Daily Interview Tip</h2>

              {tipData?.category && (
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                    isDark
                      ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {tipData.category}
                </span>
              )}

              {tipData?.source === 'gemini-search' && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                    isDark
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  <Globe className="w-2.5 h-2.5" />
                  <span>Search Grounded</span>
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-1.5 pt-1">
                <div className={`h-3 w-72 max-w-full rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
                <div className={`h-3 w-48 max-w-full rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
              </div>
            ) : (
              <>
                <p className={`text-xs sm:text-[13px] leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {tipData?.tip}
                </p>

                {tipData?.sources && tipData.sources.length > 0 && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                    <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Sources:
                    </span>
                    {tipData.sources.map((src, idx) => (
                      <a
                        key={`${src.uri}_${idx}`}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold hover:underline max-w-[180px] truncate ${
                          isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
                        }`}
                      >
                        <span className="truncate">{src.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          title="Fetch a fresh interview tip via web search"
          className={`self-start inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors shrink-0 cursor-pointer disabled:opacity-50 ${
            isDark
              ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>New Tip</span>
        </button>
      </div>
    </section>
  );
};
