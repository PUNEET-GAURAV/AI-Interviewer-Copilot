'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CandidateLoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [interviewUrl, setInterviewUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !interviewUrl) { 
      setError('Please fill all fields'); 
      return; 
    }
    
    try {
      // Validate it's a URL or path
      if (!interviewUrl.includes('/candidate/interview/')) {
         setError('Please enter a valid interview link');
         return;
      }
      
      const urlObj = new URL(interviewUrl, window.location.origin);
      const targetPath = urlObj.pathname + urlObj.search + urlObj.hash;

      localStorage.setItem('user', JSON.stringify({ email, name, role: 'candidate' }));
      localStorage.setItem('userRole', 'candidate');
      router.push(targetPath);
    } catch {
       setError('Invalid URL format');
    }
  };

  return (
    <div className="gradient-bg grid-pattern" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="glass-card" style={{ maxWidth: 440, width: '100%', padding: 44 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-green))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: 'white' }}>👤</div>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Candidate <span style={{ color: 'var(--accent-cyan)' }}>Portal</span></span>
        </Link>

        <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>Access Interview</h2>
        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>
          Enter your details and the link provided by your recruiter
        </p>

        {error && <div style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--accent-red)', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Full Name</label>
            <input className="input-field" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email</label>
            <input className="input-field" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Interview Link</label>
            <input className="input-field" type="url" placeholder="https://.../candidate/interview/..." value={interviewUrl} onChange={e => setInterviewUrl(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: 16, fontSize: 16, marginTop: 8 }}>
            🚀 Start Interview
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-muted)' }}>
          <Link href="/admin/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>Admin Login →</Link>
        </p>
      </div>
    </div>
  );
}

