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
import { FaceMetrics, loadFaceModels, analyzeFrame, aggregateMetrics, captureFaceDescriptor } from '@/lib/face-analyzer';
import { analyzeTranscript, countFillers, getSpeedCategory } from '@/lib/speech-analyzer';
import { calculateBehavioralReport, BehavioralReport } from '@/lib/behavioral-scorer';
import { QRCodeSVG } from 'qrcode.react';

export default function VideoInterviewPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const analysisIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const mobileStreamRef = useRef<MediaStream | null>(null);

  const [hasScreenShare, setHasScreenShare] = useState(false);
  const [peerId, setPeerId] = useState('');
  const [mobileConnected, setMobileConnected] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  
  // Identity state
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [identityCaptured, setIdentityCaptured] = useState(false);
  const [baseDescriptor, setBaseDescriptor] = useState<Float32Array | null>(null);
  const [capturingIdentity, setCapturingIdentity] = useState(false);

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
  const [enableFillers, setEnableFillers] = useState(true);

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

  const [violationCount, setViolationCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const violationCountRef = useRef(0);
  const lastViolationTimeRef = useRef(0);
  const lookAwayCountRef = useRef(0);
  const mismatchCountRef = useRef(0);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && hasScreenShare && !isComplete) {
        setShowFullscreenWarning(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [hasScreenShare, isComplete]);

  // Load face-api models & PeerJS
  useEffect(() => {
    loadFaceModels().then(ok => setModelsReady(ok));

    let peerInstance: any = null;
    if (typeof window !== 'undefined') {
      import('peerjs').then(({ default: Peer }) => {
        const peer = new Peer();
        peerInstance = peer;
        peer.on('open', (id) => {
          setPeerId(id);
        });
        peer.on('call', (call) => {
          call.answer(); // don't send anything back
          call.on('stream', (mobileStream) => {
            mobileStreamRef.current = mobileStream;
            if (mobileVideoRef.current) {
              mobileVideoRef.current.srcObject = mobileStream;
            }
            setMobileConnected(true);
          });
          call.on('close', () => {
            setMobileConnected(false);
          });
        });
      }).catch(err => console.error("Failed to load peerjs:", err));
    }
    return () => {
      peerInstance?.destroy();
    };
  }, []);

  // Pre-load voices for SpeechSynthesis to ensure they are available immediately
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Initialize camera
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isActive = false;
    const initCamera = async () => {
      if (!hasScreenShare) return;
      isActive = true;
      try {
        // Try getting both video and audio first
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (isActive) {
           setCameraStream(stream);
           if (videoRef.current) videoRef.current.srcObject = stream;
        }
        if (isActive) setCameraError('');
      } catch (err: any) {
        if (!isActive) return;
        console.warn("Failed to get both video and audio, trying fallbacks...", err);
        try {
          // Fallback 1: Try video only (maybe mic is missing or blocked)
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) videoRef.current.srcObject = stream;
          setMicOn(false);
          setCameraError('');
        } catch (vidErr: any) {
          if (!isActive) return;
          try {
            // Fallback 2: Try audio only (maybe camera is missing or blocked)
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
            setCameraOn(false);
            setCameraError('');
          } catch (audErr: any) {
            if (!isActive) return;
            // All options failed
            console.error("Complete media access failure:", err, vidErr, audErr);
            setCameraError(`Access error: ${err.message || 'Permissions denied or no hardware found.'} Please check browser settings.`);
          }
        }
      }
    };
    initCamera();
    return () => { 
      isActive = false;
      stream?.getTracks().forEach((t: MediaStreamTrack) => t.stop()); 
    };
  }, [hasScreenShare]);

  // Start face analysis loop when models are ready
  useEffect(() => {
    if (!hasScreenShare || !modelsReady || !videoRef.current || cameraError || !identityCaptured) {
       return;
    }

    // Capture the current ref value so the cleanup function has access to the same value
    const intervalRef = analysisIntervalRef;

    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || !cameraOn || isComplete) return;
      const metrics = await analyzeFrame(videoRef.current, baseDescriptor || null);
      if (metrics) {
        setLiveMetrics(metrics);
        setFrameHistory(prev => [...prev, metrics]);
        
        if (metrics.lookingAway) {
          lookAwayCountRef.current += 1;
        }

        if (lookAwayCountRef.current > 10) {
          handleLookAwayViolation();
        }

        if (metrics.multipleFacesDetected) {
          if (!isComplete) {
            handleIdentityViolation();
          }
        } else if (metrics.identityMismatch && metrics.faceDetected) {
          mismatchCountRef.current += 1;
          if (mismatchCountRef.current > 3 && !isComplete) { // 3 mismatch hits = violation
            handleIdentityViolation();
          }
        }
      }
    }, 1500); // Analyze every 1.5 seconds

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasScreenShare, modelsReady, cameraOn, cameraError, isComplete, identityCaptured, baseDescriptor]); // intentional omit of handleLookAwayViolation to prevent retriggering

  // Update filler count from transcript
  useEffect(() => {
    if (!enableFillers) return;
    const { count } = countFillers(fullTranscript);
    setFillerCount(count);
  }, [fullTranscript, enableFillers]);

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
      
      // Cleanup on unmount
      return () => {
        try {
          recognition.stop();
        } catch(e) {}
      };
    }
  }, []);

  const speakText = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Select a male voice
    const voices = window.speechSynthesis.getVoices();
    const maleVoice = voices.find(v => 
      (v.name.toLowerCase().includes('male') && !v.name.toLowerCase().includes('female')) || 
      v.name.toLowerCase().includes('mark') || 
      v.name.toLowerCase().includes('david') || 
      v.name.toLowerCase().includes('brian') ||
      v.name.toLowerCase().includes('guy') ||
      v.name.toLowerCase().includes('matthew')
    );
    
    if (maleVoice) {
      utterance.voice = maleVoice;
    }

    utterance.rate = 1; // slightly faster/normal 
    utterance.pitch = 0.9; // Slightly lower pitch for a younger male voice
    utterance.volume = 0.8;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current || isSpeaking) return;
    
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Speech recognition stop error', e);
      }
      setIsListening(false);
    } else {
      setTranscript('');
      setInterimTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error: any) {
        if (error.name === 'InvalidStateError') {
          console.warn('Speech recognition already started.');
          setIsListening(true); // Ensure UI reflects it's actually running
        } else {
          console.error('Speech recognition error:', error);
        }
      }
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

  const handleRepeatQuestion = () => {
    const reversed = [...messages].reverse();
    const lastQuestionMsg = reversed.find(m => m.role === 'ai' && m.difficulty);
    if (lastQuestionMsg) {
      speakText(lastQuestionMsg.content);
    } else {
      const firstAiMsg = messages.find(m => m.role === 'ai');
      if (firstAiMsg) speakText(firstAiMsg.content);
    }
  };

  const handleViolation = useCallback(() => {
    if (isComplete || !hasScreenShare) return;
    
    // Prevent rapid double triggers within 2 seconds
    const now = Date.now();
    if (now - lastViolationTimeRef.current < 2000) return;
    lastViolationTimeRef.current = now;
    
    violationCountRef.current += 1;
    const count = violationCountRef.current;
    
    if (count <= 3) {
      setViolationCount(count);
      setShowWarningModal(true);
    } else {
      // 4th violation
      setIsComplete(true);
      setViolationCount(count);
      setShowWarningModal(false);
      
      const rejectedResult = {
        candidateProfile: profile,
        overallScore: 0,
        scores: scores,
        technicalAvg: 0,
        communicationAvg: 0,
        problemSolvingAvg: 0,
        strengths: [],
        improvements: ["Candidate rejected due to multiple tab switching violations."],
        behavioralReport: {
          overallScore: 0,
          technicalScore: 0,
          communicationScore: 0,
          confidenceScore: 0,
          behaviorScore: 0,
          strengths: [],
          improvements: [],
          recommendation: "Rejected (Anti-Cheating Violation)",
        },
        videoMetrics: { emotions: {}, distractions: 4, averageFocus: 0 },
        speechMetrics: { wpm: 0, fillerWords: fillerCount, sentiment: 0, clarity: 0 },
        interviewType: 'video',
        duration: Math.floor((new Date().getTime() - startTime.getTime()) / 1000),
        timestamp: new Date().toISOString(),
        rejected: true,
        transcript: fullTranscript
      };
      
      const historyStr = localStorage.getItem('interviewHistory');
      const history = historyStr ? JSON.parse(historyStr) : [];
      history.unshift(rejectedResult);
      localStorage.setItem('interviewHistory', JSON.stringify(history.slice(0, 20)));
      localStorage.setItem('lastInterviewResult', JSON.stringify(rejectedResult));

      const completeMsg: Message = {
        id: crypto.randomUUID(), role: 'system',
        content: `🚨 **INTERVIEW TERMINATED** 🚨\n\nCandidate behavior deemed suspicious. You have switched tabs or applications multiple times. The interview is now rejected.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, completeMsg]);
      speakText('Attention. Due to multiple tab switching violations, this interview has been terminated and your application is rejected.');
      
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
    }
  }, [hasScreenShare, isComplete, speakText, profile, scores, fullTranscript, fillerCount, startTime]);

  const handleIdentityViolation = useCallback(() => {
    if (isComplete || !hasScreenShare) return;
    setIsComplete(true);
    setShowWarningModal(false);
    
    const count = mismatchCountRef.current;
    
    const rejectedResult = {
      candidateProfile: profile,
      overallScore: 0,
      scores: scores,
      technicalAvg: 0,
      communicationAvg: 0,
      problemSolvingAvg: 0,
      strengths: [],
      improvements: ["Candidate rejected due to an identity mismatch or multiple faces detected."],
      behavioralReport: {
        overallScore: 0,
        technicalScore: 0,
        communicationScore: 0,
        confidenceScore: 0,
        behaviorScore: 0,
        strengths: [],
        improvements: [],
        recommendation: "Rejected (Identity Verification Failed)",
      },
      videoMetrics: { emotions: {}, distractions: lookAwayCountRef.current, averageFocus: 0, identityMismatches: count },
      speechMetrics: { wpm: 0, fillerWords: 0, sentiment: 0, clarity: 0 },
      interviewType: 'video',
      duration: Math.floor((new Date().getTime() - startTime.getTime()) / 1000),
      timestamp: new Date().toISOString(),
      rejected: true,
      transcript: "Interview terminated due to identity violation."
    };
    
    const historyStr = localStorage.getItem('interviewHistory');
    const history = historyStr ? JSON.parse(historyStr) : [];
    history.unshift(rejectedResult);
    localStorage.setItem('interviewHistory', JSON.stringify(history.slice(0, 20)));
    localStorage.setItem('lastInterviewResult', JSON.stringify(rejectedResult));

    const completeMsg: Message = {
      id: crypto.randomUUID(), role: 'system',
      content: `🚨 **INTERVIEW TERMINATED** 🚨\n\nIdentity verification failed. Multiple people detected or identity mismatch. The interview is now rejected.`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, completeMsg]);
    speakText('Attention. Identity verification failed. This interview has been terminated and your application is rejected.');
    
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
  }, [hasScreenShare, isComplete, speakText, profile, scores, startTime]);

  const handleLookAwayViolation = useCallback(() => {
    if (isComplete || !hasScreenShare) return;
    setIsComplete(true);
    setShowWarningModal(false);
    
    const count = lookAwayCountRef.current;
    
    const rejectedResult = {
      candidateProfile: profile,
      overallScore: 0,
      scores: scores,
      technicalAvg: 0,
      communicationAvg: 0,
      problemSolvingAvg: 0,
      strengths: [],
      improvements: ["Candidate rejected due to multiple look away violations."],
      behavioralReport: {
        overallScore: 0,
        technicalScore: 0,
        communicationScore: 0,
        confidenceScore: 0,
        behaviorScore: 0,
        strengths: [],
        improvements: [],
        recommendation: "Rejected (Distracted/Disobeying Rules)",
      },
      videoMetrics: { emotions: {}, distractions: count, averageFocus: 0 },
      speechMetrics: { wpm: 0, fillerWords: fillerCount, sentiment: 0, clarity: 0 },
      interviewType: 'video',
      duration: Math.floor((new Date().getTime() - startTime.getTime()) / 1000),
      timestamp: new Date().toISOString(),
      rejected: true,
      transcript: fullTranscript
    };
    
    const historyStr = localStorage.getItem('interviewHistory');
    const history = historyStr ? JSON.parse(historyStr) : [];
    history.unshift(rejectedResult);
    localStorage.setItem('interviewHistory', JSON.stringify(history.slice(0, 20)));
    localStorage.setItem('lastInterviewResult', JSON.stringify(rejectedResult));

    const completeMsg: Message = {
      id: crypto.randomUUID(), role: 'system',
      content: `🚨 **INTERVIEW TERMINATED** 🚨\n\nCandidate is distracted and is disobeying the rules. The interview is now rejected.`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, completeMsg]);
    speakText('Attention. Candidate is distracted and is disobeying the rules. This interview has been terminated and your application is rejected.');
    
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
  }, [hasScreenShare, isComplete, speakText, profile, scores, fullTranscript, fillerCount, startTime]);

  useEffect(() => {
    if (!hasScreenShare || isComplete) return;

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleViolation();
      }
    };

    const onBlur = () => {
      handleViolation();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
    };
  }, [hasScreenShare, isComplete, handleViolation]);

  // Load profile and start interview
  useEffect(() => {
    let isActive = false;
    if (hasScreenShare) {
      isActive = true;
      const saved = localStorage.getItem('interviewProfile');
      if (!saved) { router.push('/interview/setup'); return; }
      
      const savedAdminSettings = localStorage.getItem('adminSettings');
      if (savedAdminSettings) {
        try {
          const parsedAdmin = JSON.parse(savedAdminSettings);
          if (parsedAdmin.enableFillerAnalysis !== undefined) {
            setEnableFillers(parsedAdmin.enableFillerAnalysis);
          }
        } catch (e) {
          console.error("Failed to parse adminSettings", e);
        }
      }

      const p = JSON.parse(saved) as CandidateProfile;
      setProfile(p);

      const welcomeMsg: Message = {
        id: crypto.randomUUID(), role: 'ai',
        content: `Welcome to your AI Video Interview, ${p.name}! 🎥\n\nI'm your AI interviewer for the **${p.role}** position (${p.companyStyle} style).\n\n• 🧠 AI will analyze your facial expressions in real-time\n• 🗣️ Your speech will be evaluated for clarity & fillers\n• 📊 Check the AI Dashboard panel for live metrics\n\nClick 🎤 to record your answers. Let's begin!`,
        timestamp: new Date(),
      };
      setTimeout(() => {
        if (!isActive) return;
        setMessages([welcomeMsg]);
        speakText(`Welcome to your AI video interview, ${p.name}! I'll ask you questions for the ${p.role} position. Let's begin.`);
        setTimeout(() => { if (isActive) askQuestion(p, 'intro', 0); }, 4000);
      }, 1000);
    }
    
    return () => { isActive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasScreenShare]);

  // Timer
  useEffect(() => {
    if (!hasScreenShare || isComplete) return;
    const interval = setInterval(() => setQuestionTimer(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [hasScreenShare, isComplete]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const askQuestion = async (p: CandidateProfile, r: InterviewRound, rqIdx: number) => {
    setIsTyping(true);
    const generated = await generateQuestion(p, r, rqIdx);
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
      transcript: fullTranscript,
      timestamp: new Date().toISOString()
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
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
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

  if (!rulesAccepted) {
    return (
      <div className="gradient-bg grid-pattern" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="glass-card" style={{ maxWidth: 640, width: '100%', padding: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>Interview Rules & Guidelines</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>Please read and agree to the following rules before starting your proctored interview.</p>
          </div>
          
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: 24, borderRadius: 16, marginBottom: 32, border: '1px solid var(--glass-border)' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13, color: 'var(--text-primary)' }}>
              <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ color: 'var(--accent-cyan)' }}>✓</span> <span><strong>No Cheating:</strong> External materials and screen reading are forbidden.</span></li>
              <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ color: 'var(--accent-cyan)' }}>✓</span> <span><strong>No Tab Switching:</strong> Multiple tabs or applications will trigger a warning.</span></li>
              <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ color: 'var(--accent-cyan)' }}>✓</span> <span><strong>No Background Coaching:</strong> Complete the interview entirely independently.</span></li>
              <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ color: 'var(--accent-cyan)' }}>✓</span> <span><strong>Camera Must Stay On:</strong> Ensure your webcam is always active.</span></li>
              <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ color: 'var(--accent-cyan)' }}>✓</span> <span><strong>Face Must Be Visible:</strong> Keep your face well-lit and within the frame.</span></li>
              <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ color: 'var(--accent-cyan)' }}>✓</span> <span><strong>One Person Only:</strong> No other individuals are allowed in the room.</span></li>
              <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ color: 'var(--accent-cyan)' }}>✓</span> <span><strong>No Phone Usage:</strong> Mobile phones may only be used as a secondary camera.</span></li>
              <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ color: 'var(--accent-cyan)' }}>✓</span> <span><strong>Original Answers:</strong> No copying or pasting. Responses must be original.</span></li>
              <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ color: 'var(--accent-cyan)' }}>✓</span> <span><strong>Proper Audio:</strong> Ensure a quiet environment with a clear microphone.</span></li>
              <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ color: 'var(--accent-cyan)' }}>✓</span> <span><strong>Eye Contact:</strong> Maintain eye contact with the camera as much as possible.</span></li>
            </ul>
          </div>

          <button 
            className="btn-primary" 
            style={{ padding: '16px 24px', fontSize: 16, width: '100%', fontWeight: 700 }}
            onClick={() => setRulesAccepted(true)}
          >
            I Agree to All Rules
          </button>
        </div>
      </div>
    );
  }

  if (!hasScreenShare || !mobileConnected) {
    const pairingUrl = typeof window !== 'undefined' ? `${window.location.origin}/interview/mobile-cam?room=${peerId}` : '';

    return (
      <div className="gradient-bg grid-pattern" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="glass-card" style={{ maxWidth: 500, width: '100%', padding: '40px 32px', textAlign: 'center' }}>
          
          {!mobileConnected ? (
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📱</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>1. Connect Mobile Camera</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                Scan this QR code with your phone to connect your secondary camera. This is required for proctoring.
              </p>
              <div style={{ background: 'white', padding: 16, borderRadius: 12, display: 'inline-block', marginBottom: 8 }}>
                {peerId ? <QRCodeSVG value={pairingUrl} size={160} /> : <div style={{width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000'}}>Loading...</div>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Waiting for connection...</div>
            </div>
          ) : (
            <div style={{ marginBottom: 32, padding: 16, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-green)', borderRadius: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <h3 style={{ color: 'var(--accent-green)', fontWeight: 600 }}>Mobile Camera Connected!</h3>
            </div>
          )}

          <div style={{ opacity: mobileConnected ? 1 : 0.4, transition: 'opacity 0.3s' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🖥️</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>2. Screen Share Required</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
              Before starting the interview, you must share your screen with system audio to ensure a secure and monitored environment.
            </p>
            <button 
              disabled={!mobileConnected}
              className="btn-primary" 
              style={{ padding: '14px 24px', fontSize: 16, width: '100%' }}
            onClick={async () => {
              try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          // @ts-ignore
          logicalSurface: false,
          surfaceSwitching: 'exclude',
          systemAudio: 'include'
        },
        audio: true
      });

      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();

      if (settings.displaySurface !== 'monitor') {
        videoTrack.stop();
        stream.getTracks().forEach(t => t.stop());
        alert("You must select 'Entire Screen' to proceed. Sharing a tab or window is not allowed.");
        return;
      }
      
      // Attempt to enforce audio if possible (note: macOS sometimes doesn't support system audio without special drivers)
      if (stream.getAudioTracks().length === 0) {
        // We will just log a warning instead of blocking completely because some OS might not support it
        console.warn("System audio was not shared.");
      }
                screenStreamRef.current = stream;
                // Add a listener in case they stop sharing via the browser's default UI button
                videoTrack.onended = () => {
                  setHasScreenShare(false);
                };

                setHasScreenShare(true);
                if (document.documentElement.requestFullscreen) {
                  document.documentElement.requestFullscreen().catch(err => console.error("Fullscreen error:", err));
                }
              } catch (err: any) {
                console.error("Screen Share Error:", err);
                alert('Screen sharing is required to proceed. Please try again and ensure you select "Entire Screen" and share system audio.');
              }
            }}
          >
            Share Screen & Start
          </button>
          </div>
        </div>
      </div>
    );
  }

  if (hasScreenShare && mobileConnected && !identityCaptured) {
    return (
      <div className="gradient-bg grid-pattern" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="glass-card" style={{ maxWidth: 500, width: '100%', padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📸</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>3. Identity Verification</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
            Please look directly at the camera to capture your facial signature. This ensures you are the same person throughout the interview.
          </p>
          <div style={{ background: '#000', borderRadius: 12, overflow: 'hidden', marginBottom: 24, position: 'relative', aspectRatio: '16/9' }}>
            <video 
              autoPlay playsInline muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
              ref={(v) => {
                if (v && cameraStream && v.srcObject !== cameraStream) {
                  v.srcObject = cameraStream;
                }
                if (v) videoRef.current = v;
              }}
            />
          </div>
          <button 
            disabled={capturingIdentity || !modelsReady}
            className="btn-primary" 
            style={{ padding: '14px 24px', fontSize: 16, width: '100%' }}
            onClick={async () => {
              setCapturingIdentity(true);
              const desc = await captureFaceDescriptor(videoRef.current!);
              if (desc) {
                setBaseDescriptor(desc);
                setIdentityCaptured(true);
              } else {
                alert('No face detected. Please ensure your face is clearly visible and well-lit.');
              }
              setCapturingIdentity(false);
            }}
          >
            {capturingIdentity ? 'Capturing...' : !modelsReady ? 'Loading models...' : 'Capture Identity'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-primary)', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Warning Modal */}
      {showWarningModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-card" style={{ maxWidth: 450, padding: 32, textAlign: 'center', border: '1px solid var(--accent-red)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Warning</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              Navigating away from the interview tab or opening other applications is NOT allowed. 
              <br /><br />
              This is violation <strong>{violationCount} of 3</strong>. On the 4th violation, your interview will be immediately terminated and rejected.
            </p>
            <button 
              onClick={() => setShowWarningModal(false)}
              className="btn-primary" 
              style={{ background: 'var(--accent-red)', border: 'none', padding: '10px 24px', fontSize: 16 }}
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Warning Modal */}
      {showFullscreenWarning && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-card" style={{ maxWidth: 450, padding: 32, textAlign: 'center', border: '1px solid var(--accent-amber)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🖥️</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Fullscreen Warning</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              You have exited full-screen mode. For the best and most secure interview experience, please remain in full-screen.
            </p>
            <button 
              onClick={() => {
                setShowFullscreenWarning(false);
                if (document.documentElement.requestFullscreen) {
                  document.documentElement.requestFullscreen().catch(console.error);
                }
              }}
              className="btn-primary" 
              style={{ background: 'var(--accent-amber)', color: 'black', border: 'none', padding: '10px 24px', fontSize: 16 }}
            >
              Return to Full Screen
            </button>
            <button 
              onClick={() => setShowFullscreenWarning(false)}
              className="btn-secondary" 
              style={{ marginTop: 12, padding: '10px 24px', fontSize: 16, width: '100%', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)', padding: '10px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/logo.png" alt="Interview Mate" style={{ height: 32, width: 'auto' }} />
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
          <button onClick={() => {
            if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen().catch(console.error);
            } else if (document.fullscreenElement && document.exitFullscreen) {
              document.exitFullscreen().catch(console.error);
            }
          }} style={{
            padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            border: '1px solid var(--border-color)', background: 'transparent',
            color: 'var(--text-primary)', fontFamily: 'Inter',
          }}>
            🖥️ Full Screen
          </button>
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
            <button 
              onClick={() => {
                if(profile && window.confirm("Are you sure you want to end the interview?")) {
                  finishInterview(profile, scores);
                }
              }}
              style={{
                position: 'absolute', bottom: 8, right: 8, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--accent-red)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', zIndex: 10
              }}>
              End Interview
            </button>
            {/* Live emotion badge */}
            {liveMetrics?.faceDetected && (
              <div style={{ position: 'absolute', bottom: 42, left: 8, padding: '3px 10px', borderRadius: 20, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', fontSize: 10, color: 'var(--text-primary)', display: 'flex', gap: 6, alignItems: 'center' }}>
                <span>{liveMetrics.emotions.dominant === 'happy' ? '😊' : liveMetrics.emotions.dominant === 'neutral' ? '😐' : liveMetrics.emotions.dominant === 'surprised' ? '😮' : liveMetrics.emotions.dominant === 'sad' ? '😢' : '🤔'}</span>
                <span style={{ fontWeight: 600 }}>{liveMetrics.emotions.dominant}</span>
                {liveMetrics.lookingAway && <span style={{ color: 'var(--accent-red)' }}>⚠ Away</span>}
              </div>
            )}
            {liveMetrics?.faceDetected && (
              <div style={{ position: 'absolute', bottom: 8, left: 8, padding: '3px 10px', borderRadius: 20, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', fontSize: 10 }}>
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
            <button onClick={() => { if (!isComplete) window.speechSynthesis.cancel(); }} title="Stop Agent Speaking" style={{
              width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)',
              fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              ⏹️
            </button>
            <button onClick={handleRepeatQuestion} title="Repeat AI Question" style={{
              width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'rgba(79,70,229,0.15)', color: 'var(--accent-blue)',
              fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              🔁
            </button>
          </div>

          {/* Transcript + Voice Controls */}
          <div style={{ flex: 1, padding: 12, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              🎙️ Transcript
              {isListening && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-red)', animation: 'blink 1s infinite' }} />}
              {enableFillers && fillerCount > 0 && <span style={{ color: 'var(--accent-amber)', fontSize: 10, marginLeft: 'auto' }}>⚠ {fillerCount} fillers</span>}
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

            {/* Integrity & Identity Check */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Integrity & Identity</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                  <span style={{ fontSize: 16 }}>{frameHistory.reduce((s, f) => s + f.cheatingFlags, 0) > 10 ? '🚨' : '✅'}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>Look-aways: {frameHistory.reduce((s, f) => s + f.cheatingFlags, 0)}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                      {frameHistory.reduce((s, f) => s + f.cheatingFlags, 0) > 10 ? 'Frequent disengagement' : 'Normal behavior'}
                    </div>
                  </div>
                </div>
                
                {liveMetrics?.multipleFacesDetected && (
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--accent-amber)', background: 'rgba(245,158,11,0.1)', padding: '6px', borderRadius: 6 }}>
                     <span style={{ fontSize: 16 }}>👥</span>
                     <div style={{ fontWeight: 600 }}>Multiple Faces Detected</div>
                   </div>
                )}
                
                {liveMetrics?.identityMismatch && (
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--accent-red)', background: 'rgba(239,68,68,0.1)', padding: '6px', borderRadius: 6 }}>
                     <span style={{ fontSize: 16 }}>👤</span>
                     <div style={{ fontWeight: 600 }}>Identity Mismatch Detected</div>
                   </div>
                )}
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
                  <span style={{ fontWeight: 600, color: !enableFillers ? 'var(--text-muted)' : fillerCount > 10 ? 'var(--accent-red)' : fillerCount > 5 ? 'var(--accent-amber)' : 'var(--accent-green)' }}>
                    {enableFillers ? fillerCount : 'Off'}
                  </span>
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
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : (msg.role === 'system' ? 'center' : 'flex-start'), marginBottom: 12 }}>
                <div style={{ maxWidth: '85%' }}>
                  {msg.category && (
                    <div style={{ fontSize: 10, marginBottom: 4, display: 'flex', gap: 4 }}>
                      <span className="tag tag-cyan" style={{ padding: '2px 6px', fontSize: 9 }}>{msg.category}</span>
                      {msg.difficulty && <span className={`tag ${msg.difficulty === 'hard' ? 'tag-amber' : msg.difficulty === 'medium' ? 'tag-cyan' : 'tag-green'}`} style={{ padding: '2px 6px', fontSize: 9 }}>{msg.difficulty}</span>}
                    </div>
                  )}
                  <div className={msg.role === 'ai' ? 'chat-ai' : (msg.role === 'user' ? 'chat-user' : '')} style={{ padding: '12px 16px', border: msg.role === 'system' ? '1px solid var(--accent-amber)' : 'none', borderRadius: 12, background: msg.role === 'system' ? 'rgba(245, 158, 11, 0.1)' : '' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: msg.role === 'ai' ? 'var(--accent-cyan)' : (msg.role === 'user' ? 'var(--accent-blue)' : 'var(--accent-amber)') }}>
                        {msg.role === 'ai' ? '🤖 AI' : (msg.role === 'user' ? '🎤 You' : '⚠️ System Alert')}
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
