import { Router } from "express";
import {
  register,
  login,
  refreshToken,
  getCurrentUser,
  logout,
} from "../controllers/authController";
import { verifyToken, verifyRefreshToken } from "../middleware/auth";

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @body    { email: string, password: string, name: string }
 * @returns { user, accessToken, refreshToken }
 */
router.post("/register", register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @body    { email: string, password: string }
 * @returns { user, accessToken, refreshToken }
 */
router.post("/login", login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @body    { refreshToken: string }
 * @returns { accessToken, refreshToken }
 */
router.post("/refresh", verifyRefreshToken, refreshToken);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user information (protected)
 * @header  Authorization: Bearer <token>
 * @returns { user }
 */
router.get("/me", verifyToken, getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (protected)
 * @header  Authorization: Bearer <token>
 * @returns { message }
 */
router.post("/logout", verifyToken, logout);

export default router;
