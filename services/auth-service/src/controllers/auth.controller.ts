import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
  loginUser,
  refreshAccessToken,
  registerUser,
} from "../services/auth.service";

const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/api/v1/auth",
};

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const user = await registerUser({ name, email, password });

  res.status(201).json({ user });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await loginUser(email, password);
  const { refreshToken, ...userData } = result;

  res
    .cookie("refreshToken", refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS)
    .status(200)
    .json(userData);
};

export const refersh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh is missing" });
  }

  const result = await refreshAccessToken(refreshToken);

  res
    .cookie("refreshToken", result.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS)
    .status(200)
    .json({
      accessToken: result.accessToken,
    });
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.user!.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({ user });
};
