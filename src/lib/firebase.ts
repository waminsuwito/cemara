
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
  apiKey: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "xxxxxxxxxxxxxxxxxxxxxxxx.firebaseapp.com",
  projectId: "xxxxxxxxxxxxxxxxxxxxxxxx",
  storageBucket: "xxxxxxxxxxxxxxxxxxxxxxxx.appspot.com",
  messagingSenderId: "xxxxxxxxxxxx",
  appId: "x:xxxxxxxxxxxx:web:xxxxxxxxxxxxxxxxxxxxxx",
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


export { app, auth, db, storage };
