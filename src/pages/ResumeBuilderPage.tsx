import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Award,
  Briefcase,
  CheckCircle2,
  Code,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  Layers,
  Loader2,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Target,
  Trash2,
  Upload,
  User as UserIcon,
  Wand2,
  X
} from 'lucide-react';
import { StorageService } from '../services/storage';
import {
  CustomResumeTemplate,
  ResumeData,
  ResumeTemplateId,
  User
} from '../types/hireboost';
import { downloadResumePDF } from '../utils/pdfExport';
import { ResumeTemplatePreview } from '../components/ResumeTemplatePreview';

interface ResumeBuilderPageProps {
  currentUser: User;
  theme: 'dark' | 'light';
}

const ROLE_PRESETS = [
  'Software Development Engineer',
  'Full-Stack Developer',
  'Frontend Engineer',
  'Backend Engineer',
  'Data Scientist',
  'ML / AI Engineer',
  'DevOps / Cloud Engineer',
  'Product Manager'
];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read selected file.'));
    reader.readAsDataURL(file);
  });
}

async function cropLogoFromImageDataUrl(
  imageDataUrl: string,
  cropBox?: { xPct: number; yPct: number; wPct: number; hPct: number }
): Promise<string | undefined> {
  if (!cropBox) return undefined;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const sx = Math.max(0, Math.floor((cropBox.xPct / 100) * img.naturalWidth));
        const sy = Math.max(0, Math.floor((cropBox.yPct / 100) * img.naturalHeight));
        const sw = Math.max(16, Math.min(img.naturalWidth - sx, Math.floor((cropBox.wPct / 100) * img.naturalWidth)));
        const sh = Math.max(16, Math.min(img.naturalHeight - sy, Math.floor((cropBox.hPct / 100) * img.naturalHeight)));

        const maxDim = 160;
        const scale = Math.min(1, maxDim / Math.max(sw, sh));
        const outW = Math.max(24, Math.round(sw * scale));
        const outH = Math.max(24, Math.round(sh * scale));

        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(undefined);
          return;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(undefined);
      }
    };
    img.onerror = () => resolve(undefined);
    img.src = imageDataUrl;
  });
}

