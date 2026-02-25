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

// Calculate which push cycle we're in based on the main timer
function calculatePushCycle(mainTimerRemainingMs) {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const elapsed = TWENTY_FOUR_HOURS - mainTimerRemainingMs;
  const pushNumber = Math.floor(elapsed / THREE_HOURS) + 1;
  const timeInCurrentCycle = elapsed % THREE_HOURS;
  const timeLeftInCycle = THREE_HOURS - timeInCurrentCycle;
  
  return {
    pushNumber: Math.min(pushNumber, 8), // Max 8 pushes in 24 hours
    timeLeft: timeLeftInCycle
  };
}

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

// Sync GitHub timer with main timer
export async function syncGitHubTimerWithMain() {
  const mainTimerState = await getTimerState();
  
  if (!mainTimerState.isRunning) {
    // If main timer is not running, don't update GitHub timer
    return;
  }
  
  let remainingTime = mainTimerState.remainingTime;
  if (mainTimerState.endTime) {
    remainingTime = Math.max(0, mainTimerState.endTime - Date.now());
  }
  
  const { pushNumber, timeLeft } = calculatePushCycle(remainingTime);
  const newEndTime = Date.now() + timeLeft;
  
  await saveGitHubTimer(newEndTime, pushNumber);
}

// Real-time listener for GitHub timer that syncs with main timer
export function subscribeToGitHubTimer(callback) {
  const timerRef = ref(db, TIMER_REF);
  
  const unsubscribe = onValue(timerRef, async (snapshot) => {
    const mainState = snapshot.exists() ? snapshot.val() : { ...DEFAULT_STATE };
    
    if (!mainState.isRunning) {
      // Timer is stopped, show default state
      callback(Date.now() + THREE_HOURS, 1);
      return;
    }
    
    let remainingTime = mainState.remainingTime;
    if (mainState.endTime) {
      remainingTime = Math.max(0, mainState.endTime - Date.now());
    }
    
    const { pushNumber, timeLeft } = calculatePushCycle(remainingTime);
    const endTime = Date.now() + timeLeft;
    
    callback(endTime, pushNumber);
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
