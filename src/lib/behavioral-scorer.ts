/**
 * Behavioral Scoring Engine — Composite scoring from all AI signals
 * Combines: Video analysis + Speech analysis + Answer quality + Resume fit
 */

import { SessionMetrics } from './face-analyzer';
import { SpeechMetrics } from './speech-analyzer';

export interface AnswerScores {
  technical: number;
  clarity: number;
  confidence: number;
  avgScore: number;
}

export interface BehavioralReport {
  // Individual dimension scores (0-100)
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  behaviorScore: number;
  resumeFitScore: number;

  // Overall
  overallScore: number;
  recommendation: 'Strong Hire' | 'Hire' | 'Maybe' | 'Reject';
  recommendationColor: string;

  // Detailed breakdown
  strengths: string[];
  weaknesses: string[];
  improvements: string[];

  // Raw components
  videoMetrics: SessionMetrics | null;
  speechMetrics: SpeechMetrics | null;
}

/**
 * Calculate the final behavioral report from all signals
 */
export function calculateBehavioralReport(
  videoMetrics: SessionMetrics | null,
  speechMetrics: SpeechMetrics | null,
  answerScores: AnswerScores | null,
  resumeFitPercent: number = 75,
): BehavioralReport {
  // Technical Score (35% weight) — from answer evaluations
  const technicalScore = answerScores
    ? Math.round(answerScores.avgScore)
    : 65; // default

  // Communication Score (20% weight) — from speech analysis
  const communicationScore = speechMetrics
    ? Math.round(speechMetrics.communicationScore)
    : 60;

  // Confidence Score (15% weight) — from video + speech
  const videoConfidence = videoMetrics?.avgConfidence ?? 60;
  const speechFluency = speechMetrics?.fluencyScore ?? 60;
  const confidenceScore = Math.round(videoConfidence * 0.6 + speechFluency * 0.4);

  // Behavior Score (15% weight) — from video analysis
  const behaviorScore = videoMetrics
    ? Math.round(
        videoMetrics.avgEngagement * 0.3 +
        videoMetrics.avgProfessionalism * 0.3 +
        videoMetrics.avgEyeContact * 0.25 +
        (100 - videoMetrics.avgStress) * 0.15
      )
    : 60;

  // Resume Fit Score (15% weight)
  const resumeFitScore = Math.round(resumeFitPercent);

  // Overall composite
  const overallScore = Math.round(
    technicalScore * 0.35 +
    communicationScore * 0.20 +
    confidenceScore * 0.15 +
    behaviorScore * 0.15 +
    resumeFitScore * 0.15
  );

  // Recommendation
  const { recommendation, recommendationColor } = getRecommendation(overallScore);

  // Strengths & Weaknesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const improvements: string[] = [];

  if (technicalScore >= 75) strengths.push('Strong technical knowledge and concept depth');
  else if (technicalScore < 55) weaknesses.push('Technical answers lack depth — needs improvement');

  if (communicationScore >= 75) strengths.push('Clear and fluent communication');
  else if (communicationScore < 55) weaknesses.push('Communication clarity needs work');

  if (confidenceScore >= 75) strengths.push('Projects confidence throughout the interview');
  else if (confidenceScore < 55) weaknesses.push('Appears nervous — low confidence detected');

  if (videoMetrics) {
    if (videoMetrics.avgEyeContact >= 70) strengths.push('Excellent eye contact with camera');
    else if (videoMetrics.avgEyeContact < 40) weaknesses.push('Poor eye contact — looks away frequently');

    if (videoMetrics.avgEngagement >= 70) strengths.push('Highly engaged throughout the session');
    if (videoMetrics.avgStress > 60) weaknesses.push('Shows signs of stress under pressure');

    if (videoMetrics.cheatingFlags > 10) weaknesses.push('Possible cheating flags detected — excessive looking away');
  }

  if (speechMetrics) {
    if (speechMetrics.fillerCount > 15) weaknesses.push(`Uses filler words frequently (${speechMetrics.fillerCount} detected)`);
    if (speechMetrics.wpm > 0 && speechMetrics.wpm < 100) improvements.push('Speak slightly faster for better engagement');
    if (speechMetrics.wpm > 180) improvements.push('Slow down speech pace for clarity');
    if (speechMetrics.fillerCount > 5 && speechMetrics.fillerCount <= 15) improvements.push('Reduce filler words (um, uh, like) for more polished delivery');
  }

  if (resumeFitScore >= 80) strengths.push('Strong alignment between resume and role requirements');
  else if (resumeFitScore < 50) improvements.push('Consider upskilling in areas relevant to the target role');

  // Ensure at least one strength/weakness
  if (strengths.length === 0) strengths.push('Shows basic competency in the evaluated areas');
  if (weaknesses.length === 0 && overallScore < 80) improvements.push('Continue practicing to improve consistency');

  return {
    technicalScore,
    communicationScore,
    confidenceScore,
    behaviorScore,
    resumeFitScore,
    overallScore,
    recommendation,
    recommendationColor,
    strengths,
    weaknesses,
    improvements,
    videoMetrics,
    speechMetrics,
  };
}

function getRecommendation(score: number): { recommendation: BehavioralReport['recommendation']; recommendationColor: string } {
  if (score >= 80) return { recommendation: 'Strong Hire', recommendationColor: 'var(--accent-green)' };
  if (score >= 65) return { recommendation: 'Hire', recommendationColor: 'var(--accent-cyan)' };
  if (score >= 50) return { recommendation: 'Maybe', recommendationColor: 'var(--accent-amber)' };
  return { recommendation: 'Reject', recommendationColor: 'var(--accent-red)' };
}
