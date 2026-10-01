import { React, useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  Typography 
} from "@mui/material";
import { CheckCircle, Download, RotateCcw, Home, Play, Pause } from "lucide-react";
import "../styles/Summary.css"


const Summary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  

  const {
    questionsAnswered = 5,
    totalQuestions = 5,
    category = "dbms",
    type = "technical",
    audioUrl = null // <-- merged interview audio from Interview.jsx
  } = state;

  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState("00:00");
  const [isEnded, setIsEnded] = useState(false);

  //const duration = "12:45"; // Mock duration
  //const completionRate = Math.round((questionsAnswered / totalQuestions) * 100);
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onloadedmetadata = () => {
        const totalSeconds = Math.floor(audioRef.current.duration);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        setDuration(
          `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`
        );
      };

      audioRef.current.onended = () => {
        setIsPlaying(false);
        setIsEnded(true);
      };
    }
  }, [audioUrl]);

  const handleDownload = () => {
    if (!audioUrl) return;
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `interview-${type}-${category}-${new Date().toISOString().split("T")[0]}.mp3`;
    link.click();
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isEnded) {
      // replay from start
      audioRef.current.currentTime = 0;
      setIsEnded(false);
      audioRef.current.play();
      setIsPlaying(true);
    } else if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
    
  };

  return (
    <div className="summary-container">
      <div className="summary-inner">
        {/* Header */}
        <div className="summary-header">
          <div className="summary-icon">
            <CheckCircle className="check-icon" />
          </div>
          <Typography variant="h4" gutterBottom>
            Interview Complete!
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Great job completing your {type} interview session
          </Typography>
        </div>

        {/* Summary Stats */}
        <Card className="summary-card">
          <CardHeader
            title="Session Summary"
            subheader={`${category.charAt(0).toUpperCase() + category.slice(1)} - ${type.charAt(0).toUpperCase() + type.slice(1)} Interview`}
          />
          <CardContent className="summary-stats">
            <div className="stat-item">
              <Typography variant="h5">{questionsAnswered}</Typography>
              <Typography variant="body2" color="textSecondary">
                Questions Answered
              </Typography>
            </div>
            <div className="stat-item">
              <Typography variant="h5">{duration}</Typography>
              <Typography variant="body2" color="textSecondary">
                Total Duration
              </Typography>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="summary-actions">

          {audioUrl && (
            <>
              <audio ref={audioRef} src={audioUrl} hidden />
              <Button
                variant="contained"
                color="secondary"
                startIcon={
                  isEnded ? <RotateCcw /> : isPlaying ? <Pause /> : <Play />
                }
                fullWidth
                onClick={handlePlayPause}
              >
                {isEnded ? "Replay Audio" : isPlaying ? "Pause Audio" : "Play Audio"}
              </Button>
            </>
          )}

          <Button
            variant="contained"
            startIcon={<Download />}
            fullWidth
            onClick={handleDownload}
            disabled={!audioUrl}
            className="download-btn"
          >
            {audioUrl ? "Download Audio Recording" : "Audio Not Available"}
          </Button>

          <div className="action-buttons">
            <Button
              variant="outlined"
              startIcon={<RotateCcw />}
              onClick={() => navigate(`/category/${type}`)}
            >
              Try Another Category
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              startIcon={<Home />}
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary;
