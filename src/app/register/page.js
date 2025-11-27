"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, db } from "@/lib/firebase";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    setLoading(true);
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with username
      await updateProfile(user, { displayName: username });

      // Save user data to Realtime Database
      await set(ref(db, `users/${user.uid}`), {
        email: email,
        username: username,
        createdAt: new Date().toISOString(),
      });

      // Redirect to login or dashboard
      router.push("/login");
    } catch (err) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-500 via-indigo-600 to-purple-700 p-6">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/30">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-white rounded-full p-2 shadow-sm mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c2.21 0 4-1.79 4-4S14.21 3 12 3 8 4.79 8 7s1.79 4 4 4z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 21a7.5 7.5 0 0115 0" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Create Account</h1>
          <p className="text-sm text-gray-700 mt-1">Join us today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="sr-only">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 10a4 4 0 100-8 4 4 0 000 8z" />
                  <path fillRule="evenodd" d="M2 18a8 8 0 1116 0H2z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Username"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Email address"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 8a5 5 0 1110 0v1h1a2 2 0 012 2v5a2 2 0 01-2 2H4a2 2 0 01-2-2v-5a2 2 0 012-2h1V8zm2 1V8a3 3 0 116 0v1H7z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                id="password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-12 py-2 w-full rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Password"
                required
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-sm text-indigo-600"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.875 12.825A3 3 0 108.175 7.125" />
                    <path fillRule="evenodd" d="M3.28 3.28a.75.75 0 011.06 0l12.38 12.38a.75.75 0 11-1.06 1.06L3.28 4.34a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.94 6.94C4.94 3.94 7.94 2 10 2s5.06 1.94 7.06 4.94a1.5 1.5 0 010 1.12C15.06 14.06 12.06 16 10 16s-5.06-1.94-7.06-4.94a1.5 1.5 0 010-1.12z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 8a5 5 0 1110 0v1h1a2 2 0 012 2v5a2 2 0 01-2 2H4a2 2 0 01-2-2v-5a2 2 0 012-2h1V8zm2 1V8a3 3 0 116 0v1H7z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 pr-12 py-2 w-full rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Confirm password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-sm text-indigo-600"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.875 12.825A3 3 0 108.175 7.125" />
                    <path fillRule="evenodd" d="M3.28 3.28a.75.75 0 011.06 0l12.38 12.38a.75.75 0 11-1.06 1.06L3.28 4.34a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.94 6.94C4.94 3.94 7.94 2 10 2s5.06 1.94 7.06 4.94a1.5 1.5 0 010 1.12C15.06 14.06 12.06 16 10 16s-5.06-1.94-7.06-4.94a1.5 1.5 0 010-1.12z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-70"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-gray-700">
          Already have an account? <Link href="/login" className="text-indigo-600 hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
