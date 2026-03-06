function compactText(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
}

function formatAmenities(amenities = []) {
    if (!Array.isArray(amenities) || amenities.length === 0) {
        return "Not specified";
    }

    return amenities.map(compactText).filter(Boolean).join(", ");
}

function buildPropertyFacts(payload) {
    const facts = [
        `Title: ${compactText(payload.title)}`,
        `Listing type: ${compactText(payload.listingType)}`,
        `Property type: ${compactText(payload.propertyType)}`,
        `Price in BDT: ${payload.price}`,
        `Area in square feet: ${payload.areaSqFt}`,
        `Division: ${compactText(payload.divisionName)}`,
        `District: ${compactText(payload.districtName)}`,
        `Upazila/Thana: ${compactText(payload.upazilaName)}`,
        `Street/Area: ${compactText(payload.address)}`,
        `Amenities: ${formatAmenities(payload.amenities)}`
    ];

    if (payload.propertyType === "flat") {
        facts.push(`Rooms: ${payload.roomCount}`);
        facts.push(`Bathrooms: ${payload.bathrooms}`);
    }

    if (payload.propertyType === "building") {
        facts.push(`Floor count: ${payload.floorCount}`);
        facts.push(`Total units: ${payload.totalUnits}`);
    }

    return facts.join("\n");
}

export function validatePropertyDescriptionPayload(payload = {}) {
    const requiredStringFields = [
        ["title", "Property title is required"],
        ["listingType", "Listing type is required"],
        ["propertyType", "Property type is required"],
        ["divisionName", "Division is required"],
        ["districtName", "District is required"],
        ["upazilaName", "Upazila/Thana is required"],
        ["address", "Street address is required"]
    ];

    for (const [field, message] of requiredStringFields) {
        if (!compactText(payload[field])) {
            return message;
        }
    }

    if (!Number.isFinite(Number(payload.price)) || Number(payload.price) <= 0) {
        return "Valid price is required";
    }

    if (!Number.isFinite(Number(payload.areaSqFt)) || Number(payload.areaSqFt) <= 0) {
        return "Valid area is required";
    }

    if (payload.propertyType === "flat") {
        if (!Number.isFinite(Number(payload.roomCount)) || Number(payload.roomCount) < 1) {
            return "Valid room count is required";
        }

        if (!Number.isFinite(Number(payload.bathrooms)) || Number(payload.bathrooms) < 1) {
            return "Valid bathroom count is required";
        }
    }

    if (payload.propertyType === "building") {
        if (!Number.isFinite(Number(payload.floorCount)) || Number(payload.floorCount) < 1) {
            return "Valid floor count is required";
        }

        if (!Number.isFinite(Number(payload.totalUnits)) || Number(payload.totalUnits) < 1) {
            return "Valid total unit count is required";
        }
    }

    return null;
}

export function buildPropertyDescriptionPrompt(payload) {
    return `Write a clean, attractive, marketplace-ready property description for a Bangladesh property platform.

Rules:
- Write exactly one paragraph.
- Keep it between 90 and 140 words.
- Be professional, clear, and appealing.
- Do not use markdown, bullet points, emojis, or hashtags.
- Do not invent features, locations, views, legal status, or amenities that are not provided.
- Reflect whether the property is for sale or rent.
- Mention the location naturally.
- End with a light call to action.

Property facts:
${buildPropertyFacts(payload)}`;
}
