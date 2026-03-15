'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saveVideoToIDB } from '@/lib/idb';

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
  const router = useRouter();
  const [selectedProblem, setSelectedProblem] = useState(CODING_PROBLEMS[0]);
  const [code, setCode] = useState(CODING_PROBLEMS[0].starterCode);
  const [language, setLanguage] = useState('javascript');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showProblems, setShowProblems] = useState(false);

  // Session & Proctoring State
  const [sessionActive, setSessionActive] = useState(true);
  const [terminated, setTerminated] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warningVisible, setWarningVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);

  // Start webcam and screen share
  const startCamera = useCallback(async () => {
    try {
      // 1. Get Webcam + Mic
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      // 2. Get Screen Share
      let screenStream;
      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      } catch (e) {
        console.warn('Screen share denied or cancelled. Continuing with just camera.');
        // If user denies screen share, we only record camera
      }
      
      // 3. Combine Streams for recording
      const combinedTracks = [
        ...cameraStream.getVideoTracks(),
        ...cameraStream.getAudioTracks(),
      ];
      
      if (screenStream) {
        // We prioritize recording the screen track if available, falling back to camera if not
        combinedTracks.push(...screenStream.getVideoTracks());
        if (screenStream.getAudioTracks().length > 0) {
           combinedTracks.push(...screenStream.getAudioTracks());
        }
      }
      
      const combinedStream = new MediaStream(combinedTracks);
      streamRef.current = combinedStream;

      // 4. Show only the webcam in the mini-player for the user to see themselves
      if (videoRef.current) {
        videoRef.current.srcObject = new MediaStream(cameraStream.getVideoTracks());
      }
      
      // 5. Setup MediaRecorder
      const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9,opus' });
      mediaRecorderRef.current = recorder;
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      recorder.start(1000); // Collect data every second
      
      setCameraOn(true);
      setCameraError('');
      
    } catch (err: any) {
      setCameraError('Camera/Mic access denied. Video proctoring disabled.');
      console.error('Camera error:', err);
    }
  }, []);

  // Stop webcam and recording
  const stopCamera = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  }, []);

  // Terminate session
  const terminateSession = useCallback(() => {
    setTerminated(true);
    setSessionActive(false);
    stopCamera();
  }, [stopCamera]);

  // Tab switch detection
  useEffect(() => {
    if (!sessionActive || terminated) return;

    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            terminateSession();
          } else {
            setWarningVisible(true);
            setTimeout(() => setWarningVisible(false), 4000);
          }
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [sessionActive, terminated, terminateSession]);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const selectProblem = (problem: typeof CODING_PROBLEMS[0]) => {
    setSelectedProblem(problem);
    setCode(problem.starterCode);
    setResult(null);
    setShowProblems(false);
  };

  const submitCode = async () => {
    if (!code.trim() || !sessionActive) return;
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

  const finishInterview = async () => {
    setIsFinishing(true);
    setSessionActive(false);
    stopCamera();
    
    // Create final video blob from chunks
    let videoId = null;
    if (chunksRef.current.length > 0) {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      videoId = `video_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      try {
        await saveVideoToIDB(videoId, blob);
        console.log('Video saved to IndexedDB:', videoId);
      } catch (err) {
        console.error('Failed to save video', err);
        videoId = null;
      }
    }
    
    // Save record to interviewHistory
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const record = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      candidateProfile: {
        name: user?.name || 'Anonymous Coder',
        email: user?.email || '',
        role: 'Software Engineer'
      },
      interviewType: 'video', // we consider screen share logic as 'video' type
      overallScore: result ? result.score * 10 : 0, // Code score is out of 10, align to 100 for admin dashboard
      technicalAvg: result ? result.score * 10 : 0,
       problemSolvingAvg: result ? result.score * 10 : 0,
      communicationAvg: 100, // N/A for coding
      scores: [
        {
          question: selectedProblem.title,
          answer: code,
          feedback: result?.feedback || 'No feedback requested',
          overall: result ? result.score * 10 : 0,
          technicalDepth: result ? result.codeQuality?.efficiency * 10 : 0,
          clarity: result ? result.codeQuality?.readability * 10 : 0
        }
      ],
      strengths: result?.isOptimal ? ['Optimal Solution', 'Good Code Quality'] : [],
      improvements: result?.errors || [],
      videoId // Attach the video ID to the record!
    };
    
    const saved = localStorage.getItem('interviewHistory');
    const history = saved ? JSON.parse(saved) : [];
    history.unshift(record);
    localStorage.setItem('interviewHistory', JSON.stringify(history.slice(0, 20)));
    
    router.push('/');
  };

  const difficultyColor = (d: string) => {
    if (d === 'Easy') return '#10b981';
    if (d === 'Medium') return 'var(--accent-amber)';
    return 'var(--accent-red)';
  };

  // Terminated overlay
  if (terminated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: 40 }}>
        <div style={{ textAlign: 'center', maxWidth: 500 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🚫</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-red)', marginBottom: 12 }}>Session Terminated</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.6, marginBottom: 8 }}>
            Your coding interview session has been terminated due to multiple tab switches.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>
            Tab switches detected: <strong style={{ color: 'var(--accent-red)' }}>{tabSwitchCount}</strong> (max allowed: 2)
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => { setTerminated(false); setSessionActive(true); setTabSwitchCount(0); setResult(null); setCode(selectedProblem.starterCode); startCamera(); }}
              className="btn-primary" style={{ padding: '12px 28px', fontSize: 15 }}
            >
              🔄 Restart Session
            </button>
            <button
              onClick={() => router.push('/')}
              style={{ padding: '12px 28px', fontSize: 15, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Tab Switch Warning */}
      {warningVisible && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          padding: '14px 24px', textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(239,68,68,0.95), rgba(220,38,38,0.95))',
          color: 'white', fontSize: 14, fontWeight: 700,
          animation: 'slideDown 0.3s ease',
          boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
        }}>
          ⚠️ Warning: Tab switch detected! ({tabSwitchCount}/3) — Your session will be terminated after 3 switches.
        </div>
      )}

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
          {/* Tab switch indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 8, background: tabSwitchCount > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${tabSwitchCount > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}` }}>
            <span style={{ fontSize: 11, color: tabSwitchCount > 0 ? 'var(--accent-red)' : '#10b981', fontWeight: 600 }}>
              🛡️ Switches: {tabSwitchCount}/3
            </span>
          </div>
          {/* Camera status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, background: cameraOn ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${cameraOn ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: cameraOn ? '#10b981' : 'var(--accent-red)', animation: cameraOn ? 'pulse 2s infinite' : 'none' }} />
            <span style={{ fontSize: 11, color: cameraOn ? '#10b981' : 'var(--accent-red)', fontWeight: 600 }}>
              {cameraOn ? 'REC' : 'OFF'}
            </span>
          </div>
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
          <button className="btn-secondary" onClick={submitCode} disabled={analyzing} style={{ padding: '8px 20px', fontSize: 13 }}>
            {analyzing ? '🔍 Analyzing...' : '▶ Analyze'}
          </button>
          <button className="btn-primary" onClick={finishInterview} disabled={isFinishing || analyzing} style={{ padding: '8px 20px', fontSize: 13, background: 'linear-gradient(135deg, var(--accent-green), var(--accent-cyan))' }}>
            {isFinishing ? 'Saving...' : '🏁 End Interview'}
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

              {result.errors && result.errors.length > 0 && (
                <div style={{ padding: 14, borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-red)', marginBottom: 6 }}>⚠️ Issues Found:</div>
                  {result.errors.map((err, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>• {err}</div>
                  ))}
                </div>
              )}

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

              <div style={{ marginTop: 12, padding: 14, borderRadius: 10, background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>📝 Feedback</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{result.feedback}</div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Code Editor + Webcam */}
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

            {/* Webcam Feed - Bottom Right */}
            <div style={{
              position: 'absolute', bottom: 16, right: 16, zIndex: 10,
              width: 180, borderRadius: 12, overflow: 'hidden',
              border: `2px solid ${cameraOn ? '#10b981' : 'rgba(239,68,68,0.5)'}`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
              background: '#000',
            }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{ width: '100%', display: 'block', transform: 'scaleX(-1)' }}
              />
              {!cameraOn && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4, background: 'rgba(0,0,0,0.8)' }}>
                  <span style={{ fontSize: 20 }}>📷</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '0 8px' }}>{cameraError || 'Camera off'}</span>
                </div>
              )}
              {/* Recording indicator */}
              {cameraOn && (
                <div style={{ position: 'absolute', top: 6, left: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
                  <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>PROCTORED</span>
                </div>
              )}
            </div>

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
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
}
