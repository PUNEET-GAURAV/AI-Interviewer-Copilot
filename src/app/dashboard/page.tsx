'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { InterviewResult } from '@/lib/interview-engine';

const SAMPLE_HISTORY: Partial<InterviewResult>[] = [
  { candidateProfile: { name: '', role: 'Backend Engineer', experience: '3 years', skills: [], companyStyle: 'FAANG', resumeText: '' }, overallScore: 84, completedAt: new Date('2026-03-12') },
  { candidateProfile: { name: '', role: 'Frontend Engineer', experience: '2 years', skills: [], companyStyle: 'Startup', resumeText: '' }, overallScore: 76, completedAt: new Date('2026-03-10') },
  { candidateProfile: { name: '', role: 'Data Scientist', experience: '4 years', skills: [], companyStyle: 'Enterprise', resumeText: '' }, overallScore: 91, completedAt: new Date('2026-03-08') },
];

export default function DashboardPage() {
  const [userName, setUserName] = useState('Candidate');
  const [history, setHistory] = useState<Partial<InterviewResult>[]>([]);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      setUserName(parsed.name || parsed.email?.split('@')[0] || 'Candidate');
    }
    const saved = localStorage.getItem('interviewHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
      } catch { setHistory(SAMPLE_HISTORY); }
    } else {
      setHistory(SAMPLE_HISTORY);
    }
  }, []);

  const avgScore = history.length > 0
    ? Math.round(history.reduce((s, h) => s + (h.overallScore || 0), 0) / history.length)
    : 0;

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Top Nav */}
      <nav style={{
        background: 'rgba(10, 10, 15, 0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)', padding: '14px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: 'white' }}>AI</div>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Interview <span style={{ color: 'var(--accent-cyan)' }}>Copilot</span></span>
        </Link>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/enterprise" style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none' }}>Enterprise</Link>
          <Link href="/interview/setup" className="btn-primary" style={{ padding: '8px 20px', fontSize: 13 }}>New Interview</Link>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14, color: 'white',
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        {/* Welcome */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            Welcome back, <span className="gradient-text">{userName}</span> 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Here{`'`}s your interview performance overview</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 40 }}>
          {[
            { label: 'Interviews Taken', value: history.length.toString(), icon: '🎯', color: 'var(--accent-cyan)' },
            { label: 'Average Score', value: `${avgScore}/100`, icon: '📊', color: 'var(--accent-green)' },
            { label: 'Best Score', value: `${history.length ? Math.max(...history.map(h => h.overallScore || 0)) : 0}/100`, icon: '🏆', color: 'var(--accent-amber)' },
            { label: 'Skill Areas', value: '6', icon: '🧩', color: 'var(--accent-blue)' },
          ].map(stat => (
            <div key={stat.label} className="glass-card" style={{ padding: 24, transition: 'all 0.3s ease', cursor: 'default' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>{stat.icon}</span>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: stat.color }} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
          <Link href="/interview/setup" style={{ textDecoration: 'none' }}>
            <div className="glass-card glow-cyan" style={{ padding: 28, cursor: 'pointer', transition: 'all 0.3s ease', height: '100%' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🚀</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>Start New Interview</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Text or Video mode with AI evaluation
              </p>
            </div>
          </Link>
          <Link href="/skills" style={{ textDecoration: 'none' }}>
            <div className="glass-card glow-blue" style={{ padding: 28, cursor: 'pointer', transition: 'all 0.3s ease', height: '100%' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📈</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>Skill Map</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Radar chart of competencies & progress
              </p>
            </div>
          </Link>
          <Link href="/tips" style={{ textDecoration: 'none' }}>
            <div className="glass-card glow-green" style={{ padding: 28, cursor: 'pointer', transition: 'all 0.3s ease', height: '100%' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📖</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>Interview Tips</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Expert strategies & preparation guide
              </p>
            </div>
          </Link>
          <Link href="/leaderboard" style={{ textDecoration: 'none' }}>
            <div className="glass-card" style={{ padding: 28, cursor: 'pointer', transition: 'all 0.3s ease', height: '100%', boxShadow: '0 0 20px rgba(245,158,11,0.1)' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>Leaderboard</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Rankings, achievements & streaks
              </p>
            </div>
          </Link>
        </div>

        {/* Interview History */}
        <div className="glass-card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            📋 Recent Interviews
          </h2>
          {history.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No interviews yet. Start your first one!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.map((item, i) => (
                <div key={i} className="glass-card-sm" style={{
                  padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', transition: 'all 0.3s ease', cursor: 'pointer',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--glass-border)')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10,
                      background: 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(79,70,229,0.1))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>
                      {item.candidateProfile?.role?.includes('Backend') ? '⚙️' : item.candidateProfile?.role?.includes('Frontend') ? '🎨' : item.candidateProfile?.role?.includes('Data') ? '📊' : '💼'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{item.candidateProfile?.role || 'Interview'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {item.candidateProfile?.companyStyle} Style • {item.completedAt ? new Date(item.completedAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      padding: '4px 14px', borderRadius: 20, fontWeight: 700, fontSize: 14,
                      background: (item.overallScore || 0) >= 80 ? 'rgba(16,185,129,0.15)' : (item.overallScore || 0) >= 60 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                      color: (item.overallScore || 0) >= 80 ? 'var(--accent-green)' : (item.overallScore || 0) >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)',
                    }}>
                      {item.overallScore}/100
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
