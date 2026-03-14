'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CustomQuestion {
  id: string;
  category: string;
  role: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  expectedTopics: string[];
  round: string;
}

const ROUNDS = ['intro', 'technical', 'advanced', 'behavioral', 'wrapup'];
const ROLES = ['Backend Engineer', 'Frontend Engineer', 'Full Stack Engineer', 'Data Scientist', 'Product Manager', 'DevOps Engineer', 'ML Engineer', 'Security Engineer', 'Mobile Developer'];
const CATEGORIES = ['Technical', 'System Design', 'Behavioral', 'Problem Solving', 'Communication', 'Leadership', 'Domain Knowledge'];

const DEFAULT_QUESTIONS: CustomQuestion[] = [
  { id: '1', category: 'Technical', role: 'Backend Engineer', difficulty: 'medium', question: 'Explain the differences between SQL and NoSQL databases. When would you choose one over the other?', expectedTopics: ['ACID', 'CAP theorem', 'scalability'], round: 'technical' },
  { id: '2', category: 'System Design', role: 'Backend Engineer', difficulty: 'hard', question: 'Design a rate limiter for an API gateway that handles 10K requests per second.', expectedTopics: ['token bucket', 'sliding window', 'distributed systems'], round: 'advanced' },
  { id: '3', category: 'Behavioral', role: 'All', difficulty: 'easy', question: 'Tell me about a time you had a conflict with a teammate. How did you resolve it?', expectedTopics: ['communication', 'conflict resolution', 'teamwork'], round: 'behavioral' },
  { id: '4', category: 'Technical', role: 'Frontend Engineer', difficulty: 'medium', question: 'Explain the virtual DOM in React. How does reconciliation work?', expectedTopics: ['diffing algorithm', 'fiber', 'performance'], round: 'technical' },
  { id: '5', category: 'Problem Solving', role: 'Data Scientist', difficulty: 'hard', question: 'How would you handle severe class imbalance in a fraud detection model?', expectedTopics: ['SMOTE', 'oversampling', 'cost-sensitive learning', 'precision-recall'], round: 'advanced' },
];

