'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CandidateProfile } from '@/lib/interview-engine';

export default function CandidateInterviewDashboard() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [skills, setSkills] = useState('');
  const [role, setRole] = useState('Software Engineer'); // Give a default role
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [certificateFiles, setCertificateFiles] = useState<FileList | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  useEffect(() => {
    // Check if we came from login with a name and email
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.name) setName(parsed.name);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.role === 'candidate') {
           // We are good
        }
      }
    } catch {
       // Ignore parse error
    }
    setIsValidating(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !resumeText || !skills) {
      setError('Please fill in all details to proceed.');
      return;
    }

    const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);

    if (skillsArray.length === 0) {
       setError('Please enter at least one skill.');
       return;
    }

    let resFileB64 = '';
    if (resumeFile) {
      if (resumeFile.size > 2 * 1024 * 1024) {
        setError('Resume file must be less than 2MB');
        return;
      }
      resFileB64 = await fileToBase64(resumeFile);
    }

    let certFilesB64: string[] = [];
    if (certificateFiles) {
      for (let i = 0; i < certificateFiles.length; i++) {
        if (certificateFiles[i].size > 2 * 1024 * 1024) {
          setError('Each certificate file must be less than 2MB');
          return;
        }
        certFilesB64.push(await fileToBase64(certificateFiles[i]));
      }
    }

    const profile: CandidateProfile = {
      name,
      role: role || 'Software Engineer', // From the admin if possible, but defaulted for now or entered
      experience: 'Not specified',       // Not strictly required for the test if not asked
      skills: skillsArray,
      companyStyle: 'Big Tech',
      resumeText,
      resumeFile: resFileB64 || undefined,
      certificateFiles: certFilesB64.length > 0 ? certFilesB64 : undefined,
    };

    localStorage.setItem('interviewProfile', JSON.stringify(profile));
    
    // Show 5 seconds analyzing screen
    setIsAnalyzing(true);
    setTimeout(() => {
      router.push('/interview/video');
    }, 5000);
  };

  if (isValidating) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>Loading...</div>;

  if (isAnalyzing) {
    return (
      <div className="gradient-bg grid-pattern" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="glass-card animate-scale-in" style={{ maxWidth: 480, width: '100%', padding: '60px 40px', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 24px' }}>
            <div style={{ position: 'absolute', inset: 0, border: '4px solid rgba(139,92,246,0.2)', borderRadius: '50%' }}></div>
            <div style={{ position: 'absolute', inset: 0, border: '4px solid var(--accent-purple)', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1.5s linear infinite' }}></div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📄</div>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Analyzing Your Profile</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Our AI is reviewing your resume, certificates, and skills to tailor the interview questions specifically for you.</p>
          <div style={{ marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>This will take a few seconds...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-bg grid-pattern" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="glass-card" style={{ maxWidth: 640, width: '100%', padding: '40px 44px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.png" alt="Interview Mate" style={{ height: 48, width: 'auto', marginBottom: 16 }} />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Candidate Setup</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Provide your details below to start your AI Video Interview. Ensure your camera and microphone are ready.</p>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--accent-red)', fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div style={{ display: 'flex', gap: 16, flexDirection: 'column' }}>
             {/* If name/email are empty, let them fill it here, otherwise show them pre-filled */}
             <div>
               <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Full Name</label>
               <input className="input-field" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} disabled={!!localStorage.getItem('user')} style={{ opacity: localStorage.getItem('user') ? 0.7 : 1 }} />
             </div>
             
             <div>
               <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email</label>
               <input className="input-field" type="email" placeholder="john@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={!!localStorage.getItem('user')} style={{ opacity: localStorage.getItem('user') ? 0.7 : 1 }} />
             </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Target Role</label>
            <input className="input-field" placeholder="e.g. Software Engineer, Product Manager" value={role} onChange={e => setRole(e.target.value)} />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>This helps AI tailor the questions to your role.</p>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Top Skills (Comma Separated)</label>
            <input className="input-field" placeholder="e.g. React, Node.js, System Design" value={skills} onChange={e => setSkills(e.target.value)} />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Example: Python, Machine Learning, AWS</p>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Resume / Experience Background</label>
            <textarea 
               className="input-field" 
               placeholder="Paste your resume text or describe your background briefly..." 
               value={resumeText} 
               onChange={e => setResumeText(e.target.value)}
               rows={6}
               style={{ resize: 'vertical', marginBottom: 12 }}
            />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>📄 Upload Resume (PDF/Word, max 2MB)</label>
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx"
                  onChange={e => setResumeFile(e.target.files?.[0] || null)}
                  className="input-field" 
                  style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>📜 Upload Certificates (optional, max 2MB each)</label>
                <input 
                  type="file" 
                  multiple 
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={e => setCertificateFiles(e.target.files)}
                  className="input-field" 
                  style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, padding: '16px 20px', borderRadius: 12, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-green)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>🎥 Camera & Mic Required</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>By continuing, you will immediately join the video interview and your camera/microphone will be activated. Please ensure you are in a quiet environment.</p>
          </div>

          <button type="submit" className="btn-primary" style={{ padding: 16, fontSize: 16, fontWeight: 700, marginTop: 8 }}>
            Start Video Interview 🚀
          </button>
        </form>
      </div>
    </div>
  );
}
