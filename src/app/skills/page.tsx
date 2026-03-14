'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { InterviewResult } from '@/lib/interview-engine';

function RadarChart({ skills, size = 300 }: { skills: { skill: string; level: number }[]; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || skills.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 2;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';

    const cx = size / 2, cy = size / 2, maxR = size / 2 - 40;
    const n = skills.length, angleStep = (2 * Math.PI) / n;
    ctx.clearRect(0, 0, size, size);

    // Grid circles
    for (let ring = 1; ring <= 5; ring++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (ring / 5) * maxR, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.stroke();
    }

    // Axes and labels
    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(skills[i].skill, cx + (maxR + 22) * Math.cos(angle), cy + (maxR + 22) * Math.sin(angle));
    }

    // Data shape
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const r = (skills[i].level / 100) * maxR;
      if (i === 0) ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
      else ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    }
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, 'rgba(0, 212, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(79, 70, 229, 0.2)');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dots
    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const r = (skills[i].level / 100) * maxR;
      ctx.beginPath();
      ctx.arc(cx + r * Math.cos(angle), cy + r * Math.sin(angle), 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#00d4ff';
      ctx.fill();
    }
  }, [skills, size]);

  return <canvas ref={canvasRef} />;
}

const DEFAULT_SKILLS = [
  { skill: 'Problem Solving', level: 78 },
  { skill: 'System Design', level: 85 },
  { skill: 'Communication', level: 72 },
  { skill: 'Technical Depth', level: 88 },
  { skill: 'Code Quality', level: 80 },
  { skill: 'Adaptability', level: 75 },
];

export default function SkillsPage() {
  const [skills, setSkills] = useState(DEFAULT_SKILLS);
  const [role, setRole] = useState('Software Engineer');

  useEffect(() => {
    const saved = localStorage.getItem('lastInterviewResult');
    if (saved) {
      const result: InterviewResult = JSON.parse(saved);
      if (result.skillMap?.length > 0) setSkills(result.skillMap);
      setRole(result.candidateProfile?.role || 'Software Engineer');
    }
  }, []);

  const avgLevel = Math.round(skills.reduce((s, sk) => s + sk.level, 0) / skills.length);
  const topSkill = skills.reduce((a, b) => a.level > b.level ? a : b);
  const weakSkill = skills.reduce((a, b) => a.level < b.level ? a : b);

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <nav style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="Interview Mate" style={{ height: 32, width: 'auto' }} />
        </Link>
        <Link href="/dashboard" style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none' }}>← Dashboard</Link>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="tag tag-cyan" style={{ display: 'inline-flex', marginBottom: 16 }}>📈 Skill Analysis</div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}><span className="gradient-text">Competency Radar</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>{role} — Skill proficiency from interviews</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28 }}>
          <div className="glass-card glow-cyan" style={{ padding: 32, display: 'flex', justifyContent: 'center' }}>
            <RadarChart skills={skills} size={320} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="glass-card" style={{ padding: 20 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Average</div>
                <div className="gradient-text" style={{ fontSize: 28, fontWeight: 800 }}>{avgLevel}%</div>
              </div>
              <div className="glass-card" style={{ padding: 20 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Top Skill</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-green)' }}>🏆 {topSkill.skill}</div>
              </div>
            </div>
            {skills.map(sk => (
              <div key={sk.skill} className="glass-card-sm" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{sk.skill}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: sk.level >= 80 ? 'var(--accent-green)' : sk.level >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>{sk.level}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${sk.level}%`, background: sk.level >= 80 ? 'linear-gradient(90deg, var(--accent-green), var(--accent-cyan))' : 'linear-gradient(90deg, var(--accent-amber), var(--accent-cyan))' }} />
                </div>
              </div>
            ))}
            <div className="glass-card-sm" style={{ padding: 20 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-amber)', marginBottom: 8 }}>📝 Focus Area</h4>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Strengthen <strong style={{ color: 'var(--text-primary)' }}>{weakSkill.skill}</strong> with targeted practice.</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 40 }}>
          <Link href="/interview/results" className="btn-secondary" style={{ padding: '12px 28px' }}>📊 Results</Link>
          <Link href="/interview/setup" className="btn-primary" style={{ padding: '12px 28px' }}>🔄 Practice More</Link>
        </div>
      </div>
    </div>
  );
}
