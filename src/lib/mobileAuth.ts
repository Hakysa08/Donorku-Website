import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export type MobileTokenPayload = {
  id_pendonor: number;
  email: string;
};

export function getMobileTokenPayload(req: NextRequest): MobileTokenPayload | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");

  try {
    return jwt.verify(token, process.env.JWT_SECRET_MOBILE!) as MobileTokenPayload;
  } catch {
    return null;
  }
}