'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'candidate' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      localStorage.setItem('user', JSON.stringify({ name: formData.name, email: formData.email, role: formData.role }));
      router.push('/dashboard');
    }, 800);
  };

  const update = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div className="gradient-bg grid-pattern" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'fixed', bottom: '20%', right: '20%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.06), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: 440, padding: '48px 40px' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, color: 'white' }}>AI</div>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Interview <span style={{ color: 'var(--accent-cyan)' }}>Copilot</span></span>
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

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
