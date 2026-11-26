import { NextResponse } from "next/server";
import { PRIVATE_SESSION_COOKIE } from "@/lib/private-auth";

export async function POST(req: Request) {
  const url = new URL("/login", req.url);
  const response = NextResponse.json({ authenticated: false, message: "Logged out." });

  response.cookies.set(PRIVATE_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("rs_admin_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export async function GET(req: Request) {
  const url = new URL("/login", req.url);
  const response = NextResponse.redirect(url);

  response.cookies.set(PRIVATE_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("rs_admin_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}
