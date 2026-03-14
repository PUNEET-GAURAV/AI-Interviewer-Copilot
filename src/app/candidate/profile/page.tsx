'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const INTERVIEW_FIELDS = [
  { value: 'Backend Engineer', icon: '⚙️', desc: 'APIs, databases, system design' },
  { value: 'Frontend Engineer', icon: '🎨', desc: 'React, performance, UI/UX' },
  { value: 'Full Stack Engineer', icon: '🔄', desc: 'End-to-end development' },
  { value: 'Data Scientist', icon: '📊', desc: 'ML, statistics, analytics' },
  { value: 'Product Manager', icon: '📋', desc: 'Strategy, roadmaps, metrics' },
  { value: 'DevOps Engineer', icon: '🚀', desc: 'CI/CD, cloud, infrastructure' },
  { value: 'ML Engineer', icon: '🤖', desc: 'Deep learning, MLOps, models' },
  { value: 'Mobile Developer', icon: '📱', desc: 'iOS, Android, React Native' },
  { value: 'Security Engineer', icon: '🔐', desc: 'AppSec, pentesting, compliance' },
];

const EXPERTISE_AREAS = [
  'JavaScript/TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#',
  'React', 'Next.js', 'Vue.js', 'Angular', 'Node.js', 'Django', 'Spring Boot',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes',
  'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API',
  'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision',
  'System Design', 'Microservices', 'CI/CD', 'Agile/Scrum',
];

interface CandidateData {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  experience: string;
  education: string;
  interviewField: string;
  expertiseAreas: string[];
  skills: string[];
  certifications: string[];
  qualifications: string;
  resumeText: string;
  companyStyle: string;
}

