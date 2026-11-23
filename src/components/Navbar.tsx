import React, { useState } from 'react';
import {
  Sparkles,
  Sun,
  Moon,
  User as UserIcon,
  LogOut,
  Shield,
  Menu,
  X,
  FileText,
  Calendar,
  TrendingUp,
  LayoutDashboard,
  MessageSquare
} from 'lucide-react';
import { User } from '../types/hireboost';

interface NavbarProps {
  currentUser: User | null;
  currentView: string;
  onNavigate: (view: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onLogout: () => void;
  onSwitchRole: (role: 'Student' | 'Admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentView,
  onNavigate,
  theme,
  onToggleTheme,
  onOpenAuth,
  onLogout,
  onSwitchRole
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isDark = theme === 'dark';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, authOnly: true },
    { id: 'book_interview', label: 'Book Interview', icon: Calendar, authOnly: false },
    { id: 'resume_builder', label: 'Resume Builder', icon: FileText, authOnly: false },
    { id: 'progress_tracker', label: 'History & Progress', icon: TrendingUp, authOnly: true },
    { id: 'feedback_public', label: 'Reviews', icon: MessageSquare, authOnly: false },
  ];

  if (currentUser?.role === 'Admin') {
    navItems.push({ id: 'admin_dashboard', label: 'Admin Portal', icon: Shield, authOnly: true });
  }

  return (
    <header className={`sticky top-0 z-50 transition-colors border-b ${
      isDark
        ? 'bg-slate-900/95 backdrop-blur-md border-slate-800 text-slate-100'
        : 'bg-white/95 backdrop-blur-md border-slate-200 text-slate-800 shadow-xs'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            onClick={() => onNavigate(currentUser ? 'dashboard' : 'landing')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                HireBoost
              </span>
              <span className="hidden sm:inline-block ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-sm bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                AI Prep
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {!currentUser && (
              <>
                <button
                  onClick={() => onNavigate('landing')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'landing'
                      ? isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'
                      : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    onNavigate('landing');
                    setTimeout(() => {
                      document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Features
                </button>
              </>
            )}

            {navItems.map(item => {
              if (item.authOnly && !currentUser) return null;
              const Icon = item.icon;
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? isDark
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : isDark
                        ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Theme + User / Auth */}
          <div className="flex items-center space-x-2.5">
            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
              }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition-all ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-200'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-linear-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="hidden sm:inline-block font-medium text-xs max-w-[110px] truncate">
                    {currentUser.name}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    currentUser.role === 'Admin'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {currentUser.role}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl border py-2 z-50 transition-all ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                  }`}>
                    <div className="px-4 py-2 border-b border-slate-700/50">
                      <p className="text-xs font-semibold">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('profile');
                      }}
                      className="w-full text-left px-4 py-2 text-xs flex items-center space-x-2 hover:bg-slate-700/40"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>My Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('dashboard');
                      }}
                      className="w-full text-left px-4 py-2 text-xs flex items-center space-x-2 hover:bg-slate-700/40"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-purple-400" />
                      <span>Student Dashboard</span>
                    </button>

                    {currentUser.role === 'Admin' && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('admin_dashboard');
                        }}
                        className="w-full text-left px-4 py-2 text-xs flex items-center space-x-2 hover:bg-slate-700/40"
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                        <span>Admin Console</span>
                      </button>
                    )}

                    <div className="border-t border-slate-700/50 my-1"></div>

                    {/* Quick Role Switcher for Testing */}
                    <div className="px-4 py-1.5">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Switch Test Role</span>
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => {
                            onSwitchRole('Student');
                            setUserDropdownOpen(false);
                          }}
                          className={`flex-1 py-1 rounded-sm text-[11px] font-medium border ${
                            currentUser.role === 'Student'
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300'
                          }`}
                        >
                          Student
                        </button>
                        <button
                          onClick={() => {
                            onSwitchRole('Admin');
                            setUserDropdownOpen(false);
                          }}
                          className={`flex-1 py-1 rounded-sm text-[11px] font-medium border ${
                            currentUser.role === 'Admin'
                              ? 'bg-amber-600 text-white border-amber-600'
                              : isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300'
                          }`}
                        >
                          Admin
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-700/50 my-1"></div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-400 flex items-center space-x-2 hover:bg-rose-500/10"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Log In
                </button>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-xs shadow-indigo-500/25 transition-all"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className={`md:hidden border-b px-4 py-3 space-y-1 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {navItems.map(item => {
            if (item.authOnly && !currentUser) return null;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                  currentView === item.id
                    ? 'bg-indigo-600 text-white'
                    : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
