export const DEFAULT_GEMINI_PRIMARY_MODEL = "gemini-3.1-flash-lite";
export const DEFAULT_GEMINI_FALLBACK_MODEL = "gemini-3.1-flash-lite";
export const DEFAULT_GEMINI_ADVANCED_MODEL = "gemini-3.7-flash";

export type GeminiModelRole = "primary" | "fallback" | "advanced";

export type GeminiModelConfig = Record<GeminiModelRole, string>;

const KNOWN_VALID_MODELS = new Set([
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.7-flash",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
]);

export function normalizeModelName(rawName: string | undefined, fallback: string): string {
  if (!rawName) return fallback;
  const name = rawName.trim().toLowerCase();

  // If the env variable accidentally contains an API key, auth token, or garbage
  if (
    name.startsWith("aq.") ||
    name.startsWith("aiza") ||
    name.includes(" ") && !name.includes("flash") ||
    name.length > 35 && name.includes("_") ||
    name.includes("/") && !name.startsWith("models/")
  ) {
    return fallback;
  }

  // Normalization for aliases and common user inputs
  if (
    name.includes("3.5-flash-lite") ||
    name.includes("3.5 flash lite") ||
    name.includes("3.1-flash-lite") ||
    name.includes("flash-lite") ||
    name.includes("flash lite") ||
    name === "gemini-flash-lite"
  ) {
    return "gemini-3.1-flash-lite";
  }

  if (name.includes("3.7-flash") || name.includes("3.7 flash")) {
    return "gemini-3.7-flash";
  }

  if (
    name === "gemini-flash-latest" ||
    name === "flash-latest" ||
    name === "gemini-2.5-flash" ||
    name === "gemini-flash" ||
    name === "flash"
  ) {
    return "gemini-flash-latest";
  }

  if (name.includes("pro")) {
    return "gemini-2.5-pro";
  }

  if (KNOWN_VALID_MODELS.has(rawName.trim())) {
    return rawName.trim();
  }

  return fallback;
}

function readModelEnv(name: string, fallback: string): string {
  if (typeof process !== "undefined" && process.env && process.env[name]) {
    return normalizeModelName(process.env[name], fallback);
  }
  return fallback;
}

export function getGeminiModelConfig(): GeminiModelConfig {
  return {
    primary: readModelEnv(
      "GEMINI_PRIMARY_MODEL",
      DEFAULT_GEMINI_PRIMARY_MODEL,
    ),
    fallback: readModelEnv(
      "GEMINI_FALLBACK_MODEL",
      DEFAULT_GEMINI_FALLBACK_MODEL,
    ),
    advanced: readModelEnv(
      "GEMINI_ADVANCED_MODEL",
      DEFAULT_GEMINI_ADVANCED_MODEL,
    ),
  };
}

export function getGeminiModelForRole(role: GeminiModelRole): string {
  return getGeminiModelConfig()[role];
}
