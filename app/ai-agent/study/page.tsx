'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IoSparklesOutline,
  IoDocumentTextOutline,
  IoEaselOutline,
  IoDownloadOutline,
  IoRocketOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoArrowBack,
} from 'react-icons/io5';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { useAuth } from '@/app/hooks/useAuth';
import Link from 'next/link';

type OutputType = 'report' | 'presentation';
type Status = 'idle' | 'loading' | 'success' | 'error';

export default function AIStudyAgentPage() {
  const { user, loading: authLoading } = useAuth();
  const [goal, setGoal] = useState('');
  const [outputType, setOutputType] = useState<OutputType>('report');
  const [status, setStatus] = useState<Status>('idle');
  const [fileUrl, setFileUrl] = useState('');
  const [fileTitle, setFileTitle] = useState('');
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const handleSubmit = async () => {
    if (!goal.trim() || !user) return;

    setStatus('loading');
    setError('');
    setFileUrl('');
    setFileTitle('');

    try {
      const token = await user.getIdToken();
      abortRef.current = new AbortController();

      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ goal: goal.trim(), outputType }),
        signal: abortRef.current.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ');
      }

      setFileUrl(data.fileUrl);
      setFileTitle(data.title || 'ملف');
      setStatus('success');
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'حدث خطأ أثناء المعالجة');
      setStatus('error');
    }
  };

  // ── Loading state ────────────────────────────
  if (authLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </main>
      </>
    );
  }

  // ── Not authenticated ────────────────────────
  if (!user) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16">
          <div className="max-w-lg mx-auto px-4 text-center">
            <div className="w-20 h-20 bg-primary-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <IoSparklesOutline size={40} className="text-primary-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-3">وكيل الدراسة الذكي</h1>
            <p className="text-slate-500 mb-8">سجّل دخولك للوصول لوكيل الدراسة الذكي</p>
            <Link href="/login?redirect=/ai-agent/study">
              <motion.span
                className="inline-block px-8 py-3 bg-primary-600 text-white rounded-xl font-bold cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                تسجيل الدخول
              </motion.span>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ── Main UI ──────────────────────────────────
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-slate-100 pt-20 sm:pt-24 pb-16" dir="rtl">
        <div className="max-w-3xl mx-auto px-4">

          {/* Back link */}
          <Link
            href="/ai-agent"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 transition-colors mb-6"
          >
            <IoArrowBack size={16} />
            العودة للمساعد الذكي
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-glow mb-4">
              <IoRocketOutline size={32} className="text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
              وكيل الدراسة الذكي
            </h1>
            <p className="text-slate-500 text-lg">
              أدخل هدفك الدراسي وسنقوم بإنشاء تقرير أو عرض تقديمي جاهز للتحميل
            </p>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-card border border-slate-100 overflow-hidden"
          >
            <div className="p-6 sm:p-8 space-y-6">

              {/* Goal Textarea */}
              <div>
                <label
                  htmlFor="study-goal"
                  className="block text-sm font-bold text-slate-700 mb-2"
                >
                  الهدف الدراسي
                </label>
                <textarea
                  id="study-goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="اكتب هدفك الدراسي (مثلاً: تلخيص درس الكهرباء...)"
                  rows={4}
                  disabled={status === 'loading'}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-100 transition-all resize-none text-base disabled:opacity-50"
                />
              </div>

              {/* Output Type Select */}
              <div>
                <label
                  htmlFor="output-type"
                  className="block text-sm font-bold text-slate-700 mb-2"
                >
                  نوع المخرج
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOutputType('report')}
                    disabled={status === 'loading'}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                      outputType === 'report'
                        ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-100'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    } disabled:opacity-50`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        outputType === 'report'
                          ? 'bg-primary-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <IoDocumentTextOutline size={22} />
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 text-sm">تقرير</p>
                      <p className="text-xs text-slate-500">PDF / DOCX</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutputType('presentation')}
                    disabled={status === 'loading'}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                      outputType === 'presentation'
                        ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-100'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    } disabled:opacity-50`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        outputType === 'presentation'
                          ? 'bg-primary-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <IoEaselOutline size={22} />
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 text-sm">عرض تقديمي</p>
                      <p className="text-xs text-slate-500">PPTX</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                onClick={handleSubmit}
                disabled={!goal.trim() || status === 'loading'}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-l from-primary-600 to-primary-700 text-white font-bold text-lg shadow-lg shadow-primary-200 hover:shadow-xl hover:shadow-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
              >
                {status === 'loading' ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>AI Agent يعمل الآن...</span>
                  </>
                ) : (
                  <>
                    <IoSparklesOutline size={22} />
                    <span>تشغيل AI Agent</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Status Section */}
            <AnimatePresence mode="wait">
              {status === 'loading' && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-slate-100"
                >
                  <div className="p-6 sm:p-8">
                    <div className="flex flex-col items-center gap-4 py-4">
                      {/* Animated progress */}
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-primary-100" />
                        <div className="absolute inset-0 rounded-full border-4 border-t-primary-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                        <div className="absolute inset-2 rounded-full bg-primary-50 flex items-center justify-center">
                          <IoSparklesOutline size={20} className="text-primary-600 animate-pulse" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-slate-800 text-lg">AI Agent يعمل الآن...</p>
                        <p className="text-slate-500 text-sm mt-1">يتم تحليل الهدف وإنشاء المحتوى</p>
                      </div>

                      {/* Steps indicator */}
                      <div className="w-full max-w-xs space-y-3 mt-4">
                        <StepIndicator label="تحليل الهدف الدراسي (Gemini)" active />
                        <StepIndicator label="إنشاء المحتوى (Kimi)" />
                        <StepIndicator
                          label={
                            outputType === 'presentation'
                              ? 'تجهيز العرض التقديمي'
                              : 'تجهيز التقرير'
                          }
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {status === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-success-100 bg-success-50/50"
                >
                  <div className="p-6 sm:p-8">
                    <div className="flex flex-col items-center gap-4 py-2">
                      <div className="w-14 h-14 rounded-2xl bg-success-100 flex items-center justify-center">
                        <IoCheckmarkCircleOutline size={32} className="text-success-600" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-slate-800 text-lg">تم بنجاح!</p>
                        <p className="text-slate-500 text-sm mt-1">{fileTitle}</p>
                      </div>
                      <motion.a
                        href={fileUrl}
                        download
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-success-600 text-white font-bold shadow-lg shadow-success-200 hover:bg-success-700 transition-colors"
                      >
                        <IoDownloadOutline size={20} />
                        تحميل الملف
                      </motion.a>
                      <button
                        onClick={() => {
                          setStatus('idle');
                          setGoal('');
                          setFileUrl('');
                        }}
                        className="text-sm text-slate-500 hover:text-primary-600 transition-colors mt-2"
                      >
                        إنشاء ملف جديد
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {status === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-danger-50 bg-danger-50/50"
                >
                  <div className="p-6 sm:p-8">
                    <div className="flex flex-col items-center gap-3 py-2">
                      <div className="w-14 h-14 rounded-2xl bg-danger-50 flex items-center justify-center">
                        <IoAlertCircleOutline size={32} className="text-danger-500" />
                      </div>
                      <p className="font-bold text-slate-800">حدث خطأ</p>
                      <p className="text-sm text-danger-600 text-center">{error}</p>
                      <button
                        onClick={() => setStatus('idle')}
                        className="text-sm text-primary-600 font-bold hover:underline mt-1"
                      >
                        حاول مرة أخرى
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Features strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 grid grid-cols-3 gap-3 text-center"
          >
            {[
              { icon: '🤖', label: 'تحليل ذكي بـ Gemini' },
              { icon: '✍️', label: 'محتوى احترافي بـ Kimi' },
              { icon: '📥', label: 'تحميل فوري' },
            ].map((f) => (
              <div
                key={f.label}
                className="bg-white/70 backdrop-blur rounded-2xl p-4 border border-slate-100"
              >
                <span className="text-2xl mb-2 block">{f.icon}</span>
                <p className="text-xs font-bold text-slate-600">{f.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}

// ── Step indicator component ───────────────────
function StepIndicator({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
          active
            ? 'bg-primary-500 shadow-md shadow-primary-200'
            : 'bg-slate-200'
        }`}
      >
        {active ? (
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        ) : (
          <div className="w-2 h-2 bg-slate-400 rounded-full" />
        )}
      </div>
      <span
        className={`text-sm ${
          active ? 'text-primary-700 font-bold' : 'text-slate-400'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
