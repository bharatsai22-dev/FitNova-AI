import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBaYcLno6jCTg1aRqNwpT5CzgzkycGwD0Y",
  authDomain: "fitnova-ai-6a1fc.firebaseapp.com",
  projectId: "fitnova-ai-6a1fc",
  storageBucket: "fitnova-ai-6a1fc.firebasestorage.app",
  messagingSenderId: "355517774441",
  appId: "1:355517774441:web:7bcc6cd10cb6e11c4380f8",
  measurementId: "G-WQT43F2MZ8"
};

// 1. Initialize Firebase App Instance FIRST
const app = initializeApp(firebaseConfig);
const BASE_URL = "https://fitnova-ai-2.onrender.com";

// 2. Initialize secondary services downstream safely
const analytics = getAnalytics(app);
const auth = getAuth(app); 
const googleProvider = new GoogleAuthProvider();

// 3. Clean, single export block at the bottom
export { app, auth, googleProvider, analytics };