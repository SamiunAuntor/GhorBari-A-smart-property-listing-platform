import cron from "node-cron";
import { processPendingEmailJobs } from "../services/emailProcessorService.js";

let emailJobCronStarted = false;

export function startEmailJobCron() {
    if (emailJobCronStarted) {
        return;
    }

    // Comment out this bootstrap before Vercel deployment and switch to a scheduled endpoint.
    cron.schedule("* * * * *", async () => {
        try {
            await processPendingEmailJobs();
        } catch (error) {
            console.error("Email job cron failed:", error?.message || error);
        }
    });

    emailJobCronStarted = true;
    console.log("Email job cron started");
}
