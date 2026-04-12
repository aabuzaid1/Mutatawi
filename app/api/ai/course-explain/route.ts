/**
 * AI Course Explanation API
 * POST /api/ai/course-explain
 * 
 * Uses Ollama Cloud API (GLM model) to explain:
 * - Quiz questions & answers
 * - Slide content
 * - Video content (via YouTube transcript or lesson metadata)
 */

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import {
    INTERNAL_TO_REAL_RATIO,
    MAX_TOKENS_PER_REQUEST,
    MAX_DAILY_REQUESTS,
} from '@/app/lib/aiTokens';
import { generateZhipuToken } from '@/app/lib/zhipuToken';

// ── Types ──────────────────────────────────────
type ExplainType = 'quiz' | 'slide' | 'video';

interface QuizExplainRequest {
    type: 'quiz';
    questions: Array<{
        question: string;
        options: string[];
        correctIndex: number;
        userAnswer?: number;
    }>;
}

interface SlideExplainRequest {
    type: 'slide';
    courseId?: string;
    lessonIndex?: number;
    slideTitle?: string;
    slideContent: string;
    slideNotes?: string;
    slideNumber: number;
}

interface VideoExplainRequest {
    type: 'video';
    courseId?: string;
    lessonIndex?: number;
    videoTitle: string;
    transcript?: string;
    youtubeVideoId?: string;
    lessonDescription?: string;
}

type ExplainRequest = QuizExplainRequest | SlideExplainRequest | VideoExplainRequest;

// ── Auth helper ────────────────────────────────
async function verifyAuth(req: NextRequest): Promise<string | null> {
    const header = req.headers.get('Authorization');
    if (!header?.startsWith('Bearer ')) return null;
    try {
        const decoded = await adminAuth.verifyIdToken(header.split('Bearer ')[1]);
        return decoded.uid;
    } catch {
        return null;
    }
}

// ── Super Admin check ──────────────────────────
async function isSuperAdmin(email: string): Promise<boolean> {
    if (!email) return false;
    try {
        const adminDoc = await adminDb.collection('adminEmails').doc(email.toLowerCase()).get();
        return adminDoc.exists && adminDoc.data()?.role === 'super_admin';
    } catch {
        return false;
    }
}

// ── Token check ────────────────────────────────
async function checkServerSideTokens(userId: string, estimatedCost: number) {
    const accountRef = adminDb.collection('aiTokenAccounts').doc(userId);
    const snap = await accountRef.get();

    if (!snap.exists) {
        return { allowed: false, reason: 'لا يوجد حساب توكنات.' };
    }

    const data = snap.data()!;
    const today = new Date().toISOString().split('T')[0];

    if (data.dailyResetDate !== today) {
        await accountRef.update({ dailyRequestCount: 0, dailyResetDate: today });
        data.dailyRequestCount = 0;
    }

    if (data.suspended) {
        return { allowed: false, reason: 'حسابك موقوف.' };
    }

    if (data.remainingTokens < estimatedCost) {
        return { allowed: false, reason: 'رصيد التوكنات غير كافٍ.', balance: data.remainingTokens };
    }

    if (data.dailyRequestCount >= MAX_DAILY_REQUESTS) {
        return { allowed: false, reason: `وصلت للحد اليومي (${MAX_DAILY_REQUESTS} طلب).` };
    }

    return { allowed: true, balance: data.remainingTokens };
}

// ── Deduct tokens ──────────────────────────────
async function serverDeductTokens(userId: string, amount: number, description: string): Promise<void> {
    const accountRef = adminDb.collection('aiTokenAccounts').doc(userId);

    await accountRef.update({
        usedTokens: FieldValue.increment(amount),
        remainingTokens: FieldValue.increment(-amount),
        dailyRequestCount: FieldValue.increment(1),
        lastUsed: FieldValue.serverTimestamp(),
    });

    await adminDb.collection('aiTokenTransactions').add({
        userId,
        type: 'usage',
        amount: -amount,
        description,
        timestamp: FieldValue.serverTimestamp(),
    });
}

