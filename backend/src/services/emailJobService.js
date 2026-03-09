import { getDatabase } from "../config/db.js";
import { EmailJobModel } from "../models/EmailJob.js";

export async function enqueueEmailJob({ type, to, payload, dedupeKey, maxAttempts = 5 }) {
    if (!to) {
        return { queued: false, reason: "missing_recipient" };
    }

    const db = getDatabase();
    const now = new Date();

    try {
        await EmailJobModel.create(db, {
            type,
            to,
            payload,
            status: "pending",
            attempts: 0,
            maxAttempts,
            nextRunAt: now,
            dedupeKey,
            createdAt: now,
            updatedAt: now,
            sentAt: null,
            lastError: null,
            notification: {
                read: false,
                readAt: null
            }
        });

        return { queued: true };
    } catch (error) {
        if (error?.code === 11000) {
            return { queued: false, reason: "duplicate" };
        }

        throw error;
    }
}
