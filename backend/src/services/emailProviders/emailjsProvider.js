import axios from "axios";

const EMAILJS_SEND_URL = "https://api.emailjs.com/api/v1.0/email/send";

function getEmailJsConfig() {
    const {
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        EMAILJS_PUBLIC_KEY,
        EMAILJS_PRIVATE_KEY
    } = process.env;

    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
        throw new Error("EmailJS configuration is incomplete");
    }

    return {
        serviceId: EMAILJS_SERVICE_ID,
        templateId: EMAILJS_TEMPLATE_ID,
        publicKey: EMAILJS_PUBLIC_KEY,
        privateKey: EMAILJS_PRIVATE_KEY
    };
}

export async function sendEmailWithEmailJs({ to, subject, html }) {
    const { serviceId, templateId, publicKey, privateKey } = getEmailJsConfig();
    const response = await axios.post(
        EMAILJS_SEND_URL,
        {
            service_id: serviceId,
            template_id: templateId,
            user_id: publicKey,
            accessToken: privateKey,
            template_params: {
                to_email: to,
                subject,
                html
            }
        },
        {
            headers: {
                "Content-Type": "application/json"
            },
            timeout: 30000
        }
    );

    return response.data;
}
