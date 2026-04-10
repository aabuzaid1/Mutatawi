/**
 * Unified AI Generation API
 * POST /api/ai/generate
 * 
 * Handles all AI requests: chat, doc, slides, sheet, quiz, flashcards, explain, summarize
 * Pipeline: Auth → Rate limit → Token check → Cache → Kimi 2.5 → Deduct → Store → Return
 */

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { StudyMode } from '@/app/types';
import {
    INTERNAL_TO_REAL_RATIO,
    MAX_TOKENS_PER_REQUEST,
    MAX_DAILY_REQUESTS,
} from '@/app/lib/aiTokens';
import { generateImage } from '@/app/lib/generateImage';

// ── System Prompts ─────────────────────────────
// IMPORTANT: Kimi/Moonshot is a Chinese model - must explicitly enforce Arabic output
const LANG_RULE = `ABSOLUTE LANGUAGE RULE (VIOLATION = FAILURE):
- You MUST respond ONLY in Arabic (العربية) or English.
- NEVER output any Chinese characters (中文/汉字), Japanese (日本語), Korean (한국어), or any CJK characters.
- If ANY Chinese character appears in your response, the entire response is REJECTED.
- If the user writes in Arabic, respond in Arabic. If they write in English, respond in English.
- This rule applies to ALL content including JSON values, titles, explanations, and every single word.
- This is NON-NEGOTIABLE.`;

const SYSTEM_PROMPTS: Record<string, string> = {
    chat: `أنت مساعد ذكي للمذاكرة يدعى "مساعد متطوع".
مهمتك مساعدة الطالب في فهم الدروس، حل الأسئلة، وتبسيط المفاهيم.
${LANG_RULE}

## تحليل الصور:
عندما يرسل لك المستخدم صورة:
1. حلل محتوى الصورة بدقة
2. إذا كانت الصورة تحتوي على أسئلة أو تمارين أو مسائل → قم بحل كل سؤال خطوة بخطوة مع شرح الحل
3. إذا كانت الصورة تحتوي على نص → اقرأ النص واشرحه أو لخصه حسب طلب المستخدم
4. إذا كانت الصورة تحتوي على رسم بياني أو جدول → حلل البيانات واشرحها
5. دائماً اكتب الأسئلة التي رأيتها في الصورة قبل حلها حتى يتأكد المستخدم أنك فهمتها

## سياق المحادثة:
لديك إمكانية الوصول إلى سجل المحادثة السابقة. استخدمه لفهم سياق ما يطلبه المستخدم والإشارة إلى رسائل سابقة عند الحاجة.

## ممنوعات:
- لا تولد صور أو روابط صور في ردودك
- لا تستخدم صيغة ![image](...) أبداً
- لا تستخدم pollinations.ai أو أي خدمة توليد صور
- رد بنص فقط`,

    explain: `اشرح المفهوم أو النص التالي بالتفصيل، كأنك مدرس يشرح لطالب. استخدم أمثلة.
${LANG_RULE}
اشرح بنص واضح ومنظم. لا تستخدم صيغة توليد صور أو روابط صور في ردك.`,

    summarize: `لخّص النص أو الموضوع التالي بنقاط واضحة ومختصرة ومرتبة. ركّز على الأفكار الرئيسية.
${LANG_RULE}`,

    doc: `${LANG_RULE}

Return ONLY valid JSON:
{
  "title": "",
  "sections": [
    {
      "heading": "",
      "content": "",
      "imagePrompt": ""
    }
  ]
}

Rules:
- ALWAYS include imagePrompt
- imagePrompt MUST be in English
- imagePrompt must describe a clean educational illustration
- Keep ALL text content in Arabic or English ONLY — absolutely NO Chinese
- Max 6 sections
- No extra text outside JSON
`,

    slides: `${LANG_RULE}

Return ONLY valid JSON:
{
  "title": "",
  "slides": [
    {
      "title": "",
      "points": [],
      "imagePrompt": ""
    }
  ]
}

Rules:
- ALWAYS include imagePrompt
- imagePrompt MUST be in English
- Each slide: 3-5 points
- Max 8 slides
- ALL text content MUST be in Arabic or English ONLY — absolutely NO Chinese
- No extra text
`,

    sheet: `أنت مولّد جداول بيانات.
${LANG_RULE}
أنشئ جدولاً منظماً عن الموضوع المطلوب.
يجب أن ترجع JSON فقط بالضبط بهذا الشكل بدون أي نص إضافي:
{"title":"عنوان الجدول","columns":["عمود1","عمود2"],"rows":[["قيمة1","قيمة2"]]}
اكتب على الأقل 5-10 صفوف. المحتوى يجب أن يكون باللغة المطلوبة.
لا تكتب أي شيء قبل أو بعد الـ JSON.`,

    quiz: `أنت مولّد اختبارات تعليمية.
${LANG_RULE}
أنشئ اختباراً عن الموضوع المطلوب.
يجب أن ترجع JSON فقط بالضبط بهذا الشكل بدون أي نص إضافي:
{"title":"عنوان الاختبار","questions":[{"question":"نص السؤال","options":["خيار أ","خيار ب","خيار ج","خيار د"],"correctIndex":0,"explanation":"شرح الإجابة الصحيحة"}]}
اكتب 5-10 أسئلة متنوعة الصعوبة. المحتوى يجب أن يكون باللغة المطلوبة.
لا تكتب أي شيء قبل أو بعد الـ JSON.`,

    flashcards: `أنت مولّد بطاقات مراجعة تعليمية.
${LANG_RULE}
أنشئ بطاقات مراجعة عن الموضوع المطلوب.
يجب أن ترجع JSON فقط بالضبط بهذا الشكل بدون أي نص إضافي:
{"title":"عنوان البطاقات","cards":[{"front":"السؤال أو المصطلح","back":"الإجابة أو التعريف"}]}
اكتب 10-15 بطاقة. المحتوى يجب أن يكون باللغة المطلوبة.
لا تكتب أي شيء قبل أو بعد الـ JSON.`,
};

