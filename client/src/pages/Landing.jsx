import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Bot, UserRound } from 'lucide-react';
import '../styles/Landing.css';

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.className = 'theme-professional';
  }, []);

  return (
    <div className="landing-container">
      <div className="landing-content">

        <div className="header-section">
          <div className="header-title">
            <Bot className="header-bot-icon" />
            <h1 className="header-text">PrepWise</h1>
          </div>
          <p className="header-description">
            Practice your interview skills with AI-powered questions
          </p>
        </div>

        <div className="main-options">
          <div className="option-card" onClick={() => navigate('/category/technical')}>
            <div className="option-icon tech-icon">
              <Brain size={48} />
            </div>
            <h3 className="option-title">Technical Interview</h3>
            <p className="option-description">
              Simulate interview questions and strengthen your fundamentals
            </p>
            <button className="option-button primary">
              Start Technical Interview
            </button>
          </div>

          <div className="option-card" onClick={() => navigate('/category/behavioral')}>
            <div className="option-icon beha-icon">
              <UserRound size={48} />
            </div>
            <h3 className="option-title">Behavioral Interview</h3>
            <p className="option-description">
              Improve your soft skills and behavioral responses
            </p>
            <button className="option-button secondary">
              Start Behavioral Interview
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Landing;
