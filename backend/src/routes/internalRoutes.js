import express from "express";
import { processPendingEmailJobs } from "../services/emailProcessorService.js";

const router = express.Router();

router.post("/internal/process-email-jobs", async (req, res) => {
    const expectedSecret = process.env.INTERNAL_CRON_SECRET;
    const providedSecret = req.headers["x-internal-cron-secret"];

    if (!expectedSecret || providedSecret !== expectedSecret) {
        return res.status(403).send({ message: "Forbidden" });
    }

    try {
        const result = await processPendingEmailJobs();
        return res.send({
            success: true,
            ...result
        });
    } catch (error) {
        return res.status(500).send({
            message: "Email job processing failed"
        });
    }
});

export default router;
