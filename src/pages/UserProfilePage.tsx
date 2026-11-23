import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  Briefcase,
  Target,
  FileText,
  Upload,
  Plus,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { User, UserProfile, ExperienceLevel } from '../types/hireboost';
import { TargetManagerModal } from '../components/TargetManagerModal';

interface UserProfilePageProps {
  currentUser: User;
  onProfileUpdated: (updatedUser: User) => void;
  theme: 'dark' | 'light';
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  currentUser,
  onProfileUpdated,
  theme
}) => {
  const isDark = theme === 'dark';
  const initialProfile = StorageService.getUserProfile(currentUser.userId);

  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [newSkill, setNewSkill] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const targets = StorageService.getUserTargets(currentUser.userId);
  const activeTarget = StorageService.getActiveTarget(currentUser.userId);

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (profile.skills.includes(newSkill.trim())) return;
    setProfile(prev => ({
      ...prev,
      skills: [...prev.skills, newSkill.trim()]
    }));
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfile(prev => ({
        ...prev,
        resumeName: file.name,
        resumeUrl: URL.createObjectURL(file)
      }));
      setUploadNotice(`Resume "${file.name}" uploaded successfully!`);
      setTimeout(() => setUploadNotice(null), 4000);
    }
  };

  const handleSave = () => {
    const updated = StorageService.updateProfile(profile);
    setProfile(updated);
    setSaveStatus('Profile changes saved successfully to database!');
    setIsEditing(false);
    onProfileUpdated({
      ...currentUser,
      name: updated.name,
      email: updated.email
    });
    setTimeout(() => setSaveStatus(null), 4000);
  };

  return (
    <div className={`min-h-screen py-10 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <UserIcon className="w-4 h-4" />
              <span>Profile</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">My Profile</h1>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Update your goal, experience, and skills.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer transition-all"
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications */}
        {saveStatus && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveStatus}</span>
          </div>
        )}
        {uploadNotice && (
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs flex items-center space-x-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{uploadNotice}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          {/* Top Identity Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-6 border-b border-slate-800/40">
            <div className="w-20 h-20 rounded-2xl bg-linear-to-tr from-indigo-500 via-purple-600 to-pink-500 text-white flex items-center justify-center font-black text-3xl shadow-lg shadow-indigo-500/25">
              {profile.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold">{profile.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {profile.role}
                </span>
              </div>
              <p className="text-xs text-slate-400">{profile.email}</p>
              <div className="flex flex-wrap gap-4 text-[11px] text-slate-500 pt-1">
                <span className="font-mono">User ID: {profile.userId}</span>
                <span>Joined: {profile.joinDate}</span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-400">Full Name</label>
              <input
                type="text"
                disabled={!isEditing}
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className={`w-full px-3 py-2 text-xs rounded-xl border ${
                  !isEditing ? 'opacity-70 cursor-not-allowed' : 'focus:ring-2 focus:ring-indigo-500'
                } ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-400">Email Address</label>
              <input
                type="email"
                disabled={!isEditing}
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className={`w-full px-3 py-2 text-xs rounded-xl border ${
                  !isEditing ? 'opacity-70 cursor-not-allowed' : 'focus:ring-2 focus:ring-indigo-500'
                } ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-400">Current Goal</label>
                <button
                  type="button"
                  onClick={() => setTargetModalOpen(true)}
                  className="text-[11px] font-bold text-indigo-400 hover:underline cursor-pointer"
                >
                  Manage Goals ({targets.length})
                </button>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  placeholder="e.g., Software Engineer"
                  value={profile.targetRole}
                  onChange={(e) => setProfile({ ...profile, targetRole: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              ) : (
                <select
                  aria-label="Switch current goal"
                  value={activeTarget.targetId}
                  onChange={(e) => {
                    const updated = StorageService.setActiveTarget(currentUser.userId, e.target.value);
                    setProfile(updated);
                    setSaveStatus(`Goal switched to "${updated.targetRole}"`);
                    setTimeout(() => setSaveStatus(null), 3500);
                  }}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  {targets.map((t) => (
                    <option key={t.targetId} value={t.targetId}>
                      {t.roleName} (Goal: {t.targetScore}%)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-400">Experience</label>
              <select
                disabled={!isEditing}
                value={profile.experience}
                onChange={(e) => setProfile({ ...profile, experience: e.target.value as ExperienceLevel })}
                className={`w-full px-3 py-2 text-xs rounded-xl border ${
                  !isEditing ? 'opacity-70 cursor-not-allowed' : 'focus:ring-2 focus:ring-indigo-500'
                } ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
              >
                <option value="Fresher">Fresher (0-1 years)</option>
                <option value="Intermediate">Intermediate (1-3 years)</option>
                <option value="Experienced">Experienced (3+ years)</option>
              </select>
            </div>
          </div>

          {/* Bio / Objective */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-400">About Me</label>
            <textarea
              rows={2}
              disabled={!isEditing}
              value={profile.bio || ''}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className={`w-full px-3 py-2 text-xs rounded-xl border ${
                !isEditing ? 'opacity-70 cursor-not-allowed' : 'focus:ring-2 focus:ring-indigo-500'
              } ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
            />
          </div>

          {/* Skills Management */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-400">
                Skills ({profile.skills.length})
              </label>
              <span className="text-[11px] text-slate-500">Used to tailor interview questions</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {profile.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-medium border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-indigo-300'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  }`}
                >
                  <span>{skill}</span>
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-rose-400 p-0.5 rounded-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>

            {isEditing && (
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="e.g., Docker, GraphQL, Kubernetes"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); }}}
                  className={`flex-1 px-3 py-1.5 text-xs rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Skill</span>
                </button>
              </div>
            )}
          </div>

          {/* Resume Upload & Resume URL */}
          <div className="pt-4 border-t border-slate-800/40">
            <h3 className="text-sm font-bold mb-3 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Resume Attachment & URL</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* File Upload */}
              <div className={`p-4 rounded-2xl border border-dashed text-center ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-300'
              }`}>
                <Upload className="w-6 h-6 mx-auto mb-2 text-indigo-400" />
                <p className="text-xs font-semibold mb-1">
                  {profile.resumeName ? profile.resumeName : 'Upload your Resume (PDF)'}
                </p>
                <p className={`text-[10px] mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Max size: 10MB (PDF, DOCX)
                </p>
                <label className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs">
                  <span>Browse File</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* URL Input */}
              <div className="flex flex-col justify-center space-y-2">
                <label className="text-xs font-semibold text-slate-400">External Resume URL</label>
                <input
                  type="url"
                  disabled={!isEditing}
                  placeholder="https://drive.google.com/..."
                  value={profile.resumeUrl || ''}
                  onChange={(e) => setProfile({ ...profile, resumeUrl: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border ${
                    !isEditing ? 'opacity-70 cursor-not-allowed' : 'focus:ring-2 focus:ring-indigo-500'
                  } ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                />
                {profile.resumeUrl && (
                  <a
                    href={profile.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:underline flex items-center space-x-1"
                  >
                    <span>Open attached resume link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <TargetManagerModal
        isOpen={targetModalOpen}
        onClose={() => setTargetModalOpen(false)}
        userId={currentUser.userId}
        theme={theme}
        onTargetsChanged={() => {
          const refreshed = StorageService.getUserProfile(currentUser.userId);
          setProfile(refreshed);
        }}
      />
    </div>
  );
};