// ── Simple response cache ──────────────────────
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_SIZE = 100;

function getCacheKey(type: string, message: string): string {
    const shortMsg = message.substring(0, 200).toLowerCase().trim();
    return `${type}:${shortMsg}`;
}

function getCached(key: string): any | null {
    const entry = responseCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        responseCache.delete(key);
        return null;
    }
    return entry.data;
}

function setCache(key: string, data: any): void {
    if (responseCache.size >= MAX_CACHE_SIZE) {
        const firstKey = responseCache.keys().next().value;
        if (firstKey) responseCache.delete(firstKey);
    }
    responseCache.set(key, { data, timestamp: Date.now() });
}

// ── Auth helper ────────────────────────────────
async function verifyAuth(request: NextRequest): Promise<{ uid: string; email: string } | null> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    
    try {
        const token = authHeader.split('Bearer ')[1];
        const decoded = await adminAuth.verifyIdToken(token);
        return { uid: decoded.uid, email: decoded.email || '' };
    } catch {
        return null;
    }
}

// ── Super Admin check (unlimited tokens) ──────
async function isSuperAdmin(email: string): Promise<boolean> {
    if (!email) return false;
    try {
        const adminDoc = await adminDb.collection('adminEmails').doc(email.toLowerCase()).get();
        return adminDoc.exists && adminDoc.data()?.role === 'super_admin';
    } catch {
        return false;
    }
}

