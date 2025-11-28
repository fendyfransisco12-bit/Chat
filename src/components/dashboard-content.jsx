"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { signOut } from "firebase/auth";
import { auth, db, storage } from "@/lib/firebase";
import { ref, onValue, push, remove } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import FinancialTracker from "./financial-tracker";
import PlanningDestination from "./planning-destination";
import SwipeMenu from "./swipe-menu";

export default function DashboardContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activeTab, setActiveTab] = useState("messages");
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const fileInputRef = useRef(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Fetch all users
  useEffect(() => {
    if (!user || !db) return;

    const usersRef = ref(db, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const usersList = Object.entries(data)
          .map(([uid, userData]) => ({ uid, ...userData }))
          .filter((u) => u.uid !== user.uid);
        setUsers(usersList);
      }
      setLoadingUsers(false);
    });

    return unsubscribe;
  }, [user]);

  // Fetch messages for selected user
  useEffect(() => {
    if (!selectedUser || !user || !db) return;

    const chatId = [user.uid, selectedUser.uid].sort().join("_");
    const messagesRef = ref(db, `messages/${chatId}`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const messagesList = Object.entries(data)
          .map(([messageId, messageData]) => ({ 
            id: messageId,
            ...messageData 
          }))
          .sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesList);
      } else {
        setMessages([]);
      }
    });

    return unsubscribe;
  }, [selectedUser, user]);

  // Toast notification
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Handle logout
  async function handleLogout() {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageText.trim() || !selectedUser || !user || !db) {
      return;
    }

    try {
      const chatId = [user.uid, selectedUser.uid].sort().join("_");
      const messagesRef = ref(db, `messages/${chatId}`);
      
      await push(messagesRef, {
        text: messageText,
        senderId: user.uid,
        senderName: user.displayName || "User",
        timestamp: Date.now(),
      });

      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
      showToast("Failed to send message", "error");
    }
  };

  // Upload image
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      console.warn("No file selected");
      return;
    }

    if (!selectedUser) {
      showToast("Please select a contact first", "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (!user || !db) {
      showToast("User or database not initialized", "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file", "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must be less than 5MB", "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    
    try {
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${file.name}`;
      const imageStorageRef = storageRef(storage, `messages/${user.uid}/${fileName}`);
      
      const uploadResult = await uploadBytes(imageStorageRef, file);
      const imageUrl = await getDownloadURL(uploadResult.ref);

      const chatId = [user.uid, selectedUser.uid].sort().join("_");
      const messagesRef = ref(db, `messages/${chatId}`);
      
      await push(messagesRef, {
        image: imageUrl,
        senderId: user.uid,
        senderName: user.displayName || "User",
        timestamp: Date.now(),
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      showToast("Image sent successfully", "success");
    } catch (error) {
      console.error("Error uploading image:", error);
      showToast("Failed to upload image", "error");
    } finally {
      setUploading(false);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    try {
      const chatId = [user.uid, selectedUser.uid].sort().join("_");
      const messageRef = ref(db, `messages/${chatId}/${messageId}`);
      await remove(messageRef);
      setDeleteConfirm(null);
      showToast("Message deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting message:", error);
      showToast("Failed to delete message", "error");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden transition-colors duration-300 ${
      isDark ? "bg-gray-900" : "bg-gray-50"
    }`}>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg animate-slide-in transition-all duration-300 ${
          toast.type === "success" 
            ? "bg-green-500 text-white" 
            : toast.type === "error"
            ? "bg-red-500 text-white"
            : "bg-blue-500 text-white"
        }`}>
          <div className="flex items-center gap-3">
            {toast.type === "success" && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {toast.type === "error" && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {toast.type === "info" && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Swipe Menu */}
      <div className={`transition-colors duration-300 ${isDark ? "bg-gray-800" : "bg-white"}`}>
        <SwipeMenu 
          activeTab={activeTab} 
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab === "messages") {
              setSelectedUser(null);
            }
          }}
          isDark={isDark}
        />
      </div>

      {/* Header */}
      <div className={`px-6 py-4 border-b transition-colors duration-300 ${
        isDark 
          ? "bg-gray-800 border-b-gray-700" 
          : "bg-white border-gray-200"
      }`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-black"}`}>
            {activeTab === "messages" ? "Chat" : activeTab === "financial" ? "Financial" : "Planning"}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all duration-300 ${
                isDark 
                  ? "bg-gray-700 text-yellow-400 hover:bg-gray-600" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              title={isDark ? "Light Mode" : "Dark Mode"}
            >
              {isDark ? "☀️" : "🌙"}
            </button>
            <button
              onClick={handleLogout}
              className={`p-2 rounded-lg transition-all duration-300 ${
                isDark 
                  ? "hover:bg-gray-700 text-gray-400 hover:text-red-500" 
                  : "hover:bg-gray-100 text-gray-600 hover:text-red-600"
              }`}
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "messages" ? (
          <div className="flex h-full gap-4 p-4">
            {/* Sidebar - Contacts */}
            <div className={`w-80 flex flex-col rounded-lg transition-colors duration-300 ${
              isDark 
                ? "bg-gray-800 border border-gray-700" 
                : "bg-white border border-gray-200"
            }`}>
              {/* Search Bar */}
              <div className={`p-4 border-b transition-colors duration-300 ${
                isDark 
                  ? "bg-gray-800 border-b-gray-700" 
                  : "bg-white border-gray-200"
              }`}>
                <div className={`flex items-center rounded-lg px-4 py-2 transition-all duration-300 ${
                  isDark 
                    ? "bg-gray-700" 
                    : "bg-gray-100"
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isDark ? "text-gray-400" : "text-gray-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search messages..."
                    className={`bg-transparent ml-2 outline-none w-full text-sm transition-colors duration-300 ${
                      isDark 
                        ? "text-white placeholder-gray-500" 
                        : "text-gray-900 placeholder-gray-500"
                    }`}
                  />
                </div>
              </div>

              {/* Users List */}
              <div className={`flex-1 overflow-y-auto transition-colors duration-300 ${isDark ? "bg-gray-800" : "bg-white"}`}>
                {loadingUsers ? (
                  <div className={`p-4 text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}>Loading contacts...</div>
                ) : users.length === 0 ? (
                  <div className={`p-4 text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}>No contacts yet</div>
                ) : (
                  users.map((u) => (
                    <button
                      key={u.uid}
                      onClick={() => setSelectedUser(u)}
                      className={`w-full p-3 text-left transition border-b flex items-center gap-3 ${
                        isDark
                          ? selectedUser?.uid === u.uid 
                            ? "bg-gray-700 border-b-gray-600 hover:bg-gray-700"
                            : "hover:bg-gray-700 border-b-gray-700"
                          : selectedUser?.uid === u.uid 
                          ? "bg-gray-50 border-b-gray-100 hover:bg-gray-50"
                          : "hover:bg-gray-50 border-b-gray-100"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {u.username?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${isDark ? "text-white" : "text-black"}`}>{u.username}</p>
                        <p className={`text-sm truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>{u.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col rounded-lg transition-colors duration-300 ${
              isDark 
                ? "bg-gray-800 border border-gray-700" 
                : "bg-white border border-gray-200"
            }`}>
              {selectedUser ? (
                <>
                  {/* Chat Header */}
                  <div className={`border-b p-4 flex items-center justify-between transition-colors duration-300 ${isDark ? "bg-gray-800 border-b-gray-700" : "border-gray-200"}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                        {selectedUser.username?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{selectedUser.username}</p>
                        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Active now</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className={`flex-1 overflow-y-auto p-4 space-y-4 transition-colors duration-300 ${isDark ? "bg-gray-800" : "bg-white"}`}>
                    {messages.length === 0 ? (
                      <div className={`flex items-center justify-center h-full ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        <div className="text-center">
                          <div className="text-5xl mb-2">💬</div>
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.senderId === user.uid ? "justify-end" : "justify-start"} group`}
                        >
                          <div className="relative">
                            <div
                              className={`max-w-xs ${
                                msg.senderId === user.uid
                                  ? "bg-blue-500 text-white rounded-br-none"
                                  : isDark ? "bg-gray-700 text-white rounded-bl-none" : "bg-gray-200 text-gray-900 rounded-bl-none"
                              } rounded-2xl overflow-hidden`}
                            >
                              {msg.image && (
                                <div className="mb-2">
                                  <img 
                                    src={msg.image} 
                                    alt="Chat image" 
                                    className="max-w-xs h-auto rounded-lg"
                                  />
                                </div>
                              )}
                              {msg.text && (
                                <div className="px-4 py-2">
                                  <p className="break-words">{msg.text}</p>
                                </div>
                              )}
                              <p className={`text-xs px-4 py-1 ${msg.senderId === user.uid ? "text-blue-100" : isDark ? "text-gray-400" : "text-gray-600"}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            {msg.senderId === user.uid && (
                              <button
                                onClick={() => setDeleteConfirm(msg.id)}
                                className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2 p-1 rounded ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
                                title="Delete message"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDark ? "text-gray-400 hover:text-red-400" : "text-gray-600 hover:text-red-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <div className={`border-t p-4 transition-colors duration-300 ${isDark ? "bg-gray-800 border-t-gray-700" : "bg-white border-gray-200"}`}>
                    <div className="flex gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className={`p-2 rounded-full transition-colors duration-300 ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"} ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
                        title={uploading ? "Uploading..." : "Send image"}
                      >
                        {uploading ? (
                          <div className="inline-block animate-spin">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </div>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        )}
                      </button>
                      <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder="Type a message..."
                          className={`flex-1 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                            isDark
                              ? "bg-gray-700 text-white placeholder-gray-400"
                              : "bg-gray-100 text-gray-900 placeholder-gray-500"
                          }`}
                        />
                        <button
                          type="submit"
                          disabled={!messageText.trim()}
                          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16346272 C3.34915502,0.9 2.40734225,1.00636533 1.77946707,1.4776575 C0.994623095,2.10604706 0.837654326,3.0486314 1.15159189,3.99521575 L3.03521743,10.4362088 C3.03521743,10.5933061 3.34915502,10.7504035 3.50612381,10.7504035 L16.6915026,11.5358905 C16.6915026,11.5358905 17.1624089,11.5358905 17.1624089,12.0071827 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z"/>
                          </svg>
                        </button>
                      </form>
                    </div>
                  </div>
                </>
              ) : (
                <div className={`flex-1 flex items-center justify-center ${isDark ? "bg-gray-800" : "bg-white"}`}>
                  <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <p className={isDark ? "text-gray-400" : "text-gray-600"}>Select a contact to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "financial" ? (
          <div className="h-full overflow-auto p-4">
            <FinancialTracker />
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <PlanningDestination />
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg shadow-2xl p-6 max-w-sm w-full mx-4 ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 5v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className={`text-lg font-semibold text-center mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
              Delete Message?
            </h3>
            <p className={`text-center mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors duration-200 font-medium ${
                  isDark
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMessage(deleteConfirm)}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
