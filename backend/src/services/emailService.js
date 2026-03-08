import { sendEmailWithEmailJs } from "./emailProviders/emailjsProvider.js";
import { sendEmailWithSmtp } from "./emailProviders/smtpProvider.js";

const PROVIDERS = {
    emailjs: sendEmailWithEmailJs,
    smtp: sendEmailWithSmtp
};

function getConfiguredProviderName() {
    return process.env.EMAIL_PROVIDER?.trim().toLowerCase() || "smtp";
}

function getProvider(providerName) {
    const provider = PROVIDERS[providerName];

    if (!provider) {
        throw new Error(`Unsupported email provider: ${providerName}`);
    }

    return provider;
}

/**
 * Send email with the configured provider.
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.html - HTML email body
 */
export async function sendEmail({ to, subject, html }) {
    const providerName = getConfiguredProviderName();
    return getProvider(providerName)({ to, subject, html });
}
