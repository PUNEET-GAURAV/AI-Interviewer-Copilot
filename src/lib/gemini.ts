// Gemini AI Integration for Interview Question Generation & Evaluation
// This module provides AI-powered interview capabilities using mock data for demo mode
// and can be extended to use Google Gemini API with a real API key.

import {
  CandidateProfile,
  DifficultyLevel,
  InterviewRound,
  QuestionScore,
} from './interview-engine';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

// ============= QUESTION GENERATION =============

interface GeneratedQuestion {
  question: string;
  category: string;
  difficulty: DifficultyLevel;
  expectedTopics: string[];
}

const ROLE_QUESTIONS: Record<string, Record<InterviewRound, GeneratedQuestion[]>> = {
  'Backend Engineer': {
    intro: [
      { question: "Tell me about your background in backend development. What technologies have you worked with most extensively?", category: "Introduction", difficulty: "easy", expectedTopics: ["experience", "technologies", "projects"] },
      { question: "What motivated you to pursue backend engineering, and what aspects of it excite you the most?", category: "Introduction", difficulty: "easy", expectedTopics: ["motivation", "passion", "career goals"] },
    ],
    technical: [
      { question: "How would you design a scalable API service that handles one million requests per day? Walk me through your architecture decisions.", category: "System Design", difficulty: "medium", expectedTopics: ["load balancing", "caching", "database", "scaling"] },
      { question: "Explain the differences between SQL and NoSQL databases. When would you choose one over the other for a new microservice?", category: "Database Design", difficulty: "medium", expectedTopics: ["SQL vs NoSQL", "use cases", "consistency", "scalability"] },
      { question: "How do you approach API versioning, and what strategies do you use to maintain backward compatibility?", category: "API Design", difficulty: "medium", expectedTopics: ["versioning strategies", "backward compatibility", "deprecation"] },
    ],
    advanced: [
      { question: "Design a distributed caching system for a global e-commerce platform. How would you handle cache invalidation and consistency?", category: "Distributed Systems", difficulty: "hard", expectedTopics: ["distributed caching", "cache invalidation", "consistency models", "CDN"] },
      { question: "How would you implement rate limiting and circuit breaker patterns in a microservices architecture? Discuss trade-offs.", category: "Resilience Patterns", difficulty: "hard", expectedTopics: ["rate limiting", "circuit breaker", "fault tolerance", "resilience"] },
    ],
    behavioral: [
      { question: "Tell me about a time you had to debug a critical production issue under pressure. What was your approach?", category: "Problem Solving", difficulty: "medium", expectedTopics: ["debugging process", "communication", "root cause analysis"] },
      { question: "How do you handle disagreements with team members about technical decisions? Give a specific example.", category: "Leadership", difficulty: "medium", expectedTopics: ["conflict resolution", "collaboration", "communication"] },
    ],
    wrapup: [
      { question: "What's a technical challenge you're currently excited about solving, and how would you approach it?", category: "Growth Mindset", difficulty: "easy", expectedTopics: ["continuous learning", "passion", "problem-solving approach"] },
    ],
  },
  'Frontend Engineer': {
    intro: [
      { question: "Tell me about your experience with modern frontend frameworks. What's your preferred tech stack and why?", category: "Introduction", difficulty: "easy", expectedTopics: ["frameworks", "preferences", "experience"] },
      { question: "How do you stay updated with the rapidly evolving frontend ecosystem?", category: "Introduction", difficulty: "easy", expectedTopics: ["learning", "community", "growth"] },
    ],
    technical: [
      { question: "Explain the concept of virtual DOM and how React's reconciliation algorithm works. What are the performance implications?", category: "Framework Internals", difficulty: "medium", expectedTopics: ["virtual DOM", "reconciliation", "performance", "diffing"] },
      { question: "How would you implement responsive design for a complex dashboard application? Discuss your approach to mobile-first design.", category: "UI Architecture", difficulty: "medium", expectedTopics: ["responsive design", "mobile-first", "CSS strategies", "breakpoints"] },
      { question: "Describe your approach to state management in large-scale React applications. When would you use different solutions?", category: "State Management", difficulty: "medium", expectedTopics: ["state management", "Redux", "Context", "performance"] },
    ],
    advanced: [
      { question: "How would you optimize a web application to achieve a Lighthouse performance score of 95+? Discuss specific techniques.", category: "Performance", difficulty: "hard", expectedTopics: ["code splitting", "lazy loading", "caching", "Core Web Vitals"] },
      { question: "Design a component library that supports theming, accessibility, and server-side rendering. What are the key architectural decisions?", category: "Architecture", difficulty: "hard", expectedTopics: ["component architecture", "theming", "a11y", "SSR"] },
    ],
    behavioral: [
      { question: "Describe a situation where you had to balance user experience with technical constraints. How did you make the trade-off?", category: "Decision Making", difficulty: "medium", expectedTopics: ["trade-offs", "UX vs engineering", "communication"] },
      { question: "How do you approach code reviews? What do you look for, and how do you give constructive feedback?", category: "Collaboration", difficulty: "medium", expectedTopics: ["code review", "feedback", "best practices"] },
    ],
    wrapup: [
      { question: "What's a UI/UX pattern or technology you'd like to explore more, and why do you think it matters?", category: "Growth", difficulty: "easy", expectedTopics: ["curiosity", "trends", "innovation"] },
    ],
  },
  'Data Scientist': {
    intro: [
      { question: "Tell me about your background in data science. What domains have you worked in, and what tools do you use most?", category: "Introduction", difficulty: "easy", expectedTopics: ["experience", "tools", "domains"] },
      { question: "What's the most impactful data science project you've worked on? Walk me through it.", category: "Introduction", difficulty: "easy", expectedTopics: ["impact", "methodology", "results"] },
    ],
    technical: [
      { question: "Explain the bias-variance tradeoff. How do you diagnose and address overfitting in your models?", category: "ML Fundamentals", difficulty: "medium", expectedTopics: ["bias-variance", "overfitting", "regularization", "cross-validation"] },
      { question: "How would you design an A/B testing framework for a product with millions of users? Discuss statistical considerations.", category: "Experimentation", difficulty: "medium", expectedTopics: ["A/B testing", "statistical significance", "sample size", "metrics"] },
      { question: "Compare different approaches to handling imbalanced datasets. When would you use each technique?", category: "Data Engineering", difficulty: "medium", expectedTopics: ["SMOTE", "oversampling", "class weights", "evaluation metrics"] },
    ],
    advanced: [
      { question: "How would you build a real-time recommendation system that serves personalized content to millions of users?", category: "ML Systems", difficulty: "hard", expectedTopics: ["recommendation systems", "collaborative filtering", "real-time serving", "scalability"] },
      { question: "Discuss the challenges of deploying ML models to production. How do you handle model monitoring and drift detection?", category: "MLOps", difficulty: "hard", expectedTopics: ["MLOps", "model drift", "monitoring", "CI/CD for ML"] },
    ],
    behavioral: [
      { question: "Describe a time when your analysis contradicted stakeholder expectations. How did you communicate your findings?", category: "Communication", difficulty: "medium", expectedTopics: ["stakeholder management", "data storytelling", "conflict"] },
      { question: "How do you prioritize between multiple data science projects competing for resources?", category: "Prioritization", difficulty: "medium", expectedTopics: ["prioritization", "impact assessment", "resource management"] },
    ],
    wrapup: [
      { question: "What area of AI/ML are you most excited about for the next few years, and why?", category: "Vision", difficulty: "easy", expectedTopics: ["trends", "generative AI", "innovation"] },
    ],
  },
  'Product Manager': {
    intro: [
      { question: "Tell me about your product management experience. What types of products have you managed?", category: "Introduction", difficulty: "easy", expectedTopics: ["experience", "products", "methodologies"] },
      { question: "How do you define what makes a successful product? Give me an example from your work.", category: "Introduction", difficulty: "easy", expectedTopics: ["success metrics", "user value", "business impact"] },
    ],
    technical: [
      { question: "How do you prioritize features when you have limited engineering resources and multiple stakeholder requests?", category: "Prioritization", difficulty: "medium", expectedTopics: ["prioritization frameworks", "stakeholder management", "data-driven"] },
      { question: "Walk me through how you would define and measure success metrics for a new product launch.", category: "Analytics", difficulty: "medium", expectedTopics: ["KPIs", "metrics", "north star metric", "OKRs"] },
      { question: "How do you approach writing product requirements? What level of detail do you provide to engineering teams?", category: "Product Specs", difficulty: "medium", expectedTopics: ["PRDs", "user stories", "acceptance criteria", "collaboration"] },
    ],
    advanced: [
      { question: "You're tasked with turning around a product with declining user engagement. Walk me through your strategic approach.", category: "Product Strategy", difficulty: "hard", expectedTopics: ["user research", "data analysis", "strategy", "retention"] },
      { question: "How would you build a product roadmap that balances technical debt, new features, and competitive threats?", category: "Roadmapping", difficulty: "hard", expectedTopics: ["roadmapping", "trade-offs", "technical debt", "strategy"] },
    ],
    behavioral: [
      { question: "Tell me about a time you had to say 'no' to a senior stakeholder's feature request. How did you handle it?", category: "Stakeholder Management", difficulty: "medium", expectedTopics: ["pushback", "communication", "data-driven decisions"] },
      { question: "Describe a product decision that didn't go as planned. What did you learn from it?", category: "Learning", difficulty: "medium", expectedTopics: ["failure", "learning", "iteration"] },
    ],
    wrapup: [
      { question: "What product trend or technology do you think will have the biggest impact on the industry in the next 5 years?", category: "Vision", difficulty: "easy", expectedTopics: ["trends", "AI", "innovation", "vision"] },
    ],
  },
};

