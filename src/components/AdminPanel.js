import React, { useState, useEffect, useRef, useCallback } from 'react';
import FlipCard from './FlipCard';
import { subscribeToTimer, saveTimerState, getTimerState } from '../utils/timerStorage';

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
  const timerStateRef = useRef(null);
  const animFrameRef = useRef(null);

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
