import React, { useState, useEffect, useRef } from 'react';
import { subscribeToGitHubTimer } from '../utils/timerStorage';

function GitHubPushReminder() {
  const [timeLeft, setTimeLeft] = useState(0);
  const [pushCount, setPushCount] = useState(1);
  const [showReminder, setShowReminder] = useState(false);
  const animFrameRef = useRef(null);
  const endTimeRef = useRef(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    const unsubscribe = subscribeToGitHubTimer((endTime, count, running) => {
      console.log('GitHub Timer Data:', { endTime, count, running }); // Debug log
      setPushCount(count || 1);
      endTimeRef.current = endTime;
      isRunningRef.current = running;
      
      // Cancel any existing animation frame
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      
      if (!running) {
        // Timer is paused, just set the static time
        const remaining = Math.max(0, endTime - Date.now());
        setTimeLeft(remaining);
        setShowReminder(false);
        return;
      }
      
      // Timer is running, start animation loop
      const updateTimer = () => {
        if (!isRunningRef.current) return;
        
        const remaining = Math.max(0, endTimeRef.current - Date.now());
        setTimeLeft(remaining);
        setShowReminder(remaining === 0);

        if (remaining > 0) {
          animFrameRef.current = requestAnimationFrame(updateTimer);
        }
      };

      updateTimer();
    });

    return () => {
      unsubscribe();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const getOrdinalSuffix = (num) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  return (
    <div className="github-reminder">
      <div className="reminder-content">
        <div className="reminder-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </div>
        <div className="reminder-text">
          <span className="reminder-label">
            {pushCount}{getOrdinalSuffix(pushCount)} GitHub Push:
          </span>
          <span className={`reminder-timer ${timeLeft === 0 ? 'time-up' : ''}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>
      {showReminder && (
        <div className="reminder-alert">
          ⚠️ Time to push your code to GitHub!
        </div>
      )}
    </div>
  );
}

export default GitHubPushReminder;
