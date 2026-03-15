'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/firebase/AuthContext';
import { signInWithGoogle, logOut } from '@/lib/firebase/config';

export default function LandingPage() {
  const router = useRouter();
  const [hoveredRole, setHoveredRole] = useState<'admin' | 'candidate' | null>(null);
  const [showCandidatePrompt, setShowCandidatePrompt] = useState(false);
  const [candidateUrl, setCandidateUrl] = useState('');
  const { user, loading } = useAuth();

  const handleSelect = (role: 'admin' | 'candidate') => {
    localStorage.setItem('userRole', role);
    if (role === 'admin') {
      router.push('/admin/login');
    } else {
      setShowCandidatePrompt(true);
    }
  };

  const handleCandidateSubmit = () => {
    if (candidateUrl) {
      const profile = {
        name: 'Candidate',
        role: 'Software Engineer',
        experience: 'Not specified',
        skills: ['General IT'],
        companyStyle: 'Big Tech',
        resumeText: 'Direct entry via URL',
      };
      localStorage.setItem('interviewProfile', JSON.stringify(profile));
      router.push('/interview/video');
    } else {
      router.push('/candidate/login');
    }
  };

  return (
    <div className="gradient-bg grid-pattern" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{ background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="Interview Mate" style={{ height: 40, width: 'auto' }} />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }} className="hide-on-mobile">Intelligent Enterprise Recruitment</span>
          
          <div style={{ height: '24px', width: '1px', background: 'var(--glass-border)' }} className="hide-on-mobile"></div>
          
          {loading ? (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>...</span>
          ) : user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {user.photoURL && <img src={user.photoURL} alt="Avatar" style={{ width: 28, height: 28, borderRadius: '50%' }} />}
                <span className="hide-on-mobile" style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{user.displayName?.split(' ')[0]}</span>
              </div>
              <button onClick={logOut} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12, background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)', border: 'none' }}>Logout</button>
            </div>
          ) : (
            <button onClick={signInWithGoogle} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 14, height: 14 }} />
              Sign in
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        {/* Hero Text */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div className="tag tag-cyan" style={{ display: 'inline-flex', marginBottom: 20, fontSize: 13 }}>🚀 AI-Powered Interview Platform</div>
          <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
            <span className="gradient-text">AI-Powered</span><br />
            Interview Simulation
          </h1>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
            An intelligent enterprise recruitment platform that transforms how companies conduct technical interviews — using adaptive AI, behavioral intelligence, and objective scoring.
          </p>
        </div>

        {/* Role Selection Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28, maxWidth: 760, width: '100%' }}>
          {/* Admin Card */}
          <button
            onClick={() => handleSelect('admin')}
            onMouseEnter={() => setHoveredRole('admin')}
            onMouseLeave={() => setHoveredRole(null)}
            style={{
              padding: 40, borderRadius: 20, cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)', fontFamily: 'Inter, sans-serif',
              background: hoveredRole === 'admin'
                ? 'linear-gradient(135deg, rgba(79,70,229,0.15), rgba(139,92,246,0.1))'
                : 'var(--glass-bg)',
              backdropFilter: 'blur(16px)',
              border: hoveredRole === 'admin' ? '2px solid var(--accent-blue)' : '1px solid var(--glass-border)',
              transform: hoveredRole === 'admin' ? 'translateY(-8px) scale(1.02)' : 'translateY(0)',
              boxShadow: hoveredRole === 'admin' ? '0 20px 60px rgba(79,70,229,0.2)' : '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ width: 60, height: 60, borderRadius: 16, background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 20 }}>🛡️</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Continue as <span style={{ color: 'var(--accent-blue)' }}>Admin</span></h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              Manage interview questions, configure evaluation criteria, review candidate results, and control interview workflows.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Question Bank', 'Evaluation Config', 'Analytics', 'Candidate Reports'].map(tag => (
                <span key={tag} className="tag tag-cyan" style={{ fontSize: 11 }}>{tag}</span>
              ))}
            </div>
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14, color: 'var(--accent-blue)' }}>
              Admin Portal →
            </div>
          </button>

          {/* Candidate Card */}
          <button
            onClick={() => handleSelect('candidate')}
            onMouseEnter={() => setHoveredRole('candidate')}
            onMouseLeave={() => setHoveredRole(null)}
            style={{
              padding: 40, borderRadius: 20, cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)', fontFamily: 'Inter, sans-serif',
              background: hoveredRole === 'candidate'
                ? 'linear-gradient(135deg, rgba(0,212,255,0.12), rgba(16,185,129,0.08))'
                : 'var(--glass-bg)',
              backdropFilter: 'blur(16px)',
              border: hoveredRole === 'candidate' ? '2px solid var(--accent-cyan)' : '1px solid var(--glass-border)',
              transform: hoveredRole === 'candidate' ? 'translateY(-8px) scale(1.02)' : 'translateY(0)',
              boxShadow: hoveredRole === 'candidate' ? '0 20px 60px rgba(0,212,255,0.15)' : '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ width: 60, height: 60, borderRadius: 16, background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-green))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 20 }}>👤</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Continue as <span style={{ color: 'var(--accent-cyan)' }}>Candidate</span></h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              Build your profile, upload resume & certificates, select your expertise area, and take AI-powered mock interviews.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Resume Upload', 'Skills & Certs', 'AI Interview', 'Skill Radar'].map(tag => (
                <span key={tag} className="tag tag-green" style={{ fontSize: 11 }}>{tag}</span>
              ))}
            </div>
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14, color: 'var(--accent-cyan)' }}>
              Candidate Portal →
            </div>
          </button>
        </div>

        {/* Stats Bar */}
        <div className="glass-card" style={{ marginTop: 60, padding: '24px 48px', display: 'flex', gap: 48, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { val: '10K+', label: 'Interviews Simulated', color: 'var(--accent-cyan)' },
            { val: '95%', label: 'Evaluation Accuracy', color: 'var(--accent-green)' },
            { val: '4.8', label: 'Candidate Satisfaction', color: 'var(--accent-blue)' },
            { val: '60%', label: 'Faster Hiring', color: 'var(--accent-amber)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ padding: '20px 32px', borderTop: '1px solid var(--glass-border)', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Built by <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Team RiftCoders</span> • SDS Hackathon 2026
        </p>
      </footer>

      {/* Modal for Paste URL */}
      {showCandidatePrompt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ padding: 40, width: 440, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: 'center' }}>Candidate Access</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>Paste the interview link provided by your admin below to start directly, or continue to setup manually.</p>
            <input 
              className="input-field" 
              placeholder="Paste Interview URL here..." 
              value={candidateUrl} 
              onChange={e => setCandidateUrl(e.target.value)} 
              style={{ width: '100%', padding: 12 }}
            />
            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              <button className="btn-secondary" onClick={() => router.push('/candidate/login')} style={{ flex: 1, padding: 12 }}>Manual Setup</button>
              <button className="btn-primary" onClick={handleCandidateSubmit} style={{ flex: 1, padding: 12 }}>🚀 Start Interview</button>
            </div>
            <button onClick={() => setShowCandidatePrompt(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginTop: 10 }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
