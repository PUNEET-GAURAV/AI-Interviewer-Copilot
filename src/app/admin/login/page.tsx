'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/AuthContext';
import { signInWithGoogle } from '@/lib/firebase/config';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) {
        localStorage.setItem('user', JSON.stringify({ email: user.email, name: user.displayName, role: 'admin' }));
        localStorage.setItem('userRole', 'admin');
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill all fields'); return; }
    localStorage.setItem('user', JSON.stringify({ email, name: email.split('@')[0], role: 'admin' }));
    localStorage.setItem('userRole', 'admin');
    router.push('/admin/dashboard');
  };

  return (
    <div className="gradient-bg grid-pattern" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="glass-card" style={{ maxWidth: 440, width: '100%', padding: 44 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: 'white' }}>🛡️</div>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Admin <span style={{ color: 'var(--accent-blue)' }}>Portal</span></span>
        </Link>

        <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>Admin Sign In</h2>
        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>Manage interviews, questions & candidates</p>

        {error && <div style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--accent-red)', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Admin Email</label>
            <input className="input-field" type="email" placeholder="admin@company.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Password</label>
            <input className="input-field" type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Admin Code (optional)</label>
            <input className="input-field" placeholder="Organization admin code" value={adminCode} onChange={e => setAdminCode(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: 16, fontSize: 16, marginTop: 8 }}>
            🛡️ Sign In as Admin
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
        </div>

        <button onClick={handleGoogleLogin} className="btn-secondary" style={{ width: '100%', padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'rgba(255,255,255,0.05)' }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 18, height: 18 }} />
          <span>Continue with Google</span>
        </button>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
          Not an admin? <Link href="/candidate/login" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 600 }}>Sign in as Candidate</Link>
        </p>
      </div>
    </div>
  );
}
