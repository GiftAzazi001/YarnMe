import {
  type AnalyzeResponse,
  type LanguageCode,
  pendingAnalysisSchema,
} from "@/lib/analysis";
import {
  normalizeStoredAnalysisForDisplay,
  type NormalizedStoredAnalysis,
} from "@/lib/analysis-normalization";

const PENDING_KEY = "yarnme:pending-analysis";
const RESULT_KEY = "yarnme:analysis-result";

export function savePendingAnalysis(sourceText: string, language: LanguageCode) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    PENDING_KEY,
    JSON.stringify({
      sourceText,
      language,
      createdAt: new Date().toISOString(),
    }),
  );
}

export function readPendingAnalysis() {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(PENDING_KEY);
  if (!raw) return null;
  try {
    return pendingAnalysisSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearPendingAnalysis() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PENDING_KEY);
}

export function saveAnalysisResult(result: AnalyzeResponse) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    RESULT_KEY,
    JSON.stringify({
      ...result,
      createdAt: new Date().toISOString(),
    }),
  );
}

export function readAnalysisResult(): NormalizedStoredAnalysis | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(RESULT_KEY);
  if (!raw) return null;
  try {
    const result = normalizeStoredAnalysisForDisplay(JSON.parse(raw));
    if (!result) {
      clearAnalysisResult();
      return null;
    }
    return result;
  } catch {
    clearAnalysisResult();
    return null;
  }
}

export function clearAnalysisResult() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(RESULT_KEY);
}
