"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  type AnalyzeResponse,
  type LanguageCode,
  analyzeResponseSchema,
} from "@/lib/analysis";
import {
  normalizeStoredAnalysisForDisplay,
  type NormalizedStoredAnalysis,
} from "@/lib/analysis-normalization";
import { devTestInputs } from "@/lib/dev-test-inputs";

export type QAMessage = {
  id: string;
  question: string;
  answer: string;
};

interface YarnContextType {
  sourceText: string;
  setSourceText: (text: string) => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  isAnalyzing: boolean;
  analysisResult: NormalizedStoredAnalysis | null;
  setAnalysisResult: (res: NormalizedStoredAnalysis | null) => void;
  error: string | null;
  setError: (err: string | null) => void;
  qaHistory: QAMessage[];
  setQaHistory: React.Dispatch<React.SetStateAction<QAMessage[]>>;
  historyList: NormalizedStoredAnalysis[];
  runAnalysis: (text?: string, lang?: LanguageCode) => Promise<boolean>;
  switchLanguage: (newLang: LanguageCode) => Promise<boolean>;
  askQuestion: (question: string) => Promise<string | null>;
  resetAll: () => void;
  loadSample: (index?: number) => void;
}

const YarnContext = createContext<YarnContextType | null>(null);

const STORAGE_RESULT_KEY = "yarnme:current-result";
const STORAGE_HISTORY_KEY = "yarnme:history-list";
const STORAGE_PREF_LANG = "yarnme:preferred-language";

function safeStorageGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const s = window.sessionStorage?.getItem(key);
    if (s) return s;
  } catch {}
  try {
    const l = window.localStorage?.getItem(key);
    if (l) return l;
  } catch {}
  return null;
}

function safeStorageSet(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage?.setItem(key, value);
  } catch {}
  try {
    window.localStorage?.setItem(key, value);
  } catch {}
}

