/**
 * Face Analyzer — Real-time facial analysis using face-api.js
 * Runs entirely client-side (browser) for zero-latency analysis.
 *
 * Provides: emotion detection, eye contact scoring, engagement tracking,
 * confidence estimation, and cheating detection.
 */
import * as faceapi from 'face-api.js';

export interface FaceMetrics {
  emotions: {
    neutral: number;
    happy: number;
    sad: number;
    angry: number;
    fearful: number;
    disgusted: number;
    surprised: number;
    dominant: string;
  };
  eyeContact: number;       // 0-100
  confidence: number;       // 0-100
  engagement: number;       // 0-100
  professionalism: number;  // 0-100
  stressLevel: number;      // 0-100
  faceDetected: boolean;
  lookingAway: boolean;
  cheatingFlags: number;
  multipleFacesDetected?: boolean;
  identityMismatch?: boolean;
}

export interface SessionMetrics {
  avgEmotions: Record<string, number>;
  avgEyeContact: number;
  avgConfidence: number;
  avgEngagement: number;
  avgProfessionalism: number;
  avgStress: number;
  cheatingFlags: number;
  totalFrames: number;
  faceDetectedRatio: number;
  dominantEmotion: string;
  emotionStability: number; // 0-100, higher = more stable
}

let modelsLoaded = false;

export async function loadFaceModels(): Promise<boolean> {
  if (modelsLoaded) return true;
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceExpressionNet.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    ]);
    modelsLoaded = true;
    return true;
  } catch (err) {
    console.error('Failed to load face models:', err);
    return false;
  }
}

export function isModelsLoaded(): boolean {
  return modelsLoaded;
}

/**
 * Extract a single facial descriptor from the video feed.
 * Used for storing the initial candidate identity.
 */
export async function captureFaceDescriptor(
  video: HTMLVideoElement
): Promise<Float32Array | null> {
  if (!modelsLoaded) return null;
  try {
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();
    return detection ? detection.descriptor : null;
  } catch {
    return null;
  }
}

/**
 * Analyze a single video frame for facial metrics
 */
export async function analyzeFrame(
  video: HTMLVideoElement,
  baseDescriptor?: Float32Array | null
): Promise<FaceMetrics | null> {
  if (!modelsLoaded) return null;

  try {
    // Detect multiple faces to ensure nobody else is in frame
    const allFaces = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
      .withFaceLandmarks()
      .withFaceExpressions()
      .withFaceDescriptors();

    const multipleFacesDetected = allFaces.length > 1;
    let identityMismatch = false;

    // Use the primarily detected face (usually the largest one by area)
    const detection = allFaces.sort((a, b) => b.detection.box.area - a.detection.box.area)[0];

    if (!detection) {
      return {
        emotions: { neutral: 0, happy: 0, sad: 0, angry: 0, fearful: 0, disgusted: 0, surprised: 0, dominant: 'unknown' },
        eyeContact: 0,
        confidence: 0,
        engagement: 0,
        professionalism: 0,
        stressLevel: 0,
        faceDetected: false,
        lookingAway: true,
        cheatingFlags: 1,
        multipleFacesDetected: false,
        identityMismatch: false,
      };
    }

    if (baseDescriptor) {
      const distance = faceapi.euclideanDistance(detection.descriptor, baseDescriptor);
      // distance threshold: typically 0.6 is a good balance for face-api.js, we use 0.5 for a bit stricter
      identityMismatch = distance > 0.55;
    }

    const expressions = detection.expressions;
    const landmarks = detection.landmarks;

    // Dominant emotion
    const emoEntries = Object.entries(expressions) as [string, number][];
    const dominant = emoEntries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];

    // Eye contact estimation using eye landmarks
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const nose = landmarks.getNose();
    const eyeContact = estimateEyeContact(leftEye, rightEye, nose, video);

    // Confidence: high neutral/happy + good eye contact = confident
    const confidence = Math.min(100, Math.round(
      (expressions.neutral * 30 + expressions.happy * 40 + eyeContact * 0.3) * 1.2
    ));

    // Engagement: face detected + forward-facing + varied expressions
    const engagement = Math.min(100, Math.round(
      (eyeContact * 0.4 + (1 - expressions.neutral) * 30 + 40) * 1.1
    ));

    // Stress: high fear/anger/sadness/surprise
    const stressLevel = Math.min(100, Math.round(
      (expressions.fearful * 100 + expressions.angry * 80 + expressions.sad * 60 + expressions.surprised * 30) * 1.5
    ));

    // Professionalism: neutral/happy dominant, low stress, good eye contact
    const professionalism = Math.min(100, Math.round(
      ((expressions.neutral + expressions.happy) * 40 + eyeContact * 0.3 + (100 - stressLevel) * 0.2)
    ));

    const lookingAway = eyeContact < 30;

    return {
      emotions: {
        neutral: round2(expressions.neutral * 100),
        happy: round2(expressions.happy * 100),
        sad: round2(expressions.sad * 100),
        angry: round2(expressions.angry * 100),
        fearful: round2(expressions.fearful * 100),
        disgusted: round2(expressions.disgusted * 100),
        surprised: round2(expressions.surprised * 100),
        dominant,
      },
      eyeContact: Math.round(eyeContact),
      confidence,
      engagement,
      professionalism,
      stressLevel,
      faceDetected: true,
      lookingAway,
      cheatingFlags: lookingAway ? 1 : 0,
      multipleFacesDetected,
      identityMismatch,
    };
  } catch {
    return null;
  }
}

