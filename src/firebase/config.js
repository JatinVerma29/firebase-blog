// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore"; // 👈 changed
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyArsFEWmGwKVJu6NotbDSEFav0eK_WohzY",
  authDomain: "aero-blog-blogging-website.firebaseapp.com",
  projectId: "aero-blog-blogging-website",
  storageBucket: "aero-blog-blogging-website.firebasestorage.app",
  messagingSenderId: "764187960255",
  appId: "1:764187960255:web:fa90d2dae9a5a398f2f70a",
};

export const isFirebaseConfigured =
  firebaseConfig.apiKey !== "YOUR_API_KEY" &&
  firebaseConfig.projectId !== "YOUR_PROJECT_ID";

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {  // 👈 changed
  localCache: persistentLocalCache()           // 👈 added
});
export const storage = getStorage(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;