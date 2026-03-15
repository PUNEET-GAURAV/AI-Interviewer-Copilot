'use client';

import { useState } from 'react';
import Link from 'next/link';

const CODING_PROBLEMS = [
  {
    id: 1,
    title: 'Two Sum',
    difficulty: 'Easy',
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\n**Example:**\nInput: nums = [2, 7, 11, 15], target = 9\nOutput: [0, 1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].',
    starterCode: 'function twoSum(nums, target) {\n  // Write your solution here\n  \n}',
    tags: ['Array', 'Hash Map'],
  },
  {
    id: 2,
    title: 'Reverse a Linked List',
    difficulty: 'Medium',
    description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.\n\n**Example:**\nInput: head = [1, 2, 3, 4, 5]\nOutput: [5, 4, 3, 2, 1]',
    starterCode: 'function reverseList(head) {\n  // Write your solution here\n  \n}',
    tags: ['Linked List', 'Recursion'],
  },
  {
    id: 3,
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    description: 'Given a string `s` containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n\n**Example:**\nInput: s = "()[]{}"\nOutput: true',
    starterCode: 'function isValid(s) {\n  // Write your solution here\n  \n}',
    tags: ['Stack', 'String'],
  },
  {
    id: 4,
    title: 'Maximum Subarray',
    difficulty: 'Medium',
    description: 'Given an integer array `nums`, find the subarray with the largest sum, and return its sum.\n\n**Example:**\nInput: nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]\nOutput: 6\nExplanation: The subarray [4, -1, 2, 1] has the largest sum 6.',
    starterCode: 'function maxSubArray(nums) {\n  // Write your solution here\n  \n}',
    tags: ['Array', 'Dynamic Programming'],
  },
  {
    id: 5,
    title: 'Binary Search',
    difficulty: 'Easy',
    description: 'Given a sorted array of integers `nums` and a target value, return the index if the target is found. If not, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.\n\n**Example:**\nInput: nums = [-1, 0, 3, 5, 9, 12], target = 9\nOutput: 4',
    starterCode: 'function search(nums, target) {\n  // Write your solution here\n  \n}',
    tags: ['Array', 'Binary Search'],
  },
  {
    id: 6,
    title: 'Merge Two Sorted Lists',
    difficulty: 'Easy',
    description: 'Merge two sorted linked lists and return it as a new sorted list. The new list should be made by splicing together the nodes of the first two lists.\n\n**Example:**\nInput: list1 = [1, 2, 4], list2 = [1, 3, 4]\nOutput: [1, 1, 2, 3, 4, 4]',
    starterCode: 'function mergeTwoLists(list1, list2) {\n  // Write your solution here\n  \n}',
    tags: ['Linked List', 'Recursion'],
  },
];

interface AnalysisResult {
  isCorrect: boolean;
  score: number;
  timeComplexity: string;
  spaceComplexity: string;
  isOptimal: boolean;
  errors: string[];
  feedback: string;
  optimalApproach: string;
  congratsMessage: string;
  codeQuality: {
    readability: number;
    efficiency: number;
    edgeCases: number;
  };
}

