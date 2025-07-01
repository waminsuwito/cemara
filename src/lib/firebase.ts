
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
  apiKey: "AIzaSyCqlLDtfD8i0SgfIb9mZEcwb8o9EnpQxug",
  authDomain: "frp-ceklist-armada.firebaseapp.com",
  projectId: "frp-ceklist-armada",
  storageBucket: "frp-ceklist-armada.firebasestorage.app",
  messagingSenderId: "428879600526",
  appId: "1:428879600526:web:0437c1c03b11914a3ba2df"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


export { app, auth, db, storage };
