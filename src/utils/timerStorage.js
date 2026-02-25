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

// GitHub Push Timer
const GITHUB_TIMER_REF = 'githubPushTimer';
const THREE_HOURS = 3 * 60 * 60 * 1000;

// Save GitHub timer data to Firebase
export function saveGitHubTimer(endTime, pushCount) {
  return set(ref(db, GITHUB_TIMER_REF), { endTime, pushCount });
}

// Get GitHub timer data
export async function getGitHubTimer() {
  const snapshot = await get(ref(db, GITHUB_TIMER_REF));
  if (snapshot.exists()) {
    return snapshot.val();
  }
  // Initialize with 3 hours from now if not exists
  const newEndTime = Date.now() + THREE_HOURS;
  await saveGitHubTimer(newEndTime, 1);
  return { endTime: newEndTime, pushCount: 1 };
}

// Real-time listener for GitHub timer
export function subscribeToGitHubTimer(callback) {
  const timerRef = ref(db, GITHUB_TIMER_REF);
  const unsubscribe = onValue(timerRef, async (snapshot) => {
    let data;
    if (snapshot.exists()) {
      data = snapshot.val();
      // Ensure pushCount exists, default to 1 if missing
      if (!data.pushCount) {
        data.pushCount = 1;
        await saveGitHubTimer(data.endTime, 1);
      }
    } else {
      const endTime = Date.now() + THREE_HOURS;
      data = { endTime, pushCount: 1 };
      await saveGitHubTimer(endTime, 1);
    }
    callback(data.endTime, data.pushCount);
  });
  return unsubscribe;
}

// Reset GitHub timer (add 3 hours from now and increment count)
export async function resetGitHubTimer() {
  const currentData = await getGitHubTimer();
  const newEndTime = Date.now() + THREE_HOURS;
  const newPushCount = currentData.pushCount + 1;
  await saveGitHubTimer(newEndTime, newPushCount);
  return { endTime: newEndTime, pushCount: newPushCount };
}
