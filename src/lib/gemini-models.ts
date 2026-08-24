export const DEFAULT_GEMINI_PRIMARY_MODEL = "gemini-3.1-flash-lite";
export const DEFAULT_GEMINI_FALLBACK_MODEL = "gemini-flash-latest";
export const DEFAULT_GEMINI_ADVANCED_MODEL = "gemini-3.7-flash";

export type GeminiModelRole = "primary" | "fallback" | "advanced";

export type GeminiModelConfig = Record<GeminiModelRole, string>;

function readModelEnv(name: string, fallback: string) {
  if (typeof process !== "undefined" && process.env && process.env[name]) {
    const val = process.env[name]?.trim();
    // Guard against invalid or deprecated model names in env
    if (val && !val.includes("3.5-flash-lite") && !val.includes("2.0-flash")) {
      return val;
    }
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

export function getGeminiModelForRole(role: GeminiModelRole) {
  return getGeminiModelConfig()[role];
}
