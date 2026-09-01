import { Router } from "express";
import { purchaseCourseController } from "../controllers/purchase.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/:courseId/purchase", authenticate, purchaseCourseController);

export default router;
