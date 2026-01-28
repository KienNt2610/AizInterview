import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Mic, 
  Square, 
  ArrowRight,
  CheckCircle,
  Clock,
  X,
  Award,
  TrendingUp,
  TrendingDown,
  XCircle,
  Home,
  RotateCcw,
  BarChart3
} from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import {
  interviewTurnAPI,
  interviewAnswerAPI,
  interviewEvaluationAPI,
  interviewSessionAPI,
  aiInterviewAPI,
} from '../services/api';

import { useAiTranscriptStreaming } from '../hooks/useAiTranscriptStreaming';
import AiTranscriptCenter from '../components/interview/AiTranscriptCenter';
import FullScreenLoading from '../components/interview/FullScreenLoading';
import ReplayControls from '../components/interview/ReplayControls';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { speakTextVi, cancelSpeak, unlockTTS } from '../utils/tts';

// Maximum number of questions per interview
const MAX_QUESTIONS = 10;

const InterviewSession = () => {
  const { interviewId: sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Interview context from localStorage
  const [interviewContext, setInterviewContext] = useState(null);
  
  // Initialization flag - UI renders first question when this is true
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Phase-based state management
  const [phase, setPhase] = useState('loading'); 
  
  const [turnState, setTurnState] = useState({
    currentQuestion: null, 
    askedIds: [], 
    turnIndex: 1,
  });
  
  // Pending next question (stored after AI submit, committed on "Next" click)
  const [pendingNext, setPendingNext] = useState(null); 
  
  // Evaluation state (shown before next question)
  const [evaluation, setEvaluation] = useState(null);
  
  // Runtime evaluations array - stores all evaluations for summary page
  const [runtimeEvaluations, setRuntimeEvaluations] = useState([]); 
  
  // Recording timer (seconds)
  const [recordingTime, setRecordingTime] = useState(0);
  // Per-question countdown timer (seconds remaining to answer) - for UI only
  const [questionTimeLeft, setQuestionTimeLeft] = useState(60);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isEndOfInterview, setIsEndOfInterview] = useState(false);
  
  // Interview report state
  const [isInterviewEnded, setIsInterviewEnded] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [showReport, setShowReport] = useState(false);
  
  // Summary state (for inline summary display)
  const [summaryData, setSummaryData] = useState(null);
  
  // Recording state
  const [recordingState, setRecordingState] = useState('idle'); 
  const [recordedAudioBlob, setRecordedAudioBlob] = useState(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [replayState, setReplayState] = useState('idle'); 
  
  const [isRecording, setIsRecording] = useState(false); 
  const [isTranscribing, setIsTranscribing] = useState(false); 
  const [transcriptText, setTranscriptText] = useState(''); 
  const [recordedBlob, setRecordedBlob] = useState(null); 
  
  // AI Speech state
  const [aiSpeechState, setAiSpeechState] = useState('idle'); 
  const [feedbackText, setFeedbackText] = useState('');
  
  // Processing state
  const [isAnswerProcessing, setIsAnswerProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  

  const [savedAnswerTurnIds, setSavedAnswerTurnIds] = useState(new Set()); 

  const [turnIdToAnswerIdMap, setTurnIdToAnswerIdMap] = useState(new Map()); 
  
  // Audio recording refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Question countdown timer ref
  const questionTimerRef = useRef(null);
  const questionTimerQuestionIdRef = useRef(null);

  // Auto-next timeout after showing feedback
  const autoNextTimeoutRef = useRef(null);

  // Auto-submit "không biết" timeout per question
  const autoSubmitTimerRef = useRef(null);
  const hasAutoSubmittedRef = useRef(false);

  const recognitionRef = useRef(null);
  
  const hasHydratedRef = useRef(false);
  
  const submitLockRef = useRef(false);
  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);
  
  // AI Transcript streaming hook for questions
  const {
    liveTranscript: aiLiveTranscript,
    finalTranscript: aiFinalTranscript,
    isStreaming: isAiStreaming,
    startStreaming,
    stopStreaming,
    resetTranscript,
  } = useAiTranscriptStreaming({});

  // AI Feedback transcript streaming hook
  const {
    liveTranscript: feedbackLiveTranscript,
    finalTranscript: feedbackFinalTranscript,
    isStreaming: isFeedbackStreaming,
    startStreaming: startFeedbackStreaming,
    stopStreaming: stopFeedbackStreaming,
    resetTranscript: resetFeedbackTranscript,
  } = useAiTranscriptStreaming({});
  
  const getDisplayTranscript = () => {
    if (phase === 'showing_feedback') {
      if (evaluation?.feedback) {
        return evaluation.feedback;
      } else if (feedbackLiveTranscript || feedbackFinalTranscript) {
        return feedbackFinalTranscript || feedbackLiveTranscript;
      } else {
        return pendingNext?.display_text || '';
      }
    } else {
      const currentQuestionText = turnState.currentQuestion?.text || '';

      if (aiSpeechState === 'speaking' && aiLiveTranscript && aiLiveTranscript.length > 0) {

        return aiLiveTranscript;
      } else if (aiSpeechState === 'done' && aiFinalTranscript && aiFinalTranscript === currentQuestionText) {
        return aiFinalTranscript;
      } else {
        return currentQuestionText;
      }
    }
  };
  
  const updateTurnState = (updates) => {
    setTurnState(prev => ({ ...prev, ...updates }));
  };
  
  const commitQuestion = (questionObj) => {
    if (!questionObj || !questionObj.id) {
      console.error("=== COMMIT QUESTION ERROR: questionObj or questionObj.id is missing ===");
      console.error("questionObj:", questionObj);
      return;
    }
    
    const questionId = String(questionObj.id);
    const questionText = questionObj.text || questionObj.display_text || '';
    const questionTopic = questionObj.topic || null;
    const questionDifficulty = questionObj.difficulty || 'intermediate';
    
    console.log("=== COMMIT QUESTION: Atomic update ===");
    console.log("Question object:", { id: questionId, text: questionText, topic: questionTopic, difficulty: questionDifficulty });
    
    // Atomic update: set currentQuestion AND ensure askedIds includes questionId
    setTurnState(prev => {
      const currentQuestion = {
        id: questionId,
        text: questionText,
        topic: questionTopic,
        difficulty: questionDifficulty,
      };
      
      // Ensure askedIds includes currentQuestion.id (must be in sync)
      const updatedAskedIds = [...prev.askedIds.map(id => String(id))];
      if (!updatedAskedIds.includes(questionId)) {
        updatedAskedIds.push(questionId);
        console.log("=== COMMIT QUESTION: Added questionId to askedIds ===");
        console.log("questionId:", questionId);
        console.log("updatedAskedIds:", updatedAskedIds);
      } else {
        console.warn("=== COMMIT QUESTION WARNING: questionId already in askedIds ===");
        console.warn("questionId:", questionId);
        console.warn("askedIds:", updatedAskedIds);
      }
      
      return {
        ...prev,
        currentQuestion: currentQuestion,
        askedIds: updatedAskedIds,
      };
    });
    
    console.log("=== COMMIT QUESTION: State updated ===");
  };

  const displayTranscript = getDisplayTranscript();
  const isStreaming = phase === 'showing_feedback' ? false : isAiStreaming;

  const hydrateFromLocalStorage = () => {
    if (hasHydratedRef.current) {
      console.log("=== HYDRATION SKIPPED: Already hydrated (guard active) ===");
      return;
    }
    
    try {
      console.log("=== HYDRATION START: Loading from localStorage (ONCE ONLY) ===");
      
      const contextStr = localStorage.getItem('interviewContext');
      if (!contextStr) {
        toast('Không tìm thấy thông tin interview. Vui lòng bắt đầu lại.', { type: 'error' });
        navigate('/interview');
        return;
      }
      
      const rawContext = JSON.parse(contextStr);
      console.log("=== HYDRATION: Raw context from localStorage ===", rawContext);
      
      const normalizedContext = {
        ...rawContext,
        currentQuestionId: rawContext.current_question_id || rawContext.currentQuestionId || null,
        currentQuestionText: rawContext.currentQuestionText || rawContext.current_question_text || rawContext.display_text || '',
        currentTopic: rawContext.current_topic || rawContext.currentTopic || null,
        currentDifficulty: rawContext.current_difficulty || rawContext.currentDifficulty || 'intermediate',
        askedIds: rawContext.asked_ids || rawContext.askedIds || [],
        turnIndex: rawContext.turnIndex || rawContext.turn_index || 1,
      };
      
      console.log("=== HYDRATION: Normalized context ===", normalizedContext);
      
      setInterviewContext(normalizedContext);
      
      // 3. Initialize turn state from normalized context using commitQuestion (atomic update)
      const questionId = normalizedContext.currentQuestionId;
      const questionText = normalizedContext.currentQuestionText;
      const topic = normalizedContext.currentTopic;
      const difficulty = normalizedContext.currentDifficulty;
      const askedIds = Array.isArray(normalizedContext.askedIds) ? normalizedContext.askedIds : [];
      const turnIndex = normalizedContext.turnIndex >= 1 ? normalizedContext.turnIndex : 1;
      
      // Unlock TTS via user gesture (if not already unlocked)
      unlockTTS();
      
      // Validate question data
      if (!questionId || !questionText || questionText.trim().length === 0) {
        console.error("=== HYDRATION ERROR: Missing question data ===");
        toast('Không tìm thấy câu hỏi đầu tiên. Vui lòng bắt đầu lại.', { type: 'error' });
        navigate('/interview');
        return;
      }
      
      commitQuestion({
        id: questionId,
        text: questionText,
        topic: topic,
        difficulty: difficulty,
      });

      updateTurnState({ turnIndex: turnIndex });

      // Mark interview as initialized and ready for asking phase.
      // simulateAiQuestion will be triggered by the separate useEffect
      // that watches turnState.currentQuestion to avoid mismatched state warnings.
      setIsInitialized(true);
      setPhase('asking'); // Set phase to asking
      console.log("=== HYDRATION COMPLETE: isInitialized=true, first question ready ===");
      
      hasHydratedRef.current = true;
      console.log("=== HYDRATION COMPLETE: State initialized from localStorage (will not run again) ===");
      
    } catch (error) {
      console.error('Failed to load interview data:', error);
      toast('Không thể tải dữ liệu interview', { type: 'error' });
      setError('Không thể tải dữ liệu interview');
    }
  };
  
  useEffect(() => {
    hydrateFromLocalStorage();

  }, []); 

  const simulateAiQuestion = (questionText) => {
    // Verify questionText matches currentQuestion.text (guard against stale state)
    const currentQuestionText = turnState.currentQuestion?.text || '';
    if (questionText !== currentQuestionText) {
      console.warn("=== SIMULATE AI QUESTION WARNING: questionText doesn't match currentQuestion.text ===");
      console.warn("questionText:", questionText);
      console.warn("currentQuestion.text:", currentQuestionText);
      console.warn("Using currentQuestion.text instead to prevent state mismatch");
      // Use currentQuestion.text instead to prevent state mismatch
      questionText = currentQuestionText;
    }
    
    // Only proceed if we have a valid question text
    if (!questionText || questionText.trim().length === 0) {
      console.warn("=== SIMULATE AI QUESTION WARNING: No question text to simulate ===");
      return;
    }
    
    setPhase('asking');
    setAiSpeechState('speaking');
    resetTranscript(); // Clear previous transcript to prevent stale data
    setError(null);
    
    // Start streaming animation (visual effect only)
    startStreaming(questionText);
    
    const estimatedDuration = Math.min(questionText.length * 50, 5000); 
    
    setTimeout(() => {
      stopStreaming();
      setAiSpeechState('done');
    }, estimatedDuration);
  };

  // Simulate AI feedback (mock TTS + transcript)
  const simulateAiFeedback = (feedbackText) => {
    setPhase('ai_feedback');
    setAiSpeechState('speaking');
    resetFeedbackTranscript();
    setFeedbackText(feedbackText);
    
    startFeedbackStreaming(feedbackText);
    
    const estimatedDuration = Math.min(feedbackText.length * 50, 5000);
    
    setTimeout(() => {
      stopFeedbackStreaming();
      setAiSpeechState('done');
      setPhase('ready_next');
    }, estimatedDuration);
  };

  useEffect(() => {
    checkMicrophonePermission();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
      }
      if (autoNextTimeoutRef.current) {
        clearTimeout(autoNextTimeoutRef.current);
      }
      if (autoSubmitTimerRef.current) {
        clearTimeout(autoSubmitTimerRef.current);
      }
    };
  }, []);
  
  const prevQuestionIdRef = useRef(null);
  useEffect(() => {
    const currentQuestionId = turnState.currentQuestion?.id;
    const currentQuestionText = turnState.currentQuestion?.text;
    
    if (
      isInitialized &&
      phase === 'asking' &&
      currentQuestionId &&
      currentQuestionText &&
      currentQuestionText.trim().length > 0 &&
      currentQuestionId !== prevQuestionIdRef.current
    ) {
      console.log("=== AUTO-SIMULATE: Question changed, simulating AI question ===");
      console.log("Previous questionId:", prevQuestionIdRef.current);
      console.log("Current questionId:", currentQuestionId);
      console.log("Current questionText:", currentQuestionText);
      
      // Update ref to track current question
      prevQuestionIdRef.current = currentQuestionId;
      
      // Simulate AI asking the new question
      simulateAiQuestion(currentQuestionText);
    }
  }, [turnState.currentQuestion?.id, turnState.currentQuestion?.text, phase, isInitialized]);

  // TTS: Speak question when currentQuestion.text changes
  useEffect(() => {
    if (
      isInitialized &&
      phase === 'asking' &&
      turnState.currentQuestion?.text &&
      turnState.currentQuestion.text.trim().length > 0
    ) {
      const questionText = turnState.currentQuestion.text;
      console.log('[TTS] Speaking question:', questionText.substring(0, 50) + '...');
      speakTextVi(questionText, {
        onStart: () => {
          console.log('[TTS] Question speech started');
        },
        onEnd: () => {
          console.log('[TTS] Question speech ended');
        },
        onError: (event) => {
          console.error('[TTS] Question speech error:', event);
        },
      });
    }
  }, [turnState.currentQuestion?.text, phase, isInitialized]);

  // TTS: Speak feedback when evaluation.feedback is set
  useEffect(() => {
    if (
      phase === 'showing_feedback' &&
      evaluation?.feedback &&
      evaluation.feedback.trim().length > 0
    ) {
      const feedbackText = evaluation.feedback;
      console.log('[TTS] Speaking feedback:', feedbackText.substring(0, 50) + '...');
      speakTextVi(feedbackText, {
        onStart: () => {
          console.log('[TTS] Feedback speech started');
        },
        onEnd: () => {
          console.log('[TTS] Feedback speech ended');
        },
        onError: (event) => {
          console.error('[TTS] Feedback speech error:', event);
        },
      });
    }
  }, [evaluation?.feedback, phase]);

  // TTS: Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelSpeak();
    };
  }, []);

  useEffect(() => {
    if (recordingState === 'recording') {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [recordingState]);

  // Question countdown: 60s for each question while in "asking" phase (UI only)
  useEffect(() => {
    const currentQuestionId = turnState.currentQuestion?.id;

    // Start a fresh 60s countdown when a new question appears in asking phase
    if (
      phase === 'asking' &&
      currentQuestionId &&
      currentQuestionId !== questionTimerQuestionIdRef.current
    ) {
      questionTimerQuestionIdRef.current = currentQuestionId;

      // Reset remaining time
      setQuestionTimeLeft(60);

       // Arm auto submit timer for this question
      armAutoSubmitTimer();

      // Clear any existing timer
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
      }

      questionTimerRef.current = setInterval(() => {
        setQuestionTimeLeft((prev) => {
          if (prev <= 1) {
            if (questionTimerRef.current) {
              clearInterval(questionTimerRef.current);
              questionTimerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // When phase is no longer asking, stop the countdown and clear auto-submit timer
    if (phase !== 'asking' && questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
      clearAutoSubmitTimer('leave_asking_phase');
    }

    return () => {
      // Cleanup on effect re-run when leaving asking phase
      if (phase !== 'asking' && questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
        questionTimerRef.current = null;
      }
    };
  }, [phase, turnState.currentQuestion?.id]);

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      toast('Microphone access denied. Please enable it to continue.', { type: 'error' });
    }
  };

  const clearAutoSubmitTimer = (reason = 'unknown') => {
    if (autoSubmitTimerRef.current) {
      console.log('=== [AUTO] Clear 60s timeout === reason =', reason);
      clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }
  };

  const triggerAutoSubmit = () => {
    console.log('=== [AUTO] Timeout fired - evaluating auto-submit ===', {
      phase,
      submitLock: submitLockRef.current,
      isSubmitting,
      isAnswerProcessing,
      recordingState,
    });

    // Guards
    if (submitLockRef.current || isSubmitting || isAnswerProcessing) {
      console.log('=== [AUTO] Skip auto-submit: submitting/processing in progress ===');
      return;
    }
    if (phase !== 'asking') {
      console.log('=== [AUTO] Skip auto-submit: phase is not asking === phase =', phase);
      return;
    }
    if (!turnState.currentQuestion || !turnState.currentQuestion.id) {
      console.log('=== [AUTO] Skip auto-submit: no currentQuestion ===');
      return;
    }
    if (hasAutoSubmittedRef.current) {
      console.log('=== [AUTO] Skip auto-submit: already auto-submitted for this question ===');
      return;
    }

    // If still recording, stop recording first (nhưng vẫn auto gửi "không biết")
    if (recordingState === 'recording') {
      console.log('=== [AUTO] Stopping recording before auto-submit ===');
      stopRecording();
    }

    hasAutoSubmittedRef.current = true;

    toast('Hết thời gian. Tự động gửi: "không biết"', { type: 'warning' });

    // Force answer "không biết", bypass STT
    handleSubmitAnswer({
      forceTextAnswer: 'không biết',
      reason: 'timeout_60s',
    });
  };

  const armAutoSubmitTimer = () => {
    clearAutoSubmitTimer('re-arm');
    hasAutoSubmittedRef.current = false;

    if (
      !isInitialized ||
      phase !== 'asking' ||
      !turnState.currentQuestion ||
      !turnState.currentQuestion.id ||
      isSubmitting ||
      isAnswerProcessing
    ) {
      console.log('=== [AUTO] Not arming timer due to state ===', {
        isInitialized,
        phase,
        hasQuestion: !!turnState.currentQuestion,
        questionId: turnState.currentQuestion?.id,
        isSubmitting,
        isAnswerProcessing,
      });
      return;
    }

    const qId = turnState.currentQuestion.id;
    const tIndex = turnState.turnIndex;

    console.log('=== [AUTO] Armed 60s timeout for question ===', {
      questionId: qId,
      turnIndex: tIndex,
    });

    autoSubmitTimerRef.current = setTimeout(() => {
      autoSubmitTimerRef.current = null;
      triggerAutoSubmit();
    }, 60000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // User bắt đầu ghi âm, clear auto-timeout để không đè lên hành vi user
      clearAutoSubmitTimer('startRecording');

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setRecordedAudioBlob(audioBlob);
        setRecordedAudioUrl(audioUrl);
        setRecordedBlob(audioBlob); // Store blob for transcription
        setRecordingState('stopped');
        setIsRecording(false); // Clear recording state
        // Phase stays 'asking' - user can review and submit
        
        // Stop speech recognition if it's running
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {
            // Ignore errors
          }
          recognitionRef.current = null;
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      // Start speech recognition for real-time transcription
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'vi-VN';
          recognition.continuous = true; // Continuous mode
          recognition.interimResults = true; // Show interim results
          recognition.maxAlternatives = 1;
          
          let fullTranscript = '';
          
          recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
              } else {
                interimTranscript += transcript;
              }
            }
            
            fullTranscript = finalTranscript + interimTranscript;
            setTranscriptText(fullTranscript.trim());
            
            if (import.meta.env.DEV) {
              console.log("=== REAL-TIME SPEECH RECOGNITION ===");
              console.log("Interim:", interimTranscript);
              console.log("Final:", finalTranscript);
              console.log("Full:", fullTranscript.trim());
            }
          };
          
          recognition.onerror = (event) => {
            console.error("Speech recognition error during recording:", event.error);
      
          };
          
          recognition.onend = () => {
            // Restart recognition if still recording
            if (recordingState === 'recording' && !recognitionRef.current) {
              try {
                recognition.start();
              } catch (e) {
                // Ignore restart errors
              }
            }
          };
          
          recognition.start();
          recognitionRef.current = recognition;
          console.log("=== STARTED CONTINUOUS SPEECH RECOGNITION ===");
        } catch (recognitionError) {
          console.warn("Failed to start speech recognition:", recognitionError);
          // Continue recording even if recognition fails
        }
      }

      mediaRecorderRef.current.start();
      setRecordingState('recording');
      setIsRecording(true); // Set explicit recording state
      setRecordingTime(0);
      // Phase stays 'asking' - user is recording
      // Clear previous transcript when starting new recording
      setTranscriptText('');
      toast('Bắt đầu ghi âm', { type: 'info' });
    } catch (error) {
      toast('Không thể bắt đầu ghi âm. Vui lòng kiểm tra quyền truy cập microphone.', { type: 'error' });
      setError('Không thể truy cập microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false); // Clear recording state
      toast('Đã dừng ghi âm', { type: 'info' });
    }
  };
  
  const clearRecording = () => {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    setRecordedBlob(null);
    setRecordingState('idle');
    setIsRecording(false);
    setRecordingTime(0);
    setTranscriptText(''); // Clear transcript when clearing recording
    // Phase stays 'asking' - user can record again
  };

  // Strict submit pipeline (C) with concurrency guards (D)
  const handleSubmitAnswer = async (options = {}) => {
    const { forceTextAnswer = null, reason = '' } = options;
    // Concurrency guard: Prevent double submit
    if (submitLockRef.current || isSubmitting || isAnswerProcessing) {
      console.warn("=== SUBMISSION BLOCKED: Already in progress ===");
      console.warn("submitLockRef.current:", submitLockRef.current);
      console.warn("isSubmitting:", isSubmitting, "isAnswerProcessing:", isAnswerProcessing);
      toast('Đang xử lý câu trả lời. Vui lòng đợi...', { type: 'warning' });
      return;
    }
    
    // Validation: Must have interview context
    if (!interviewContext) {
      toast('Không tìm thấy thông tin interview', { type: 'error' });
      return;
    }
    
    // Validation: Must have current question (single source of truth)
    if (!turnState.currentQuestion || !turnState.currentQuestion.id || !turnState.currentQuestion.text) {
      toast('Không tìm thấy câu hỏi hiện tại', { type: 'error' });
      return;
    }
    
    // Abort any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller and request ID for this submission
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const currentRequestId = ++requestIdRef.current;
    
    // Set submitting guard (prevents double-submit)
    submitLockRef.current = true;
    setIsSubmitting(true);
    setIsAnswerProcessing(true);
    setPhase('submitting');
    setError(null);
    
    console.log("=== SUBMIT ANSWER: Starting (submit lock active, requestId:", currentRequestId, ") ===");
    
    // Take snapshot of current turnState to avoid stale closure (C.6)
    // CRITICAL: askedIds must include currentQuestion.id (ensured by commitQuestion)
    const stateSnapshot = {
      currentQuestion: { ...turnState.currentQuestion }, // Copy currentQuestion object
      askedIds: [...turnState.askedIds], // Must include currentQuestion.id
      turnIndex: turnState.turnIndex,
    };
    
    // Verify askedIds includes currentQuestion.id (guard)
    const currentQuestionIdStr = String(stateSnapshot.currentQuestion.id);
    if (!stateSnapshot.askedIds.includes(currentQuestionIdStr)) {
      console.warn("=== STATE SNAPSHOT WARNING: askedIds missing currentQuestion.id ===");
      console.warn("currentQuestion.id:", currentQuestionIdStr);
      console.warn("askedIds:", stateSnapshot.askedIds);
      // Fix: add currentQuestion.id to askedIds
      stateSnapshot.askedIds.push(currentQuestionIdStr);
      console.warn("Fixed: added currentQuestion.id to askedIds");
    }
    
    console.log("=== STATE SNAPSHOT (for AI submit) ===", {
      currentQuestion: stateSnapshot.currentQuestion,
      askedIds: stateSnapshot.askedIds,
      turnIndex: stateSnapshot.turnIndex,
      verified: stateSnapshot.askedIds.includes(currentQuestionIdStr),
    });
    
    try {
      // Pipeline Step 1: Stop recording if still recording
      if (isRecording || recordingState === 'recording') {
        console.log("=== STEP 1: Stopping recording ===");
        stopRecording();
        // Wait a bit for recording to fully stop
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Pipeline Step 2: Wait 300ms for speech final results (flush) (C.2)
      console.log("=== STEP 2: Waiting 300ms for speech final results (flush) ===");
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Pipeline Step 3: Build userAnswer (trim, fallback if empty) (C.3, Task 3)
      console.log("=== STEP 3: Building userAnswer ===");
      let finalTranscriptText = transcriptText?.trim() || '';

      // FORCE ANSWER MODE: bypass STT and use provided text
      if (typeof forceTextAnswer === 'string' && forceTextAnswer.trim().length > 0) {
        finalTranscriptText = forceTextAnswer.trim();
        setTranscriptText(finalTranscriptText);
        setIsTranscribing(false);
        console.log("=== FORCE ANSWER MODE ===", {
          reason,
          answerLength: finalTranscriptText.length,
          answerPreview: finalTranscriptText.substring(0, 100),
        });
      } else {
        // Auto-transcribe if transcript is empty (using Web Speech API)
        if (!finalTranscriptText || finalTranscriptText.length === 0) {
          try {
            setIsTranscribing(true);
            console.log("=== AUTO-TRANSCRIBING USING WEB SPEECH API ===");
            console.log("Note: Web Speech API requires live microphone input. User will need to speak again.");
            
            toast('Vui lòng nói lại câu trả lời để chuyển đổi thành văn bản...', { type: 'info' });
            
            // Use Web Speech API for real-time speech recognition
            // Note: Web Speech API requires live microphone input, not audio blobs
            // User will need to speak again when this is called
            finalTranscriptText = await speechToTextOnce();
            
            // Guard: Reject mock/hard-coded transcript text
            if (finalTranscriptText && finalTranscriptText.toLowerCase().includes('bản ghi âm mẫu')) {
              throw new Error('Phát hiện văn bản mẫu. Vui lòng ghi âm lại với giọng nói thật.');
            }
            
            console.log("=== TRANSCRIPTION COMPLETE (REAL) ===");
            console.log("REAL Transcript length:", finalTranscriptText.length);
            console.log("REAL Transcript text:", finalTranscriptText);
            console.log("REAL Transcript preview:", finalTranscriptText.substring(0, 100) + (finalTranscriptText.length > 100 ? '...' : ''));
            
            setTranscriptText(finalTranscriptText); // Update state for UI
            toast('Đã chuyển đổi giọng nói thành văn bản!', { type: 'success' });
          } catch (transcribeError) {
            console.error('Transcription error:', transcribeError);
            const errorMsg = transcribeError?.message || 'Không thể chuyển đổi giọng nói thành văn bản. Vui lòng thử lại.';
            setError(errorMsg);
            toast(errorMsg, { type: 'error' });
            setIsAnswerProcessing(false);
            setIsTranscribing(false);
            setIsSubmitting(false);
            submitLockRef.current = false; // Release submit lock
            // Phase stays 'asking' - user can retry
            return; // Stop here if transcription fails
          } finally {
            setIsTranscribing(false);
          }
        }
      }
      
      // Final validation: if still empty after transcription, use fallback (Task 3)
      if (!finalTranscriptText || finalTranscriptText.trim().length === 0) {
        console.warn("=== EMPTY TRANSCRIPT: Using fallback text ===");
        finalTranscriptText = "Tôi không trả lời câu này."; // Fallback for empty transcript
        setTranscriptText(finalTranscriptText);
      }
      
      // Final trim and validation
      finalTranscriptText = finalTranscriptText.trim();
      
      // Guard: Reject mock/hard-coded transcript text
      if (finalTranscriptText.toLowerCase().includes('bản ghi âm mẫu')) {
        throw new Error('Phát hiện văn bản mẫu. Vui lòng ghi âm lại với giọng nói thật.');
      }
      
      // Ensure we have a valid answer (either real transcript or fallback)
      if (!finalTranscriptText || finalTranscriptText.length === 0) {
        throw new Error('Không thể xác định câu trả lời. Vui lòng thử lại.');
      }
      
      console.log("=== FINAL USER ANSWER ===");
      console.log("Answer length:", finalTranscriptText.length);
      console.log("Answer text:", finalTranscriptText);
      console.log("Answer preview:", finalTranscriptText.substring(0, 100) + (finalTranscriptText.length > 100 ? '...' : ''));
      
      // Check if request was aborted
      if (abortController.signal.aborted) {
        console.log("=== SUBMIT ABORTED: Request was cancelled ===");
        return;
      }
      
      // Pipeline Step 4: Save TURN (question) to DB -> get InterviewTurnId (C.4)
      console.log("=== STEP 4: Saving TURN to DB ===");
      const turnIndex = stateSnapshot.turnIndex;
      
      // 1) Save TURN (question) to DB
      // Đảm bảo interviewSessionId là string (uuid), không phải number
      const interviewSessionIdStr = String(sessionId);
      
      // Build payload theo DTO backend yêu cầu: SaveInterviewTurnDto
      // Required: InterviewSessionId (Guid), TurnIndex (int), QuestionText (string), Difficulty (string)
      // Optional: QuestionId (string)
      // Note: QuestionText lấy từ currentQuestion.text (single source of truth)
      const saveTurnPayload = {
        InterviewSessionId: interviewSessionIdStr, // Guid (string) - Required
        TurnIndex: Number(turnIndex), // int - Required, bắt đầu từ 1
        QuestionText: stateSnapshot.currentQuestion.text || '', // string - Required (lấy từ currentQuestion.text)
        Difficulty: stateSnapshot.currentQuestion.difficulty || 'intermediate', // string - Required
        // Optional fields
        QuestionId: stateSnapshot.currentQuestion.id ? String(stateSnapshot.currentQuestion.id) : undefined, // string - Optional (không gửi nếu null/empty)
      };
      
      // Remove undefined fields để payload clean
      if (!saveTurnPayload.QuestionId) {
        delete saveTurnPayload.QuestionId;
      }
      
      console.log("=== SAVE TURN PAYLOAD ===");
      console.log("Payload:", JSON.stringify(saveTurnPayload, null, 2));
      console.log("InterviewSessionId (type):", typeof saveTurnPayload.InterviewSessionId, "value:", saveTurnPayload.InterviewSessionId);
      console.log("TurnIndex (type):", typeof saveTurnPayload.TurnIndex, "value:", saveTurnPayload.TurnIndex);
      console.log("QuestionText (from AI display_text):", saveTurnPayload.QuestionText);
      console.log("Difficulty:", saveTurnPayload.Difficulty);
      if (saveTurnPayload.QuestionId) {
        console.log("QuestionId (optional):", saveTurnPayload.QuestionId);
      }
      
      let turnResponse;
      let turnId = null;
      try {
        turnResponse = await interviewTurnAPI.saveTurn(saveTurnPayload);
        console.log("=== SAVE TURN SUCCESS ===");
        console.log("Response status:", turnResponse.status);
        console.log("Response data:", JSON.stringify(turnResponse.data, null, 2));
        console.log("Response data (raw):", turnResponse.data);
        
        // Extract InterviewTurnId from response
        // Backend returns: { data: "<InterviewTurnId-guid>", error: null, isSuccess: true }
        // InterviewTurnId is the GUID string in response.data.data
        turnId = turnResponse?.data?.data ?? // GUID string directly in data.data
                 turnResponse?.data?.turnId ?? 
                 turnResponse?.data?.id ?? 
                 null;
        
        console.log("=== EXTRACTED INTERVIEW TURN ID ===");
        console.log("InterviewTurnId:", turnId);
        console.log("InterviewTurnId type:", typeof turnId);
      } catch (saveTurnError) {
        console.error("=== SAVE TURN ERROR ===");
        console.error("Error:", saveTurnError);
        console.error("Error status:", saveTurnError.response?.status);
        console.error("Error statusText:", saveTurnError.response?.statusText);
        
        // Log full error response (ProblemDetails/validation)
        const errorData = saveTurnError.response?.data;
        console.error("Error response?.data (full):", JSON.stringify(errorData, null, 2));
        console.error("Error response?.data (raw):", errorData);
        
        // Parse error message
        let errorMessage = "Failed to save turn";
        let errorCode = null;
        if (errorData?.error?.message) {
          errorMessage = errorData.error.message;
          errorCode = errorData.error.code;
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.detail) {
          errorMessage = errorData.detail;
        } else if (errorData?.title) {
          errorMessage = errorData.title;
        } else if (errorData?.errors) {
          // Format validation errors
          const validationErrors = Object.entries(errorData.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
            .join(" | ");
          errorMessage = `Validation failed: ${validationErrors}`;
        } else if (typeof errorData === "string") {
          errorMessage = errorData;
        }
        
        console.error("Parsed error message:", errorMessage);
        console.error("Error code:", errorCode);
        
        // Handle "WRONG_TURN" or "Turn index does not match" - turn đã tồn tại, skip save-turn
        if (errorCode === "WRONG_TURN" || 
            errorMessage?.toLowerCase().includes("turn index does not match") ||
            errorMessage?.toLowerCase().includes("wrong_turn")) {
          console.warn("=== TURN ALREADY EXISTS ===");
          console.warn("Turn với TurnIndex", turnIndex, "đã tồn tại. Skip save-turn và tiếp tục với save-answer.");
          // Turn đã tồn tại, tiếp tục flow mà không throw error
          // turnId sẽ được lấy từ BE detail nếu cần
        } else {
          // Các lỗi khác, throw để dừng flow
          throw new Error(`Save turn failed: ${errorMessage}`);
        }
      }

      // Check if request was aborted
      if (abortController.signal.aborted || currentRequestId !== requestIdRef.current) {
        console.log("=== SUBMIT ABORTED: Request was cancelled or outdated ===");
        return;
      }
      
      // Pipeline Step 5: Save ANSWER to DB -> get InterviewAnswerId (C.5)
      console.log("=== STEP 5: Saving ANSWER to DB ===");
      const turnIdStr = turnId ? String(turnId) : null;
      const isAnswerAlreadySaved = turnIdStr && savedAnswerTurnIds.has(turnIdStr);
      
      // Store InterviewAnswerId in outer scope to use for save-evaluation
      let interviewAnswerId = null;
      
      if (isAnswerAlreadySaved) {
        console.log("=== ANSWER ALREADY SAVED ===");
        console.log("InterviewTurnId:", turnIdStr, "already in savedAnswerTurnIds");
        console.log("Skipping save-answer, proceeding directly to AI submit");
        
        // Try to get InterviewAnswerId from mapping if answer was already saved
        if (turnIdStr) {
          interviewAnswerId = turnIdToAnswerIdMap.get(turnIdStr) ?? null;
          if (interviewAnswerId) {
            console.log("=== RETRIEVED EXISTING ANSWER ID FROM MAPPING ===");
            console.log("InterviewAnswerId:", interviewAnswerId);
          }
        }
      } else {
        // Validate InterviewTurnId exists before proceeding
        if (!turnId || typeof turnId !== 'string' || turnId.trim() === '') {
          throw new Error('InterviewTurnId is required. Please try again.');
        }
        
        // Build payload according to backend DTO: SaveInterviewAnswerDto
        // Required: InterviewSessionId (Guid), InterviewTurnId (Guid), UserAnswer (string), TurnIndex (int)
        const saveAnswerPayload = {
          InterviewSessionId: String(sessionId), // Guid (string) - Required
          InterviewTurnId: String(turnId), // Guid (string) - Required
          UserAnswer: finalTranscriptText, // string - Required (uses finalTranscriptText, may be fallback)
          TurnIndex: Number(turnIndex), // int - Required, must be > 0
        };
        
        // Debug log
        // Debug log - show REAL transcript being saved
        console.log("=== SAVE ANSWER WITH REAL TRANSCRIPT ===");
        console.log("SAVE ANSWER payload:", JSON.stringify(saveAnswerPayload, null, 2));
        console.log("REAL UserAnswer length:", saveAnswerPayload.UserAnswer.length);
        console.log("REAL UserAnswer text:", saveAnswerPayload.UserAnswer);
        console.log("REAL UserAnswer preview:", saveAnswerPayload.UserAnswer.substring(0, 100) + (saveAnswerPayload.UserAnswer.length > 100 ? '...' : ''));
        console.log("SAVE ANSWER InterviewTurnId:", saveAnswerPayload.InterviewTurnId);
        
        let answerResponse;
        try {
          answerResponse = await interviewAnswerAPI.saveAnswer(saveAnswerPayload);
          
          // Extract InterviewAnswerId from response (response.data.data)
          // Store in outer scope variable to use directly for save-evaluation (fix stale state issue)
          interviewAnswerId = answerResponse?.data?.data ?? 
                             answerResponse?.data?.answerId ?? 
                             answerResponse?.data?.id ?? 
                             null;
          
          console.log("=== EXTRACTED INTERVIEW ANSWER ID (LOCAL VARIABLE) ===");
          console.log("InterviewAnswerId:", interviewAnswerId);
          console.log("InterviewAnswerId type:", typeof interviewAnswerId);
          console.log("From InterviewTurnId:", turnIdStr);
          console.log("Will be used directly for save-evaluation (not from state)");
          
          // Store mapping: InterviewTurnId -> InterviewAnswerId (for future reference)
          if (interviewAnswerId && turnIdStr) {
            setTurnIdToAnswerIdMap(prev => {
              const newMap = new Map(prev);
              newMap.set(turnIdStr, String(interviewAnswerId));
              console.log("=== STORED TURN ID -> ANSWER ID MAPPING ===");
              console.log("Mapping:", { turnId: turnIdStr, answerId: String(interviewAnswerId) });
              console.log("Current map size:", newMap.size);
              return newMap;
            });
          }
          
          // Mark this turnId as saved to prevent duplicate calls
          setSavedAnswerTurnIds(prev => new Set([...prev, turnIdStr]));
          console.log("=== ANSWER SAVED - Added to savedAnswerTurnIds ===");
          console.log("Saved turnIds:", Array.from(savedAnswerTurnIds).concat([turnIdStr]));
          
          if (import.meta.env.DEV) {
            console.log("=== SAVE ANSWER SUCCESS ===");
            console.log("Response status:", answerResponse.status);
            console.log("Response data:", JSON.stringify(answerResponse.data, null, 2));
          }
        } catch (saveAnswerError) {
          console.error("=== SAVE ANSWER ERROR ===");
          console.error("Error status:", saveAnswerError.response?.status);
          console.error("Error statusText:", saveAnswerError.response?.statusText);
          
          const errorData = saveAnswerError.response?.data;
          const status = saveAnswerError.response?.status;
          const errorCode = errorData?.error?.code;
          const errorMessage = errorData?.error?.message ?? errorData?.message ?? errorData?.detail ?? "Failed to save answer";
          
          // Log error response (concise)
          if (import.meta.env.DEV) {
            console.error("Error response?.data:", JSON.stringify(errorData, null, 2));
          }
          
          // Handle ANSWER_ALREADY_EXISTS - mark as saved and continue
          if (status === 400 && (errorCode === "ANSWER_ALREADY_EXISTS" || errorMessage?.toLowerCase().includes("already exists"))) {
            console.warn("=== ANSWER ALREADY EXISTS - Marking as saved ===");
            console.warn("InterviewTurnId:", turnIdStr, "already exists in backend");
            // Mark as saved to prevent retry
            setSavedAnswerTurnIds(prev => new Set([...prev, turnIdStr]));
            // Continue to AI submit (don't throw error)
          } else {
            // Other errors - throw to stop flow
            let correlationId = errorData?.error?.correlationId ?? errorData?.correlationId;
            
            if (status === 400 || status === 404) {
              if (correlationId && import.meta.env.DEV) {
                console.error("Correlation ID:", correlationId);
              }
              throw new Error(errorMessage || `Bad request (${status})`);
            } else if (status === 500) {
              const friendlyMessage = "Server error occurred. Please try again later.";
              if (correlationId) {
                console.error("Correlation ID:", correlationId);
                throw new Error(`${friendlyMessage} (Correlation ID: ${correlationId})`);
              }
              throw new Error(friendlyMessage);
            } else {
              throw new Error(errorMessage || `Request failed (${status})`);
            }
          }
        }
      }

      // Check if request was aborted
      if (abortController.signal.aborted || currentRequestId !== requestIdRef.current) {
        console.log("=== SUBMIT ABORTED: Request was cancelled or outdated ===");
        return;
      }
      
      // CRITICAL: Check if we've reached MAX_QUESTIONS before calling AI submit
      const turnIndexForCheck = stateSnapshot.turnIndex;
      if (turnIndexForCheck >= MAX_QUESTIONS) {
        console.log("=== MAX QUESTIONS REACHED - ENDING INTERVIEW ===");
        console.log("Current turnIndex:", turnIndexForCheck);
        console.log("MAX_QUESTIONS:", MAX_QUESTIONS);
        console.log("Skipping AI submit and ending interview");
        
        setIsAnswerProcessing(false);
        setIsSubmitting(false);
        
        try {
          // End interview session
          console.log("=== ENDING INTERVIEW SESSION ===");
          console.log("sessionId (raw):", sessionId);
          console.log("sessionId (type):", typeof sessionId);
          const sessionIdStr = String(sessionId);
          console.log("sessionId (string):", sessionIdStr);
          
          if (!sessionId || sessionIdStr === 'undefined' || sessionIdStr === 'null') {
            throw new Error('Invalid sessionId. Cannot end interview.');
          }
          
          await interviewSessionAPI.end(sessionIdStr);
          console.log("=== INTERVIEW SESSION ENDED SUCCESSFULLY ===");
          
          toast('Cuộc phỏng vấn đã hoàn thành!', { type: 'success' });
          
          // Navigate to summary page
          setTimeout(() => {
            navigate(`/interview/${sessionIdStr}/summary`);
          }, 100);
        } catch (error) {
          console.error("=== ERROR ENDING INTERVIEW ===");
          console.error("Error:", error);
          console.error("Error response:", error.response);
          console.error("Error response.data:", error.response?.data);
          console.error("Error status:", error.response?.status);
          console.error("Error message:", error.message);
          
          // Even if end-interview failed, navigate to summary (interview might already be ended)
          toast('Cuộc phỏng vấn đã hoàn thành!', { type: 'success' });
          setTimeout(() => {
            navigate(`/interview/${sessionIdStr}/summary`);
          }, 100);
        }
        
        // Release submit lock
        submitLockRef.current = false;
        return; // CRITICAL: Do NOT call AI submit
      }
      
      // Pipeline Step 6: Call AI /api/submit using snapshot of current state (not stale closure) (C.6)
      console.log("=== STEP 6: Calling AI /api/submit (using state snapshot) ===");
      console.log("Current turnIndex:", turnIndexForCheck, "< MAX_QUESTIONS:", MAX_QUESTIONS, "- Proceeding with AI submit");
      
      // Build payload EXACTLY per AI Interviewer API doc:
      // { role_id, current_question_id, user_answer, current_topic, current_difficulty, asked_ids, mode }
      // CRITICAL: asked_ids must include current_question_id (ensured by commitQuestion and snapshot verification)
      const aiSubmitPayload = {
        role_id: interviewContext?.roleId, // Role ID from job description (string) - REQUIRED
        current_question_id: String(stateSnapshot.currentQuestion.id), // Current question ID from snapshot (string) - REQUIRED
        user_answer: finalTranscriptText, // User's answer text (string, non-empty) - REQUIRED
        current_topic: stateSnapshot.currentQuestion.topic || '', // Current topic from snapshot (string) - REQUIRED
        current_difficulty: stateSnapshot.currentQuestion.difficulty || 'intermediate', // Current difficulty from snapshot (string) - REQUIRED
        asked_ids: stateSnapshot.askedIds.map(id => String(id)), // Array of question IDs from snapshot (string[]) - REQUIRED (includes current_question_id)
        mode: interviewContext?.mode ?? "simulation", // Interview mode (string) - REQUIRED
      };
      
      // Verify asked_ids includes current_question_id (guard)
      const currentQIdStr = String(stateSnapshot.currentQuestion.id);
      if (!aiSubmitPayload.asked_ids.includes(currentQIdStr)) {
        console.warn("=== AI SUBMIT PAYLOAD WARNING: asked_ids missing current_question_id ===");
        console.warn("current_question_id:", currentQIdStr);
        console.warn("asked_ids:", aiSubmitPayload.asked_ids);
        // Fix: add current_question_id to asked_ids
        aiSubmitPayload.asked_ids.push(currentQIdStr);
        console.warn("Fixed: added current_question_id to asked_ids");
      }
      
      // Log final payload before sending (per AI Interviewer API doc) - show REAL transcript
      console.log("=== CALLING AI /api/submit WITH REAL TRANSCRIPT ===");
      console.log("AI submit payload (per API doc):", JSON.stringify(aiSubmitPayload, null, 2));
      console.log("Payload details:", {
        role_id: aiSubmitPayload.role_id,
        current_question_id: aiSubmitPayload.current_question_id,
        user_answer_length: aiSubmitPayload.user_answer.length,
        user_answer_text: aiSubmitPayload.user_answer, // REAL transcript
        user_answer_preview: aiSubmitPayload.user_answer.substring(0, 100) + (aiSubmitPayload.user_answer.length > 100 ? '...' : ''),
        current_topic: aiSubmitPayload.current_topic,
        current_difficulty: aiSubmitPayload.current_difficulty,
        asked_ids_count: aiSubmitPayload.asked_ids.length,
        asked_ids: aiSubmitPayload.asked_ids,
        mode: aiSubmitPayload.mode,
      });
      
      let aiRes;
      try {
        // Call AI API with abort signal
        aiRes = await aiInterviewAPI.submit(aiSubmitPayload);
        
        // Check if this response is for the current request (ignore outdated responses)
        if (currentRequestId !== requestIdRef.current) {
          console.warn("=== IGNORING OUTDATED AI RESPONSE ===");
          console.warn("Response requestId:", currentRequestId, "Current requestId:", requestIdRef.current);
          return; // Ignore this response, a newer request is in progress
        }
      } catch (aiError) {
        // Handle AI submit errors - DO NOT retrigger save-answer
        // Answer is already saved (or marked as saved), so we only need to handle AI error
        
        if (aiError.response?.status === 422) {
          const errorData = aiError.response?.data;
          console.error("=== AI SUBMIT 422 VALIDATION ERROR ===");
          console.error("Error response:", JSON.stringify(errorData, null, 2));
          console.error("Error details:", errorData);
          
          // Extract error message from 422 response
          let errorMessage = "AI validation error occurred";
          if (errorData?.detail) {
            errorMessage = errorData.detail;
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          } else if (errorData?.errors && typeof errorData.errors === 'object') {
            // Format validation errors
            const errorMessages = Object.entries(errorData.errors)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('; ');
            errorMessage = `Validation errors: ${errorMessages}`;
          }
          
          const userFriendlyMessage = "AI service validation failed. Please check your answer and try again.";
          setError(userFriendlyMessage);
          toast(userFriendlyMessage, { type: 'error' });
          console.error("Full error:", aiError);
          // Note: Answer is already saved, so we don't need to retry save-answer
          throw new Error(errorMessage);
        }
        
        // Re-throw other errors
        // Note: Answer is already saved, so retry will only call AI submit again (not save-answer)
        throw aiError;
      }
      
      console.log("AI submit response:", aiRes.data);
      const aiPayload = aiRes.data?.data ?? aiRes.data;
      
      // Debug: Log AI response structure
      console.log("=== AI RESPONSE STRUCTURE ===");
      console.log("aiPayload keys:", Object.keys(aiPayload || {}));
      console.log("evaluation:", aiPayload?.evaluation);
      console.log("next_question:", aiPayload?.next_question);
      console.log("display_text:", aiPayload?.display_text);
      console.log("new_topic:", aiPayload?.new_topic);
      console.log("next_difficulty:", aiPayload?.next_difficulty);
      console.log("topic_changed:", aiPayload?.topic_changed);
      console.log("is_end_of_interview:", aiPayload?.is_end_of_interview);
      
      // Extract evaluation from response (per AI Interviewer API doc)
      const evaluationData = {
        result: aiPayload?.evaluation?.result ?? null,
        feedback: aiPayload?.evaluation?.feedback ?? aiPayload?.evaluation?.display_text ?? '',
        phonetic_feedback: aiPayload?.evaluation?.phonetic_feedback ?? aiPayload?.phonetic_feedback ?? '',
      };
      
      // Extract pending next question data (per AI Interviewer API doc)
      const pendingNextData = {
        next_question: aiPayload?.next_question ?? null,
        display_text: aiPayload?.display_text ?? aiPayload?.next_question?.text ?? '',
        new_topic: aiPayload?.new_topic ?? aiPayload?.next_question?.topic ?? null,
        next_difficulty: aiPayload?.next_difficulty ?? aiPayload?.next_question?.difficulty ?? null,
        topic_changed: aiPayload?.topic_changed ?? false,
        is_end_of_interview: aiPayload?.is_end_of_interview ?? false,
      };
      
      // Pipeline Step 7: Append evaluation message to chat (must show feedback first) (C.7)
      // CRITICAL FLOW: After AI submit succeeds:
      // 1. Show evaluation feedback immediately (setEvaluation) - C.7
      // 2. Store next question in pendingNext (DO NOT update currentQuestion here) - C.8
      // 3. User must click "Next" to commit pendingNext -> currentQuestion
      // This prevents state conflicts and ensures correct flow: Question -> Answer -> Feedback -> Next Question
      setEvaluation(evaluationData);
      setPendingNext(pendingNextData);
      setPhase('showing_feedback'); // User must click "Next" to proceed
      
      // IMPORTANT: DO NOT update currentQuestion state here (C.8)
      // turnState.currentQuestion remains unchanged
      // It will be updated ONLY when user clicks "Next" (in handleNext) - C.9, C.10
      
      // Store evaluation in runtime array for summary page
      const currentTurnIndex = stateSnapshot.turnIndex;
      const currentQuestion = stateSnapshot.currentQuestion;
      const newEvaluation = {
        turnIndex: currentTurnIndex,
        questionId: currentQuestion?.id || null,
        questionText: currentQuestion?.text || '',
        userAnswer: finalTranscriptText,
        result: evaluationData.result || null,
        feedback: evaluationData.feedback || '',
        score: evaluationData.result === 'PASS' || evaluationData.result === 'Pass' ? 75 : 
               evaluationData.result === 'FAIL' || evaluationData.result === 'Fail' ? 40 : null,
      };
      
      setRuntimeEvaluations(prev => {
        const updated = [...prev, newEvaluation];
        // Save to localStorage immediately
        const runtimeKey = `interviewRuntime:${sessionId}`;
        const runtimeData = {
          sessionId: String(sessionId),
          evaluations: updated,
          lastUpdated: new Date().toISOString(),
        };
        try {
          localStorage.setItem(runtimeKey, JSON.stringify(runtimeData));
        } catch (err) {
          console.error('Failed to save runtime to localStorage:', err);
        }
        return updated;
      });
      
      // Check if interview should end
      const shouldEndInterview = currentTurnIndex >= MAX_QUESTIONS || pendingNextData.is_end_of_interview;
      if (shouldEndInterview) {
        // Cancel any ongoing TTS before ending interview
        cancelSpeak();
        // Navigate to summary page
        setTimeout(() => {
          navigate(`/interview/${sessionId}/summary`);
        }, 100);
        return; // Don't proceed with save-evaluation
      }
      
      // Reset loading states immediately (UI should show feedback, not loading)
      setIsAnswerProcessing(false);
      setIsSubmitting(false);
      submitLockRef.current = false; // Release submit lock
      
      // DISABLED: Save EVALUATION to DB (endpoint has schema issues)
      // Evaluation data is stored in runtimeEvaluations and localStorage for summary page
      // This can be re-enabled when backend schema is fixed
      // if (evaluationData.result !== null || evaluationData.feedback) {
      //   // Fire-and-forget: don't await, don't block UI
      //   interviewEvaluationAPI.saveEvaluation(saveEvaluationPayload).catch(err => {
      //     console.warn('Save evaluation failed (non-critical):', err);
      //   });
      // }

      // Success toast (UI already updated above)
      toast('Câu trả lời đã được gửi thành công!', { type: 'success' });
    } catch (error) {
      console.error('Failed to submit answer:', error);
      
      // Extract error message
      const errorMessage = error?.message || 'Gửi câu trả lời thất bại. Thử lại.';
      
      // Set error state
      setError(errorMessage);
      toast(errorMessage, { type: 'error' });
      
      // Reset phase to 'asking' on error (user can retry)
      setPhase('asking');
      
      // Note: If save-answer succeeded but AI submit failed, answer is already saved
      // Retry will skip save-answer (due to savedAnswerTurnIds check) and only retry AI submit
    } finally {
      // ALWAYS reset loading states in finally to prevent UI stuck (D, Task 4)
      // This ensures UI is never stuck in loading state, even if errors occur
      submitLockRef.current = false; // Release submit lock
      setIsSubmitting(false); // Reset submitting guard
      setIsAnswerProcessing(false);
      
      // Reset AI streaming states if needed
      if (isAiStreaming) {
        stopStreaming();
      }
      
      // Clear abort controller
      abortControllerRef.current = null;
      
      // Phase is already set:
      // - 'showing_feedback' if AI submit succeeded (set above)
      // - 'asking' if error occurred (set in catch block)
      
      console.log("=== SUBMIT FINALLY: All loading states reset ===");
    }
  };

  // Handle "Next question" button click (per AI Interviewer API doc)
  // CRITICAL: This is the ONLY place where pendingNext is committed to currentQuestion state (C.9, C.10, C.11)
  const handleNext = () => {
    clearAutoSubmitTimer('next_question');

    // Clear auto-next timeout if user manually clicks "Next"
    if (autoNextTimeoutRef.current) {
      clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = null;
    }

    if (!pendingNext) {
      console.error("handleNext called but pendingNext is null");
      return;
    }
    
    // Check if we've reached MAX_QUESTIONS
    const nextTurnIndex = turnState.turnIndex + 1;
    if (nextTurnIndex > MAX_QUESTIONS) {
      // Cancel any ongoing TTS before ending interview
      cancelSpeak();
      // Navigate to summary page
      navigate(`/interview/${sessionId}/summary`);
      return;
    }
    
    // Check if interview is ended
    if (pendingNext.is_end_of_interview || !pendingNext.next_question) {
      setIsEndOfInterview(true);
      // Cancel any ongoing TTS before ending interview
      cancelSpeak();
      // Navigate to summary page
      navigate(`/interview/${sessionId}/summary`);
      return;
    }
    
    // Extract next question data from pendingNext
    const nextQuestionId = pendingNext.next_question?.id ?? null;
    const nextDisplayText = pendingNext.display_text || pendingNext.next_question?.text || '';
    const nextTopic = pendingNext.new_topic ?? pendingNext.next_question?.topic ?? turnState.currentQuestion?.topic ?? null;
    const nextDifficulty = pendingNext.next_difficulty ?? pendingNext.next_question?.difficulty ?? turnState.currentQuestion?.difficulty ?? 'intermediate';
    
    // Guard: Ensure nextQuestionId exists
    if (!nextQuestionId || (typeof nextQuestionId === 'string' && nextQuestionId.trim() === '')) {
      console.error("=== HANDLE NEXT ERROR: nextQuestionId is missing ===");
      console.error("pendingNext:", pendingNext);
      toast('Không tìm thấy câu hỏi tiếp theo. Vui lòng thử lại.', { type: 'error' });
      return;
    }
    
    // Guard: Prevent duplicate question (Task 5)
    const nextQIdStr = String(nextQuestionId);
    if (turnState.askedIds.includes(nextQIdStr)) {
      console.warn("=== HANDLE NEXT WARNING: next_question.id already in askedIds ===");
      console.warn("nextQuestionId:", nextQIdStr);
      console.warn("askedIds:", turnState.askedIds);
      console.warn("This question has already been asked. Keeping pendingNext and requesting retry.");
      toast('Câu hỏi này đã được hỏi trước đó. Vui lòng thử lại.', { type: 'warning' });
      // Keep pendingNext - user can retry or we can handle this case
      // For now, we'll still commit but log the warning
      // TODO: Consider not committing and showing error to user
    }
    
    // Pipeline Step 9-10-11: Commit next question using commitQuestion (atomic update)
    // commitQuestion ensures askedIds includes nextQuestionId
    commitQuestion({
      id: nextQuestionId,
      text: nextDisplayText,
      topic: nextTopic,
      difficulty: nextDifficulty,
    });
    
    // Increment turn index separately
    updateTurnState({ turnIndex: turnState.turnIndex + 1 });
    
    // Clear recording states for next question
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    setRecordedBlob(null);
    setRecordingState('idle');
    setIsRecording(false);
    setRecordingTime(0);
    setReplayState('idle');
    setTranscriptText('');
    setIsTranscribing(false);
    
    // Cancel any ongoing TTS before moving to next question
    cancelSpeak();
    
    // Reset evaluation and pendingNext (ready for next submit)
    setEvaluation(null);
    setPendingNext(null);
    
    // Set phase to "asking" (ready for next question)
    setPhase('asking');
    
    // Clear error
    setError(null);
    
    // NOTE: simulateAiQuestion will be called automatically by useEffect when currentQuestion changes
    // No need to call it manually here - this prevents race conditions and stale state
    
    console.log("=== MOVED TO NEXT QUESTION: State committed ===");
    console.log("After commit:", {
      currentQuestion: turnState.currentQuestion,
      askedIds: turnState.askedIds,
      turnIndex: turnState.turnIndex + 1,
    });
    console.log("=== NOTE: State is now managed by React only (no localStorage re-hydration) ===");
  };
  
  const handleNextQuestion = () => {
    // Legacy function - redirect to handleNext
    handleNext();
  };

  const handleCompleteInterview = async () => {
    try {
      clearAutoSubmitTimer('complete_interview');
      console.log("=== HANDLE COMPLETE INTERVIEW ===");
      console.log("sessionId (raw):", sessionId);
      console.log("sessionId (type):", typeof sessionId);
      const sessionIdStr = String(sessionId);
      console.log("sessionId (string):", sessionIdStr);
      
      if (!sessionId || sessionIdStr === 'undefined' || sessionIdStr === 'null') {
        throw new Error('Invalid sessionId. Cannot end interview.');
      }
      
      // Ensure runtime localStorage exists before navigating to summary
      // This ensures Summary page can load data even if user ended interview early (0 answers)
      const runtimeKey = `interviewRuntime:${sessionIdStr}`;
      const existingRuntimeStr = localStorage.getItem(runtimeKey);
      
      if (!existingRuntimeStr) {
        console.log("=== Creating runtime localStorage for early end ===");
        // Create runtime data with empty evaluations array
        const runtimeData = {
          sessionId: sessionIdStr,
          evaluations: runtimeEvaluations.length > 0 ? runtimeEvaluations : [],
          lastUpdated: new Date().toISOString(),
        };
        
        try {
          localStorage.setItem(runtimeKey, JSON.stringify(runtimeData));
          console.log("=== Runtime localStorage created successfully ===");
        } catch (storageError) {
          console.error('Failed to save runtime to localStorage:', storageError);
          // Non-critical: continue even if localStorage save fails
        }
      } else {
        // Update lastUpdated timestamp if runtime already exists
        try {
          const existingRuntime = JSON.parse(existingRuntimeStr);
          existingRuntime.lastUpdated = new Date().toISOString();
          localStorage.setItem(runtimeKey, JSON.stringify(existingRuntime));
          console.log("=== Runtime localStorage updated ===");
        } catch (updateError) {
          console.warn('Failed to update runtime localStorage:', updateError);
          // Non-critical: continue even if update fails
        }
      }
      
      // Ensure interviewContext is saved (for Summary page metadata)
      if (interviewContext) {
        try {
          localStorage.setItem('interviewContext', JSON.stringify(interviewContext));
          console.log("=== InterviewContext saved ===");
        } catch (contextError) {
          console.warn('Failed to save interviewContext:', contextError);
          // Non-critical: continue even if context save fails
        }
      }
      
      await interviewSessionAPI.end(sessionIdStr);

      toast('Cuộc phỏng vấn đã hoàn thành!', { type: 'success' });

      // Navigate to summary page
      navigate(`/interview/${sessionIdStr}/summary`);
    } catch (error) {
      console.error('Failed to complete interview:', error);
      console.error('Error response:', error.response);
      console.error('Error response.data:', error.response?.data);
      
      // Even if API end fails, try to ensure runtime localStorage exists and navigate
      // (interview might already be ended or backend might have issues)
      const sessionIdStr = String(sessionId);
      const runtimeKey = `interviewRuntime:${sessionIdStr}`;
      const existingRuntimeStr = localStorage.getItem(runtimeKey);
      
      if (!existingRuntimeStr) {
        try {
          const runtimeData = {
            sessionId: sessionIdStr,
            evaluations: runtimeEvaluations.length > 0 ? runtimeEvaluations : [],
            lastUpdated: new Date().toISOString(),
          };
          localStorage.setItem(runtimeKey, JSON.stringify(runtimeData));
          console.log("=== Runtime localStorage created despite API error ===");
        } catch (storageError) {
          console.error('Failed to save runtime to localStorage:', storageError);
        }
      }
      
      // Navigate to summary even if API end failed (Summary will handle empty state)
      toast('Cuộc phỏng vấn đã hoàn thành!', { type: 'success' });
      navigate(`/interview/${sessionIdStr}/summary`);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-advance to next question 5s after feedback is shown
  useEffect(() => {
    // Only schedule auto-next when feedback is being shown and we have a pending next question
    if (phase === 'showing_feedback' && pendingNext) {
      // Clear existing timeout if any
      if (autoNextTimeoutRef.current) {
        clearTimeout(autoNextTimeoutRef.current);
      }

      autoNextTimeoutRef.current = setTimeout(() => {
        autoNextTimeoutRef.current = null;
        // Reuse existing flow (handles end-of-interview & navigation)
        handleNext();
      }, 15000); // 15 seconds
    } else {
      // If phase changes or pendingNext cleared, cancel auto-next
      if (autoNextTimeoutRef.current) {
        clearTimeout(autoNextTimeoutRef.current);
        autoNextTimeoutRef.current = null;
      }
    }

    return () => {
      if (autoNextTimeoutRef.current) {
        clearTimeout(autoNextTimeoutRef.current);
        autoNextTimeoutRef.current = null;
      }
    };
  }, [phase, pendingNext]);

  // Progress calculation (estimate based on turnIndex, max 10 turns)
  const maxTurnsEstimate = MAX_QUESTIONS;
  const progress = interviewContext ? Math.min(((turnState.turnIndex) / maxTurnsEstimate) * 100, 100) : 0;
  
  // Parse detail API response to report format (similar to InterviewSummary)
  const parseDetailToReport = (detail) => {
    if (!detail || typeof detail !== "object") {
      console.warn("=== PARSE DETAIL TO REPORT: Invalid detail data ===");
      return { turns: [] };
    }
    
    // Extract turns/evaluations: có thể nằm trong turns/interviewTurns/items/evaluations
    const turns = Array.isArray(detail.turns)
      ? detail.turns
      : Array.isArray(detail.interviewTurns)
      ? detail.interviewTurns
      : Array.isArray(detail.items)
      ? detail.items
      : [];
    
    // Extract evaluations separately if BE returns them separately
    const evaluations = Array.isArray(detail.evaluations)
      ? detail.evaluations
      : Array.isArray(detail.interviewEvaluations)
      ? detail.interviewEvaluations
      : [];
    
    // Extract answers separately if BE returns them separately
    const answers = Array.isArray(detail.answers)
      ? detail.answers
      : Array.isArray(detail.interviewAnswers)
      ? detail.interviewAnswers
      : [];
    
    console.log("=== PARSING DETAIL TO REPORT ===");
    console.log("turns count:", turns.length);
    console.log("evaluations count:", evaluations.length);
    console.log("answers count:", answers.length);
    
    // Map turns to report format
    const reportTurns = turns.map((t, idx) => {
      // Try to find matching evaluation
      const evaluation = evaluations?.find(
        (e) => 
          e.turnIndex === (t.turnIndex ?? t.turn ?? t.index) ||
          e.turnId === (t.turnId ?? t.id) ||
          e.interviewTurnId === (t.turnId ?? t.id)
      ) || t.evaluation || null;
      
      // Try to find matching answer
      const answer = answers?.find(
        (a) => 
          a.turnIndex === (t.turnIndex ?? t.turn ?? t.index) ||
          a.turnId === (t.turnId ?? t.id) ||
          a.interviewTurnId === (t.turnId ?? t.id)
      ) || t.answer || null;
      
      return {
        turnId: t.turnId ?? t.id ?? null,
        turnIndex: t.turnIndex ?? t.turn ?? t.index ?? idx + 1,
        questionText: t.questionText ?? t.questionContent ?? t.question ?? `Question ${idx + 1}`,
        questionId: t.questionId ?? t.question_id ?? null,
        difficulty: t.difficulty ?? t.Difficulty ?? null,
        topic: t.topic ?? t.Topic ?? null,
        answer: {
          userAnswer: answer?.userAnswer ?? answer?.answerText ?? answer?.answer ?? t.userAnswer ?? t.answerText ?? '-',
          answerId: answer?.answerId ?? answer?.id ?? null,
        },
        evaluation: evaluation ? {
          result: evaluation.result ?? evaluation.Result ?? (evaluation.score >= 60 ? 'PASS' : 'FAIL'),
          score: evaluation.score ?? evaluation.Score ?? 0,
          feedback: evaluation.feedback ?? evaluation.Feedback ?? '',
          phoneticFeedback: evaluation.phoneticFeedback ?? evaluation.PhoneticFeedback ?? '',
        } : null,
      };
    });
    
    // If no turns but have evaluations, create turns from evaluations
    if (reportTurns.length === 0 && evaluations.length > 0) {
      return {
        turns: evaluations.map((e, idx) => ({
          turnId: e.turnId ?? e.id ?? null,
          turnIndex: e.turnIndex ?? e.turn ?? idx + 1,
          questionText: e.questionText ?? e.questionContent ?? e.question ?? `Question ${idx + 1}`,
          answer: {
            userAnswer: '-',
          },
          evaluation: {
            result: e.result ?? e.Result ?? (e.score >= 60 ? 'PASS' : 'FAIL'),
            score: e.score ?? e.Score ?? 0,
            feedback: e.feedback ?? e.Feedback ?? '',
          },
        })),
      };
    }
    
    return { turns: reportTurns };
  };
  
  // Calculate report summary
  const calculateReportSummary = () => {
    if (!reportData || !reportData.turns || !Array.isArray(reportData.turns)) {
      return { totalScore: 0, passCount: 0, failCount: 0, totalQuestions: 0 };
    }
    
    let totalScore = 0;
    let passCount = 0;
    let failCount = 0;
    let totalQuestions = reportData.turns.length;
    
    reportData.turns.forEach((turn) => {
      if (turn.evaluation) {
        const score = turn.evaluation.score || 0;
        totalScore += score;
        if (turn.evaluation.result === 'PASS') {
          passCount++;
        } else if (turn.evaluation.result === 'FAIL') {
          failCount++;
        }
      }
    });
    
    const averageScore = totalQuestions > 0 ? Math.round(totalScore / totalQuestions) : 0;
    
    return { totalScore: averageScore, passCount, failCount, totalQuestions };
  };
  
  const reportSummary = calculateReportSummary();
  
  // Map runtimeEvaluations to summary format
  const mapEvaluationsToSummary = () => {
    if (!runtimeEvaluations || runtimeEvaluations.length === 0) {
      return null;
    }
    
    const sortedEvaluations = [...runtimeEvaluations].sort((a, b) => (a.turnIndex || 0) - (b.turnIndex || 0));
    
    const questionResults = sortedEvaluations.map((evalItem, idx) => ({
      id: evalItem.turnIndex || idx + 1,
      question: evalItem.questionText || `Question ${idx + 1}`,
      userAnswer: evalItem.userAnswer || '',
      category: evalItem.category || 'Interview',
      score: evalItem.score || (evalItem.result === 'PASS' || evalItem.result === 'Pass' ? 75 : evalItem.result === 'FAIL' || evalItem.result === 'Fail' ? 40 : 0),
      feedback: evalItem.feedback || '',
      result: evalItem.result || null,
    }));
    
    const passCount = questionResults.filter(q => {
      const r = String(q.result || "").toUpperCase().trim();
      return r === "PASS" || r === "P" || r === "TRUE" || r === "1";
    }).length;
    
    const failCount = questionResults.filter(q => {
      const r = String(q.result || "").toUpperCase().trim();
      return r === "FAIL" || r === "F" || r === "FALSE" || r === "0";
    }).length;
    
    const totalQuestions = questionResults.length;
    
    const validScores = questionResults
      .map(q => {
        const s = q.score;
        if (typeof s === "number" && !Number.isNaN(s)) return s;
        const parsed = parseFloat(s);
        return !Number.isNaN(parsed) ? parsed : null;
      })
      .filter(s => s !== null && s !== undefined);
    
    const overallScore = validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : totalQuestions > 0 ? Math.round((passCount / totalQuestions) * 100) : 0;
    
    return {
      overallScore,
      position: interviewContext?.jobTitle || "Interview",
      duration: "N/A",
      questionResults,
      passCount,
      failCount,
      totalQuestions,
    };
  };
  
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };
  
  const getResultBadge = (result) => {
    if (result === "PASS" || result === "Pass") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium border border-green-500/30">
          <CheckCircle className="w-3 h-3" />
          PASS
        </span>
      );
    } else if (result === "FAIL" || result === "Fail") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium border border-red-500/30">
          <XCircle className="w-3 h-3" />
          FAIL
        </span>
      );
    }
    return null;
  };

  // UI render condition: show first question when isInitialized=true and currentQuestion exists (B)
  // NO FALLBACK: only use turnState.currentQuestion (single source of truth)
  if (!isInitialized || !turnState.currentQuestion || !turnState.currentQuestion.text) {
    return (
      <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#66FCF1] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#C5C6C7]">Đang tải interview...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0B0C10] flex flex-col">
      {/* Full-screen Loading Overlay */}
      <FullScreenLoading isVisible={isAnswerProcessing || reportLoading} />
      
      {/* Top Bar */}
      <div className="sticky top-16 z-40 bg-[#1F2833]/95 backdrop-blur-md border-b border-[#66FCF1]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-white">
                AI Interview
              </h1>
              <div className="hidden sm:flex items-center gap-2 text-sm text-[#C5C6C7]">
                <span>Turn {turnState.turnIndex}</span>
                <span className="text-[#66FCF1]">•</span>
                <span>{interviewContext.jobTitle || 'Interview'}</span>
                {turnState.currentQuestion?.topic && (
                  <>
                    <span className="text-[#66FCF1]">•</span>
                    <span>{turnState.currentQuestion.topic}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Progress Bar */}
              <div className="hidden md:flex items-center gap-3">
                <div className="w-32 h-2 bg-[#1F2833] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#66FCF1] to-[#45A29E] transition-all duration-300 glow-primary"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm text-[#C5C6C7] font-medium">{Math.round(progress)}%</span>
              </div>
               {/* Question countdown (always visible during interview) */}
               <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B0C10]/80 border border-[#66FCF1]/20">
                 <Clock className="w-4 h-4 text-[#66FCF1]" />
                 <span className="text-xs font-mono text-[#C5C6C7]">
                   {phase === 'showing_feedback' ? 'Chờ câu hỏi tiếp theo...' : 'Còn '}
                   {phase !== 'showing_feedback' && (
                     <span className="text-[#66FCF1] ml-1">
                       {formatTime(questionTimeLeft)}
                     </span>
                   )}
                 </span>
               </div>
              
              {/* Timer */}
              {recordingState === 'recording' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-mono text-red-400">{formatTime(recordingTime)}</span>
                </div>
              )}
              
              {/* End Interview Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEndModal(true)}
                disabled={isAnswerProcessing}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <X className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Kết thúc</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - AI Transcript Center */}
      <div className="flex-1 flex flex-col min-h-0">
        <AiTranscriptCenter
          transcript={displayTranscript}
          speechState={phase === 'showing_feedback' ? 'done' : aiSpeechState}
          isStreaming={phase === 'showing_feedback' ? false : isStreaming}
          mode={phase === 'showing_feedback' ? 'feedback' : 'question'}
        />

        {/* Question countdown timer (1 minute per question) */}
        {phase === 'asking' && (
          <div className="border-t border-[#66FCF1]/10 bg-[#0B0C10]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-[#66FCF1]" />
              <span className="text-sm text-[#C5C6C7]">
                Thời gian trả lời còn lại:&nbsp;
                <span className="font-mono text-[#66FCF1]">
                  {formatTime(questionTimeLeft)}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="sticky top-[4rem] z-30 bg-red-500/20 border-b border-red-500/30 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <span className="text-sm text-red-400">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Bar - Recording Controls (Sticky) */}
      <div className="sticky bottom-0 z-40 bg-[#1F2833]/95 backdrop-blur-md border-t border-[#66FCF1]/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Replay Controls (shown when recording is stopped and phase is asking) */}
          {phase === 'asking' && recordingState === 'stopped' && recordedAudioUrl && (
            <div className="mb-4">
              <ReplayControls
                audioUrl={recordedAudioUrl}
                disabled={isAnswerProcessing || isTranscribing || phase === 'showing_feedback'}
                onClear={clearRecording}
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Status */}
            <div className="flex items-center gap-4">
              {phase === 'showing_feedback' ? (
                <div className="flex items-center gap-2 text-[#66FCF1]">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Đánh giá đã hoàn tất</span>
                </div>
              ) : phase === 'asking' && recordingState === 'recording' ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-red-400">Đang ghi âm...</span>
                  <span className="text-sm font-mono text-[#C5C6C7]">{formatTime(recordingTime)}</span>
                </div>
              ) : recordingState === 'stopped' && recordedAudioBlob ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#45A29E]" />
                  <span className="text-sm font-medium text-[#45A29E]">
                    {isTranscribing ? "Đang chuyển đổi giọng nói..." : "Đã ghi âm - Sẵn sàng gửi"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[#C5C6C7]">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Sẵn sàng ghi âm</span>
                </div>
              )}
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-3">
              {phase === 'showing_feedback' ? (
                // Show "Next question" button when showing feedback
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleNext}
                  disabled={isAnswerProcessing || !pendingNext}
                  className="px-8 py-6 text-lg glow-primary-hover"
                >
                  {pendingNext?.is_end_of_interview ? (
                    <>
                      Hoàn thành
                      <CheckCircle className="w-5 h-5 ml-2" />
                    </>
                  ) : (
                    <>
                      Câu hỏi tiếp theo
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              ) : phase === 'asking' && recordingState === 'idle' ? (
                // Show "Start recording" button when ready to record
                <Button
                  variant="primary"
                  size="lg"
                  onClick={startRecording}
                  disabled={isAnswerProcessing || isSubmitting || phase === 'showing_feedback'}
                  className="px-8 py-6 text-lg glow-primary-hover"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Bắt đầu ghi âm
                </Button>
              ) : phase === 'asking' && recordingState === 'recording' ? (
                // Show "Stop recording" button when recording
                <Button
                  variant="danger"
                  size="lg"
                  onClick={stopRecording}
                  disabled={isAnswerProcessing || isSubmitting || phase === 'showing_feedback'}
                  className="px-8 py-6 text-lg"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Dừng ghi âm
                </Button>
              ) : phase === 'asking' && recordingState === 'stopped' ? (
                // Show "Re-record" and "Submit" buttons when recording stopped
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={clearRecording}
                    disabled={isAnswerProcessing || isTranscribing || isSubmitting || phase === 'showing_feedback'}
                    className="px-6 py-6 text-lg border-[#66FCF1]/30 text-[#66FCF1] hover:bg-[#66FCF1]/10"
                  >
                    Ghi lại
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSubmitAnswer}
                    disabled={
                      isSubmitting ||
                      isAnswerProcessing || 
                      isTranscribing || 
                      isRecording || 
                      !recordedAudioBlob ||
                      phase === 'showing_feedback'
                    }
                    className="px-8 py-6 text-lg glow-primary-hover"
                  >
                    {isTranscribing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Đang chuyển đổi...
                      </>
                    ) : isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        Gửi câu trả lời
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* End Interview Confirmation Modal */}
      <Modal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        title="Kết thúc cuộc phỏng vấn sớm?"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-[#C5C6C7]">
            Bạn có chắc chắn muốn kết thúc cuộc phỏng vấn này? Tiến trình của bạn sẽ được lưu, nhưng bạn sẽ không thể trả lời các câu hỏi còn lại.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowEndModal(false)}
              className="border-[#66FCF1]/30 text-[#66FCF1] hover:bg-[#66FCF1]/10"
            >
              Tiếp tục
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setShowEndModal(false);
                handleCompleteInterview();
              }}
            >
              Kết thúc
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InterviewSession;