// Default questions for any unmatched role
const DEFAULT_QUESTIONS: Record<InterviewRound, GeneratedQuestion[]> = {
  intro: [
    { question: "Tell me about yourself and your professional background. What brings you to this role?", category: "Introduction", difficulty: "easy", expectedTopics: ["background", "motivation"] },
    { question: "What are the key skills you bring to this position?", category: "Introduction", difficulty: "easy", expectedTopics: ["skills", "strengths"] },
  ],
  technical: [
    { question: "Describe a complex project you have worked on. What were the technical challenges and how did you overcome them?", category: "Technical", difficulty: "medium", expectedTopics: ["project experience", "problem solving"] },
    { question: "How do you approach learning new technologies or frameworks?", category: "Technical", difficulty: "medium", expectedTopics: ["learning", "adaptability"] },
    { question: "What development methodologies have you used, and which do you prefer?", category: "Process", difficulty: "medium", expectedTopics: ["agile", "methodology", "process"] },
  ],
  advanced: [
    { question: "How would you architect a system that needs to be both scalable and maintainable long-term?", category: "Architecture", difficulty: "hard", expectedTopics: ["scalability", "maintainability", "design patterns"] },
    { question: "Discuss a time when you had to make a significant technical trade-off. What factors did you consider?", category: "Decision Making", difficulty: "hard", expectedTopics: ["trade-offs", "decision framework"] },
  ],
  behavioral: [
    { question: "Tell me about a challenging team situation and how you resolved it.", category: "Teamwork", difficulty: "medium", expectedTopics: ["conflict resolution", "collaboration"] },
    { question: "How do you handle tight deadlines while maintaining quality?", category: "Time Management", difficulty: "medium", expectedTopics: ["prioritization", "quality"] },
  ],
  wrapup: [
    { question: "Do you have any questions about the role or the company?", category: "Closing", difficulty: "easy", expectedTopics: ["curiosity", "engagement"] },
  ],
};

