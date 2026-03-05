import { ObjectId } from "mongodb";

export class RatingModel {
    static async ensureIndexes(db) {
        try {
            await db.collection("ratings").createIndex(
                { applicationId: 1, raterEmail: 1 },
                { unique: true }
            );
            await db.collection("ratings").createIndex(
                { rateeEmail: 1, createdAt: -1 }
            );
        } catch (err) {
            console.error("Failed to create rating indexes", err);
        }
    }

    static async upsert(db, { applicationId, propertyId, raterEmail, rateeEmail, score, review, roleContext }) {
        const now = new Date();
        const appObjectId = typeof applicationId === "string" ? new ObjectId(applicationId) : applicationId;
        const propertyObjectId = typeof propertyId === "string" ? new ObjectId(propertyId) : propertyId;

        await db.collection("ratings").updateOne(
            { applicationId: appObjectId, raterEmail },
            {
                $set: {
                    propertyId: propertyObjectId,
                    rateeEmail,
                    score: Number(score),
                    review: review || "",
                    roleContext,
                    updatedAt: now
                },
                $setOnInsert: {
                    createdAt: now
                }
            },
            { upsert: true }
        );

        return db.collection("ratings").findOne({ applicationId: appObjectId, raterEmail });
    }

    static async findByApplicationAndRater(db, applicationId, raterEmail) {
        const appObjectId = typeof applicationId === "string" ? new ObjectId(applicationId) : applicationId;
        return db.collection("ratings").findOne({ applicationId: appObjectId, raterEmail });
    }

    static async findReceived(db, rateeEmail, skip = 0, limit = 10) {
        return db.collection("ratings")
            .find({ rateeEmail })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
    }

    static async countReceived(db, rateeEmail) {
        return db.collection("ratings").countDocuments({ rateeEmail });
    }

    static async getAggregateForRatee(db, rateeEmail) {
        const [result] = await db.collection("ratings").aggregate([
            { $match: { rateeEmail } },
            {
                $group: {
                    _id: "$rateeEmail",
                    totalRatings: { $sum: "$score" },
                    ratingCount: { $sum: 1 },
                    average: { $avg: "$score" }
                }
            }
        ]).toArray();

        if (!result) {
            return { totalRatings: 0, ratingCount: 0, average: 0 };
        }

        return {
            totalRatings: Number(result.totalRatings || 0),
            ratingCount: Number(result.ratingCount || 0),
            average: Number((result.average || 0).toFixed(2))
        };
    }
}