export default function CodingInterviewPage() {
  const [selectedProblem, setSelectedProblem] = useState(CODING_PROBLEMS[0]);
  const [code, setCode] = useState(CODING_PROBLEMS[0].starterCode);
  const [language, setLanguage] = useState('javascript');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showProblems, setShowProblems] = useState(false);

  const selectProblem = (problem: typeof CODING_PROBLEMS[0]) => {
    setSelectedProblem(problem);
    setCode(problem.starterCode);
    setResult(null);
    setShowProblems(false);
  };

  const submitCode = async () => {
    if (!code.trim()) return;
    setAnalyzing(true);
    setResult(null);

    try {
      const res = await fetch('/api/evaluate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `${selectedProblem.title}: ${selectedProblem.description}`,
          code,
          language,
        }),
      });

      if (!res.ok) throw new Error('Evaluation failed');
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const difficultyColor = (d: string) => {
    if (d === 'Easy') return '#10b981';
    if (d === 'Medium') return 'var(--accent-amber)';
    return 'var(--accent-red)';
  };

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="Interview Mate" style={{ height: 30, width: 'auto' }} />
          </Link>
          <div style={{ height: 20, width: 1, background: 'var(--glass-border)' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>💻 Coding Interview</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select 
            value={language} 
            onChange={e => setLanguage(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="typescript">TypeScript</option>
          </select>
          <button className="btn-primary" onClick={submitCode} disabled={analyzing} style={{ padding: '8px 20px', fontSize: 13 }}>
            {analyzing ? '🔍 Analyzing...' : '▶ Submit & Analyze'}
          </button>
        </div>
      </nav>

      {/* Main Layout */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>
        {/* Left: Problem */}
        <div style={{ borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          {/* Problem Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => setShowProblems(!showProblems)}
                style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                📋 Problems {showProblems ? '▲' : '▼'}
              </button>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{selectedProblem.title}</h2>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: `${difficultyColor(selectedProblem.difficulty)}15`, color: difficultyColor(selectedProblem.difficulty) }}>
              {selectedProblem.difficulty}
            </span>
          </div>

          {/* Problems Dropdown */}
          {showProblems && (
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {CODING_PROBLEMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => selectProblem(p)}
                  style={{
                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    background: selectedProblem.id === p.id ? 'rgba(16,185,129,0.1)' : 'transparent',
                    border: selectedProblem.id === p.id ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent',
                    color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{p.id}. {p.title}</span>
                  <span style={{ fontSize: 11, color: difficultyColor(p.difficulty), fontWeight: 700 }}>{p.difficulty}</span>
                </button>
              ))}
            </div>
          )}

          {/* Problem Description */}
          <div style={{ padding: 20, flex: 1, overflow: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {selectedProblem.tags.map(t => (
                <span key={t} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(0,212,255,0.1)', color: 'var(--accent-cyan)', border: '1px solid rgba(0,212,255,0.2)' }}>{t}</span>
              ))}
            </div>
            <pre style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif' }}>
              {selectedProblem.description}
            </pre>
          </div>

          {/* AI Analysis Results */}
          {result && (
            <div style={{ padding: 20, borderTop: '1px solid var(--glass-border)', overflow: 'auto', maxHeight: '50%' }}>
              {/* Congrats or Score */}
              {result.isOptimal && result.congratsMessage ? (
                <div style={{ padding: 16, borderRadius: 12, background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(0,212,255,0.1))', border: '1px solid rgba(16,185,129,0.3)', marginBottom: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎉🏆🎉</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981', marginBottom: 6 }}>Optimal Solution!</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{result.congratsMessage}</div>
                </div>
              ) : (
                <div style={{ padding: 16, borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-amber)', marginBottom: 6 }}>💡 Can Be Improved</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{result.optimalApproach}</div>
                </div>
              )}

              {/* Score + Complexity */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
                <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-secondary)', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: result.isCorrect ? '#10b981' : 'var(--accent-red)' }}>{result.score}/10</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Score</div>
                </div>
                <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-secondary)', textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-cyan)' }}>{result.timeComplexity}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Time</div>
                </div>
                <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-secondary)', textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-blue)' }}>{result.spaceComplexity}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Space</div>
                </div>
                <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-secondary)', textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: result.isCorrect ? '#10b981' : 'var(--accent-red)' }}>{result.isCorrect ? '✅' : '❌'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Correct</div>
                </div>
              </div>

              {/* Errors */}
              {result.errors && result.errors.length > 0 && (
                <div style={{ padding: 14, borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-red)', marginBottom: 6 }}>⚠️ Issues Found:</div>
                  {result.errors.map((err, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>• {err}</div>
                  ))}
                </div>
              )}

              {/* Code Quality Bars */}
              <div style={{ padding: 14, borderRadius: 10, background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Code Quality</div>
                {[
                  { label: 'Readability', val: result.codeQuality?.readability || 0, color: '#10b981' },
                  { label: 'Efficiency', val: result.codeQuality?.efficiency || 0, color: 'var(--accent-cyan)' },
                  { label: 'Edge Cases', val: result.codeQuality?.edgeCases || 0, color: 'var(--accent-amber)' },
                ].map(q => (
                  <div key={q.label} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{q.label}</span>
                      <span style={{ color: q.color, fontWeight: 700 }}>{q.val}/10</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)' }}>
                      <div style={{ height: '100%', borderRadius: 3, width: `${q.val * 10}%`, background: q.color, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Feedback */}
              <div style={{ marginTop: 12, padding: 14, borderRadius: 10, background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>📝 Feedback</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{result.feedback}</div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Code Editor */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>📝 Code Editor</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setCode(selectedProblem.starterCode)}
                style={{ padding: '4px 12px', borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}
              >
                ↺ Reset
              </button>
            </div>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              spellCheck={false}
              style={{
                width: '100%', height: '100%', resize: 'none',
                background: '#0d1117', color: '#e6edf3',
                fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                fontSize: 14, lineHeight: 1.6, padding: 20,
                border: 'none', outline: 'none',
                tabSize: 2,
              }}
              onKeyDown={e => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const start = e.currentTarget.selectionStart;
                  const end = e.currentTarget.selectionEnd;
                  setCode(code.substring(0, start) + '  ' + code.substring(end));
                  setTimeout(() => {
                    e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
                  }, 0);
                }
              }}
            />
            {analyzing && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 12,
              }}>
                <div style={{ width: 40, height: 40, border: '3px solid rgba(16,185,129,0.2)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 14, color: '#10b981', fontWeight: 600 }}>AI is analyzing your code...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