// ── Token & rate limit check (server-side) ─────
async function checkServerSideTokens(userId: string, estimatedCost: number): Promise<{
    allowed: boolean;
    reason?: string;
    balance?: number;
}> {
    const accountRef = adminDb.collection('aiTokenAccounts').doc(userId);
    const snap = await accountRef.get();

    if (!snap.exists) {
        return { allowed: false, reason: 'لا يوجد حساب توكنات.' };
    }

    const data = snap.data()!;
    const today = new Date().toISOString().split('T')[0];

    // Reset daily count if new day
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

// ── Deduct tokens server-side ──────────────────
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

// ── Store conversation ─────────────────────────
async function storeMessage(
    userId: string,
    conversationId: string | undefined,
    userMessage: string,
    assistantMessage: string,
    type: StudyMode,
    tokensUsed: number,
    structuredData?: any,
    attachments?: string[]
): Promise<string> {
    const now = FieldValue.serverTimestamp();

    // Build user message data with optional attachments
    const userMsgData: any = {
        role: 'user', content: userMessage, type, timestamp: now,
    };
    if (attachments && attachments.length > 0) {
        userMsgData.attachments = attachments;
    }

    if (conversationId) {
        // Add to existing conversation
        const convRef = adminDb.collection('aiConversations').doc(conversationId);
        const convSnap = await convRef.get();

        if (convSnap.exists && convSnap.data()?.userId === userId) {
            const msgCount = convSnap.data()?.messageCount || 0;

            // Cap at 50 messages
            if (msgCount < 50) {
                await convRef.collection('messages').add(userMsgData);
                await convRef.collection('messages').add({
                    role: 'assistant', content: assistantMessage, type, tokensUsed, timestamp: now,
                    ...(structuredData ? { structuredData } : {}),
                });
                await convRef.update({
                    messageCount: FieldValue.increment(2),
                    tokensUsed: FieldValue.increment(tokensUsed),
                    updatedAt: now,
                });
            }
            return conversationId;
        }
    }

    // Create new conversation
    const title = userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '');
    const convRef = await adminDb.collection('aiConversations').add({
        userId,
        title,
        messageCount: 2,
        tokensUsed,
        createdAt: now,
        updatedAt: now,
    });

    await convRef.collection('messages').add(userMsgData);
    await convRef.collection('messages').add({
        role: 'assistant', content: assistantMessage, type, tokensUsed, timestamp: now,
        ...(structuredData ? { structuredData } : {}),
    });

    return convRef.id;
}

