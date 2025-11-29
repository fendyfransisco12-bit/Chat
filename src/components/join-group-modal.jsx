"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { db } from "@/lib/firebase";
import { ref, update, get } from "firebase/database";

export default function JoinGroupModal({ isOpen, onClose, groups, onGroupJoined }) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedGroup) {
      setError("Please select a group");
      return;
    }

    // Check if already a member
    try {
      const membersRef = ref(db, `groups/${selectedGroup.id}/members`);
      const snapshot = await get(membersRef);
      if (snapshot.exists()) {
        const members = snapshot.val();
        if (Object.keys(members).includes(user.uid)) {
          setError("You are already a member of this group");
          return;
        }
      }
    } catch (err) {
      console.error("Error checking membership:", err);
    }

    // Validate password for private groups
    if (selectedGroup.type === "private") {
      if (!password.trim()) {
        setError("Password is required to join this private group");
        return;
      }
      if (password !== selectedGroup.password) {
        setError("Incorrect password");
        return;
      }
    }

    setLoading(true);

    try {
      // Add user as member with uid as key
      const membersRef = ref(db, `groups/${selectedGroup.id}/members`);
      await update(membersRef, {
        [user.uid]: {
          username: user.displayName || "User",
          email: user.email,
          joinedAt: Date.now(),
          role: "member",
        }
      });

      setSelectedGroup(null);
      setPassword("");
      onGroupJoined();
      onClose();
    } catch (error) {
      console.error("Error joining group:", error);
      setError("Failed to join group");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const availableGroups = groups.filter((group) => {
    const memberRef = ref(db, `groups/${group.id}/members/${user.uid}`);
    return !memberRef.exists;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 ${isDark ? "bg-gray-800" : "bg-white"}`}>
        <h2 className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>
          Join a Group
        </h2>

        <form onSubmit={handleJoinGroup} className="space-y-4">
          {/* Group Selection */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Available Groups
            </label>
            <select
              value={selectedGroup?.id || ""}
              onChange={(e) => {
                const groupId = e.target.value;
                const group = groups.find((g) => g.id === groupId);
                setSelectedGroup(group || null);
                setPassword("");
                setError("");
              }}
              className={`w-full px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                isDark
                  ? "bg-gray-700 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <option value="">Select a group...</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.type === "public" ? "🌍" : "🔒"} {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* Password Field - Only for Private Groups */}
          {selectedGroup?.type === "private" && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Group Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter group password"
                className={`w-full px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  isDark
                    ? "bg-gray-700 text-white placeholder-gray-400"
                    : "bg-gray-100 text-gray-900 placeholder-gray-500"
                }`}
              />
              <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                This is a private group. Enter the password to join.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors duration-200 font-medium ${
                isDark
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-900"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedGroup}
              className="flex-1 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Joining..." : "Join Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
