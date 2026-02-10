import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function resolvePosterUrl(posterUrl?: string | null): string | null {
  if (!posterUrl) return null;
  const trimmed = posterUrl.trim();
  if (!trimmed) return null;

  // Data URLs pass through
  if (trimmed.startsWith("data:")) {
    return trimmed;
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  // External URLs (http/https) are already public; use as-is
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Relative paths - prepend Supabase base
  if (!base) return trimmed;

  if (trimmed.startsWith("/")) {
    return `${base}${trimmed}`;
  }

  return `${base}/storage/v1/object/public/${trimmed}`;
}
