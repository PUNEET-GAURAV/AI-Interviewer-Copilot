import {
  CandidateProfile,
  DifficultyLevel,
  InterviewRound,
  QuestionScore,
} from './interview-engine';

export interface GeneratedQuestion {
  question: string;
  category: string;
  difficulty: DifficultyLevel;
  expectedTopics: string[];
}

// Keep default fallback questions in case of API failure or missing keys
const DEFAULT_QUESTIONS: Record<InterviewRound, GeneratedQuestion[]> = {
  intro: [
    { question: "Tell me about yourself and your background. What brings you to this role?", category: "Introduction", difficulty: "easy", expectedTopics: ["background", "motivation"] },
    { question: "What are your key strengths relevant to this position?", category: "Introduction", difficulty: "easy", expectedTopics: ["skills", "strengths"] },
  ],
  technical: [
    { question: "Describe a complex technical project you worked on recently. What challenges did you face?", category: "Technical", difficulty: "medium", expectedTopics: ["project experience", "problem solving"] },
    { question: "How do you approach learning a completely new technology stack?", category: "Technical", difficulty: "medium", expectedTopics: ["learning", "adaptability"] },
    { question: "Can you explain a time you had to optimize something for better performance?", category: "Process", difficulty: "medium", expectedTopics: ["optimization", "performance"] },
  ],
  advanced: [
    { question: "How would you design a system that needs to scale to millions of users while maintaining high availability?", category: "Architecture", difficulty: "hard", expectedTopics: ["scalability", "maintainability", "design patterns"] },
    { question: "Discuss a significant technical trade-off you made in the past. If you could go back, would you change your decision?", category: "Decision Making", difficulty: "hard", expectedTopics: ["trade-offs", "decision framework"] },
  ],
  behavioral: [
    { question: "Tell me about a time you had a disagreement with a team member about a technical approach. How did you resolve it?", category: "Teamwork", difficulty: "medium", expectedTopics: ["conflict resolution", "collaboration"] },
    { question: "Describe a situation where you had to meet a tight deadline without compromising quality.", category: "Time Management", difficulty: "medium", expectedTopics: ["prioritization", "quality"] },
  ],
  wrapup: [
    { question: "Is there anything else you would like to share that we haven't covered?", category: "Closing", difficulty: "easy", expectedTopics: ["summary"] },
  ],
};

// State to cache AI-generated questions so we don't spam the API
const questionCache: Record<string, GeneratedQuestion[]> = {};

/**
 * Generates questions dynamically using the Gemini API.
 * Uses a caching mechanism to avoid re-generating for the same round.
 */
export async function generateQuestion(
  profile: CandidateProfile,
  round: InterviewRound,
  questionIndex: number
): Promise<GeneratedQuestion> {
  const cacheKey = `${profile.role}-${profile.experience}-${round}`;
  
  // Try to generate via API if not cached
  if (!questionCache[cacheKey]) {
    try {
      console.log(`Generating AI questions for round: ${round}`);
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, round }),
      });
      
      if (response.ok) {
        const generated = await response.json();
        if (Array.isArray(generated) && generated.length > 0) {
          questionCache[cacheKey] = generated;
        }
      }
    } catch (error) {
      console.error('Failed to generate AI questions, using fallback.', error);
    }
  }

  // Use cached AI questions, or fallback to defaults
  const questions = questionCache[cacheKey] || DEFAULT_QUESTIONS[round];
  
  // Return the specific question index (wrapping around if needed)
  const idx = questionIndex % questions.length;
  return questions[idx];
}

/**
 * Evaluates a candidate's response using the Gemini API.
 * Falls back to local heuristic evaluation if the API fails.
 */
