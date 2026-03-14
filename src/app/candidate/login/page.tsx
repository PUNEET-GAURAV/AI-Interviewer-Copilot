'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CandidateLoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isRegister && !name)) { setError('Please fill all fields'); return; }
    localStorage.setItem('user', JSON.stringify({ email, name: name || email.split('@')[0], role: 'candidate' }));
    localStorage.setItem('userRole', 'candidate');
    router.push('/candidate/profile');
  };

  return (
    <div className="gradient-bg grid-pattern" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="glass-card" style={{ maxWidth: 440, width: '100%', padding: 44 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-green))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: 'white' }}>👤</div>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Candidate <span style={{ color: 'var(--accent-cyan)' }}>Portal</span></span>
        </Link>

        <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>
          {isRegister ? 'Set up your candidate profile' : 'Sign in to continue your journey'}
        </p>

        {error && <div style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--accent-red)', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {isRegister && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Full Name</label>
              <input className="input-field" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email</label>
            <input className="input-field" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Password</label>
            <input className="input-field" type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: 16, fontSize: 16, marginTop: 8 }}>
            {isRegister ? '🚀 Create Account' : '👤 Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => { setIsRegister(!isRegister); setError(''); }} style={{ color: 'var(--accent-cyan)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter' }}>
            {isRegister ? 'Sign In' : 'Register'}
          </button>
        </p>
        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
          <Link href="/admin/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>Sign in as Admin →</Link>
        </p>
      </div>
    </div>
  );
}
