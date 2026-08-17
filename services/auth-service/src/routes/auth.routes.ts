import { Router } from "express";
import {
  getMe,
  login,
  refersh,
  register,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refersh);
router.get("/me", authenticate, getMe);

export default router;
