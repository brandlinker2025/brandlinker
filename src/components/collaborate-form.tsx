"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  emptyInquiry,
  hasInquiryErrors,
  honeypotField,
  validateInquiry,
  type InquiryErrors,
  type InquiryInput,
} from "@/lib/inquiry";
type SavedBody = { ok: true; mode: "sent" | "saved" };

type ErrorBody = { ok: false; errors?: InquiryErrors; error?: string };

const fieldClass = "h-11 rounded-xl px-3 text-base md:text-base";

export function CollaborateForm() {
  const [values, setValues] = useState<InquiryInput>(emptyInquiry);
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [pending, setPending] = useState(false);
  const [trap, setTrap] = useState("");
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "saved" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  function update<K extends keyof InquiryInput>(key: K, value: InquiryInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = {
      name: values.name.trim(),
      email: values.email.trim(),
      brand: values.brand.trim(),
      budget: values.budget.trim(),
      message: values.message.trim(),
    };
    const nextErrors = validateInquiry(next);
    setErrors(nextErrors);
    setValues(next);
    if (hasInquiryErrors(nextErrors)) {
      setStatus({ kind: "idle" });
      return;
    }

    setPending(true);
    setStatus({ kind: "idle" });
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...next, [honeypotField]: trap }),
      });
      const body = (await response.json()) as SavedBody | ErrorBody;
      if (!response.ok || !body.ok) {
        if (!body.ok && body.errors) setErrors(body.errors);
        setStatus({
          kind: "error",
          message:
            (!body.ok && body.error) ||
            "The inquiry did not go through. Try again in a moment.",
        });
        return;
      }
      if (body.mode === "sent" || body.mode === "saved") {
        setStatus({ kind: "saved" });
        setValues(emptyInquiry());
        return;
      }
      setStatus({
        kind: "error",
        message: "The inquiry did not go through. Try again in a moment.",
      });
    } catch {
      setStatus({
        kind: "error",
        message: "The inquiry did not go through. Try again in a moment.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="space-y-5"
      action="/api/inquiries"
      method="post"
      onSubmit={onSubmit}
      noValidate
    >
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={honeypotField}>Leave this field empty</label>
        <input
          id={honeypotField}
          name={honeypotField}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={trap}
          onChange={(event) => setTrap(event.target.value)}
        />
      </div>
      <Field id="name" label="Name" error={errors.name}>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          value={values.name}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={fieldClass}
          onChange={(event) => update("name", event.target.value)}
        />
      </Field>
      <Field id="email" label="Email" error={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={fieldClass}
          onChange={(event) => update("email", event.target.value)}
        />
      </Field>
      <Field id="brand" label="Brand" error={errors.brand}>
        <Input
          id="brand"
          name="brand"
          value={values.brand}
          aria-invalid={Boolean(errors.brand)}
          aria-describedby={errors.brand ? "brand-error" : undefined}
          className={fieldClass}
          onChange={(event) => update("brand", event.target.value)}
        />
      </Field>
      <Field id="budget" label="Budget" hint="Optional" error={errors.budget}>
        <Input
          id="budget"
          name="budget"
          value={values.budget}
          aria-invalid={Boolean(errors.budget)}
          aria-describedby={errors.budget ? "budget-error" : "budget-hint"}
          className={fieldClass}
          onChange={(event) => update("budget", event.target.value)}
        />
      </Field>
      <Field id="message" label="Message" error={errors.message}>
        <Textarea
          id="message"
          name="message"
          rows={6}
          value={values.message}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
          className="min-h-36 rounded-xl px-3 py-3 text-base md:text-base"
          onChange={(event) => update("message", event.target.value)}
        />
      </Field>
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        aria-busy={pending}
        className="h-12 rounded-full px-6 text-base"
      >
        {pending ? "Sending…" : "Send inquiry"}
      </Button>
      <div aria-live="polite" className="text-sm leading-relaxed text-white/75">
        {status.kind === "saved" ? <p>Sent. She has the inquiry.</p> : null}
        {status.kind === "error" ? <p>{status.message}</p> : null}
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        {hint ? (
          <span id={`${id}-hint`} className="text-xs text-white/45">
            {hint}
          </span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-[#ffb4a8]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
