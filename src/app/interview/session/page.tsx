'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  CandidateProfile,
  InterviewRound,
  Message,
  QuestionScore,
  getNextRound,
  getRoundConfig,
  getTotalQuestions,
  calculateOverallResult,
} from '@/lib/interview-engine';
import { generateQuestion, evaluateResponse } from '@/lib/gemini';

export default function InterviewSessionPage() {
  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [round, setRound] = useState<InterviewRound>('intro');
  const [questionIdx, setQuestionIdx] = useState(0);
  const [roundQuestionIdx, setRoundQuestionIdx] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [scores, setScores] = useState<QuestionScore[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(new Date());
  const [questionTimer, setQuestionTimer] = useState(0);
  const [currentExpectedTopics, setCurrentExpectedTopics] = useState<string[]>([]);
  const [currentDifficulty, setCurrentDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const totalQ = getTotalQuestions();

  // Load profile and ask first question
  useEffect(() => {
    const saved = localStorage.getItem('interviewProfile');
    if (!saved) { router.push('/interview/setup'); return; }
    const p = JSON.parse(saved) as CandidateProfile;
    setProfile(p);

    // Welcome message
    const welcomeMsg: Message = {
      id: crypto.randomUUID(),
      role: 'ai',
      content: `Welcome, ${p.name}! 👋\n\nI'm your AI interviewer today. We'll be conducting a structured interview for the **${p.role}** position in a **${p.companyStyle}**-style format.\n\nThe interview consists of several rounds: Introduction, Technical, Advanced Technical, Behavioral, and Wrap-up.\n\nLet's begin with the first question.`,
      timestamp: new Date(),
    };

    setTimeout(() => {
      setMessages([welcomeMsg]);
      setTimeout(() => askQuestion(p, 'intro', 0), 1500);
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer
  useEffect(() => {
    if (isComplete) return;
    const interval = setInterval(() => setQuestionTimer(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isComplete]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const askQuestion = (p: CandidateProfile, r: InterviewRound, rqIdx: number) => {
    setIsTyping(true);
    const generated = generateQuestion(p, r, rqIdx);

    setTimeout(() => {
      const roundConfig = getRoundConfig(r);
      const msg: Message = {
        id: crypto.randomUUID(),
        role: 'ai',
        content: generated.question,
        timestamp: new Date(),
        category: `${roundConfig.label} — ${generated.category}`,
        difficulty: generated.difficulty,
      };

      setCurrentExpectedTopics(generated.expectedTopics);
      setCurrentDifficulty(generated.difficulty);
      setMessages(prev => [...prev, msg]);
      setIsTyping(false);
      setQuestionTimer(0);
    }, 1200);
  };

  const handleSubmit = async () => {
    if (!userInput.trim() || isEvaluating || !profile) return;

    const answer = userInput.trim();
    setUserInput('');

    // Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: answer,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsEvaluating(true);

    // Evaluate
    const lastAiMsg = [...messages].reverse().find(m => m.role === 'ai');
    const question = lastAiMsg?.content || '';

    const score = await evaluateResponse(question, answer, currentExpectedTopics, currentDifficulty);
    setScores(prev => [...prev, score]);

    // Brief feedback
    const feedbackMsg: Message = {
      id: crypto.randomUUID(),
      role: 'ai',
      content: `📊 **Score: ${score.overall}/100**\n${score.feedback}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, feedbackMsg]);

    // Move to next question
    const nextQIdx = questionIdx + 1;
    const nextRoundQIdx = roundQuestionIdx + 1;
    const roundConfig = getRoundConfig(round);

    if (nextRoundQIdx >= roundConfig.questionCount) {
      // Move to next round
      const nextRound = getNextRound(round);
      if (!nextRound) {
        // Interview complete
        setTimeout(() => finishInterview(profile, [...scores, score]), 1500);
        setIsEvaluating(false);
        return;
      }

      // Round transition message
      setTimeout(() => {
        const transMsg: Message = {
          id: crypto.randomUUID(),
          role: 'ai',
          content: `Excellent! Let's move to the **${getRoundConfig(nextRound).label}** round. 🚀`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, transMsg]);

        setRound(nextRound);
        setRoundQuestionIdx(0);
        setQuestionIdx(nextQIdx);

        setTimeout(() => askQuestion(profile, nextRound, 0), 1200);
      }, 1500);
    } else {
      setRoundQuestionIdx(nextRoundQIdx);
      setQuestionIdx(nextQIdx);
      setTimeout(() => askQuestion(profile, round, nextRoundQIdx), 1500);
    }

    setIsEvaluating(false);
  };

  const finishInterview = (p: CandidateProfile, allScores: QuestionScore[]) => {
    setIsComplete(true);
    const result = calculateOverallResult(p, allScores);
    localStorage.setItem('lastInterviewResult', JSON.stringify(result));

    // Save to history
    const historyStr = localStorage.getItem('interviewHistory');
    const history = historyStr ? JSON.parse(historyStr) : [];
    history.unshift(result);
    localStorage.setItem('interviewHistory', JSON.stringify(history.slice(0, 20)));

    const completeMsg: Message = {
      id: crypto.randomUUID(),
      role: 'ai',
      content: `🎉 **Interview Complete!**\n\nYour overall score: **${result.overallScore}/100**\n\n${result.recommendation}\n\nClick below to view your detailed results and skill analysis.`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, completeMsg]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const elapsed = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

  return (
    <div style={{ background: 'var(--bg-primary)', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)', padding: '10px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: 'white' }}>AI</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Interview Session</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{profile?.role || 'Loading...'} • {profile?.companyStyle || ''} Style</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Round</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-cyan)' }}>
              {getRoundConfig(round).label}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Progress</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{questionIdx + 1}/{totalQ}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Elapsed</div>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{formatTime(elapsed)}</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar" style={{ flexShrink: 0 }}>
        <div className="progress-bar-fill" style={{ width: `${(questionIdx / totalQ) * 100}%` }} />
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{
              display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 16,
            }}>
              <div style={{ maxWidth: '85%' }}>
                {msg.category && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="tag tag-cyan" style={{ padding: '2px 8px', fontSize: 10 }}>{msg.category}</span>
                    {msg.difficulty && (
                      <span className={`tag ${msg.difficulty === 'hard' ? 'tag-amber' : msg.difficulty === 'medium' ? 'tag-cyan' : 'tag-green'}`} style={{ padding: '2px 8px', fontSize: 10 }}>
                        {msg.difficulty}
                      </span>
                    )}
                  </div>
                )}
                <div className={msg.role === 'ai' ? 'chat-ai' : 'chat-user'} style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: msg.role === 'ai' ? 'var(--accent-cyan)' : 'var(--accent-blue)' }}>
                      {msg.role === 'ai' ? '🤖 AI Interviewer' : '👤 You'}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                    {msg.content.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={{ display: 'flex', marginBottom: 16 }}>
              <div className="chat-ai" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-cyan)' }}>🤖 AI Interviewer</span>
                </div>
                <div className="typing-cursor" style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>
                  Thinking
                </div>
              </div>
            </div>
          )}

          {isEvaluating && (
            <div style={{ display: 'flex', marginBottom: 16 }}>
              <div className="chat-ai" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: 14, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  ⏳ Evaluating your response...
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div style={{
        borderTop: '1px solid var(--glass-border)', padding: '16px 24px',
        background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)', flexShrink: 0,
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {isComplete ? (
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => router.push('/interview/results')} className="btn-primary" style={{ flex: 1 }}>
                📊 View Detailed Results
              </button>
              <button onClick={() => router.push('/skills')} className="btn-secondary" style={{ flex: 1 }}>
                📈 View Skill Map
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  className="input-field"
                  placeholder={isTyping || isEvaluating ? 'Wait for the question...' : 'Type your answer here... (Enter to send, Shift+Enter for new line)'}
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isTyping || isEvaluating}
                  rows={3}
                  style={{ resize: 'none', paddingRight: 60, fontFamily: 'Inter, sans-serif' }}
                />
                <div style={{
                  position: 'absolute', bottom: 12, right: 12,
                  fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace',
                }}>
                  ⏱ {formatTime(questionTimer)}
                </div>
              </div>
              <button
                onClick={handleSubmit}
                className="btn-primary"
                disabled={!userInput.trim() || isTyping || isEvaluating}
                style={{ padding: '14px 24px', opacity: userInput.trim() && !isTyping && !isEvaluating ? 1 : 0.5 }}
              >
                Send →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
