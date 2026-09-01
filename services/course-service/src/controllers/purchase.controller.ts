import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { purchaseCourse } from "../services/purchase.service";

export const purchaseCourseController = async (
  req: AuthenticatedRequest & Request<{ courseId: string }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const enrollment = await purchaseCourse(req.user.id, req.params.courseId);

  return res.status(201).json({
    enrollment,
  });
};
