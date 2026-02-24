import React, { useState, useEffect, useRef, useCallback } from 'react';
import FlipCard from './FlipCard';
import { subscribeToTimer } from '../utils/timerStorage';

function CountdownTimer() {
  const [time, setTime] = useState({ hours: '00', minutes: '00', seconds: '00' });
  const [status, setStatus] = useState({ text: 'Paused', bg: 'transparent', color: '#555' });
  const timerStateRef = useRef(null);
  const animFrameRef = useRef(null);

  const computeDisplay = useCallback(() => {
    const state = timerStateRef.current;
    if (!state) return;

    let timeLeft = state.remainingTime || 0;

    if (state.isRunning && state.endTime) {
      timeLeft = Math.max(0, state.endTime - Date.now());
    }

    const totalSeconds = Math.floor(timeLeft / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    setTime({
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0')
    });

    if (timeLeft <= 0) {
      setStatus({ text: "Time's Up!", bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' });
    } else if (state.isRunning) {
      setStatus({ text: 'Running', bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' });
    } else if (timeLeft >= 24 * 60 * 60 * 1000 - 1000) {
      setStatus({ text: 'Ready', bg: 'transparent', color: '#555' });
    } else {
      setStatus({ text: 'Paused', bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' });
    }

    if (state.isRunning && timeLeft > 0) {
      animFrameRef.current = requestAnimationFrame(computeDisplay);
    }
  }, []);

  useEffect(() => {
    // Subscribe to Firebase — fires whenever admin changes the timer
    const unsubscribe = subscribeToTimer((state) => {
      timerStateRef.current = state;

      // Cancel any existing animation loop
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }

      // Compute display immediately, then start animation loop if running
      computeDisplay();
    });

    return () => {
      unsubscribe();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [computeDisplay]);

  return (
    <div className="container">
      <div className="heading">
        <h1 className="title-main">SITN<span className="title-small">ovate</span> 2.0</h1>
        <p className="title-sub">24 Hour Hackathon</p>
      </div>
      <div className="countdown">
        <div className="time-unit">
          <div className="digits">
            <FlipCard value={time.hours[0]} />
            <FlipCard value={time.hours[1]} />
          </div>
          <span className="label">Hours</span>
        </div>
        <span className="time-separator">:</span>
        <div className="time-unit">
          <div className="digits">
            <FlipCard value={time.minutes[0]} />
            <FlipCard value={time.minutes[1]} />
          </div>
          <span className="label">Minutes</span>
        </div>
        <span className="time-separator">:</span>
        <div className="time-unit">
          <div className="digits">
            <FlipCard value={time.seconds[0]} />
            <FlipCard value={time.seconds[1]} />
          </div>
          <span className="label">Seconds</span>
        </div>
      </div>
      <div className="status" style={{ background: status.bg, color: status.color }}>
        {status.text}
      </div>
    </div>
  );
}

export default CountdownTimer;
