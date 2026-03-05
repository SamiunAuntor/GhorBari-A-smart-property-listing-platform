import { getDatabase } from "../config/db.js";

// Public stats API - no authentication required
export const getPublicStats = async (req, res) => {
    try {
        const db = getDatabase();

        // 1. Active Property Listings (status: "active")
        const activeListings = await db.collection("properties")
            .countDocuments({ status: "active" });

        // 2. Successful Deals (rented + sold)
        const rentedCount = await db.collection("properties")
            .countDocuments({ status: "rented" });
        const soldCount = await db.collection("properties")
            .countDocuments({ status: "sold" });
        const successfulDeals = rentedCount + soldCount;

        // 3. Number of verified users (nidVerified: "verified")
        const verifiedUsers = await db.collection("users")
            .countDocuments({ nidVerified: "verified" });

        // 4. Total Properties (all statuses except removed)
        const totalProperties = await db.collection("properties")
            .countDocuments({ status: { $ne: "removed" } });

        res.send({
            activeListings,
            successfulDeals,
            verifiedUsers,
            totalProperties
        });

    } catch (error) {
        console.error("Error fetching public stats:", error);
        res.status(500).send({ message: "Server error" });
    }
};