export default function AdminDashboardPage() {
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState('All');
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [tab, setTab] = useState<'questions' | 'settings' | 'analytics'>('questions');

  // Form state
  const [formQuestion, setFormQuestion] = useState('');
  const [formCategory, setFormCategory] = useState('Technical');
  const [formRole, setFormRole] = useState('Backend Engineer');
  const [formDifficulty, setFormDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [formTopics, setFormTopics] = useState('');
  const [formRound, setFormRound] = useState('technical');

  // Settings state
  const [interviewDuration, setInterviewDuration] = useState('45');
  const [questionsPerRound, setQuestionsPerRound] = useState('3');
  const [passingScore, setPassingScore] = useState('70');
  const [enableVideo, setEnableVideo] = useState(true);
  const [enableCodeEditor, setEnableCodeEditor] = useState(true);
  const [evaluationStrictness, setEvaluationStrictness] = useState('balanced');

  useEffect(() => {
    const saved = localStorage.getItem('adminQuestions');
    if (saved) {
      try { setQuestions(JSON.parse(saved)); } catch { setQuestions(DEFAULT_QUESTIONS); }
    } else {
      setQuestions(DEFAULT_QUESTIONS);
    }
  }, []);

  const saveQuestions = (qs: CustomQuestion[]) => {
    setQuestions(qs);
    localStorage.setItem('adminQuestions', JSON.stringify(qs));
  };

  const resetForm = () => {
    setFormQuestion(''); setFormCategory('Technical'); setFormRole('Backend Engineer');
    setFormDifficulty('medium'); setFormTopics(''); setFormRound('technical');
    setEditId(null); setShowForm(false);
  };

  const handleSave = () => {
    if (!formQuestion.trim()) return;
    const q: CustomQuestion = {
      id: editId || crypto.randomUUID(),
      question: formQuestion,
      category: formCategory,
      role: formRole,
      difficulty: formDifficulty,
      expectedTopics: formTopics.split(',').map(t => t.trim()).filter(Boolean),
      round: formRound,
    };
    if (editId) {
      saveQuestions(questions.map(x => x.id === editId ? q : x));
    } else {
      saveQuestions([...questions, q]);
    }
    resetForm();
  };

  const handleEdit = (q: CustomQuestion) => {
    setFormQuestion(q.question); setFormCategory(q.category); setFormRole(q.role);
    setFormDifficulty(q.difficulty); setFormTopics(q.expectedTopics.join(', ')); setFormRound(q.round);
    setEditId(q.id); setShowForm(true);
  };

  const handleDelete = (id: string) => {
    saveQuestions(questions.filter(q => q.id !== id));
  };

  const filtered = questions.filter(q => {
    const matchRole = filterRole === 'All' || q.role === filterRole || q.role === 'All';
    const matchDiff = filterDifficulty === 'All' || q.difficulty === filterDifficulty;
    return matchRole && matchDiff;
  });

  const roleCounts = ROLES.map(r => ({ role: r, count: questions.filter(q => q.role === r || q.role === 'All').length }));

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: 'white' }}>🛡️</div>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Admin <span style={{ color: 'var(--accent-blue)' }}>Dashboard</span></span>
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/enterprise" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>HR View</Link>
          <Link href="/" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>Logout</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '30px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
            <span className="gradient-text">Admin Control Panel</span> 🛡️
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Manage questions, settings & interview configuration</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'var(--bg-secondary)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
          {[
            { key: 'questions', label: '📝 Question Bank', count: questions.length },
            { key: 'settings', label: '⚙️ Settings' },
            { key: 'analytics', label: '📊 Analytics' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)} style={{
              padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
              fontFamily: 'Inter', transition: 'all 0.2s ease',
              background: tab === t.key ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' : 'transparent',
              color: tab === t.key ? 'white' : 'var(--text-secondary)',
            }}>
              {t.label} {'count' in t ? `(${t.count})` : ''}
            </button>
          ))}
        </div>

        {/* Question Bank Tab */}
        {tab === 'questions' && (
          <>
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Total Questions', val: questions.length, icon: '📝', color: 'var(--accent-cyan)' },
                { label: 'Easy', val: questions.filter(q => q.difficulty === 'easy').length, icon: '🌱', color: 'var(--accent-green)' },
                { label: 'Medium', val: questions.filter(q => q.difficulty === 'medium').length, icon: '⚡', color: 'var(--accent-amber)' },
                { label: 'Hard', val: questions.filter(q => q.difficulty === 'hard').length, icon: '🔥', color: 'var(--accent-red)' },
              ].map(s => (
                <div key={s.label} className="glass-card" style={{ padding: 20 }}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                  <div style={{ fontSize: 24, fontWeight: 800, color: s.color, marginTop: 6 }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filters & Add Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select className="select-field" value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ width: 200, padding: '8px 14px', fontSize: 13 }}>
                  <option value="All">All Roles</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select className="select-field" value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)} style={{ width: 140, padding: '8px 14px', fontSize: 13 }}>
                  <option value="All">All Difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary" style={{ padding: '10px 24px', fontSize: 13 }}>
                + Add Question
              </button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
              <div className="glass-card" style={{ padding: 28, marginBottom: 24, border: '1px solid var(--accent-blue)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{editId ? '✏️ Edit Question' : '➕ New Question'}</h3>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Question *</label>
                    <textarea className="input-field" rows={3} placeholder="Enter the interview question..." value={formQuestion} onChange={e => setFormQuestion(e.target.value)} style={{ resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Category</label>
                      <select className="select-field" value={formCategory} onChange={e => setFormCategory(e.target.value)} style={{ padding: '10px 14px', fontSize: 13 }}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Target Role</label>
                      <select className="select-field" value={formRole} onChange={e => setFormRole(e.target.value)} style={{ padding: '10px 14px', fontSize: 13 }}>
                        <option value="All">All Roles</option>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Difficulty</label>
                      <select className="select-field" value={formDifficulty} onChange={e => setFormDifficulty(e.target.value as 'easy' | 'medium' | 'hard')} style={{ padding: '10px 14px', fontSize: 13 }}>
                        <option value="easy">🌱 Easy</option>
                        <option value="medium">⚡ Medium</option>
                        <option value="hard">🔥 Hard</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Interview Round</label>
                      <select className="select-field" value={formRound} onChange={e => setFormRound(e.target.value)} style={{ padding: '10px 14px', fontSize: 13 }}>
                        {ROUNDS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Expected Topics (comma-separated)</label>
                    <input className="input-field" placeholder="e.g., scalability, caching, load balancing" value={formTopics} onChange={e => setFormTopics(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={resetForm} className="btn-secondary" style={{ padding: '10px 24px', fontSize: 13 }}>Cancel</button>
                    <button onClick={handleSave} className="btn-primary" style={{ padding: '10px 24px', fontSize: 13 }}>
                      {editId ? '💾 Update' : '➕ Add Question'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Questions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(q => (
                <div key={q.id} className="glass-card-sm" style={{ padding: '18px 22px', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(79,70,229,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--glass-border)')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5, marginBottom: 10 }}>{q.question}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        <span className="tag tag-cyan" style={{ fontSize: 10, padding: '2px 8px' }}>{q.role}</span>
                        <span className={`tag ${q.difficulty === 'hard' ? 'tag-amber' : q.difficulty === 'medium' ? 'tag-cyan' : 'tag-green'}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                          {q.difficulty}
                        </span>
                        <span className="tag" style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(139,92,246,0.1)', color: 'var(--accent-purple)', border: '1px solid rgba(139,92,246,0.2)' }}>{q.category}</span>
                        <span className="tag" style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(100,116,139,0.1)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>{q.round}</span>
                      </div>
                      {q.expectedTopics.length > 0 && (
                        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                          Topics: {q.expectedTopics.join(' • ')}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginTop: 2 }}>
                      <button onClick={() => handleEdit(q)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter' }}>✏️</button>
                      <button onClick={() => handleDelete(q.id)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', color: 'var(--accent-red)', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter' }}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Role Coverage */}
            <div className="glass-card" style={{ padding: 24, marginTop: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>📋 Role Coverage</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                {roleCounts.map(rc => (
                  <div key={rc.role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: 'var(--bg-secondary)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{rc.role}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: rc.count > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>{rc.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="glass-card" style={{ padding: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>⏱️ Interview Configuration</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Max Duration (minutes)</label>
                  <input className="input-field" type="number" value={interviewDuration} onChange={e => setInterviewDuration(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Questions per Round</label>
                  <input className="input-field" type="number" value={questionsPerRound} onChange={e => setQuestionsPerRound(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Passing Score (%)</label>
                  <input className="input-field" type="number" value={passingScore} onChange={e => setPassingScore(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>🎛️ Feature Toggles</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'Video Interview Mode', desc: 'Allow candidates to use webcam + speech-to-text', enabled: enableVideo, toggle: () => setEnableVideo(!enableVideo) },
                  { label: 'Code Editor in Interview', desc: 'Show code editor for technical coding questions', enabled: enableCodeEditor, toggle: () => setEnableCodeEditor(!enableCodeEditor) },
                ].map(feat => (
                  <div key={feat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderRadius: 12, background: 'var(--bg-secondary)' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{feat.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{feat.desc}</div>
                    </div>
                    <button onClick={feat.toggle} style={{
                      width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                      background: feat.enabled ? 'var(--accent-green)' : 'var(--border-color)',
                      position: 'relative', transition: 'all 0.3s ease',
                    }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', background: 'white',
                        position: 'absolute', top: 3,
                        left: feat.enabled ? 27 : 3, transition: 'left 0.3s ease',
                      }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card" style={{ padding: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>🎯 Evaluation Strictness</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { key: 'lenient', label: 'Lenient', desc: 'Focus on core concepts', icon: '🟢' },
                  { key: 'balanced', label: 'Balanced', desc: 'Standard evaluation', icon: '🟡' },
                  { key: 'strict', label: 'Strict', desc: 'Production-grade rigor', icon: '🔴' },
                ].map(s => (
                  <button key={s.key} onClick={() => setEvaluationStrictness(s.key)} style={{
                    padding: 20, borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                    fontFamily: 'Inter', border: evaluationStrictness === s.key ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)',
                    background: evaluationStrictness === s.key ? 'rgba(79,70,229,0.1)' : 'var(--bg-secondary)',
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: evaluationStrictness === s.key ? 'var(--accent-blue)' : 'var(--text-primary)' }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-primary" onClick={() => {
              localStorage.setItem('adminSettings', JSON.stringify({ interviewDuration, questionsPerRound, passingScore, enableVideo, enableCodeEditor, evaluationStrictness }));
              alert('Settings saved!');
            }} style={{ alignSelf: 'flex-end', padding: '12px 32px' }}>
              💾 Save Settings
            </button>
          </div>
        )}

        {/* Analytics Tab */}
        {tab === 'analytics' && (
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              {[
                { label: 'Total Interviews', val: '156', icon: '📋', color: 'var(--accent-cyan)' },
                { label: 'Avg Score', val: '74/100', icon: '📊', color: 'var(--accent-green)' },
                { label: 'Pass Rate', val: '68%', icon: '✅', color: 'var(--accent-amber)' },
                { label: 'Video Interviews', val: '42', icon: '🎥', color: 'var(--accent-blue)' },
              ].map(s => (
                <div key={s.label} className="glass-card" style={{ padding: 22 }}>
                  <span style={{ fontSize: 22 }}>{s.icon}</span>
                  <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginTop: 6 }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div className="glass-card" style={{ padding: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>📈 Score Distribution by Role</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { role: 'Backend Engineer', avg: 78, count: 45 },
                  { role: 'Frontend Engineer', avg: 72, count: 38 },
                  { role: 'Data Scientist', avg: 81, count: 22 },
                  { role: 'Product Manager', avg: 69, count: 28 },
                  { role: 'DevOps Engineer', avg: 74, count: 23 },
                ].map(r => (
                  <div key={r.role} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ width: 160, fontSize: 13, color: 'var(--text-secondary)', flexShrink: 0 }}>{r.role}</span>
                    <div style={{ flex: 1 }}>
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{
                          width: `${r.avg}%`,
                          background: r.avg >= 75 ? 'linear-gradient(90deg, var(--accent-green), var(--accent-cyan))' : 'linear-gradient(90deg, var(--accent-amber), var(--accent-cyan))',
                        }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: r.avg >= 75 ? 'var(--accent-green)' : 'var(--accent-amber)', width: 36 }}>{r.avg}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 50 }}>{r.count} tests</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
