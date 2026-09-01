import z from "zod";

export const createCourseSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title must not exceed 200 characters"),

    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters"),

    price: z.number().nonnegative("Price cannot be negative"),

    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  }),

  params: z.object({}),

  query: z.object({}),
});

export const updateCourseSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(3).max(200).optional(),

      description: z.string().trim().min(10).optional(),

      price: z.number().nonnegative().optional(),

      status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      error: "At least one field is required",
    }),

  params: z.object({
    id: z.string().uuid(),
  }),

  query: z.object({}),
});

export const getCoursesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
