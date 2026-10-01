import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@mui/material";
import { ArrowLeft} from "lucide-react";
import "../styles/Category.css";

const technicalCategories = ["React", "JavaScript", "Backend", "DBMS"];
const behavioralCategories = ["Problem Solving", "Teamwork", "Leadership"];
const questionCounts = [2, 5, 10];
const levels = ["Easy", "Intermediate", "Advanced"];

const Category = () => {
  const { type } = useParams();
  const navigate = useNavigate();

  const [numQuestions, setNumQuestions] = useState(2);
  const [level, setLevel] = useState("Easy");

  const categories = type === "technical" ? technicalCategories : behavioralCategories;

  const handleCategoryClick = (category) => {
    if (type === "technical") {
      navigate(`/interview/${type}/${category}`, { state: { numQuestions, level } });
    } else {
      navigate(`/interview/${type}/${category}`, { state: { numQuestions } });
    }
  };

  return (
    <div className="category-container">
      <div className="category-content">
        <Button
          variant="outlined"
          color="tertiary"
          onClick={() => navigate("/")}
          startIcon={<ArrowLeft />}
          className="back-button"
        >
        Back to Home
        </Button>
        <h1 className="category-header gradient-text">
          {type === "technical" ? "Technical Categories" : "Behavioral Categories"}
        </h1>

        <div className="selectors-container">
          {/* Number of Questions → always visible */}
          <div className="selector">
            <label className="selector-label">Number of Questions</label>
            <select 
              className="selector-input"
              value={numQuestions} 
              onChange={(e) => setNumQuestions(e.target.value)}
            >
              {questionCounts.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>

          {/* Level → only visible for technical */}
          {type === "technical" && (
            <div className="selector">
              <label className="selector-label">Level</label>
              <select 
                className="selector-input"
                value={level} 
                onChange={(e) => setLevel(e.target.value)}
              >
                {levels.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          )}
        </div>


        <div className="category-grid">
          {categories.map((cat) => (
            <div 
              key={cat} 
              className="category-card" 
              onClick={() => handleCategoryClick(cat)}
            >
              <div className="category-card-content">
                <h3 className="category-title">{cat}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Category;
