import { useState, useCallback } from "react";

import useAuth from "./useAuth";
import useAxiosSecure from "./useAxiosSecure";
import { getSocket } from "../Utilities/socketClient";

export const useChat = () => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useAuth();
  const axiosSecure = useAxiosSecure();

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosSecure.get("/conversations");
      setConversations(response.data.conversations);
      setError(null);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError(err.response?.data?.message || "Failed to fetch conversations");
    } finally {
      setLoading(false);
    }
  }, [axiosSecure]);

  // Create or get conversation
  const createConversation = useCallback(
    async (otherUserEmail, propertyId = null) => {
      try {
        setLoading(true);
        const response = await axiosSecure.post("/create-conversation", {
          otherUserEmail,
          propertyId,
        });
        return response.data.conversation;
      } catch (err) {
        console.error("Error creating conversation:", err);
        setError(err.response?.data?.message || "Failed to create conversation");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [axiosSecure]
  );

  // Create or get conversation from an accepted application (deal-in-progress)
  const createConversationFromApplication = useCallback(
    async (applicationId) => {
      try {
        setLoading(true);
        const response = await axiosSecure.post("/create-conversation-from-application", {
          applicationId,
        });
        const conversation = response.data.conversation;
        setConversations((prev) => {
          const exists = prev.some((c) => c._id === conversation._id);
          if (exists) return prev;
          return [conversation, ...prev];
        });
        return conversation;
      } catch (err) {
        console.error("Error creating conversation from application:", err);
        setError(err.response?.data?.message || "Failed to open chat");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [axiosSecure]
  );

  // Fetch messages
  const fetchMessages = useCallback(
    async (conversationId, skip = 0, limit = 50) => {
      try {
        setLoading(true);
        const response = await axiosSecure.get(
          `/conversations/${conversationId}/messages?skip=${skip}&limit=${limit}`
        );
        setMessages(response.data.messages);
        setError(null);
        return response.data.messages;
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError(err.response?.data?.message || "Failed to fetch messages");
      } finally {
        setLoading(false);
      }
    },
    [axiosSecure]
  );

  // Send message via HTTP
  const sendMessage = useCallback(
    async (conversationId, content, attachments = []) => {
      try {
        const hasText = content && content.trim();
        const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

        if (!hasText && !hasAttachments) {
          setError("Message cannot be empty");
          return null;
        }

        const response = await axiosSecure.post("/send-message", {
          conversationId,
          content: hasText ? content.trim() : "",
          attachments,
        });

        const newMessage = response.data.data;
        setMessages((prev) => [...prev, newMessage]);
        return newMessage;
      } catch (err) {
        console.error("Error sending message:", err);
        setError(err.response?.data?.message || "Failed to send message");
        throw err;
      }
    },
    [axiosSecure]
  );

  // Send message via Socket.io
  const sendMessageViaSocket = useCallback((conversationId, content) => {
    try {
      const socket = getSocket();
      if (!socket?.connected) {
        throw new Error("Socket not connected");
      }

      socket.emit("message:send", {
        conversationId,
        content: content.trim(),
      });
    } catch (err) {
      console.error("Error sending message via socket:", err);
      setError(err.message || "Failed to send message");
      throw err;
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await axiosSecure.get("/unread-count");
      setUnreadCount(response.data.unreadCount);
      return response.data.unreadCount;
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }, [axiosSecure]);

  // Delete message
  const deleteMessage = useCallback(
    async (messageId) => {
      try {
        await axiosSecure.delete(`/message/${messageId}`);
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
        setError(null);
      } catch (err) {
        console.error("Error deleting message:", err);
        setError(err.response?.data?.message || "Failed to delete message");
        throw err;
      }
    },
    [axiosSecure]
  );

  // Delete conversation
  const deleteConversation = useCallback(
    async (conversationId) => {
      try {
        await axiosSecure.delete(`/conversation/${conversationId}`);
        setConversations((prev) =>
          prev.filter((conv) => conv._id !== conversationId)
        );
        setMessages([]);
        setError(null);
      } catch (err) {
        console.error("Error deleting conversation:", err);
        setError(
          err.response?.data?.message || "Failed to delete conversation"
        );
        throw err;
      }
    },
    [axiosSecure]
  );

  // Mark messages as read
  const markMessagesAsRead = useCallback((conversationId) => {
    try {
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit("message:markRead", conversationId);
      }
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  }, []);

  // Listen to socket events
  const listenToMessages = useCallback((conversationId, callback) => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit("chat:join", conversationId);

    socket.on("message:received", (data) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) => [...prev, data.message]);
        callback?.(data.message);
      }
    });

    return () => {
      socket.emit("chat:leave", conversationId);
      socket.off("message:received");
    };
  }, []);

  return {
    conversations,
    messages,
    unreadCount,
    loading,
    error,
    fetchConversations,
    createConversation,
    createConversationFromApplication,
    fetchMessages,
    sendMessage,
    sendMessageViaSocket,
    fetchUnreadCount,
    deleteMessage,
    deleteConversation,
    markMessagesAsRead,
    listenToMessages,
  };
};
