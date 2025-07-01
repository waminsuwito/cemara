
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
    apiKey: "AIzaSyCqF_dg58ECxFjq2z_3oRkOpufW5rEhdbE",
    authDomain: "frp-checklist-harian.firebaseapp.com",
    projectId: "frp-checklist-harian",
    storageBucket: "frp-checklist-harian.appspot.com",
    messagingSenderId: "640472538942",
    appId: "1:640472538942:web:5a3fcd16bf8cc692c7d66f",
    measurementId: "G-R8FWGN80MD"
  };


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


export { app, auth, db, storage };
