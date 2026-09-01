import type { UserRole } from "@event-learning-platform/contracts";
import { USER_ROLES } from "@event-learning-platform/contracts";
import { redis } from "../lib/redis";

const getRoleKey = (userId: string) => `user:role:${userId}`;

export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  const role = await redis.get(getRoleKey(userId));

  if (!role) {
    return null;
  }

  if (
    role !== USER_ROLES.ADMIN &&
    role !== USER_ROLES.INSTRUCTOR &&
    role !== USER_ROLES.STUDENT
  ) {
    return null;
  }

  return role;
};

export const setUserRole = async (userId: string, role: UserRole) => {
  await redis.set(getRoleKey(userId), role);
};

export const deleteUserRole = async (userId: string) => {
  await redis.del(getRoleKey(userId));
};
