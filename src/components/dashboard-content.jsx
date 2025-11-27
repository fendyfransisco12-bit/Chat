"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

export default function DashboardContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);

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
        const messagesList = Object.values(data).sort(
          (a, b) => a.timestamp - b.timestamp
        );
        setMessages(messagesList);
      } else {
        setMessages([]);
      }
    });

    return unsubscribe;
  }, [selectedUser, user]);

  async function handleLogout() {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
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
    <div className="flex h-screen bg-white">
      {/* Sidebar - Contacts */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Messages</h1>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-full transition"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
          <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search messages..."
              className="bg-transparent ml-2 outline-none w-full text-sm"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          {loadingUsers ? (
            <div className="p-4 text-center text-gray-500">Loading contacts...</div>
          ) : users.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No contacts yet</div>
          ) : (
            users.map((u) => (
              <button
                key={u.uid}
                onClick={() => setSelectedUser(u)}
                className={`w-full p-3 text-left hover:bg-gray-50 transition border-b border-gray-100 flex items-center gap-3 ${
                  selectedUser?.uid === u.uid ? "bg-gray-50" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {u.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{u.username}</p>
                  <p className="text-sm text-gray-500 truncate">{u.email}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                  {selectedUser.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <p className="font-medium">{selectedUser.username}</p>
                  <p className="text-sm text-gray-500">Active now</p>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-5xl mb-2">💬</div>
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.senderId === user.uid ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-2xl ${
                        msg.senderId === user.uid
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-gray-200 text-gray-900 rounded-bl-none"
                      }`}
                    >
                      <p className="break-words">{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.senderId === user.uid ? "text-blue-100" : "text-gray-600"}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-3">
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Aa"
                  className="flex-1 bg-gray-100 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && messageText.trim()) {
                      setMessageText("");
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (messageText.trim()) {
                      setMessageText("");
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16346272 C3.34915502,0.9 2.40734225,1.00636533 1.77946707,1.4776575 C0.994623095,2.10604706 0.837654326,3.0486314 1.15159189,3.99521575 L3.03521743,10.4362088 C3.03521743,10.5933061 3.34915502,10.7504035 3.50612381,10.7504035 L16.6915026,11.5358905 C16.6915026,11.5358905 17.1624089,11.5358905 17.1624089,12.0071827 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z"/>
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-gray-600">Select a contact to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
