import { USER_ROLES, type UserRole } from "@event-learning-platform/contracts";
import { prisma } from "../lib/prisma";

export interface CreateLessonInput {
  title: string;
  content?: string;
  order: number;
}

export const createLesson = async (
  courseId: string,
  userId: string,
  role: UserRole,
  data: CreateLessonInput,
) => {
  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  if (role !== USER_ROLES.ADMIN && course.instructorId !== userId) {
    throw new Error("Forbidden");
  }

  return prisma.lesson.create({
    data: {
      courseId,
      title: data.title,
      content: data.content,
      order: data.order,
    },
  });
};

export const getLessons = async (courseId: string) => {
  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
    select: {
      id: true,
    },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  return prisma.lesson.findMany({
    where: {
      courseId,
    },
    orderBy: {
      order: "asc",
    },
  });
};

interface UpdateLessonInput {
  title?: string;
  content?: string;
  order?: number;
}

export const updateLesson = async (
  lessonId: string,
  userId: string,
  role: UserRole,
  data: UpdateLessonInput,
) => {
  const lesson = await prisma.lesson.findUnique({
    where: {
      id: lessonId,
    },
    include: {
      course: true,
    },
  });

  if (!lesson) {
    throw new Error("Lesson not found");
  }

  if (role !== USER_ROLES.ADMIN && lesson.course.instructorId !== userId) {
    throw new Error("Forbidden");
  }

  return prisma.lesson.update({
    where: {
      id: lessonId,
    },
    data,
  });
};

export const deleteLesson = async (
  lessonId: string,
  userId: string,
  role: UserRole,
) => {
  const lesson = await prisma.lesson.findUnique({
    where: {
      id: lessonId,
    },
    include: {
      course: true,
    },
  });

  if (!lesson) {
    throw new Error("Lesson not found");
  }

  if (role !== USER_ROLES.ADMIN && lesson.course.instructorId !== userId) {
    throw new Error("Forbidden");
  }

  await prisma.lesson.delete({
    where: {
      id: lessonId,
    },
  });
};
