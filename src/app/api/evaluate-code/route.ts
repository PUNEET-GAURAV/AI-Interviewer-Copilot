import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(req: NextRequest) {
  try {
    const { question, code, language } = await req.json();

    const prompt = `You are an expert coding interview evaluator. A candidate was given a coding problem and submitted their solution. Analyze it thoroughly.

**Problem:**
${question}

**Candidate's Code (${language}):**
\`\`\`${language}
${code}
\`\`\`

Evaluate the solution and respond ONLY with valid JSON (no markdown, no code fences):
{
  "isCorrect": true/false,
  "score": <1-10 integer>,
  "timeComplexity": "<Big O notation, e.g. O(n), O(n log n)>",
  "spaceComplexity": "<Big O notation>",
  "isOptimal": true/false,
  "errors": ["<list of bugs or logical errors, empty if none>"],
  "feedback": "<2-3 sentences of constructive feedback>",
  "optimalApproach": "<If not optimal, describe the best approach in 2-3 sentences. If already optimal, say 'Your solution uses the optimal approach!'>",
  "congratsMessage": "<If isOptimal is true, write an enthusiastic congratulations message. Otherwise empty string.>",
  "codeQuality": {
    "readability": <1-10>,
    "efficiency": <1-10>,
    "edgeCases": <1-10>
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleaned);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Code evaluation error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate code', details: error.message },
      { status: 500 }
    );
  }
}
