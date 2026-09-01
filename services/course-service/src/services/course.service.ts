import { USER_ROLES, type UserRole } from "@event-learning-platform/contracts";
import { getCourseCacheKey } from "../cache/course.cache";
import type { CourseStatus } from "../generated/prisma/enums";
import { logger } from "../lib/logger";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";

interface CreateCourseInput {
  title: string;
  description: string;
  price: number;
  instructorId: string;
}

interface UpdateCourseInput {
  title?: string;
  description?: string;
  price?: number;
  status?: CourseStatus;
}

export const createCourse = async ({
  title,
  description,
  price,
  instructorId,
}: CreateCourseInput) => {
  return await prisma.course.create({
    data: {
      title,
      description,
      price,
      instructorId,
    },
  });
};

export const getCourses = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [courses, total] = await prisma.$transaction([
    prisma.course.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.course.count(),
  ]);

  return {
    courses,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getCourseById = async (courseId: string) => {
  const cacheKey = getCourseCacheKey(courseId);

  const cachedCourse = await redis.get(cacheKey);

  if (cachedCourse) {
    logger.info("Course cache HIT");

    return JSON.parse(cachedCourse);
  }

  logger.info("Course cache MISS");

  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
  });

  if (!course) {
    return null;
  }

  await redis.set(cacheKey, JSON.stringify(course), "EX", 60 * 5);

  return course;
};

export const updateCourse = async (
  courseId: string,
  userId: string,
  role: UserRole,
  data: UpdateCourseInput,
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

  const updatedCourse = await prisma.course.update({
    where: {
      id: courseId,
    },
    data,
  });

  await redis.del(getCourseCacheKey(courseId));

  return updatedCourse;
};

export const deleteCourse = async (courseId: string) => {
  const course = prisma.course.findUnique({
    where: {
      id: courseId,
    },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  const deletedCourse = await prisma.course.delete({
    where: {
      id: courseId,
    },
  });

  await redis.del(getCourseCacheKey(courseId));

  return deletedCourse;
};
