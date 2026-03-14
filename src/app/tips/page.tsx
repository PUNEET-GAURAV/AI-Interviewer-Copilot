'use client';

import Link from 'next/link';

const TIPS = [
  {
    category: 'Before the Interview',
    icon: '📋',
    items: [
      { title: 'Research the Company', desc: 'Understand their products, culture, tech stack, and recent news. Tailor your answers to their context.', icon: '🔍' },
      { title: 'Review the Job Description', desc: 'Map your skills to the role requirements. Prepare examples for each listed responsibility.', icon: '📄' },
      { title: 'Practice STAR Method', desc: 'Structure behavioral answers: Situation, Task, Action, Result. Keep answers concise (2-3 min).', icon: '⭐' },
      { title: 'Prepare Your Environment', desc: 'For video interviews: check camera, mic, lighting, and background. Use headphones to reduce echo.', icon: '🎥' },
      { title: 'Review Fundamentals', desc: 'Brush up on core CS concepts, system design patterns, and your primary programming language quirks.', icon: '📚' },
    ],
  },
  {
    category: 'During the Interview',
    icon: '🎯',
    items: [
      { title: 'Think Out Loud', desc: 'Interviewers want to see your thought process. Explain your approach before diving into code.', icon: '💭' },
      { title: 'Ask Clarifying Questions', desc: 'Don\'t assume. Ask about constraints, edge cases, expected inputs, and scale requirements.', icon: '❓' },
      { title: 'Start Simple, Then Optimize', desc: 'Provide a working brute-force solution first, then discuss trade-offs and improvements.', icon: '📈' },
      { title: 'Manage Your Time', desc: 'Watch the clock. For coding: 5 min understand, 5 min plan, 15 min code, 5 min test.', icon: '⏰' },
      { title: 'Stay Calm Under Pressure', desc: 'If stuck, break the problem down. Ask for a hint if needed — that shows collaboration skills.', icon: '🧘' },
      { title: 'Communicate Clearly', desc: 'Use precise language. Avoid filler words. Pause briefly before answering — it shows thoughtfulness.', icon: '🗣️' },
    ],
  },
  {
    category: 'Technical Deep Dive',
    icon: '🛠️',
    items: [
      { title: 'System Design Framework', desc: '1) Requirements → 2) High-level design → 3) Deep dive → 4) Trade-offs → 5) Scale considerations', icon: '🏗️' },
      { title: 'Data Structures Cheat Sheet', desc: 'Arrays (O(1) access), HashMaps (O(1) lookup), Trees (O(log n) search), Graphs (BFS/DFS).', icon: '📊' },
      { title: 'API Design Best Practices', desc: 'RESTful conventions, proper HTTP methods, status codes, versioning, and pagination patterns.', icon: '🔌' },
      { title: 'Database Selection', desc: 'SQL for ACID compliance, NoSQL for flexibility. Consider CAP theorem for distributed systems.', icon: '🗄️' },
    ],
  },
  {
    category: 'Video Interview Tips',
    icon: '🎬',
    items: [
      { title: 'Eye Contact with Camera', desc: 'Look at the camera lens, not the screen. This creates the illusion of direct eye contact.', icon: '👁️' },
      { title: 'Professional Background', desc: 'Use a clean, uncluttered background. Virtual backgrounds are fine if your hardware supports them.', icon: '🖼️' },
      { title: 'Good Lighting', desc: 'Face a window or use a ring light. Avoid backlighting that makes your face appear dark.', icon: '💡' },
      { title: 'Audio Quality Matters', desc: 'Use headphones with a built-in mic. Test your audio before the interview. Reduce background noise.', icon: '🎧' },
      { title: 'Body Language', desc: 'Sit up straight, smile, nod to show engagement. Use hand gestures naturally but keep them in frame.', icon: '💪' },
    ],
  },
];

const COMMON_QUESTIONS = [
  { role: 'All Roles', questions: ['Tell me about yourself', 'Why do you want to work here?', 'Describe a challenge you overcame', 'Where do you see yourself in 5 years?', 'Why should we hire you?'] },
  { role: 'Backend', questions: ['Explain REST vs GraphQL', 'How would you design a rate limiter?', 'Describe database indexing strategies', 'How do you handle API versioning?'] },
  { role: 'Frontend', questions: ['Explain virtual DOM', 'How do you optimize web performance?', 'Describe CSS specificity', 'State management approaches?'] },
  { role: 'System Design', questions: ['Design a URL shortener', 'Design a chat application', 'Design a notification system', 'Design a file storage service'] },
];

export default function TipsPage() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <nav style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: 'white' }}>AI</div>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Interview <span style={{ color: 'var(--accent-cyan)' }}>Copilot</span></span>
        </Link>
        <Link href="/dashboard" style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none' }}>← Dashboard</Link>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            <span className="gradient-text">Interview Preparation Guide</span> 📖
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
            Master your next interview with these expert tips and strategies
          </p>
        </div>

        {/* Tips Sections */}
        {TIPS.map((section, si) => (
          <div key={si} className="glass-card animate-slide-up" style={{ padding: 28, marginBottom: 24, animationDelay: `${si * 0.1}s` }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>{section.icon}</span> {section.category}
            </h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {section.items.map((tip, ti) => (
                <div key={ti} style={{
                  padding: 18, borderRadius: 12,
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                  transition: 'all 0.3s ease',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                    e.currentTarget.style.background = 'rgba(0,212,255,0.03)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = 'var(--bg-secondary)';
                  }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{tip.icon}</span>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>{tip.title}</h4>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Common Questions */}
        <div className="glass-card animate-slide-up" style={{ padding: 28, marginBottom: 24, animationDelay: '0.4s' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            ❓ Common Interview Questions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {COMMON_QUESTIONS.map((group, gi) => (
              <div key={gi} className="glass-card-sm" style={{ padding: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 12 }}>{group.role}</h4>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {group.questions.map((q, qi) => (
                    <li key={qi} style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '6px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--accent-green)', fontSize: 10 }}>●</span> {q}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Link href="/interview/setup">
            <button className="btn-primary" style={{ fontSize: 16, padding: '16px 40px' }}>
              🎯 Start Practice Interview
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
