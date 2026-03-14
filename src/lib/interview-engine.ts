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
  const technicalAvg = avg(scores.map(s => s.technicalDepth));
  const communicationAvg = avg(scores.map(s => s.clarity));
  const problemSolvingAvg = avg(scores.map(s => s.completeness));
  const architectureAvg = avg(scores.map(s => s.relevance));
  const overallScore = Math.round((technicalAvg + communicationAvg + problemSolvingAvg + architectureAvg) / 4);

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (technicalAvg >= 80) strengths.push('Strong technical knowledge and depth');
  else improvements.push('Deepen technical understanding of core concepts');

  if (communicationAvg >= 80) strengths.push('Clear and articulate communication');
  else improvements.push('Improve clarity and structure in explanations');

  if (problemSolvingAvg >= 80) strengths.push('Comprehensive problem-solving approach');
  else improvements.push('Provide more complete solutions with edge cases');

  if (architectureAvg >= 80) strengths.push('Good understanding of system architecture');
  else improvements.push('Enhance architecture and design pattern knowledge');

  if (strengths.length === 0) strengths.push('Shows willingness to attempt challenging questions');
  if (improvements.length === 0) improvements.push('Continue building on strong fundamentals');

  let recommendation = '';
  if (overallScore >= 85) recommendation = 'Strong Hire - Candidate demonstrates exceptional skills and is highly recommended for the role.';
  else if (overallScore >= 70) recommendation = 'Hire - Candidate shows solid competence and is suitable for the position.';
  else if (overallScore >= 55) recommendation = 'Lean Hire - Candidate has potential but may need mentoring in certain areas.';
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

  return baseSkills.map((skill, i) => ({
    skill,
    level: Math.min(100, Math.max(20, Math.round(
      avg(scores.map(s => s.overall)) + (Math.random() * 20 - 10) + (i * 3)
    ))),
  }));
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
