import { GoogleGenAI, Type, Schema } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { resumeText } = await req.json();

    if (!resumeText) {
      return NextResponse.json({ error: 'Resume text is required' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: "The candidate's full name. If not found, use 'Candidate'",
        },
        role: {
          type: Type.STRING,
          description: "The primary job role or title the candidate is applying for or has most experience in (e.g. 'Frontend Developer', 'Data Scientist')",
        },
        experience: {
          type: Type.STRING,
          description: "A short summary of their experience level (e.g. '3 years', 'Entry level', 'Senior')",
        },
        skills: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
          description: "A list of up to 15 key technical and soft skills extracted from the resume and certificates",
        },
      },
      required: ["name", "role", "experience", "skills"],
    };

    const prompt = `
      Analyze the following resume and certificate text. Extract the candidate's name, their primary professional role, a short summary of their experience level, and a list of key skills.
      Return the output as matching the structured JSON format.
      
      RESUME AND CERTIFICATE TEXT:
      ${resumeText}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const resultText = response.text || '{}';
    const parsedData = JSON.parse(resultText);

    return NextResponse.json({
      name: parsedData.name || 'Candidate',
      role: parsedData.role || 'Software Engineer',
      experience: parsedData.experience || 'Not specified',
      skills: parsedData.skills || ['General IT'],
    });

  } catch (error: any) {
    console.error('Error analyzing resume:', error);
    return NextResponse.json({ error: error.message || 'Failed to analyze resume' }, { status: 500 });
  }
}
