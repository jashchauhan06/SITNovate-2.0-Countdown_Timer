import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import CountdownTimer from './components/CountdownTimer';
import AdminPanel from './components/AdminPanel';

function App() {
  return (
    <BrowserRouter>
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
