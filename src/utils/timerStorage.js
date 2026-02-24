import { db } from '../firebase';
import { ref, set, onValue, get } from 'firebase/database';

const TIMER_REF = 'timer';

const DEFAULT_STATE = {
  isRunning: false,
  endTime: null,
  remainingTime: 24 * 60 * 60 * 1000
};

// Write timer state to Firebase
export function saveTimerState(state) {
  return set(ref(db, TIMER_REF), state);
}

// One-time read of timer state
export async function getTimerState() {
  const snapshot = await get(ref(db, TIMER_REF));
  return snapshot.exists() ? snapshot.val() : { ...DEFAULT_STATE };
}

// Real-time listener — calls callback whenever timer state changes in Firebase
export function subscribeToTimer(callback) {
  const timerRef = ref(db, TIMER_REF);
  const unsubscribe = onValue(timerRef, (snapshot) => {
    const state = snapshot.exists() ? snapshot.val() : { ...DEFAULT_STATE };
    callback(state);
  });
  return unsubscribe;
}
