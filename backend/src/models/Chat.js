import { ObjectId } from "mongodb";

export function buildParticipantPairKey(email1, email2) {
    return [email1, email2]
        .map((email) => email?.trim().toLowerCase())
        .sort((a, b) => a.localeCompare(b))
        .join("::");
}

export class ConversationModel {
    static async create(db, conversationData) {
        const participantPairKey = buildParticipantPairKey(
            conversationData.participant1Email,
            conversationData.participant2Email
        );

        const result = await db.collection("conversations").insertOne({
            participant1Email: conversationData.participant1Email,
            participant2Email: conversationData.participant2Email,
            participantPairKey,
            propertyId: conversationData.propertyId || null,
            lastMessage: null,
            lastMessageTime: null,
            lastMessageSender: null,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return result.insertedId;
    }

    static async findById(db, conversationId) {
        if (!ObjectId.isValid(conversationId)) return null;
        return await db.collection("conversations").findOne({
            _id: new ObjectId(conversationId)
        });
    }

    static async findByParticipants(db, email1, email2) {
        const participantPairKey = buildParticipantPairKey(email1, email2);

        return await db.collection("conversations").findOne({
            participantPairKey
        });
    }

    static async findByParticipantsAndProperty(db, email1, email2, propertyId) {
        return this.findByParticipants(db, email1, email2);
    }

    static async findByUserEmail(db, userEmail) {
        return await db.collection("conversations")
            .find({
                $or: [
                    { participant1Email: userEmail },
                    { participant2Email: userEmail }
                ]
            })
            .sort({ lastMessageTime: -1 })
            .toArray();
    }

    static async updateLastMessage(db, conversationId, messageContent, senderEmail) {
        if (!ObjectId.isValid(conversationId)) return null;
        return await db.collection("conversations").updateOne(
            { _id: new ObjectId(conversationId) },
            {
                $set: {
                    lastMessage: messageContent,
                    lastMessageTime: new Date(),
                    lastMessageSender: senderEmail,
                    updatedAt: new Date()
                }
            }
        );
    }

    static async delete(db, conversationId) {
        if (!ObjectId.isValid(conversationId)) return null;
        return await db.collection("conversations").deleteOne({
            _id: new ObjectId(conversationId)
        });
    }

    static async findOrCreate(db, email1, email2, propertyId = null) {
        const participantPairKey = buildParticipantPairKey(email1, email2);
        const normalizedPropertyId = propertyId
            ? (typeof propertyId === "string" ? new ObjectId(propertyId) : propertyId)
            : null;

        try {
            await db.collection("conversations").updateOne(
                { participantPairKey },
                {
                    $setOnInsert: {
                        participant1Email: email1,
                        participant2Email: email2,
                        participantPairKey,
                        propertyId: normalizedPropertyId,
                        lastMessage: null,
                        lastMessageTime: null,
                        lastMessageSender: null,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                },
                { upsert: true }
            );
        } catch (error) {
            if (error?.code !== 11000) {
                throw error;
            }
        }

        return this.findByParticipants(db, email1, email2);
    }
}

export class MessageModel {
    static async create(db, messageData) {
        const convId = messageData.conversationId;
        const conversationIdStored = typeof convId === 'string' ? new ObjectId(convId) : convId;
        const result = await db.collection("messages").insertOne({
            conversationId: conversationIdStored,
            senderEmail: messageData.senderEmail,
            senderName: messageData.senderName,
            senderImage: messageData.senderImage || null,
            content: messageData.content,
            attachments: messageData.attachments || [],
            isRead: false,
            readAt: null,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return result.insertedId;
    }

    static async findByConversationId(db, conversationId, limit = 50, skip = 0) {
        if (!ObjectId.isValid(conversationId)) return [];
        const oid = new ObjectId(conversationId);
        return await db.collection("messages")
            .find({ $or: [{ conversationId: oid }, { conversationId: conversationId }] })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray()
            .then(messages => messages.reverse());
    }

    static async markAsRead(db, conversationId, readerEmail) {
        if (!ObjectId.isValid(conversationId)) return null;
        const oid = new ObjectId(conversationId);
        return await db.collection("messages").updateMany(
            {
                $or: [{ conversationId: oid }, { conversationId: conversationId }],
                senderEmail: { $ne: readerEmail },
                isRead: false
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date(),
                    updatedAt: new Date()
                }
            }
        );
    }

    static async getUnreadCount(db, userEmail) {
        const userConversations = await db.collection("conversations")
            .find({
                $or: [
                    { participant1Email: userEmail },
                    { participant2Email: userEmail }
                ]
            })
            .toArray();

        const conversationIds = userConversations.map(c => new ObjectId(c._id));

        const unreadCount = await db.collection("messages").countDocuments({
            conversationId: { $in: conversationIds },
            senderEmail: { $ne: userEmail },
            isRead: false
        });

        return unreadCount;
    }

    static async deleteMessage(db, messageId) {
        if (!ObjectId.isValid(messageId)) return null;
        return await db.collection("messages").deleteOne({
            _id: new ObjectId(messageId)
        });
    }

    static async updateMessage(db, messageId, content) {
        if (!ObjectId.isValid(messageId)) return null;
        return await db.collection("messages").updateOne(
            { _id: new ObjectId(messageId) },
            {
                $set: {
                    content,
                    updatedAt: new Date()
                }
            }
        );
    }
}
