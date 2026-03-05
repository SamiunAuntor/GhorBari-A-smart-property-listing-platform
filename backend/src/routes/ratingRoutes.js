import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { submitRating, getCanRateStatus, getReceivedRatings } from "../controllers/ratingController.js";

const router = express.Router();

router.post("/ratings", verifyToken, submitRating);
router.get("/ratings/can-rate/:applicationId", verifyToken, getCanRateStatus);
router.get("/ratings/received/:email", verifyToken, getReceivedRatings);

export default router;