export function YarnProvider({ children }: { children: React.ReactNode }) {
  const [sourceText, setSourceText] = useState("");
  const [language, setLanguage] = useState<LanguageCode>("simple-english");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<NormalizedStoredAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qaHistory, setQaHistory] = useState<QAMessage[]>([]);
  const [historyList, setHistoryList] = useState<NormalizedStoredAnalysis[]>([]);

  // Initial load from storage on client mount
  useEffect(() => {
    try {
      const savedLang = safeStorageGet(STORAGE_PREF_LANG) as LanguageCode | null;
      if (savedLang && (savedLang === "simple-english" || savedLang === "pidgin" || savedLang === "hausa")) {
        setLanguage(savedLang);
      }

      const savedResultRaw = safeStorageGet(STORAGE_RESULT_KEY);
      if (savedResultRaw) {
        const parsed = JSON.parse(savedResultRaw);
        const normalized = normalizeStoredAnalysisForDisplay(parsed);
        if (normalized) {
          setAnalysisResult(normalized);
          setSourceText(normalized.sourceText || "");
        }
      }

      const savedHistoryRaw = safeStorageGet(STORAGE_HISTORY_KEY);
      if (savedHistoryRaw) {
        const list = JSON.parse(savedHistoryRaw);
        if (Array.isArray(list)) {
          const normalizedList = list
            .map((item) => normalizeStoredAnalysisForDisplay(item))
            .filter((item): item is NormalizedStoredAnalysis => item !== null);
          setHistoryList(normalizedList);
        }
      }
    } catch (e) {
      console.warn("Storage init warning:", e);
    }
  }, []);

  const saveToHistory = useCallback((newResult: NormalizedStoredAnalysis) => {
    setHistoryList((prev) => {
      const filtered = prev.filter(
        (item) =>
          item.sourceText.trim().toLowerCase() !==
          newResult.sourceText.trim().toLowerCase(),
      );
      const updated = [newResult, ...filtered].slice(0, 20);
      try {
        safeStorageSet(STORAGE_HISTORY_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const runAnalysis = useCallback(
    async (textToAnalyze?: string, targetLang?: LanguageCode): Promise<boolean> => {
      const activeText = (textToAnalyze ?? sourceText).trim();
      const activeLang = targetLang ?? language;

      if (!activeText) {
        setError("Please enter or paste your notice first.");
        return false;
      }

      setIsAnalyzing(true);
      setError(null);
      setQaHistory([]);

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceText: activeText,
            language: activeLang,
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const errorMsg =
            data && typeof data === "object" && "error" in data && typeof data.error === "string"
              ? data.error
              : "YarnMe could not explain this notice right now. Please try again.";
          setError(errorMsg);
          setIsAnalyzing(false);
          return false;
        }

        const parsed = analyzeResponseSchema.safeParse(data);
        if (!parsed.success) {
          setError("Received an unexpected format from the server. Please try again.");
          setIsAnalyzing(false);
          return false;
        }

        const normalized = normalizeStoredAnalysisForDisplay({
          ...parsed.data,
          createdAt: new Date().toISOString(),
        });

        if (!normalized) {
          setError("Could not parse the explanation response.");
          setIsAnalyzing(false);
          return false;
        }

        setAnalysisResult(normalized);
        setSourceText(activeText);
        setLanguage(activeLang);

        safeStorageSet(STORAGE_RESULT_KEY, JSON.stringify(normalized));
        saveToHistory(normalized);

        setIsAnalyzing(false);
        return true;
      } catch (err: unknown) {
        console.error("Analysis execution failed:", err);
        setError("Could not connect to YarnMe server. Please check your internet connection.");
        setIsAnalyzing(false);
        return false;
      }
    },
    [sourceText, language, saveToHistory],
  );

  const switchLanguage = useCallback(
    async (newLang: LanguageCode): Promise<boolean> => {
      if (!analysisResult) return false;
      if (analysisResult.language === newLang) return true;

      setLanguage(newLang);
      safeStorageSet(STORAGE_PREF_LANG, newLang);
      return runAnalysis(analysisResult.sourceText, newLang);
    },
    [analysisResult, runAnalysis],
  );

  const askQuestion = useCallback(
    async (question: string): Promise<string | null> => {
      if (!analysisResult || !question.trim()) return null;

      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceText: analysisResult.sourceText,
            language: analysisResult.language,
            question: question.trim(),
            meaning: analysisResult.analysis.meaning,
          }),
        });

        const data = await res.json().catch(() => null);
        if (res.ok && data?.answer) {
          const newMsg: QAMessage = {
            id: `${Date.now()}`,
            question: question.trim(),
            answer: data.answer,
          };
          setQaHistory((prev) => [...prev, newMsg]);
          return data.answer;
        }
        return null;
      } catch (err) {
        console.error("Ask question error:", err);
        return null;
      }
    },
    [analysisResult],
  );

  const resetAll = useCallback(() => {
    setAnalysisResult(null);
    setSourceText("");
    setError(null);
    setQaHistory([]);
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage?.removeItem(STORAGE_RESULT_KEY);
        window.localStorage?.removeItem(STORAGE_RESULT_KEY);
      }
    } catch {}
  }, []);

  const loadSample = useCallback(
    (index: number = 0) => {
      const sample = devTestInputs[index] || devTestInputs[0];
      setSourceText(sample.text);
      setError(null);
    },
    [],
  );

  return (
    <YarnContext.Provider
      value={{
        sourceText,
        setSourceText,
        language,
        setLanguage: (lang) => {
          setLanguage(lang);
          safeStorageSet(STORAGE_PREF_LANG, lang);
        },
        isAnalyzing,
        analysisResult,
        setAnalysisResult,
        error,
        setError,
        qaHistory,
        setQaHistory,
        historyList,
        runAnalysis,
        switchLanguage,
        askQuestion,
        resetAll,
        loadSample,
      }}
    >
      {children}
    </YarnContext.Provider>
  );
}

export function useYarnContext() {
  const context = useContext(YarnContext);
  if (!context) {
    throw new Error("useYarnContext must be used within a YarnProvider");
  }
  return context;
}
