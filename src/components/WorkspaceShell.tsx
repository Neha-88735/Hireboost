import React, { useState } from 'react';
import {
  Calendar,
  FileText,
  Flame,
  GitBranch,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  PanelLeft,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Sun,
  TrendingUp,
  User as UserIcon,
  X
} from 'lucide-react';
import { CareerTarget, TargetProgressSummary, User } from '../types/hireboost';

interface WorkspaceShellProps {
  currentUser: User;
  currentView: string;
  onNavigate: (view: string, extraParam?: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onLogout: () => void;
  onSwitchRole: (role: 'Student' | 'Admin') => void;
  activeTarget: CareerTarget;
  targetSummaries: TargetProgressSummary[];
  onSwitchTarget: (targetId: string) => void;
  onOpenTargetModal: () => void;
  streakCount: number;
  children: React.ReactNode;
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  currentUser,
  currentView,
  onNavigate,
  theme,
  onToggleTheme,
  onLogout,
  onSwitchRole,
  activeTarget,
  targetSummaries,
  onSwitchTarget,
  onOpenTargetModal,
  streakCount,
  children
}) => {
  const isDark = theme === 'dark';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const initials = currentUser.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('') || 'HB';

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'book_interview', label: 'Book Interview', icon: Calendar },
    { id: 'roadmap', label: 'Career Path', icon: GitBranch },
    { id: 'progress_tracker', label: 'My Progress', icon: TrendingUp },
    { id: 'resume_builder', label: 'Resume Builder', icon: FileText },
    { id: 'feedback_public', label: 'Reviews', icon: MessageSquare }
  ];

  if (currentUser.role === 'Admin') {
    navItems.push({ id: 'admin_dashboard', label: 'Admin Portal', icon: Shield });
  }

  const handleNavClick = (id: string) => {
    setMobileDrawerOpen(false);
    if (id === 'roadmap') {
      if (currentView !== 'dashboard') {
        onNavigate('dashboard');
        setTimeout(() => {
          document.getElementById('career-roadmap-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      } else {
        document.getElementById('career-roadmap-section')?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    onNavigate(id);
  };

  const handleStreakClick = () => {
    if (currentView !== 'dashboard') {
      onNavigate('dashboard');
      setTimeout(() => {
        document.getElementById('streak-calendar-card')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 80);
    } else {
      document.getElementById('streak-calendar-card')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const renderSidebarLinks = (collapsed: boolean) => (
    <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto" aria-label="Workspace navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active =
          currentView === item.id ||
          (item.id === 'roadmap' && currentView === 'roadmap_interview') ||
          (item.id === 'progress_tracker' &&
            (currentView === 'performance_evaluation' || currentView === 'transcript'));

        return (
          <button
            key={item.id}
            type="button"
            title={collapsed ? item.label : undefined}
            onClick={() => handleNavClick(item.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-[13px] font-medium transition-colors cursor-pointer ${
              collapsed ? 'justify-center px-2' : ''
            } ${
              active
                ? isDark
                  ? 'bg-indigo-500/15 text-indigo-300 font-semibold'
                  : 'bg-indigo-50 text-indigo-600 font-semibold'
                : isDark
                  ? 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div
      className={`min-h-screen flex transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Desktop Left Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 sticky top-0 h-screen border-r transition-all duration-200 ${
          sidebarCollapsed ? 'w-[68px]' : 'w-56'
        } ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
      >
        {/* Brand + Collapse Control */}
        <div
          className={`h-14 px-3 border-b flex items-center shrink-0 ${
            sidebarCollapsed ? 'justify-center' : 'justify-between'
          } ${isDark ? 'border-slate-800' : 'border-slate-200'}`}
        >
          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 cursor-pointer min-w-0"
            >
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="text-left leading-tight min-w-0">
                <div className="text-sm font-extrabold tracking-tight truncate">
                  HireBoost
                </div>
                <div className={`text-[10px] font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  AI Prep
                </div>
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSidebarCollapsed(c => !c)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark
                ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>

        {renderSidebarLinks(sidebarCollapsed)}

        {/* Sidebar Bottom Profile / Logout */}
        <div className={`p-2.5 border-t space-y-1 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            type="button"
            title={sidebarCollapsed ? 'My Profile' : undefined}
            onClick={() => onNavigate('profile')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-[13px] font-medium transition-colors cursor-pointer ${
              sidebarCollapsed ? 'justify-center px-2' : ''
            } ${
              currentView === 'profile'
                ? isDark
                  ? 'bg-indigo-500/15 text-indigo-300 font-semibold'
                  : 'bg-indigo-50 text-indigo-600 font-semibold'
                : isDark
                  ? 'text-slate-300 hover:bg-slate-800/70'
                  : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserIcon className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">My Profile</span>}
          </button>

          <button
            type="button"
            title={sidebarCollapsed ? 'Log Out' : undefined}
            onClick={onLogout}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-[13px] font-medium transition-colors cursor-pointer ${
              sidebarCollapsed ? 'justify-center px-2' : ''
            } ${
              isDark
                ? 'text-rose-400 hover:bg-rose-500/10'
                : 'text-rose-600 hover:bg-rose-50'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Slide-Over */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <aside
            className={`relative z-10 w-64 max-w-[80vw] h-full flex flex-col border-r ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div
              className={`h-14 px-4 border-b flex items-center justify-between ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-extrabold">HireBoost</span>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderSidebarLinks(false)}
          </aside>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Compact Sticky Top Header Bar */}
        <header
          className={`sticky top-0 z-40 h-14 border-b px-4 sm:px-6 flex items-center justify-between gap-3 ${
            isDark
              ? 'bg-slate-900/95 backdrop-blur-md border-slate-800'
              : 'bg-white/95 backdrop-blur-md border-slate-200'
          }`}
        >
          {/* Left: Mobile Drawer Toggle + Target Career Goal Switcher */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileDrawerOpen(true)}
              className={`lg:hidden p-1.5 rounded-lg border cursor-pointer ${
                isDark
                  ? 'border-slate-800 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Menu className="w-4 h-4" />
            </button>

            <select
              aria-label="Switch active career target"
              value={activeTarget.targetId}
              onChange={(e) => onSwitchTarget(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer max-w-[180px] sm:max-w-[230px] truncate ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              {targetSummaries.map((s) => (
                <option key={s.target.targetId} value={s.target.targetId}>
                  Goal: {s.target.roleName}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onOpenTargetModal}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                isDark
                  ? 'bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-200'
                  : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Goals</span>
            </button>

            <span
              className={`hidden md:inline-block text-xs tabular-nums ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Goal: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{activeTarget.targetScore}%</strong>
            </span>
          </div>

          {/* Right: Theme Toggle + Streak Counter + User Avatar */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-950 border-slate-800 hover:bg-slate-800 text-amber-400'
                  : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleStreakClick}
              title={`Current Interview Streak: ${streakCount} ${streakCount === 1 ? 'day' : 'days'}`}
              className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-bold font-mono tabular-nums cursor-pointer transition-colors ${
                streakCount > 0
                  ? isDark
                    ? 'bg-orange-500/15 border-orange-500/35 text-orange-400 hover:bg-orange-500/20'
                    : 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100'
                  : isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${streakCount > 0 ? 'text-orange-500 fill-orange-500/25' : 'text-slate-400'}`} />
              <span>{streakCount}</span>
            </button>

            {/* User Avatar & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(v => !v)}
                aria-label="User account menu"
                className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                {initials}
              </button>

              {userMenuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl border py-2 z-50 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <div className={`px-4 py-2 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <p className="text-xs font-semibold truncate">{currentUser.name}</p>
                    <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {currentUser.email}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onNavigate('profile');
                    }}
                    className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 cursor-pointer ${
                      isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'
                    }`}
                  >
                    <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>My Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onNavigate('dashboard');
                    }}
                    className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 cursor-pointer ${
                      isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5 text-purple-500" />
                    <span>Student Dashboard</span>
                  </button>

                  {currentUser.role === 'Admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigate('admin_dashboard');
                      }}
                      className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 cursor-pointer ${
                        isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-500" />
                      <span>Admin Console</span>
                    </button>
                  )}

                  <div className={`border-t my-1 ${isDark ? 'border-slate-700' : 'border-slate-200'}`} />

                  <div className="px-4 py-1.5">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                      Switch Test Role
                    </span>
                    <div className="flex gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onSwitchRole('Student');
                          setUserMenuOpen(false);
                        }}
                        className={`flex-1 py-1 rounded-sm text-[11px] font-medium border cursor-pointer ${
                          currentUser.role === 'Student'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : isDark
                              ? 'bg-slate-900 border-slate-700 text-slate-300'
                              : 'bg-slate-100 border-slate-300 text-slate-700'
                        }`}
                      >
                        Student
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSwitchRole('Admin');
                          setUserMenuOpen(false);
                        }}
                        className={`flex-1 py-1 rounded-sm text-[11px] font-medium border cursor-pointer ${
                          currentUser.role === 'Admin'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : isDark
                              ? 'bg-slate-900 border-slate-700 text-slate-300'
                              : 'bg-slate-100 border-slate-300 text-slate-700'
                        }`}
                      >
                        Admin
                      </button>
                    </div>
                  </div>

                  <div className={`border-t my-1 ${isDark ? 'border-slate-700' : 'border-slate-200'}`} />

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                    className={`w-full text-left px-4 py-2 text-xs text-rose-500 flex items-center gap-2 cursor-pointer ${
                      isDark ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
};
