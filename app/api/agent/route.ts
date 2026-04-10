/**
 * AI Study Agent API
 * POST /api/agent
 *
 * Pipeline: Auth → Gemini (analysis) → Kimi (generation) → File creation → URL
 * Fallback: If Kimi fails, uses Gemini content directly.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  callGeminiAnalysis,
  callKimiGeneration,
  StructuredOutline,
  SlidesOutput,
} from '@/app/lib/ai';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import PptxGenJS from 'pptxgenjs';

import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth, adminStorage } from '@/app/lib/firebase-admin';
import {
  INTERNAL_TO_REAL_RATIO,
  MAX_TOKENS_PER_REQUEST,
  MAX_DAILY_REQUESTS,
} from '@/app/lib/aiTokens';

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

// ── Upload helper ──────────────────────────────
async function uploadToFirebase(buffer: Buffer, filename: string, contentType: string): Promise<string> {
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucketName) throw new Error('Storage bucket not configured in env.');

  const bucket = adminStorage.bucket(bucketName);
  const file = bucket.file(`generated/${filename}`);

  await file.save(buffer, {
    metadata: { contentType },
  });

  // Get a very long lived signed URL for the user to download
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: '01-01-2100',
  });

  return url;
}

// ── Generate DOCX ──────────────────────────────
async function generateDocx(data: StructuredOutline): Promise<string> {
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.title,
          bold: true,
          size: 36,
          font: 'Arial',
          color: '1a1a2e',
        }),
      ],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      bidirectional: true,
    })
  );

  // Separator line
  children.push(
    new Paragraph({
      children: [new TextRun({ text: '━'.repeat(60), color: 'cccccc', size: 16 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  );

  // Sections
  for (const section of data.sections) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: section.heading,
            bold: true,
            size: 28,
            font: 'Arial',
            color: '4f46e5',
          }),
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
        bidirectional: true,
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: section.content.replace(/\\n/g, '\n'),
            size: 22,
            font: 'Arial',
          }),
        ],
        spacing: { after: 200 },
        bidirectional: true,
      })
    );
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = `report-${Date.now()}.docx`;

  return await uploadToFirebase(
    Buffer.from(buffer),
    filename,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
}

// ── Generate PPTX ──────────────────────────────
async function generatePptx(data: SlidesOutput): Promise<string> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.defineLayout({ name: 'CUSTOM', width: 13.33, height: 7.5 });
  pptx.layout = 'CUSTOM';

  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { fill: '1a1a2e' };
  titleSlide.addText(data.title, {
    x: 0.5,
    y: 2.0,
    w: 12.33,
    h: 2.0,
    fontSize: 36,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    fontFace: 'Arial',
    rtlMode: true,
  });
  titleSlide.addText('تم الإنشاء بواسطة AI Study Agent', {
    x: 0.5,
    y: 4.5,
    w: 12.33,
    h: 0.8,
    fontSize: 14,
    color: '9CA3AF',
    align: 'center',
    fontFace: 'Arial',
    rtlMode: true,
  });

  // Content slides
  for (const slide of data.slides) {
    const s = pptx.addSlide();
    s.background = { fill: 'FFFFFF' };

    // Slide title bar
    s.addShape('rect' as any, {
      x: 0,
      y: 0,
      w: 13.33,
      h: 1.4,
      fill: { color: '4f46e5' },
    });
    s.addText(slide.title, {
      x: 0.5,
      y: 0.2,
      w: 12.33,
      h: 1.0,
      fontSize: 24,
      bold: true,
      color: 'FFFFFF',
      fontFace: 'Arial',
      rtlMode: true,
    });

    // Bullet points
    const points = slide.points.map((p) => ({
      text: p,
      options: {
        fontSize: 18,
        color: '333333',
        fontFace: 'Arial',
        bullet: { code: '25CF', color: '4f46e5' },
        rtlMode: true,
        breakLine: true,
        spacing: { before: 8, after: 8 },
      },
    }));

    s.addText(points as any, {
      x: 0.8,
      y: 1.8,
      w: 11.73,
      h: 5.0,
      valign: 'top',
      paraSpaceAfter: 12,
    });
  }

  const filename = `presentation-${Date.now()}.pptx`;

  // Use write with nodebuffer directly — pptx.stream() is unreliable
  const fileBuffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;

  console.log('PPTX generated successfully, buffer size:', fileBuffer.length);

  return await uploadToFirebase(
    Buffer.from(fileBuffer),
    filename,
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  );
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
async function storeAgentMessage(
  userId: string,
  userEmail: string,
  userMessage: string,
  assistantMessageContent: string,
  type: 'doc' | 'slides',
  tokensUsed: number,
  structuredData?: any
) {
  const now = FieldValue.serverTimestamp();
  const title = userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '');

  const convRef = await adminDb.collection('aiConversations').add({
    userId,
    userEmail,
    title,
    messageCount: 2,
    tokensUsed,
    createdAt: now,
    updatedAt: now,
  });

  await convRef.collection('messages').add({
    role: 'user', content: userMessage, type, timestamp: now,
  });
  await convRef.collection('messages').add({
    role: 'assistant', content: assistantMessageContent, type, tokensUsed, timestamp: now,
    ...(structuredData ? { structuredData } : {}),
  });

  return convRef.id;
}

// Server-side cost estimation
function estimateCostServer(messageLength: number, type: string): number {
  const inputTokens = Math.ceil(messageLength / 2);
  const multiplier = type === 'doc' ? 5 : 4;
  const estimatedRealTokens = inputTokens * multiplier;
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
    const { goal, outputType } = (await request.json()) as {
      goal: string;
      outputType: 'report' | 'presentation';
    };

    if (!goal?.trim()) {
      return NextResponse.json({ error: 'الهدف الدراسي مطلوب' }, { status: 400 });
    }
    if (!['report', 'presentation'].includes(outputType)) {
      return NextResponse.json({ error: 'نوع المخرج غير صحيح' }, { status: 400 });
    }

    const aiType = outputType === 'report' ? 'doc' : 'slides';

    // Check tokens before doing heavy operations
    // Get user email
    let userEmail = '';
    try {
      const userRecord = await adminAuth.getUser(uid);
      userEmail = userRecord.email || '';
    } catch { }

    const superAdmin = await isSuperAdmin(userEmail);
    const estimatedCost = estimateCostServer(goal.length, aiType);

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

    // 3. Step 1 — Gemini: Analyse goal → structured outline
    let outline: StructuredOutline;
    try {
      outline = await callGeminiAnalysis(goal);
    } catch (err: any) {
      console.error('Gemini analysis failed:', err);
      return NextResponse.json(
        { error: 'فشل تحليل الهدف. حاول مرة أخرى.' },
        { status: 500 }
      );
    }

    // 4. Step 2 — Kimi: Generate final content (fallback to Gemini outline)
    let finalContent: StructuredOutline | SlidesOutput;
    try {
      console.log('Calling Kimi generation for:', outputType, 'outline title:', outline.title);
      finalContent = await callKimiGeneration(outline, outputType);
      console.log('Kimi generation succeeded:', JSON.stringify(finalContent).substring(0, 200));
    } catch (err: any) {
      console.warn('Kimi generation failed, falling back to Gemini content:', err.message);
      // Fallback: use Gemini outline directly
      if (outputType === 'presentation') {
        finalContent = {
          title: outline.title,
          slides: outline.sections.map((s) => ({
            title: s.heading,
            points: s.content
              .split(/[.،؛]/)
              .map((p) => p.trim())
              .filter(Boolean)
              .slice(0, 5),
          })),
        } as SlidesOutput;
      } else {
        finalContent = outline;
      }
    }

    // Validate content before file generation
    if (outputType === 'presentation') {
      const slidesData = finalContent as SlidesOutput;
      if (!slidesData.slides || slidesData.slides.length === 0) {
        console.error('Invalid slides data - no slides:', JSON.stringify(finalContent).substring(0, 300));
        return NextResponse.json(
          { error: 'فشل إنشاء العرض التقديمي. حاول مرة أخرى بهدف مختلف.' },
          { status: 500 }
        );
      }
    } else {
      const docData = finalContent as StructuredOutline;
      if (!docData.sections || docData.sections.length === 0) {
        console.error('Invalid doc data - no sections:', JSON.stringify(finalContent).substring(0, 300));
        return NextResponse.json(
          { error: 'فشل إنشاء التقرير. حاول مرة أخرى بهدف مختلف.' },
          { status: 500 }
        );
      }
    }

    // 5. Generate file
    let fileUrl: string;
    try {
      if (outputType === 'presentation') {
        console.log('Generating PPTX file...');
        fileUrl = await generatePptx(finalContent as SlidesOutput);
      } else {
        console.log('Generating DOCX file...');
        fileUrl = await generateDocx(finalContent as StructuredOutline);
      }
      console.log('File generated successfully:', fileUrl.substring(0, 100));
    } catch (fileErr: any) {
      console.error('File generation failed:', fileErr.message, fileErr.stack);
      return NextResponse.json(
        { error: `فشل إنشاء الملف: ${fileErr.message}` },
        { status: 500 }
      );
    }

    // 6. Database Operations (Deduct Tokens and Store Conversation)
    if (!superAdmin) {
      await serverDeductTokens(uid, estimatedCost, `${aiType} Agent: ${goal.substring(0, 50)}`);
    }

    await storeAgentMessage(
      uid,
      userEmail,
      goal,
      `تم توليد ${outputType === 'report' ? 'تقرير' : 'عرض تقديمي'} بنجاح.\n[تحميل الملف](${fileUrl})`,
      aiType,
      estimatedCost,
      finalContent
    );

    return NextResponse.json({ fileUrl, title: (finalContent as any).title });
  } catch (error: any) {
    console.error('Agent error:', error?.message, error?.stack?.substring(0, 500));
    return NextResponse.json(
      { error: 'حدث خطأ أثناء المعالجة. حاول مرة أخرى.' },
      { status: 500 }
    );
  }
}
