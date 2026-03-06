import { enqueueEmailJob } from "./emailJobService.js";

function buildDedupeKey(type, entityId, recipientEmail, occurredAt) {
    return `${type}:${entityId}:${recipientEmail}:${occurredAt.toISOString()}`;
}

async function queueNotification({ type, recipientEmail, payload, occurredAt, entityId }) {
    try {
        return await enqueueEmailJob({
            type,
            to: recipientEmail,
            payload,
            dedupeKey: buildDedupeKey(type, entityId, recipientEmail, occurredAt)
        });
    } catch (error) {
        console.error(`Failed to enqueue ${type} email:`, error?.message || error);
        return { queued: false, reason: "enqueue_failed" };
    }
}

function buildBasePayload(application, overrides = {}) {
    return {
        applicationId: application._id?.toString?.() || String(application._id),
        propertyTitle: application.propertySnapshot?.title || overrides.propertyTitle || "Property",
        actorName: overrides.actorName || "GhorBari User",
        proposedPrice: overrides.proposedPrice ?? application.proposedPrice ?? application.finalPrice ?? null,
        message: overrides.message ?? application.message ?? "",
        finalStatus: overrides.finalStatus || ""
    };
}

export async function queueApplicationSubmittedEmail(application, occurredAt) {
    return queueNotification({
        type: "application_submitted",
        recipientEmail: application.owner?.email,
        occurredAt,
        entityId: application._id,
        payload: buildBasePayload(application, {
            actorName: application.seeker?.name
        })
    });
}

export async function queueCounterOfferEmail(application, occurredAt, { proposedPrice, message }) {
    return queueNotification({
        type: "counter_offer",
        recipientEmail: application.seeker?.email,
        occurredAt,
        entityId: application._id,
        payload: buildBasePayload(application, {
            actorName: application.owner?.name,
            proposedPrice,
            message
        })
    });
}

export async function queueApplicationRejectedEmail(application, occurredAt) {
    return queueNotification({
        type: "application_rejected",
        recipientEmail: application.seeker?.email,
        occurredAt,
        entityId: application._id,
        payload: buildBasePayload(application, {
            actorName: application.owner?.name
        })
    });
}

export async function queueDealInProgressEmail(application, occurredAt) {
    return queueNotification({
        type: "deal_in_progress",
        recipientEmail: application.seeker?.email,
        occurredAt,
        entityId: application._id,
        payload: buildBasePayload(application, {
            actorName: application.owner?.name
        })
    });
}

export async function queueOfferRevisedEmail(application, occurredAt, { proposedPrice, message }) {
    return queueNotification({
        type: "offer_revised",
        recipientEmail: application.owner?.email,
        occurredAt,
        entityId: application._id,
        payload: buildBasePayload(application, {
            actorName: application.seeker?.name,
            proposedPrice,
            message
        })
    });
}

export async function queueCounterAcceptedEmail(application, occurredAt) {
    return queueNotification({
        type: "counter_accepted",
        recipientEmail: application.owner?.email,
        occurredAt,
        entityId: application._id,
        payload: buildBasePayload(application, {
            actorName: application.seeker?.name
        })
    });
}

export async function queueApplicationWithdrawnEmail(application, occurredAt) {
    return queueNotification({
        type: "application_withdrawn",
        recipientEmail: application.owner?.email,
        occurredAt,
        entityId: application._id,
        payload: buildBasePayload(application, {
            actorName: application.seeker?.name
        })
    });
}

export async function queueDealCompletedEmails(application, occurredAt, finalStatus) {
    const payload = buildBasePayload(application, {
        proposedPrice: application.finalPrice ?? application.proposedPrice,
        finalStatus
    });

    await queueNotification({
        type: "deal_completed",
        recipientEmail: application.owner?.email,
        occurredAt,
        entityId: application._id,
        payload
    });

    await queueNotification({
        type: "deal_completed",
        recipientEmail: application.seeker?.email,
        occurredAt,
        entityId: application._id,
        payload
    });
}

export async function queueDealCancelledEmails(application, occurredAt) {
    const payload = buildBasePayload(application, {
        proposedPrice: application.finalPrice ?? application.proposedPrice
    });

    await queueNotification({
        type: "deal_cancelled",
        recipientEmail: application.owner?.email,
        occurredAt,
        entityId: application._id,
        payload
    });

    await queueNotification({
        type: "deal_cancelled",
        recipientEmail: application.seeker?.email,
        occurredAt,
        entityId: application._id,
        payload
    });
}
