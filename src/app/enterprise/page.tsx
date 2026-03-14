'use client';

import { useState } from 'react';
import Link from 'next/link';

const MOCK_CANDIDATES = [
  { name: 'Rahul Sharma', role: 'Backend Engineer', score: 87, technical: 90, communication: 82, date: '2026-03-14', status: 'Strong Hire' },
  { name: 'Priya Patel', role: 'Frontend Engineer', score: 76, technical: 74, communication: 80, date: '2026-03-13', status: 'Hire' },
  { name: 'Arjun Kumar', role: 'Data Scientist', score: 92, technical: 95, communication: 88, date: '2026-03-12', status: 'Strong Hire' },
  { name: 'Sneha Gupta', role: 'Product Manager', score: 68, technical: 62, communication: 78, date: '2026-03-11', status: 'Lean Hire' },
  { name: 'Vikram Singh', role: 'Backend Engineer', score: 54, technical: 50, communication: 60, date: '2026-03-10', status: 'No Hire' },
  { name: 'Anita Desai', role: 'ML Engineer', score: 83, technical: 88, communication: 75, date: '2026-03-09', status: 'Hire' },
  { name: 'Karan Mehta', role: 'Full Stack', score: 79, technical: 82, communication: 74, date: '2026-03-08', status: 'Hire' },
  { name: 'Divya Nair', role: 'DevOps Engineer', score: 71, technical: 73, communication: 68, date: '2026-03-07', status: 'Hire' },
];

export default function EnterpriseDashboard() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = MOCK_CANDIDATES.filter(c => {
    const matchFilter = filter === 'all' || c.status === filter;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const avgScore = Math.round(MOCK_CANDIDATES.reduce((s, c) => s + c.score, 0) / MOCK_CANDIDATES.length);
  const hireRate = Math.round(MOCK_CANDIDATES.filter(c => c.status.includes('Hire') && c.status !== 'No Hire').length / MOCK_CANDIDATES.length * 100);

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <nav style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: 'white' }}>AI</div>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Interview <span style={{ color: 'var(--accent-cyan)' }}>Copilot</span></span>
        </Link>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/dashboard" style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none' }}>Candidate View</Link>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-cyan)' }}>Enterprise</span>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            <span className="gradient-text">Enterprise Dashboard</span> 🏢
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>HR Analytics & Candidate Comparison</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Candidates', val: MOCK_CANDIDATES.length.toString(), icon: '👥', color: 'var(--accent-cyan)' },
            { label: 'Avg Score', val: `${avgScore}/100`, icon: '📊', color: 'var(--accent-green)' },
            { label: 'Hire Rate', val: `${hireRate}%`, icon: '✅', color: 'var(--accent-amber)' },
            { label: 'Roles', val: String(new Set(MOCK_CANDIDATES.map(c => c.role)).size), icon: '💼', color: 'var(--accent-blue)' },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ padding: 24 }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginTop: 8 }}>{s.val}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Score Distribution */}
        <div className="glass-card" style={{ padding: 28, marginBottom: 28 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>📊 Score Distribution</h3>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 120 }}>
            {MOCK_CANDIDATES.sort((a, b) => b.score - a.score).map((c, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: c.score >= 80 ? 'var(--accent-green)' : c.score >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>{c.score}</span>
                <div style={{
                  width: '100%', maxWidth: 60, borderRadius: '6px 6px 0 0',
                  height: `${c.score}%`,
                  background: c.score >= 80 ? 'linear-gradient(180deg, var(--accent-green), rgba(16,185,129,0.3))' : c.score >= 60 ? 'linear-gradient(180deg, var(--accent-amber), rgba(245,158,11,0.3))' : 'linear-gradient(180deg, var(--accent-red), rgba(239,68,68,0.3))',
                  transition: 'height 0.5s ease',
                }} />
                <span style={{ fontSize: 9, color: 'var(--text-muted)', maxWidth: 60, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters & Table */}
        <div className="glass-card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>👥 Candidate Pipeline</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="input-field" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200, padding: '8px 14px', fontSize: 13 }} />
              {['all', 'Strong Hire', 'Hire', 'Lean Hire', 'No Hire'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'Inter',
                  background: filter === f ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))' : 'var(--bg-secondary)',
                  color: filter === f ? 'white' : 'var(--text-secondary)',
                }}>
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Candidate', 'Role', 'Overall', 'Technical', 'Communication', 'Date', 'Status'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,255,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: 'white', flexShrink: 0 }}>
                        {c.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{c.role}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: 700, color: c.score >= 80 ? 'var(--accent-green)' : c.score >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>{c.score}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13 }}>{c.technical}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13 }}>{c.communication}</td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{c.date}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`tag ${c.status === 'Strong Hire' ? 'tag-green' : c.status === 'Hire' ? 'tag-cyan' : c.status === 'Lean Hire' ? 'tag-amber' : 'tag-amber'}`}
                        style={c.status === 'No Hire' ? { background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)', border: '1px solid rgba(239,68,68,0.2)' } : {}}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
