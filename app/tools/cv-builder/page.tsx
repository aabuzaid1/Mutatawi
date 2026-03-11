'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    IoDocumentTextOutline,
    IoArrowBackOutline,
    IoAddOutline,
    IoCloseOutline,
    IoTrashOutline,
} from 'react-icons/io5';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';
import { syncVolunteerStats } from '@/app/lib/firestore';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';

interface ExperienceEntry {
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    bullets: string[];
}

interface EducationEntry {
    degree: string;
    university: string;
    startDate: string;
    endDate: string;
    bullets: string[];
}

interface AchievementEntry {
    title: string;
    description: string;
}

interface CompletedOpp {
    opportunityId: string;
    opportunityTitle: string;
    date: string;
    duration: number;
}

function generateCVHTML(
    fullName: string,
    jobTitle: string,
    contactLine: string,
    summary: string,
    expertise: string[],
    achievements: AchievementEntry[],
    experiences: ExperienceEntry[],
    education: EducationEntry[],
    languages: string,
    certifications: string,
    awards: string,
    includeVolunteer: boolean,
    volunteerOpps: CompletedOpp[],
    totalHours: number
) {
    const expertiseHtml = expertise.length > 0
        ? `<div class="section"><div class="section-title">AREA OF EXPERTISE</div><div class="expertise-grid">${expertise.map(s => `<span>${s}</span>`).join('')}</div></div>`
        : '';

    const achievementsHtml = achievements.length > 0
        ? `<div class="section"><div class="section-title">KEY ACHIEVEMENTS</div><ul>${achievements.map(a => `<li><strong>${a.title}.</strong> ${a.description}</li>`).join('')}</ul></div>`
        : '';

    const experienceHtml = experiences.length > 0
        ? `<div class="section"><div class="section-title">PROFESSIONAL EXPERIENCE</div>${experiences.map(exp => `
            <div class="entry">
                <div class="entry-header">
                    <div><strong>${exp.title}, ${exp.company}</strong></div>
                    <div class="dates">${exp.startDate} - ${exp.endDate}</div>
                </div>
                ${exp.bullets.length > 0 ? `<ul>${exp.bullets.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
            </div>`).join('')}</div>`
        : '';

    const educationHtml = education.length > 0
        ? `<div class="section"><div class="section-title">EDUCATION</div>${education.map(edu => `
            <div class="entry">
                <div class="entry-header">
                    <div><strong>${edu.degree}</strong></div>
                    <div class="dates">${edu.startDate} - ${edu.endDate}</div>
                </div>
                <div class="sub-text">${edu.university}</div>
                ${edu.bullets.length > 0 ? `<ul>${edu.bullets.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
            </div>`).join('')}</div>`
        : '';

    const volunteerHtml = includeVolunteer && volunteerOpps.length > 0
        ? `<div class="section"><div class="section-title">VOLUNTEER EXPERIENCE</div>${volunteerOpps.map(opp => `
            <div class="entry">
                <div class="entry-header">
                    <div><strong>${opp.opportunityTitle}</strong></div>
                    <div class="dates">${new Date(opp.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} · ${opp.duration}h</div>
                </div>
            </div>`).join('')}
            <p class="volunteer-total">Total Volunteer Hours: <strong>${totalHours}</strong></p>
        </div>`
        : '';

    const additionalItems: string[] = [];
    if (languages.trim()) additionalItems.push(`<strong>Languages:</strong> ${languages}`);
    if (certifications.trim()) additionalItems.push(`<strong>Certifications:</strong> ${certifications}`);
    if (awards.trim()) additionalItems.push(`<strong>Awards/Activities:</strong> ${awards}`);
    const additionalHtml = additionalItems.length > 0
        ? `<div class="section"><div class="section-title">ADDITIONAL INFORMATION</div><ul>${additionalItems.map(i => `<li>${i}</li>`).join('')}</ul></div>`
        : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>CV - ${fullName}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Inter',sans-serif;background:#e5e7eb;color:#1e293b;font-size:11pt;line-height:1.5;}
@media print{
    body{background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    .no-print{display:none!important;}
    .page{box-shadow:none!important;margin:0!important;max-width:none!important;}
}
.page{max-width:210mm;margin:20px auto;background:white;box-shadow:0 2px 16px rgba(0,0,0,0.1);padding:40px 48px;min-height:297mm;}
.header{text-align:center;margin-bottom:8px;}
.header h1{font-size:28pt;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:2px;color:#000;}
.header .job-title{font-size:11pt;font-weight:600;text-transform:uppercase;letter-spacing:3px;color:#444;margin-bottom:6px;}
.header .contact{font-size:9pt;color:#555;margin-bottom:4px;}
.summary{font-size:10pt;color:#333;line-height:1.7;margin-bottom:14px;text-align:justify;}
.section{margin-bottom:14px;}
.section-title{font-size:10pt;font-weight:800;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #000;padding-bottom:4px;margin-bottom:10px;color:#000;}
.expertise-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px 20px;font-size:10pt;margin-bottom:4px;}
.entry{margin-bottom:10px;}
.entry-header{display:flex;justify-content:space-between;align-items:baseline;font-size:10pt;margin-bottom:2px;}
.entry-header strong{color:#000;}
.dates{font-size:9pt;color:#555;white-space:nowrap;}
.sub-text{font-size:9.5pt;color:#555;margin-bottom:2px;}
ul{padding-right:0;padding-left:18px;margin-top:4px;font-size:10pt;}
li{margin-bottom:3px;color:#333;}
li strong{color:#000;}
.volunteer-total{font-size:9.5pt;color:#555;margin-top:6px;font-style:italic;}
.btn-print{display:block;margin:20px auto;padding:12px 40px;background:#000;color:white;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:'Inter';}
.btn-print:hover{background:#333;}
</style>
</head>
<body>
<div class="page">
    <div class="header">
        <h1>${fullName}</h1>
        ${jobTitle ? `<div class="job-title">${jobTitle}</div>` : ''}
        ${contactLine ? `<div class="contact">${contactLine}</div>` : ''}
    </div>
    ${summary ? `<p class="summary">${summary}</p>` : ''}
    ${expertiseHtml}
    ${achievementsHtml}
    ${experienceHtml}
    ${volunteerHtml}
    ${educationHtml}
    ${additionalHtml}
</div>
<button class="btn-print no-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
</body>
</html>`;
}

export default function CVBuilderPage() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [totalHours, setTotalHours] = useState(0);
    const [completedOpps, setCompletedOpps] = useState<CompletedOpp[]>([]);

    // Header
    const [fullName, setFullName] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [contactLine, setContactLine] = useState('');
    // Summary
    const [summary, setSummary] = useState('');
    // Expertise
    const [expertise, setExpertise] = useState<string[]>([]);
    const [newExpertise, setNewExpertise] = useState('');
    // Achievements
    const [achievements, setAchievements] = useState<AchievementEntry[]>([]);
    // Experience
    const [experiences, setExperiences] = useState<ExperienceEntry[]>([]);
    // Education
    const [education, setEducation] = useState<EducationEntry[]>([]);
    // Additional
    const [languages, setLanguages] = useState('');
    const [certifications, setCertifications] = useState('');
    const [awards, setAwards] = useState('');
    // Volunteer toggle
    const [includeVolunteer, setIncludeVolunteer] = useState(true);

    useEffect(() => {
        async function load() {
            if (!user) return;
            try {
                const stats = await syncVolunteerStats(user.uid);
                setTotalHours(stats.hoursVolunteered);
                setCompletedOpps(
                    stats.completedApps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                );
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [user]);

    useEffect(() => {
        if (profile) {
            setFullName(profile.displayName || '');
            const parts = [profile.email, profile.phone, profile.location].filter(Boolean);
            setContactLine(parts.join(' | '));
        }
    }, [profile]);

    // Expertise helpers
    const addExpertise = () => {
        if (newExpertise.trim() && !expertise.includes(newExpertise.trim())) {
            setExpertise([...expertise, newExpertise.trim()]);
            setNewExpertise('');
        }
    };

    // Achievement helpers
    const addAchievement = () => setAchievements([...achievements, { title: '', description: '' }]);
    const updateAchievement = (i: number, field: keyof AchievementEntry, val: string) =>
        setAchievements(achievements.map((a, idx) => idx === i ? { ...a, [field]: val } : a));
    const removeAchievement = (i: number) => setAchievements(achievements.filter((_, idx) => idx !== i));

    // Experience helpers
    const addExperience = () => setExperiences([...experiences, { title: '', company: '', startDate: '', endDate: '', bullets: [''] }]);
    const updateExp = (i: number, field: string, val: string) =>
        setExperiences(experiences.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
    const addExpBullet = (i: number) =>
        setExperiences(experiences.map((e, idx) => idx === i ? { ...e, bullets: [...e.bullets, ''] } : e));
    const updateExpBullet = (expIdx: number, bulletIdx: number, val: string) =>
        setExperiences(experiences.map((e, i) => i === expIdx ? { ...e, bullets: e.bullets.map((b, j) => j === bulletIdx ? val : b) } : e));
    const removeExpBullet = (expIdx: number, bulletIdx: number) =>
        setExperiences(experiences.map((e, i) => i === expIdx ? { ...e, bullets: e.bullets.filter((_, j) => j !== bulletIdx) } : e));
    const removeExperience = (i: number) => setExperiences(experiences.filter((_, idx) => idx !== i));

    // Education helpers
    const addEducation = () => setEducation([...education, { degree: '', university: '', startDate: '', endDate: '', bullets: [''] }]);
    const updateEdu = (i: number, field: string, val: string) =>
        setEducation(education.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
    const addEduBullet = (i: number) =>
        setEducation(education.map((e, idx) => idx === i ? { ...e, bullets: [...e.bullets, ''] } : e));
    const updateEduBullet = (eduIdx: number, bulletIdx: number, val: string) =>
        setEducation(education.map((e, i) => i === eduIdx ? { ...e, bullets: e.bullets.map((b, j) => j === bulletIdx ? val : b) } : e));
    const removeEduBullet = (eduIdx: number, bulletIdx: number) =>
        setEducation(education.map((e, i) => i === eduIdx ? { ...e, bullets: e.bullets.filter((_, j) => j !== bulletIdx) } : e));
    const removeEducation = (i: number) => setEducation(education.filter((_, idx) => idx !== i));

    const handleGenerate = () => {
        const html = generateCVHTML(
            fullName, jobTitle, contactLine, summary,
            expertise, achievements, experiences, education,
            languages, certifications, awards,
            includeVolunteer, completedOpps, totalHours
        );
        const win = window.open('', '_blank');
        if (win) { win.document.write(html); win.document.close(); }
    };

    if (!user) {
        return (<>
            <Navbar />
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-slate-400 text-lg mb-4">يرجى تسجيل الدخول أولاً</p>
                    <Link href="/login" className="text-primary-600 hover:underline font-bold">تسجيل الدخول</Link>
                </div>
            </div>
        </>);
    }

    if (loading) {
        return (<>
            <Navbar />
            <div className="flex items-center justify-center min-h-screen"><LoadingSpinner size="lg" /></div>
        </>);
    }

    const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm transition-all";
    const sectionHeader = "text-base font-bold text-slate-800 mb-4 flex items-center justify-between";

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16" dir="rtl">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 font-medium mb-6 transition-colors">
                        <IoArrowBackOutline size={16} />
                        العودة للأدوات
                    </Link>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
                            <IoDocumentTextOutline size={32} className="text-blue-600" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">منشئ السيرة الذاتية</h1>
                        <p className="text-slate-500">عبّئ الأقسام اللي بدك اياها وأنشئ سيرتك الذاتية بتصميم احترافي</p>
                    </motion.div>

                    <div className="space-y-5">
                        {/* ===== HEADER SECTION ===== */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <h2 className={sectionHeader}>📋 Header</h2>
                            <div className="space-y-3" dir="ltr">
                                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full Name" className={inputClass} />
                                <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Job Title (e.g. UX Designer)" className={inputClass} />
                                <input type="text" value={contactLine} onChange={e => setContactLine(e.target.value)} placeholder="Address | email@example.com | www.website.com" className={inputClass} />
                            </div>
                        </motion.div>

                        {/* ===== SUMMARY ===== */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <h2 className={sectionHeader}>📝 Professional Summary</h2>
                            <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={3}
                                placeholder="A brief summary of your professional background and goals..."
                                className={`${inputClass} resize-none`} dir="ltr" />
                        </motion.div>

                        {/* ===== AREA OF EXPERTISE ===== */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <h2 className={sectionHeader}>💡 Area of Expertise</h2>
                            <div className="flex gap-2 mb-3" dir="ltr">
                                <input type="text" value={newExpertise} onChange={e => setNewExpertise(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                                    placeholder="Add a skill..." className={`${inputClass} flex-1`} />
                                <button onClick={addExpertise}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-1 text-sm font-bold whitespace-nowrap">
                                    <IoAddOutline size={18} /> Add
                                </button>
                            </div>
                            {expertise.length > 0 && (
                                <div className="flex flex-wrap gap-2" dir="ltr">
                                    {expertise.map((s, i) => (
                                        <span key={i} className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-sm font-medium">
                                            {s}
                                            <button onClick={() => setExpertise(expertise.filter((_, idx) => idx !== i))} className="hover:text-red-500"><IoCloseOutline size={16} /></button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        {/* ===== KEY ACHIEVEMENTS ===== */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <h2 className={sectionHeader}>
                                🏅 Key Achievements
                                <button onClick={addAchievement} className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                                    <IoAddOutline size={16} /> Add
                                </button>
                            </h2>
                            <div className="space-y-3" dir="ltr">
                                {achievements.map((a, i) => (
                                    <div key={i} className="flex gap-2 items-start">
                                        <div className="flex-1 space-y-2">
                                            <input type="text" value={a.title} onChange={e => updateAchievement(i, 'title', e.target.value)}
                                                placeholder="Achievement Title" className={`${inputClass} font-bold`} />
                                            <input type="text" value={a.description} onChange={e => updateAchievement(i, 'description', e.target.value)}
                                                placeholder="Description of the achievement..." className={inputClass} />
                                        </div>
                                        <button onClick={() => removeAchievement(i)} className="text-red-400 hover:text-red-600 mt-2.5"><IoTrashOutline size={18} /></button>
                                    </div>
                                ))}
                                {achievements.length === 0 && <p className="text-sm text-slate-400" dir="rtl">اضغط "Add" لإضافة إنجاز</p>}
                            </div>
                        </motion.div>

                        {/* ===== PROFESSIONAL EXPERIENCE ===== */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <h2 className={sectionHeader}>
                                💼 Professional Experience
                                <button onClick={addExperience} className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                                    <IoAddOutline size={16} /> Add
                                </button>
                            </h2>
                            <div className="space-y-5" dir="ltr">
                                {experiences.map((exp, i) => (
                                    <div key={i} className="bg-slate-50 rounded-xl p-4 relative">
                                        <button onClick={() => removeExperience(i)} className="absolute top-3 left-3 text-red-400 hover:text-red-600"><IoTrashOutline size={18} /></button>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                                            <input type="text" value={exp.title} onChange={e => updateExp(i, 'title', e.target.value)}
                                                placeholder="Job Title" className={inputClass} />
                                            <input type="text" value={exp.company} onChange={e => updateExp(i, 'company', e.target.value)}
                                                placeholder="Company Name" className={inputClass} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            <input type="text" value={exp.startDate} onChange={e => updateExp(i, 'startDate', e.target.value)}
                                                placeholder="Start (e.g. Jan 2023)" className={inputClass} />
                                            <input type="text" value={exp.endDate} onChange={e => updateExp(i, 'endDate', e.target.value)}
                                                placeholder="End (e.g. Present)" className={inputClass} />
                                        </div>
                                        {exp.bullets.map((b, j) => (
                                            <div key={j} className="flex gap-2 items-center mb-1.5">
                                                <span className="text-slate-400 text-xs">•</span>
                                                <input type="text" value={b} onChange={e => updateExpBullet(i, j, e.target.value)}
                                                    placeholder="Describe your responsibility or achievement..." className={`${inputClass} flex-1`} />
                                                <button onClick={() => removeExpBullet(i, j)} className="text-red-300 hover:text-red-500"><IoCloseOutline size={16} /></button>
                                            </div>
                                        ))}
                                        <button onClick={() => addExpBullet(i)} className="text-xs text-primary-600 hover:text-primary-700 font-bold mt-1">+ Add bullet point</button>
                                    </div>
                                ))}
                                {experiences.length === 0 && <p className="text-sm text-slate-400" dir="rtl">اضغط "Add" لإضافة خبرة</p>}
                            </div>
                        </motion.div>

                        {/* ===== EDUCATION ===== */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <h2 className={sectionHeader}>
                                🎓 Education
                                <button onClick={addEducation} className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                                    <IoAddOutline size={16} /> Add
                                </button>
                            </h2>
                            <div className="space-y-5" dir="ltr">
                                {education.map((edu, i) => (
                                    <div key={i} className="bg-slate-50 rounded-xl p-4 relative">
                                        <button onClick={() => removeEducation(i)} className="absolute top-3 left-3 text-red-400 hover:text-red-600"><IoTrashOutline size={18} /></button>
                                        <div className="space-y-2 mb-2">
                                            <input type="text" value={edu.degree} onChange={e => updateEdu(i, 'degree', e.target.value)}
                                                placeholder="Degree (e.g. Bachelor of Science in CS)" className={inputClass} />
                                            <input type="text" value={edu.university} onChange={e => updateEdu(i, 'university', e.target.value)}
                                                placeholder="University / Institution" className={inputClass} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            <input type="text" value={edu.startDate} onChange={e => updateEdu(i, 'startDate', e.target.value)}
                                                placeholder="Start (e.g. Sep 2019)" className={inputClass} />
                                            <input type="text" value={edu.endDate} onChange={e => updateEdu(i, 'endDate', e.target.value)}
                                                placeholder="End (e.g. Jun 2023)" className={inputClass} />
                                        </div>
                                        {edu.bullets.map((b, j) => (
                                            <div key={j} className="flex gap-2 items-center mb-1.5">
                                                <span className="text-slate-400 text-xs">•</span>
                                                <input type="text" value={b} onChange={e => updateEduBullet(i, j, e.target.value)}
                                                    placeholder="Relevant coursework, thesis, or achievements..." className={`${inputClass} flex-1`} />
                                                <button onClick={() => removeEduBullet(i, j)} className="text-red-300 hover:text-red-500"><IoCloseOutline size={16} /></button>
                                            </div>
                                        ))}
                                        <button onClick={() => addEduBullet(i)} className="text-xs text-primary-600 hover:text-primary-700 font-bold mt-1">+ Add bullet point</button>
                                    </div>
                                ))}
                                {education.length === 0 && <p className="text-sm text-slate-400" dir="rtl">اضغط "Add" لإضافة تعليم</p>}
                            </div>
                        </motion.div>

                        {/* ===== VOLUNTEER TOGGLE ===== */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="font-bold text-slate-800 text-sm">🤝 تضمين خبرات التطوع</h2>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {includeVolunteer
                                            ? `سيتم عرض ${completedOpps.length} فرصة (${totalHours} ساعة)`
                                            : 'لن يتم عرض خبرات التطوع'}
                                    </p>
                                </div>
                                <button onClick={() => setIncludeVolunteer(!includeVolunteer)}
                                    className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${includeVolunteer ? 'bg-primary-600' : 'bg-slate-300'}`}>
                                    <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${includeVolunteer ? 'left-0.5' : 'left-[calc(100%-1.625rem)]'}`} />
                                </button>
                            </div>
                        </motion.div>

                        {/* ===== ADDITIONAL INFO ===== */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <h2 className={sectionHeader}>📌 Additional Information</h2>
                            <div className="space-y-3" dir="ltr">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Languages</label>
                                    <input type="text" value={languages} onChange={e => setLanguages(e.target.value)}
                                        placeholder="e.g. Arabic, English, French" className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Certifications</label>
                                    <input type="text" value={certifications} onChange={e => setCertifications(e.target.value)}
                                        placeholder="e.g. PMP, AWS Certified, First Aid Certificate" className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Awards / Activities</label>
                                    <input type="text" value={awards} onChange={e => setAwards(e.target.value)}
                                        placeholder="e.g. Dean's List 2022, Hackathon Winner" className={inputClass} />
                                </div>
                            </div>
                        </motion.div>

                        {/* ===== GENERATE BUTTON ===== */}
                        <motion.button
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                            onClick={handleGenerate}
                            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white py-4 rounded-2xl text-lg font-bold hover:shadow-xl transition-all">
                            <IoDocumentTextOutline size={22} />
                            Generate CV
                        </motion.button>
                        <p className="text-center text-xs text-slate-400 mt-3 mb-8">
                            سيتم فتح السيرة في نافذة جديدة — يمكنك طباعتها أو حفظها كـ PDF
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
