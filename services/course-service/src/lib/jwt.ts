import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;

interface AccessTokenPayload {
  sub: string;
}

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, ACCESS_SECRET, {
    algorithms: ["HS256"],
  }) as AccessTokenPayload;
};

export const generateAccessToken = (payload: AccessTokenPayload) => {
  return jwt.sign(payload, ACCESS_SECRET, {
    algorithm: "HS256",
    expiresIn: "15m",
  });
};
