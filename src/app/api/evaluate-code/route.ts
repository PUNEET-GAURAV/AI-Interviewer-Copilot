import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { question, code, language } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not set on the server.' },
        { status: 500 }
      );
    }

    const prompt = `You are an expert coding interview evaluator. A candidate was given a coding problem and submitted their solution. Analyze it thoroughly.

**Problem:**
${question}

**Candidate's Code (${language}):**
\`\`\`${language}
${code}
\`\`\`

Evaluate the solution and respond ONLY with valid JSON (no markdown, no code fences):
{
  "isCorrect": true or false,
  "score": 1-10 integer,
  "timeComplexity": "Big O notation, e.g. O(n), O(n log n)",
  "spaceComplexity": "Big O notation",
  "isOptimal": true or false,
  "errors": ["list of bugs or logical errors, empty array if none"],
  "feedback": "2-3 sentences of constructive feedback",
  "optimalApproach": "If not optimal, describe the best approach in 2-3 sentences. If already optimal, say Your solution uses the optimal approach!",
  "congratsMessage": "If isOptimal is true, write an enthusiastic congratulations message. Otherwise empty string.",
  "codeQuality": {
    "readability": 1-10,
    "efficiency": 1-10,
    "edgeCases": 1-10
  }
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000,
            responseMimeType: "application/json"
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      return NextResponse.json({ error: 'Failed to communicate with AI provider.', details: errorText }, { status: 502 });
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // Strip markdown code blocks if present
    text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

    try {
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch {
      // Fallback: extract JSON object
      try {
        const firstBracket = text.indexOf('{');
        const lastBracket = text.lastIndexOf('}');
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
          const jsonStr = text.substring(firstBracket, lastBracket + 1);
          return NextResponse.json(JSON.parse(jsonStr));
        }
      } catch (e) {
        console.error('Fallback parsing failed:', e);
      }

      console.error('Failed to parse AI output:', text.substring(0, 500));
      return NextResponse.json({ error: 'AI returned invalid format.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Code evaluation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
