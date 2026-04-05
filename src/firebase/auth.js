// src/firebase/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "./config";

// ── Create user profile in Firestore after signup ──
const createUserProfile = async (user, extraData = {}) => {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      displayName: user.displayName || extraData.displayName || "Anonymous",
      email: user.email,
      photoURL: user.photoURL || null,
      bio: "",
      joinedAt: serverTimestamp(),
      postsCount: 0,
      ...extraData,
    });
  }
  return getDoc(ref);
};

// ── Sign up with email + password ──
export const signUpWithEmail = async (email, password, displayName) => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName });
  await createUserProfile(user, { displayName });
  return user;
};

// ── Sign in with email + password ──
export const signInWithEmail = async (email, password) => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
};

// ── Sign in with Google ──
export const signInWithGoogle = async () => {
  const { user } = await signInWithPopup(auth, googleProvider);
  await createUserProfile(user);
  return user;
};

// ── Sign out ──
export const logOut = () => signOut(auth);

// ── Password reset ──
export const resetPassword = (email) => sendPasswordResetEmail(auth, email);

// ── Auth state listener ──
export const subscribeToAuth = (callback) => onAuthStateChanged(auth, callback);

// ── Get user profile from Firestore ──
export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
};

// ── Update user profile ──
export const updateUserProfile = async (uid, data) => {
  await setDoc(doc(db, "users", uid), data, { merge: true });
  if (data.displayName) {
    await updateProfile(auth.currentUser, { displayName: data.displayName });
  }
};