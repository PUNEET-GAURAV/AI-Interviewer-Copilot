import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { question, answer, expectedTopics, difficulty } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not set on the server.' },
        { status: 500 }
      );
    }

    const expectedTopicsList = Array.isArray(expectedTopics) ? expectedTopics.join(', ') : expectedTopics;

    const prompt = `You are a highly experienced, strict human interviewer (e.g., Senior Tech Lead or Hiring Manager) directly evaluating a candidate's response in a live interview.

Question Asked: "${question}"
Expected Topics to cover: ${expectedTopicsList}
Difficulty Level: ${difficulty}

Candidate's Answer: "${answer}"

CRITICAL RULES FOR EVALUATION:
1. Act EXACTLY like a real human interviewer. Be rigorous, logical, and strict.
2. If the candidate's answer is generic, overly brief, or misses the core logic, penalize them heavily in the scores. Do not be overly nice.
3. The "feedback" string MUST be written in the first person, as if you are speaking directly to them (e.g., "I liked your point about X, but you completely missed Y, which is a major red flag for this role." or "Your logic breaks down when scenario Z happens.").
4. Point out exact logical flaws, correct them, or praise specific deep insights if they earned it.

Provide scores (0-100) in JSON format ONLY:
{
  "technicalDepth": <score>,
  "relevance": <score>,
  "clarity": <score>,
  "completeness": <score>,
  "overall": <score>,
  "feedback": "<2-4 sentences of conversational, highly specific, first-person feedback>"
}

Output valid JSON only, no markdown formatting blocks.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
      return NextResponse.json({ error: 'Failed to communicate with AI provider.' }, { status: 502 });
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Strip markdown code blocks if present
    text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    
    try {
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch {
      // Fallback: extract JSON object via string indices
      try {
        const firstBracket = text.indexOf('{');
        const lastBracket = text.lastIndexOf('}');
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
          const jsonStr = text.substring(firstBracket, lastBracket + 1);
          return NextResponse.json(JSON.parse(jsonStr));
        }
      } catch (e) {
        console.error('Fallback object parsing failed:', e);
      }
      
      console.error('Failed to parse Gemini eval output. Raw text was:', text.substring(0, 500));
      return NextResponse.json({ error: 'AI returned invalid format.' }, { status: 500 });
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
