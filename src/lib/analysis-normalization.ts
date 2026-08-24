import {
  languageSchema,
  storedAnalysisSchema,
  type AnalysisResult,
  type LanguageCode,
  type StoredAnalysis,
} from "@/lib/analysis";

type UnknownRecord = Record<string, unknown>;

export type NormalizedAnalysis = AnalysisResult & {
  legacyRequirements: string[];
};

export type NormalizedStoredAnalysis = Omit<StoredAnalysis, "analysis"> & {
  analysis: NormalizedAnalysis;
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? cleanStoredText(value) : "";
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((item) => normalizeText(item))
        .filter((item) => item.length > 0),
    ),
  );
}

function cleanStoredText(value: string) {
  return value
    .trim()
    .replace(/^(?:svg\s+)+/i, "")
    .replace(/^(?:(?:[-*•]|\d+[\).])\s+)+/, "")
    .trim();
}

function normalizeDates(value: unknown): AnalysisResult["dates"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const date = normalizeText(item.date);
      const context = normalizeText(item.context);
      if (!date || !context) return null;
      return { date, context };
    })
    .filter((item): item is AnalysisResult["dates"][number] => item !== null);
}

function normalizePayments(value: unknown): AnalysisResult["payments"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      return {
        amount: normalizeText(item.amount),
        purpose: normalizeText(item.purpose),
        when: normalizeText(item.when),
        who: normalizeText(item.who),
      };
    })
    .filter((item): item is AnalysisResult["payments"][number] => item !== null);
}

function normalizeUncertainties(value: unknown): AnalysisResult["uncertainties"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const text = normalizeText(item.text);
      const reason = normalizeText(item.reason);
      if (!text || !reason) return null;
      return { text, reason };
    })
    .filter(
      (item): item is AnalysisResult["uncertainties"][number] => item !== null,
    );
}

export function normalizeAnalysisForDisplay(
  value: unknown,
): NormalizedAnalysis | null {
  if (!isRecord(value)) return null;
  return {
    meaning: normalizeText(value.meaning),
    audience: normalizeText(value.audience),
    eligibility: normalizeStringArray(value.eligibility),
    actions: normalizeStringArray(value.actions),
    documents: normalizeStringArray(value.documents),
    payments: normalizePayments(value.payments),
    dates: normalizeDates(value.dates),
    warnings: normalizeStringArray(value.warnings),
    uncertainties: normalizeUncertainties(value.uncertainties),
    sourceLimitations: normalizeStringArray(value.sourceLimitations),
    legacyRequirements: normalizeStringArray(value.requirements),
  };
}

function hasDisplayableAnalysis(analysis: NormalizedAnalysis) {
  return (
    analysis.meaning.length > 0 ||
    analysis.audience.length > 0 ||
    analysis.eligibility.length > 0 ||
    analysis.actions.length > 0 ||
    analysis.documents.length > 0 ||
    analysis.legacyRequirements.length > 0 ||
    analysis.payments.length > 0 ||
    analysis.dates.length > 0 ||
    analysis.warnings.length > 0 ||
    analysis.uncertainties.length > 0 ||
    analysis.sourceLimitations.length > 0
  );
}

function normalizeLanguage(value: unknown): LanguageCode | null {
  const parsed = languageSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function normalizeCreatedAt(value: unknown) {
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  return new Date().toISOString();
}

export function normalizeStoredAnalysisForDisplay(
  value: unknown,
): NormalizedStoredAnalysis | null {
  const current = storedAnalysisSchema.safeParse(value);
  if (current.success) {
    const analysis = normalizeAnalysisForDisplay(current.data.analysis);
    if (!analysis) return null;
    return {
      ...current.data,
      analysis: {
        ...analysis,
        legacyRequirements: [],
      },
    };
  }

  if (!isRecord(value) || !isRecord(value.analysis)) return null;

  const language = normalizeLanguage(value.language);
  if (!language) return null;

  const analysis = normalizeAnalysisForDisplay(value.analysis);
  if (!analysis) return null;

  if (!hasDisplayableAnalysis(analysis)) return null;

  return {
    analysis,
    language,
    sourceText: typeof value.sourceText === "string" ? value.sourceText : "",
    model: typeof value.model === "string" ? value.model : undefined,
    createdAt: normalizeCreatedAt(value.createdAt),
  };
}
