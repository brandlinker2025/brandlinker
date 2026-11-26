import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import {
  verifyOwnerCredentials,
  signSession,
  getSessionCookieOptions,
} from "@/lib/private-auth";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`login-attempt:${ip}`, 5, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many failed login attempts. Please wait 1 minute." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const accessKey = body?.accessKey || body?.token || body?.password;

    if (!accessKey || typeof accessKey !== "string") {
      return NextResponse.json(
        { error: "Access credential required." },
        { status: 400 }
      );
    }

    const isValid = verifyOwnerCredentials(accessKey);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid access key. Unauthorized." },
        { status: 401 }
      );
    }

    // Generate signed session token
    const sessionToken = signSession("owner");
    const cookieOpts = getSessionCookieOptions();

    const response = NextResponse.json({
      authenticated: true,
      message: "Access granted.",
    });

    response.cookies.set(cookieOpts.name, sessionToken, {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      maxAge: cookieOpts.maxAge,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: "Authentication processing error." },
      { status: 500 }
    );
  }
}
