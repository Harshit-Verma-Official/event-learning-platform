import { randomUUID } from "crypto";

export const generateId = () => {
  return randomUUID();
};
