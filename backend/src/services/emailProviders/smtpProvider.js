import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
    if (transporter) {
        return transporter;
    }

    const {
        SMTP_HOST,
        SMTP_PORT,
        SMTP_USER,
        SMTP_PASS
    } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
        throw new Error("SMTP configuration is incomplete");
    }

    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        }
    });

    return transporter;
}

export async function sendEmailWithSmtp({ to, subject, html }) {
    const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

    if (!from) {
        throw new Error("EMAIL_FROM or SMTP_USER must be configured");
    }

    return getTransporter().sendMail({
        from,
        to,
        subject,
        html
    });
}
