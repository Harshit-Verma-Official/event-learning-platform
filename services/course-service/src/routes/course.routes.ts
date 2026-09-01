import { USER_ROLES } from "@event-learning-platform/contracts";
import { Router } from "express";
import {
  createCourseController,
  createLessonsController,
  deleteCourseController,
  deleteLessonController,
  getCourseByIdController,
  getCourseController,
  getLessonController,
  updateCourseController,
  updateLessonsController,
} from "../controllers/course.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createCourseSchema,
  getCoursesSchema,
  updateCourseSchema,
} from "../validators/course.validator";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize(USER_ROLES.INSTRUCTOR, USER_ROLES.ADMIN),
  validate(createCourseSchema),
  createCourseController,
);
router.get("/", authenticate, validate(getCoursesSchema), getCourseController);
router.get("/:id", authenticate, getCourseByIdController);
router.patch(
  "/:id",
  authenticate,
  authorize(USER_ROLES.INSTRUCTOR, USER_ROLES.ADMIN),
  validate(updateCourseSchema),
  updateCourseController,
);
router.delete(
  "/:id",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  deleteCourseController,
);

router.post(
  "/:courseId/lessons",
  authenticate,
  authorize(USER_ROLES.INSTRUCTOR, USER_ROLES.ADMIN),
  createLessonsController,
);
router.get("/:courseId/lessons", getLessonController);
router.patch(
  "/:courseId/lessons/:lessonId",
  authenticate,
  authorize(USER_ROLES.INSTRUCTOR, USER_ROLES.ADMIN),
  updateLessonsController,
);
router.delete(
  "/:courseId/lessons/:lessonId",
  authenticate,
  authorize(USER_ROLES.INSTRUCTOR, USER_ROLES.ADMIN),
  deleteLessonController,
);

export default router;
