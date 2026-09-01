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
