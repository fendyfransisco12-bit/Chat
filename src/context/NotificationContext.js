"use client";

import { createContext, useContext, useState, useCallback } from "react";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  // unreadMessages: { "chatId": count }
  const [unreadMessages, setUnreadMessages] = useState({});
  // unreadGroups: { "groupId": count }
  const [unreadGroups, setUnreadGroups] = useState({});

  const addUnreadMessage = useCallback((chatId) => {
    setUnreadMessages((prev) => ({
      ...prev,
      [chatId]: (prev[chatId] || 0) + 1,
    }));
  }, []);

  const clearUnreadMessages = useCallback((chatId) => {
    setUnreadMessages((prev) => {
      const newState = { ...prev };
      delete newState[chatId];
      return newState;
    });
  }, []);

  const addUnreadGroup = useCallback((groupId) => {
    setUnreadGroups((prev) => ({
      ...prev,
      [groupId]: (prev[groupId] || 0) + 1,
    }));
  }, []);

  const clearUnreadGroup = useCallback((groupId) => {
    setUnreadGroups((prev) => {
      const newState = { ...prev };
      delete newState[groupId];
      return newState;
    });
  }, []);

  // Get total unread count
  const getTotalUnread = useCallback(() => {
    const messageCount = Object.values(unreadMessages).reduce((a, b) => a + b, 0);
    const groupCount = Object.values(unreadGroups).reduce((a, b) => a + b, 0);
    return messageCount + groupCount;
  }, [unreadMessages, unreadGroups]);

  const value = {
    unreadMessages,
    unreadGroups,
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