// ── Call Gemini API ────────────────────────────
async function callGeminiAPI(
    systemPrompt: string,
    userMessage: string,
    type: StudyMode,
    attachments?: string[],
    conversationHistory?: { role: string; content: string }[]
): Promise<{ content: string; tokensUsed: number }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    const jsonTypes: StudyMode[] = ['doc', 'slides', 'sheet', 'quiz', 'flashcards'];
    const isJsonOutput = jsonTypes.includes(type);
    const realMaxTokens = 8000; // Allow maximum real tokens for extremely long answers

    // Build conversation contents with history
    const contents: any[] = [];

    // Add conversation history (last 10 messages for context)
    if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-10);
        
        let lastRole = '';
        for (const msg of recentHistory) {
            const role = msg.role === 'assistant' ? 'model' : 'user';
            const text = msg.content?.trim() || '[مرفق]';
            
            // Skip consecutive same-role messages to satisfy Gemini strict alternating rules
            if (role === lastRole) continue;
            
            contents.push({
                role: role,
                parts: [{ text }]
            });
            lastRole = role;
        }

        // If the last role is 'user', we must add a model message so that the next user message alternates
        if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
            contents.push({
                role: 'model',
                parts: [{ text: 'تفضل، أنا مستعد لمساعدتك.' }]
            });
        }
    }

    // Build current user message parts
    const parts: any[] = [];
    if (attachments && attachments.length > 0) {
        for (const att of attachments) {
            // att format: data:image/png;base64,...
            const mimeType = att.substring(att.indexOf(':') + 1, att.indexOf(';')) || 'image/jpeg';
            const base64Data = att.split(',')[1];
            if (base64Data) {
                parts.push({
                    inlineData: {
                        mimeType,
                        data: base64Data
                    }
                });
            }
        }
    }
    parts.push({ text: userMessage });
    contents.push({ role: 'user', parts });

    const body: any = {
        contents,
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
        generationConfig: {
            temperature: isJsonOutput ? 0.3 : 0.7,
            maxOutputTokens: realMaxTokens,
            ...(isJsonOutput ? { responseMimeType: 'application/json' } : {})
        }
    };

    // Enable Google Search Grounding for live website analysis (only in non-JSON modes like chat/explain)
    // Avoid using it alongside images as Multimodal + Search might throw 400 Bad Request in v1beta.
    if (!isJsonOutput && (!attachments || attachments.length === 0)) {
        body.tools = [{ googleSearch: {} }];
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const err = await response.text();
        console.error('Gemini API error:', response.status, err);
        console.error('Gemini request had images:', !!(attachments && attachments.length > 0));
        throw new Error(`Gemini API error: ${response.status} - ${err.substring(0, 200)}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Usage in Gemini API (metadata)
    const usage = data.usageMetadata || {};
    const realTokensUsed = (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);
    const internalTokensUsed = realTokensUsed * INTERNAL_TO_REAL_RATIO;

    return {
        content,
        tokensUsed: Math.min(internalTokensUsed, MAX_TOKENS_PER_REQUEST),
    };
}

// ── Call Kimi 2.5 API ──────────────────────────
async function callKimiAPI(
    systemPrompt: string,
    userMessage: string,
    type: StudyMode,
    attachments?: string[],
    conversationHistory?: { role: string; content: string }[]
): Promise<{ content: string; tokensUsed: number }> {
    const apiKey = process.env.KIMI_API_KEY;
    const baseUrl = process.env.KIMI_API_BASE_URL || 'https://api.moonshot.ai/v1';
    const baseModel = process.env.KIMI_MODEL || 'moonshot-v1-8k';
    // Use kimi-k2.5 for vision (supports base64 image inputs natively)
    const hasImages = attachments && attachments.length > 0;
    const model = hasImages ? 'kimi-k2.5' : baseModel;

    if (!apiKey) {
        throw new Error('KIMI_API_KEY not configured');
    }

    // Build messages
    const messages: any[] = [
        { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (last 10 messages for context)
    if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-10);
        for (const msg of recentHistory) {
            const text = msg.content?.trim() || '[مرفق]';
            messages.push({ role: msg.role, content: text });
        }
    }

    // Handle multimodal (images)
    if (attachments && attachments.length > 0) {
        const content: any[] = [{ type: 'text', text: userMessage }];
        for (const att of attachments) {
            content.push({ type: 'image_url', image_url: { url: att } });
        }
        messages.push({ role: 'user', content });
    } else {
        messages.push({ role: 'user', content: userMessage });
    }

    // Determine if we need JSON output
    const jsonTypes: StudyMode[] = ['doc', 'slides', 'sheet', 'quiz', 'flashcards'];
    const isJsonOutput = jsonTypes.includes(type);

    // Allow maximum real tokens for extremely long text generation or JSON
    const realMaxTokens = 8000;

    const body: any = {
        model,
        messages,
        max_tokens: realMaxTokens,
        // kimi-k2.5 only allows temperature=1
        temperature: model === 'kimi-k2.5' ? 1 : (isJsonOutput ? 0.3 : 0.7),
    };

    if (isJsonOutput) {
        body.response_format = { type: 'json_object' };
    }

    // Try primary URL, fallback to alternate if 401
    const urls = [baseUrl];
    if (baseUrl.includes('.ai')) {
        urls.push('https://api.moonshot.cn/v1');
    } else {
        urls.push('https://api.moonshot.ai/v1');
    }

    let lastError = '';
    for (const url of urls) {
        const response = await fetch(`${url}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
        });

        if (response.status === 401) {
            lastError = await response.text();
            console.warn(`Kimi API 401 with ${url}, trying fallback...`, lastError);
            continue; // Try next URL
        }

        if (response.status === 429) {
            const err = await response.text();
            console.error('Kimi API quota exceeded:', err);
            throw new Error('429 - insufficient balance / quota exceeded');
        }

        if (!response.ok) {
            const err = await response.text();
            console.error('Kimi API error:', response.status, err);
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const choice = data.choices?.[0];
        const content = choice?.message?.content || '';
        const usage = data.usage || {};
        const realTokensUsed = (usage.prompt_tokens || 0) + (usage.completion_tokens || 0);
        const internalTokensUsed = realTokensUsed * INTERNAL_TO_REAL_RATIO;

        return {
            content,
            tokensUsed: Math.min(internalTokensUsed, MAX_TOKENS_PER_REQUEST),
        };
    }

    // Both URLs failed with 401
    console.error('Kimi API: All endpoints failed with 401. API key may be invalid.');
    throw new Error('API authentication failed - check your KIMI_API_KEY');
}

function internalToRealMax(internal: number): number {
    return Math.ceil(internal / INTERNAL_TO_REAL_RATIO);
}