// ── System Prompts ─────────────────────────────
function getSystemPrompt(type: ExplainType): string {
    switch (type) {
        case 'quiz':
            return `أنت مساعد تعليمي ذكي متخصص في شرح أسئلة الاختبارات.
مهمتك شرح كل سؤال بالتفصيل:
1. اشرح لماذا الإجابة الصحيحة صحيحة بتفصيل وأمثلة
2. اشرح لماذا كل خيار خاطئ هو خاطئ بشكل مختصر
3. أضف معلومات إضافية مفيدة تساعد الطالب على فهم الموضوع بشكل أعمق
4. استخدم لغة بسيطة وسهلة الفهم

رتّب إجابتك بشكل منظم باستخدام عناوين واضحة لكل سؤال.
إذا كان السؤال بالإنجليزية، اشرح بالإنجليزية. إذا كان بالعربية، اشرح بالعربية.`;

        case 'slide':
            return `أنت مساعد تعليمي ذكي متخصص في شرح محتوى العروض التقديمية (PowerPoint).
مهمتك شرح محتوى الشريحة بالتفصيل:
1. اشرح كل نقطة في الشريحة بالتفصيل
2. أضف أمثلة توضيحية عند الحاجة
3. اربط المفاهيم ببعضها
4. إذا كان هناك ملاحظات المتحدث، استخدمها لإغناء الشرح
5. رتّب الشرح بطريقة سهلة الفهم

اشرح بنفس لغة محتوى الشريحة.`;

        case 'video':
            return `أنت مساعد تعليمي ذكي متخصص في تحليل وشرح محتوى الفيديوهات التعليمية.
مهمتك:
1. حلّل المحتوى الموجود (نص الفيديو أو العنوان والوصف)
2. قدّم ملخصاً شاملاً للمحتوى
3. اشرح النقاط الرئيسية بالتفصيل
4. أضف معلومات ونصائح إضافية مفيدة
5. رتّب الشرح بعناوين واضحة: ملخص، النقاط الرئيسية، تفاصيل إضافية

اشرح بنفس لغة المحتوى المقدم.`;
    }
}

// ── Build user message ─────────────────────────
function buildUserMessage(body: ExplainRequest): string {
    switch (body.type) {
        case 'quiz': {
            let msg = 'اشرح الأسئلة التالية بالتفصيل:\n\n';
            body.questions.forEach((q, idx) => {
                msg += `السؤال ${idx + 1}: ${q.question}\n`;
                msg += `الخيارات:\n`;
                q.options.forEach((opt, optIdx) => {
                    const marker = optIdx === q.correctIndex ? '✅' : '❌';
                    msg += `  ${marker} ${String.fromCharCode(65 + optIdx)}) ${opt}\n`;
                });
                msg += `الإجابة الصحيحة: ${String.fromCharCode(65 + q.correctIndex)}\n`;
                if (q.userAnswer !== undefined && q.userAnswer !== q.correctIndex) {
                    msg += `إجابة الطالب: ${String.fromCharCode(65 + q.userAnswer)} (خاطئة)\n`;
                }
                msg += '\n';
            });
            return msg;
        }

        case 'slide': {
            let msg = `اشرح محتوى الشريحة رقم ${body.slideNumber}:\n\n`;
            if (body.slideTitle) msg += `العنوان: ${body.slideTitle}\n`;
            msg += `المحتوى:\n${body.slideContent}\n`;
            if (body.slideNotes) msg += `\nملاحظات المتحدث:\n${body.slideNotes}\n`;
            return msg;
        }

        case 'video': {
            let msg = `حلّل واشرح الفيديو التالي:\n\n`;
            msg += `عنوان الفيديو: ${body.videoTitle}\n`;
            if (body.transcript) {
                msg += `\nنص الفيديو (Transcript):\n${body.transcript.substring(0, 8000)}\n`;
            } else if (body.lessonDescription) {
                msg += `\nوصف الدرس: ${body.lessonDescription}\n`;
                msg += `\nملاحظة: لم يتم العثور على نص مكتوب للفيديو. اشرح بناءً على المعلومات المتاحة.`;
            }
            return msg;
        }
    }
}

