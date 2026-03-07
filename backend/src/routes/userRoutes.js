import express from "express";

import { verifyToken } from "../middleware/verifyToken.js";

import * as userController from "../controllers/userController.js";


const router = express.Router();


// Register User

router.post("/register-user", userController.registerUser);

// Batch fetch users by emails

router.get("/users-by-emails", verifyToken, userController.getUsersByEmails);

// Check user existence

router.get("/check-user-exist", userController.checkUserExist);

// Get user role

router.get("/get-user-role", userController.getUserRole);

// Update user profile

router.patch("/update-profile", verifyToken, userController.updateProfile);

// Submit NID for verification

router.post("/submit-nid", verifyToken, userController.submitNid);

// Get current user data

router.get("/user-profile", verifyToken, userController.getUserProfile);

// Check if user is admin

router.get("/users/admin/:email", verifyToken, userController.checkIsAdmin);

// Get secure public profile

router.get("/public-profile/:email/message-status", verifyToken, userController.getPublicProfileMessageStatus);
router.get("/public-profile/:email", verifyToken, userController.getPublicProfile);

export default router;