// ── Sanitize Chinese characters from responses ──
// Kimi/Moonshot is a Chinese model and sometimes leaks Chinese despite prompt rules
function sanitizeChinese(text: string): string {
    if (!text) return text;
    // CJK Unified Ideographs + CJK Extensions + CJK Compatibility + Bopomofo + Katakana + Hangul
    // We keep Arabic, English, numbers, punctuation, and common symbols (using basic ranges to avoid ES6 regex flag issues)
    const hasChinese = /[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\uff00-\uffef]/.test(text);
    if (!hasChinese) return text;
    
    console.warn('Chinese characters detected in AI response, sanitizing...');
    return text.replace(/[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\uff00-\uffef]/g, '').replace(/\s{2,}/g, ' ').trim();
}

// ── Parse JSON safely ──────────────────────────

function fixUnescapedNewlines(jsonStr: string): string {
    let result = '';
    let inString = false;
    let isEscaped = false;

    for (let i = 0; i < jsonStr.length; i++) {
        const char = jsonStr[i];

        if (char === '"' && !isEscaped) {
            inString = !inString;
            result += char;
        } else if (char === '\\') {
            isEscaped = !isEscaped;
            result += char;
        } else if (inString && (char === '\n' || char === '\r')) {
            // Replace physical newline inside string with escaped newline
            result += char === '\n' ? '\\n' : '\\r';
            isEscaped = false;
        } else {
            result += char;
            isEscaped = false;
        }
    }
    return result;
}

function parseStructuredResponse(content: string, type: StudyMode): any | null {
    try {
        let jsonStr = content.trim();
        jsonStr = fixUnescapedNewlines(jsonStr);

        // 1. Try to extract JSON from markdown code blocks
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (jsonMatch && jsonMatch[1]) {
            jsonStr = jsonMatch[1].trim();
            jsonStr = fixUnescapedNewlines(jsonStr);
            return JSON.parse(jsonStr);
        }

        // 2. Fallback: Find the first { and the last }
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
            return JSON.parse(jsonStr);
        }

        // 3. Fallback: Just try parsing the whole thing
        return JSON.parse(jsonStr);
    } catch (e) {
        console.warn('Failed to parse structured response for type:', type, e);
        return null; // Return null if it's completely unparseable
    }
}

