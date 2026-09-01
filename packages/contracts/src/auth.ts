export const USER_ROLES = {
  STUDENT: "STUDENT",
  INSTRUCTOR: "INSTRUCTOR",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
