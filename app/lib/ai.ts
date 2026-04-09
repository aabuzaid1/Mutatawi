/**
 * AI Helper — Gemini (analysis) + Kimi (content generation)
 * Used by the /api/agent route for the AI Study Agent feature.
 */

// ── Types ──────────────────────────────────────
export interface StructuredOutline {
  title: string;
  sections: Array<{ heading: string; content: string }>;
}

export interface SlidesOutput {
  title: string;
  slides: Array<{ title: string; points: string[] }>;
}

// ── Gemini: Analyse goal → structured outline ──
export async function callGeminiAnalysis(goal: string): Promise<StructuredOutline> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const systemPrompt = `You are an educational assistant. Analyze the student's goal and produce a structured outline.
IMPORTANT: Generate the outline and explanations IN THE EXACT LANGUAGE requested by the user. If the user asks for English, or asks in Arabic to write an English document, you MUST write everything in English. Otherwise, default to Arabic.
Return JSON only.
IMPORTANT: Return ONLY valid JSON with this exact schema:
{ "title": "string", "sections": [{ "heading": "string", "content": "string" }] }
Do NOT include markdown code fences. Do NOT add any text before or after the JSON.
Generate at least 4 sections with detailed content (minimum 3 sentences per section).`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: goal }] }],
    systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 4000,
      responseMimeType: 'application/json',
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Gemini error:', res.status, err);
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return parseJSON<StructuredOutline>(raw);
}

// ── Kimi: Generate final content ───────────────
export async function callKimiGeneration(
  outline: StructuredOutline,
  outputType: 'report' | 'presentation'
): Promise<StructuredOutline | SlidesOutput> {
  const apiKey = process.env.KIMI_API_KEY;
  const baseUrl = process.env.KIMI_API_BASE_URL || 'https://api.moonshot.ai/v1';
  const model = process.env.KIMI_MODEL || 'moonshot-v1-8k';

  if (!apiKey) throw new Error('KIMI_API_KEY not configured');

  const systemPrompt =
    outputType === 'presentation'
      ? `You are a presentation content generator. Given a structured outline, transform it into a slide deck.
IMPORTANT: GENERATE ALL CONTENT IN THE SAME LANGUAGE AS THE OUTLINE (e.g. if the outline is English, generate English slides).
Return ONLY valid JSON with this exact schema:
{ "title": "string", "slides": [{ "title": "string", "points": ["string"] }] }
Each slide should have 3-5 concise bullet points. Generate at most 8 slides.
Do NOT include markdown code fences. Do NOT respond in Chinese.`
      : `You are a report content generator. Given a structured outline, expand each section into detailed, well-written paragraphs for a formal academic document.
IMPORTANT: GENERATE ALL CONTENT IN THE SAME LANGUAGE AS THE OUTLINE (e.g. if the outline is English, generate English paragraphs).
Return ONLY valid JSON with this exact schema:
{ "title": "string", "sections": [{ "heading": "string", "content": "string" }] }
Each section should have at least 4-5 detailed sentences. Do NOT use actual newlines inside JSON strings; use \\n instead.
Do NOT include markdown code fences. Do NOT respond in Chinese.`;

  const userMessage = `Here is the outline to expand:\n${JSON.stringify(outline, null, 2)}`;

  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    max_tokens: 4000,
    temperature: 0.5,
    response_format: { type: 'json_object' as const },
  };

  // Try primary and fallback URLs
  const urls = [baseUrl];
  if (baseUrl.includes('.ai')) urls.push('https://api.moonshot.cn/v1');
  else urls.push('https://api.moonshot.ai/v1');

  let lastError = '';
  for (const url of urls) {
    try {
      const res = await fetch(`${url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        lastError = await res.text();
        continue;
      }

      if (!res.ok) {
        const err = await res.text();
        console.error('Kimi error:', res.status, err);
        throw new Error(`Kimi API error: ${res.status}`);
      }

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || '';
      return parseJSON(raw);
    } catch (e: any) {
      if (e.message?.includes('Kimi API error')) throw e;
      lastError = e.message;
    }
  }

  throw new Error(`Kimi API failed: ${lastError}`);
}

// ── JSON parser with recovery ──────────────────
function parseJSON<T>(raw: string): T {
  let str = raw.trim();

  // Strip markdown fences
  const fenced = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) str = fenced[1].trim();

  // Extract first JSON object
  const first = str.indexOf('{');
  const last = str.lastIndexOf('}');
  if (first !== -1 && last > first) str = str.substring(first, last + 1);

  // Fix unescaped newlines inside strings
  str = fixNewlines(str);

  return JSON.parse(str) as T;
}

function fixNewlines(s: string): string {
  let out = '';
  let inStr = false;
  let esc = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"' && !esc) { inStr = !inStr; out += c; }
    else if (c === '\\') { esc = !esc; out += c; }
    else if (inStr && (c === '\n' || c === '\r')) {
      out += c === '\n' ? '\\n' : '\\r';
      esc = false;
    } else { out += c; esc = false; }
  }
  return out;
}
