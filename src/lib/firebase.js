import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
import { getStorage } from "firebase/storage";

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Validate required env vars early to give a clear error
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  throw new Error(
    "Missing environment variable: NEXT_PUBLIC_FIREBASE_API_KEY.\n" +
      "Create a .env.local at the project root with your Firebase config (see .env.local.example) and restart the dev server."
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

// Realtime Database - only initialize if URL is provided
let db = null;
if (process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) {
  db = getDatabase(app);
} else {
  console.warn("Firebase Realtime Database URL not configured. Skipping database initialization.");
}

// Storage
const storage = getStorage(app);

// Optional: Use emulator for local testing (comment out for production)
// if (process.env.NODE_ENV === "development") {
//   try {
//     connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
//     connectDatabaseEmulator(db, "localhost", 9000);
//   } catch (error) {
//     // ignore - emulator already running
//   }
// }

export { auth, db, app, storage };
