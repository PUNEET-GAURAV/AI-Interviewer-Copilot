import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { profile, round } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not set on the server.' },
        { status: 500 }
      );
    }

    const numQuestions = round === 'wrapup' ? 1 : 3;
    const difficultyMap: Record<string, string> = {
      intro: 'easy',
      technical: 'medium',
      advanced: 'hard',
      behavioral: 'medium',
      wrapup: 'easy'
    };
    const targetDifficulty = difficultyMap[round] || 'medium';

    const prompt = `You are a real, expert human interviewer (e.g., a Senior Engineering Manager or Director) conducting a realistic interview.
Generate exactly ${numQuestions} highly specific, logical, and conversational interview questions for a ${profile.role} candidate with ${profile.experience} experience.

Candidate Skills: ${profile.skills?.join(', ') || 'General IT'}
Target Interview Round: ${round}
Target Difficulty Level: ${targetDifficulty.toUpperCase()}
Company Style: ${profile.companyStyle || 'Enterprise'}
${profile.resumeText ? `\nCandidate's Extracted Resume & Certificates Text:\n"""\n${profile.resumeText}\n"""\n` : ''}

I have provided the candidate's Resume and/or Certificates as attached documents/images or extracted text in this request.
You MUST deep analyze their resume projects, past roles, and certificates. Focus heavily on generating role-specific questions targeting the exact claims, projects, and skills mentioned.

CRITICAL PROGRESSION RULES:
- If round="intro", ask introductory and foundational concept questions. 
- If round="technical", ask medium-depth implementation and problem-solving questions.
- If round="advanced", ask highly advanced, senior-level architectural, system design, or managerial/leadership scenarios depending on their reported "${profile.experience}".
- Scale the exact technical difficulty dynamically to strictly match their experience level and projects stated.

CRITICAL FORMATTING RULES:
1. Formulate questions exactly as a real human would speak them in a live conversation.
2. Use logical, scenario-based framing referencing their specific resume details if available.
3. DO NOT sound like a robotic exam.

Return the result as a JSON array ONLY, exactly matching this schema:
[
  {
    "question": "The actual spoken question text...",
    "category": "Broad category like 'System Design'",
    "difficulty": "${targetDifficulty}",
    "expectedTopics": ["topic1", "topic2"]
  }
]

Do not include markdown code blocks. Output raw valid JSON array only.`;

    const parts: any[] = [{ text: prompt }];

    const parseBase64DataURL = (dataUrl: string) => {
      const matches = dataUrl.match(/^data:([a-zA-Z0-9-+/.]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        return { mimeType: matches[1], data: matches[2] };
      }
      return null;
    };

    if (profile.resumeFile) {
      const parsed = parseBase64DataURL(profile.resumeFile);
      if (parsed) {
        parts.push({
          inlineData: { mimeType: parsed.mimeType, data: parsed.data }
        });
      }
    }

    if (profile.certificateFiles && Array.isArray(profile.certificateFiles)) {
      profile.certificateFiles.forEach((cert: string) => {
        const parsed = parseBase64DataURL(cert);
        if (parsed) {
          parts.push({
            inlineData: { mimeType: parsed.mimeType, data: parsed.data }
          });
        }
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
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
    try {
      require('fs').writeFileSync('gemini-debug.json', JSON.stringify(data, null, 2));
    } catch (e) { console.error(e); }
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    
    // Strip markdown code blocks if present
    text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    
    try {
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch {
      // Fallback: extract JSON array via regex
      try {
        const firstBracket = text.indexOf('[');
        const lastBracket = text.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
          const jsonStr = text.substring(firstBracket, lastBracket + 1);
          return NextResponse.json(JSON.parse(jsonStr));
        }
      } catch (e) {
        console.error('Fallback array parsing failed:', e);
      }
      
      console.error('Failed to parse Gemini output. Raw text was:', text.substring(0, 500));
      return NextResponse.json({ error: 'AI returned invalid format.' }, { status: 500 });
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
