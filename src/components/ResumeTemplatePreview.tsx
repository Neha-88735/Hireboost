import React from 'react';
import {
  Award,
  Briefcase,
  Code,
  Github,
  Globe,
  GraduationCap,
  Layers,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Shield,
  Sparkles,
  Star,
  Target,
  Terminal,
  User as UserIcon
} from 'lucide-react';
import {
  CustomResumeTemplateSpec,
  ResumeData,
  ResumeIconName,
  ResumeSectionKey
} from '../types/hireboost';

interface ResumeTemplatePreviewProps {
  resume: ResumeData;
}

const SECTION_ORDER_FALLBACK: ResumeSectionKey[] = [
  'summary',
  'skills',
  'projects',
  'experience',
  'education',
  'achievements'
];

function getInitials(fullName: string): string {
  const parts = (fullName || 'Candidate')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'HB';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function renderSectionIcon(iconName: ResumeIconName, className = 'w-3.5 h-3.5') {
  switch (iconName) {
    case 'user':
      return <UserIcon className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'code':
      return <Code className={className} />;
    case 'briefcase':
      return <Briefcase className={className} />;
    case 'graduation':
      return <GraduationCap className={className} />;
    case 'award':
      return <Award className={className} />;
    case 'layers':
      return <Layers className={className} />;
    case 'terminal':
      return <Terminal className={className} />;
    case 'target':
      return <Target className={className} />;
    case 'star':
      return <Star className={className} />;
    case 'globe':
      return <Globe className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}

export const ResumeTemplatePreview: React.FC<ResumeTemplatePreviewProps> = ({ resume }) => {
  const initials = getInitials(resume.personalInfo.fullName);
  const targetRole = resume.targetRole?.trim();

  // 1. MODERN TEMPLATE (Two-tone Indigo/Slate Left Sidebar + Tech Main Column)
  if (resume.templateId === 'modern') {
    return (
      <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-white text-slate-900 font-sans">
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[820px]">
          {/* Left Dark Sidebar */}
          <aside className="md:col-span-4 bg-slate-900 text-slate-100 p-7 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-black text-lg flex items-center justify-center shadow-lg shrink-0">
                  {initials}
                </div>
                <div>
                  <h1 className="text-lg font-extrabold tracking-tight text-white leading-snug">
                    {resume.personalInfo.fullName}
                  </h1>
                  {targetRole && (
                    <p className="text-[11px] font-semibold text-indigo-300 mt-0.5 uppercase tracking-wider">
                      {targetRole}
                    </p>
                  )}
                </div>
              </div>

              {/* Contact Block */}
              <div className="space-y-2 border-t border-slate-800 pt-4 text-[11px] text-slate-300">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-2">
                  Contact
                </h2>
                {resume.personalInfo.email && (
                  <div className="flex items-center gap-2 break-all">
                    <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{resume.personalInfo.email}</span>
                  </div>
                )}
                {resume.personalInfo.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{resume.personalInfo.phone}</span>
                  </div>
                )}
                {resume.personalInfo.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{resume.personalInfo.location}</span>
                  </div>
                )}
                {resume.personalInfo.linkedinUrl && (
                  <div className="flex items-center gap-2 break-all">
                    <Linkedin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{resume.personalInfo.linkedinUrl}</span>
                  </div>
                )}
                {resume.personalInfo.githubUrl && (
                  <div className="flex items-center gap-2 break-all">
                    <Github className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{resume.personalInfo.githubUrl}</span>
                  </div>
                )}
              </div>

              {/* Skills in Sidebar */}
              {resume.skills.length > 0 && (
                <div className="space-y-3 border-t border-slate-800 pt-4">
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Technical Stack</span>
                  </h2>
                  <div className="space-y-2.5">
                    {resume.skills.map((sGroup, i) => (
                      <div key={i}>
                        <div className="text-[11px] font-semibold text-slate-200 mb-1">
                          {sGroup.category}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {sGroup.items.map((item, j) => (
                            <span
                              key={j}
                              className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] text-indigo-200"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education in Sidebar */}
              {resume.education.length > 0 && (
                <div className="space-y-2.5 border-t border-slate-800 pt-4">
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Education</span>
                  </h2>
                  <div className="space-y-2.5">
                    {resume.education.map((e) => (
                      <div key={e.id} className="text-[11px]">
                        <div className="font-bold text-white">{e.degree}</div>
                        <div className="text-slate-400">{e.institution}</div>
                        <div className="text-[10px] text-indigo-300 mt-0.5">
                          {e.year} {e.gradeOrGpa ? `• ${e.gradeOrGpa}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {resume.achievements.length > 0 && (
              <div className="space-y-2 border-t border-slate-800 pt-4">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>Honors</span>
                </h2>
                <ul className="space-y-1 text-[11px] text-slate-300">
                  {resume.achievements.map((ach, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-indigo-400 mt-0.5">▸</span>
                      <span>{ach}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          {/* Main Column */}
          <main className="md:col-span-8 p-8 space-y-6 bg-white">
            {resume.careerObjective && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Target className="w-3.5 h-3.5" />
                  </span>
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                    Career Profile
                  </h2>
                </div>
                <p className="text-xs leading-relaxed text-slate-600 border-l-2 border-indigo-500 pl-3">
                  {resume.careerObjective}
                </p>
              </section>
            )}

            {resume.projects.length > 0 && (
              <section>
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                  <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Code className="w-3.5 h-3.5" />
                  </span>
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                    Featured Engineering Projects
                  </h2>
                </div>
                <div className="space-y-3.5">
                  {resume.projects.map((p) => (
                    <div key={p.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900">{p.title}</span>
                        {p.techStack && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                            {p.techStack}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{p.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {resume.workExperience.length > 0 && (
              <section>
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                  <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Briefcase className="w-3.5 h-3.5" />
                  </span>
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                    Work Experience
                  </h2>
                </div>
                <div className="space-y-4">
                  {resume.workExperience.map((w) => (
                    <div key={w.id} className="relative pl-4 border-l-2 border-slate-200">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 absolute -left-[5px] top-1.5" />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          {w.role} <span className="text-indigo-600 font-semibold">@ {w.company}</span>
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">{w.duration}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{w.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    );
  }

  // 2. MINIMAL TEMPLATE (Centered Clean Single Column Monochrome)
  if (resume.templateId === 'minimal') {
    return (
      <div className="max-w-4xl mx-auto p-10 rounded-3xl border border-slate-200 shadow-xl bg-white text-slate-800 font-sans space-y-6">
        <header className="text-center space-y-2 border-b border-slate-200 pb-5">
          <h1 className="text-3xl font-light tracking-widest text-slate-900 uppercase">
            {resume.personalInfo.fullName}
          </h1>
          {targetRole && (
            <p className="text-xs tracking-[0.2em] uppercase text-slate-500 font-medium">
              {targetRole}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
            {resume.personalInfo.email && <span>{resume.personalInfo.email}</span>}
            {resume.personalInfo.phone && <span>· {resume.personalInfo.phone}</span>}
            {resume.personalInfo.location && <span>· {resume.personalInfo.location}</span>}
            {resume.personalInfo.linkedinUrl && <span>· {resume.personalInfo.linkedinUrl}</span>}
            {resume.personalInfo.githubUrl && <span>· {resume.personalInfo.githubUrl}</span>}
          </div>
        </header>

        {resume.careerObjective && (
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-2">
              Profile
            </h2>
            <p className="text-xs leading-relaxed text-slate-700">{resume.careerObjective}</p>
          </section>
        )}

        {resume.workExperience.length > 0 && (
          <section className="border-t border-slate-100 pt-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-3">
              Experience
            </h2>
            <div className="space-y-3.5">
              {resume.workExperience.map((w) => (
                <div key={w.id} className="text-xs">
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold text-slate-900">
                      {w.role} — <span className="font-normal text-slate-600">{w.company}</span>
                    </span>
                    <span className="text-[11px] text-slate-400">{w.duration}</span>
                  </div>
                  <p className="text-slate-600 mt-1 leading-relaxed">{w.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {resume.projects.length > 0 && (
          <section className="border-t border-slate-100 pt-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-3">
              Selected Projects
            </h2>
            <div className="space-y-3">
              {resume.projects.map((p) => (
                <div key={p.id} className="text-xs">
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold text-slate-900">{p.title}</span>
                    {p.techStack && <span className="text-[11px] text-slate-400">{p.techStack}</span>}
                  </div>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">{p.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {resume.skills.length > 0 && (
          <section className="border-t border-slate-100 pt-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-2">
              Skills
            </h2>
            <div className="space-y-1 text-xs text-slate-700">
              {resume.skills.map((sGroup, i) => (
                <div key={i}>
                  <span className="font-semibold text-slate-900">{sGroup.category}: </span>
                  <span className="text-slate-600">{sGroup.items.join(' · ')}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {resume.education.length > 0 && (
          <section className="border-t border-slate-100 pt-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-2">
              Education
            </h2>
            <div className="space-y-2">
              {resume.education.map((e) => (
                <div key={e.id} className="text-xs flex items-baseline justify-between">
                  <div>
                    <span className="font-semibold text-slate-900">{e.degree}</span>
                    <span className="text-slate-500 ml-2">{e.institution}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {e.year} {e.gradeOrGpa ? `(${e.gradeOrGpa})` : ''}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {resume.achievements.length > 0 && (
          <section className="border-t border-slate-100 pt-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-2">
              Achievements
            </h2>
            <ul className="space-y-1 text-xs text-slate-600">
              {resume.achievements.map((ach, i) => (
                <li key={i}>— {ach}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  // 3. EXECUTIVE TEMPLATE (Formal Serif Academic & Leadership)
  if (resume.templateId === 'executive') {
    return (
      <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden border border-slate-300 shadow-2xl bg-stone-50 text-slate-900 font-serif">
        {/* Formal Navy Header Band with Gold Accent */}
        <header className="bg-slate-900 text-stone-100 px-10 py-7 border-b-4 border-amber-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-amber-400 flex items-center justify-center text-amber-300 font-bold text-base shrink-0">
                {initials}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-wide text-white uppercase">
                  {resume.personalInfo.fullName}
                </h1>
                {targetRole && (
                  <p className="text-xs text-amber-300 tracking-widest uppercase mt-0.5">
                    {targetRole}
                  </p>
                )}
              </div>
            </div>
            <div className="text-[11px] text-stone-300 sm:text-right space-y-0.5 font-sans">
              {resume.personalInfo.email && <div>{resume.personalInfo.email}</div>}
              {resume.personalInfo.phone && <div>{resume.personalInfo.phone}</div>}
              {resume.personalInfo.location && <div>{resume.personalInfo.location}</div>}
              {(resume.personalInfo.linkedinUrl || resume.personalInfo.githubUrl) && (
                <div className="text-amber-300/90 text-[10px]">
                  {[resume.personalInfo.linkedinUrl, resume.personalInfo.githubUrl].filter(Boolean).join('  |  ')}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-10 space-y-6 bg-white">
          {resume.careerObjective && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-900 border-b-2 border-slate-900 pb-1 mb-2.5">
                Executive Summary
              </h2>
              <p className="text-xs leading-relaxed text-slate-700">{resume.careerObjective}</p>
            </section>
          )}

          {resume.workExperience.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-900 border-b-2 border-slate-900 pb-1 mb-3">
                Leadership & Work Experience
              </h2>
              <div className="space-y-4">
                {resume.workExperience.map((w) => (
                  <div key={w.id} className="text-xs">
                    <div className="flex items-baseline justify-between">
                      <span className="font-bold text-slate-900 text-sm">{w.role}</span>
                      <span className="font-sans text-[11px] font-semibold text-slate-600">{w.duration}</span>
                    </div>
                    <div className="italic text-amber-800 text-[11px] mb-1">{w.company}</div>
                    <p className="text-slate-700 leading-relaxed font-sans">{w.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {resume.projects.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-900 border-b-2 border-slate-900 pb-1 mb-3">
                Strategic Projects & Initiatives
              </h2>
              <div className="space-y-3">
                {resume.projects.map((p) => (
                  <div key={p.id} className="text-xs">
                    <div className="flex items-baseline justify-between">
                      <span className="font-bold text-slate-900">{p.title}</span>
                      {p.techStack && (
                        <span className="font-sans text-[11px] italic text-slate-600">{p.techStack}</span>
                      )}
                    </div>
                    <p className="text-slate-700 mt-1 leading-relaxed font-sans">{p.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
            {resume.education.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-900 border-b-2 border-slate-900 pb-1 mb-2.5">
                  Academic Credentials
                </h2>
                <div className="space-y-2.5">
                  {resume.education.map((e) => (
                    <div key={e.id} className="text-xs">
                      <div className="font-bold text-slate-900">{e.degree}</div>
                      <div className="text-slate-600 font-sans">
                        {e.institution} • {e.year}
                      </div>
                      {e.gradeOrGpa && (
                        <div className="text-[11px] text-amber-800 font-sans font-semibold">{e.gradeOrGpa}</div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {resume.skills.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-900 border-b-2 border-slate-900 pb-1 mb-2.5">
                  Core Competencies
                </h2>
                <div className="space-y-1.5 text-xs font-sans text-slate-700">
                  {resume.skills.map((sGroup, i) => (
                    <div key={i}>
                      <strong className="text-slate-900">{sGroup.category}: </strong>
                      <span>{sGroup.items.join(', ')}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {resume.achievements.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-900 border-b-2 border-slate-900 pb-1 mb-2.5">
                Awards & Certifications
              </h2>
              <ul className="list-disc list-inside text-xs font-sans text-slate-700 space-y-1">
                {resume.achievements.map((ach, i) => (
                  <li key={i}>{ach}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    );
  }

  // 4. COMPACT TEMPLATE (High-Density 1-Page Teal Split Header + Grid)
  if (resume.templateId === 'compact') {
    return (
      <div className="max-w-4xl mx-auto p-7 rounded-3xl border border-teal-200 shadow-xl bg-white text-slate-900 font-sans space-y-4">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-teal-600 pb-3">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              {resume.personalInfo.fullName}
            </h1>
            {targetRole && (
              <span className="inline-block mt-0.5 text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                {targetRole}
              </span>
            )}
          </div>
          <div className="text-[10.5px] text-slate-600 sm:text-right space-y-0.5">
            <div>
              {[resume.personalInfo.email, resume.personalInfo.phone, resume.personalInfo.location]
                .filter(Boolean)
                .join('  •  ')}
            </div>
            <div className="text-teal-700 font-medium">
              {[resume.personalInfo.linkedinUrl, resume.personalInfo.githubUrl].filter(Boolean).join('  |  ')}
            </div>
          </div>
        </header>

        {resume.careerObjective && (
          <section className="bg-teal-50/70 border border-teal-100 rounded-xl p-3">
            <p className="text-[11.5px] leading-snug text-slate-700">{resume.careerObjective}</p>
          </section>
        )}

        {resume.projects.length > 0 && (
          <section>
            <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-teal-800 border-b border-teal-200 pb-1 mb-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-teal-600" />
              <span>Projects</span>
            </h2>
            <div className="space-y-2">
              {resume.projects.map((p) => (
                <div key={p.id} className="text-[11.5px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">{p.title}</span>
                    {p.techStack && (
                      <span className="text-[10px] font-mono text-teal-700">{p.techStack}</span>
                    )}
                  </div>
                  <p className="text-slate-700 leading-snug">{p.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {resume.workExperience.length > 0 && (
          <section>
            <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-teal-800 border-b border-teal-200 pb-1 mb-2 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-teal-600" />
              <span>Experience</span>
            </h2>
            <div className="space-y-2">
              {resume.workExperience.map((w) => (
                <div key={w.id} className="text-[11.5px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {w.role} · <span className="text-teal-700">{w.company}</span>
                    </span>
                    <span className="text-[10.5px] text-slate-500">{w.duration}</span>
                  </div>
                  <p className="text-slate-700 leading-snug">{w.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
          {resume.skills.length > 0 && (
            <section>
              <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-teal-800 border-b border-teal-200 pb-1 mb-2">
                Skills
              </h2>
              <div className="space-y-1 text-[11px] text-slate-700">
                {resume.skills.map((sGroup, i) => (
                  <div key={i}>
                    <strong className="text-slate-900">{sGroup.category}: </strong>
                    <span>{sGroup.items.join(', ')}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="space-y-3">
            {resume.education.length > 0 && (
              <section>
                <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-teal-800 border-b border-teal-200 pb-1 mb-1.5">
                  Education
                </h2>
                {resume.education.map((e) => (
                  <div key={e.id} className="text-[11px] flex items-center justify-between">
                    <span>
                      <strong className="text-slate-900">{e.degree}</strong> — {e.institution}
                    </span>
                    <span className="text-slate-500">{e.year}</span>
                  </div>
                ))}
              </section>
            )}

            {resume.achievements.length > 0 && (
              <section>
                <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-teal-800 border-b border-teal-200 pb-1 mb-1.5">
                  Achievements
                </h2>
                <ul className="space-y-0.5 text-[11px] text-slate-700">
                  {resume.achievements.map((ach, i) => (
                    <li key={i}>• {ach}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 5. CUSTOM UPLOADED TEMPLATE (Matches Uploaded JPG/JPEG/PNG/PDF/DOC/DOCX Spec, Icons, Logos & Headings)
  const spec: CustomResumeTemplateSpec = resume.customTemplate?.spec || {
    templateName: 'Custom Uploaded Format',
    layoutType: 'sidebar-left',
    fontStyle: 'sans',
    primaryColor: '#1e3a8a',
    accentColor: '#4f46e5',
    sidebarBgColor: '#0f172a',
    headerBgColor: '#1e293b',
    textColor: '#1e293b',
    mutedColor: '#64748b',
    headerAlignment: 'left',
    iconStyle: 'circle-badge',
    showContactIcons: true,
    showSectionIcons: true,
    logoStyle: 'monogram-circle',
    hasEmbeddedLogo: false,
    sectionHeadings: {
      summary: 'Professional Summary',
      skills: 'Core Competencies',
      projects: 'Key Projects',
      experience: 'Work Experience',
      education: 'Education',
      achievements: 'Certifications & Awards'
    },
    sectionOrder: SECTION_ORDER_FALLBACK,
    sectionIcons: {
      summary: 'user',
      skills: 'layers',
      projects: 'code',
      experience: 'briefcase',
      education: 'graduation',
      achievements: 'award'
    },
    dividerStyle: 'accent-bar',
    bulletStyle: 'disc',
    designSummary: 'Custom uploaded template styling'
  };

  const logoDataUrl = resume.customTemplate?.logoDataUrl;
  const fontClass =
    spec.fontStyle === 'serif' ? 'font-serif' : spec.fontStyle === 'mono' ? 'font-mono' : 'font-sans';
  const bulletGlyph =
    spec.bulletStyle === 'square'
      ? '▪'
      : spec.bulletStyle === 'arrow'
        ? '▸'
        : spec.bulletStyle === 'dash'
          ? '—'
          : '•';

  const renderLogoBadge = () => {
    if (logoDataUrl) {
      return (
        <img
          src={logoDataUrl}
          alt="Template logo"
          className="w-14 h-14 object-contain rounded-xl bg-white/95 p-1 border border-slate-200 shadow-md shrink-0"
        />
      );
    }
    if (spec.logoStyle === 'none') return null;

    const badgeText = spec.logoText || initials;
    if (spec.logoStyle === 'crest-emblem') {
      return (
        <div
          className="w-13 h-13 rounded-2xl flex flex-col items-center justify-center text-white shadow-md shrink-0 border-2"
          style={{ backgroundColor: spec.primaryColor, borderColor: spec.accentColor }}
        >
          <Shield className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-black leading-none">{badgeText}</span>
        </div>
      );
    }
    if (spec.logoStyle === 'monogram-square' || spec.logoStyle === 'initials-pill') {
      return (
        <div
          className={`w-12 h-12 flex items-center justify-center text-white font-black text-base shadow-md shrink-0 ${
            spec.logoStyle === 'initials-pill' ? 'rounded-2xl px-3 w-auto' : 'rounded-lg'
          }`}
          style={{ backgroundColor: spec.accentColor }}
        >
          {badgeText}
        </div>
      );
    }
    return (
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-base shadow-md shrink-0 border-2 border-white/30"
        style={{ backgroundColor: spec.accentColor }}
      >
        {badgeText}
      </div>
    );
  };

  const renderHeading = (key: ResumeSectionKey, inDarkSidebar = false) => {
    const title = spec.sectionHeadings[key] || key;
    const iconName = spec.sectionIcons[key] || 'sparkles';
    const headingColor = inDarkSidebar ? '#ffffff' : spec.primaryColor;
    const accent = spec.accentColor;

    return (
      <div className="mb-2.5">
        <div className="flex items-center gap-2">
          {spec.showSectionIcons && spec.iconStyle !== 'none' && (
            <span
              className={`flex items-center justify-center shrink-0 ${
                spec.iconStyle === 'circle-badge'
                  ? 'w-6 h-6 rounded-full text-white'
                  : spec.iconStyle === 'square-badge'
                    ? 'w-6 h-6 rounded-md text-white'
                    : spec.iconStyle === 'minimal-dot'
                      ? 'w-2.5 h-2.5 rounded-full'
                      : 'w-4 h-4'
              }`}
              style={
                spec.iconStyle === 'circle-badge' || spec.iconStyle === 'square-badge'
                  ? { backgroundColor: accent }
                  : spec.iconStyle === 'minimal-dot'
                    ? { backgroundColor: accent }
                    : { color: accent }
              }
            >
              {spec.iconStyle !== 'minimal-dot' && renderSectionIcon(iconName, 'w-3.5 h-3.5')}
            </span>
          )}
          <h2
            className="text-xs font-extrabold uppercase tracking-wider"
            style={{ color: headingColor }}
          >
            {title}
          </h2>
        </div>

        {spec.dividerStyle !== 'none' && (
          <div className="mt-1.5 flex items-center">
            {spec.dividerStyle === 'accent-bar' ? (
              <>
                <span className="h-[2px] w-10 rounded-full" style={{ backgroundColor: accent }} />
                <span
                  className="h-[1px] flex-1 ml-1"
                  style={{ backgroundColor: inDarkSidebar ? 'rgba(255,255,255,0.2)' : '#e2e8f0' }}
                />
              </>
            ) : spec.dividerStyle === 'double' ? (
              <div className="w-full space-y-0.5">
                <div className="h-[1.5px] w-full" style={{ backgroundColor: accent }} />
                <div className="h-[0.5px] w-full" style={{ backgroundColor: accent, opacity: 0.5 }} />
              </div>
            ) : spec.dividerStyle === 'dashed' ? (
              <div
                className="w-full border-b border-dashed"
                style={{ borderColor: inDarkSidebar ? 'rgba(255,255,255,0.3)' : accent }}
              />
            ) : (
              <div
                className="w-full h-[1px]"
                style={{ backgroundColor: inDarkSidebar ? 'rgba(255,255,255,0.22)' : '#cbd5e1' }}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSectionBody = (key: ResumeSectionKey, inDarkSidebar = false) => {
    const bodyTextStyle = { color: inDarkSidebar ? '#e2e8f0' : spec.textColor };
    const mutedStyle = { color: inDarkSidebar ? '#94a3b8' : spec.mutedColor };

    if (key === 'summary' && resume.careerObjective) {
      return (
        <section key={key}>
          {renderHeading('summary', inDarkSidebar)}
          <p className="text-xs leading-relaxed" style={bodyTextStyle}>
            {resume.careerObjective}
          </p>
        </section>
      );
    }

    if (key === 'skills' && resume.skills.length > 0) {
      return (
        <section key={key}>
          {renderHeading('skills', inDarkSidebar)}
          <div className="space-y-2 text-xs" style={bodyTextStyle}>
            {resume.skills.map((sg, i) => (
              <div key={i}>
                <strong style={{ color: inDarkSidebar ? '#ffffff' : spec.primaryColor }}>
                  {sg.category}:{' '}
                </strong>
                <span>{sg.items.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (key === 'projects' && resume.projects.length > 0) {
      return (
        <section key={key}>
          {renderHeading('projects', inDarkSidebar)}
          <div className="space-y-3">
            {resume.projects.map((p) => (
              <div key={p.id} className="text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold" style={{ color: inDarkSidebar ? '#ffffff' : spec.primaryColor }}>
                    {p.title}
                  </span>
                  {p.techStack && (
                    <span className="text-[10.5px] font-semibold" style={{ color: spec.accentColor }}>
                      [{p.techStack}]
                    </span>
                  )}
                </div>
                <p className="mt-1 leading-relaxed" style={bodyTextStyle}>
                  {p.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (key === 'experience' && resume.workExperience.length > 0) {
      return (
        <section key={key}>
          {renderHeading('experience', inDarkSidebar)}
          <div className="space-y-3">
            {resume.workExperience.map((w) => (
              <div key={w.id} className="text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold" style={{ color: inDarkSidebar ? '#ffffff' : spec.primaryColor }}>
                    {w.role}
                  </span>
                  <span className="text-[11px]" style={mutedStyle}>
                    {w.company} • {w.duration}
                  </span>
                </div>
                <p className="mt-1 leading-relaxed" style={bodyTextStyle}>
                  {w.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (key === 'education' && resume.education.length > 0) {
      return (
        <section key={key}>
          {renderHeading('education', inDarkSidebar)}
          <div className="space-y-2">
            {resume.education.map((e) => (
              <div key={e.id} className="text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold" style={{ color: inDarkSidebar ? '#ffffff' : spec.primaryColor }}>
                    {e.degree}
                  </span>
                  <span className="ml-2" style={mutedStyle}>
                    — {e.institution}
                  </span>
                </div>
                <span className="text-[11px]" style={mutedStyle}>
                  {e.year} {e.gradeOrGpa ? `(${e.gradeOrGpa})` : ''}
                </span>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (key === 'achievements' && resume.achievements.length > 0) {
      return (
        <section key={key}>
          {renderHeading('achievements', inDarkSidebar)}
          <ul className="space-y-1 text-xs" style={bodyTextStyle}>
            {resume.achievements.map((ach, i) => (
              <li key={i} className="flex items-start gap-2">
                <span style={{ color: spec.accentColor }}>{bulletGlyph}</span>
                <span>{ach}</span>
              </li>
            ))}
          </ul>
        </section>
      );
    }

    return null;
  };

  const renderContactItems = (onDark: boolean) => {
    const iconCol = onDark ? '#ffffff' : spec.accentColor;
    const textCol = onDark ? '#e2e8f0' : spec.mutedColor;
    const entries = [
      { icon: <Mail className="w-3 h-3" />, value: resume.personalInfo.email },
      { icon: <Phone className="w-3 h-3" />, value: resume.personalInfo.phone },
      { icon: <MapPin className="w-3 h-3" />, value: resume.personalInfo.location },
      { icon: <Linkedin className="w-3 h-3" />, value: resume.personalInfo.linkedinUrl },
      { icon: <Github className="w-3 h-3" />, value: resume.personalInfo.githubUrl }
    ].filter((item) => Boolean(item.value));

    return (
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px]" style={{ color: textCol }}>
        {entries.map((entry, idx) => (
          <span key={idx} className="inline-flex items-center gap-1.5 break-all">
            {spec.showContactIcons && <span style={{ color: iconCol }}>{entry.icon}</span>}
            <span>{entry.value}</span>
          </span>
        ))}
      </div>
    );
  };

  const orderedSections = spec.sectionOrder.length ? spec.sectionOrder : SECTION_ORDER_FALLBACK;

  // Sidebar layouts for custom template
  if (spec.layoutType === 'sidebar-left' || spec.layoutType === 'sidebar-right') {
    const sidebarKeys: ResumeSectionKey[] = ['skills', 'education', 'achievements'];
    const mainKeys = orderedSections.filter((k) => !sidebarKeys.includes(k));
    const sideKeys = orderedSections.filter((k) => sidebarKeys.includes(k));

    const sidebarNode = (
      <aside
        className="md:col-span-4 p-7 space-y-6 text-white"
        style={{ backgroundColor: spec.sidebarBgColor }}
      >
        <div className="flex items-center gap-3">
          {renderLogoBadge()}
          <div>
            <h1 className="text-lg font-extrabold leading-tight text-white">
              {resume.personalInfo.fullName}
            </h1>
            {targetRole && (
              <p className="text-[11px] font-semibold uppercase tracking-wider mt-0.5 text-white/80">
                {targetRole}
              </p>
            )}
          </div>
        </div>
        <div className="border-t border-white/15 pt-4">{renderContactItems(true)}</div>
        <div className="space-y-5">{sideKeys.map((k) => renderSectionBody(k, true))}</div>
      </aside>
    );

    const mainNode = (
      <main className="md:col-span-8 p-8 space-y-6 bg-white">
        {mainKeys.map((k) => renderSectionBody(k, false))}
      </main>
    );

    return (
      <div className={`max-w-4xl mx-auto rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-white ${fontClass}`}>
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[800px]">
          {spec.layoutType === 'sidebar-left' ? (
            <>
              {sidebarNode}
              {mainNode}
            </>
          ) : (
            <>
              {mainNode}
              {sidebarNode}
            </>
          )}
        </div>
      </div>
    );
  }

  // Banner-top / Two-column-header / Single-column layouts for custom template
  const isBanner = spec.layoutType === 'banner-top';
  const isCentered = spec.headerAlignment === 'center';

  return (
    <div className={`max-w-4xl mx-auto rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-white ${fontClass}`}>
      <header
        className={`px-9 py-7 ${isCentered && !isBanner ? 'text-center' : ''}`}
        style={
          isBanner
            ? { backgroundColor: spec.headerBgColor, color: '#ffffff' }
            : { borderBottom: `3px solid ${spec.primaryColor}`, backgroundColor: '#ffffff' }
        }
      >
        <div
          className={`flex flex-col sm:flex-row gap-4 ${
            isCentered && !isBanner
              ? 'items-center justify-center text-center'
              : spec.layoutType === 'two-column-header' || spec.headerAlignment === 'split'
                ? 'sm:items-center justify-between'
                : 'items-start'
          }`}
        >
          <div className={`flex items-center gap-4 ${isCentered && !isBanner ? 'flex-col' : ''}`}>
            {renderLogoBadge()}
            <div>
              <h1
                className="text-2xl font-black tracking-tight uppercase"
                style={{ color: isBanner ? '#ffffff' : spec.primaryColor }}
              >
                {resume.personalInfo.fullName}
              </h1>
              {targetRole && (
                <p
                  className="text-xs font-bold uppercase tracking-wider mt-0.5"
                  style={{ color: isBanner ? '#e2e8f0' : spec.accentColor }}
                >
                  {targetRole}
                </p>
              )}
            </div>
          </div>

          <div className={spec.layoutType === 'two-column-header' ? 'sm:max-w-xs' : 'mt-1'}>
            {renderContactItems(isBanner)}
          </div>
        </div>
      </header>

      <div className="p-9 space-y-6 bg-white">
        {orderedSections.map((k) => renderSectionBody(k, false))}
      </div>
    </div>
  );
};
