import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Category from './pages/Category.jsx';
import Interview from './pages/Interview.jsx';
import Summary from './pages/Summary.jsx';



function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/category/:type" element={<Category />} />
      <Route path="/interview/:type/:topic" element={<Interview />} />
      <Route path="/summary/:type/:topic" element={<Summary />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
} 

export default App;
