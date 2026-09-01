import type { UserRole } from "@event-learning-platform/contracts";
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./auth.middleware";
import { getUserRole } from "../services/authorization.service";

export const authorize = (...allowedRoles: UserRole[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const role = await getUserRole(req.user.id);

    if (!role) {
      return res.status(403).json({
        message: "User role not available",
      });
    }

    req.user.role = role;

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    next();
  };
};
