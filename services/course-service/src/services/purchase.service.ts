import { createCoursePurchasedEvent } from "../events/course.producer";
import { CourseStatus } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";

export const purchaseCourse = async (userId: string, courseId: string) => {
  return prisma.$transaction(async (tx) => {
    const course = await tx.course.findUnique({
      where: {
        id: courseId,
      },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    if (course.status !== CourseStatus.PUBLISHED) {
      throw new Error("Course is not available for purchase");
    }

    const existingEnrollment = await tx.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      throw new Error("User is already enrolled in this course");
    }

    // Simulated payment
    const paymentSuccessful = true;

    if (!paymentSuccessful) {
      throw new Error("Payment failed");
    }

    const enrollment = await tx.enrollment.create({
      data: {
        userId,
        courseId,
      },
    });

    await createCoursePurchasedEvent(tx, userId, courseId, enrollment.id);

    return enrollment;
  });
};
