'use client';

import { useState } from 'react';
import Link from 'next/link';

const LEADERBOARD_DATA = [
  { rank: 1, name: 'Arjun Kumar', role: 'Data Scientist', score: 92, badge: '🥇', trend: '+3', interviews: 8, streak: 5 },
  { rank: 2, name: 'Rahul Sharma', role: 'Backend Engineer', score: 87, badge: '🥈', trend: '+1', interviews: 12, streak: 3 },
  { rank: 3, name: 'Anita Desai', role: 'ML Engineer', score: 83, badge: '🥉', trend: '+5', interviews: 6, streak: 4 },
  { rank: 4, name: 'Karan Mehta', role: 'Full Stack', score: 79, badge: '', trend: '-1', interviews: 10, streak: 2 },
  { rank: 5, name: 'Priya Patel', role: 'Frontend Engineer', score: 76, badge: '', trend: '+2', interviews: 9, streak: 2 },
  { rank: 6, name: 'Divya Nair', role: 'DevOps Engineer', score: 71, badge: '', trend: '0', interviews: 7, streak: 1 },
  { rank: 7, name: 'Sneha Gupta', role: 'Product Manager', score: 68, badge: '', trend: '-2', interviews: 5, streak: 0 },
  { rank: 8, name: 'Vikram Singh', role: 'Backend Engineer', score: 54, badge: '', trend: '-3', interviews: 3, streak: 0 },
];

const ACHIEVEMENTS = [
  { icon: '🔥', name: 'Streak Master', desc: '5 interviews in a row', color: 'var(--accent-amber)' },
  { icon: '🏆', name: 'Top Scorer', desc: 'Score 90+ in any interview', color: 'var(--accent-green)' },
  { icon: '🎯', name: 'Consistent', desc: 'Average 80+ over 5 interviews', color: 'var(--accent-cyan)' },
  { icon: '💡', name: 'Quick Thinker', desc: 'Answer all questions under 2 min', color: 'var(--accent-blue)' },
  { icon: '🗣️', name: 'Communicator', desc: '90+ in communication score', color: 'var(--accent-green)' },
  { icon: '🎬', name: 'Camera Ready', desc: 'Complete 3 video interviews', color: 'var(--accent-amber)' },
];

export default function LeaderboardPage() {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('all');

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <nav style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: 'white' }}>AI</div>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Interview <span style={{ color: 'var(--accent-cyan)' }}>Copilot</span></span>
        </Link>
        <Link href="/dashboard" style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none' }}>← Dashboard</Link>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            <span className="gradient-text">Leaderboard</span> 🏆
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>Top performers across AI interviews</p>
        </div>

        {/* Time Filter */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {[
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' },
            { key: 'all', label: 'All Time' },
          ].map(f => (
            <button key={f.key} onClick={() => setTimeFilter(f.key as 'week' | 'month' | 'all')} style={{
              padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
              fontFamily: 'Inter, sans-serif',
              background: timeFilter === f.key ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))' : 'var(--bg-secondary)',
              color: timeFilter === f.key ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.3s ease',
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 40, alignItems: 'flex-end' }}>
          {[LEADERBOARD_DATA[1], LEADERBOARD_DATA[0], LEADERBOARD_DATA[2]].map((p, i) => {
            const heights = [140, 180, 120];
            const colors = ['rgba(192,192,192,0.15)', 'rgba(255,215,0,0.15)', 'rgba(205,127,50,0.15)'];
            const borderColors = ['rgba(192,192,192,0.3)', 'rgba(255,215,0,0.3)', 'rgba(205,127,50,0.3)'];
            return (
              <div key={i} className="glass-card" style={{
                width: i === 1 ? 200 : 160, height: heights[i], padding: 20, textAlign: 'center',
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                background: colors[i], border: `1px solid ${borderColors[i]}`,
                transition: 'all 0.3s ease',
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{p.badge}</div>
                <div style={{ fontWeight: 700, fontSize: i === 1 ? 16 : 14 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{p.role}</div>
                <div style={{ fontWeight: 800, fontSize: i === 1 ? 28 : 22, color: 'var(--accent-cyan)' }}>{p.score}</div>
              </div>
            );
          })}
        </div>

        {/* Full Rankings */}
        <div className="glass-card" style={{ padding: 28, marginBottom: 28 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>📊 Full Rankings</h3>
          {LEADERBOARD_DATA.map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0',
              borderBottom: i < LEADERBOARD_DATA.length - 1 ? '1px solid var(--border-color)' : 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 14,
                background: i < 3 ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))' : 'var(--bg-secondary)',
                color: i < 3 ? 'white' : 'var(--text-muted)',
              }}>
                {p.badge || p.rank}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.role} • {p.interviews} interviews</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {p.streak > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: 2 }}>
                    🔥 {p.streak}
                  </span>
                )}
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: p.trend.startsWith('+') ? 'var(--accent-green)' : p.trend === '0' ? 'var(--text-muted)' : 'var(--accent-red)',
                }}>
                  {p.trend.startsWith('+') ? '↑' : p.trend === '0' ? '—' : '↓'} {p.trend}
                </span>
              </div>
              <div style={{ textAlign: 'right', minWidth: 60 }}>
                <div style={{
                  fontWeight: 700, fontSize: 18,
                  color: p.score >= 80 ? 'var(--accent-green)' : p.score >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)',
                }}>{p.score}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div className="glass-card" style={{ padding: 28 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>🏅 Achievements</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {ACHIEVEMENTS.map((a, i) => (
              <div key={i} style={{
                padding: 20, borderRadius: 12, textAlign: 'center',
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                transition: 'all 0.3s ease', cursor: 'pointer',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{a.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
