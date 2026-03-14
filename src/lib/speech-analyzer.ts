/**
 * Speech Analyzer — Real-time speech quality analysis
 * Detects filler words, calculates WPM, fluency, and communication scores.
 */

const FILLER_WORDS = [
  'um', 'uh', 'uhh', 'umm', 'hmm', 'like', 'you know', 'basically',
  'actually', 'literally', 'sort of', 'kind of', 'i mean', 'right',
  'so yeah', 'er', 'ah', 'well', 'okay so', 'I guess',
];

export interface SpeechMetrics {
  totalWords: number;
  fillerCount: number;
  fillerRatio: number;
  fillerDetails: Record<string, number>;
  wpm: number;              // words per minute
  fluencyScore: number;     // 0-100
  communicationScore: number; // 0-100
  clarityScore: number;     // 0-100
  pauseCount: number;
  avgSentenceLength: number;
}

/**
 * Analyze a transcript for speech quality metrics
 */
export function analyzeTranscript(transcript: string, durationSeconds: number): SpeechMetrics {
  if (!transcript.trim() || durationSeconds <= 0) {
    return {
      totalWords: 0, fillerCount: 0, fillerRatio: 0, fillerDetails: {},
      wpm: 0, fluencyScore: 0, communicationScore: 0, clarityScore: 0,
      pauseCount: 0, avgSentenceLength: 0,
    };
  }

  const lowerTranscript = transcript.toLowerCase();
  const words = transcript.trim().split(/\s+/).filter(w => w.length > 0);
  const totalWords = words.length;

  // Filler word detection
  const fillerDetails: Record<string, number> = {};
  let fillerCount = 0;
  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = lowerTranscript.match(regex);
    if (matches && matches.length > 0) {
      fillerDetails[filler] = matches.length;
      fillerCount += matches.length;
    }
  }

  const fillerRatio = totalWords > 0 ? fillerCount / totalWords : 0;

  // Words per minute
  const durationMinutes = durationSeconds / 60;
  const wpm = durationMinutes > 0 ? Math.round(totalWords / durationMinutes) : 0;

  // Sentence analysis
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0
    ? Math.round(totalWords / sentences.length)
    : totalWords;

  // Pause detection (approximated by looking for repeated spaces or short segments)
  const segments = transcript.split(/\s{3,}/);
  const pauseCount = Math.max(0, segments.length - 1);

  // Fluency: penalize for fillers, reward consistent WPM
  const wpmScore = wpm >= 120 && wpm <= 160 ? 100 : wpm >= 100 && wpm <= 180 ? 80 : 50;
  const fluencyScore = Math.max(0, Math.min(100, Math.round(
    wpmScore * 0.4 + (1 - fillerRatio) * 100 * 0.4 + (pauseCount < 5 ? 90 : 60) * 0.2
  )));

  // Clarity: sentence length variety, not too short or too long
  const sentenceLengthScore = avgSentenceLength >= 8 && avgSentenceLength <= 20 ? 90 : 60;
  const clarityScore = Math.max(0, Math.min(100, Math.round(
    sentenceLengthScore * 0.4 + (1 - fillerRatio) * 100 * 0.3 + wpmScore * 0.3
  )));

  // Communication: composite
  const communicationScore = Math.round(
    fluencyScore * 0.4 + clarityScore * 0.3 + wpmScore * 0.3
  );

  return {
    totalWords,
    fillerCount,
    fillerRatio: Math.round(fillerRatio * 1000) / 1000,
    fillerDetails,
    wpm,
    fluencyScore,
    communicationScore,
    clarityScore,
    pauseCount,
    avgSentenceLength,
  };
}

/**
 * Get real-time filler word count from incremental transcript
 */
export function countFillers(text: string): { count: number; words: string[] } {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) {
      for (let i = 0; i < matches.length; i++) found.push(filler);
    }
  }
  return { count: found.length, words: found };
}

/**
 * Get speech speed category
 */
export function getSpeedCategory(wpm: number): { label: string; color: string } {
  if (wpm === 0) return { label: 'No speech', color: 'var(--text-muted)' };
  if (wpm < 100) return { label: 'Too slow', color: 'var(--accent-amber)' };
  if (wpm <= 150) return { label: 'Good pace', color: 'var(--accent-green)' };
  if (wpm <= 180) return { label: 'Slightly fast', color: 'var(--accent-amber)' };
  return { label: 'Too fast', color: 'var(--accent-red)' };
}
