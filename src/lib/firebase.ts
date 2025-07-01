
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
    apiKey: "GANTI_DENGAN_API_KEY_BARU_ANDA",
    authDomain: "GANTI_DENGAN_AUTH_DOMAIN_BARU_ANDA",
    projectId: "GANTI_DENGAN_PROJECT_ID_BARU_ANDA",
    storageBucket: "GANTI_DENGAN_STORAGE_BUCKET_BARU_ANDA",
    messagingSenderId: "GANTI_DENGAN_MESSAGING_SENDER_ID_BARU_ANDA",
    appId: "GANTI_DENGAN_APP_ID_BARU_ANDA"
  };


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


export { app, auth, db, storage };
