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
  
  // Analytics State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [history, setHistory] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [analytics, setAnalytics] = useState({
    total: 0,
    avgScore: 0,
    passRate: 0,
    videoCount: 0,
    byRole: {} as Record<string, { count: number; scoreSum: number }>
  });

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
  const [enableFillerAnalysis, setEnableFillerAnalysis] = useState(true);
  const [evaluationStrictness, setEvaluationStrictness] = useState('balanced');
  const [generatedLink, setGeneratedLink] = useState('');
  
  // Compulsory Intro Questions
  const [introQuestions, setIntroQuestions] = useState<string[]>([]);
  const [newIntroQuestion, setNewIntroQuestion] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('adminQuestions');
    if (saved) {
      try { setQuestions(JSON.parse(saved)); } catch { setQuestions(DEFAULT_QUESTIONS); }
    } else {
      setQuestions(DEFAULT_QUESTIONS);
    }

    const savedIntro = localStorage.getItem('adminIntroQuestions');
    if (savedIntro) {
      try { setIntroQuestions(JSON.parse(savedIntro)); } catch { setIntroQuestions([]); }
    } else {
      setIntroQuestions([
        'Tell me about yourself and your background.',
        'Why are you interested in this role and our company?'
      ]);
    }
  }, []);

  // Load Interview History & Compute Analytics
  useEffect(() => {
    const saved = localStorage.getItem('interviewHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
          
          let scoreSum = 0;
          let passCount = 0;
          let videoCount = 0;
          const byRole: Record<string, { count: number; scoreSum: number }> = {};

          parsed.forEach((h: any) => {
            scoreSum += h.overallScore || 0;
            if (h.overallScore >= 70) passCount++;
            if (h.interviewType === 'video') videoCount++;
            
            const role = h.candidateProfile?.role || 'Unknown';
            if (!byRole[role]) byRole[role] = { count: 0, scoreSum: 0 };
            byRole[role].count++;
            byRole[role].scoreSum += h.overallScore || 0;
          });

          setAnalytics({
            total: parsed.length,
            avgScore: parsed.length ? Math.round(scoreSum / parsed.length) : 0,
            passRate: parsed.length ? Math.round((passCount / parsed.length) * 100) : 0,
            videoCount,
            byRole
          });
        }
      } catch (e) {
        console.error('Failed to parse interview history', e);
      }
    }
  }, []);

  // Load Admin Settings
  useEffect(() => {
    const savedAdminSettings = localStorage.getItem('adminSettings');
    if (savedAdminSettings) {
      try {
        const parsed = JSON.parse(savedAdminSettings);
        if (parsed.interviewDuration) setInterviewDuration(parsed.interviewDuration);
        if (parsed.questionsPerRound) setQuestionsPerRound(parsed.questionsPerRound);
        if (parsed.passingScore) setPassingScore(parsed.passingScore);
        if (parsed.enableVideo !== undefined) setEnableVideo(parsed.enableVideo);
        if (parsed.enableCodeEditor !== undefined) setEnableCodeEditor(parsed.enableCodeEditor);
        if (parsed.enableFillerAnalysis !== undefined) setEnableFillerAnalysis(parsed.enableFillerAnalysis);
        if (parsed.evaluationStrictness) setEvaluationStrictness(parsed.evaluationStrictness);
      } catch (e) {
        console.error('Failed to parse adminSettings', e);
      }
    }
  }, []);

  const saveQuestions = (qs: CustomQuestion[]) => {
    setQuestions(qs);
    localStorage.setItem('adminQuestions', JSON.stringify(qs));
  };

  const saveIntroQuestions = (qs: string[]) => {
    setIntroQuestions(qs);
    localStorage.setItem('adminIntroQuestions', JSON.stringify(qs));
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

  const downloadReport = (h: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const content = `Interview Report - ${h.candidateProfile?.name || 'Anonymous'}\nRole: ${h.candidateProfile?.role || 'Unknown'}\nDate: ${new Date(h.timestamp || Date.now()).toLocaleString()}\nOverall Score: ${h.overallScore}/100\nTechnical: ${h.technicalAvg} | Communication: ${h.communicationAvg} | Problem Solving: ${h.problemSolvingAvg}\n\n--------------------------------------------------\nQUESTIONS & RESPONSES\n--------------------------------------------------\n\n${h.scores?.map((s: any, i: number) => `Q${i + 1}: ${s.question}\n\nCandidate Answer:\n${s.answer}\n\n---\nFeedback: ${s.feedback}\nScore: ${s.overall}/100 (Tech: ${s.technicalDepth}, Clarity: ${s.clarity})`).join('\n\n\n') || 'No Q&A data available.'}\n\n--------------------------------------------------\nSTRENGTHS\n${h.strengths?.map((s: string) => `- ${s}`).join('\n') || 'None'}\n\nIMPROVEMENTS\n${h.improvements?.map((s: string) => `- ${s}`).join('\n') || 'None'}\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${h.candidateProfile?.name || 'candidate'}_QA_Report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="Interview Mate" style={{ height: 32, width: 'auto' }} />
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
                  { label: 'Filler Words Analysis', desc: 'Detect and count filler words used by the candidate (e.g. um, uh, like)', enabled: enableFillerAnalysis, toggle: () => setEnableFillerAnalysis(!enableFillerAnalysis) },
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

            <div className="glass-card" style={{ padding: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>🎤 Compulsory Introductory Questions</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                These questions will be asked to every candidate sequentially before the AI generates technical questions based on their resume.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {introQuestions.map((iq, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                    <span style={{ fontSize: 14 }}>{iq}</span>
                    <button onClick={() => saveIntroQuestions(introQuestions.filter((_, i) => i !== idx))} style={{ padding: '6px', cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--accent-red)' }}>🗑️</button>
                  </div>
                ))}
                {introQuestions.length === 0 && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No compulsory questions set. Adding some is highly recommended!</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input 
                  type="text" 
                  value={newIntroQuestion} 
                  onChange={e => setNewIntroQuestion(e.target.value)} 
                  placeholder="e.g. Describe a time you demonstrated leadership..."
                  className="input-field" 
                  style={{ flex: 1, padding: '10px 14px', fontSize: 13 }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newIntroQuestion.trim()) {
                      saveIntroQuestions([...introQuestions, newIntroQuestion.trim()]);
                      setNewIntroQuestion('');
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    if (newIntroQuestion.trim()) {
                      saveIntroQuestions([...introQuestions, newIntroQuestion.trim()]);
                      setNewIntroQuestion('');
                    }
                  }}
                  className="btn-primary" 
                  style={{ padding: '0 20px', fontSize: 13, whiteSpace: 'nowrap' }}
                >
                  ➕ Add
                </button>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>🔗 Interview Links</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Generate unique, one-time links for candidates to directly access the interview dashboard without having to register first.</p>
                
                <div style={{ display: 'flex', gap: 12 }}>
                  <button 
                    onClick={() => {
                      const uuid = crypto.randomUUID();
                      // Assuming the app is deployed on the same origin
                      const link = `${window.location.origin}/candidate/interview/${uuid}`;
                      setGeneratedLink(link);
                    }}
                    className="btn-secondary" 
                    style={{ padding: '10px 20px', fontSize: 13 }}
                  >
                    🎲 Generate New Link
                  </button>
                  {generatedLink && (
                    <div style={{ display: 'flex', flex: 1, gap: 8, alignItems: 'center' }}>
                      <input 
                        type="text" 
                        readOnly 
                        value={generatedLink} 
                        className="input-field" 
                        style={{ flex: 1, padding: '10px', fontSize: 13 }}
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(generatedLink);
                          alert('Link copied to clipboard!');
                        }}
                        className="btn-primary" 
                        style={{ padding: '10px 16px', fontSize: 13 }}
                      >
                        📋 Copy
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button className="btn-primary" onClick={() => {
              localStorage.setItem('adminSettings', JSON.stringify({ interviewDuration, questionsPerRound, passingScore, enableVideo, enableCodeEditor, evaluationStrictness, enableFillerAnalysis }));
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
                { label: 'Total Interviews', val: analytics.total, icon: '📋', color: 'var(--accent-cyan)' },
                { label: 'Avg Score', val: `${analytics.avgScore}/100`, icon: '📊', color: 'var(--accent-green)' },
                { label: 'Pass Rate', val: `${analytics.passRate}%`, icon: '✅', color: 'var(--accent-amber)' },
                { label: 'Video Interviews', val: analytics.videoCount, icon: '🎥', color: 'var(--accent-blue)' },
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
                {Object.entries(analytics.byRole).sort((a,b) => b[1].count - a[1].count).map(([role, stats]) => {
                  const avg = Math.round(stats.scoreSum / stats.count);
                  return (
                    <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ width: 160, fontSize: 13, color: 'var(--text-secondary)', flexShrink: 0 }}>{role}</span>
                      <div style={{ flex: 1 }}>
                        <div className="progress-bar">
                          <div className="progress-bar-fill" style={{
                            width: `${avg}%`,
                            background: avg >= 75 ? 'linear-gradient(90deg, var(--accent-green), var(--accent-cyan))' : 'linear-gradient(90deg, var(--accent-amber), var(--accent-cyan))',
                          }} />
                        </div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: avg >= 75 ? 'var(--accent-green)' : 'var(--accent-amber)', width: 36 }}>{avg}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 50 }}>{stats.count} tests</span>
                    </div>
                  );
                })}
                {Object.keys(analytics.byRole).length === 0 && (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 14 }}>No interview data available yet.</div>
                )}
              </div>
            </div>

            {/* Recent Candidates Table */}
            <div className="glass-card" style={{ padding: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>🧑‍💻 Recent Candidates</h3>
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>No candidates have completed interviews yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Table Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1fr 1fr', padding: '0 16px 8px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                    <div>Candidate Name</div>
                    <div>Target Role</div>
                    <div>Date</div>
                    <div>Type</div>
                    <div style={{ textAlign: 'center' }}>Report</div>
                    <div style={{ textAlign: 'right' }}>Score</div>
                  </div>
                  {/* Table Rows */}
                  {[...history].reverse().slice(0, 10).map((h, i) => (
                    <div key={i} className="glass-card-sm" style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1fr 1fr', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'all 0.2s ease' }} 
                         onClick={() => setSelectedCandidate(h)}
                         onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(79,70,229,0.3)')}
                         onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--glass-border)')}
                    >
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{h.candidateProfile?.name || 'Anonymous'}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{h.candidateProfile?.role || 'Unknown'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(h.timestamp || Date.now()).toLocaleDateString()}</div>
                      <div>
                        {h.interviewType === 'video' ? 
                           <span className="tag tag-cyan" style={{ fontSize: 10, padding: '2px 6px' }}>🎥 Video</span> : 
                           <span className="tag" style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(100,116,139,0.1)', color: 'var(--text-muted)' }}>💬 Text</span>
                        }
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <button 
                          onClick={(e) => downloadReport(h, e)}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: 11, background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer', borderRadius: 6 }}
                          title="Download Q&A Report"
                        >
                          ⬇️ PDF/TXT
                        </button>
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 14, color: h.overallScore >= 75 ? 'var(--accent-green)' : h.overallScore >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>
                        {h.overallScore}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Candidate Details Modal */}
        {selectedCandidate && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
            <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', padding: 32, position: 'relative' }}>
              <button onClick={() => setSelectedCandidate(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800 }}>
                    {selectedCandidate.candidateProfile?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 800 }}>{selectedCandidate.candidateProfile?.name || 'Anonymous'}</h2>
                    <div style={{ color: 'var(--text-secondary)' }}>{selectedCandidate.candidateProfile?.role} • {new Date(selectedCandidate.timestamp).toLocaleString()}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {selectedCandidate.candidateProfile?.resumeFile && (
                     <button 
                       onClick={() => {
                         const a = document.createElement('a');
                         a.href = selectedCandidate.candidateProfile.resumeFile;
                         // We don't know exact extension, but pdf is most common
                         a.download = `${selectedCandidate.candidateProfile?.name || 'candidate'}_resume`;
                         a.click();
                       }}
                       className="btn-secondary"
                       style={{ padding: '8px 16px', fontSize: 13, background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)', border: '1px solid rgba(16,185,129,0.2)' }}
                     >
                       📄 Download Resume
                     </button>
                  )}
                  {selectedCandidate.candidateProfile?.certificateFiles?.map((certFile: string, idx: number) => (
                    <button 
                      key={idx}
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = certFile;
                        a.download = `${selectedCandidate.candidateProfile?.name || 'candidate'}_certificate_${idx + 1}`;
                        a.click();
                      }}
                      className="btn-secondary"
                      style={{ padding: '8px 16px', fontSize: 13, background: 'rgba(139,92,246,0.1)', color: 'var(--accent-purple)', border: '1px solid rgba(139,92,246,0.2)' }}
                    >
                      📜 Certificate {idx + 1}
                    </button>
                  ))}
                  <button 
                    onClick={() => {
                      const content = `Interview Report - ${selectedCandidate.candidateProfile?.name || 'Anonymous'}\nRole: ${selectedCandidate.candidateProfile?.role || 'Unknown'}\nDate: ${new Date(selectedCandidate.timestamp).toLocaleString()}\nOverall Score: ${selectedCandidate.overallScore}/100\nTechnical: ${selectedCandidate.technicalAvg} | Communication: ${selectedCandidate.communicationAvg} | Problem Solving: ${selectedCandidate.problemSolvingAvg}\n\n--------------------------------------------------\nQUESTIONS & RESPONSES\n--------------------------------------------------\n\n${selectedCandidate.scores?.map((s: any, i: number) => `Q${i + 1}: ${s.question}\n\nCandidate Answer:\n${s.answer}\n\n---\nFeedback: ${s.feedback}\nScore: ${s.overall}/100 (Tech: ${s.technicalDepth}, Clarity: ${s.clarity})`).join('\n\n\n') || 'No Q&A data available.'}\n\n--------------------------------------------------\nSTRENGTHS\n${selectedCandidate.strengths?.map((s: string) => `- ${s}`).join('\n') || 'None'}\n\nIMPROVEMENTS\n${selectedCandidate.improvements?.map((s: string) => `- ${s}`).join('\n') || 'None'}\n`;
                      const blob = new Blob([content], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedCandidate.candidateProfile?.name || 'candidate'}_QA_Report.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: 13, background: 'var(--accent-blue)', color: '#fff', border: 'none' }}
                  >
                    ⬇️ Download Q&A Report (.txt)
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'Overall', val: selectedCandidate.overallScore },
                  { label: 'Technical', val: selectedCandidate.technicalAvg },
                  { label: 'Communication', val: selectedCandidate.communicationAvg },
                  { label: 'Problem Solving', val: selectedCandidate.problemSolvingAvg },
                ].map(m => (
                  <div key={m.label} style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: m.val >= 75 ? 'var(--accent-green)' : m.val >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>{m.val}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                <div style={{ background: 'rgba(16,185,129,0.05)', padding: 20, borderRadius: 12, border: '1px solid rgba(16,185,129,0.1)' }}>
                  <h4 style={{ color: 'var(--accent-green)', marginBottom: 10, fontSize: 14 }}>💪 Strengths</h4>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedCandidate.strengths?.slice(0, 3).map((s: string, i: number) => <li key={i}>{s}</li>) || <li>None noted</li>}
                  </ul>
                </div>
                <div style={{ background: 'rgba(245,158,11,0.05)', padding: 20, borderRadius: 12, border: '1px solid rgba(245,158,11,0.1)' }}>
                  <h4 style={{ color: 'var(--accent-amber)', marginBottom: 10, fontSize: 14 }}>📝 Improvements</h4>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedCandidate.improvements?.slice(0, 3).map((s: string, i: number) => <li key={i}>{s}</li>) || <li>None noted</li>}
                  </ul>
                </div>
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Q&A Responses ({selectedCandidate.scores?.length || 0})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedCandidate.scores?.map((s: any, i: number) => (
                  <div key={i} style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>Q: {s.question}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontStyle: 'italic', lineHeight: 1.4 }}>A: "{s.answer.slice(0, 150)}{s.answer.length > 150 ? '...' : ''}"</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--accent-cyan)' }}>Score: {s.overall}/100</span>
                      <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 6 }}>{s.feedback.slice(0, 50)}...</span>
                    </div>
                  </div>
                ))}
              </div>

              {selectedCandidate.transcript && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 32 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>📜 Full Transcript</h3>
                    <button 
                      onClick={() => {
                        const blob = new Blob([selectedCandidate.transcript], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${selectedCandidate.candidateProfile?.name || 'candidate'}_transcript.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: 12 }}
                    >
                      ⬇️ Download .txt
                    </button>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto', border: '1px solid var(--border-color)' }}>
                    {selectedCandidate.transcript}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
