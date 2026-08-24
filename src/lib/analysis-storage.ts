import {
  type AnalyzeResponse,
  type LanguageCode,
  type PendingAnalysis,
  pendingAnalysisSchema,
} from "@/lib/analysis";
import {
  normalizeStoredAnalysisForDisplay,
  type NormalizedStoredAnalysis,
} from "@/lib/analysis-normalization";

const PENDING_KEY = "yarnme:pending-analysis";
const RESULT_KEY = "yarnme:analysis-result";

// In-memory fallback in case browser storage is restricted or throws SecurityError
let inMemoryPending: PendingAnalysis | null = null;
let inMemoryResult: NormalizedStoredAnalysis | null = null;

function safeGetItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const sessionVal = window.sessionStorage?.getItem(key);
    if (sessionVal) return sessionVal;
  } catch {
    // Session storage restricted
  }
  try {
    const localVal = window.localStorage?.getItem(key);
    if (localVal) return localVal;
  } catch {
    // Local storage restricted
  }
  return null;
}

function safeSetItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage?.setItem(key, value);
  } catch {
    // Ignore session storage error
  }
  try {
    window.localStorage?.setItem(key, value);
  } catch {
    // Ignore local storage error
  }
}

function safeRemoveItem(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage?.removeItem(key);
  } catch {
    // Ignore
  }
  try {
    window.localStorage?.removeItem(key);
  } catch {
    // Ignore
  }
}

export function savePendingAnalysis(sourceText: string, language: LanguageCode) {
  const pendingObj: PendingAnalysis = {
    sourceText,
    language,
    createdAt: new Date().toISOString(),
  };
  inMemoryPending = pendingObj;
  safeSetItem(PENDING_KEY, JSON.stringify(pendingObj));
}

export function readPendingAnalysis(): PendingAnalysis | null {
  if (inMemoryPending) {
    return inMemoryPending;
  }
  const raw = safeGetItem(PENDING_KEY);
  if (!raw) return null;
  try {
    const parsed = pendingAnalysisSchema.parse(JSON.parse(raw));
    inMemoryPending = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingAnalysis() {
  inMemoryPending = null;
  safeRemoveItem(PENDING_KEY);
}

export function saveAnalysisResult(result: AnalyzeResponse) {
  const normalized = normalizeStoredAnalysisForDisplay({
    ...result,
    createdAt: new Date().toISOString(),
  });
  if (normalized) {
    inMemoryResult = normalized;
  }
  safeSetItem(
    RESULT_KEY,
    JSON.stringify({
      ...result,
      createdAt: new Date().toISOString(),
    }),
  );
}

export function readAnalysisResult(): NormalizedStoredAnalysis | null {
  if (inMemoryResult) {
    return inMemoryResult;
  }
  const raw = safeGetItem(RESULT_KEY);
  if (!raw) return null;
  try {
    const result = normalizeStoredAnalysisForDisplay(JSON.parse(raw));
    if (!result) {
      clearAnalysisResult();
      return null;
    }
    inMemoryResult = result;
    return result;
  } catch {
    clearAnalysisResult();
    return null;
  }
}

export function clearAnalysisResult() {
  inMemoryResult = null;
  safeRemoveItem(RESULT_KEY);
}
