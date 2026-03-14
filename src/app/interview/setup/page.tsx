'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ROLES = [
  'Backend Engineer', 'Frontend Engineer', 'Full Stack Engineer',
  'Data Scientist', 'Product Manager', 'DevOps Engineer',
  'Mobile Developer', 'ML Engineer', 'Security Engineer',
];

const DIFFICULTIES = [
  { value: 'easy', label: 'Junior', desc: 'Entry-level questions', icon: '🌱' },
  { value: 'medium', label: 'Mid-Level', desc: 'Balanced difficulty', icon: '⚡' },
  { value: 'hard', label: 'Senior', desc: 'Advanced technical depth', icon: '🔥' },
];

export default function InterviewSetupPage() {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [companyStyle, setCompanyStyle] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [interviewMode, setInterviewMode] = useState<'text' | 'video'>('text');
  const [resumeText, setResumeText] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setResumeText(text.slice(0, 2000));
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleStart = () => {
    if (!role) return;
    setIsLoading(true);

    const profile = {
      name: name || 'Candidate',
      role,
      experience: 'Mid-Level', // Default now that it's removed from UI
      skills: [], // Defaults to empty
      companyStyle: 'Enterprise', // Default to enterprise rigor
      resumeText,
    };

    localStorage.setItem('interviewProfile', JSON.stringify(profile));
    localStorage.setItem('interviewDifficulty', difficulty);

    setTimeout(() => {
      router.push(interviewMode === 'video' ? '/interview/video' : '/interview/session');
    }, 600);
  };

  const isReady = role;

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="Interview Mate" style={{ height: 32, width: 'auto' }} />
        </Link>
        <Link href="/dashboard" style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none' }}>← Back to Dashboard</Link>
      </nav>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="tag tag-cyan" style={{ display: 'inline-flex', marginBottom: 16 }}>🎯 Interview Setup</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            Configure Your <span className="gradient-text">Interview Session</span>
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>Set up your profile and preferences for the AI interview</p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Interview Mode Selector */}
          <div className="glass-card" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>🎬 Interview Mode *</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button type="button" onClick={() => setInterviewMode('text')} style={{
                padding: 24, borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.3s ease', fontFamily: 'Inter, sans-serif',
                background: interviewMode === 'text' ? 'linear-gradient(135deg, rgba(0,212,255,0.12), rgba(79,70,229,0.12))' : 'var(--bg-secondary)',
                border: interviewMode === 'text' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
              }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: interviewMode === 'text' ? 'var(--accent-cyan)' : 'var(--text-primary)', marginBottom: 4 }}>Text Chat</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>Type your answers in a chat-based interface</div>
              </button>
              <button type="button" onClick={() => setInterviewMode('video')} style={{
                padding: 24, borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.3s ease', fontFamily: 'Inter, sans-serif',
                background: interviewMode === 'video' ? 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(0,212,255,0.12))' : 'var(--bg-secondary)',
                border: interviewMode === 'video' ? '2px solid var(--accent-green)' : '1px solid var(--border-color)',
              }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🎥</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: interviewMode === 'video' ? 'var(--accent-green)' : 'var(--text-primary)', marginBottom: 4 }}>Video Interview</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>Camera + Voice with speech-to-text AI</div>
              </button>
            </div>
            {interviewMode === 'video' && (
              <div style={{ marginTop: 14, padding: '10px 16px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 12, color: 'var(--accent-green)', lineHeight: 1.5 }}>
                📷 Camera & Microphone required • AI reads questions aloud • Your speech is transcribed & evaluated in real-time
              </div>
            )}
          </div>

          {/* Name */}
          <div className="glass-card" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>👤 Your Name</h3>
            <input className="input-field" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} />
          </div>

          {/* Resume Upload */}
          <div className="glass-card" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>📄 Resume Upload</h3>
            <div
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragActive ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                borderRadius: 12, padding: 40, textAlign: 'center', cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: dragActive ? 'rgba(0,212,255,0.05)' : 'transparent',
              }}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <input id="fileInput" type="file" accept=".txt,.pdf,.doc,.docx" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
              <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>{resumeText ? '✅ Resume uploaded!' : 'Drop your resume here'}</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{resumeText ? `${resumeText.slice(0, 100)}...` : 'TXT format supported • Or click to browse'}</p>
            </div>
          </div>

          {/* Role Selection */}
          <div className="glass-card" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>💼 Target Role *</h3>
            <select className="select-field" value={role} onChange={e => setRole(e.target.value)}>
              <option value="">Select a role...</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Difficulty */}
          <div className="glass-card" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>⚡ Difficulty Level</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              {DIFFICULTIES.map(d => (
                <button key={d.value} type="button" onClick={() => setDifficulty(d.value)} style={{
                  padding: 20, borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.3s ease', fontFamily: 'Inter, sans-serif',
                  background: difficulty === d.value ? 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(79,70,229,0.1))' : 'var(--bg-secondary)',
                  border: difficulty === d.value ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{d.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: difficulty === d.value ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>{d.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <button onClick={handleStart} className="btn-primary" disabled={!isReady || isLoading} style={{
            width: '100%', padding: '18px', fontSize: 18,
            opacity: isReady && !isLoading ? 1 : 0.5,
          }}>
            {isLoading ? '⏳ Preparing Interview...' : interviewMode === 'video' ? '🎥 Start Video Interview' : '💬 Start Text Interview'}
          </button>
        </div>
      </div>
    </div>
  );
}
