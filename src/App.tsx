import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storage';
import { User, InterviewSession, DifficultyLevel } from './types/hireboost';
import { Navbar } from './components/Navbar';
import { WorkspaceShell } from './components/WorkspaceShell';
import { TargetManagerModal } from './components/TargetManagerModal';
import { LandingPage } from './pages/LandingPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { UserProfilePage } from './pages/UserProfilePage';
import { InterviewBookingPage } from './pages/InterviewBookingPage';
import { RoadmapInterviewPage } from './pages/RoadmapInterviewPage';
import { InterviewSessionPage } from './pages/InterviewSessionPage';
import { PerformanceEvaluationPage } from './pages/PerformanceEvaluationPage';
import { TranscriptPage } from './pages/TranscriptPage';
import { ProgressTrackerPage } from './pages/ProgressTrackerPage';
import { ResumeBuilderPage } from './pages/ResumeBuilderPage';
import { UserFeedbackPage } from './pages/UserFeedbackPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthModal } from './pages/AuthModal';

export default function App() {
  // Theme state persisted in storage
  const [theme, setTheme] = useState<'dark' | 'light'>(() => StorageService.getTheme());

  // User state: starts with default authenticated student for immediate engagement
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageService.getCurrentUser());

  // Active parameter pointers for subviews (restores active interview across page refresh)
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(() => {
    if (!currentUser) return null;
    const savedId = StorageService.getActiveSessionId();
    if (!savedId) return null;
    const found = StorageService.getSessionById(savedId);
    if (found && found.userId === currentUser.userId && found.status !== 'Completed') {
      return found;
    }
    StorageService.setActiveSessionId(null);
    return null;
  });

  // Navigation & View routing
  const [currentView, setCurrentView] = useState<string>(() => {
    if (!currentUser) return 'landing';
    const savedId = StorageService.getActiveSessionId();
    if (savedId) {
      const found = StorageService.getSessionById(savedId);
      if (found && found.userId === currentUser.userId && found.status !== 'Completed') {
        return 'interview_session';
      }
    }
    return 'dashboard';
  });
  const [activeReportId, setActiveReportId] = useState<string>('rep_004');
  const [activeTranscriptId, setActiveTranscriptId] = useState<string>('tr_004');
  const [activeFeedbackSessionId, setActiveFeedbackSessionId] = useState<string | undefined>(undefined);
  const [bookingPresetDomain, setBookingPresetDomain] = useState<string | undefined>(undefined);
  const [bookingPresetDifficulty, setBookingPresetDifficulty] = useState<DifficultyLevel | undefined>(undefined);
  const [bookingPresetMilestoneId, setBookingPresetMilestoneId] = useState<string | undefined>(undefined);
  const [activeRoadmapTargetId, setActiveRoadmapTargetId] = useState<string | undefined>(undefined);
  const [activeRoadmapMilestoneId, setActiveRoadmapMilestoneId] = useState<string | undefined>(undefined);

  // Auth Modal state
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  // Shared Career Target state for WorkspaceShell + StudentDashboard sync
  const [targetRefreshTick, setTargetRefreshTick] = useState<number>(0);
  const [targetModalOpen, setTargetModalOpen] = useState<boolean>(false);

  // Sync theme with HTML root class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    StorageService.setTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'Admin') {
      setCurrentView('admin_dashboard');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    StorageService.logout();
    setActiveSession(null);
    setCurrentUser(null);
    setCurrentView('landing');
  };

  const handleSwitchRole = (role: 'Student' | 'Admin') => {
    const user = StorageService.loginDemoUser(role);
    StorageService.setActiveSessionId(null);
    setActiveSession(null);
    setCurrentUser(user);
    if (role === 'Admin') {
      setCurrentView('admin_dashboard');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleNavigate = (view: string, extraParam?: string) => {
    if (view === 'performance_evaluation' && extraParam) {
      setActiveReportId(extraParam);
    } else if (view === 'transcript' && extraParam) {
      setActiveTranscriptId(extraParam);
    } else if (view === 'submit_feedback') {
      setActiveFeedbackSessionId(extraParam);
      setCurrentView('feedback_public');
      return;
    } else if (view === 'feedback_public') {
      setActiveFeedbackSessionId(undefined);
    } else if (view === 'interview_history') {
      setCurrentView('progress_tracker');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    } else if (view === 'book_interview') {
      if (extraParam && extraParam.includes('::')) {
        const [dom, diff, msId] = extraParam.split('::');
        setBookingPresetDomain(dom);
        setBookingPresetDifficulty((diff as DifficultyLevel) || undefined);
        setBookingPresetMilestoneId(msId || undefined);
      } else {
        setBookingPresetDomain(extraParam);
        setBookingPresetDifficulty(undefined);
        setBookingPresetMilestoneId(undefined);
      }
    } else if (view === 'roadmap_interview' && extraParam) {
      const [tId, mId] = extraParam.split('::');
      setActiveRoadmapTargetId(tId || undefined);
      setActiveRoadmapMilestoneId(mId || undefined);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartSession = (session: InterviewSession) => {
    StorageService.setActiveSessionId(session.sessionId);
    setActiveSession(session);
    setCurrentView('interview_session');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinishSession = (completedSession: InterviewSession) => {
    StorageService.setActiveSessionId(null);
    setActiveSession(null);
    if (completedSession.evaluationReportId) {
      setActiveReportId(completedSession.evaluationReportId);
      setCurrentView('performance_evaluation');
    } else {
      setCurrentView('dashboard');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const useWorkspaceShell = Boolean(
    currentUser && currentView !== 'landing' && currentView !== 'interview_session'
  );

  // Read live target & streak for shell chrome
  const shellActiveTarget = currentUser ? StorageService.getActiveTarget(currentUser.userId) : null;
  const shellTargetSummaries = currentUser
    ? StorageService.getTargetProgressSummaries(currentUser.userId)
    : [];
  const shellStreak = currentUser ? StorageService.getInterviewStreak(currentUser.userId) : null;

  const handleShellTargetSwitch = (targetId: string) => {
    if (!currentUser) return;
    StorageService.setActiveTarget(currentUser.userId, targetId);
    setTargetRefreshTick(t => t + 1);
  };

  const renderActiveRoute = () => (
    <>
      {currentView === 'landing' && (
        <LandingPage
          onNavigate={handleNavigate}
          onOpenAuth={handleOpenAuth}
          theme={theme}
        />
      )}

      {currentView === 'dashboard' && currentUser && (
        <StudentDashboard
          key={`dash_${currentUser.userId}_${targetRefreshTick}`}
          currentUser={currentUser}
          onNavigate={handleNavigate}
          theme={theme}
        />
      )}

      {currentView === 'profile' && currentUser && (
        <UserProfilePage
          currentUser={currentUser}
          onProfileUpdated={(updated) => setCurrentUser(updated)}
          theme={theme}
        />
      )}

      {currentView === 'book_interview' && currentUser && (
        <InterviewBookingPage
          currentUser={currentUser}
          initialDomain={bookingPresetDomain}
          initialDifficulty={bookingPresetDifficulty}
          initialMilestoneId={bookingPresetMilestoneId}
          onStartSession={handleStartSession}
          onNavigate={handleNavigate}
          theme={theme}
        />
      )}

      {currentView === 'roadmap_interview' && currentUser && (
        <RoadmapInterviewPage
          key={`rm_${activeRoadmapTargetId || 'active'}_${activeRoadmapMilestoneId || 'default'}`}
          currentUser={currentUser}
          targetId={activeRoadmapTargetId}
          milestoneId={activeRoadmapMilestoneId}
          onStartSession={handleStartSession}
          onNavigate={handleNavigate}
          theme={theme}
        />
      )}

      {currentView === 'interview_session' && activeSession && (
        <InterviewSessionPage
          session={activeSession}
          onFinishSession={handleFinishSession}
          onExit={() => {
            StorageService.setActiveSessionId(null);
            setActiveSession(null);
            setCurrentView('dashboard');
          }}
          theme={theme}
        />
      )}

      {currentView === 'performance_evaluation' && (
        <PerformanceEvaluationPage
          reportId={activeReportId}
          onNavigate={handleNavigate}
          theme={theme}
        />
      )}

      {currentView === 'transcript' && (
        <TranscriptPage
          transcriptId={activeTranscriptId}
          onNavigate={handleNavigate}
          theme={theme}
        />
      )}

      {currentView === 'progress_tracker' && currentUser && (
        <ProgressTrackerPage
          currentUser={currentUser}
          onNavigate={handleNavigate}
          theme={theme}
        />
      )}

      {currentView === 'resume_builder' && (
        <ResumeBuilderPage
          currentUser={currentUser || StorageService.getUsers()[0]}
          theme={theme}
        />
      )}

      {currentView === 'feedback_public' && (
        <UserFeedbackPage
          currentUser={currentUser}
          sessionId={activeFeedbackSessionId}
          onNavigate={handleNavigate}
          theme={theme}
        />
      )}

      {currentView === 'admin_dashboard' && currentUser && (
        <AdminDashboard
          currentUser={currentUser}
          onSwitchRole={handleSwitchRole}
          onNavigate={handleNavigate}
          theme={theme}
        />
      )}
    </>
  );

  return (
    <div className={`min-h-screen transition-colors duration-200 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {useWorkspaceShell && currentUser && shellActiveTarget ? (
        <WorkspaceShell
          currentUser={currentUser}
          currentView={currentView}
          onNavigate={handleNavigate}
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={handleLogout}
          onSwitchRole={handleSwitchRole}
          activeTarget={shellActiveTarget}
          targetSummaries={shellTargetSummaries}
          onSwitchTarget={handleShellTargetSwitch}
          onOpenTargetModal={() => setTargetModalOpen(true)}
          streakCount={shellStreak?.currentStreak ?? 0}
        >
          {renderActiveRoute()}
        </WorkspaceShell>
      ) : (
        <>
          <Navbar
            currentUser={currentUser}
            currentView={currentView}
            onNavigate={handleNavigate}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenAuth={handleOpenAuth}
            onLogout={handleLogout}
            onSwitchRole={handleSwitchRole}
          />
          <main>{renderActiveRoute()}</main>
        </>
      )}

      {currentUser && (
        <TargetManagerModal
          isOpen={targetModalOpen}
          onClose={() => setTargetModalOpen(false)}
          userId={currentUser.userId}
          theme={theme}
          initialMode="list"
          onTargetsChanged={() => setTargetRefreshTick(t => t + 1)}
        />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onAuthSuccess={handleAuthSuccess}
        theme={theme}
      />
    </div>
  );
}
