import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function unCamel(str: string): string {
  if (!str) return "";
  const result = str.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
}

export function obtainTranslatedType(str: string): string | null {
  if (str.includes("ex")) {
    return "exhibition";
  } else if (str.includes("obra")) {
    return "artwork";
  } else if (str.includes("dispositivo")) {
    return "inscription device";
  } else if (str.includes("inst")) {
    return "institution";
  } else if (str.includes("person") || str.includes("actant")) {
    return "actor";
  }
  return null;
}

export function cleanLabel(label: string): string {
  if (!label) return "";
  // If label contains " (http", it might be "Name (URI) ..."
  // We want to extract "Name"
  const uriMatch = label.match(/^(.*?)\s*\(https?:\/\//);
  if (uriMatch && uriMatch[1]) {
    return uriMatch[1].trim();
  }
  
  // If label contains " was ", take the part before it
  const wasMatch = label.match(/^(.*?)\s+was\s+/);
  if (wasMatch && wasMatch[1]) {
      // Check if it also has a URI pattern we missed or if this is cleaner
      return wasMatch[1].trim();
  }

  return label;
}
