import { USER_ROLES } from "@event-learning-platform/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "../../src/generated/prisma/browser";
import { prisma } from "../../src/lib/prisma";
import { createCourse, updateCourse } from "../../src/services/course.service";

vi.mock("../../src/lib/prisma", () => ({
  prisma: {
    course: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("createCourse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a course", async () => {
    const mockCourse = {
      id: "course-1",
      title: "Node.js",
      description: "Backend development",
      price: 499,
      status: "DRAFT",
      instructorId: "user-1",
    };

    vi.mocked(prisma.course.create).mockResolvedValue(
      mockCourse as Prisma.CourseGetPayload<never>,
    );

    const result = await createCourse({
      title: "Node.js",
      description: "Backend development",
      price: 499,
      instructorId: "user-1",
    });

    expect(result).toEqual(mockCourse);

    expect(prisma.course.create).toHaveBeenCalled();
  });
});

it("should prevent an instructor from updating another instructor's course", async () => {
  vi.mocked(prisma.course.findUnique).mockResolvedValue({
    id: "course-1",
    instructorId: "instructor-1",
  } as Prisma.CourseGetPayload<never>);

  await expect(
    updateCourse("course-1", "instructor-2", USER_ROLES.INSTRUCTOR, {
      title: "Updated title",
    }),
  ).rejects.toThrow("Forbidden");

  expect(prisma.course.update).not.toHaveBeenCalled();
});

it("should allow an admin to update any course", async () => {
  vi.mocked(prisma.course.findUnique).mockResolvedValue({
    id: "course-1",
    instructorId: "instructor-1",
  } as Prisma.CourseGetPayload<never>);

  const updatedCourse = {
    id: "course-1",
    instructorId: "instructor-1",
    title: "Updated title",
  };

  vi.mocked(prisma.course.update).mockResolvedValue(
    updatedCourse as Prisma.CourseGetPayload<never>,
  );

  const result = await updateCourse("course-1", "admin-1", USER_ROLES.ADMIN, {
    title: "Updated title",
  });

  expect(result).toEqual(updatedCourse);

  expect(prisma.course.update).toHaveBeenCalled();
});

it("should throw when course does not exist", async () => {
  vi.mocked(prisma.course.findUnique).mockResolvedValue(null);

  await expect(
    updateCourse("missing-course", "user-1", USER_ROLES.INSTRUCTOR, {
      title: "Updated",
    }),
  ).rejects.toThrow("Course not found");

  expect(prisma.course.update).not.toHaveBeenCalled();
});