/**
 * Aggregate frame-level metrics into session-level summary
 */
export function aggregateMetrics(frames: FaceMetrics[]): SessionMetrics {
  if (frames.length === 0) {
    return {
      avgEmotions: {}, avgEyeContact: 0, avgConfidence: 0, avgEngagement: 0,
      avgProfessionalism: 0, avgStress: 0, cheatingFlags: 0, totalFrames: 0,
      faceDetectedRatio: 0, dominantEmotion: 'unknown', emotionStability: 0,
    };
  }

  const detected = frames.filter(f => f.faceDetected);
  const n = detected.length || 1;

  const emotionKeys = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'] as const;
  const avgEmotions: Record<string, number> = {};
  for (const key of emotionKeys) {
    avgEmotions[key] = round2(detected.reduce((s, f) => s + f.emotions[key], 0) / n);
  }

  // Find dominant emotion across session
  const dominantEmotion = Object.entries(avgEmotions).reduce((a, b) => b[1] > a[1] ? b : a)[0];

  // Emotion stability: lower variance = more stable
  const emotionValues = detected.map(f => {
    const vals = [f.emotions.neutral, f.emotions.happy, f.emotions.sad, f.emotions.angry, f.emotions.fearful, f.emotions.disgusted, f.emotions.surprised];
    return Math.max(...vals);
  });
  const avgMax = emotionValues.reduce((a, b) => a + b, 0) / emotionValues.length;
  const variance = emotionValues.reduce((s, v) => s + Math.pow(v - avgMax, 2), 0) / emotionValues.length;
  const emotionStability = Math.max(0, Math.min(100, 100 - Math.sqrt(variance) * 2));

  return {
    avgEmotions,
    avgEyeContact: round2(detected.reduce((s, f) => s + f.eyeContact, 0) / n),
    avgConfidence: round2(detected.reduce((s, f) => s + f.confidence, 0) / n),
    avgEngagement: round2(detected.reduce((s, f) => s + f.engagement, 0) / n),
    avgProfessionalism: round2(detected.reduce((s, f) => s + f.professionalism, 0) / n),
    avgStress: round2(detected.reduce((s, f) => s + f.stressLevel, 0) / n),
    cheatingFlags: frames.reduce((s, f) => s + f.cheatingFlags, 0),
    totalFrames: frames.length,
    faceDetectedRatio: round2((detected.length / frames.length) * 100),
    dominantEmotion,
    emotionStability: round2(emotionStability),
  };
}

// --- Helpers ---

function estimateEyeContact(
  leftEye: faceapi.Point[], rightEye: faceapi.Point[],
  nose: faceapi.Point[], video: HTMLVideoElement
): number {
  // Calculate eye center positions relative to video center
  const eyeCenterX = (avg(leftEye.map(p => p.x)) + avg(rightEye.map(p => p.x))) / 2;
  const eyeCenterY = (avg(leftEye.map(p => p.y)) + avg(rightEye.map(p => p.y))) / 2;
  const noseTip = nose[nose.length - 1]; // bottom of nose

  const videoCenterX = video.videoWidth / 2;
  const videoCenterY = video.videoHeight / 2;

  // Distance of eyes from center (normalized)
  const dx = Math.abs(eyeCenterX - videoCenterX) / videoCenterX;
  const dy = Math.abs(eyeCenterY - videoCenterY) / videoCenterY;

  // Face orientation (nose relative to eye center)
  const faceAngle = Math.abs(noseTip.x - eyeCenterX) / video.videoWidth;

  // Score: closer to center + less face angle = better eye contact
  const score = Math.max(0, 100 - (dx * 60 + dy * 40 + faceAngle * 80));
  return Math.min(100, Math.round(score));
}

function avg(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / (nums.length || 1);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
