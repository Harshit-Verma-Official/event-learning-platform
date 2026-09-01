import type { UserRole } from "@event-learning-platform/contracts";
import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
  createCourse,
  deleteCourse,
  getCourseById,
  getCourses,
  updateCourse,
} from "../services/course.service";
import {
  createLesson,
  deleteLesson,
  getLessons,
  updateLesson,
} from "../services/lesson.service";

export const createCourseController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const { title, description, price } = req.body;

  const course = await createCourse({
    title,
    description,
    price,
    instructorId: req.user.id,
  });

  return res.status(201).json({
    course,
  });
};

export const getCourseController = async (req: Request, res: Response) => {
  const courses = await getCourses();

  return res.status(200).json({
    courses,
  });
};

export const getCourseByIdController = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const course = await getCourseById(req.params.id);

  if (!course) {
    return res.status(404).json({
      message: "Course not found",
    });
  }

  return res.status(200).json({ course });
};

export const updateCourseController = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const role = req.user.role;

  if (!role) {
    return res.status(403).json({
      message: "User role is not available",
    });
  }

  const course = await updateCourse(req.params.id, req.user.id, role, {
    title: req.body.title,
    description: req.body.description,
    price: req.body.price,
    status: req.body.status,
  });

  return res.status(200).json({ course });
};

export const deleteCourseController = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  await deleteCourse(req.params.id);

  res.status(204).send();
};

export const createLessonsController = async (
  req: AuthenticatedRequest & Request<{ courseId: string }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const { courseId } = req.params;
  const lesson = await createLesson(
    courseId,
    req.user.id,
    req.user.role as UserRole,
    {
      title: req.body.title,
      content: req.body.content,
      order: req.body.order,
    },
  );

  return res.status(201).json({ lesson });
};

export const getLessonController = async (
  req: Request<{ courseId: string }>,
  res: Response,
) => {
  const lessons = await getLessons(req.params.courseId);

  return res.status(200).json({
    lessons,
  });
};

export const updateLessonsController = async (
  req: AuthenticatedRequest & Request<{ courseId: string; lessonId: string }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const lesson = await updateLesson(
    req.params.lessonId,
    req.user.id,
    req.user.role as UserRole,
    {
      title: req.body.title,
      content: req.body.content,
      order: req.body.order,
    },
  );

  return res.status(200).json({
    lesson,
  });
};

export const deleteLessonController = async (
  req: AuthenticatedRequest & Request<{ courseId: string; lessonId: string }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  await deleteLesson(
    req.params.lessonId,
    req.user.id,
    req.user.role as UserRole,
  );

  return res.status(204).send();
};
