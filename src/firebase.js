// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Determine which domain we're on
const currentDomain = window.location.hostname;

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAcm7a-BLeJTz38joMjBleh3O9xE7rKtbs",
  authDomain: currentDomain, // This will use whichever domain the user is currently on
  projectId: "workout-tracker-61102",
  storageBucket: "workout-tracker-61102.firebasestorage.app",
  messagingSenderId: "584234111745",
  appId: "1:584234111745:web:2e4f217cb329458f320100",
  measurementId: "G-LPNHJDP0VE",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
