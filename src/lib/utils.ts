import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function generateRefNumber(prefix = "AASP-UDY"): string {
  const year = new Date().getFullYear();
  const randomSuffix = crypto
    .randomUUID()
    .replace(/-/g, "")
    .slice(0, 16)
    .toUpperCase();
  return `${prefix}-${year}-${randomSuffix}`;
}

export function formatDate(
  dateInput: Date | string | null | undefined,
  locale = "mr-IN",
): string {
  if (!dateInput) return "-";
  const d = new Date(dateInput);
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
