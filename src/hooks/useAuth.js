// src/hooks/useAuth.js
import { useState, useEffect } from "react";
import { subscribeToAuth, getUserProfile } from "../firebase/auth";

export function useAuth() {
  const [user, setUser]       = useState(null);   // Firebase auth user
  const [profile, setProfile] = useState(null);   // Firestore profile doc
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToAuth(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const p = await getUserProfile(firebaseUser.uid);
          setProfile(p);
        } catch { setProfile(null); }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return { user, profile, loading, isLoggedIn: !!user };
}