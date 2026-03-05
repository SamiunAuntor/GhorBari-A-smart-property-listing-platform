import { ObjectId } from "mongodb";
import crypto from "crypto";

export class ComparisonModel {
    static async create(db, comparisonData) {
        const result = await db.collection("comparisons").insertOne({
            userId: comparisonData.userId,
            userEmail: comparisonData.userEmail,
            title: comparisonData.title || "Property Comparison",
            propertyIds: comparisonData.propertyIds.map(id => new ObjectId(id)),
            isPublic: comparisonData.isPublic || false,
            shareLink: comparisonData.shareLink || this.generateShareLink(),
            expiresAt: comparisonData.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return result.insertedId;
    }

    static async findById(db, comparisonId) {
        if (!ObjectId.isValid(comparisonId)) return null;
        
        const comparison = await db.collection("comparisons").findOne({
            _id: new ObjectId(comparisonId)
        });

        return comparison;
    }

    static async findByShareLink(db, shareLink) {
        const comparison = await db.collection("comparisons").findOne({
            shareLink,
            isPublic: true,
            expiresAt: { $gt: new Date() }
        });

        return comparison;
    }

    static async findByUserId(db, userEmail) {
        return await db.collection("comparisons")
            .find({ userEmail })
            .sort({ createdAt: -1 })
            .toArray();
    }

    static async update(db, comparisonId, updateData) {
        if (!ObjectId.isValid(comparisonId)) return null;

        const updatePayload = {
            ...updateData,
            propertyIds: updateData.propertyIds?.map(id => 
                ObjectId.isValid(id) ? new ObjectId(id) : id
            ),
            updatedAt: new Date()
        };

        return await db.collection("comparisons").updateOne(
            { _id: new ObjectId(comparisonId) },
            { $set: updatePayload }
        );
    }

    static async delete(db, comparisonId) {
        if (!ObjectId.isValid(comparisonId)) return null;

        return await db.collection("comparisons").deleteOne({
            _id: new ObjectId(comparisonId)
        });
    }

    static async deleteByUserId(db, userEmail) {
        return await db.collection("comparisons").deleteMany({
            userEmail
        });
    }

    static async addProperty(db, comparisonId, propertyId) {
        if (!ObjectId.isValid(comparisonId) || !ObjectId.isValid(propertyId)) return null;

        return await db.collection("comparisons").updateOne(
            { _id: new ObjectId(comparisonId) },
            {
                $addToSet: { propertyIds: new ObjectId(propertyId) },
                $set: { updatedAt: new Date() }
            }
        );
    }

    static async removeProperty(db, comparisonId, propertyId) {
        if (!ObjectId.isValid(comparisonId) || !ObjectId.isValid(propertyId)) return null;

        return await db.collection("comparisons").updateOne(
            { _id: new ObjectId(comparisonId) },
            {
                $pull: { propertyIds: new ObjectId(propertyId) },
                $set: { updatedAt: new Date() }
            }
        );
    }

    static async getComparisonWithProperties(db, comparisonId) {
        if (!ObjectId.isValid(comparisonId)) return null;

        const comparison = await db.collection("comparisons").findOne({
            _id: new ObjectId(comparisonId)
        });

        if (!comparison) return null;

        // Fetch all properties in this comparison
        const properties = await db.collection("properties")
            .find({
                _id: { $in: comparison.propertyIds }
            })
            .project({
                _id: 1,
                title: 1,
                price: 1,
                location: 1,
                coordinates: 1,
                beds: 1,
                baths: 1,
                area: 1,
                listingType: 1,
                propertyType: 1,
                images: 1,
                amenities: 1,
                furnished: 1,
                parking: 1,
                wifi: 1,
                kitchen: 1,
                balcony: 1,
                garden: 1,
                petFriendly: 1,
                ownerEmail: 1,
                description: 1,
                createdAt: 1
            })
            .toArray();

        return {
            ...comparison,
            properties
        };
    }

    static async getComparisonWithPropertiesAndOwners(db, comparisonId) {
        const comparison = await this.getComparisonWithProperties(db, comparisonId);

        if (!comparison) return null;

        // Fetch owner details for each property
        const enrichedProperties = await Promise.all(
            comparison.properties.map(async (property) => {
                const owner = await db.collection("users").findOne(
                    { email: property.ownerEmail },
                    {
                        projection: {
                            name: 1,
                            profileImage: 1,
                            nidVerified: 1,
                            rating: 1
                        }
                    }
                );

                return {
                    ...property,
                    owner: owner || {
                        name: "Unknown",
                        profileImage: null,
                        nidVerified: "unverified",
                        rating: { average: 0 }
                    }
                };
            })
        );

        return {
            ...comparison,
            properties: enrichedProperties
        };
    }

    static generateShareLink() {
        return crypto.randomBytes(16).toString('hex');
    }

    static async cleanExpiredComparisons(db) {
        return await db.collection("comparisons").deleteMany({
            expiresAt: { $lt: new Date() }
        });
    }
}
