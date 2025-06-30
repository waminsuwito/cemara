
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// =================================================================
// >> PENTING <<
// Ganti nilai-nilai di bawah ini dengan konfigurasi proyek Firebase Anda
// yang bisa Anda dapatkan dari konsol Firebase.
//
// Cara menemukan kunci ini:
// 1. Buka Firebase Console (https://console.firebase.google.com/)
// 2. Pilih Proyek Anda
// 3. Klik ikon gerigi (⚙️) -> Project settings
// 4. Gulir ke bawah ke "Your apps"
// 5. Pilih aplikasi web Anda dan salin konfigurasinya di sini.
// =================================================================
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // GANTI DENGAN API KEY ANDA
  authDomain: "your-project-id.firebaseapp.com",     // GANTI DENGAN AUTH DOMAIN ANDA
  projectId: "your-project-id",                     // GANTI DENGAN PROJECT ID ANDA
  storageBucket: "your-project-id.appspot.com",   // GANTI DENGAN STORAGE BUCKET ANDA
  messagingSenderId: "123456789012",                // GANTI DENGAN MESSAGING SENDER ID ANDA
  appId: "1:123456789012:web:a1b2c3d4e5f6g7h8i9j0" // GANTI DENGAN APP ID ANDA
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