export default function CandidateProfilePage() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  const [data, setData] = useState<CandidateData>({
    name: '', email: '', phone: '', linkedin: '',
    experience: '', education: '', interviewField: '',
    expertiseAreas: [], skills: [], certifications: [],
    qualifications: '', resumeText: '', companyStyle: 'FAANG',
  });

  const [newSkill, setNewSkill] = useState('');
  const [newCert, setNewCert] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const profileStr = localStorage.getItem('candidateProfile');
    if (profileStr) {
      try { setData(JSON.parse(profileStr)); } catch { /* ignore */ }
    } else if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setData(prev => ({ ...prev, name: u.name || '', email: u.email || '' }));
      } catch { /* ignore */ }
    }
  }, []);

  const update = (key: keyof CandidateData, val: string | string[]) => {
    setData(prev => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const addSkill = () => {
    if (!newSkill.trim() || data.skills.includes(newSkill.trim())) return;
    update('skills', [...data.skills, newSkill.trim()]);
    setNewSkill('');
  };

  const removeSkill = (s: string) => update('skills', data.skills.filter(x => x !== s));

  const addCert = () => {
    if (!newCert.trim()) return;
    update('certifications', [...data.certifications, newCert.trim()]);
    setNewCert('');
  };

  const removeCert = (c: string) => update('certifications', data.certifications.filter(x => x !== c));

  const toggleExpertise = (area: string) => {
    if (data.expertiseAreas.includes(area)) {
      update('expertiseAreas', data.expertiseAreas.filter(a => a !== area));
    } else {
      update('expertiseAreas', [...data.expertiseAreas, area]);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => { update('resumeText', (e.target?.result as string).slice(0, 3000)); };
    reader.readAsText(file);
  };

  const handleSave = () => {
    localStorage.setItem('candidateProfile', JSON.stringify(data));
    // Also store as interviewProfile for the interview engine
    localStorage.setItem('interviewProfile', JSON.stringify({
      name: data.name || 'Candidate',
      role: data.interviewField || 'Full Stack Engineer',
      experience: data.experience || '2 years',
      skills: data.skills,
      companyStyle: data.companyStyle || 'FAANG',
      resumeText: data.resumeText,
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const isReady = data.name && data.interviewField;

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-green))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: 'white' }}>👤</div>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Candidate <span style={{ color: 'var(--accent-cyan)' }}>Portal</span></span>
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>Dashboard</Link>
          <Link href="/tips" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>Tips</Link>
          <Link href="/leaderboard" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>Leaderboard</Link>
          <Link href="/" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>Logout</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 850, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
            <span className="gradient-text">Your Profile</span> 👤
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Complete your profile to get personalized interview questions</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Personal Info */}
          <div className="glass-card animate-slide-up" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>📇 Personal Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Full Name *</label>
                <input className="input-field" placeholder="Your full name" value={data.name} onChange={e => update('name', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Email</label>
                <input className="input-field" type="email" placeholder="your@email.com" value={data.email} onChange={e => update('email', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Phone</label>
                <input className="input-field" placeholder="+91 98765 43210" value={data.phone} onChange={e => update('phone', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>LinkedIn Profile</label>
                <input className="input-field" placeholder="linkedin.com/in/yourname" value={data.linkedin} onChange={e => update('linkedin', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Education & Experience */}
          <div className="glass-card animate-slide-up" style={{ padding: 28, animationDelay: '0.1s' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>🎓 Education & Experience</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Experience</label>
                <input className="input-field" placeholder="e.g., 3 years in software development" value={data.experience} onChange={e => update('experience', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Education</label>
                <input className="input-field" placeholder="e.g., B.Tech CSE from IIT Delhi" value={data.education} onChange={e => update('education', e.target.value)} />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Additional Qualifications</label>
              <textarea className="input-field" rows={3} placeholder="Any relevant qualifications, courses, or achievements..." value={data.qualifications} onChange={e => update('qualifications', e.target.value)} style={{ resize: 'vertical' }} />
            </div>
          </div>

          {/* Resume Upload */}
          <div className="glass-card animate-slide-up" style={{ padding: 28, animationDelay: '0.15s' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>📄 Resume Upload</h3>
            <div
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={e => { e.preventDefault(); setDragActive(false); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
              onClick={() => document.getElementById('resumeUpload')?.click()}
              style={{
                border: `2px dashed ${dragActive ? 'var(--accent-cyan)' : data.resumeText ? 'var(--accent-green)' : 'var(--border-color)'}`,
                borderRadius: 12, padding: 32, textAlign: 'center', cursor: 'pointer',
                background: dragActive ? 'rgba(0,212,255,0.05)' : data.resumeText ? 'rgba(16,185,129,0.03)' : 'transparent',
                transition: 'all 0.3s ease',
              }}>
              <input id="resumeUpload" type="file" accept=".txt,.pdf,.doc,.docx" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
              <div style={{ fontSize: 32, marginBottom: 8 }}>{data.resumeText ? '✅' : '📁'}</div>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>{data.resumeText ? 'Resume uploaded successfully!' : 'Drop your resume here'}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{data.resumeText ? `${data.resumeText.slice(0, 80)}...` : 'TXT format • Or click to browse'}</p>
            </div>
          </div>

          {/* Interview Field Selection */}
          <div className="glass-card animate-slide-up" style={{ padding: 28, animationDelay: '0.2s' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>🎯 Interview Field *</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>Which field do you want to give your interview in?</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
              {INTERVIEW_FIELDS.map(f => (
                <button key={f.value} type="button" onClick={() => update('interviewField', f.value)} style={{
                  padding: 18, borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.3s ease', fontFamily: 'Inter, sans-serif',
                  background: data.interviewField === f.value ? 'linear-gradient(135deg, rgba(0,212,255,0.12), rgba(16,185,129,0.08))' : 'var(--bg-secondary)',
                  border: data.interviewField === f.value ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                  transform: data.interviewField === f.value ? 'scale(1.02)' : 'scale(1)',
                }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: data.interviewField === f.value ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>{f.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="glass-card animate-slide-up" style={{ padding: 28, animationDelay: '0.25s' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>🛠️ Skills</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input className="input-field" placeholder="Add a skill (e.g., React, Python, AWS)" value={newSkill} onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                style={{ flex: 1 }} />
              <button onClick={addSkill} className="btn-primary" style={{ padding: '12px 20px', fontSize: 13 }}>Add</button>
            </div>
            {data.skills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {data.skills.map(s => (
                  <span key={s} className="tag tag-cyan" style={{ padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => removeSkill(s)}>
                    {s} <span style={{ fontSize: 10, opacity: 0.6 }}>✕</span>
                  </span>
                ))}
              </div>
            )}
            {/* Quick expertise selection */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, marginTop: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>Quick Add — Area of Expertise:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {EXPERTISE_AREAS.map(area => (
                  <button key={area} onClick={() => toggleExpertise(area)} style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'Inter',
                    border: 'none', transition: 'all 0.2s ease',
                    background: data.expertiseAreas.includes(area) ? 'rgba(0,212,255,0.15)' : 'var(--bg-secondary)',
                    color: data.expertiseAreas.includes(area) ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    fontWeight: data.expertiseAreas.includes(area) ? 600 : 400,
                  }}>
                    {data.expertiseAreas.includes(area) ? '✓ ' : ''}{area}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="glass-card animate-slide-up" style={{ padding: 28, animationDelay: '0.3s' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>🏅 Certifications & Courses</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input className="input-field" placeholder="e.g., AWS Solutions Architect, Google Cloud Professional" value={newCert} onChange={e => setNewCert(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCert(); } }}
                style={{ flex: 1 }} />
              <button onClick={addCert} className="btn-primary" style={{ padding: '12px 20px', fontSize: 13 }}>Add</button>
            </div>
            {data.certifications.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.certifications.map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderRadius: 10, background: 'var(--bg-secondary)' }}>
                    <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--accent-green)' }}>🏅</span> {c}
                    </span>
                    <button onClick={() => removeCert(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)', fontSize: 12, fontFamily: 'Inter' }}>✕</button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No certifications added yet</p>
            )}
          </div>

          {/* Company Style */}
          <div className="glass-card animate-slide-up" style={{ padding: 28, animationDelay: '0.35s' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>🏢 Preferred Company Style</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { value: 'FAANG', label: '🏢 FAANG', desc: 'Algorithmic & System Design' },
                { value: 'Startup', label: '🚀 Startup', desc: 'Practical & Product thinking' },
                { value: 'Enterprise', label: '🏛️ Enterprise', desc: 'Process & Domain expertise' },
              ].map(cs => (
                <button key={cs.value} type="button" onClick={() => update('companyStyle', cs.value)} style={{
                  padding: 18, borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                  fontFamily: 'Inter', transition: 'all 0.3s ease',
                  background: data.companyStyle === cs.value ? 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(79,70,229,0.1))' : 'var(--bg-secondary)',
                  border: data.companyStyle === cs.value ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: data.companyStyle === cs.value ? 'var(--accent-cyan)' : 'var(--text-primary)', marginBottom: 4 }}>{cs.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cs.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleSave} className="btn-primary" style={{ flex: 1, padding: 16, fontSize: 16 }}>
              {saved ? '✅ Profile Saved!' : '💾 Save Profile'}
            </button>
            <button onClick={() => { handleSave(); router.push('/interview/setup'); }}
              disabled={!isReady}
              className="btn-secondary" style={{ flex: 1, padding: 16, fontSize: 16, opacity: isReady ? 1 : 0.4 }}>
              🎯 Start Interview →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
