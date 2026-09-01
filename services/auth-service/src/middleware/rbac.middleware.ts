import type { NextFunction, Response } from "express";
import type { UserRole } from "../generated/prisma/enums";
import { getAuthorizationState } from "../services/authorization.service";
import type { AuthenticatedRequest } from "./auth.middleware";

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

    try {
      const authorizationState = await getAuthorizationState(req.user.id);

      if (!authorizationState) {
        return res.status(401).json({
          message: "User not found",
        });
      }

      if (!allowedRoles.includes(authorizationState.role)) {
        return res.status(403).json({
          message: "You do not have permission to perform this action",
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
