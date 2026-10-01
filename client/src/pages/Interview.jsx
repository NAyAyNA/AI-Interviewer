import { useState, useRef, useEffect } from "react";
import { Button, Card, CardContent, LinearProgress, Badge } from "@mui/material";
import { Square, Mic, SkipForward, ArrowLeft, Volume2, Send } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "../styles/Interview.css";

const Interview = () => {
  const navigate = useNavigate();
  const { type, topic } = useParams();
  const location = useLocation();
  //const { numQuestions } = location.state || { numQuestions: 5 };
  const { numQuestions, level } = location.state || { numQuestions: 5, level: "Standard" };
  const sLevel = level ? level.toLowerCase() : "standard";

  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [chatHistory, setChatHistory] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [ffmpegReady, setFfmpegReady] = useState(false);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [error, setError] = useState(null);
  const [isQuestionPlaying, setIsQuestionPlaying] = useState(false);

  const recordingInterval = useRef();
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const ffmpegRef = useRef(null);
  const chatEndRef = useRef(null);

  // Audio storage
  const questionsAudioRef = useRef([]);
  const answersAudioRef = useRef([]);
  const mergedAudioRef = useRef(null);

  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

  const generateQuestions = async () => {
    setLoadingQuestions(true);
    setError(null);
    try {
      
      //gemini-1.5-flash
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `You are an AI interviewer. Generate ${numQuestions} ${sLevel} interview questions on ${topic}. Return only the questions as numbered list.`;
      const result = await model.generateContent(prompt);

      if (!result || !result.response) {
        throw new Error("LLM service is overloaded. Please try again later.");
      }

      const text = result.response.text();
      // Split numbered list into array
      const qs = text
        .split(/\d+\.\s/)
        .map(q => q.trim())
        .filter(q => q.length > 0);
      setQuestions(qs);
    } catch (err) {
      console.error("Error generating questions:", err);
      setError("⚠️ Our AI service is currently overloaded. Please try again in a moment.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Load FFmpeg
  useEffect(() => {
    const loadFfmpeg = async () => {
      const ffmpeg = createFFmpeg({ log: true, });
      ffmpegRef.current = ffmpeg;
      await ffmpeg.load();
      setFfmpegReady(true);
    };
    loadFfmpeg();

    generateQuestions();
  }, []);

  // 1️Set first question after questions load
  useEffect(() => {
    if (questions.length > 0 && currentQuestion === 0 && chatHistory.length === 0) {
      setCurrentQuestion(0); // trigger first question effect
    }
  }, [questions]);




  // Play question using FastAPI TTS when currentQuestion changes
  useEffect(() => {
    if (!questions.length || !questions[currentQuestion]) return;

    const rawText = questions[currentQuestion];
    const text = rawText.replace(/`/g, "");

    // Prevent duplicate pushes
    setChatHistory(prev => {
      if (prev.some(m => m.type === "question" && m.content === rawText)) return prev;
      return [...prev, { id: prev.length + 1, type: "question", content: rawText }];
    });


    const fetchAndPlayQuestion = async () => {
      try {
        
        //const audioUrl = `http://127.0.0.1:8000/tts?text=${encodeURIComponent(text)}`;
        const audioUrl = `https://ai-interviewer-tts.vercel.app/tts?text=${encodeURIComponent(text)}`;
        const audio = new Audio(audioUrl);
        audio.crossOrigin = "anonymous"; // important for merging
        

        // Disable recording until audio finishes
        setHasAnsweredCurrent(true);
        setIsQuestionPlaying(true);
        audio.onended = () => {
          setIsQuestionPlaying(false);
          setHasAnsweredCurrent(false);
        }
        audio.play();

        // Fetch the MP3 blob for merging
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        questionsAudioRef.current[currentQuestion] = blob;
      } catch (err) {
        console.error("Failed to fetch question audio:", err);
      }
    };

    fetchAndPlayQuestion();
  }, [currentQuestion, questions]);

  const addQuestionToChat = (text) => {
    setChatHistory((prev) => [...prev, { id: prev.length + 1, type: "question", content: text }]);
  };

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingInterval.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    } else clearInterval(recordingInterval.current);
    return () => clearInterval(recordingInterval.current);
  }, [isRecording]);

  // Start recording user audio
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        answersAudioRef.current[currentQuestion] = blob;

        setChatHistory((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            type: "answer",
            content: "Your recorded answer",
            audioUrl: URL.createObjectURL(blob),
          },
        ]);

        setHasAnsweredCurrent(true);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error("Mic access denied:", err);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) setCurrentQuestion(currentQuestion + 1);
    else mergeAudioBlobsAndShowSummary();
  };

  // Merge question + user audios
  const mergeAudioBlobsAndShowSummary = async () => {
    if (!ffmpegReady) {
      alert("FFmpeg still loading...");
      return;
    }
  
    const ffmpeg = ffmpegRef.current;
    const inputs = [];
  
    for (let i = 0; i < questions.length; i++) {
      // Question audio
      if (questionsAudioRef.current[i]) {
        const qWeb = `q${i}.webm`; // or whatever original blob format
        ffmpeg.FS("writeFile", qWeb, await fetchFile(questionsAudioRef.current[i]));
        const qMp3 = `q${i}.mp3`;
        await ffmpeg.run("-i", qWeb, "-vn", "-ar", "44100", "-ac", "2", "-b:a", "192k", qMp3);
        inputs.push(qMp3);
      }
    
      // Answer audio
      if (answersAudioRef.current[i]) {
        const aWeb = `a${i}.webm`;
        ffmpeg.FS("writeFile", aWeb, await fetchFile(answersAudioRef.current[i]));
        const aMp3 = `a${i}.mp3`;
        await ffmpeg.run("-i", aWeb, "-vn", "-ar", "44100", "-ac", "2", "-b:a", "192k", aMp3);
        inputs.push(aMp3);
      }
    }
  
    // Create concat file for FFmpeg
    const concatFile = "concat.txt";
    ffmpeg.FS("writeFile", concatFile, inputs.map((f) => `file '${f}'`).join("\n"));
  
    // Merge all into final output
    await ffmpeg.run("-f", "concat", "-safe", "0", "-i", concatFile, "-c", "copy", "output.mp3");
  
    // Read final MP3 and store it
    const data = ffmpeg.FS("readFile", "output.mp3");
    mergedAudioRef.current = new Blob([data.buffer], { type: "audio/mpeg" });
  
    setShowSummary(true);
  
    const url = URL.createObjectURL(mergedAudioRef.current);
    console.log("Final MP3 ready:", url);
  
    // Navigate to summary page with audio link
    navigate(`/summary/${type}/${topic}`, {
      state: {
        audioUrl: url,
        questionsAnswered: questions.length,
        totalQuestions: questions.length,
        category: topic,
        type,
      },
    });
  };
  

  if (!questions.length) return <p style={{ textAlign: "center" }}>Loading questions...</p>;

  if (error) {
    return (
      <p style={{ textAlign: "center", color: "yellow" }}>
        {error}
      </p>
    );
  }

  // helper function
    const formatTime = (seconds) => {
        if (isNaN(seconds)) return "00:00";
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    };
  

  return (
    <div className="interview-container">
      {/* Header */}
      <div className="interview-header">
        <div className="header-content">
          <div className="header-nav">
            <Button 
              variant="outlined"
              color="tertiary"
              onClick={() => navigate(`/category/${type}`)}
              startIcon={<ArrowLeft />}
            >
              Back to Categories
            </Button>
            <span className="nav-path">
              {type.charAt(0).toUpperCase() + type.slice(1)} - {topic}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="progress-section">
            <div className="progress-text">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}% Complete</span>
            </div>
            <LinearProgress variant="determinate"  
                sx={{ backgroundColor: '#EEF1EF', 
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, rgba(30,58,138,1) 0%, rgba(16,185,129,1) 100%)',
                }, }} 
                value={((currentQuestion + 1) / questions.length) * 100} className="progress-bar" />
          </div>
        </div>
      </div>
  
      {/* Chat Messages Area */}
      <div className="chat-container">
        <div className="chat-messages">
          {chatHistory.map((message) => (
            <div key={message.id} className={`message-wrapper ${message.type}`}>
              <div className="message-content">
                <div className={`message-bubble ${message.type}`}>
                  {message.type === 'question' ? (
                    <>
                      <div className="message-header question">
                        <Volume2 className="icon-sm" />
                        <span className="message-header-text question">Interviewer</span>
                      </div>
                      <p className="message-text">{message.content}</p>
                    </>
                  ) : (
                    <>
                      <div className="message-header answer">
                        <span className="message-header-text answer">You</span>
                        <Mic className="icon-sm" />
                      </div>
                      <p className="message-text answer">{message.content}</p>
                      {message.isRecorded && (
                        <div className="badge-container">
                          <Badge variant="outlined" className="duration-badge">
                            Duration: {formatTime(message.duration || 0)}
                          </Badge>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
  
        {/* Recording Interface - Fixed at bottom */}
        <div className="recording-interface">
          <Card>
            <CardContent className="recording-card">
              {/* Current Recording Status */}
              {isRecording && (
                <div className="recording-status">
                  <div className="recording-indicator">
                    <div className="recording-dot"></div>
                    <span className="recording-time">Recording: {formatTime(recordingTime)}</span>
                  </div>
                </div>
              )}
  
              {/* Recording Status Message */}
              <div className="status-container">
                <p className="status-message">
                  {isQuestionPlaying
                    ? "Playing question..."
                    : hasAnsweredCurrent
                      ? "Response recorded"
                      : "Ready to record your response"}
                </p>
              </div>
  
              {/* Controls */}
              <div className="controls-container">
                <Button
                    onClick={() => {
                    if (isRecording) handleStopRecording();
                    else handleStartRecording();
                    }}
                    disabled={
                        hasAnsweredCurrent && !isRecording
                    }
                    variant="contained"
                    color={isRecording ? "error" : "primary"}
                    startIcon={isRecording ? <Square /> : <Mic />}
                    className="record-button"
                >
                    {isRecording ? "Stop Recording" : "Start Recording"}
                </Button>

                <Button
                    onClick={handleNextQuestion}
                    disabled={!answersAudioRef.current[currentQuestion]}
                    variant="outlined"
                    color="secondary"
                    endIcon={currentQuestion === questions.length - 1 ? <Send /> : <SkipForward />}
                    className="next-btn"
                >
                    {currentQuestion === questions.length - 1 ? "Finish Interview" : "Next Question"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );  
};

export default Interview;