export async function evaluateResponse(
  question: string,
  answer: string,
  expectedTopics: string[],
  difficulty: DifficultyLevel
): Promise<QuestionScore> {
  console.log(`Evaluating answer to: "${question.substring(0, 30)}..."`);
  
  try {
    const response = await fetch('/api/evaluate-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, answer, expectedTopics, difficulty }),
    });

    if (response.ok) {
      const parsed = await response.json();
      return {
        questionId: crypto.randomUUID(),
        question,
        answer,
        technicalDepth: clamp(parsed.technicalDepth),
        relevance: clamp(parsed.relevance),
        clarity: clamp(parsed.clarity),
        completeness: clamp(parsed.completeness),
        overall: clamp(parsed.overall),
        feedback: parsed.feedback || 'Good attempt, but try to elaborate more with specific examples.',
      };
    } else {
      console.warn('AI evaluation API failed, falling back to local grading.');
    }
  } catch (error) {
    console.error('Network error during AI evaluation, falling back to local grading.', error);
  }

  // Fallback heuristic grading
  return evaluateLocally(question, answer, expectedTopics, difficulty);
}

// ==== Local Heuristic Fallback (Used only if API key is missing or fails) ====

function evaluateLocally(
  question: string,
  answer: string,
  expectedTopics: string[],
  difficulty: DifficultyLevel
): QuestionScore {
  const words = answer.trim().split(/\s+/).length;
  const answerLower = answer.toLowerCase();

  const topicsCovered = expectedTopics.filter(topic =>
    answerLower.includes(topic.toLowerCase())
  ).length;
  const topicCoverage = expectedTopics.length > 0 ? topicsCovered / expectedTopics.length : 0.5;

  let lengthScore: number;
  if (words < 5) lengthScore = 15;
  else if (words < 20) lengthScore = 40;
  else if (words < 50) lengthScore = 60;
  else if (words < 100) lengthScore = 75;
  else if (words < 200) lengthScore = 85;
  else lengthScore = 90;

  const hasExamples = /for example|for instance|such as|like when/i.test(answer);
  const hasStructure = /first|second|third|additionally|moreover|furthermore/i.test(answer);
  const hasTechnicalTerms = /api|database|cache|server|deploy|architecture|algorithm|component|module|framework|pattern|scale/i.test(answer);
  const hasTradeoffs = /trade-?off|however|on the other hand|disadvantage|pros and cons|balance/i.test(answer);

  const bonusPoints = (hasExamples ? 8 : 0) + (hasStructure ? 6 : 0) +
    (hasTechnicalTerms ? 7 : 0) + (hasTradeoffs ? 5 : 0);

  const diffMod = difficulty === 'hard' ? 0.85 : difficulty === 'medium' ? 0.92 : 1;

  const technicalDepth = clamp(Math.round((lengthScore * 0.4 + topicCoverage * 60 + bonusPoints) * diffMod));
  const relevance = clamp(Math.round(topicCoverage * 70 + lengthScore * 0.3 + (hasTechnicalTerms ? 10 : 0)));
  const clarity = clamp(Math.round(lengthScore * 0.5 + (hasStructure ? 20 : 5) + (hasExamples ? 15 : 5)));
  const completeness = clamp(Math.round(topicCoverage * 50 + lengthScore * 0.3 + bonusPoints * 0.8));
  const overall = clamp(Math.round((technicalDepth + relevance + clarity + completeness) / 4));

  const feedbackParts: string[] = [];
  if (words < 20) feedbackParts.push('The response is too brief. Provide more detail and specific examples.');
  else if (topicCoverage < 0.3) feedbackParts.push('Consider addressing more of the key concepts related to the question.');
  else if (topicCoverage >= 0.6) feedbackParts.push('Good coverage of relevant topics.');

  if (!hasExamples) feedbackParts.push('Including specific examples would strengthen your answer.');
  if (!hasStructure && words > 30) feedbackParts.push('Structuring your response with clear points would improve clarity.');
  if (overall >= 75) feedbackParts.push('Strong response demonstrating solid understanding.');

  return {
    questionId: crypto.randomUUID(),
    question,
    answer,
    technicalDepth,
    relevance,
    clarity,
    completeness,
    overall,
    feedback: feedbackParts.join(' ') || 'Decent attempt. Try to provide more specific examples and cover the key concepts.',
  };
}

function clamp(val: number): number {
  return Math.max(0, Math.min(100, val));
}
