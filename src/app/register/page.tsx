'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, signInWithGoogle } from '@/lib/firebase/config';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'candidate' });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setErrorMsg('Firebase Auth is not initialized properly.');
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      // 1. Create the user
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // 2. Update their display name
      await updateProfile(userCredential.user, { displayName: formData.name });
      
      // 3. Temporarily store role in localStorage (or switch to Firestore later)
      localStorage.setItem('userRole', formData.role);
      
      // 4. Redirect
      router.push('/dashboard');
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to create an account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) {
        localStorage.setItem('userRole', formData.role);
        router.push('/dashboard');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Google Sign-In Failed');
    }
  };

  const update = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div className="gradient-bg grid-pattern" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'fixed', bottom: '20%', right: '20%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.06), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: 440, padding: '48px 40px' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36, justifyContent: 'center' }}>
          <img src="/logo.png" alt="Interview Mate" style={{ height: 40, width: 'auto' }} />
        </Link>

        <h1 style={{ fontSize: 26, fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>Create Account</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 32 }}>Join the AI-powered interview revolution</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Full Name</label>
            <input type="text" className="input-field" placeholder="Puneet Gaurav" value={formData.name} onChange={e => update('name', e.target.value)} required />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Email</label>
            <input type="email" className="input-field" placeholder="your@email.com" value={formData.email} onChange={e => update('email', e.target.value)} required />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Password</label>
            <input type="password" className="input-field" placeholder="Create a strong password" value={formData.password} onChange={e => update('password', e.target.value)} required />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>I am a</label>
            <div style={{ display: 'flex', gap: 12 }}>
              {['candidate', 'hr_admin'].map(role => (
                <button key={role} type="button" onClick={() => update('role', role)} style={{
                  flex: 1, padding: '14px', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.3s ease',
                  background: formData.role === role ? 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(79,70,229,0.15))' : 'var(--bg-secondary)',
                  border: formData.role === role ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                  color: formData.role === role ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                }}>
                  {role === 'candidate' ? '👤 Candidate' : '🏢 HR Admin'}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: 16, opacity: isLoading ? 0.7 : 1 }} disabled={isLoading}>
            {isLoading ? '⏳ Creating Account...' : 'Create Account'}
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
          Sign up with Google
        </button>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
