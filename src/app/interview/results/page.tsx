'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { InterviewResult } from '@/lib/interview-engine';
import { BehavioralReport } from '@/lib/behavioral-scorer';
import { SessionMetrics } from '@/lib/face-analyzer';
import { SpeechMetrics } from '@/lib/speech-analyzer';

interface EnhancedResult extends InterviewResult {
  behavioralReport?: BehavioralReport;
  videoMetrics?: SessionMetrics;
  speechMetrics?: SpeechMetrics;
  interviewType?: string;
  duration?: number;
  rejected?: boolean;
}

function ScoreRing({ score, size = 120, label }: { score: number; size?: number; label: string }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? 'var(--accent-green)' : score >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)';

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border-color)" strokeWidth={8} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="score-ring" />
      </svg>
      <div style={{ marginTop: -size / 2 - 16, fontSize: size > 100 ? 28 : 20, fontWeight: 800, color, marginBottom: size > 100 ? 24 : 16 }}>{score}</div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function DimensionBar({ label, icon, score, weight }: { label: string; icon: string; score: number; weight: string }) {
  const color = score >= 70 ? 'var(--accent-green)' : score >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color }}>{score}/10</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 3, width: `${score}%`, background: color, transition: 'width 0.8s ease' }} />
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Weight: {weight}</div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<EnhancedResult | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lastInterviewResult');
      if (!saved) { router.push('/interview/setup'); return; }
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== 'object') { router.push('/interview/setup'); return; }
      setResult(parsed);
    } catch {
      router.push('/interview/setup');
    }
  }, [router]);

  if (!result) return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="typing-cursor" style={{ fontSize: 18, color: 'var(--text-secondary)' }}>Loading results</div>
    </div>
  );

  const br = result.behavioralReport;
  const isVideo = result.interviewType === 'video' && br;
  const overallScore = isVideo ? br!.overallScore : (result.overallScore || 0);
  const recommendation = isVideo ? br!.recommendation : ((result.overallScore || 0) >= 85 ? 'Strong Hire' : (result.overallScore || 0) >= 70 ? 'Hire' : (result.overallScore || 0) >= 55 ? 'Maybe' : 'Reject');
  const recColor = isVideo ? br!.recommendationColor : ((result.overallScore || 0) >= 80 ? 'var(--accent-green)' : (result.overallScore || 0) >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)');

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <nav style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="Interview Mate" style={{ height: 32, width: 'auto' }} />
        </Link>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/skills" className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>📈 Skill Map</Link>
          <Link href="/interview/setup" className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>New Interview</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '36px 24px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', gap: 8, marginBottom: 16 }}>
            <span className="tag tag-green">✅ Interview Complete</span>
            {isVideo && <span className="tag tag-cyan">🎥 Video Analysis</span>}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            <span className="gradient-text">AI Evaluation Report</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            {result.candidateProfile?.role || 'Interview'} • {result.candidateProfile?.companyStyle || 'General'} Style
            {result.duration && <> • {Math.floor(result.duration / 60)} min {result.duration % 60}s</>}
          </p>
        </div>

        {/* Overall Score + Recommendation */}
        {result.rejected ? (
          <div className="glass-card" style={{ padding: 36, textAlign: 'center', marginBottom: 24, border: '2px solid var(--accent-red)', background: 'rgba(239, 68, 68, 0.05)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚨</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-red)', marginBottom: 8 }}>Interview Terminated</h2>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 20 }}>
              {(result.improvements && result.improvements[0]) || 'Candidate rejected due to policy violations.'}
            </p>
            <div style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', fontWeight: 600 }}>
              Final Decision: Rejected
            </div>
          </div>
        ) : (
          <div className="glass-card glow-cyan" style={{ padding: 36, textAlign: 'center', marginBottom: 24 }}>
            <ScoreRing score={overallScore} size={140} label="Overall Score" />
            <div style={{ marginTop: 20, padding: '12px 28px', borderRadius: 14, background: `${recColor}15`, display: 'inline-block', border: `1px solid ${recColor}30` }}>
              <span style={{ fontWeight: 800, color: recColor, fontSize: 18 }}>
                {recommendation === 'Strong Hire' ? '🏆' : recommendation === 'Hire' ? '✅' : recommendation === 'Maybe' ? '🔄' : '❌'} {recommendation}
              </span>
            </div>
          </div>
        )}

        {/* Behavioral Dimension Scores (Video interview only) */}
        {isVideo && br && (
          <div className="glass-card animate-slide-up" style={{ padding: 28, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>🧠 Behavioral Analysis</h3>
            <DimensionBar label="Technical Accuracy" icon="⚙️" score={br.technicalScore} weight="35%" />
            <DimensionBar label="Communication" icon="🗣️" score={br.communicationScore} weight="20%" />
            <DimensionBar label="Confidence" icon="🎯" score={br.confidenceScore} weight="15%" />
            <DimensionBar label="Behavior & Engagement" icon="🧠" score={br.behaviorScore} weight="15%" />
            <DimensionBar label="Resume Fit" icon="📄" score={br.resumeFitScore} weight="15%" />
          </div>
        )}

        {/* Video + Speech Metrics (Video interview only) */}
        {isVideo && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Video Metrics */}
            {result.videoMetrics && (
              <div className="glass-card animate-slide-up" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>🎥 Video Analysis</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Eye Contact', value: result.videoMetrics.avgEyeContact, icon: '👁' },
                    { label: 'Engagement', value: result.videoMetrics.avgEngagement, icon: '⚡' },
                    { label: 'Confidence', value: result.videoMetrics.avgConfidence, icon: '🎯' },
                    { label: 'Professionalism', value: result.videoMetrics.avgProfessionalism, icon: '💼' },
                    { label: 'Emotion Stability', value: result.videoMetrics.emotionStability, icon: '🧘' },
                  ].map(m => (
                    <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>{m.icon}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 100 }}>{m.label}</span>
                      <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 3, width: `${m.value}%`, background: m.value >= 70 ? 'var(--accent-green)' : m.value >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)', transition: 'width 0.8s ease' }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, width: 30, textAlign: 'right', color: m.value >= 70 ? 'var(--accent-green)' : m.value >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>{Math.round(m.value)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10, marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>Frames: {result.videoMetrics.totalFrames}</span>
                    <span>Face detected: {Math.round(result.videoMetrics.faceDetectedRatio)}%</span>
                    <span>Cheating: {result.videoMetrics.cheatingFlags}</span>
                  </div>
                  <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Dominant emotion:</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{result.videoMetrics.dominantEmotion}</span>
                    <span>Stress: <span style={{ fontWeight: 600, color: result.videoMetrics.avgStress > 60 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{Math.round(result.videoMetrics.avgStress)}%</span></span>
                  </div>
                </div>
              </div>
            )}

            {/* Speech Metrics */}
            {result.speechMetrics && (
              <div className="glass-card animate-slide-up" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>🗣️ Speech Analysis</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Fluency', value: result.speechMetrics.fluencyScore, icon: '🎯' },
                    { label: 'Clarity', value: result.speechMetrics.clarityScore, icon: '💎' },
                    { label: 'Communication', value: result.speechMetrics.communicationScore, icon: '🗣️' },
                  ].map(m => (
                    <div key={m.label} style={{ textAlign: 'center', padding: 12, borderRadius: 10, background: 'var(--bg-secondary)' }}>
                      <div style={{ fontSize: 18 }}>{m.icon}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: m.value >= 70 ? 'var(--accent-green)' : m.value >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>{Math.round(m.value)}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.label}</div>
                    </div>
                  ))}
                  <div style={{ textAlign: 'center', padding: 12, borderRadius: 10, background: 'var(--bg-secondary)' }}>
                    <div style={{ fontSize: 18 }}>⚡</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-cyan)' }}>{result.speechMetrics.wpm}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>WPM</div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total Words</span>
                    <span style={{ fontWeight: 600 }}>{result.speechMetrics.totalWords}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Filler Words</span>
                    <span style={{ fontWeight: 600, color: result.speechMetrics.fillerCount > 15 ? 'var(--accent-red)' : result.speechMetrics.fillerCount > 5 ? 'var(--accent-amber)' : 'var(--accent-green)' }}>
                      {result.speechMetrics.fillerCount} ({(result.speechMetrics.fillerRatio * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Avg Sentence Length</span>
                    <span style={{ fontWeight: 600 }}>{result.speechMetrics.avgSentenceLength} words</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Category Scores (existing) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Technical Depth', score: result.technicalAvg || 0, icon: '⚙️' },
            { label: 'Architecture', score: result.architectureAvg || 0, icon: '🏗️' },
            { label: 'Communication', score: result.communicationAvg || 0, icon: '💬' },
            { label: 'Problem Solving', score: result.problemSolvingAvg || 0, icon: '🧩' },
          ].map(cat => (
            <div key={cat.label} className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
              <ScoreRing score={cat.score} size={80} label="" />
              <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600 }}>
                {cat.icon} {cat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Strengths & Improvements */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: 'var(--accent-green)' }}>💪 Strengths</h3>
            {(isVideo && br ? br.strengths : (result.strengths || [])).map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ color: 'var(--accent-green)', fontSize: 13 }}>✓</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: 'var(--accent-amber)' }}>📝 Areas for Improvement</h3>
            {(isVideo && br ? [...(br.weaknesses || []), ...(br.improvements || [])] : (result.improvements || [])).map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ color: 'var(--accent-amber)', fontSize: 13 }}>→</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Question-by-Question */}
        <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>📋 Question-by-Question Analysis</h3>
          {(result.scores || []).map((s, i) => (
            <div key={i} className="glass-card-sm" style={{ padding: 18, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Question {i + 1}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>{s.question}</div>
                </div>
                <div style={{
                  padding: '4px 12px', borderRadius: 8, fontWeight: 700, fontSize: 14, marginLeft: 12, whiteSpace: 'nowrap',
                  background: s.overall >= 80 ? 'rgba(16,185,129,0.15)' : s.overall >= 60 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                  color: s.overall >= 80 ? 'var(--accent-green)' : s.overall >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)',
                }}>
                  {s.overall}/10
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: 10, borderRadius: 6, marginBottom: 10, lineHeight: 1.5, maxHeight: 60, overflow: 'hidden' }}>
                {s.answer}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                {[
                  { label: 'Technical', val: s.technicalDepth },
                  { label: 'Relevance', val: s.relevance },
                  { label: 'Clarity', val: s.clarity },
                  { label: 'Completeness', val: s.completeness },
                ].map(metric => (
                  <div key={metric.label} style={{ fontSize: 11 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{metric.label}: </span>
                    <span style={{ fontWeight: 600, color: metric.val >= 70 ? 'var(--accent-green)' : metric.val >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>{metric.val}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--accent-cyan)', fontStyle: 'italic' }}>💡 {s.feedback}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/skills" className="btn-secondary" style={{ padding: '14px 28px' }}>📈 Skill Graph</Link>
          <Link href="/interview/setup" className="btn-primary" style={{ padding: '14px 28px' }}>🔄 Retake Interview</Link>
          <Link href="/dashboard" className="btn-secondary" style={{ padding: '14px 28px' }}>🏠 Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
