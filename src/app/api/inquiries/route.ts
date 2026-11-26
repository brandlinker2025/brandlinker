import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  cleanText,
  hasInquiryErrors,
  honeypotField,
  inquiryLimits,
  validateInquiry,
  type InquiryInput,
} from "@/lib/inquiry";

const MAX_BODY_BYTES = 16 * 1024;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

// Best-effort limit per server instance. It stops casual floods; a shared
// store (for example Upstash or a Supabase table) would make it global.
const hits = new Map<string, number[]>();

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  return (
    forwarded.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function rateLimited(key: string, now = Date.now()) {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const host =
      request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

type ParsedInput = { input: InquiryInput; trap: string };

function fromRecord(get: (key: string) => unknown): ParsedInput {
  return {
    input: {
      name: cleanText(get("name"), inquiryLimits.name),
      email: cleanText(get("email"), inquiryLimits.email),
      brand: cleanText(get("brand"), inquiryLimits.brand),
      budget: cleanText(get("budget"), inquiryLimits.budget),
      message: cleanText(get("message"), inquiryLimits.message),
    },
    trap: cleanText(get(honeypotField), 200),
  };
}

class PayloadTooLarge extends Error {}

async function readInput(request: Request): Promise<ParsedInput> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) throw new PayloadTooLarge();
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    throw new PayloadTooLarge();
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body: unknown = JSON.parse(raw);
    const record =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};
    return fromRecord((key) => record[key]);
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(raw);
    return fromRecord((key) => params.get(key));
  }

  throw new Error("unsupported content type");
}

function oneLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function mailConfig() {
  const to = process.env.CONTACT_TO_EMAIL?.trim() ?? "";
  const from = process.env.CONTACT_FROM_EMAIL?.trim() ?? "";
  const key = process.env.RESEND_API_KEY?.trim() ?? "";
  if (!to || !from || !key) return null;
  return { to, from, key };
}

function inquiryText(input: InquiryInput) {
  return [
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Brand: ${input.brand}`,
    `Budget: ${input.budget || "(not given)"}`,
    "",
    input.message,
  ].join("\n");
}

async function sendInquiry(input: InquiryInput) {
  const mail = mailConfig();
  if (!mail) return { ok: false as const, status: 503 };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mail.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: mail.from,
      to: [mail.to],
      reply_to: input.email,
      subject: oneLine(`Collaboration inquiry from ${input.name || "rslina.com"}`),
      text: inquiryText(input),
    }),
  });

  if (!response.ok) return { ok: false as const, status: 502 };
  return { ok: true as const };
}

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { ok: false, error: "Send the inquiry from rslina.com." },
      { status: 403, headers: noStore },
    );
  }

  if (rateLimited(clientKey(request))) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many inquiries from this connection. Wait a few minutes and try again.",
      },
      { status: 429, headers: { ...noStore, "Retry-After": "600" } },
    );
  }

  let parsed: ParsedInput;
  try {
    parsed = await readInput(request);
  } catch (error) {
    if (error instanceof PayloadTooLarge) {
      return NextResponse.json(
        { ok: false, error: "The inquiry is too long." },
        { status: 413, headers: noStore },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Send the inquiry as a form or JSON." },
      { status: 400, headers: noStore },
    );
  }

  // A filled honeypot means a bot. Answer like a success and drop it.
  if (parsed.trap) {
    return NextResponse.json({ ok: true, mode: "saved" }, { headers: noStore });
  }

  const input = parsed.input;
  const errors = validateInquiry(input);
  if (hasInquiryErrors(errors)) {
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }

  const sent = await sendInquiry(input);
  if (!sent.ok) {
    return NextResponse.json(
      { ok: false, error: "The inquiry could not be sent. Try again in a moment." },
      { status: sent.status, headers: noStore },
    );
  }

  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (url && key) {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await supabase.from("inquiries").insert({
      name: input.name,
      email: input.email,
      brand: input.brand,
      budget: input.budget || null,
      message: input.message,
    });
  }

  return NextResponse.json({ ok: true, mode: "sent" }, { headers: noStore });
}
