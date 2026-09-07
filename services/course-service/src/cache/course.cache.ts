import { logger } from "../lib/logger";
import { redis } from "../lib/redis";

const getCourseCacheKey = (courseId: string) => {
  return `course:${courseId}`;
};

export const getCachedCourse = async (courseId: string) => {
  try {
    return await redis.get(getCourseCacheKey(courseId));
  } catch (error) {
    logger.error({ message: "Redis GET failed", error });

    return null;
  }
};

export const setCachedCourse = async (courseId: string, data: unknown) => {
  try {
    await redis.set(
      getCourseCacheKey(courseId),
      JSON.stringify(data),
      "EX",
      300,
    );
  } catch (error) {
    logger.error({ message: "Redis SET failed", error });
  }
};

export const invalidateCourseCache = async (courseId: string) => {
  try {
    await redis.del(getCourseCacheKey(courseId));
  } catch (error) {
    logger.error({ message: "Redis DEL failed", error });
  }
};
