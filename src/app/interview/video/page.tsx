'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import { FaceMetrics, loadFaceModels, analyzeFrame, aggregateMetrics } from '@/lib/face-analyzer';
import { analyzeTranscript, countFillers, getSpeedCategory } from '@/lib/speech-analyzer';
import { calculateBehavioralReport, BehavioralReport } from '@/lib/behavioral-scorer';

export default function VideoInterviewPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const analysisIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [round, setRound] = useState<InterviewRound>('intro');
  const [questionIdx, setQuestionIdx] = useState(0);
  const [roundQuestionIdx, setRoundQuestionIdx] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [scores, setScores] = useState<QuestionScore[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(new Date());
  const [questionTimer, setQuestionTimer] = useState(0);
  const [currentExpectedTopics, setCurrentExpectedTopics] = useState<string[]>([]);
  const [currentDifficulty, setCurrentDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Video/Audio
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [fullTranscript, setFullTranscript] = useState('');

  // AI Analysis
  const [modelsReady, setModelsReady] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<FaceMetrics | null>(null);
  const [frameHistory, setFrameHistory] = useState<FaceMetrics[]>([]);
  const [fillerCount, setFillerCount] = useState(0);
  const [showAiPanel, setShowAiPanel] = useState(true);

  const totalQ = getTotalQuestions();

  // Load face-api models
  useEffect(() => {
    loadFaceModels().then(ok => setModelsReady(ok));
  }, []);

  // Initialize camera
  useEffect(() => {
    let stream: MediaStream | null = null;
    const initCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setCameraError('Camera access denied. Please enable camera permissions.');
      }
    };
    initCamera();
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, []);

  // Start face analysis loop when models are ready
  useEffect(() => {
    if (!modelsReady || !videoRef.current || cameraError) return;

    analysisIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !cameraOn || isComplete) return;
      const metrics = await analyzeFrame(videoRef.current);
      if (metrics) {
        setLiveMetrics(metrics);
        setFrameHistory(prev => [...prev, metrics]);
      }
    }, 1500); // Analyze every 1.5 seconds

    return () => {
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    };
  }, [modelsReady, cameraOn, cameraError, isComplete]);

  // Update filler count from transcript
  useEffect(() => {
    const { count } = countFillers(fullTranscript);
    setFillerCount(count);
  }, [fullTranscript]);

  // Speech Recognition
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const W = window as any;
    const SpeechRecognitionCtor = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (SpeechRecognitionCtor) {
      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += t + ' ';
          else interim += t;
        }
        if (final) {
          setTranscript(prev => prev + final);
          setFullTranscript(prev => prev + final);
        }
        setInterimTranscript(interim);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const speakText = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const toggleCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    if (stream) {
      stream.getVideoTracks().forEach(t => { t.enabled = !cameraOn; });
      setCameraOn(!cameraOn);
    }
  };

  const toggleMic = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    if (stream) {
      stream.getAudioTracks().forEach(t => { t.enabled = !micOn; });
      setMicOn(!micOn);
    }
  };

  // Load profile and start interview
  useEffect(() => {
    const saved = localStorage.getItem('interviewProfile');
    if (!saved) { router.push('/interview/setup'); return; }
    const p = JSON.parse(saved) as CandidateProfile;
    setProfile(p);

    const welcomeMsg: Message = {
      id: crypto.randomUUID(), role: 'ai',
      content: `Welcome to your AI Video Interview, ${p.name}! 🎥\n\nI'm your AI interviewer for the **${p.role}** position (${p.companyStyle} style).\n\n• 🧠 AI will analyze your facial expressions in real-time\n• 🗣️ Your speech will be evaluated for clarity & fillers\n• 📊 Check the AI Dashboard panel for live metrics\n\nClick 🎤 to record your answers. Let's begin!`,
      timestamp: new Date(),
    };
    setTimeout(() => {
      setMessages([welcomeMsg]);
      speakText(`Welcome to your AI video interview, ${p.name}! I'll ask you questions for the ${p.role} position. Let's begin.`);
      setTimeout(() => askQuestion(p, 'intro', 0), 4000);
    }, 1000);
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
      const msg: Message = {
        id: crypto.randomUUID(), role: 'ai',
        content: generated.question,
        timestamp: new Date(),
        category: `${getRoundConfig(r).label} — ${generated.category}`,
        difficulty: generated.difficulty,
      };
      setCurrentExpectedTopics(generated.expectedTopics);
      setCurrentDifficulty(generated.difficulty);
      setMessages(prev => [...prev, msg]);
      setIsTyping(false);
      setQuestionTimer(0);
      speakText(generated.question);
    }, 1200);
  };

  const handleSubmitVoice = async () => {
    const answer = transcript.trim();
    if (!answer || isEvaluating || !profile) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMsg: Message = {
      id: crypto.randomUUID(), role: 'user',
      content: answer,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsEvaluating(true);
    setTranscript('');
    setInterimTranscript('');

    const lastAiMsg = [...messages].reverse().find(m => m.role === 'ai');
    const question = lastAiMsg?.content || '';

    const score = await evaluateResponse(question, answer, currentExpectedTopics, currentDifficulty);
    setScores(prev => [...prev, score]);

    const feedbackMsg: Message = {
      id: crypto.randomUUID(), role: 'ai',
      content: `📊 **Score: ${score.overall}/100**\n${score.feedback}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, feedbackMsg]);
    speakText(`You scored ${score.overall} out of 100. ${score.feedback}`);

    const nextQIdx = questionIdx + 1;
    const nextRoundQIdx = roundQuestionIdx + 1;
    const roundConfig = getRoundConfig(round);

    if (nextRoundQIdx >= roundConfig.questionCount) {
      const nextRound = getNextRound(round);
      if (!nextRound) {
        setTimeout(() => finishInterview(profile, [...scores, score]), 3000);
        setIsEvaluating(false);
        return;
      }
      setTimeout(() => {
        const transMsg: Message = {
          id: crypto.randomUUID(), role: 'ai',
          content: `Great! Moving to the **${getRoundConfig(nextRound).label}** round. 🚀`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, transMsg]);
        speakText(`Moving to the ${getRoundConfig(nextRound).label} round.`);
        setRound(nextRound);
        setRoundQuestionIdx(0);
        setQuestionIdx(nextQIdx);
        setTimeout(() => askQuestion(profile, nextRound, 0), 3000);
      }, 3000);
    } else {
      setRoundQuestionIdx(nextRoundQIdx);
      setQuestionIdx(nextQIdx);
      setTimeout(() => askQuestion(profile, round, nextRoundQIdx), 3000);
    }
    setIsEvaluating(false);
  };

  const finishInterview = (p: CandidateProfile, allScores: QuestionScore[]) => {
    setIsComplete(true);
    if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);

    const result = calculateOverallResult(p, allScores);
    const elapsed = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

    // Generate behavioral report
    const sessionVideo = aggregateMetrics(frameHistory);
    const sessionSpeech = analyzeTranscript(fullTranscript, elapsed);
    const answerScores = {
      technical: result.overallScore,
      clarity: result.overallScore * 0.9,
      confidence: result.overallScore * 0.85,
      avgScore: result.overallScore,
    };

    const behavioralReport = calculateBehavioralReport(sessionVideo, sessionSpeech, answerScores, 75);

    // Store everything
    const enhancedResult = {
      ...result,
      behavioralReport,
      videoMetrics: sessionVideo,
      speechMetrics: sessionSpeech,
      interviewType: 'video',
      duration: elapsed,
    };
    localStorage.setItem('lastInterviewResult', JSON.stringify(enhancedResult));

    const historyStr = localStorage.getItem('interviewHistory');
    const history = historyStr ? JSON.parse(historyStr) : [];
    history.unshift(enhancedResult);
    localStorage.setItem('interviewHistory', JSON.stringify(history.slice(0, 20)));

    const completeMsg: Message = {
      id: crypto.randomUUID(), role: 'ai',
      content: `🎉 **Interview Complete!**\n\n🏆 Overall Score: **${behavioralReport.overallScore}/100** — ${behavioralReport.recommendation}\n\n📊 Technical: ${behavioralReport.technicalScore}/100\n🗣️ Communication: ${behavioralReport.communicationScore}/100\n🎯 Confidence: ${behavioralReport.confidenceScore}/100\n🧠 Behavior: ${behavioralReport.behaviorScore}/100\n\n${behavioralReport.strengths.length > 0 ? '**Strengths:** ' + behavioralReport.strengths[0] : ''}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, completeMsg]);
    speakText(`Interview complete! Your overall score is ${behavioralReport.overallScore} out of 100. Recommendation: ${behavioralReport.recommendation}.`);

    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const elapsed = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
  const speedCat = getSpeedCategory(fullTranscript.split(/\s+/).filter(Boolean).length / Math.max(elapsed / 60, 0.1));

  // Emotion bar helper
  const EmotionBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
      <span style={{ width: 55, color: 'var(--text-muted)' }}>{label}</span>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--bg-primary)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, value)}%`, height: '100%', borderRadius: 2, background: color, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ width: 28, textAlign: 'right', color, fontWeight: 600 }}>{Math.round(value)}</span>
    </div>
  );

  // Score gauge
  const ScoreGauge = ({ label, score, icon }: { label: string; score: number; icon: string }) => {
    const color = score >= 70 ? 'var(--accent-green)' : score >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)';
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 18, marginBottom: 2 }}>{icon}</div>
        <div style={{ fontSize: 18, fontWeight: 800, color }}>{Math.round(score)}</div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>{label}</div>
      </div>
    );
  };

  return (
    <div style={{ background: 'var(--bg-primary)', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)', padding: '10px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: 'white' }}>AI</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              AI Video Interview
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: modelsReady ? 'var(--accent-green)' : 'var(--accent-amber)', display: 'inline-block' }} />
              {isListening && <span style={{ fontSize: 11, color: 'var(--accent-red)', fontWeight: 600 }}>● REC</span>}
              {modelsReady && <span style={{ fontSize: 10, color: 'var(--accent-green)', padding: '2px 6px', borderRadius: 12, background: 'rgba(16,185,129,0.1)' }}>🧠 AI Active</span>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{profile?.role} • {profile?.companyStyle}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button onClick={() => setShowAiPanel(!showAiPanel)} style={{
            padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            border: '1px solid var(--border-color)', background: showAiPanel ? 'rgba(0,212,255,0.1)' : 'transparent',
            color: showAiPanel ? 'var(--accent-cyan)' : 'var(--text-muted)', fontFamily: 'Inter',
          }}>
            {showAiPanel ? '🧠 Hide AI' : '🧠 Show AI'}
          </button>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Round</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-cyan)' }}>{getRoundConfig(round).label}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Progress</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{questionIdx + 1}/{totalQ}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Time</div>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono' }}>{formatTime(elapsed)}</div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ height: 3, background: 'var(--bg-secondary)', flexShrink: 0 }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-green))', width: `${(questionIdx / totalQ) * 100}%`, transition: 'width 0.6s ease' }} />
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Video + Controls */}
        <div style={{ width: showAiPanel ? 320 : 360, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', transition: 'width 0.3s ease' }}>
          {/* Video */}
          <div style={{ position: 'relative', aspectRatio: '4/3', background: '#000' }}>
            {cameraError ? (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 20 }}>
                <span style={{ fontSize: 40 }}>📷</span>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>{cameraError}</p>
              </div>
            ) : (
              <video ref={videoRef} autoPlay muted playsInline style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transform: 'scaleX(-1)', opacity: cameraOn ? 1 : 0.1,
              }} />
            )}
            {!cameraOn && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)' }}>
                <span style={{ fontSize: 48 }}>🔒</span>
              </div>
            )}
            {isSpeaking && (
              <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 10px', borderRadius: 20, background: 'rgba(0,212,255,0.2)', border: '1px solid rgba(0,212,255,0.4)', fontSize: 10, fontWeight: 600, color: 'var(--accent-cyan)' }}>
                🔊 AI Speaking
              </div>
            )}
            {/* Live emotion badge */}
            {liveMetrics?.faceDetected && (
              <div style={{ position: 'absolute', bottom: 8, left: 8, padding: '3px 10px', borderRadius: 20, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', fontSize: 10, color: 'var(--text-primary)', display: 'flex', gap: 6, alignItems: 'center' }}>
                <span>{liveMetrics.emotions.dominant === 'happy' ? '😊' : liveMetrics.emotions.dominant === 'neutral' ? '😐' : liveMetrics.emotions.dominant === 'surprised' ? '😮' : liveMetrics.emotions.dominant === 'sad' ? '😢' : '🤔'}</span>
                <span style={{ fontWeight: 600 }}>{liveMetrics.emotions.dominant}</span>
                {liveMetrics.lookingAway && <span style={{ color: 'var(--accent-red)' }}>⚠ Away</span>}
              </div>
            )}
            {liveMetrics?.faceDetected && (
              <div style={{ position: 'absolute', bottom: 8, right: 8, padding: '3px 10px', borderRadius: 20, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', fontSize: 10 }}>
                <span style={{ color: liveMetrics.eyeContact >= 60 ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
                  👁 {Math.round(liveMetrics.eyeContact)}%
                </span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: 12 }}>
            <button onClick={toggleCamera} style={{
              width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: cameraOn ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              color: cameraOn ? 'var(--accent-green)' : 'var(--accent-red)',
              fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {cameraOn ? '📹' : '🚫'}
            </button>
            <button onClick={toggleMic} style={{
              width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: micOn ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              color: micOn ? 'var(--accent-green)' : 'var(--accent-red)',
              fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {micOn ? '🎤' : '🔇'}
            </button>
            <button onClick={() => { if (!isComplete) window.speechSynthesis.cancel(); }} style={{
              width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)',
              fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              ⏹️
            </button>
          </div>

          {/* Transcript + Voice Controls */}
          <div style={{ flex: 1, padding: 12, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              🎙️ Transcript
              {isListening && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-red)', animation: 'blink 1s infinite' }} />}
              {fillerCount > 0 && <span style={{ color: 'var(--accent-amber)', fontSize: 10, marginLeft: 'auto' }}>⚠ {fillerCount} fillers</span>}
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', minHeight: 60, fontSize: 13, lineHeight: 1.6 }}>
              {transcript || interimTranscript ? (
                <>{transcript}<span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{interimTranscript}</span></>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 12 }}>
                  {isListening ? 'Listening...' : 'Click record to speak'}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={toggleListening} disabled={isTyping || isEvaluating || isComplete}
                style={{
                  flex: 1, padding: '10px', fontSize: 13, fontWeight: 600, borderRadius: 10, cursor: 'pointer',
                  border: isListening ? '2px solid var(--accent-red)' : '1px solid var(--accent-cyan)',
                  background: isListening ? 'rgba(239,68,68,0.1)' : 'rgba(0,212,255,0.08)',
                  color: isListening ? 'var(--accent-red)' : 'var(--accent-cyan)',
                  fontFamily: 'Inter', opacity: (isTyping || isEvaluating || isComplete) ? 0.4 : 1,
                }}>
                {isListening ? '⏹ Stop' : '🎤 Record'}
              </button>
              <button onClick={handleSubmitVoice}
                disabled={!transcript.trim() || isEvaluating || isTyping}
                className="btn-primary" style={{
                  padding: '10px 16px', fontSize: 13,
                  opacity: transcript.trim() && !isEvaluating ? 1 : 0.4,
                }}>
                Send →
              </button>
            </div>

            {/* Speech speed indicator */}
            <div style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Speed: <span style={{ color: speedCat.color, fontWeight: 600 }}>{speedCat.label}</span></span>
              <span>{formatTime(questionTimer)} on question</span>
            </div>
          </div>
        </div>

        {/* Right AI Panel - Live Metrics */}
        {showAiPanel && (
          <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--glass-border)', background: 'rgba(10,10,15,0.6)', padding: 14, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: 6 }}>
              🧠 AI Dashboard
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: modelsReady ? 'var(--accent-green)' : 'var(--accent-amber)' }} />
            </div>

            {/* Live Scores */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              <ScoreGauge label="Confidence" score={liveMetrics?.confidence ?? 0} icon="🎯" />
              <ScoreGauge label="Engagement" score={liveMetrics?.engagement ?? 0} icon="⚡" />
              <ScoreGauge label="Eye Contact" score={liveMetrics?.eyeContact ?? 0} icon="👁" />
              <ScoreGauge label="Professional" score={liveMetrics?.professionalism ?? 0} icon="💼" />
            </div>

            {/* Emotion breakdown */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Emotions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <EmotionBar label="Neutral" value={liveMetrics?.emotions.neutral ?? 0} color="var(--accent-cyan)" />
                <EmotionBar label="Happy" value={liveMetrics?.emotions.happy ?? 0} color="var(--accent-green)" />
                <EmotionBar label="Surprise" value={liveMetrics?.emotions.surprised ?? 0} color="var(--accent-amber)" />
                <EmotionBar label="Sad" value={liveMetrics?.emotions.sad ?? 0} color="var(--accent-blue)" />
                <EmotionBar label="Fear" value={liveMetrics?.emotions.fearful ?? 0} color="var(--accent-red)" />
              </div>
            </div>

            {/* Stress meter */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Stress Level</div>
              <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-primary)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4, transition: 'width 0.5s ease',
                  width: `${liveMetrics?.stressLevel ?? 0}%`,
                  background: (liveMetrics?.stressLevel ?? 0) > 60 ? 'var(--accent-red)' : (liveMetrics?.stressLevel ?? 0) > 30 ? 'var(--accent-amber)' : 'var(--accent-green)',
                }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                {(liveMetrics?.stressLevel ?? 0) > 60 ? '😰 High stress' : (liveMetrics?.stressLevel ?? 0) > 30 ? '😐 Moderate' : '😌 Relaxed'}
              </div>
            </div>

            {/* Cheating Detection */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Integrity Check</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                <span style={{ fontSize: 16 }}>{frameHistory.reduce((s, f) => s + f.cheatingFlags, 0) > 10 ? '🚨' : '✅'}</span>
                <div>
                  <div style={{ fontWeight: 600 }}>Look-aways: {frameHistory.reduce((s, f) => s + f.cheatingFlags, 0)}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                    {frameHistory.reduce((s, f) => s + f.cheatingFlags, 0) > 10 ? 'Frequent disengagement' : 'Normal behavior'}
                  </div>
                </div>
              </div>
            </div>

            {/* Speech Stats */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Speech Analysis</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Words</span>
                  <span style={{ fontWeight: 600 }}>{fullTranscript.split(/\s+/).filter(Boolean).length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Fillers</span>
                  <span style={{ fontWeight: 600, color: fillerCount > 10 ? 'var(--accent-red)' : fillerCount > 5 ? 'var(--accent-amber)' : 'var(--accent-green)' }}>{fillerCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Frames Analyzed</span>
                  <span style={{ fontWeight: 600 }}>{frameHistory.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Face Detected</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>
                    {frameHistory.length > 0 ? Math.round(frameHistory.filter(f => f.faceDetected).length / frameHistory.length * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                <div style={{ maxWidth: '85%' }}>
                  {msg.category && (
                    <div style={{ fontSize: 10, marginBottom: 4, display: 'flex', gap: 4 }}>
                      <span className="tag tag-cyan" style={{ padding: '2px 6px', fontSize: 9 }}>{msg.category}</span>
                      {msg.difficulty && <span className={`tag ${msg.difficulty === 'hard' ? 'tag-amber' : msg.difficulty === 'medium' ? 'tag-cyan' : 'tag-green'}`} style={{ padding: '2px 6px', fontSize: 9 }}>{msg.difficulty}</span>}
                    </div>
                  )}
                  <div className={msg.role === 'ai' ? 'chat-ai' : 'chat-user'} style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: msg.role === 'ai' ? 'var(--accent-cyan)' : 'var(--accent-blue)' }}>
                        {msg.role === 'ai' ? '🤖 AI' : '🎤 You'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {msg.content.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-ai" style={{ padding: '12px 16px', display: 'inline-block' }}>
                <span className="typing-cursor" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Preparing question</span>
              </div>
            )}
            {isEvaluating && (
              <div className="chat-ai" style={{ padding: '12px 16px', display: 'inline-block' }}>
                <span style={{ fontSize: 13, color: 'var(--accent-cyan)' }}>⏳ Evaluating with AI...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {isComplete && (
            <div style={{ padding: 14, borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 10 }}>
              <button onClick={() => router.push('/interview/results')} className="btn-primary" style={{ flex: 1, padding: 14 }}>📊 View Full Report</button>
              <button onClick={() => router.push('/skills')} className="btn-secondary" style={{ flex: 1, padding: 14 }}>📈 Skill Map</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