// ── Call GLM Cloud API (Zhipu BigModel) ────────────────
async function callOllamaAPI(
    systemPrompt: string,
    userMessage: string,
): Promise<{ content: string; tokensUsed: number }> {
    const apiKey = process.env.OLLAMA_API_KEY;
    if (!apiKey) throw new Error('GLM API_KEY not configured');

    const model = process.env.OLLAMA_MODEL || 'glm-4';
    let token = apiKey;

    // Use JWT token directly via the helper if the key is formatted properly
    try {
        if (apiKey.includes('.')) {
            token = generateZhipuToken(apiKey);
        }
    } catch(e) {
        console.error('Failed to generate JWT for Zhipu:', e);
    }

    // Using Zhipu AI (GLM) standard completion endpoint
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            stream: false,
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        console.error('GLM API error:', response.status, err);
        throw new Error(`GLM API error: ${response.status} - ${err.substring(0, 200)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Extract exact usage from Zhipu API
    const internalTokensUsed = (data.usage?.total_tokens || 0) * INTERNAL_TO_REAL_RATIO;

    return {
        content,
        tokensUsed: Math.min(internalTokensUsed > 0 ? internalTokensUsed : 100 * INTERNAL_TO_REAL_RATIO, MAX_TOKENS_PER_REQUEST),
    };
}

// ── Cost estimation ────────────────────────────
function estimateCost(messageLength: number): number {
    const inputTokens = Math.ceil(messageLength / 2);
    const estimatedRealTokens = inputTokens * 3;
    return Math.min(estimatedRealTokens * INTERNAL_TO_REAL_RATIO, MAX_TOKENS_PER_REQUEST);
}

// ── Main POST handler ──────────────────────────
export async function POST(request: NextRequest) {
    try {
        // 1. Auth
        const uid = await verifyAuth(request);
        if (!uid) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        }

        // 2. Parse body
        const body = await request.json() as ExplainRequest;
        if (!body.type || !['quiz', 'slide', 'video'].includes(body.type)) {
            return NextResponse.json({ error: 'نوع الطلب غير صحيح' }, { status: 400 });
        }

        // 3. Get user email & check super admin
        let userEmail = '';
        try {
            const userRecord = await adminAuth.getUser(uid);
            userEmail = userRecord.email || '';
        } catch { }

        const superAdmin = await isSuperAdmin(userEmail);
        const userMessage = buildUserMessage(body);
        const estimatedCost = estimateCost(userMessage.length);

        // 4. Token check
        if (!superAdmin) {
            const tokenCheck = await checkServerSideTokens(uid, estimatedCost);
            if (!tokenCheck.allowed) {
                return NextResponse.json({
                    error: tokenCheck.reason,
                    balance: tokenCheck.balance,
                    type: 'token_error',
                }, { status: 429 });
            }
        }

        // 5. Call Ollama GLM
        const systemPrompt = getSystemPrompt(body.type);
        let result;

        try {
            result = await callOllamaAPI(systemPrompt, userMessage);
        } catch (ollamaErr: any) {
            console.error('Ollama API failed:', ollamaErr.message);

            // Fallback: try Gemini
            try {
                const geminiKey = process.env.GEMINI_API_KEY;
                if (!geminiKey) throw new Error('No fallback API');

                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
                const geminiRes = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
                        systemInstruction: { parts: [{ text: systemPrompt }] },
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 4000,
                        },
                    }),
                });

                if (!geminiRes.ok) throw new Error('Gemini fallback failed');

                const geminiData = await geminiRes.json();
                const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
                const usage = geminiData.usageMetadata || {};
                const realTokens = (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);

                result = {
                    content,
                    tokensUsed: Math.min(realTokens * INTERNAL_TO_REAL_RATIO, MAX_TOKENS_PER_REQUEST),
                };
            } catch (fallbackErr: any) {
                console.error('All AI APIs failed:', fallbackErr.message);
                return NextResponse.json(
                    { error: 'فشل معالجة الطلب. حاول مرة أخرى لاحقاً.' },
                    { status: 500 }
                );
            }
        }

        // 6. Deduct tokens
        if (!superAdmin) {
            await serverDeductTokens(
                uid,
                result.tokensUsed,
                `شرح ${body.type === 'quiz' ? 'كويز' : body.type === 'slide' ? 'شريحة' : 'فيديو'} بالذكاء الاصطناعي`
            );
        }

        // 7. Save Slide or Video Explanation if requested
        if ('courseId' in body && body.courseId && 'lessonIndex' in body && typeof body.lessonIndex === 'number') {
            try {
                const courseRef = adminDb.collection('courses').doc(body.courseId);
                const courseSnap = await courseRef.get();
                if (courseSnap.exists) {
                    const courseData = courseSnap.data();
                    const lessons = courseData?.lessons || [];
                    
                    if (body.type === 'slide' && lessons[body.lessonIndex]?.type === 'slides') {
                        const slideDataArray = lessons[body.lessonIndex].slidesData || [];
                        const slideToUpdate = slideDataArray.findIndex((s: any) => s.slideNumber === body.slideNumber);
                        if (slideToUpdate !== -1) {
                            slideDataArray[slideToUpdate].aiExplanation = result.content;
                            lessons[body.lessonIndex].slidesData = slideDataArray;
                        }
                    } else if (body.type === 'video' && lessons[body.lessonIndex]?.type === 'video') {
                        lessons[body.lessonIndex].aiExplanation = result.content;
                    }

                    await courseRef.update({ lessons });
                }
            } catch (err) {
                console.error('Failed to save AI explanation:', err);
            }
        }

        // 8. Get updated balance
        const accountRef = adminDb.collection('aiTokenAccounts').doc(uid);
        const accountSnap = await accountRef.get();
        const balance = accountSnap.data()?.remainingTokens || 0;

        return NextResponse.json({
            explanation: result.content,
            tokensUsed: result.tokensUsed,
            balance,
        });

    } catch (error: any) {
        console.error('Course explain error:', error?.message, error?.stack?.substring(0, 500));
        return NextResponse.json(
            { error: 'حدث خطأ أثناء المعالجة. حاول مرة أخرى.' },
            { status: 500 }
        );
    }
}
