"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, update, onValue } from "firebase/database";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  // unreadMessages: { "chatId": count }
  const [unreadMessages, setUnreadMessages] = useState({});
  // unreadGroups: { "groupId": count }
  const [unreadGroups, setUnreadGroups] = useState({});
  const [readChats, setReadChats] = useState({});
  const [readGroups, setReadGroups] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addUnreadMessage = useCallback((chatId) => {
    // Jangan add jika sudah ada di unreadMessages
    setUnreadMessages((prev) => {
      // Cek di unreadMessages, bukan readChats (untuk timing issue)
      if (prev[chatId]) return prev;
      
      return {
        ...prev,
        [chatId]: 1,
      };
    });
  }, []);

  const clearUnreadMessages = useCallback((chatId) => {
    setUnreadMessages((prev) => {
      const newState = { ...prev };
      delete newState[chatId];
      return newState;
    });

    // Save to database (only on client)
    if (mounted && auth?.currentUser && db) {
      const userRef = ref(db, `users/${auth.currentUser.uid}/readChats/${chatId}`);
      update(userRef, {
        readAt: Date.now(),
      }).catch(console.error);
    }
  }, [mounted]);

  const addUnreadGroup = useCallback((groupId) => {
    // Jangan add jika sudah ada di unreadGroups
    setUnreadGroups((prev) => {
      // Cek di unreadGroups, bukan readGroups (untuk timing issue)
      if (prev[groupId]) return prev;
      
      return {
        ...prev,
        [groupId]: 1,
      };
    });
  }, []);

  const clearUnreadGroup = useCallback((groupId) => {
    // Delete from local unreadGroups immediately
    setUnreadGroups((prev) => {
      const newState = { ...prev };
      delete newState[groupId];
      return newState;
    });

    // Save to database (only on client)
    if (mounted && auth?.currentUser && db) {
      const userRef = ref(db, `users/${auth.currentUser.uid}/readGroups/${groupId}`);
      update(userRef, {
        readAt: Date.now(),
      }).catch(console.error);
    }
  }, [mounted]);

  // Get total unread count
  const getTotalUnread = useCallback(() => {
    const messageCount = Object.values(unreadMessages).reduce((a, b) => a + b, 0);
    const groupCount = Object.values(unreadGroups).reduce((a, b) => a + b, 0);
    return messageCount + groupCount;
  }, [unreadMessages, unreadGroups]);

  // Load read status dari database saat app start
  useEffect(() => {
    if (!mounted || !auth?.currentUser || !db) return;

    // Load read chats
    const readChatsRef = ref(db, `users/${auth.currentUser.uid}/readChats`);
    const unsubscribeChats = onValue(readChatsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setReadChats(data);
      } else {
        setReadChats({});
      }
    }, (error) => {
      console.error("Error loading read chats:", error);
    });

    // Load read groups
    const readGroupsRef = ref(db, `users/${auth.currentUser.uid}/readGroups`);
    const unsubscribeGroups = onValue(readGroupsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setReadGroups(data);
      } else {
        setReadGroups({});
      }
    }, (error) => {
      console.error("Error loading read groups:", error);
    });

    return () => {
      unsubscribeChats();
      unsubscribeGroups();
    };
  }, [mounted, auth?.currentUser, db]);

  const value = {
    unreadMessages,
    unreadGroups,
    readChats,
    readGroups,
    addUnreadMessage,
    clearUnreadMessages,
    addUnreadGroup,
    clearUnreadGroup,
    getTotalUnread,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
}
