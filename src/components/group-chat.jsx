"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useNotification } from "@/context/NotificationContext";
import { db } from "@/lib/firebase";
import { ref, onValue, push, remove, update } from "firebase/database";
import { sendNotification } from "@/lib/notifications";

export default function GroupChat({ group, onBack }) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const notification = useNotification();
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [members, setMembers] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [userStatuses, setUserStatuses] = useState({});
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesContainerRef = useRef(null);
  const messageCountRef = useRef(0);
  const hasScrolledRef = useRef({}); // Track if already scrolled for each group

  // Debug logging
  useEffect(() => {
    console.log("GroupChat rendered with group:", group);
  }, [group]);

  // Fetch group messages
  useEffect(() => {
    if (!group || !db) return;

    const messagesRef = ref(db, `groups/${group.id}/messages`);
    
    // Reset scroll tracking ketika user switch group
    hasScrolledRef.current = false;
    let isFirstLoad = true;
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const messagesList = Object.entries(data)
          .map(([messageId, messageData]) => ({
            id: messageId,
            ...messageData,
          }))
          .sort((a, b) => a.timestamp - b.timestamp);
        
        const newMessageCount = messagesList.length;
        
        // Clear unread HANYA saat first load
        if (isFirstLoad) {
          notification.clearUnreadGroup(group.id);
          isFirstLoad = false;
        }
        
        // Jika ada message baru (newMessageCount > oldMessageCount) SETELAH first load
        if (newMessageCount > messageCountRef.current && !isFirstLoad) {
          const lastMessage = messagesList[messagesList.length - 1];
          
          // Cek apakah message dari user lain
          if (lastMessage.senderId !== user.uid) {
            // Trigger browser notification
            sendNotification(`New message in ${group.name}`, {
              body: lastMessage.text?.substring(0, 50) || "📸 Image sent",
              tag: `group-${group.id}`,
            });
          }
        }
        
        messageCountRef.current = newMessageCount;
        setMessages(messagesList);
      } else {
        setMessages([]);
        messageCountRef.current = 0;
      }
    });

    return unsubscribe;
  }, [group, user, notification]);

  // Fetch group members
  useEffect(() => {
    if (!group || !db) return;

    const membersRef = ref(db, `groups/${group.id}/members`);
    const unsubscribe = onValue(membersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const membersList = Object.entries(data)
          .map(([uid, memberData]) => ({
            uid,
            ...memberData,
          }))
          .sort((a, b) => a.joinedAt - b.joinedAt);
        setMembers(membersList);
      }
    });

    return unsubscribe;
  }, [group]);

  // Fetch user statuses
  useEffect(() => {
    if (!db) return;

    const usersRef = ref(db, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const statuses = {};
        Object.entries(data).forEach(([uid, userData]) => {
          statuses[uid] = {
            status: userData.isOnline ? "online" : "offline",
            lastSeen: userData.lastSeen,
            isOnline: userData.isOnline || false,
          };
        });
        setUserStatuses(statuses);
      }
    });

    return unsubscribe;
  }, [db]);

  // Scroll to latest message (instant, no smooth scroll)
  useEffect(() => {
    if (!messagesContainerRef.current || messages.length === 0 || !group) return;
    
    // Langsung scroll ke bawah tanpa check hasScrolled
    // Gunakan setTimeout 0 untuk memastikan DOM sudah updated
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 0);
  }, [group?.id, messages.length]);

  // Detect scroll position to show/hide scroll down button
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const container = messagesContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  // Jump ke bawah saat tombol arrow diklik
  const handleScrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      setShowScrollButton(false);
    }
  };

  // Send group message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageText.trim() || !group || !user || !db) {
      return;
    }

    try {
      const messagesRef = ref(db, `groups/${group.id}/messages`);
      await push(messagesRef, {
        text: messageText,
        senderId: user.uid,
        senderName: user.displayName || "User",
        timestamp: Date.now(),
      });

      setMessageText("");

      // Loncat ke bawah langsung (instant, tidak pakai scroll animation)
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    try {
      const messageRef = ref(db, `groups/${group.id}/messages/${messageId}`);
      await remove(messageRef);
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  // Leave group
  const handleLeaveGroup = async () => {
    try {
      const memberRef = ref(db, `groups/${group.id}/members/${user.uid}`);
      await remove(memberRef);
      onBack();
    } catch (error) {
      console.error("Error leaving group:", error);
    }
  };

  return (
    <div className={`flex h-full gap-4 ${isDark ? "bg-gray-800" : "bg-white"}`}>
      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div
          className={`border-b p-4 flex items-center justify-between transition-colors duration-300 ${
            isDark ? "bg-gray-800 border-b-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-6 w-6 ${isDark ? "text-white" : "text-black"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <p className={`font-bold text-lg ${isDark ? "text-white" : "text-black"}`}>
                {group.name}
              </p>
              <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {members.length} member{members.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            group.type === "public"
              ? "bg-blue-100 text-blue-800"
              : "bg-purple-100 text-purple-800"
          }`}>
            {group.type === "public" ? "🌍 Public" : "🔒 Private"}
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDark ? "bg-gray-800" : "bg-white"}`}
        >
          {messages.length === 0 ? (
            <div
              className={`flex items-center justify-center h-full ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <div className="text-center">
                <div className="text-5xl mb-2">👥</div>
                <p>No messages yet. Start the conversation!</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === user.uid ? "justify-end" : "justify-start"} group`}
                >
                  <div className="relative">
                    <div
                      className={`max-w-xs ${
                        msg.senderId === user.uid
                          ? "bg-blue-500 text-white rounded-br-none"
                          : isDark
                          ? "bg-gray-700 text-white rounded-bl-none"
                          : "bg-gray-200 text-gray-900 rounded-bl-none"
                      } rounded-2xl overflow-hidden`}
                    >
                      {msg.senderId !== user.uid && (
                        <p className="px-4 pt-2 text-xs font-semibold opacity-75">
                          {msg.senderName}
                        </p>
                      )}
                      {msg.text && (
                        <div className="px-4 py-2">
                          <p className="break-words">{msg.text}</p>
                        </div>
                      )}
                      <p
                        className={`text-xs px-4 py-1 ${
                          msg.senderId === user.uid
                            ? "text-blue-100"
                            : isDark
                            ? "text-gray-400"
                            : "text-gray-600"
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {msg.senderId === user.uid && (
                      <button
                        onClick={() => setDeleteConfirm(msg.id)}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2 p-1 rounded ${
                          isDark ? "hover:bg-gray-700" : "hover:bg-gray-200"
                        }`}
                        title="Delete message"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-5 w-5 ${
                            isDark
                              ? "text-gray-400 hover:text-red-400"
                              : "text-gray-600 hover:text-red-600"
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Scroll to Bottom Button */}
          {showScrollButton && (
            <button
              onClick={handleScrollToBottom}
              className={`fixed bottom-24 left-[43%] -translate-x-1/2 px-6 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 z-40 ${
                isDark 
                  ? "bg-blue-600 hover:bg-blue-700 text-white" 
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
              title="Jump to latest messages"
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span className="font-medium">New Messages</span>
              </div>
            </button>
          )}
        </div>

        {/* Message Input */}
        <div
          className={`border-t p-4 transition-colors duration-300 ${
            isDark ? "bg-gray-800 border-t-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <form onSubmit={handleSendMessage} className="flex gap-2">
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16346272 C3.34915502,0.9 2.40734225,1.00636533 1.77946707,1.4776575 C0.994623095,2.10604706 0.837654326,3.0486314 1.15159189,3.99521575 L3.03521743,10.4362088 C3.03521743,10.5933061 3.34915502,10.7504035 3.50612381,10.7504035 L16.6915026,11.5358905 C16.6915026,11.5358905 17.1624089,11.5358905 17.1624089,12.0071827 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Members Sidebar */}
      <div
        className={`w-64 flex flex-col border-l rounded-lg transition-colors duration-300 ${
          isDark
            ? "bg-gray-800 border-l-gray-700"
            : "bg-white border-l-gray-200"
        }`}
      >
        <div
          className={`p-4 border-b transition-colors duration-300 ${
            isDark ? "bg-gray-800 border-b-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <h3 className={`font-semibold ${isDark ? "text-white" : "text-black"}`}>
            Members
          </h3>
        </div>

        <div
          className={`flex-1 overflow-y-auto transition-colors duration-300 ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
        >
          {members.map((member) => (
            <div
              key={member.uid}
              className={`p-3 border-b flex items-center gap-2 ${
                isDark ? "border-b-gray-700" : "border-b-gray-100"
              }`}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                  {member.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <div
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${
                    userStatuses[member.uid]?.isOnline
                      ? "bg-green-500 border-white"
                      : "bg-gray-400 border-white"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-black"}`}>
                  {member.username}
                </p>
                <p className={`text-xs truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {member.uid === group.createdBy ? "Admin" : "Member"}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          className={`p-4 border-t transition-colors duration-300 ${
            isDark ? "bg-gray-800 border-t-gray-700" : "bg-white border-gray-200"
          }`}
        >
          {group.createdBy === user.uid ? (
            <button
              onClick={() => {
                // Delete group functionality
                console.log("Delete group");
              }}
              className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              Delete Group
            </button>
          ) : (
            <button
              onClick={handleLeaveGroup}
              className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
            >
              Leave Group
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg shadow-2xl p-6 max-w-sm w-full mx-4 ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <h3 className={`text-lg font-semibold text-center mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
              Delete Message?
            </h3>
            <p className={`text-center mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Are you sure you want to delete this message?
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
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
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
