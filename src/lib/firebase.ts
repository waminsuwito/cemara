
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCqlLDtfD8i0SgfIb9mZEcwb8o9EnpQxug",
  authDomain: "frp-ceklist-armada.firebaseapp.com",
  projectId: "frp-ceklist-armada",
  storageBucket: "frp-ceklist-armada.appspot.com",
  messagingSenderId: "428879600526",
  appId: "1:428879600526:web:0437c1c03b11914a3ba2df",
  measurementId: "G-PHZC8ZV670"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


export { app, auth, db, storage };
