
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ===================================================================
// GANTI DENGAN KONFIGURASI DARI PROYEK FIREBASE BARU ANDA
// 1. Buka konsol Firebase proyek baru Anda.
// 2. Masuk ke Project Settings (ikon gerigi ⚙️).
// 3. Di tab "General", scroll ke bawah ke "Your apps".
// 4. Pilih aplikasi web Anda, lalu pilih "Config" pada bagian SDK.
// 5. Salin objek "firebaseConfig" dan tempel seluruhnya di sini.
// ===================================================================
const firebaseConfig = {
  apiKey: "AIzaSyAI3rvfMGSPkfHpmtMAOgFFU9Bv64su7T0",
  authDomain: "heavy-duty-checklist.firebaseapp.com",
  projectId: "heavy-duty-checklist",
  storageBucket: "heavy-duty-checklist.appspot.com",
  messagingSenderId: "62662575935",
  appId: "1:62662575935:web:164bbc4630e4ba5bfb358a"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


export { app, auth, db, storage };
