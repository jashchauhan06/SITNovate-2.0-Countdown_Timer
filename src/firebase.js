import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// TODO: Replace with your Firebase project config
// Get this from: Firebase Console → Project Settings → General → Your apps → Web
const firebaseConfig = {
    apiKey: "AIzaSyANt7TS23bSzIPTbwV8Ic5Toe90yZYbsas",
    authDomain: "sitnovate-timer.firebaseapp.com",
    databaseURL: "https://sitnovate-timer-default-rtdb.firebaseio.com",
    projectId: "sitnovate-timer",
    storageBucket: "sitnovate-timer.firebasestorage.app",
    messagingSenderId: "418096520087",
    appId: "1:418096520087:web:b1770fb28aa14072c142d2",
    measurementId: "G-VDLN88W5LN"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
