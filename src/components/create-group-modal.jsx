"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { db } from "@/lib/firebase";
import { ref, push, update } from "firebase/database";

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState("public");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError("");

    if (!groupName.trim()) {
      setError("Group name is required");
      return;
    }

    if (groupType === "private") {
      if (!password.trim()) {
        setError("Password is required for private groups");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    }

    if (!db) {
      setError("Database not initialized. Please check Firebase configuration.");
      console.error("Firebase database not initialized");
      return;
    }

    if (!user?.uid) {
      setError("User not authenticated");
      console.error("User not authenticated");
      return;
    }

    setLoading(true);

    try {
      const groupsRef = ref(db, "groups");
      const newGroupRef = await push(groupsRef, {
        name: groupName,
        type: groupType,
        password: groupType === "private" ? password : null,
        createdBy: user.uid,
        createdAt: Date.now(),
        memberCount: 1,
      });

      // Add creator as member with uid as key
      const groupId = newGroupRef.key;
      if (!groupId) {
        throw new Error("Failed to get group ID");
      }

      // Update members using uid as key
      const membersRef = ref(db, `groups/${groupId}/members`);
      await update(membersRef, {
        [user.uid]: {
          username: user.displayName || "User",
          email: user.email,
          joinedAt: Date.now(),
          role: "admin",
        }
      });

      console.log("Group created successfully:", groupId);
      setGroupName("");
      setPassword("");
      setConfirmPassword("");
      setGroupType("public");
      onGroupCreated();
      onClose();
    } catch (error) {
      console.error("Error creating group:", error);
      setError("Failed to create group: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 ${isDark ? "bg-gray-800" : "bg-white"}`}>
        <h2 className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>
          Create New Group
        </h2>

        <form onSubmit={handleCreateGroup} className="space-y-4">
          {/* Group Name */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className={`w-full px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                isDark
                  ? "bg-gray-700 text-white placeholder-gray-400"
                  : "bg-gray-100 text-gray-900 placeholder-gray-500"
              }`}
            />
          </div>

          {/* Group Type */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Group Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="groupType"
                  value="public"
                  checked={groupType === "public"}
                  onChange={(e) => setGroupType(e.target.value)}
                  className="w-4 h-4"
                />
                <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                  🌍 Public (Anyone can join)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="groupType"
                  value="private"
                  checked={groupType === "private"}
                  onChange={(e) => setGroupType(e.target.value)}
                  className="w-4 h-4"
                />
                <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                  🔒 Private (Password required)
                </span>
              </label>
            </div>
          </div>

          {/* Password Fields - Only for Private Groups */}
          {groupType === "private" && (
            <>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className={`w-full px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    isDark
                      ? "bg-gray-700 text-white placeholder-gray-400"
                      : "bg-gray-100 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className={`w-full px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    isDark
                      ? "bg-gray-700 text-white placeholder-gray-400"
                      : "bg-gray-100 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>
            </>
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
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
