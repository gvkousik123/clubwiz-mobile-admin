import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase configuration for clubwiz-477108 project
// Hardcoded credentials - get correct values from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAPB69pxPrG_7JzcrvwloiIYphRYzpfCBQ", 
  authDomain: "clubwiz-477108.firebaseapp.com",
  projectId: "clubwiz-477108",
  storageBucket: "clubwiz-477108.firebasestorage.app",
  messagingSenderId: "260703019239",
  appId: "1:260703019239:web:0b681131b688abaedc4242",
  measurementId: "G-X1VK4Y90XY"
};

console.log("🔥 Firebase Config:", {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKey: firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 10) + "..." : "NOT SET"
});

// Initialize Firebase
let app;
let auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  console.log("✅ Firebase initialized successfully");
} catch (error) {
  console.error("❌ Firebase initialization error:", error);
  throw error;
}

export { auth };
export default app;