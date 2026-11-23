import { jsPDF } from 'jspdf';
import {
  CustomResumeTemplateSpec,
  EvaluationReport,
  ResumeData,
  ResumeSectionKey,
  Transcript
} from '../types/hireboost';

export function downloadTranscriptPDF(transcript: Transcript, evaluation?: EvaluationReport): void {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = 45;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 55, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('HireBoost | Official AI Mock Interview Transcript', margin + 16, y + 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated: ${new Date(transcript.generatedAt).toLocaleString()} | ID: ${transcript.transcriptId}`, margin + 16, y + 44);

  y += 75;

  // Metadata Card
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 65, 4, 4, 'FD');

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('Interview Topic:', margin + 15, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(transcript.interviewTitle, margin + 110, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.text('Domain / Track:', margin + 15, y + 36);
  doc.setFont('helvetica', 'normal');
  doc.text(`${transcript.domain} (${transcript.difficulty} Level)`, margin + 110, y + 36);

  doc.setFont('helvetica', 'bold');
  doc.text('Duration:', margin + 15, y + 52);
  doc.setFont('helvetica', 'normal');
  doc.text(`${transcript.durationMinutes} Minutes (Allocated) | Language: ${transcript.language}`, margin + 110, y + 52);

  if (evaluation) {
    doc.setFont('helvetica', 'bold');
    doc.text('Overall Score:', margin + 340, y + 20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // emerald
    doc.setFontSize(14);
    doc.text(`${evaluation.overallScore} / 100`, margin + 420, y + 20);

    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Tech: ${evaluation.technicalScore}% | Comm: ${evaluation.communicationScore}% | Conf: ${evaluation.confidenceScore}%`, margin + 340, y + 38);
  }

  y += 85;

  // Q&A Transcript
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Interview Dialogue & Candidate Responses', margin, y);
  y += 18;

  transcript.conversation.forEach((item, index) => {
    // Check page overflow
    if (y > 700) {
      doc.addPage();
      y = 45;
    }

    // Question pill
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'F');
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229); // indigo
    doc.text(`Q${item.questionNumber}:`, margin + 10, y + 16);

    doc.setTextColor(30, 41, 59);
    const qLines = doc.splitTextToSize(item.questionText, contentWidth - 45);
    doc.text(qLines[0] || '', margin + 35, y + 16);
    y += 28;

    // Remaining question lines if long
    if (qLines.length > 1) {
      for (let i = 1; i < qLines.length; i++) {
        doc.text(qLines[i], margin + 35, y);
        y += 14;
      }
    }

    // Answer Box
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const metaLabel =
      item.questionType === 'coding'
        ? `[Coding${item.submissionType ? ` • ${item.submissionType.toUpperCase()} SUBMIT` : ''}${
            item.executionSummary ? ` • ${item.executionSummary}` : ''
          }] `
        : item.submissionType
          ? `[Voice • ${item.submissionType.toUpperCase()} SUBMIT${
              typeof item.evaluationScore === 'number' ? ` • Score ${item.evaluationScore}/100` : ''
            }] `
          : '';
    const ansLines = doc.splitTextToSize(`Candidate: ${metaLabel}"${item.answerText}"`, contentWidth - 25);
    ansLines.forEach((line: string) => {
      if (y > 750) {
        doc.addPage();
        y = 45;
      }
      doc.text(line, margin + 12, y);
      y += 13;
    });

    if (item.matchedKeywords && item.matchedKeywords.length > 0) {
      doc.setFontSize(8.5);
      doc.setTextColor(16, 185, 129);
      doc.text(`Matched Keywords: ${item.matchedKeywords.join(', ')}`, margin + 12, y);
      y += 12;
      doc.setFontSize(9);
    }
    if (item.missingKeywords && item.missingKeywords.length > 0) {
      doc.setFontSize(8.5);
      doc.setTextColor(217, 119, 6);
      doc.text(`Missing Concepts: ${item.missingKeywords.join(', ')}`, margin + 12, y);
      y += 12;
      doc.setFontSize(9);
    }

    if (item.submittedCode) {
      const codeLines = doc.splitTextToSize(
        `[${item.language || 'code'}]\n${item.submittedCode}`,
        contentWidth - 30
      );
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      codeLines.slice(0, 28).forEach((line: string) => {
        if (y > 750) {
          doc.addPage();
          y = 45;
        }
        doc.text(line, margin + 16, y);
        y += 11;
      });
      doc.setFont('helvetica', 'normal');
    }

    if (item.interviewerNotes) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Notes: ${item.interviewerNotes}`, margin + 12, y + 3);
      y += 16;
    }

    y += 12;
  });

  // Evaluation Highlights if present
  if (evaluation && evaluation.writtenFeedback) {
    if (y > 660) {
      doc.addPage();
      y = 45;
    }

    y += 10;
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y, margin + contentWidth, y);
    y += 18;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Performance Evaluation Summary', margin, y);
    y += 16;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const fbLines = doc.splitTextToSize(evaluation.writtenFeedback, contentWidth);
    doc.text(fbLines, margin, y);
    y += fbLines.length * 13 + 10;

    if (evaluation.suggestions && evaluation.suggestions.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Key Improvement Suggestions:', margin, y);
      y += 14;
      doc.setFont('helvetica', 'normal');
      evaluation.suggestions.forEach(s => {
        doc.text(`• ${s}`, margin + 10, y);
        y += 13;
      });
    }
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`HireBoost - AI Interview Preparation Platform | Page ${i} of ${totalPages}`, pageWidth / 2, 815, { align: 'center' });
  }

  doc.save(`HireBoost_Transcript_${transcript.sessionId}.pdf`);
}

export function downloadTranscriptTXT(transcript: Transcript, evaluation?: EvaluationReport): void {
  let content = `==========================================================\n`;
  content += `HIREBOOST - AI MOCK INTERVIEW TRANSCRIPT\n`;
  content += `==========================================================\n`;
  content += `Session ID: ${transcript.sessionId}\n`;
  content += `Topic: ${transcript.interviewTitle}\n`;
  content += `Domain: ${transcript.domain} (${transcript.difficulty} Level)\n`;
  content += `Duration: ${transcript.durationMinutes} Minutes\n`;
  content += `Generated: ${new Date(transcript.generatedAt).toLocaleString()}\n`;

  if (evaluation) {
    content += `\n--- EVALUATION SUMMARY ---\n`;
    content += `Overall Score: ${evaluation.overallScore}/100\n`;
    content += `Technical: ${evaluation.technicalScore}/100 | Communication: ${evaluation.communicationScore}/100\n`;
    content += `Confidence: ${evaluation.confidenceScore}/100 | Quality: ${evaluation.responseQualityScore}/100\n`;
    content += `Feedback: ${evaluation.writtenFeedback}\n`;
  }

  content += `\n--- INTERVIEW QUESTIONS & ANSWERS ---\n\n`;
  transcript.conversation.forEach((item) => {
    content += `Q${item.questionNumber}: ${item.questionText}\n`;
    content += `Timestamp: ${item.timestamp} | Duration: ${item.durationSeconds}s`;
    if (item.submissionType) {
      content += ` | Submission: ${item.submissionType === 'auto' ? 'Auto Submission' : 'Manual Submission'}`;
    }
    if (item.executionSummary) {
      content += ` | Tests: ${item.executionSummary}`;
    }
    content += `\n`;
    content += `Answer:\n${item.answerText}\n`;
    if (item.matchedKeywords && item.matchedKeywords.length > 0) {
      content += `Matched Keywords: ${item.matchedKeywords.join(', ')}\n`;
    }
    if (item.missingKeywords && item.missingKeywords.length > 0) {
      content += `Missing Concepts: ${item.missingKeywords.join(', ')}\n`;
    }
    if (item.submittedCode) {
      content += `Code (${item.language || 'code'}):\n${item.submittedCode}\n`;
    }
    if (item.interviewerNotes) {
      content += `Notes: ${item.interviewerNotes}\n`;
    }
    content += `----------------------------------------------------------\n\n`;
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `HireBoost_Transcript_${transcript.sessionId}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function hexToRgb(hex: string | undefined, fallback: [number, number, number]): [number, number, number] {
  if (!hex || typeof hex !== 'string') return fallback;
  const clean = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return fallback;
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16)
  ];
}

