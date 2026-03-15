'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, signInWithGoogle } from '@/lib/firebase/config';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setErrorMsg("Firebase Auth is not initialized properly.");
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem('userRole', 'candidate'); // Default role assumption for standard logins
      router.push('/dashboard');
    } catch (error: any) {
      setErrorMsg(error.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) {
        localStorage.setItem('userRole', 'candidate');
        router.push('/dashboard');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Google Sign-In failed.');
    }
  };

  return (
    <div className="gradient-bg grid-pattern" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Ambient glow */}
      <div style={{ position: 'fixed', top: '20%', left: '30%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.06), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: 440, padding: '48px 40px' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36, justifyContent: 'center' }}>
          <img src="/logo.png" alt="Interview Mate" style={{ height: 40, width: 'auto' }} />
        </Link>

        <h1 style={{ fontSize: 26, fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>Welcome Back</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 32 }}>Sign in to continue your interview journey</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Email</label>
            <input type="email" className="input-field" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Password</label>
            <input type="password" className="input-field" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: 16, opacity: isLoading ? 0.7 : 1 }} disabled={isLoading}>
            {isLoading ? '⏳ Signing In...' : 'Sign In'}
          </button>
        </form>

        {errorMsg && (
          <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--accent-red)', fontSize: 13 }}>
            ❌ {errorMsg}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
        </div>

        <button 
          onClick={handleGoogleSignIn}
          className="btn-secondary" 
          style={{ width: '100%', padding: '12px', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 18, height: 18 }} />
          Sign in with Google
        </button>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
          Don&apos;t have an account? <Link href="/register" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 600 }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
