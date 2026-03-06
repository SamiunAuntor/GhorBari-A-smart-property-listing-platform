import { getDatabase } from "../config/db.js";
import { EmailJobModel } from "../models/EmailJob.js";
import { sendEmail } from "./emailService.js";
import { renderEmailTemplate } from "./emailTemplateService.js";

const DEFAULT_BATCH_SIZE = Number(process.env.EMAIL_JOB_BATCH_SIZE || 10);
const RETRY_DELAYS_MINUTES = [1, 5, 15, 60, 360];

function getNextRunAt(attempts) {
    const retryIndex = Math.max(0, attempts - 1);
    const delayMinutes = RETRY_DELAYS_MINUTES[Math.min(retryIndex, RETRY_DELAYS_MINUTES.length - 1)];

    return new Date(Date.now() + delayMinutes * 60 * 1000);
}

export async function processPendingEmailJobs({ limit = DEFAULT_BATCH_SIZE } = {}) {
    const db = getDatabase();

    await EmailJobModel.requeueStaleProcessingJobs(
        db,
        new Date(Date.now() - 10 * 60 * 1000)
    );

    const jobs = await EmailJobModel.claimDueJobs(db, limit);

    for (const job of jobs) {
        try {
            const { subject, html } = renderEmailTemplate(job.type, job.payload);

            await sendEmail({
                to: job.to,
                subject,
                html
            });

            await EmailJobModel.markSent(db, job._id);
        } catch (error) {
            const nextAttempts = (job.attempts || 0) + 1;
            const nextRunAt = getNextRunAt(nextAttempts);

            await EmailJobModel.markForRetry(
                db,
                job._id,
                nextAttempts,
                job.maxAttempts || 5,
                nextRunAt,
                error?.message || "Email send failed"
            );

            console.error(`Email job ${job._id} failed:`, error?.message || error);
        }
    }

    return {
        processed: jobs.length
    };
}
