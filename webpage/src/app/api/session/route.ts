import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  const { idToken } = await req.json();

  const expiresIn = 60 * 60 * 24 * 5 * 1000;
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

  const res = NextResponse.json({ status: "success" });
  res.cookies.set("session", sessionCookie, { httpOnly: true, secure: true, path: "/" });
  return res;
}