function getInitials(fullName: string): string {
  const parts = (fullName || 'HB').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'HB';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function drawLogoOrMonogramPdf(
  doc: jsPDF,
  x: number,
  y: number,
  size: number,
  initials: string,
  accentRgb: [number, number, number],
  logoStyle: CustomResumeTemplateSpec['logoStyle'],
  logoDataUrl?: string
) {
  if (logoDataUrl) {
    try {
      const format = logoDataUrl.includes('image/png') ? 'PNG' : 'JPEG';
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, y, size, size, 4, 4, 'F');
      doc.addImage(logoDataUrl, format, x + 2, y + 2, size - 4, size - 4);
      return;
    } catch {
      // Fall back to vector emblem if image decode fails
    }
  }
  if (logoStyle === 'none') return;
  doc.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
  if (logoStyle === 'monogram-circle') {
    doc.circle(x + size / 2, y + size / 2, size / 2, 'F');
  } else {
    doc.roundedRect(x, y, size, size, 6, 6, 'F');
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(Math.max(10, Math.round(size * 0.38)));
  doc.setTextColor(255, 255, 255);
  doc.text(initials, x + size / 2, y + size / 2 + 4, { align: 'center' });
}

export function downloadResumePDF(resume: ResumeData): void {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const initials = getInitials(resume.personalInfo.fullName);
  const targetRole = resume.targetRole?.trim();
  const fileName = `${(resume.personalInfo.fullName || 'Candidate').replace(/\s+/g, '_')}_HireBoost_Resume.pdf`;

  const contactItems = [
    resume.personalInfo.email,
    resume.personalInfo.phone,
    resume.personalInfo.location,
    resume.personalInfo.linkedinUrl,
    resume.personalInfo.githubUrl
  ].filter(Boolean);

  // Shared two-column sidebar renderer (used by Modern and Custom sidebar layouts)
  const renderSidebarTemplatePdf = (opts: {
    side: 'left' | 'right';
    fontName: 'helvetica' | 'times' | 'courier';
    sidebarBg: [number, number, number];
    primaryRgb: [number, number, number];
    accentRgb: [number, number, number];
    textRgb: [number, number, number];
    mutedRgb: [number, number, number];
    iconStyle: CustomResumeTemplateSpec['iconStyle'];
    logoStyle: CustomResumeTemplateSpec['logoStyle'];
    logoText?: string;
    logoDataUrl?: string;
    headings: Record<ResumeSectionKey, string>;
    mainOrder: ResumeSectionKey[];
    sideOrder: ResumeSectionKey[];
    bulletChar: string;
  }) => {
    const sidebarW = 195;
    const sidebarX = opts.side === 'left' ? 0 : pageWidth - sidebarW;
    const mainX = opts.side === 'left' ? sidebarW + 26 : 32;
    const mainW = pageWidth - sidebarW - 58;

    const paintSidebarBg = () => {
      doc.setFillColor(opts.sidebarBg[0], opts.sidebarBg[1], opts.sidebarBg[2]);
      doc.rect(sidebarX, 0, sidebarW, pageHeight, 'F');
    };
    paintSidebarBg();

    // Sidebar header: logo + name + target role + contacts
    let sy = 38;
    const sx = sidebarX + 18;
    const sw = sidebarW - 36;
    drawLogoOrMonogramPdf(
      doc,
      sx,
      sy,
      38,
      opts.logoText || initials,
      opts.accentRgb,
      opts.logoStyle,
      opts.logoDataUrl
    );
    doc.setFont(opts.fontName, 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    const nameLines = doc.splitTextToSize(resume.personalInfo.fullName, sw - 46);
    doc.text(nameLines, sx + 46, sy + 14);
    sy += Math.max(44, nameLines.length * 14 + 10);

    if (targetRole) {
      doc.setFont(opts.fontName, 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(199, 210, 254);
      const roleLines = doc.splitTextToSize(targetRole.toUpperCase(), sw);
      doc.text(roleLines, sx, sy);
      sy += roleLines.length * 11 + 8;
    }

    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.4);
    doc.line(sx, sy, sx + sw, sy);
    sy += 14;

    doc.setFont(opts.fontName, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(226, 232, 240);
    contactItems.forEach((item) => {
      const lines = doc.splitTextToSize(item, sw);
      doc.text(lines, sx, sy);
      sy += lines.length * 10 + 4;
    });
    sy += 8;

    // Sidebar sections
    const drawSideHeading = (title: string) => {
      doc.setFont(opts.fontName, 'bold');
      doc.setFontSize(9);
      doc.setTextColor(opts.accentRgb[0], opts.accentRgb[1], opts.accentRgb[2]);
      doc.text(title.toUpperCase(), sx, sy);
      sy += 4;
      doc.setDrawColor(opts.accentRgb[0], opts.accentRgb[1], opts.accentRgb[2]);
      doc.setLineWidth(1);
      doc.line(sx, sy, sx + 28, sy);
      sy += 12;
    };

    opts.sideOrder.forEach((sec) => {
      if (sy > pageHeight - 60) return;
      if (sec === 'skills' && resume.skills.length > 0) {
        drawSideHeading(opts.headings.skills);
        resume.skills.forEach((sg) => {
          doc.setFont(opts.fontName, 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(255, 255, 255);
          doc.text(sg.category, sx, sy);
          sy += 11;
          doc.setFont(opts.fontName, 'normal');
          doc.setFontSize(8);
          doc.setTextColor(203, 213, 225);
          const lines = doc.splitTextToSize(sg.items.join(', '), sw);
          doc.text(lines, sx, sy);
          sy += lines.length * 10 + 6;
        });
        sy += 6;
      } else if (sec === 'education' && resume.education.length > 0) {
        drawSideHeading(opts.headings.education);
        resume.education.forEach((ed) => {
          doc.setFont(opts.fontName, 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(255, 255, 255);
          const degLines = doc.splitTextToSize(ed.degree, sw);
          doc.text(degLines, sx, sy);
          sy += degLines.length * 10;
          doc.setFont(opts.fontName, 'normal');
          doc.setFontSize(8);
          doc.setTextColor(203, 213, 225);
          const instLines = doc.splitTextToSize(`${ed.institution} (${ed.year})`, sw);
          doc.text(instLines, sx, sy);
          sy += instLines.length * 10 + 6;
        });
        sy += 6;
      } else if (sec === 'achievements' && resume.achievements.length > 0) {
        drawSideHeading(opts.headings.achievements);
        doc.setFont(opts.fontName, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(226, 232, 240);
        resume.achievements.forEach((ach) => {
          if (sy > pageHeight - 30) return;
          const lines = doc.splitTextToSize(`${opts.bulletChar} ${ach}`, sw);
          doc.text(lines, sx, sy);
          sy += lines.length * 10 + 3;
        });
        sy += 6;
      }
    });

    // Main Column
    let my = 42;
    const ensureMainPage = (needed = 40) => {
      if (my + needed > pageHeight - 40) {
        doc.addPage();
        paintSidebarBg();
        my = 42;
      }
    };

    const drawMainHeading = (title: string) => {
      ensureMainPage(36);
      let labelX = mainX;
      if (opts.iconStyle === 'circle-badge' || opts.iconStyle === 'square-badge') {
        doc.setFillColor(opts.accentRgb[0], opts.accentRgb[1], opts.accentRgb[2]);
        if (opts.iconStyle === 'circle-badge') {
          doc.circle(mainX + 6, my - 3.5, 6, 'F');
        } else {
          doc.roundedRect(mainX, my - 9.5, 12, 12, 2, 2, 'F');
        }
        labelX = mainX + 18;
      } else if (opts.iconStyle === 'minimal-dot') {
        doc.setFillColor(opts.accentRgb[0], opts.accentRgb[1], opts.accentRgb[2]);
        doc.circle(mainX + 3, my - 3.5, 3, 'F');
        labelX = mainX + 12;
      }
      doc.setFont(opts.fontName, 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(opts.primaryRgb[0], opts.primaryRgb[1], opts.primaryRgb[2]);
      doc.text(title.toUpperCase(), labelX, my);
      my += 5;
      doc.setDrawColor(opts.accentRgb[0], opts.accentRgb[1], opts.accentRgb[2]);
      doc.setLineWidth(1.5);
      doc.line(mainX, my, mainX + 36, my);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(mainX + 38, my, mainX + mainW, my);
      my += 14;
    };

    opts.mainOrder.forEach((sec) => {
      if (sec === 'summary' && resume.careerObjective) {
        drawMainHeading(opts.headings.summary);
        doc.setFont(opts.fontName, 'normal');
        doc.setFontSize(9.2);
        doc.setTextColor(opts.textRgb[0], opts.textRgb[1], opts.textRgb[2]);
        const lines = doc.splitTextToSize(resume.careerObjective, mainW);
        doc.text(lines, mainX, my);
        my += lines.length * 12.5 + 14;
      } else if (sec === 'projects' && resume.projects.length > 0) {
        drawMainHeading(opts.headings.projects);
        resume.projects.forEach((p) => {
          ensureMainPage(45);
          doc.setFont(opts.fontName, 'bold');
          doc.setFontSize(9.8);
          doc.setTextColor(opts.primaryRgb[0], opts.primaryRgb[1], opts.primaryRgb[2]);
          doc.text(p.title, mainX, my);
          if (p.techStack) {
            doc.setFont(opts.fontName, 'italic');
            doc.setFontSize(8.2);
            doc.setTextColor(opts.accentRgb[0], opts.accentRgb[1], opts.accentRgb[2]);
            const stackLines = doc.splitTextToSize(`[${p.techStack}]`, mainW);
            my += 11;
            doc.text(stackLines, mainX, my);
          }
          my += 12;
          doc.setFont(opts.fontName, 'normal');
          doc.setFontSize(9);
          doc.setTextColor(opts.textRgb[0], opts.textRgb[1], opts.textRgb[2]);
          const dLines = doc.splitTextToSize(p.description, mainW);
          doc.text(dLines, mainX, my);
          my += dLines.length * 12 + 10;
        });
      } else if (sec === 'experience' && resume.workExperience.length > 0) {
        drawMainHeading(opts.headings.experience);
        resume.workExperience.forEach((w) => {
          ensureMainPage(45);
          doc.setFont(opts.fontName, 'bold');
          doc.setFontSize(9.8);
          doc.setTextColor(opts.primaryRgb[0], opts.primaryRgb[1], opts.primaryRgb[2]);
          doc.text(w.role, mainX, my);
          doc.setFont(opts.fontName, 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(opts.mutedRgb[0], opts.mutedRgb[1], opts.mutedRgb[2]);
          doc.text(`${w.company} | ${w.duration}`, mainX + mainW, my, { align: 'right' });
          my += 12;
          doc.setFontSize(9);
          doc.setTextColor(opts.textRgb[0], opts.textRgb[1], opts.textRgb[2]);
          const wLines = doc.splitTextToSize(w.description, mainW);
          doc.text(wLines, mainX, my);
          my += wLines.length * 12 + 10;
        });
      }
    });
  };

  // Shared single-column / banner-top renderer (used by Minimal, Executive, Compact, and Custom non-sidebar layouts)
  const renderSingleOrBannerPdf = (opts: {
    fontName: 'helvetica' | 'times' | 'courier';
    bannerBg?: [number, number, number];
    headerRuleColor?: [number, number, number];
    headerAlign: 'left' | 'center' | 'split';
    primaryRgb: [number, number, number];
    accentRgb: [number, number, number];
    textRgb: [number, number, number];
    mutedRgb: [number, number, number];
    dividerStyle: CustomResumeTemplateSpec['dividerStyle'];
    iconStyle: CustomResumeTemplateSpec['iconStyle'];
    logoStyle: CustomResumeTemplateSpec['logoStyle'];
    logoText?: string;
    logoDataUrl?: string;
    headings: Record<ResumeSectionKey, string>;
    order: ResumeSectionKey[];
    bulletChar: string;
    compactSpacing?: boolean;
  }) => {
    const margin = opts.compactSpacing ? 34 : 42;
    const contentW = pageWidth - margin * 2;
    let y = opts.bannerBg ? 0 : 44;

    if (opts.bannerBg) {
      const bannerH = 92;
      doc.setFillColor(opts.bannerBg[0], opts.bannerBg[1], opts.bannerBg[2]);
      doc.rect(0, 0, pageWidth, bannerH, 'F');
      if (opts.headerRuleColor) {
        doc.setFillColor(opts.headerRuleColor[0], opts.headerRuleColor[1], opts.headerRuleColor[2]);
        doc.rect(0, bannerH - 4, pageWidth, 4, 'F');
      }

      const hasLogo = Boolean(opts.logoDataUrl) || opts.logoStyle !== 'none';
      const textStartX = hasLogo ? margin + 52 : margin;
      if (hasLogo) {
        drawLogoOrMonogramPdf(
          doc,
          margin,
          24,
          40,
          opts.logoText || initials,
          opts.accentRgb,
          opts.logoStyle,
          opts.logoDataUrl
        );
      }

      doc.setFont(opts.fontName, 'bold');
      doc.setFontSize(19);
      doc.setTextColor(255, 255, 255);
      doc.text(resume.personalInfo.fullName.toUpperCase(), textStartX, 42);

      if (targetRole) {
        doc.setFont(opts.fontName, 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(226, 232, 240);
        doc.text(targetRole.toUpperCase(), textStartX, 57);
      }

      doc.setFont(opts.fontName, 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(226, 232, 240);
      const cLines = doc.splitTextToSize(contactItems.join('  |  '), pageWidth - textStartX - margin);
      doc.text(cLines, textStartX, 72);

      y = bannerH + 24;
    } else {
      const isCentered = opts.headerAlign === 'center';
      if (isCentered) {
        doc.setFont(opts.fontName, 'normal');
        doc.setFontSize(22);
        doc.setTextColor(opts.primaryRgb[0], opts.primaryRgb[1], opts.primaryRgb[2]);
        doc.text(resume.personalInfo.fullName.toUpperCase(), pageWidth / 2, y, { align: 'center' });
        y += 16;
        if (targetRole) {
          doc.setFontSize(9.5);
          doc.setTextColor(opts.mutedRgb[0], opts.mutedRgb[1], opts.mutedRgb[2]);
          doc.text(targetRole.toUpperCase(), pageWidth / 2, y, { align: 'center' });
          y += 14;
        }
        doc.setFontSize(8.5);
        const cLines = doc.splitTextToSize(contactItems.join('  ·  '), contentW);
        doc.text(cLines, pageWidth / 2, y, { align: 'center' });
        y += cLines.length * 11 + 8;
      } else {
        const hasLogo = Boolean(opts.logoDataUrl) || (opts.logoStyle !== 'none' && !opts.compactSpacing);
        const textX = hasLogo ? margin + 48 : margin;
        if (hasLogo) {
          drawLogoOrMonogramPdf(
            doc,
            margin,
            y - 16,
            36,
            opts.logoText || initials,
            opts.accentRgb,
            opts.logoStyle,
            opts.logoDataUrl
          );
        }
        doc.setFont(opts.fontName, 'bold');
        doc.setFontSize(opts.compactSpacing ? 18 : 20);
        doc.setTextColor(opts.primaryRgb[0], opts.primaryRgb[1], opts.primaryRgb[2]);
        doc.text(resume.personalInfo.fullName.toUpperCase(), textX, y);
        y += 14;
        if (targetRole) {
          doc.setFont(opts.fontName, 'bold');
          doc.setFontSize(9);
          doc.setTextColor(opts.accentRgb[0], opts.accentRgb[1], opts.accentRgb[2]);
          doc.text(targetRole.toUpperCase(), textX, y);
          y += 13;
        }
        doc.setFont(opts.fontName, 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(opts.mutedRgb[0], opts.mutedRgb[1], opts.mutedRgb[2]);
        const cLines = doc.splitTextToSize(contactItems.join('  |  '), contentW - (textX - margin));
        doc.text(cLines, textX, y);
        y += cLines.length * 11 + 6;
      }

      doc.setDrawColor(opts.accentRgb[0], opts.accentRgb[1], opts.accentRgb[2]);
      doc.setLineWidth(opts.compactSpacing ? 1.5 : 0.8);
      doc.line(margin, y, margin + contentW, y);
      y += opts.compactSpacing ? 14 : 18;
    }

    const ensureSpace = (needed = 42) => {
      if (y + needed > pageHeight - 40) {
        doc.addPage();
        y = 42;
      }
    };

    const drawSectionTitle = (title: string) => {
      ensureSpace(36);
      let labelX = margin;
      if (opts.iconStyle === 'circle-badge' || opts.iconStyle === 'square-badge') {
        doc.setFillColor(opts.accentRgb[0], opts.accentRgb[1], opts.accentRgb[2]);
        if (opts.iconStyle === 'circle-badge') {
          doc.circle(margin + 5.5, y - 3.5, 5.5, 'F');
        } else {
          doc.roundedRect(margin, y - 9, 11, 11, 2, 2, 'F');
        }
        labelX = margin + 16;
      } else if (opts.iconStyle === 'minimal-dot') {
        doc.setFillColor(opts.accentRgb[0], opts.accentRgb[1], opts.accentRgb[2]);
        doc.circle(margin + 3, y - 3.5, 2.8, 'F');
        labelX = margin + 11;
      }

      doc.setFont(opts.fontName, 'bold');
      doc.setFontSize(opts.compactSpacing ? 10 : 10.8);
      doc.setTextColor(opts.primaryRgb[0], opts.primaryRgb[1], opts.primaryRgb[2]);
      doc.text(title.toUpperCase(), labelX, y);
      y += 4.5;

      if (opts.dividerStyle === 'double') {
        doc.setDrawColor(opts.accentRgb[0], opts.accentRgb[1], opts.accentRgb[2]);
        doc.setLineWidth(1.2);
        doc.line(margin, y, margin + contentW, y);
        doc.setLineWidth(0.4);
        doc.line(margin, y + 2.5, margin + contentW, y + 2.5);
      } else if (opts.dividerStyle === 'accent-bar') {
        doc.setDrawColor(opts.accentRgb[0], opts.accentRgb[1], opts.accentRgb[2]);
        doc.setLineWidth(1.5);
        doc.line(margin, y, margin + 40, y);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(margin + 42, y, margin + contentW, y);
      } else if (opts.dividerStyle !== 'none') {
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.7);
        doc.line(margin, y, margin + contentW, y);
      }
      y += opts.compactSpacing ? 12 : 15;
    };

    const lineH = opts.compactSpacing ? 11.2 : 12.5;
    const itemGap = opts.compactSpacing ? 5 : 8;

    opts.order.forEach((sec) => {
      if (sec === 'summary' && resume.careerObjective) {
        drawSectionTitle(opts.headings.summary);
        doc.setFont(opts.fontName, 'normal');
        doc.setFontSize(9.2);
        doc.setTextColor(opts.textRgb[0], opts.textRgb[1], opts.textRgb[2]);
        const lines = doc.splitTextToSize(resume.careerObjective, contentW);
        doc.text(lines, margin, y);
        y += lines.length * lineH + (opts.compactSpacing ? 8 : 12);
      } else if (sec === 'skills' && resume.skills.length > 0) {
        drawSectionTitle(opts.headings.skills);
        resume.skills.forEach((sg) => {
          ensureSpace(22);
          doc.setFont(opts.fontName, 'bold');
          doc.setFontSize(9);
          doc.setTextColor(opts.primaryRgb[0], opts.primaryRgb[1], opts.primaryRgb[2]);
          const prefix = `${sg.category}: `;
          doc.text(prefix, margin, y);
          const w = doc.getTextWidth(prefix);
          doc.setFont(opts.fontName, 'normal');
          doc.setTextColor(opts.textRgb[0], opts.textRgb[1], opts.textRgb[2]);
          const sLines = doc.splitTextToSize(sg.items.join(', '), contentW - w);
          doc.text(sLines, margin + w, y);
          y += sLines.length * lineH + 2;
        });
        y += opts.compactSpacing ? 6 : 10;
      } else if (sec === 'projects' && resume.projects.length > 0) {
        drawSectionTitle(opts.headings.projects);
        resume.projects.forEach((p) => {
          ensureSpace(36);
          doc.setFont(opts.fontName, 'bold');
          doc.setFontSize(9.8);
          doc.setTextColor(opts.primaryRgb[0], opts.primaryRgb[1], opts.primaryRgb[2]);
          doc.text(p.title, margin, y);
          if (p.techStack) {
            doc.setFont(opts.fontName, 'italic');
            doc.setFontSize(8.5);
            doc.setTextColor(opts.accentRgb[0], opts.accentRgb[1], opts.accentRgb[2]);
            doc.text(`[${p.techStack}]`, margin + contentW, y, { align: 'right' });
          }
          y += 12;
          doc.setFont(opts.fontName, 'normal');
          doc.setFontSize(9);
          doc.setTextColor(opts.textRgb[0], opts.textRgb[1], opts.textRgb[2]);
          const pLines = doc.splitTextToSize(p.description, contentW);
          doc.text(pLines, margin, y);
          y += pLines.length * lineH + itemGap;
        });
      } else if (sec === 'experience' && resume.workExperience.length > 0) {
        drawSectionTitle(opts.headings.experience);
        resume.workExperience.forEach((w) => {
          ensureSpace(36);
          doc.setFont(opts.fontName, 'bold');
          doc.setFontSize(9.8);
          doc.setTextColor(opts.primaryRgb[0], opts.primaryRgb[1], opts.primaryRgb[2]);
          doc.text(w.role, margin, y);
          doc.setFont(opts.fontName, 'normal');
          doc.setFontSize(8.8);
          doc.setTextColor(opts.mutedRgb[0], opts.mutedRgb[1], opts.mutedRgb[2]);
          doc.text(`${w.company}  |  ${w.duration}`, margin + contentW, y, { align: 'right' });
          y += 12;
          doc.setFontSize(9);
          doc.setTextColor(opts.textRgb[0], opts.textRgb[1], opts.textRgb[2]);
          const wLines = doc.splitTextToSize(w.description, contentW);
          doc.text(wLines, margin, y);
          y += wLines.length * lineH + itemGap;
        });
      } else if (sec === 'education' && resume.education.length > 0) {
        drawSectionTitle(opts.headings.education);
        resume.education.forEach((ed) => {
          ensureSpace(28);
          doc.setFont(opts.fontName, 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(opts.primaryRgb[0], opts.primaryRgb[1], opts.primaryRgb[2]);
          doc.text(ed.degree, margin, y);
          doc.setFont(opts.fontName, 'normal');
          doc.setFontSize(8.8);
          doc.setTextColor(opts.mutedRgb[0], opts.mutedRgb[1], opts.mutedRgb[2]);
          doc.text(ed.year, margin + contentW, y, { align: 'right' });
          y += 12;
          doc.setTextColor(opts.textRgb[0], opts.textRgb[1], opts.textRgb[2]);
          doc.text(`${ed.institution}${ed.gradeOrGpa ? ` — ${ed.gradeOrGpa}` : ''}`, margin, y);
          y += 14;
        });
      } else if (sec === 'achievements' && resume.achievements.length > 0) {
        drawSectionTitle(opts.headings.achievements);
        doc.setFont(opts.fontName, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(opts.textRgb[0], opts.textRgb[1], opts.textRgb[2]);
        resume.achievements.forEach((ach) => {
          ensureSpace(18);
          const aLines = doc.splitTextToSize(`${opts.bulletChar} ${ach}`, contentW - 8);
          doc.text(aLines, margin + 4, y);
          y += aLines.length * lineH + 2;
        });
        y += 6;
      }
    });
  };

  if (resume.templateId === 'modern') {
    renderSidebarTemplatePdf({
      side: 'left',
      fontName: 'helvetica',
      sidebarBg: [15, 23, 42],
      primaryRgb: [15, 23, 42],
      accentRgb: [79, 70, 229],
      textRgb: [51, 65, 85],
      mutedRgb: [100, 116, 139],
      iconStyle: 'circle-badge',
      logoStyle: 'monogram-square',
      headings: {
        summary: 'Career Profile',
        skills: 'Technical Stack',
        projects: 'Featured Engineering Projects',
        experience: 'Work Experience',
        education: 'Education',
        achievements: 'Honors & Awards'
      },
      mainOrder: ['summary', 'projects', 'experience'],
      sideOrder: ['skills', 'education', 'achievements'],
      bulletChar: '▸'
    });
  } else if (resume.templateId === 'minimal') {
    renderSingleOrBannerPdf({
      fontName: 'helvetica',
      headerAlign: 'center',
      primaryRgb: [15, 23, 42],
      accentRgb: [148, 163, 184],
      textRgb: [51, 65, 85],
      mutedRgb: [100, 116, 139],
      dividerStyle: 'solid',
      iconStyle: 'none',
      logoStyle: 'none',
      headings: {
        summary: 'Profile',
        skills: 'Skills',
        projects: 'Selected Projects',
        experience: 'Experience',
        education: 'Education',
        achievements: 'Achievements'
      },
      order: ['summary', 'experience', 'projects', 'skills', 'education', 'achievements'],
      bulletChar: '—'
    });
  } else if (resume.templateId === 'executive') {
    renderSingleOrBannerPdf({
      fontName: 'times',
      bannerBg: [15, 23, 42],
      headerRuleColor: [217, 119, 6],
      headerAlign: 'left',
      primaryRgb: [15, 23, 42],
      accentRgb: [180, 83, 9],
      textRgb: [30, 41, 59],
      mutedRgb: [71, 85, 105],
      dividerStyle: 'double',
      iconStyle: 'none',
      logoStyle: 'monogram-circle',
      headings: {
        summary: 'Executive Summary',
        skills: 'Core Competencies',
        projects: 'Strategic Projects & Initiatives',
        experience: 'Leadership & Work Experience',
        education: 'Academic Credentials',
        achievements: 'Awards & Certifications'
      },
      order: ['summary', 'experience', 'projects', 'education', 'skills', 'achievements'],
      bulletChar: '•'
    });
  } else if (resume.templateId === 'compact') {
    renderSingleOrBannerPdf({
      fontName: 'helvetica',
      headerAlign: 'left',
      primaryRgb: [15, 23, 42],
      accentRgb: [13, 148, 136],
      textRgb: [51, 65, 85],
      mutedRgb: [100, 116, 139],
      dividerStyle: 'accent-bar',
      iconStyle: 'minimal-dot',
      logoStyle: 'none',
      headings: {
        summary: 'Profile',
        skills: 'Skills',
        projects: 'Projects',
        experience: 'Experience',
        education: 'Education',
        achievements: 'Achievements'
      },
      order: ['summary', 'projects', 'experience', 'skills', 'education', 'achievements'],
      bulletChar: '•',
      compactSpacing: true
    });
  } else {
    // Custom Uploaded Template
    const spec = resume.customTemplate?.spec;
    const headings: Record<ResumeSectionKey, string> = spec?.sectionHeadings || {
      summary: 'Professional Summary',
      skills: 'Core Competencies',
      projects: 'Key Projects',
      experience: 'Work Experience',
      education: 'Education',
      achievements: 'Certifications & Awards'
    };
    const order: ResumeSectionKey[] =
      spec?.sectionOrder?.length === 6
        ? spec.sectionOrder
        : ['summary', 'skills', 'projects', 'experience', 'education', 'achievements'];
    const fontName: 'helvetica' | 'times' | 'courier' =
      spec?.fontStyle === 'serif' ? 'times' : spec?.fontStyle === 'mono' ? 'courier' : 'helvetica';
    const bulletChar =
      spec?.bulletStyle === 'square'
        ? '▪'
        : spec?.bulletStyle === 'arrow'
          ? '▸'
          : spec?.bulletStyle === 'dash'
            ? '—'
            : '•';

    const primaryRgb = hexToRgb(spec?.primaryColor, [30, 58, 138]);
    const accentRgb = hexToRgb(spec?.accentColor, [79, 70, 229]);
    const sidebarBg = hexToRgb(spec?.sidebarBgColor, [15, 23, 42]);
    const headerBg = hexToRgb(spec?.headerBgColor, [30, 41, 59]);
    const textRgb = hexToRgb(spec?.textColor, [30, 41, 59]);
    const mutedRgb = hexToRgb(spec?.mutedColor, [100, 116, 139]);
    const logoDataUrl = resume.customTemplate?.logoDataUrl;

    if (spec?.layoutType === 'sidebar-left' || spec?.layoutType === 'sidebar-right') {
      const sideKeys: ResumeSectionKey[] = ['skills', 'education', 'achievements'];
      renderSidebarTemplatePdf({
        side: spec.layoutType === 'sidebar-right' ? 'right' : 'left',
        fontName,
        sidebarBg,
        primaryRgb,
        accentRgb,
        textRgb,
        mutedRgb,
        iconStyle: spec.showSectionIcons ? spec.iconStyle : 'none',
        logoStyle: spec.logoStyle || 'monogram-circle',
        logoText: spec.logoText,
        logoDataUrl,
        headings,
        mainOrder: order.filter((k) => !sideKeys.includes(k)),
        sideOrder: order.filter((k) => sideKeys.includes(k)),
        bulletChar
      });
    } else {
      renderSingleOrBannerPdf({
        fontName,
        bannerBg: spec?.layoutType === 'banner-top' ? headerBg : undefined,
        headerRuleColor: spec?.layoutType === 'banner-top' ? accentRgb : undefined,
        headerAlign: spec?.headerAlignment || 'left',
        primaryRgb,
        accentRgb,
        textRgb,
        mutedRgb,
        dividerStyle: spec?.dividerStyle || 'accent-bar',
        iconStyle: spec?.showSectionIcons === false ? 'none' : spec?.iconStyle || 'circle-badge',
        logoStyle: spec?.logoStyle || 'monogram-circle',
        logoText: spec?.logoText,
        logoDataUrl,
        headings,
        order,
        bulletChar
      });
    }
  }

  doc.save(fileName);
}
