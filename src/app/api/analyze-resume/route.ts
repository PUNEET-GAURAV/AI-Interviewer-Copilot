import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { resumeText } = await req.json();

    if (!resumeText) {
      return NextResponse.json({ error: 'Resume text is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not set on the server.' }, { status: 500 });
    }

    const prompt = `Analyze the following resume and certificate text. Extract the candidate's name, their primary professional role, a short summary of their experience level, and a list of key skills.

Return ONLY valid JSON (no markdown, no code fences) in this format:
{
  "name": "Candidate's full name or 'Candidate' if not found",
  "role": "Primary job role or title",
  "experience": "Short summary like '3 years' or 'Entry level' or 'Senior'",
  "skills": ["skill1", "skill2", "...up to 15 key skills"]
}

RESUME AND CERTIFICATE TEXT:
${resumeText}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2000,
            responseMimeType: 'application/json',
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
      const parsedData = JSON.parse(text);
      return NextResponse.json({
        name: parsedData.name || 'Candidate',
        role: parsedData.role || 'Software Engineer',
        experience: parsedData.experience || 'Not specified',
        skills: parsedData.skills || ['General IT'],
      });
    } catch {
      // Fallback: extract JSON object
      try {
        const firstBracket = text.indexOf('{');
        const lastBracket = text.lastIndexOf('}');
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
          const jsonStr = text.substring(firstBracket, lastBracket + 1);
          const parsedData = JSON.parse(jsonStr);
          return NextResponse.json({
            name: parsedData.name || 'Candidate',
            role: parsedData.role || 'Software Engineer',
            experience: parsedData.experience || 'Not specified',
            skills: parsedData.skills || ['General IT'],
          });
        }
      } catch (e) {
        console.error('Fallback parsing failed:', e);
      }

      console.error('Failed to parse AI output:', text.substring(0, 500));
      return NextResponse.json({ error: 'AI returned invalid format.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error analyzing resume:', error);
    return NextResponse.json({ error: error.message || 'Failed to analyze resume' }, { status: 500 });
  }
}
