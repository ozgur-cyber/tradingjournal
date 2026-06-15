import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD_qaMkhrjrSI2K1jfDu-OwZooKeG9S6pI",
  authDomain: "tradejournal-39550.firebaseapp.com",
  projectId: "tradejournal-39550",
  storageBucket: "tradejournal-39550.firebasestorage.app",
  messagingSenderId: "638689056172",
  appId: "1:638689056172:web:4bbc4b975f4362011d5609",
  measurementId: "G-4D7LTRYXYC"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
