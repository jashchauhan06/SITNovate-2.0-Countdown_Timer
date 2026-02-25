import React, { useState, useEffect, useRef, useCallback } from 'react';
import FlipCard from './FlipCard';
import { subscribeToTimer, saveTimerState, getTimerState, subscribeToGitHubTimer, resetGitHubTimer } from '../utils/timerStorage';

// SHA-256 hash of the secret key — plaintext password never appears in code
// To change the password, run: node -e "require('crypto').createHash('sha256').update('YOUR_NEW_PASSWORD').digest('hex')"
// and replace the hash below
const SECRET_HASH = "1b716eaa30ddfed1fce62fbfb9d4fa3f313ccfd8158842c6f4637e10936f6c52";

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');
  const [time, setTime] = useState({ hours: '00', minutes: '00', seconds: '00' });
  const [statusText, setStatusText] = useState('Stopped');
  const [timeString, setTimeString] = useState('24:00:00');
  const [customHours, setCustomHours] = useState('');
  const [customMinutes, setCustomMinutes] = useState('');
  const [customSeconds, setCustomSeconds] = useState('');
  const [setTimerMsg, setSetTimerMsg] = useState('');
  const [githubTimeLeft, setGithubTimeLeft] = useState(0);
  const [githubPushCount, setGithubPushCount] = useState(1);
  const [githubMsg, setGithubMsg] = useState('');
  const timerStateRef = useRef(null);
  const animFrameRef = useRef(null);
  const githubAnimFrameRef = useRef(null);

  const handleKeySubmit = async (e) => {
    e.preventDefault();
    const inputHash = await sha256(keyInput);
    if (inputHash === SECRET_HASH) {
      setAuthenticated(true);
      setError('');
    } else {
      setError('Wrong key. Try again.');
      setKeyInput('');
    }
  };

  const startTimer = async () => {
    const state = await getTimerState();
    if (!state.isRunning) {
      state.isRunning = true;
      state.endTime = Date.now() + state.remainingTime;
      await saveTimerState(state);
    }
  };

  const stopTimer = async () => {
    const state = await getTimerState();
    if (state.isRunning) {
      state.isRunning = false;
      state.remainingTime = Math.max(0, state.endTime - Date.now());
      state.endTime = null;
      await saveTimerState(state);
    }
  };

  const resetTimer = async () => {
    await saveTimerState({
      isRunning: false,
      endTime: null,
      remainingTime: 24 * 60 * 60 * 1000
    });
  };

  const setCustomTimer = async (e) => {
    e.preventDefault();
    const h = parseInt(customHours, 10) || 0;
    const m = parseInt(customMinutes, 10) || 0;
    const s = parseInt(customSeconds, 10) || 0;
    const totalMs = (h * 3600 + m * 60 + s) * 1000;

    if (totalMs <= 0) {
      setSetTimerMsg('Please enter a valid time greater than 0.');
      return;
    }

    await saveTimerState({
      isRunning: false,
      endTime: null,
      remainingTime: totalMs
    });

    setSetTimerMsg(`Timer set to ${h}h ${m}m ${s}s. Press Start to begin.`);
    setCustomHours('');
    setCustomMinutes('');
    setCustomSeconds('');
    setTimeout(() => setSetTimerMsg(''), 4000);
  };

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

    const hoursStr = String(hours).padStart(2, '0');
    const minutesStr = String(minutes).padStart(2, '0');
    const secondsStr = String(seconds).padStart(2, '0');

    setTime({ hours: hoursStr, minutes: minutesStr, seconds: secondsStr });
    setTimeString(`${hoursStr}:${minutesStr}:${secondsStr}`);
    setStatusText(state.isRunning ? 'Running' : 'Stopped');

    if (state.isRunning && timeLeft > 0) {
      animFrameRef.current = requestAnimationFrame(computeDisplay);
    }
  }, []);

  const handleResetGitHubTimer = async () => {
    await resetGitHubTimer();
    setGithubMsg('GitHub timer reset to 3 hours!');
    setTimeout(() => setGithubMsg(''), 3000);
  };

  const formatGitHubTime = (ms) => {
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

  useEffect(() => {
    const unsubscribe = subscribeToTimer((state) => {
      timerStateRef.current = state;

      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }

      computeDisplay();
    });

    return () => {
      unsubscribe();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [computeDisplay]);

  useEffect(() => {
    const unsubscribe = subscribeToGitHubTimer((endTime, count) => {
      setGithubPushCount(count);
      
      const updateGitHubTimer = () => {
        const remaining = Math.max(0, endTime - Date.now());
        setGithubTimeLeft(remaining);

        if (remaining > 0) {
          githubAnimFrameRef.current = requestAnimationFrame(updateGitHubTimer);
        }
      };

      if (githubAnimFrameRef.current) {
        cancelAnimationFrame(githubAnimFrameRef.current);
      }

      updateGitHubTimer();
    });

    return () => {
      unsubscribe();
      if (githubAnimFrameRef.current) {
        cancelAnimationFrame(githubAnimFrameRef.current);
      }
    };
  }, []);

  // Auth gate — rendered AFTER all hooks have been called
  if (!authenticated) {
    return (
      <div className="container" style={{ maxWidth: '400px' }}>
        <h1>Admin Access</h1>
        <form onSubmit={handleKeySubmit} style={{ marginTop: '2rem' }}>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Enter secret key"
            autoFocus
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              fontSize: '1rem',
              fontFamily: 'Inter, sans-serif',
              background: '#1a1a1a',
              border: error ? '1px solid #ef4444' : '1px solid #333',
              borderRadius: '6px',
              color: '#fff',
              outline: 'none',
              marginBottom: '1rem',
            }}
          />
          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>
          )}
          <button type="submit" className="btn btn-start" style={{ width: '100%' }}>
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="container admin-panel">
      <h1>Admin Control Panel</h1>
      <div className="admin-controls">
        <button onClick={startTimer} className="btn btn-start">Start Timer</button>
        <button onClick={stopTimer} className="btn btn-stop">Stop Timer</button>
        <button onClick={resetTimer} className="btn btn-reset">Reset Timer</button>
      </div>

      {/* ─── Set Custom Time ─── */}
      <div className="custom-timer-section">
        <h2>Set Custom Time</h2>
        <p className="custom-timer-hint">Override the timer to start from a specific point</p>
        <form onSubmit={setCustomTimer} className="custom-timer-form">
          <div className="custom-timer-inputs">
            <div className="custom-input-group">
              <input
                type="number"
                min="0"
                max="99"
                value={customHours}
                onChange={(e) => setCustomHours(e.target.value)}
                placeholder="0"
                className="custom-time-input"
              />
              <span className="custom-input-label">Hours</span>
            </div>
            <span className="custom-input-sep">:</span>
            <div className="custom-input-group">
              <input
                type="number"
                min="0"
                max="59"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                placeholder="0"
                className="custom-time-input"
              />
              <span className="custom-input-label">Min</span>
            </div>
            <span className="custom-input-sep">:</span>
            <div className="custom-input-group">
              <input
                type="number"
                min="0"
                max="59"
                value={customSeconds}
                onChange={(e) => setCustomSeconds(e.target.value)}
                placeholder="0"
                className="custom-time-input"
              />
              <span className="custom-input-label">Sec</span>
            </div>
          </div>
          <button type="submit" className="btn btn-set">Set Timer</button>
        </form>
        {setTimerMsg && <p className="custom-timer-msg">{setTimerMsg}</p>}
      </div>

      {/* ─── GitHub Push Timer Control ─── */}
      <div className="custom-timer-section">
        <h2>GitHub Push Reminder</h2>
        <p className="custom-timer-hint">Manage the 3-hour GitHub push reminder timer</p>
        <div className="github-admin-display">
          <div className="github-admin-time">
            <span className="github-admin-label">
              {githubPushCount}{getOrdinalSuffix(githubPushCount)} Push - Time Remaining:
            </span>
            <span className={`github-admin-timer ${githubTimeLeft === 0 ? 'time-up' : ''}`}>
              {formatGitHubTime(githubTimeLeft)}
            </span>
          </div>
          <button onClick={handleResetGitHubTimer} className="btn btn-set">
            Reset to 3 Hours
          </button>
        </div>
        {githubMsg && <p className="custom-timer-msg">{githubMsg}</p>}
      </div>

      <div className="admin-info">
        <p>Current Status: <span>{statusText}</span></p>
        <p>Time Remaining: <span>{timeString}</span></p>
      </div>
      <div className="preview">
        <h2>Live Preview</h2>
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
      </div>
    </div>
  );
}

export default AdminPanel;
