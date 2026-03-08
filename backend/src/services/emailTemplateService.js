const APP_BASE_URL = process.env.CLIENT_APP_URL || process.env.CLIENT_URL || "http://localhost:5173";
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER?.trim().toLowerCase() || "smtp";

function formatCurrency(value) {
    if (typeof value !== "number" || Number.isNaN(value)) {
        return "N/A";
    }

    return `Tk ${value.toLocaleString("en-BD")}`;
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function renderEmailShell({ eyebrow, title, intro, details = [], ctaLabel, ctaUrl }) {
    const detailsHtml = details
        .filter((detail) => detail.value)
        .map((detail) => `
            <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;">${escapeHtml(detail.label)}</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${escapeHtml(detail.value)}</td>
            </tr>
        `)
        .join("");

    return `
        <div style="margin: 0; padding: 32px 16px; background: #f3f4f6; font-family: Arial, sans-serif;">
            <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
                <div style="padding: 28px 28px 12px; background: linear-gradient(135deg, #1f2937, #ea580c); color: #ffffff;">
                    <p style="margin: 0 0 10px; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;">${escapeHtml(eyebrow)}</p>
                    <h1 style="margin: 0; font-size: 26px; line-height: 1.25;">${escapeHtml(title)}</h1>
                </div>
                <div style="padding: 28px;">
                    <p style="margin: 0 0 24px; color: #374151; font-size: 15px; line-height: 1.7;">${escapeHtml(intro)}</p>
                    ${detailsHtml ? `<table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">${detailsHtml}</table>` : ""}
                    <a href="${ctaUrl}" style="display: inline-block; padding: 12px 20px; border-radius: 10px; background: #ea580c; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px;">${escapeHtml(ctaLabel)}</a>
                </div>
            </div>
        </div>
    `;
}

function renderEmailJsBody({ eyebrow, title, intro, details = [], ctaLabel, ctaUrl }) {
    const detailLines = details
        .filter((detail) => detail.value)
        .map((detail) => `${detail.label}: ${detail.value}`)
        .join("\n");

    const sections = [
        eyebrow,
        title,
        intro,
        detailLines,
        `${ctaLabel}: ${ctaUrl}`,
        "GhorBari"
    ].filter(Boolean);

    return sections.join("\n\n");
}

function renderEmailBody(templateData) {
    if (EMAIL_PROVIDER === "emailjs") {
        return renderEmailJsBody(templateData);
    }

    return renderEmailShell(templateData);
}

const templateFactories = {
    application_submitted: (payload) => ({
        subject: `New application received for ${payload.propertyTitle}`,
        html: renderEmailBody({
            eyebrow: "New Application",
            title: "Your property received a new offer",
            intro: `${payload.actorName} submitted an application for "${payload.propertyTitle}". Review the offer details from your dashboard.`,
            details: [
                { label: "Property", value: payload.propertyTitle },
                { label: "Applicant", value: payload.actorName },
                { label: "Proposed Price", value: formatCurrency(payload.proposedPrice) },
                { label: "Message", value: payload.message || "" }
            ],
            ctaLabel: "Review Applications",
            ctaUrl: `${APP_BASE_URL}/list-property`
        })
    }),
    counter_offer: (payload) => ({
        subject: `Counter offer received for ${payload.propertyTitle}`,
        html: renderEmailBody({
            eyebrow: "Counter Offer",
            title: "You received a counter offer",
            intro: `${payload.actorName} sent a counter offer for "${payload.propertyTitle}". Open your requested properties to respond.`,
            details: [
                { label: "Property", value: payload.propertyTitle },
                { label: "Counter Price", value: formatCurrency(payload.proposedPrice) },
                { label: "Message", value: payload.message || "" }
            ],
            ctaLabel: "View Counter Offer",
            ctaUrl: `${APP_BASE_URL}/list-property`
        })
    }),
    application_rejected: (payload) => ({
        subject: `Application update for ${payload.propertyTitle}`,
        html: renderEmailBody({
            eyebrow: "Application Rejected",
            title: "Your application was rejected",
            intro: `${payload.actorName} rejected your application for "${payload.propertyTitle}".`,
            details: [
                { label: "Property", value: payload.propertyTitle },
                { label: "Owner", value: payload.actorName }
            ],
            ctaLabel: "View Requested Properties",
            ctaUrl: `${APP_BASE_URL}/list-property`
        })
    }),
    deal_in_progress: (payload) => ({
        subject: `Offer accepted for ${payload.propertyTitle}`,
        html: renderEmailBody({
            eyebrow: "Deal In Progress",
            title: "Your deal is now in progress",
            intro: `${payload.actorName} accepted the offer for "${payload.propertyTitle}". You can now continue from chat and your requested properties.`,
            details: [
                { label: "Property", value: payload.propertyTitle },
                { label: "Accepted Price", value: formatCurrency(payload.proposedPrice) }
            ],
            ctaLabel: "Open Chat",
            ctaUrl: `${APP_BASE_URL}/chat?applicationId=${payload.applicationId}`
        })
    }),
    offer_revised: (payload) => ({
        subject: `Offer revised for ${payload.propertyTitle}`,
        html: renderEmailBody({
            eyebrow: "Offer Revised",
            title: "The applicant revised their offer",
            intro: `${payload.actorName} revised the offer for "${payload.propertyTitle}".`,
            details: [
                { label: "Property", value: payload.propertyTitle },
                { label: "Revised Price", value: formatCurrency(payload.proposedPrice) },
                { label: "Message", value: payload.message || "" }
            ],
            ctaLabel: "Review Applications",
            ctaUrl: `${APP_BASE_URL}/list-property`
        })
    }),
    counter_accepted: (payload) => ({
        subject: `Counter offer accepted for ${payload.propertyTitle}`,
        html: renderEmailBody({
            eyebrow: "Counter Accepted",
            title: "Your counter offer was accepted",
            intro: `${payload.actorName} accepted your counter offer for "${payload.propertyTitle}".`,
            details: [
                { label: "Property", value: payload.propertyTitle },
                { label: "Agreed Price", value: formatCurrency(payload.proposedPrice) }
            ],
            ctaLabel: "Open Chat",
            ctaUrl: `${APP_BASE_URL}/chat?applicationId=${payload.applicationId}`
        })
    }),
    application_withdrawn: (payload) => ({
        subject: `Application withdrawn for ${payload.propertyTitle}`,
        html: renderEmailBody({
            eyebrow: "Application Withdrawn",
            title: "An applicant withdrew their offer",
            intro: `${payload.actorName} withdrew their application for "${payload.propertyTitle}".`,
            details: [
                { label: "Property", value: payload.propertyTitle },
                { label: "Applicant", value: payload.actorName }
            ],
            ctaLabel: "Review Applications",
            ctaUrl: `${APP_BASE_URL}/list-property`
        })
    }),
    deal_completed: (payload) => ({
        subject: `Deal completed for ${payload.propertyTitle}`,
        html: renderEmailBody({
            eyebrow: "Deal Completed",
            title: "The deal has been completed",
            intro: `The deal for "${payload.propertyTitle}" has been marked completed.`,
            details: [
                { label: "Property", value: payload.propertyTitle },
                { label: "Final Status", value: payload.finalStatus },
                { label: "Final Price", value: formatCurrency(payload.proposedPrice) }
            ],
            ctaLabel: "View Properties",
            ctaUrl: `${APP_BASE_URL}/list-property`
        })
    }),
    deal_cancelled: (payload) => ({
        subject: `Deal cancelled for ${payload.propertyTitle}`,
        html: renderEmailBody({
            eyebrow: "Deal Cancelled",
            title: "The deal has been cancelled",
            intro: `The deal for "${payload.propertyTitle}" has been cancelled and the listing is available again if applicable.`,
            details: [
                { label: "Property", value: payload.propertyTitle },
                { label: "Last Agreed Price", value: formatCurrency(payload.proposedPrice) }
            ],
            ctaLabel: "View Properties",
            ctaUrl: `${APP_BASE_URL}/list-property`
        })
    })
};

export function renderEmailTemplate(type, payload) {
    const templateFactory = templateFactories[type];

    if (!templateFactory) {
        throw new Error(`Unsupported email template type: ${type}`);
    }

    return templateFactory(payload);
}
