"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, update, onDisconnect } from "firebase/database";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);
    
    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);

        // Setup presence tracking ketika user login
        if (currentUser && db) {
          setupPresenceTracking(currentUser);
        }
      },
      (error) => {
        console.error("Auth state error:", error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const setupPresenceTracking = (currentUser) => {
    const userRef = ref(db, `users/${currentUser.uid}`);
    
    // Set online status immediately
    update(userRef, {
      isOnline: true,
      lastSeen: Date.now(),
      lastActivity: Date.now(),
    }).catch(console.error);

    // Set offline status ketika disconnect
    onDisconnect(userRef).update({
      isOnline: false,
      lastSeen: Date.now(),
    }).catch(console.error);

    // Track user activity untuk idle detection
    let activityTimeout;
    const IDLE_TIME = 5 * 60 * 1000; // 5 menit idle
    
    const trackActivity = () => {
      // Clear existing timeout
      if (activityTimeout) clearTimeout(activityTimeout);

      // Update last activity
      update(userRef, {
        lastActivity: Date.now(),
      }).catch(console.error);

      // Set timeout untuk set offline jika idle
      activityTimeout = setTimeout(() => {
        update(userRef, {
          isOnline: false,
          lastSeen: Date.now(),
        }).catch(console.error);
      }, IDLE_TIME);
    };

    // Listen untuk user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      window.addEventListener(event, trackActivity);
    });

    // Cleanup
    return () => {
      if (activityTimeout) clearTimeout(activityTimeout);
      events.forEach(event => {
        window.removeEventListener(event, trackActivity);
      });
    };
  };

  // During SSR/hydration, render children without checking auth state
  // This prevents hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