export function generateQuestion(
  profile: CandidateProfile,
  round: InterviewRound,
  questionIndex: number
): GeneratedQuestion {
  const roleKey = Object.keys(ROLE_QUESTIONS).find(key =>
    profile.role.toLowerCase().includes(key.toLowerCase()) ||
    key.toLowerCase().includes(profile.role.toLowerCase())
  );

  const questions = roleKey ? ROLE_QUESTIONS[roleKey][round] : DEFAULT_QUESTIONS[round];
  const idx = questionIndex % questions.length;
  return questions[idx];
}

// ============= RESPONSE EVALUATION =============

export async function evaluateResponse(
  question: string,
  answer: string,
  expectedTopics: string[],
  difficulty: DifficultyLevel
): Promise<QuestionScore> {
  // If Gemini API key is available, use it
  if (GEMINI_API_KEY) {
    try {
      return await evaluateWithGemini(question, answer, expectedTopics, difficulty);
    } catch (e) {
      console.warn('Gemini API failed, falling back to local evaluation:', e);
    }
  }

  // Local evaluation (smart heuristic-based)
  return evaluateLocally(question, answer, expectedTopics, difficulty);
}

async function evaluateWithGemini(
  question: string,
  answer: string,
  expectedTopics: string[],
  difficulty: DifficultyLevel
): Promise<QuestionScore> {
  const prompt = `You are an expert technical interviewer evaluating a candidate's response.

Question: "${question}"
Expected Topics: ${expectedTopics.join(', ')}
Difficulty Level: ${difficulty}

Candidate's Answer: "${answer}"

Evaluate the response and provide scores (0-100) in JSON format:
{
  "technicalDepth": <score>,
  "relevance": <score>,
  "clarity": <score>,
  "completeness": <score>,
  "overall": <score>,
  "feedback": "<2-3 sentences of constructive feedback>"
}

Be fair but rigorous. Consider the difficulty level when scoring.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
      }),
    }
  );

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      questionId: crypto.randomUUID(),
      question,
      answer,
      technicalDepth: clamp(parsed.technicalDepth),
      relevance: clamp(parsed.relevance),
      clarity: clamp(parsed.clarity),
      completeness: clamp(parsed.completeness),
      overall: clamp(parsed.overall),
      feedback: parsed.feedback || 'Good attempt. Keep working on depth and clarity.',
    };
  }

  throw new Error('Failed to parse Gemini response');
}

function evaluateLocally(
  question: string,
  answer: string,
  expectedTopics: string[],
  difficulty: DifficultyLevel
): QuestionScore {
  const words = answer.trim().split(/\s+/).length;
  const answerLower = answer.toLowerCase();

  // Topic coverage analysis
  const topicsCovered = expectedTopics.filter(topic =>
    answerLower.includes(topic.toLowerCase())
  ).length;
  const topicCoverage = expectedTopics.length > 0 ? topicsCovered / expectedTopics.length : 0.5;

  // Length analysis (penalize very short or empty answers)
  let lengthScore: number;
  if (words < 5) lengthScore = 15;
  else if (words < 20) lengthScore = 40;
  else if (words < 50) lengthScore = 60;
  else if (words < 100) lengthScore = 75;
  else if (words < 200) lengthScore = 85;
  else lengthScore = 90;

  // Complexity indicators
  const hasExamples = /for example|for instance|such as|like when/i.test(answer);
  const hasStructure = /first|second|third|additionally|moreover|furthermore/i.test(answer);
  const hasTechnicalTerms = /api|database|cache|server|deploy|architecture|algorithm|component|module|framework|pattern|scale/i.test(answer);
  const hasTradeoffs = /trade-?off|however|on the other hand|disadvantage|pros and cons|balance/i.test(answer);

  const bonusPoints = (hasExamples ? 8 : 0) + (hasStructure ? 6 : 0) +
    (hasTechnicalTerms ? 7 : 0) + (hasTradeoffs ? 5 : 0);

  // Difficulty modifier
  const diffMod = difficulty === 'hard' ? 0.85 : difficulty === 'medium' ? 0.92 : 1;

  // Calculate scores
  const technicalDepth = clamp(Math.round((lengthScore * 0.4 + topicCoverage * 60 + bonusPoints) * diffMod));
  const relevance = clamp(Math.round(topicCoverage * 70 + lengthScore * 0.3 + (hasTechnicalTerms ? 10 : 0)));
  const clarity = clamp(Math.round(lengthScore * 0.5 + (hasStructure ? 20 : 5) + (hasExamples ? 15 : 5)));
  const completeness = clamp(Math.round(topicCoverage * 50 + lengthScore * 0.3 + bonusPoints * 0.8));
  const overall = clamp(Math.round((technicalDepth + relevance + clarity + completeness) / 4));

  // Generate feedback
  const feedbackParts: string[] = [];
  if (words < 20) feedbackParts.push('The response is too brief. Provide more detail and specific examples.');
  else if (topicCoverage < 0.3) feedbackParts.push('Consider addressing more of the key concepts related to the question.');
  else if (topicCoverage >= 0.6) feedbackParts.push('Good coverage of relevant topics.');

  if (!hasExamples) feedbackParts.push('Including specific examples would strengthen your answer.');
  if (!hasStructure && words > 30) feedbackParts.push('Structuring your response with clear points would improve clarity.');
  if (hasTradeoffs) feedbackParts.push('Good job discussing trade-offs in your approach.');
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

// ============= GENERATE FULL INTERVIEW QUESTIONS (for Gemini API) =============

export async function generateQuestionsWithAI(
  profile: CandidateProfile,
  round: InterviewRound
): Promise<GeneratedQuestion[]> {
  if (!GEMINI_API_KEY) return [];

  const prompt = `Generate ${round === 'intro' ? 2 : round === 'wrapup' ? 1 : 3} interview questions for a ${profile.role} candidate with ${profile.experience} experience.

Skills: ${profile.skills.join(', ')}
Interview Round: ${round}
Company Style: ${profile.companyStyle}

Return JSON array: [{"question": "...", "category": "...", "difficulty": "${round === 'advanced' ? 'hard' : round === 'intro' || round === 'wrapup' ? 'easy' : 'medium'}", "expectedTopics": ["topic1", "topic2"]}]`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.warn('Failed to generate questions with Gemini:', e);
  }

  return [];
}