export const ResumeBuilderPage: React.FC<ResumeBuilderPageProps> = ({
  currentUser,
  theme
}) => {
  const isDark = theme === 'dark';
  const initialResume = StorageService.getResume(currentUser.userId);
  const activeTarget = StorageService.getActiveTarget(currentUser.userId);

  const [resume, setResume] = useState<ResumeData>(() => ({
    ...initialResume,
    targetRole: initialResume.targetRole || activeTarget?.roleName || 'Software Development Engineer'
  }));

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // AI Enhancer & Project Improviser State
  const [enhancingIndex, setEnhancingIndex] = useState<string | null>(null);
  const [improvisingAll, setImprovisingAll] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiCritique, setAiCritique] = useState<string | null>(null);
  const [activeEnhanceTarget, setActiveEnhanceTarget] = useState<{
    type: 'project' | 'work' | 'objective';
    id?: string;
  } | null>(null);

  // Custom Template Upload State
  const templateFileInputRef = useRef<HTMLInputElement | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);
  const [parsingTemplate, setParsingTemplate] = useState(false);
  const [templateNotice, setTemplateNotice] = useState<string | null>(null);

  const targetRoleValue = resume.targetRole?.trim() || 'Software Development Engineer';

  // Save Resume
  const handleSave = (customData?: ResumeData) => {
    const payload = customData || resume;
    StorageService.saveResume(payload);
    setSaveNotice('Resume saved successfully!');
    setTimeout(() => setSaveNotice(null), 3500);
  };

  // Enhance with AI (Role-Targeted Project Improviser, Work, Objective)
  const handleEnhanceWithAI = async (
    text: string,
    type: 'project' | 'work' | 'objective',
    id?: string,
    extra?: { projectTitle?: string; techStack?: string }
  ) => {
    if (!text.trim()) {
      setErrorNotice('Please enter your simple words or initial description before enhancing with AI.');
      setTimeout(() => setErrorNotice(null), 4000);
      return;
    }

    setErrorNotice(null);
    setEnhancingIndex(id || type);
    setActiveEnhanceTarget({ type, id });
    setAiCritique(null);

    try {
      const response = await fetch('/api/ai/enhance-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetRole: targetRoleValue,
          type,
          projectTitle: extra?.projectTitle,
          techStack: extra?.techStack
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to improvise text with AI.');
      }
      if (data && Array.isArray(data.enhancedBullets) && data.enhancedBullets.length > 0) {
        setAiSuggestions(data.enhancedBullets);
        if (data.critique) setAiCritique(data.critique);

        // Save original simple words into rawNotes when improvising a project
        if (type === 'project' && id) {
          setResume((prev) => ({
            ...prev,
            projects: prev.projects.map((p) =>
              p.id === id ? { ...p, rawNotes: p.rawNotes || p.description } : p
            )
          }));
        }
      }
    } catch (err) {
      console.warn('AI Enhance error:', err);
      const fallback =
        type === 'project'
          ? [
              `Engineered ${extra?.projectTitle || 'application'} using ${extra?.techStack || 'modern technologies'} to ${text.trim().replace(/\.$/, '')}, aligned with ${targetRoleValue} standards.`,
              `Architected scalable modules for ${extra?.projectTitle || 'this project'} (${extra?.techStack || 'full-stack'}) delivering clean UX and maintainable architecture.`,
              `Developed end-to-end capabilities for ${extra?.projectTitle || 'the system'}, turning core ideas into production-ready features for ${targetRoleValue} workflows.`
            ]
          : [
              `Spearheaded core ${targetRoleValue} deliverables, improving workflow efficiency and reliability.`,
              `Architected maintainable components and automated engineering workflows for faster release cycles.`,
              `Collaborated cross-functionally to deliver resilient solutions aligned with ${targetRoleValue} best practices.`
            ];
      setAiSuggestions(fallback);
    } finally {
      setEnhancingIndex(null);
    }
  };

  // Improvise ALL projects for the selected target role in one click
  const handleImproviseAllProjects = async () => {
    if (resume.projects.length === 0) return;
    setImprovisingAll(true);
    setErrorNotice(null);

    try {
      const updatedProjects = await Promise.all(
        resume.projects.map(async (proj) => {
          const sourceText = (proj.rawNotes || proj.description || '').trim();
          if (!sourceText) return proj;

          try {
            const response = await fetch('/api/ai/enhance-resume', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: sourceText,
                targetRole: targetRoleValue,
                type: 'project',
                projectTitle: proj.title,
                techStack: proj.techStack
              })
            });
            const data = await response.json();
            const best = data?.recommendedDescription || data?.enhancedBullets?.[0];
            if (best) {
              return {
                ...proj,
                rawNotes: proj.rawNotes || proj.description,
                description: best
              };
            }
          } catch {
            // Keep project untouched if single request fails
          }
          return proj;
        })
      );

      const nextResume = { ...resume, projects: updatedProjects };
      setResume(nextResume);
      StorageService.saveResume(nextResume);
      setSaveNotice(`All ${updatedProjects.length} project descriptions tailored for "${targetRoleValue}"!`);
      setTimeout(() => setSaveNotice(null), 4000);
    } finally {
      setImprovisingAll(false);
    }
  };

  const applyAiBullet = (bullet: string) => {
    if (!activeEnhanceTarget) return;

    if (activeEnhanceTarget.type === 'objective') {
      setResume((prev) => ({ ...prev, careerObjective: bullet }));
    } else if (activeEnhanceTarget.type === 'project' && activeEnhanceTarget.id) {
      setResume((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === activeEnhanceTarget.id
            ? { ...p, rawNotes: p.rawNotes || p.description, description: bullet }
            : p
        )
      }));
    } else if (activeEnhanceTarget.type === 'work' && activeEnhanceTarget.id) {
      setResume((prev) => ({
        ...prev,
        workExperience: prev.workExperience.map((w) =>
          w.id === activeEnhanceTarget.id ? { ...w, description: bullet } : w
        )
      }));
    }

    setAiSuggestions([]);
    setAiCritique(null);
    setActiveEnhanceTarget(null);
  };

  const restoreProjectRawNotes = (id: string) => {
    setResume((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id && p.rawNotes ? { ...p, description: p.rawNotes } : p
      )
    }));
  };

  // Handle Optional Custom Template Upload (.jpg, .jpeg, .png, .pdf, .doc, .docx)
  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const ext = file.name.toLowerCase().split('.').pop() || '';
    const allowed = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx'];
    if (!allowed.includes(ext)) {
      setErrorNotice('Unsupported file type. Upload .jpg, .jpeg, .png, .pdf, .doc, or .docx.');
      setTimeout(() => setErrorNotice(null), 5000);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorNotice('Template file exceeds 15 MB limit. Please choose a smaller file.');
      setTimeout(() => setErrorNotice(null), 5000);
      return;
    }

    setParsingTemplate(true);
    setErrorNotice(null);
    setTemplateNotice(null);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const response = await fetch('/api/ai/parse-resume-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: dataUrl,
          fileName: file.name,
          mimeType: file.type
        })
      });

      const result = await response.json();
      if (!response.ok || !result?.spec) {
        throw new Error(result?.error || 'Could not extract layout from uploaded template.');
      }

      let logoDataUrl: string | undefined = result.extractedLogoDataUrl;
      const isRasterImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
      if (!logoDataUrl && isRasterImage && result.spec.hasEmbeddedLogo && result.spec.logoCropBox) {
        logoDataUrl = await cropLogoFromImageDataUrl(dataUrl, result.spec.logoCropBox);
      }

      const customTemplate: CustomResumeTemplate = {
        fileName: file.name,
        mimeType: file.type || ext,
        uploadedAt: new Date().toISOString(),
        logoDataUrl,
        spec: result.spec
      };

      const nextResume: ResumeData = {
        ...resume,
        templateId: 'custom',
        customTemplate
      };
      setResume(nextResume);
      StorageService.saveResume(nextResume);
      setTemplateNotice(
        `Built your resume using "${result.spec.templateName}" (${result.spec.layoutType}) with matched icons, logos & headings!`
      );
      setSaveNotice(
        `Resume generated in "${result.spec.templateName}" template format!`
      );
      setTimeout(() => setSaveNotice(null), 4500);
      setActiveTab('preview');
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : 'Failed to process uploaded template.');
    } finally {
      setParsingTemplate(false);
    }
  };

  // Optional manual logo image upload override for custom template
  const handleCustomLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !resume.customTemplate) return;

    try {
      const rawUrl = await readFileAsDataUrl(file);
      const cropped = await cropLogoFromImageDataUrl(rawUrl, { xPct: 0, yPct: 0, wPct: 100, hPct: 100 });
      const nextResume: ResumeData = {
        ...resume,
        customTemplate: {
          ...resume.customTemplate,
          logoDataUrl: cropped || rawUrl
        }
      };
      setResume(nextResume);
      StorageService.saveResume(nextResume);
    } catch {
      setErrorNotice('Could not load selected logo image.');
    }
  };

  const clearCustomTemplate = () => {
    const nextResume: ResumeData = {
      ...resume,
      templateId: resume.templateId === 'custom' ? 'modern' : resume.templateId,
      customTemplate: undefined
    };
    setResume(nextResume);
    StorageService.saveResume(nextResume);
    setTemplateNotice(null);
  };

  // Add / Remove Item Helpers
  const addProject = () => {
    const newProj = {
      id: `proj_${Date.now()}`,
      title: 'New Engineering Project',
      techStack: 'React, Node.js, TypeScript',
      description: 'Write simple words here about what you built, then click AI Improvise for your role.',
      rawNotes: ''
    };
    setResume({ ...resume, projects: [...resume.projects, newProj] });
  };

  const removeProject = (id: string) => {
    setResume({ ...resume, projects: resume.projects.filter((p) => p.id !== id) });
  };

  const addExperience = () => {
    const newWork = {
      id: `work_${Date.now()}`,
      role: 'Software Engineer',
      company: 'Tech Solutions Corp',
      duration: 'Jun 2025 - Present',
      description: 'Developed scalable microservices and optimized frontend responsiveness.'
    };
    setResume({ ...resume, workExperience: [...resume.workExperience, newWork] });
  };

  const removeExperience = (id: string) => {
    setResume({ ...resume, workExperience: resume.workExperience.filter((w) => w.id !== id) });
  };

  const addEducation = () => {
    const newEdu = {
      id: `edu_${Date.now()}`,
      degree: 'B.S. in Computer Science',
      institution: 'University of Technology',
      year: '2022 - 2026',
      gradeOrGpa: '3.8 / 4.0 GPA'
    };
    setResume({ ...resume, education: [...resume.education, newEdu] });
  };

  const removeEducation = (id: string) => {
    setResume({ ...resume, education: resume.education.filter((e) => e.id !== id) });
  };

  const addAchievement = () => {
    setResume({
      ...resume,
      achievements: [...resume.achievements, 'New Notable Honor or Certification Award']
    });
  };

  const removeAchievement = (idx: number) => {
    setResume({
      ...resume,
      achievements: resume.achievements.filter((_, i) => i !== idx)
    });
  };

  const builtInTemplates: {
    id: Exclude<ResumeTemplateId, 'custom'>;
    label: string;
    subtitle: string;
  }[] = [
    { id: 'modern', label: 'Modern', subtitle: 'Sidebar + Tech Badges' },
    { id: 'minimal', label: 'Minimal', subtitle: 'Centered Clean Type' },
    { id: 'executive', label: 'Executive', subtitle: 'Navy Band + Serif' },
    { id: 'compact', label: 'Compact', subtitle: 'Dense 1-Page Teal' }
  ];

  const renderTemplateWireframe = (id: ResumeTemplateId) => {
    if (id === 'modern') {
      return (
        <div className="w-full h-12 rounded-md border border-slate-700/40 overflow-hidden flex bg-white mb-2">
          <div className="w-1/3 bg-slate-900 p-1 flex flex-col gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
            <div className="h-1 w-full bg-slate-600 rounded" />
            <div className="h-1 w-3/4 bg-slate-700 rounded" />
          </div>
          <div className="w-2/3 p-1.5 space-y-1">
            <div className="h-1.5 w-2/3 bg-indigo-500 rounded" />
            <div className="h-1 w-full bg-slate-200 rounded" />
            <div className="h-1 w-5/6 bg-slate-200 rounded" />
          </div>
        </div>
      );
    }
    if (id === 'minimal') {
      return (
        <div className="w-full h-12 rounded-md border border-slate-300 bg-white p-1.5 flex flex-col items-center justify-center gap-1 mb-2">
          <div className="h-1.5 w-1/2 bg-slate-800 rounded" />
          <div className="h-0.5 w-3/4 bg-slate-300 rounded" />
          <div className="h-1 w-full bg-slate-200 rounded mt-0.5" />
          <div className="h-1 w-4/5 bg-slate-200 rounded" />
        </div>
      );
    }
    if (id === 'executive') {
      return (
        <div className="w-full h-12 rounded-md border border-slate-300 overflow-hidden bg-white mb-2">
          <div className="h-4 bg-slate-900 border-b-2 border-amber-500 px-1.5 flex items-center gap-1">
            <div className="w-2 h-2 rounded-full border border-amber-400" />
            <div className="h-1 w-1/2 bg-white rounded" />
          </div>
          <div className="p-1.5 space-y-1">
            <div className="h-1 w-full bg-slate-800 rounded" />
            <div className="h-1 w-4/5 bg-slate-200 rounded" />
          </div>
        </div>
      );
    }
    if (id === 'compact') {
      return (
        <div className="w-full h-12 rounded-md border border-teal-500/40 bg-white p-1.5 space-y-1 mb-2">
          <div className="flex justify-between items-center border-b border-teal-500 pb-0.5">
            <div className="h-1.5 w-1/3 bg-slate-900 rounded" />
            <div className="h-1 w-1/4 bg-teal-600 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-1">
            <div className="h-2 bg-slate-200 rounded" />
            <div className="h-2 bg-teal-100 rounded" />
          </div>
          <div className="h-1 w-full bg-slate-200 rounded" />
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`min-h-screen py-10 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <FileText className="w-4 h-4" />
              <span>Resume</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Resume Builder</h1>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Choose a distinct template or upload your own format, tailor project descriptions to your target job role, and export as PDF.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className={`flex p-1 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-100'}`}>
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                  activeTab === 'editor'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleSave()}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center space-x-1.5 cursor-pointer ${
                isDark ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-800'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>

            <button
              type="button"
              onClick={() => downloadResumePDF(resume)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-linear-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {saveNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveNotice}</span>
          </div>
        )}

        {errorNotice && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button type="button" onClick={() => setErrorNotice(null)} className="text-rose-300 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* AI Suggestions Modal/Banner if active */}
        {aiSuggestions.length > 0 && (
          <div className={`p-6 rounded-3xl border space-y-3 ${
            isDark ? 'bg-indigo-950/40 border-indigo-500/40' : 'bg-indigo-50 border-indigo-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4" />
                <span>AI Role-Targeted Rewrite ({targetRoleValue})</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setAiSuggestions([]);
                  setAiCritique(null);
                }}
                className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
            {aiCritique && (
              <p className={`text-xs ${isDark ? 'text-indigo-200/80' : 'text-indigo-800'}`}>
                {aiCritique}
              </p>
            )}
            <p className="text-xs text-slate-400">Click an improvised professional version below to apply it:</p>
            <div className="grid grid-cols-1 gap-2.5">
              {aiSuggestions.map((sug, i) => (
                <div
                  key={i}
                  onClick={() => applyAiBullet(sug)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all hover:scale-[1.01] ${
                    isDark
                      ? 'bg-slate-900 border-slate-800 hover:border-indigo-500 text-slate-200'
                      : 'bg-white border-slate-200 hover:border-indigo-500 text-slate-800 shadow-xs'
                  }`}
                >
                  <span className="font-bold text-indigo-400 mr-2">
                    {i === 0 ? 'Impact Version:' : i === 1 ? 'Technical Depth:' : 'Concise Bullet:'}
                  </span>
                  <span>{sug}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {activeTab === 'editor' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form Sections */}
            <div className="lg:col-span-2 space-y-6">
              {/* 0. Target Job Role Selector (Guides AI Project Improvisation & Header Subtitle) */}
              <div className={`p-6 rounded-3xl border space-y-3.5 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-bold flex items-center space-x-2 text-cyan-400">
                    <Target className="w-4 h-4" />
                    <span>Targeted Job Role</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Used by AI to rewrite simple project notes into role-ready phrasing
                  </span>
                </div>

                <input
                  type="text"
                  placeholder="e.g. Full-Stack Developer, Data Scientist, Backend Engineer"
                  value={resume.targetRole || ''}
                  onChange={(e) => setResume({ ...resume, targetRole: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500 focus:outline-hidden' : 'bg-slate-50 border-slate-200 focus:border-cyan-500 focus:outline-hidden'
                  }`}
                />

                <div className="flex flex-wrap gap-1.5">
                  {ROLE_PRESETS.map((rolePreset) => (
                    <button
                      key={rolePreset}
                      type="button"
                      onClick={() => setResume({ ...resume, targetRole: rolePreset })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border cursor-pointer transition-colors ${
                        targetRoleValue === rolePreset
                          ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-400'
                          : isDark
                            ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {rolePreset}
                    </button>
                  ))}
                </div>
              </div>

              {/* 1. Personal Information */}
              <div className={`p-6 rounded-3xl border space-y-4 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <h3 className="text-sm font-bold flex items-center space-x-2 text-indigo-400">
                  <UserIcon className="w-4 h-4" />
                  <span>Personal Information & Contacts</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={resume.personalInfo.fullName}
                      onChange={(e) => setResume({
                        ...resume,
                        personalInfo: { ...resume.personalInfo, fullName: e.target.value }
                      })}
                      className={`w-full px-3 py-2 text-xs rounded-xl border ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Email</label>
                    <input
                      type="email"
                      value={resume.personalInfo.email}
                      onChange={(e) => setResume({
                        ...resume,
                        personalInfo: { ...resume.personalInfo, email: e.target.value }
                      })}
                      className={`w-full px-3 py-2 text-xs rounded-xl border ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Phone</label>
                    <input
                      type="text"
                      value={resume.personalInfo.phone}
                      onChange={(e) => setResume({
                        ...resume,
                        personalInfo: { ...resume.personalInfo, phone: e.target.value }
                      })}
                      className={`w-full px-3 py-2 text-xs rounded-xl border ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Location</label>
                    <input
                      type="text"
                      value={resume.personalInfo.location}
                      onChange={(e) => setResume({
                        ...resume,
                        personalInfo: { ...resume.personalInfo, location: e.target.value }
                      })}
                      className={`w-full px-3 py-2 text-xs rounded-xl border ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">LinkedIn URL</label>
                    <input
                      type="text"
                      value={resume.personalInfo.linkedinUrl}
                      onChange={(e) => setResume({
                        ...resume,
                        personalInfo: { ...resume.personalInfo, linkedinUrl: e.target.value }
                      })}
                      className={`w-full px-3 py-2 text-xs rounded-xl border ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">GitHub / Portfolio URL</label>
                    <input
                      type="text"
                      value={resume.personalInfo.githubUrl}
                      onChange={(e) => setResume({
                        ...resume,
                        personalInfo: { ...resume.personalInfo, githubUrl: e.target.value }
                      })}
                      className={`w-full px-3 py-2 text-xs rounded-xl border ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Career Objective */}
              <div className={`p-6 rounded-3xl border space-y-3 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center space-x-2 text-purple-400">
                    <FileText className="w-4 h-4" />
                    <span>Career Objective</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleEnhanceWithAI(resume.careerObjective, 'objective')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{enhancingIndex === 'objective' ? 'Tailoring...' : `Tailor for ${targetRoleValue.split(' ')[0]}`}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={resume.careerObjective}
                  onChange={(e) => setResume({ ...resume, careerObjective: e.target.value })}
                  className={`w-full p-3 text-xs rounded-xl border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              {/* 3. Featured Projects (With AI Simple-Words-to-Professional Improviser) */}
              <div className={`p-6 rounded-3xl border space-y-4 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold flex items-center space-x-2 text-pink-400">
                      <Code className="w-4 h-4" />
                      <span>Featured Projects ({resume.projects.length})</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Write your project in simple words — AI rewrites it in professional resume language for <strong className="text-indigo-400">{targetRoleValue}</strong>.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {resume.projects.length > 0 && (
                      <button
                        type="button"
                        disabled={improvisingAll}
                        onClick={handleImproviseAllProjects}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-pink-500/15 border border-pink-500/30 text-pink-400 hover:bg-pink-500/25 flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
                      >
                        {improvisingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                        <span>{improvisingAll ? 'Improvising...' : 'Improvise All for Role'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={addProject}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Project</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {resume.projects.map((proj) => (
                    <div
                      key={proj.id}
                      className={`p-4 rounded-2xl border space-y-2.5 ${
                        isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <input
                          type="text"
                          placeholder="Project Title"
                          value={proj.title}
                          onChange={(e) => setResume({
                            ...resume,
                            projects: resume.projects.map((p) => p.id === proj.id ? { ...p, title: e.target.value } : p)
                          })}
                          className="flex-1 font-bold text-xs bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => removeProject(proj.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Tech Stack (e.g. React, Express, PostgreSQL)"
                        value={proj.techStack}
                        onChange={(e) => setResume({
                          ...resume,
                          projects: resume.projects.map((p) => p.id === proj.id ? { ...p, techStack: e.target.value } : p)
                        })}
                        className={`w-full px-2.5 py-1.5 text-xs rounded-lg border ${
                          isDark ? 'bg-slate-900 border-slate-800 text-indigo-300' : 'bg-white border-slate-200 text-indigo-700'
                        }`}
                      />

                      <div className="space-y-2">
                        <textarea
                          rows={3}
                          placeholder="Describe your project in simple words (e.g. made an app where students take coding tests with timer and get feedback)..."
                          value={proj.description}
                          onChange={(e) => setResume({
                            ...resume,
                            projects: resume.projects.map((p) => p.id === proj.id ? { ...p, description: e.target.value } : p)
                          })}
                          className={`w-full p-2.5 text-xs rounded-lg border ${
                            isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200'
                          }`}
                        />

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {proj.rawNotes && proj.rawNotes !== proj.description && (
                              <button
                                type="button"
                                onClick={() => restoreProjectRawNotes(proj.id)}
                                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800/70 text-slate-300 hover:text-white flex items-center space-x-1 cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore Simple Draft</span>
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={enhancingIndex === proj.id}
                            onClick={() =>
                              handleEnhanceWithAI(proj.description, 'project', proj.id, {
                                projectTitle: proj.title,
                                techStack: proj.techStack
                              })
                            }
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
                          >
                            {enhancingIndex === proj.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                            <span>
                              {enhancingIndex === proj.id
                                ? 'Improvising...'
                                : `Improvise for ${targetRoleValue}`}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Work Experience & Internships */}
              <div className={`p-6 rounded-3xl border space-y-4 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center space-x-2 text-emerald-400">
                    <Briefcase className="w-4 h-4" />
                    <span>Work Experience & Fellowships</span>
                  </h3>
                  <button
                    type="button"
                    onClick={addExperience}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Role</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {resume.workExperience.map((work) => (
                    <div
                      key={work.id}
                      className={`p-4 rounded-2xl border space-y-2.5 ${
                        isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex gap-2 flex-1">
                          <input
                            type="text"
                            placeholder="Role / Title"
                            value={work.role}
                            onChange={(e) => setResume({
                              ...resume,
                              workExperience: resume.workExperience.map((w) => w.id === work.id ? { ...w, role: e.target.value } : w)
                            })}
                            className="font-bold text-xs bg-transparent border-b border-transparent hover:border-slate-700 focus:outline-hidden"
                          />
                          <input
                            type="text"
                            placeholder="Company"
                            value={work.company}
                            onChange={(e) => setResume({
                              ...resume,
                              workExperience: resume.workExperience.map((w) => w.id === work.id ? { ...w, company: e.target.value } : w)
                            })}
                            className="text-xs text-slate-400 bg-transparent border-b border-transparent hover:border-slate-700 focus:outline-hidden"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExperience(work.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Duration (e.g. Jun 2025 - Present)"
                        value={work.duration}
                        onChange={(e) => setResume({
                          ...resume,
                          workExperience: resume.workExperience.map((w) => w.id === work.id ? { ...w, duration: e.target.value } : w)
                        })}
                        className={`w-full px-2.5 py-1 text-xs rounded-lg border ${
                          isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200'
                        }`}
                      />

                      <div className="relative">
                        <textarea
                          rows={2}
                          value={work.description}
                          onChange={(e) => setResume({
                            ...resume,
                            workExperience: resume.workExperience.map((w) => w.id === work.id ? { ...w, description: e.target.value } : w)
                          })}
                          className={`w-full p-2.5 text-xs rounded-lg border ${
                            isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => handleEnhanceWithAI(work.description, 'work', work.id)}
                          className="mt-1.5 ml-auto px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 flex items-center space-x-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{enhancingIndex === work.id ? 'Polishing...' : 'AI Polish'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Education */}
              <div className={`p-6 rounded-3xl border space-y-4 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center space-x-2 text-amber-400">
                    <GraduationCap className="w-4 h-4" />
                    <span>Education</span>
                  </h3>
                  <button
                    type="button"
                    onClick={addEducation}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Education</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {resume.education.map((edu) => (
                    <div
                      key={edu.id}
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                        isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                        <input
                          type="text"
                          placeholder="Degree"
                          value={edu.degree}
                          onChange={(e) => setResume({
                            ...resume,
                            education: resume.education.map((ed) => ed.id === edu.id ? { ...ed, degree: e.target.value } : ed)
                          })}
                          className="font-bold text-xs bg-transparent border-b border-transparent hover:border-slate-700 focus:outline-hidden"
                        />
                        <input
                          type="text"
                          placeholder="Institution"
                          value={edu.institution}
                          onChange={(e) => setResume({
                            ...resume,
                            education: resume.education.map((ed) => ed.id === edu.id ? { ...ed, institution: e.target.value } : ed)
                          })}
                          className="text-xs text-slate-400 bg-transparent border-b border-transparent hover:border-slate-700 focus:outline-hidden"
                        />
                        <input
                          type="text"
                          placeholder="Years (e.g. 2022 - 2026)"
                          value={edu.year}
                          onChange={(e) => setResume({
                            ...resume,
                            education: resume.education.map((ed) => ed.id === edu.id ? { ...ed, year: e.target.value } : ed)
                          })}
                          className="text-[11px] text-slate-400 bg-transparent border-b border-transparent hover:border-slate-700 focus:outline-hidden"
                        />
                        <input
                          type="text"
                          placeholder="Grade / GPA"
                          value={edu.gradeOrGpa}
                          onChange={(e) => setResume({
                            ...resume,
                            education: resume.education.map((ed) => ed.id === edu.id ? { ...ed, gradeOrGpa: e.target.value } : ed)
                          })}
                          className="text-[11px] text-slate-400 bg-transparent border-b border-transparent hover:border-slate-700 focus:outline-hidden"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEducation(edu.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Distinct Template Formats + Optional Upload Custom Template + Achievements */}
            <div className="space-y-6">
              {/* Template Selector + Custom Uploader */}
              <div className={`p-6 rounded-3xl border space-y-4 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Resume Template Format</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    Preview →
                  </button>
                </div>

                {/* Built-in Distinct Templates */}
                <div className="grid grid-cols-2 gap-2.5">
                  {builtInTemplates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setResume({ ...resume, templateId: tpl.id })}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        resume.templateId === tpl.id
                          ? 'border-indigo-500 bg-indigo-500/15 text-indigo-400 shadow-xs'
                          : isDark ? 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {renderTemplateWireframe(tpl.id)}
                      <div className="text-xs font-bold">{tpl.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{tpl.subtitle}</div>
                    </button>
                  ))}
                </div>

                {/* Optional Upload Template Field (JPG, JPEG, PNG, PDF, DOC, DOCX) */}
                <div className={`pt-4 border-t space-y-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-400">
                      <Palette className="w-3.5 h-3.5" />
                      <span>Upload Custom Template (Optional)</span>
                    </span>
                    <span className="text-[10px] text-slate-500">JPG, JPEG, PDF, DOC, DOCX</span>
                  </div>

                  <input
                    ref={templateFileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleTemplateUpload}
                    className="hidden"
                  />

                  <input
                    ref={logoFileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png"
                    onChange={handleCustomLogoUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    disabled={parsingTemplate}
                    onClick={() => templateFileInputRef.current?.click()}
                    className={`w-full p-3.5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-colors ${
                      isDark
                        ? 'border-slate-700 hover:border-indigo-500 bg-slate-950/60 text-slate-300'
                        : 'border-slate-300 hover:border-indigo-500 bg-slate-50 text-slate-700'
                    }`}
                  >
                    {parsingTemplate ? (
                      <>
                        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                        <span className="text-xs font-semibold text-indigo-400">
                          Extracting template & building your resume...
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-indigo-400" />
                        <span className="text-xs font-semibold">
                          {resume.customTemplate ? 'Upload New Template & Rebuild Resume' : 'Upload Template & Build Resume'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Builds your resume in this format with same icons, logos & headings
                        </span>
                      </>
                    )}
                  </button>

                  {templateNotice && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px]">
                      {templateNotice}
                    </div>
                  )}

                  {resume.customTemplate && (
                    <div
                      onClick={() => setResume({ ...resume, templateId: 'custom' })}
                      className={`p-3.5 rounded-2xl border cursor-pointer space-y-2.5 ${
                        resume.templateId === 'custom'
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>{resume.customTemplate.spec.templateName}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            File: {resume.customTemplate.fileName} • {resume.customTemplate.spec.layoutType}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearCustomTemplate();
                          }}
                          className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer"
                          title="Remove uploaded template"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Detected Colors + Logo Badge */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-4 h-4 rounded-full border border-white/20"
                            style={{ backgroundColor: resume.customTemplate.spec.primaryColor }}
                            title="Primary color"
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-white/20"
                            style={{ backgroundColor: resume.customTemplate.spec.accentColor }}
                            title="Accent color"
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-white/20"
                            style={{ backgroundColor: resume.customTemplate.spec.sidebarBgColor }}
                            title="Sidebar/Header color"
                          />
                          <span className="text-[10px] text-slate-400 ml-1">
                            Icons: {resume.customTemplate.spec.iconStyle}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            logoFileInputRef.current?.click();
                          }}
                          className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                        >
                          <ImageIcon className="w-3 h-3" />
                          <span>{resume.customTemplate.logoDataUrl ? 'Change Logo' : 'Add Logo'}</span>
                        </button>
                      </div>

                      {resume.customTemplate.logoDataUrl && (
                        <div className="flex items-center gap-2 pt-1">
                          <img
                            src={resume.customTemplate.logoDataUrl}
                            alt="Extracted template emblem"
                            className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 border border-slate-700"
                          />
                          <span className="text-[10px] text-slate-400">
                            Extracted template logo active in preview & PDF
                          </span>
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400 leading-snug">
                        <strong className="text-slate-300">Headings:</strong>{' '}
                        {Object.values(resume.customTemplate.spec.sectionHeadings).slice(0, 4).join(' · ')}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setResume({ ...resume, templateId: 'custom' });
                          setActiveTab('preview');
                        }}
                        className="w-full py-1.5 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Resume Built in This Format</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Achievements Section */}
              <div className={`p-6 rounded-3xl border space-y-4 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center space-x-2 text-amber-400">
                    <Award className="w-4 h-4" />
                    <span>Achievements</span>
                  </h3>
                  <button
                    type="button"
                    onClick={addAchievement}
                    className="p-1 rounded-md text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {resume.achievements.map((ach, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={ach}
                        onChange={(e) => {
                          const updated = [...resume.achievements];
                          updated[idx] = e.target.value;
                          setResume({ ...resume, achievements: updated });
                        }}
                        className={`flex-1 px-2.5 py-1 text-xs rounded-lg border ${
                          isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => removeAchievement(idx)}
                        className="text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Download Quick CTA */}
              <div className={`p-6 rounded-3xl border text-center space-y-3 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <p className="text-xs font-semibold text-slate-300">
                  Active Template:{' '}
                  <span className="text-indigo-400 capitalize">
                    {resume.templateId === 'custom' && resume.customTemplate
                      ? resume.customTemplate.spec.templateName
                      : resume.templateId}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => downloadResumePDF(resume)}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Styled PDF</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Live Full Page Preview with Quick Template Switcher Bar */
          <div className="space-y-5">
            <div className={`max-w-4xl mx-auto p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400 mr-1">Switch Format:</span>
                {builtInTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setResume({ ...resume, templateId: tpl.id })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      resume.templateId === tpl.id
                        ? 'bg-indigo-600 text-white'
                        : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
                {resume.customTemplate && (
                  <button
                    type="button"
                    onClick={() => setResume({ ...resume, templateId: 'custom' })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      resume.templateId === 'custom'
                        ? 'bg-emerald-600 text-white'
                        : isDark ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {resume.customTemplate.spec.templateName}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('editor')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border ${
                    isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  ← Edit Details
                </button>
                <button
                  type="button"
                  onClick={() => downloadResumePDF(resume)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export This Format (PDF)</span>
                </button>
              </div>
            </div>

            <ResumeTemplatePreview resume={resume} />
          </div>
        )}
      </div>
    </div>
  );
};
