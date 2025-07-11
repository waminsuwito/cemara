
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
  apiKey: "AIzaSyB5MPo5udTSUTgitB_oK6I2ZeKOcv3-tS4",
  authDomain: "batchingplantmanager-5f679.firebaseapp.com",
  projectId: "batchingplantmanager-5f679",
  storageBucket: "batchingplantmanager-5f679.appspot.com",
  messagingSenderId: "643284217395",
  appId: "1:643284217395:web:e474af169185d52d3d7d46",
  measurementId: "G-JMF86KVYLP"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


export { app, auth, db, storage };
