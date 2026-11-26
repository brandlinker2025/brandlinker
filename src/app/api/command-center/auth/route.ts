import { NextResponse } from "next/server";
import { verifyRequestSession } from "@/lib/auth-guard";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { signSession, getSessionCookieOptions } from "@/lib/private-auth";

export async function GET(req: Request) {
  const session = verifyRequestSession(req);
  return NextResponse.json({
    authenticated: session.authorized,
    role: session.role,
    actor: session.actor,
    error: session.error,
  });
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`auth-login:${ip}`, 5, 60); // 5 attempts per min
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { authenticated: false, error: "Too many login attempts. Please wait 1 minute." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const pin = body?.pin || body?.token;

    const dummyReq = new Request("http://localhost", {
      headers: { "x-admin-token": String(pin || "") },
    });

    const session = verifyRequestSession(dummyReq);

    if (!session.authorized) {
      return NextResponse.json(
        { authenticated: false, error: "Invalid Access Key or PIN" },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      authenticated: true,
      role: session.role,
      actor: session.actor,
    });

    const sessionToken = signSession(session.role === "admin" ? "owner" : session.actor);
    const cookieOpts = getSessionCookieOptions();

    res.cookies.set(cookieOpts.name, sessionToken, {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      maxAge: cookieOpts.maxAge,
      path: cookieOpts.path,
    });

    return res;
  } catch (err: unknown) {
    return NextResponse.json(
      { authenticated: false, error: err instanceof Error ? err.message : "Internal Error" },
      { status: 500 }
    );
  }
}
