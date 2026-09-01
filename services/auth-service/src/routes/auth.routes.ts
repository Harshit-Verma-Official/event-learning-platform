import { Router } from "express";
import {
  forgotPasswordController,
  getMe,
  login,
  refersh,
  register,
  resetPasswordController,
  updateRole,
} from "../controllers/auth.controller";
import { UserRole } from "../generated/prisma/enums";
import { authenticate } from "../middleware/auth.middleware";
import { rateLimiter } from "../middleware/rateLimiter.middleware";
import { authorize } from "../middleware/rbac.middleware";

const router = Router();

router.post(
  "/register",
  rateLimiter({
    limit: 10,
    windowSeconds: 60,
  }),
  register,
);
router.post("/login", rateLimiter({ limit: 5, windowSeconds: 60 }), login);
router.post("/refresh", refersh);
router.get("/me", authenticate, getMe);
router.post("/forgot-password", forgotPasswordController);
router.post(
  "/reset-password",
  rateLimiter({
    limit: 3,
    windowSeconds: 60,
  }),
  resetPasswordController,
);
router.put(
  "/users/:userId/role",
  authenticate,
  authorize(UserRole.ADMIN),
  updateRole,
);

export default router;
