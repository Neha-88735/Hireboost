import React from 'react';
import {
  Sparkles,
  Bot,
  FileText,
  Target,
  BarChart3,
  CheckCircle2,
  Calendar,
  History,
  Star,
  Users,
  Award,
  ArrowRight
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: string) => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  theme: 'dark' | 'light';
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenAuth,
  theme
}) => {
  const isDark = theme === 'dark';

  const featureCards = [
    {
      title: 'AI Mock Interviews',
      description: 'Practice real technical and HR rounds by voice or text with a live timer.',
      icon: Bot,
      color: 'from-blue-500 to-indigo-600',
      tag: 'Interactive'
    },
    {
      title: 'Custom Questions',
      description: 'Get questions matched to your job goal, topic, and skill level.',
      icon: Target,
      color: 'from-indigo-500 to-purple-600',
      tag: 'Tailored'
    },
    {
      title: 'Instant Feedback',
      description: 'See clear scores for tech skills, speaking, confidence, and tips to improve.',
      icon: Award,
      color: 'from-purple-500 to-pink-600',
      tag: 'Instant Score'
    },
    {
      title: 'Resume Builder',
      description: 'Create clean resumes with AI bullet tips and one-click PDF download.',
      icon: FileText,
      color: 'from-pink-500 to-rose-600',
      tag: 'PDF Ready'
    },
    {
      title: 'Progress Tracking',
      description: 'Watch your scores grow over time and see how close you are to your goal.',
      icon: BarChart3,
      color: 'from-emerald-500 to-teal-600',
      tag: 'Progress'
    },
    {
      title: 'Interview History',
      description: 'Read past transcripts, compare scores, and export notes anytime.',
      icon: History,
      color: 'from-amber-500 to-orange-600',
      tag: 'History'
    }
  ];

  const steps = [
    {
      step: '01',
      title: 'Pick Your Topic',
      description: 'Choose your topic, difficulty, and time limit.'
    },
    {
      step: '02',
      title: 'Start Mock Interview',
      description: 'Answer by voice or text just like a real interview.'
    },
    {
      step: '03',
      title: 'Get Your Score',
      description: 'See your score, strengths, and simple tips right away.'
    },
    {
      step: '04',
      title: 'Track & Improve',
      description: 'Update your resume and watch your progress grow.'
    }
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold mb-6 transition-all shadow-xs backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className={isDark ? 'text-indigo-300' : 'text-indigo-700'}>
              HireBoost AI Platform v2.4 • Gemini Powered
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Your Career.{' '}
            <span className="bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Your Preparation.
            </span>{' '}
            Your Success.
          </h1>

          {/* Subheading */}
          <p className={`mt-6 text-lg sm:text-xl max-w-2xl mx-auto font-normal leading-relaxed ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Prepare smarter, practice interviews, improve your skills, and build a resume that gets noticed.
          </p>

          {/* Prominent Dual Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={() => onNavigate('resume_builder')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm bg-linear-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/35 transition-all flex items-center justify-center space-x-2 group cursor-pointer"
            >
              <FileText className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
              <span>Generate Resume</span>
            </button>

            <button
              onClick={() => onNavigate('book_interview')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 transition-all flex items-center justify-center space-x-2 group cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
              <span>Book an Interview</span>
            </button>
          </div>

          {/* Mini Trust Stats */}
          <div className="mt-12 pt-8 border-t max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center border-slate-800/40">
            <div>
              <p className="text-2xl font-black text-indigo-400">12,500+</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Mock Interviews</p>
            </div>
            <div>
              <p className="text-2xl font-black text-purple-400">94.2%</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Placement Rate</p>
            </div>
            <div>
              <p className="text-2xl font-black text-pink-400">4.9 / 5.0</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Student Rating</p>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-400">&lt; 30s</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>AI Evaluation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features-section" className={`py-16 border-t ${
        isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              All-in-One Prep
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
              Everything You Need to Get Hired
            </h2>
            <p className={`mt-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Practice interviews, check your progress, and build a strong resume.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl border transition-all duration-200 hover:-translate-y-1 ${
                    isDark
                      ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700 shadow-lg shadow-black/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${feat.color} flex items-center justify-center text-white shadow-md`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {feat.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight mb-2">{feat.title}</h3>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How HireBoost Works */}
      <section className={`py-16 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              Simple Steps
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight">How It Works</h2>
            <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Four easy steps to get ready for your next interview.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((st, i) => (
              <div
                key={i}
                className={`relative p-6 rounded-2xl border transition-all ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="text-3xl font-black text-indigo-500/30 mb-3 font-mono">
                  {st.step}
                </div>
                <h3 className="text-base font-bold mb-2">{st.title}</h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {st.description}
                </p>
              </div>
            ))}
          </div>

          {/* Quick CTA Banner */}
          <div className={`mt-14 p-8 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6 ${
            isDark
              ? 'bg-linear-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border-indigo-500/30'
              : 'bg-linear-to-r from-indigo-50 via-purple-50 to-white border-indigo-200'
          }`}>
            <div>
              <h3 className="text-xl font-bold">Ready to practice your first mock interview?</h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Takes less than 2 minutes to configure and start with your target domain.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onNavigate('book_interview')}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center space-x-1.5 cursor-pointer"
              >
                <span>Start Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-8 border-t text-xs ${
        isDark ? 'bg-slate-950 border-slate-900 text-slate-500' : 'bg-white border-slate-200 text-slate-500'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-slate-400">HireBoost Platform</span>
            <span>— AI Mock Interviews & Resume Builder</span>
          </div>
          <div>
            <span>Empowering students & professionals worldwide.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
