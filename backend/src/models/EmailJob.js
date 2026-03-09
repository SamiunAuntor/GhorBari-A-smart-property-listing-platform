export class EmailJobModel {
    static async ensureIndexes(db) {
        await db.collection("email_jobs").createIndex({ status: 1, nextRunAt: 1 });
        await db.collection("email_jobs").createIndex({ dedupeKey: 1 }, { unique: true });
        await db.collection("email_jobs").createIndex({ to: 1, status: 1, "notification.read": 1, sentAt: -1, createdAt: -1 });
        await db.collection("email_jobs").updateMany(
            { notification: { $exists: false } },
            {
                $set: {
                    notification: {
                        read: false,
                        readAt: null
                    }
                }
            }
        );
    }

    static async create(db, job) {
        return db.collection("email_jobs").insertOne(job);
    }

    static async requeueStaleProcessingJobs(db, staleBefore) {
        return db.collection("email_jobs").updateMany(
            {
                status: "processing",
                updatedAt: { $lt: staleBefore }
            },
            {
                $set: {
                    status: "pending",
                    nextRunAt: new Date(),
                    updatedAt: new Date(),
                    lastError: "Recovered stale processing job"
                }
            }
        );
    }

    static async claimDueJobs(db, limit = 10) {
        const candidates = await db.collection("email_jobs")
            .find({
                status: "pending",
                nextRunAt: { $lte: new Date() }
            })
            .sort({ nextRunAt: 1, createdAt: 1 })
            .limit(limit)
            .toArray();

        const claimedJobs = [];

        for (const candidate of candidates) {
            const result = await db.collection("email_jobs").updateOne(
                {
                    _id: candidate._id,
                    status: "pending"
                },
                {
                    $set: {
                        status: "processing",
                        updatedAt: new Date()
                    }
                }
            );

            if (result.modifiedCount === 1) {
                const claimedJob = await db.collection("email_jobs").findOne({ _id: candidate._id });
                if (claimedJob) {
                    claimedJobs.push(claimedJob);
                }
            }
        }

        return claimedJobs;
    }

    static async markSent(db, id) {
        return db.collection("email_jobs").updateOne(
            { _id: id },
            {
                $set: {
                    status: "sent",
                    sentAt: new Date(),
                    updatedAt: new Date(),
                    lastError: null
                }
            }
        );
    }

    static async markForRetry(db, id, attempts, maxAttempts, nextRunAt, errorMessage) {
        const nextStatus = attempts >= maxAttempts ? "failed" : "pending";

        return db.collection("email_jobs").updateOne(
            { _id: id },
            {
                $set: {
                    status: nextStatus,
                    attempts,
                    nextRunAt,
                    updatedAt: new Date(),
                    lastError: errorMessage
                }
            }
        );
    }
}
