export type InquiryInput = {
  name: string;
  email: string;
  brand: string;
  budget: string;
  message: string;
};

export type InquiryField = keyof InquiryInput;

export const inquiryLimits = {
  name: 80,
  email: 120,
  brand: 120,
  budget: 80,
  message: 2000,
} as const;

/** Hidden field that people never see; bots that fill every input trip it. */
export const honeypotField = "website";

// Control characters other than tab and newline.
const controlChars = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.replace(controlChars, "").trim().slice(0, max + 1);
}

export type InquiryErrors = Partial<Record<InquiryField, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emptyInquiry(): InquiryInput {
  return { name: "", email: "", brand: "", budget: "", message: "" };
}

export function validateInquiry(input: InquiryInput): InquiryErrors {
  const errors: InquiryErrors = {};

  if (input.name.length < 1 || input.name.length > inquiryLimits.name) {
    errors.name = "Add a name, up to 80 characters.";
  }

  if (
    input.email.length < 3 ||
    input.email.length > inquiryLimits.email ||
    !emailPattern.test(input.email)
  ) {
    errors.email = "Enter a valid email.";
  }

  if (input.brand.length < 1 || input.brand.length > inquiryLimits.brand) {
    errors.brand = "Add a brand or company, up to 120 characters.";
  }

  if (input.budget.length > inquiryLimits.budget) {
    errors.budget = "Keep the budget line to 80 characters.";
  }

  if (input.message.length < 1 || input.message.length > inquiryLimits.message) {
    errors.message = "Write a message, up to 2000 characters.";
  }

  return errors;
}

export function hasInquiryErrors(errors: InquiryErrors) {
  return Object.keys(errors).length > 0;
}
