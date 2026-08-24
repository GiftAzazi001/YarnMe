export const DEFAULT_GEMINI_PRIMARY_MODEL = "gemini-3.1-flash-lite";
export const DEFAULT_GEMINI_FALLBACK_MODEL = "gemini-flash-latest";
export const DEFAULT_GEMINI_ADVANCED_MODEL = "gemini-3.7-flash";

export type GeminiModelRole = "primary" | "fallback" | "advanced";

export type GeminiModelConfig = Record<GeminiModelRole, string>;

function normalizeModelName(rawName: string | undefined, fallback: string): string {
  if (!rawName) return fallback;
  const name = rawName.trim().toLowerCase();
  
  // Normalization for aliases / common typos
  if (name.includes("3.5-flash-lite") || name === "3.5 flash lite") {
    return "gemini-3.1-flash-lite";
  }
  if (name === "flash-lite" || name === "gemini-flash-lite" || name === "flash lite") {
    return "gemini-3.1-flash-lite";
  }
  if (name === "flash" || name === "gemini-flash" || name === "gemini flash") {
    return "gemini-flash-latest";
  }
  if (name.includes("2.0-flash") || name.includes("1.5-flash")) {
    return "gemini-flash-latest";
  }
  return rawName.trim();
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
