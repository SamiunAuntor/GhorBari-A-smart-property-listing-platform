import { ObjectId } from "mongodb";
import { ConversationModel, MessageModel } from "../models/Chat.js";
import { getIO, getConnectedUsers } from "../config/socket.js";

/** Ensure conversation is only created when there's a deal-in-progress application for this property between the two users */
async function ensureDealInProgressForChat(db, userEmail, otherUserEmail, propertyId) {
    if (!propertyId) return true;
    const propId = typeof propertyId === "string" ? new ObjectId(propertyId) : propertyId;
    const application = await db.collection("applications").findOne({
        propertyId: propId,
        status: "deal-in-progress",
        $or: [
            { "seeker.email": userEmail, "owner.email": otherUserEmail },
            { "seeker.email": otherUserEmail, "owner.email": userEmail }
        ]
    });
    return !!application;
}

export const createOrGetConversation = async (req, res) => {
    try {
        const db = req.db;
        const { otherUserEmail, propertyId } = req.body;
        const userEmail = req.user.email;

        if (!otherUserEmail) {
            return res.status(400).json({ message: "Other user email is required" });
        }

        if (userEmail === otherUserEmail) {
            return res.status(400).json({ message: "Cannot start conversation with yourself" });
        }

        // Chat is only allowed after offer or counter offer is accepted (deal-in-progress)
        if (!propertyId) {
            return res.status(400).json({
                message: "Chat is only available after a deal is accepted. Accept an offer or counter offer in property bidding to start chatting."
            });
        }
        const allowed = await ensureDealInProgressForChat(db, userEmail, otherUserEmail, propertyId);
        if (!allowed) {
            return res.status(403).json({
                message: "Chat is only available after a deal is accepted (deal-in-progress) for this property."
            });
        }

        // Check if other user exists
        const otherUser = await db.collection("users").findOne({ email: otherUserEmail });
        if (!otherUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const conversation = await ConversationModel.findOrCreate(db, userEmail, otherUserEmail, propertyId);

        return res.status(200).json({
            message: "Conversation created or retrieved",
            conversation
        });

    } catch (error) {
        console.error("POST /create-conversation error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/** Create or get conversation from an application (only when status is deal-in-progress) */
export const createConversationFromApplication = async (req, res) => {
    try {
        const db = req.db;
        const { applicationId } = req.body;
        const userEmail = req.user.email;

        if (!applicationId) {
            return res.status(400).json({ message: "Application ID is required" });
        }

        const appId = typeof applicationId === "string" ? new ObjectId(applicationId) : applicationId;
        const application = await db.collection("applications").findOne({ _id: appId });
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        if (application.status !== "deal-in-progress" && application.status !== "accepted") {
            return res.status(403).json({
                message: "Chat is only available for accepted deals (deal-in-progress)."
            });
        }

        const ownerEmail = application.owner?.email;
        const seekerEmail = application.seeker?.email;
        if (!ownerEmail || !seekerEmail) {
            return res.status(400).json({ message: "Invalid application: missing owner or seeker" });
        }

        if (userEmail !== ownerEmail && userEmail !== seekerEmail) {
            return res.status(403).json({ message: "You are not part of this application" });
        }

        const otherUserEmail = userEmail === ownerEmail ? seekerEmail : ownerEmail;
        const propertyId = application.propertyId?.toString?.() || application.propertyId;

        const conversation = await ConversationModel.findOrCreate(db, userEmail, otherUserEmail, propertyId);

        const otherUser = await db.collection("users").findOne(
            { email: otherUserEmail },
            { projection: { name: 1, profileImage: 1, nidVerified: 1 } }
        );

        const enriched = {
            ...conversation,
            _id: conversation._id.toString(),
            otherUserEmail,
            otherUserName: otherUser?.name || "Unknown",
            otherUserImage: otherUser?.profileImage || null,
            otherUserVerified: otherUser?.nidVerified === "verified"
        };

        return res.status(200).json({
            message: "Conversation created or retrieved",
            conversation: enriched
        });

    } catch (error) {
        console.error("POST /create-conversation-from-application error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getConversations = async (req, res) => {
    try {
        const db = req.db;
        const userEmail = req.user.email;

        const conversations = await ConversationModel.findByUserEmail(db, userEmail);

        // Enrich conversations with user data
        const enrichedConversations = await Promise.all(
            conversations.map(async (conv) => {
                const otherUserEmail = conv.participant1Email === userEmail 
                    ? conv.participant2Email 
                    : conv.participant1Email;

                const otherUser = await db.collection("users").findOne(
                    { email: otherUserEmail },
                    { projection: { name: 1, profileImage: 1, nidVerified: 1 } }
                );

                return {
                    ...conv,
                    otherUserEmail,
                    otherUserName: otherUser?.name || "Unknown",
                    otherUserImage: otherUser?.profileImage || null,
                    otherUserVerified: otherUser?.nidVerified === "verified"
                };
            })
        );

        return res.status(200).json({
            message: "Conversations retrieved",
            conversations: enrichedConversations
        });

    } catch (error) {
        console.error("GET /conversations error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getConversationMessages = async (req, res) => {
    try {
        const db = req.db;
        const { conversationId } = req.params;
        const { skip = 0, limit = 50 } = req.query;
        const userEmail = req.user.email;

        // Verify user is part of this conversation
        const conversation = await ConversationModel.findById(db, conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        if (conversation.participant1Email !== userEmail && conversation.participant2Email !== userEmail) {
            return res.status(403).json({ message: "Unauthorized access to conversation" });
        }

        // Mark messages as read
        await MessageModel.markAsRead(db, conversationId, userEmail);

        const messages = await MessageModel.findByConversationId(
            db,
            conversationId,
            parseInt(limit),
            parseInt(skip)
        );

        return res.status(200).json({
            message: "Messages retrieved",
            messages,
            total: messages.length
        });

    } catch (error) {
        console.error("GET /conversations/:conversationId/messages error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const db = req.db;
        const { conversationId, content, attachments = [] } = req.body;
        const userEmail = req.user.email;
        const user = await db.collection("users").findOne({ email: userEmail });

        const hasText = content && typeof content === "string" && content.trim() !== "";
        const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

        if (!hasText && !hasAttachments) {
            return res.status(400).json({ message: "Message content or attachment is required" });
        }

        // Verify user is part of this conversation
        const conversation = await ConversationModel.findById(db, conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        if (conversation.participant1Email !== userEmail && conversation.participant2Email !== userEmail) {
            return res.status(403).json({ message: "Unauthorized access to conversation" });
        }

        const otherUserEmail = conversation.participant1Email === userEmail 
            ? conversation.participant2Email 
            : conversation.participant1Email;

        // Create message
        const messageId = await MessageModel.create(db, {
            conversationId,
            senderEmail: userEmail,
            senderName: user?.name || "Unknown",
            senderImage: user?.profileImage || null,
            content: hasText ? content.trim() : "",
            attachments: hasAttachments ? attachments : []
        });

        // Update conversation's last message (prefer text; if only attachment, show a short label)
        const lastMessagePreview = hasText
            ? content
            : "[Attachment]";
        await ConversationModel.updateLastMessage(db, conversationId, lastMessagePreview, userEmail);

        const message = await db.collection("messages").findOne({ _id: messageId });

        // Emit via Socket.io to the other user
        const io = getIO();
        const connectedUsers = getConnectedUsers();
        const recipientSocketId = connectedUsers.get(otherUserEmail);

        if (recipientSocketId) {
            io.to(recipientSocketId).emit("message:received", {
                conversationId,
                message
            });
        }

        return res.status(201).json({
            message: "Message sent",
            data: message
        });

    } catch (error) {
        console.error("POST /send-message error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const db = req.db;
        const userEmail = req.user.email;

        const unreadCount = await MessageModel.getUnreadCount(db, userEmail);

        return res.status(200).json({
            message: "Unread count retrieved",
            unreadCount
        });

    } catch (error) {
        console.error("GET /unread-count error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const db = req.db;
        const { messageId } = req.params;
        const userEmail = req.user.email;

        // Verify message ownership
        const message = await db.collection("messages").findOne({ _id: messageId });
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        if (message.senderEmail !== userEmail) {
            return res.status(403).json({ message: "You can only delete your own messages" });
        }

        await MessageModel.deleteMessage(db, messageId);

        return res.status(200).json({ message: "Message deleted" });

    } catch (error) {
        console.error("DELETE /message/:messageId error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteConversation = async (req, res) => {
    try {
        const db = req.db;
        const { conversationId } = req.params;
        const userEmail = req.user.email;

        const conversation = await ConversationModel.findById(db, conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        if (conversation.participant1Email !== userEmail && conversation.participant2Email !== userEmail) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Delete all messages in the conversation
        const conversationObjectId = new ObjectId(conversationId);
        await db.collection("messages").deleteMany({
            $or: [
                { conversationId: conversationObjectId },
                { conversationId }
            ]
        });

        // Delete conversation
        await ConversationModel.delete(db, conversationId);

        return res.status(200).json({ message: "Conversation deleted" });

    } catch (error) {
        console.error("DELETE /conversation/:conversationId error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
