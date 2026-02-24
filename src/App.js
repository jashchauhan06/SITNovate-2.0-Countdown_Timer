import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import CountdownTimer from './components/CountdownTimer';
import AdminPanel from './components/AdminPanel';
import LoadingScreen from './components/LoadingScreen';

function App() {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 2500);
    const removeTimer = setTimeout(() => setLoading(false), 3100);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <BrowserRouter>
      {loading && <LoadingScreen fadeOut={fadeOut} />}

      {/* Background Video */}
      <div className="video-bg-container">
        <video autoPlay loop muted playsInline className="video-bg">
          <source src="/1v.webm" type="video/webm" />
        </video>
        <div className="video-overlay"></div>
      </div>

      {/* Main App Content - needs to be relative to sit above the video */}
      <div className="app-content">
        <Routes>
          <Route path="/" element={<CountdownTimer />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