// ── Main handler ───────────────────────────────
export async function POST(request: NextRequest) {
    try {
        // 1. Auth check
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        }

        // 2. Parse request
        const body = await request.json();
        const { type, message, attachments, conversationId, conversationHistory } = body as {
            type: StudyMode;
            message: string;
            attachments?: string[];
            conversationId?: string;
            conversationHistory?: { role: string; content: string }[];
        };

        let finalMessage = message?.trim() || '';

        if (!type || (!finalMessage && (!attachments || attachments.length === 0))) {
            return NextResponse.json({ error: 'الرسالة أو الصورة مطلوبة' }, { status: 400 });
        }

        if (!finalMessage && attachments && attachments.length > 0) {
            finalMessage = 'حلل هذه الصورة بدقة. إذا كانت تحتوي على أسئلة أو تمارين أو مسائل، قم بحل كل سؤال خطوة بخطوة مع شرح الحل. إذا كانت تحتوي على نص أو معلومات، اشرحها بالتفصيل.';
        }

        // 3. Check if super admin (unlimited tokens)
        const superAdmin = await isSuperAdmin(auth.email);

        // 4. Estimate cost (approx 500 chars for each image)
        const estimatedCost = estimateCostServer(finalMessage.length + ((attachments?.length || 0) * 500), type);

        // 5. Rate limit & token check (skip for super admins)
        let check = { allowed: true, balance: 999999 };
        if (!superAdmin) {
            const tokenCheck = await checkServerSideTokens(auth.uid, estimatedCost);
            if (!tokenCheck.allowed) {
                return NextResponse.json({
                    error: tokenCheck.reason,
                    balance: tokenCheck.balance,
                    type: 'token_error',
                }, { status: 429 });
            }
            check = { allowed: true, balance: tokenCheck.balance || 0 };
        }

        // 5. Cache check (only for structured outputs, not chat)
        const jsonTypes: StudyMode[] = ['doc', 'slides', 'sheet', 'quiz', 'flashcards'];
        const isStructured = jsonTypes.includes(type);
        const cacheKey = getCacheKey(type, finalMessage);

        if (isStructured) {
            const cached = getCached(cacheKey);
            if (cached) {
                // Deduct minimal tokens for cached response
                const cacheTokenCost = 50;
                await serverDeductTokens(auth.uid, cacheTokenCost, `${type} (مخزن مؤقتاً)`);
                const convId = await storeMessage(auth.uid, conversationId, finalMessage, JSON.stringify(cached), type, cacheTokenCost, cached);

                return NextResponse.json({
                    content: JSON.stringify(cached),
                    structuredData: cached,
                    type,
                    tokensUsed: cacheTokenCost,
                    conversationId: convId,
                    balance: (check.balance || 0) - cacheTokenCost,
                    cached: true,
                });
            }
        }

        // 6. Call API (Gemini or Kimi based on mode)
        const systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.chat;
        const useGeminiFor: StudyMode[] = ['chat', 'explain', 'summarize', 'quiz', 'flashcards'];
        const isGemini = useGeminiFor.includes(type);
        const hasImages = attachments && attachments.length > 0;

        let result;
        if (hasImages) {
            // Try Kimi vision model first (moonshot-v1-8k-vision-preview), then Gemini
            try {
                console.log('Processing image request with Kimi vision model...', { type, imageCount: attachments.length });
                result = await callKimiAPI(systemPrompt, finalMessage, type, attachments, conversationHistory);
            } catch (kimiErr: any) {
                console.warn('Kimi vision failed for image request:', kimiErr.message, '- trying Gemini...');
                try {
                    result = await callGeminiAPI(systemPrompt, finalMessage, type, attachments, conversationHistory);
                } catch (geminiErr: any) {
                    console.error('Gemini also failed for image request:', geminiErr.message);
                    return NextResponse.json(
                        { error: 'فشل تحليل الصورة. تأكد من أن الصورة واضحة وحاول مرة أخرى.' },
                        { status: 500 }
                    );
                }
            }
        } else if (isGemini) {
            try {
                result = await callGeminiAPI(systemPrompt, finalMessage, type, undefined, conversationHistory);
            } catch (geminiErr: any) {
                console.warn('Gemini API failed, falling back to Kimi:', geminiErr.message);
                result = await callKimiAPI(systemPrompt, finalMessage, type, undefined, conversationHistory);
            }
        } else {
            try {
                result = await callKimiAPI(systemPrompt, finalMessage, type, undefined, conversationHistory);
            } catch (kimiErr: any) {
                console.error('Kimi API failed, falling back to Gemini:', kimiErr);
                result = await callGeminiAPI(systemPrompt, finalMessage, type, undefined, conversationHistory);
            }
        }
        
        if (!result) {
            throw new Error('All API attempts failed.');
        }

        // Sanitize Chinese characters from response (Kimi sometimes leaks Chinese)
        result.content = sanitizeChinese(result.content);
        
        let totalTokensUsed = result.tokensUsed;

        // 7. Parse structured data if applicable
        let structuredData = null;
        if (isStructured) {
            structuredData = parseStructuredResponse(result.content, type);
            
            // Retry once if JSON parsing fails
            if (!structuredData) {
                console.warn('JSON parsing failed. Retrying with stricter prompt...');
                const stricterPrompt = systemPrompt + "\n\nCRITICAL: You failed to return valid JSON previously. You MUST return ONLY valid JSON and NOTHING ELSE. No text before or after. Do NOT use unescaped newlines inside strings. Use \\\\n for line breaks.";
                
                let retryResult;
                if (isGemini) {
                    try {
                        retryResult = await callGeminiAPI(stricterPrompt, finalMessage, type, attachments, conversationHistory);
                    } catch (geminiErr: any) {
                        console.warn('Gemini retry failed, falling back to Kimi:', geminiErr.message);
                        retryResult = await callKimiAPI(stricterPrompt, finalMessage, type, attachments, conversationHistory);
                    }
                } else {
                    try {
                        retryResult = await callKimiAPI(stricterPrompt, finalMessage, type, attachments, conversationHistory);
                    } catch (kimiErr: any) {
                        console.warn('Kimi API failed during retry, falling back to Gemini:', kimiErr.message);
                        retryResult = await callGeminiAPI(stricterPrompt, finalMessage, type, attachments, conversationHistory);
                    }
                }
                
                result.content = retryResult.content;
                totalTokensUsed += retryResult.tokensUsed;
                structuredData = parseStructuredResponse(result.content, type);
            }

            if (structuredData) {
                // Safety Checks
                if (type === 'slides' && Array.isArray(structuredData.slides)) {
                    structuredData.slides = structuredData.slides.slice(0, 8); // Max 8 slides
                } else if (type === 'doc' && Array.isArray(structuredData.sections)) {
                    structuredData.sections = structuredData.sections.slice(0, 6); // Max 6 sections
                }

                // Inject images from nanobanana API (returns URL)
                const MAX_IMAGES = 3;
                if (type === 'doc' && Array.isArray(structuredData.sections)) {
                    const sectionsWithImages = structuredData.sections.filter((s: any) => s.imagePrompt).slice(0, MAX_IMAGES);
                    await Promise.all(
                        sectionsWithImages.map(async (section: any) => {
                            const generatedImg = await generateImage(section.imagePrompt);
                            if (generatedImg) {
                                if (generatedImg.startsWith('http')) {
                                    section.imageUrl = generatedImg;
                                } else {
                                    section.imageBase64 = generatedImg;
                                }
                            }
                        })
                    );
                } else if (type === 'slides' && Array.isArray(structuredData.slides)) {
                    const slidesWithImages = structuredData.slides.filter((s: any) => s.imagePrompt).slice(0, MAX_IMAGES);
                    await Promise.all(
                        slidesWithImages.map(async (slide: any) => {
                            const generatedImg = await generateImage(slide.imagePrompt);
                            if (generatedImg) {
                                if (generatedImg.startsWith('http')) {
                                    slide.imageUrl = generatedImg;
                                } else {
                                    slide.imageBase64 = generatedImg;
                                }
                            }
                        })
                    );
                }
                setCache(cacheKey, structuredData);
            } else {
                return NextResponse.json({ error: 'عذراً، لم نتمكن من توليد المخرجات بالتنسيق الصحيح. الرجاء المحاولة مرة أخرى بصيغة مختلفة.' }, { status: 500 });
            }
        }

        // 8. Deduct tokens (skip for super admins)
        const actualCost = Math.max(totalTokensUsed, 50); // minimum 50 tokens
        if (!superAdmin) {
            await serverDeductTokens(auth.uid, actualCost, `${type}: ${finalMessage.substring(0, 50)}`);
        }

        // 9. Store conversation (include attachments so images persist)
        const convId = await storeMessage(
            auth.uid, conversationId, message || 'صورة مرفقة', result.content,
            type, actualCost, structuredData, attachments
        );

        // 10. Return response
        return NextResponse.json({
            content: result.content,
            structuredData,
            type,
            tokensUsed: actualCost,
            conversationId: convId,
            balance: (check.balance || 0) - actualCost,
            cached: false,
        });

    } catch (error: any) {
        console.error('AI generate error:', error);
        
        // Handle specific API errors with meaningful messages
        const errorMsg = error?.message || '';
        if (errorMsg.includes('authentication failed') || errorMsg.includes('401')) {
            return NextResponse.json(
                { error: 'خطأ في مفتاح API. تواصل مع الإدارة.' },
                { status: 503 }
            );
        }
        if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('insufficient balance')) {
            return NextResponse.json(
                { error: 'خدمة الذكاء الاصطناعي غير متاحة حالياً (رصيد API منتهي). تواصل مع الإدارة.' },
                { status: 503 }
            );
        }
        
        console.error('Full error details:', JSON.stringify({ message: error?.message, stack: error?.stack?.substring(0, 500) }));
        return NextResponse.json(
            { error: 'حدث خطأ في معالجة الطلب. حاول مرة أخرى.' },
            { status: 500 }
        );
    }
}

// Server-side cost estimation
function estimateCostServer(messageLength: number, type: string): number {
    const inputTokens = Math.ceil(messageLength / 2);
    const outputMultipliers: Record<string, number> = {
        chat: 2, explain: 3, summarize: 1.5, quiz: 4,
        flashcards: 3, doc: 5, slides: 4, sheet: 3,
    };
    const multiplier = outputMultipliers[type] || 2;
    const estimatedRealTokens = inputTokens * multiplier;
    return Math.min(estimatedRealTokens * INTERNAL_TO_REAL_RATIO, MAX_TOKENS_PER_REQUEST);
}
