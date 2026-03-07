const FIREBASE_AUTH_ERROR_MESSAGES = {
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-not-found": "No account was found with this email.",
    "auth/wrong-password": "Email or password is incorrect.",
    "auth/email-already-in-use": "An account already exists with this email.",
    "auth/weak-password": "Password is too weak. Use at least 6 characters.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled before completion.",
    "auth/popup-blocked": "Google sign-in popup was blocked by the browser.",
    "auth/cancelled-popup-request": "Google sign-in is already in progress.",
    "auth/network-request-failed": "Network error. Check your internet connection and try again.",
    "auth/too-many-requests": "Too many attempts. Please wait a bit and try again.",
    "auth/account-exists-with-different-credential": "An account already exists with this email using a different sign-in method."
};

export const getFirebaseAuthErrorMessage = (error, fallbackMessage = "Authentication failed. Please try again.") => {
    const errorCode = error?.code || error?.response?.data?.code;
    if (errorCode && FIREBASE_AUTH_ERROR_MESSAGES[errorCode]) {
        return FIREBASE_AUTH_ERROR_MESSAGES[errorCode];
    }

    const rawMessage = error?.message || "";

    if (rawMessage.includes("auth/invalid-credential")) {
        return FIREBASE_AUTH_ERROR_MESSAGES["auth/invalid-credential"];
    }

    if (rawMessage.includes("auth/email-already-in-use")) {
        return FIREBASE_AUTH_ERROR_MESSAGES["auth/email-already-in-use"];
    }

    if (rawMessage.includes("auth/weak-password")) {
        return FIREBASE_AUTH_ERROR_MESSAGES["auth/weak-password"];
    }

    return error?.response?.data?.message || fallbackMessage;
};
