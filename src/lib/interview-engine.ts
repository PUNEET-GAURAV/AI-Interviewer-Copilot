// Interview Engine - manages interview state and flow
export type InterviewRound = 'intro' | 'technical' | 'advanced' | 'behavioral' | 'wrapup';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface Message {
  id: string;
  role: 'ai' | 'user' | 'system';
  content: string;
  timestamp: Date;
  category?: string;
  difficulty?: DifficultyLevel;
}

export interface InterviewState {
  round: InterviewRound;
  questionIndex: number;
  totalQuestions: number;
  difficulty: DifficultyLevel;
  messages: Message[];
  scores: QuestionScore[];
  isComplete: boolean;
  startTime: Date;
}

export interface QuestionScore {
  questionId: string;
  question: string;
  answer: string;
  technicalDepth: number;
  relevance: number;
  clarity: number;
  completeness: number;
  overall: number;
  feedback: string;
}

export interface CandidateProfile {
  name: string;
  role: string;
  experience: string;
  skills: string[];
  companyStyle: string;
  resumeText: string;
  resumeFile?: string;
  certificateFiles?: string[];
}

export interface InterviewResult {
  candidateProfile: CandidateProfile;
  scores: QuestionScore[];
  overallScore: number;
  technicalAvg: number;
  communicationAvg: number;
  problemSolvingAvg: number;
  architectureAvg: number;
  strengths: string[];
  improvements: string[];
  recommendation: string;
  skillMap: { skill: string; level: number }[];
  completedAt: Date;
}

const ROUND_CONFIG: Record<InterviewRound, { label: string; questionCount: number }> = {
  intro: { label: 'Introduction', questionCount: 2 },
  technical: { label: 'Technical', questionCount: 3 },
  advanced: { label: 'Advanced Technical', questionCount: 2 },
  behavioral: { label: 'Behavioral', questionCount: 2 },
  wrapup: { label: 'Wrap-up', questionCount: 1 },
};

const ROUND_ORDER: InterviewRound[] = ['intro', 'technical', 'advanced', 'behavioral', 'wrapup'];

export function getNextRound(current: InterviewRound): InterviewRound | null {
  const idx = ROUND_ORDER.indexOf(current);
  if (idx < ROUND_ORDER.length - 1) return ROUND_ORDER[idx + 1];
  return null;
}

export function getRoundConfig(round: InterviewRound) {
  return ROUND_CONFIG[round];
}

export function getTotalQuestions(): number {
  return Object.values(ROUND_CONFIG).reduce((sum, r) => sum + r.questionCount, 0);
}

export function calculateOverallResult(
  profile: CandidateProfile,
  scores: QuestionScore[]
): InterviewResult {
  // Normalize legacy 100-scale scores down to 10-scale just in case
  const norm = (v: number) => v > 10 ? v / 10 : v;
  
  const technicalAvg = avg(scores.map(s => norm(s.technicalDepth)));
  const communicationAvg = avg(scores.map(s => norm(s.clarity)));
  const problemSolvingAvg = avg(scores.map(s => norm(s.completeness)));
  const architectureAvg = avg(scores.map(s => norm(s.relevance)));
  const overallScore = Math.round((technicalAvg + communicationAvg + problemSolvingAvg + architectureAvg) / 4);

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (technicalAvg >= 8) strengths.push('Strong technical knowledge and depth');
  else improvements.push('Deepen technical understanding of core concepts');

  if (communicationAvg >= 8) strengths.push('Clear and articulate communication');
  else improvements.push('Improve clarity and structure in explanations');

  if (problemSolvingAvg >= 8) strengths.push('Comprehensive problem-solving approach');
  else improvements.push('Provide more complete solutions with edge cases');

  if (architectureAvg >= 8) strengths.push('Good understanding of system architecture');
  else improvements.push('Enhance architecture and design pattern knowledge');

  if (strengths.length === 0) strengths.push('Shows willingness to attempt challenging questions');
  if (improvements.length === 0) improvements.push('Continue building on strong fundamentals');

  let recommendation = '';
  if (overallScore >= 8.5) recommendation = 'Strong Hire - Candidate demonstrates exceptional skills and is highly recommended for the role.';
  else if (overallScore >= 7) recommendation = 'Hire - Candidate shows solid competence and is suitable for the position.';
  else if (overallScore >= 5.5) recommendation = 'Lean Hire - Candidate has potential but may need mentoring in certain areas.';
  else recommendation = 'No Hire - Candidate needs significant improvement in key areas before reconsidering.';

  const skillMap = extractSkillMap(profile, scores);

  return {
    candidateProfile: profile,
    scores,
    overallScore,
    technicalAvg: Math.round(technicalAvg),
    communicationAvg: Math.round(communicationAvg),
    problemSolvingAvg: Math.round(problemSolvingAvg),
    architectureAvg: Math.round(architectureAvg),
    strengths,
    improvements,
    recommendation,
    skillMap,
    completedAt: new Date(),
  };
}

function extractSkillMap(profile: CandidateProfile, scores: QuestionScore[]) {
  const baseSkills = profile.skills.length > 0 ? profile.skills.slice(0, 6) : [
    'Problem Solving', 'System Design', 'Communication', 'Technical Depth', 'Code Quality', 'Adaptability'
  ];

  return baseSkills.map((skill) => {
    const sLower = skill.toLowerCase();
    
    // Look for skill mentions directly in the Q&A text
    const relevantScores = scores.filter(s => 
      (s.question && s.question.toLowerCase().includes(sLower)) || 
      (s.answer && s.answer.toLowerCase().includes(sLower)) ||
      (s.feedback && s.feedback.toLowerCase().includes(sLower))
    );

    const norm = (v: number) => v > 10 ? v / 10 : v;

    let level = 0;
    if (relevantScores.length > 0) {
      level = Math.round(avg(relevantScores.map(s => norm(s.overall))));
    } else {
      // Map intrinsic default attributes to exact metrics given by the AI evaluator
      if (sLower === 'communication') level = Math.round(avg(scores.map(s => norm(s.clarity))));
      else if (sLower === 'technical depth' || sLower === 'code quality') level = Math.round(avg(scores.map(s => norm(s.technicalDepth))));
      else if (sLower === 'problem solving') level = Math.round(avg(scores.map(s => norm(s.completeness))));
      else if (sLower === 'system design' || sLower === 'architecture') level = Math.round(avg(scores.map(s => norm(s.relevance))));
      else if (sLower === 'adaptability') level = Math.round(avg(scores.map(s => norm((s.clarity + s.relevance) / 2))));
      else {
        // Safe fallback for custom resume skills not explicitly mentioned
        level = Math.round(avg(scores.map(s => norm(s.overall)))); 
      }
    }
    
    // Bound the values between 0 and 10
    level = Math.min(10, Math.max(0, level)) || 0;

    return { skill, level };
  });
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
