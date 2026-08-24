import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import { z } from "zod";
import {
  analysisJsonSchema,
  analysisResultSchema,
  analyzeRequestSchema,
  analyzeResponseSchema,
  languageNames,
  languageSchema,
  type AnalysisResult,
  type LanguageCode,
} from "../lib/analysis.ts";
import {
  getGeminiModelConfig,
  type GeminiModelRole,
} from "../lib/gemini-models.ts";

const TIMEOUT_MS = 30000;
const TRANSIENT_GEMINI_STATUSES = new Set([429, 500, 502, 503, 504]);

const languageInstructions: Record<LanguageCode, string> = {
  "simple-english": `Simple English rules:
- Write in short, everyday Simple English sentences.
- Translate and explain any complex legal, bureaucratic, or academic jargon into plain everyday words.
- Ensure all dates, payments, and actions are crystal clear and easy to follow.`,
  pidgin: `Nigerian Pidgin language rules:
- Nigerian Pidgin must be used across EVERY explanatory field (meaning, audience, eligibility, actions, documents, payments.purpose, payments.when, payments.who, dates.context, warnings, uncertainties.reason, sourceLimitations).
- Do NOT leave payment purpose, payment when, payment who, dates context, or required documents in standard English.
- Translate required documents, statements, essays, and forms completely into natural Pidgin:
  * "Short statement of not more than 250 words explaining why you want to participate" -> "Short statement wey no pass 250 words wey dey explain why you wan join/participate"
  * "Statement of purpose" -> "Letter wey explain why you dey apply"
  * "Court Affidavit" -> "Court Affidavit (takarda wey you swear for court)"
  * "recent colored passport photograph" -> "Recent color passport photo"
  * "registration fee" -> "Money for registration"
  * "application fee" -> "Money to apply"
  * "before 30th August 2026" -> "Before 30th August 2026"
  * "at the bank" -> "For bank"
  * "Deadline for submission" -> "Last day to submit documents"
  * "Scheduled power outage for maintenance of transmission lines" -> "Time wey dem go off light so dem fit repair transmission lines"
  * "turn off electrical appliances" -> "Make you off electrical appliances wey fit spoil"
- Prefer natural Nigerian Pidgin phrasing (e.g. "People wey dey apply" instead of "Applicants").
- Keep the tone clear, respectful, practical, and Nigerian. Avoid comedic exaggeration or forced street slang.
- Retain official acronyms (JAMB, WAEC, NYSC, ARCON, NIA, B.Sc., M.Sc., HND) and URLs in their standard forms.`,
  hausa: `Hausa language rules:
- Hausa must be used across EVERY single explanatory field (meaning, audience, eligibility, actions, documents, payments.purpose, payments.when, payments.who, dates.context, warnings, uncertainties.reason, sourceLimitations).
- Do NOT mix English sentences, English document descriptions, English subject names, or English words in parentheses (e.g. write "Lissafi" and "Harshen Turanci", do NOT write "Lissafi (Mathematics)" or "Turanci (English Language)").
- Translate required documents, essays, statements, certificates, and forms completely into natural Hausa:
  * "Short statement of not more than 250 words explaining why you want to participate" -> "Takaitaccen rubutun bayani da bai wuce kalmomi 250 ba da ke bayyana dalilin da ya sa kake son shiga"
  * "Statement of purpose" -> "Takardar bayyana makasudi da dalilin nema"
  * "Curriculum Vitae / Resume" -> "Takardar tarihin karatu da aiki (CV)"
  * "Court Affidavit" -> "Takardar rantsuwa ta kotu (Affidavit)"
  * "recent colored passport photograph" -> "Sabon hoton fasfo mai launi da aka dauka a kwanan nan"
  * "Mathematics" -> "Lissafi"
  * "English Language" -> "Harshen Turanci"
  * "credits / credit passes" -> "darajar kiredit / kyakkyawan sakamako"
  * "two sittings" -> "zama biyu (watau sau biyu a jarabawa)"
  * "stepped down / rejected" -> "a ki amincewa da ita / a ajiye ta a gefe"
  * "registration fee" -> "Kudin rajista"
  * "application fee" -> "Kudin cika fom / neman shiga"
  * "examination fee" -> "Kudin jarrabawa"
  * "before 30th August 2026" -> "Kafin ranar 30 ga watan Agusta, 2026"
  * "at the bank" -> "A banki"
  * "Deadline for submission" -> "Ranar karshe ta mika takardu"
  * "Scheduled power outage for maintenance of transmission lines" -> "Lokacin da za a yanke wutar lantarki domin yin gyara a layukan wuta"
  * "turn off electrical appliances" -> "A kashe kayan wutar lantarki masu saukin lalacewa"
- Prefer natural, modern, conversational Hausa that is clear, respectful, and easy for any Hausa speaker to understand.
- Retain only proper nouns and official acronyms (e.g., JAMB, WAEC, NECO, NYSC, ARCON) and URLs in their standard forms.`,
};

const incompleteSourceCopy: Record<
  LanguageCode,
  {
    limitation: string;
    reason: string;
  }
> = {
  "simple-english": {
    limitation:
      "The supplied notice appears incomplete. Some lines are cut off, so YarnMe has only explained information that is clearly visible.",
    reason:
      "This passage appears incomplete or cut off, so YarnMe cannot safely infer the missing words.",
  },
  pidgin: {
    limitation:
      "Some part of this information look like say dem cut off or no complete. YarnMe no go guess the part wey no show. YarnMe explain only the parts wey clear for the source.",
    reason:
      "This part no complete or e cut off, so YarnMe no fit safely guess the words wey no show.",
  },
  hausa: {
    limitation:
      "Wasu sassan wannan bayanin sun yanke ko ba su cika ba. YarnMe ba zai yi hasashen bayanin da ya bace ba. YarnMe ya yi bayani ne kawai kan abin da ya bayyana a rubutun.",
    reason:
      "Wannan sashe ya yanke ko bai cika ba, don haka YarnMe ba zai yi hasashen kalmomin da suka bace ba.",
  },
};

type ErrorRecord = Record<string, unknown>;

type GeminiErrorInfo = {
  name: string;
  message: string;
  upstreamStatus?: number;
  upstreamStatusText?: string;
  code?: string | number;
  retryAfterMs?: number;
  isAbort: boolean;
};

class GeminiRequestError extends Error {
  info: GeminiErrorInfo;
  constructor(info: GeminiErrorInfo) {
    super(info.message);
    this.name = "GeminiRequestError";
    this.info = info;
  }
}

type GeminiAttemptOptions = {
  modelRole: Exclude<GeminiModelRole, "advanced">;
};

function buildPrompt(sourceText: string, language: LanguageCode) {
  return `You are YarnMe, an expert explanation and translation assistant for Nigerian users.
Translate and explain the supplied source text into ${languageNames[language]} so the user clearly understands:
- What it means in plain terms;
- Who it concerns;
- Eligibility conditions;
- What they need to do (step-by-step actions);
- Documents or items they need;
- Payments or fees (amount, purpose, when, and who);
- Important dates and their context;
- Warnings or conditions.

Target Language: ${languageNames[language]}.
ALL EXPLANATORY AND EXTRACTED FIELDS IN THE JSON MUST BE IN ${languageNames[language].toUpperCase()}.
${languageInstructions[language]}

Rules:
- Faithfully preserve genuine facts, numbers, dates, amounts, and institutional acronyms.
- Translate and explain completely into ${languageNames[language]}.
- Do not invent facts, requirements, exam subjects, or unmentioned fees.
- If an array has no supported items, return an empty array [].
- If the source is truncated or cut off, record cut-off excerpts in uncertainties and sourceLimitations.
- Return valid JSON matching the schema. Do not use markdown formatting.

Source text:
"""
${sourceText}
"""`;
}

export const askRequestSchema = z.object({
  sourceText: z.string().trim().min(1, "Source text is required."),
  language: languageSchema,
  question: z.string().trim().min(1, "Question is required."),
  meaning: z.string().optional(),
});

function buildAskPrompt(
  sourceText: string,
  question: string,
  language: LanguageCode,
  meaning?: string,
) {
  return `You are YarnMe, a helpful assistant answering a question about a notice/text for a Nigerian user.
Source text:
"""
${sourceText}
"""
${meaning ? `Existing explanation: "${meaning}"` : ""}

User question: "${question}"
Target Language: ${languageNames[language]}.

Instructions:
- Answer the user's question directly, clearly, and concisely in ${languageNames[language]}.
- Keep the answer strictly grounded in the source text. Do not invent details not present in the source.
- If the source text does not contain the answer, politely state in ${languageNames[language]} that the provided text does not mention this detail.
- Keep the response friendly, respectful, and easy to understand.
- Return ONLY the answer as plain text.`;
}

function parseJsonText(text: string) {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(withoutFence);
}

type IncompleteSourceIssue = {
  text: string;
  reason: string;
};

function uniqueStrings(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function stripListMarker(item: string) {
  return item
    .trim()
    .replace(/^(?:svg\s+)+/i, "")
    .replace(/^(?:(?:[-*•]|\d+[\).])\s+)+/, "")
    .trim();
}

function normalizeAnalysisLists(analysis: AnalysisResult): AnalysisResult {
  return {
    ...analysis,
    eligibility: uniqueStrings(analysis.eligibility.map(stripListMarker)),
    actions: uniqueStrings(analysis.actions.map(stripListMarker)),
    documents: uniqueStrings(analysis.documents.map(stripListMarker)),
    payments: analysis.payments.map((payment) => ({
      amount: stripListMarker(payment.amount),
      purpose: stripListMarker(payment.purpose),
      when: stripListMarker(payment.when),
      who: stripListMarker(payment.who),
    })),
    warnings: uniqueStrings(analysis.warnings.map(stripListMarker)),
    sourceLimitations: uniqueStrings(
      analysis.sourceLimitations.map(stripListMarker),
    ),
  };
}

function snippet(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 180 ? `${normalized.slice(0, 180)}...` : normalized;
}

function detectIncompleteSourceIssues(sourceText: string): IncompleteSourceIssue[] {
  const issues: IncompleteSourceIssue[] = [];
  const lines = sourceText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const trimmedSource = sourceText.trim();

  function addIssue(text: string, reason: string) {
    const issueText = snippet(text);
    if (
      !issueText ||
      issues.some((issue) => issue.text.toLowerCase() === issueText.toLowerCase())
    ) {
      return;
    }
    issues.push({ text: issueText, reason });
  }

  for (const line of lines) {
    if (/^(?:[-*•]|\d+[\).])\s*$/.test(line)) {
      addIssue(line, "A list item appears to have no visible content.");
    }
    if (/[,:;/-]\s*$/.test(line)) {
      addIssue(line, "The line ends in a way that suggests more text may be missing.");
    }
    if (
      /\b(?:and|or|as|of|to|for|with|against|against a|before|after|from|at|on|in|by|not less than|minimum|maximum)\s*$/i.test(
        line,
      )
    ) {
      addIssue(line, "The line ends with a connector or incomplete phrase.");
    }
    if (/(?:\.\.\.|…)\s*$/.test(line)) {
      addIssue(line, "The line ends with an ellipsis, suggesting the text is cut off.");
    }
    if (
      /\b(?:https?:\/\/|www\.|visit|apply at|go to|click|open)\s*:?\s*$/i.test(
        line,
      )
    ) {
      addIssue(line, "A URL or instruction appears to be missing.");
    }
  }

  if (/(?:\.\.\.|…)\s*$/.test(trimmedSource)) {
    addIssue(trimmedSource, "The source ends with an ellipsis.");
  }
  if (/[,:;/-]\s*$/.test(trimmedSource)) {
    addIssue(trimmedSource, "The source appears to end mid-phrase.");
  }
  if (
    /\b(?:and|or|as|of|to|for|with|against|against a|before|after|from|at|on|in|by|minimum|maximum)\s*$/i.test(
      trimmedSource,
    )
  ) {
    addIssue(trimmedSource, "The source ends with a connector or incomplete phrase.");
  }
  if (
    /[,:;]\s*\r?\n\s*(?:as|and|or|with|for|to|before|after|their|his|her|its)\b/i.test(
      sourceText,
    )
  ) {
    addIssue(
      sourceText,
      "A line break after punctuation creates a grammatical fragment that may be missing text.",
    );
  }

  return issues.slice(0, 5);
}

function applyIncompleteSourceSafeguards(
  analysis: AnalysisResult,
  sourceText: string,
  language: LanguageCode,
): AnalysisResult {
  const issues = detectIncompleteSourceIssues(sourceText);
  if (issues.length === 0) return normalizeAnalysisLists(analysis);

  const copy = incompleteSourceCopy[language];
  const existingLimitationText = analysis.sourceLimitations
    .join(" ")
    .toLowerCase();
  const sourceLimitations = existingLimitationText.match(
    /incomplete|cut off|truncated|missing|damaged|ocr|no complete|bai cika|yanke/,
  )
    ? analysis.sourceLimitations
    : [copy.limitation, ...analysis.sourceLimitations];

  const uncertainties = [
    ...analysis.uncertainties,
    ...issues
      .filter(
        (issue) =>
          !analysis.uncertainties.some((item) =>
            item.text.toLowerCase().includes(issue.text.toLowerCase()),
          ),
      )
      .map((issue) => ({
        text: issue.text,
        reason: `${copy.reason} (${issue.reason})`,
      })),
  ];

  return normalizeAnalysisLists({
    ...analysis,
    sourceLimitations,
    uncertainties,
  });
}

function isRecord(value: unknown): value is ErrorRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: ErrorRecord | null, key: string) {
  const value = record?.[key];
  return typeof value === "string" ? value : undefined;
}

function readNumber(record: ErrorRecord | null, key: string) {
  const value = record?.[key];
  return typeof value === "number" ? value : undefined;
}

function parseJsonRecord(value: string | undefined): ErrorRecord | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function parseRetryAfterMs(headerValue: string | undefined): number | undefined {
  if (!headerValue) return undefined;
  const seconds = Number(headerValue);
  if (!Number.isNaN(seconds) && seconds > 0) {
    return Math.min(seconds * 1000, 10000);
  }
  const dateMs = Date.parse(headerValue);
  if (!Number.isNaN(dateMs)) {
    const delta = dateMs - Date.now();
    return delta > 0 ? Math.min(delta, 10000) : undefined;
  }
  return undefined;
}

function redactSecrets(text: string) {
  return text
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, "[REDACTED_GEMINI_API_KEY]")
    .replace(
      /(authorization|x-goog-api-key|api[_-]?key)\s*[:=]\s*["']?[^"',\s}]+/gi,
      "$1=[REDACTED]",
    )
    .replace(/([?&](?:key|api_key|apiKey)=)[^&\s]+/gi, "$1[REDACTED]");
}

function limitDetail(value: string) {
  return value.length > 1200 ? `${value.slice(0, 1200)}...` : value;
}

function extractGeminiErrorInfo(error: unknown): GeminiErrorInfo {
  const errorRecord = isRecord(error) ? error : null;
  const causeRecord = isRecord(errorRecord?.cause) ? errorRecord.cause : null;
  const responseRecord = isRecord(errorRecord?.response)
    ? (errorRecord.response as ErrorRecord)
    : isRecord(errorRecord?.rawResponse)
      ? (errorRecord.rawResponse as ErrorRecord)
      : null;

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown Gemini error";

  const causeMessage = readString(causeRecord, "message");
  const parsedMessage = parseJsonRecord(message);
  const parsedMessageError = isRecord(parsedMessage?.error)
    ? (parsedMessage.error as ErrorRecord)
    : parsedMessage;
  const bodyRecord = parseJsonRecord(readString(errorRecord, "body"));
  const bodyError = isRecord(bodyRecord?.error)
    ? (bodyRecord.error as ErrorRecord)
    : bodyRecord;

  const upstreamStatus =
    readNumber(errorRecord, "status") ??
    readNumber(errorRecord, "statusCode") ??
    readNumber(responseRecord, "status") ??
    readNumber(parsedMessageError, "code") ??
    readNumber(bodyError, "code");

  const upstreamStatusText =
    readString(errorRecord, "statusText") ??
    readString(responseRecord, "statusText") ??
    readString(parsedMessageError, "status") ??
    readString(bodyError, "status");

  const code =
    readString(errorRecord, "code") ??
    readNumber(errorRecord, "code") ??
    readString(causeRecord, "code") ??
    readNumber(causeRecord, "code") ??
    readString(causeRecord, "errno") ??
    readString(parsedMessageError, "status") ??
    readNumber(parsedMessageError, "code") ??
    readString(bodyError, "status") ??
    readNumber(bodyError, "code");

  const retryAfterMs = parseRetryAfterMs(
    (readString(errorRecord?.headers as ErrorRecord, "retry-after") ??
      readString(responseRecord?.headers as ErrorRecord, "retry-after")),
  );

  const name =
    error instanceof Error
      ? error.name
      : readString(errorRecord, "name") ?? "UnknownError";

  const isAbort =
    name === "AbortError" ||
    name === "APIUserAbortError" ||
    message.toLowerCase().includes("aborted");

  return {
    name,
    message: limitDetail(
      redactSecrets(causeMessage ? `${message}; cause: ${causeMessage}` : message),
    ),
    upstreamStatus,
    upstreamStatusText: upstreamStatusText
      ? redactSecrets(upstreamStatusText)
      : undefined,
    code,
    retryAfterMs,
    isAbort,
  };
}

function logGeminiError(
  info: GeminiErrorInfo,
  model: string,
  modelRole: GeminiAttemptOptions["modelRole"],
) {
  console.error("[YarnMe] Gemini request failed", {
    model,
    modelRole,
    fallbackUsed: modelRole === "fallback",
    errorName: info.name,
    errorMessage: info.message,
    upstreamStatus: info.upstreamStatus,
    upstreamStatusText: info.upstreamStatusText,
    errorCode: info.code,
  });
}

function logGeminiFallback(
  primaryModel: string,
  fallbackModel: string,
  info: GeminiErrorInfo,
) {
  console.warn("[YarnMe] Gemini model fallback triggered", {
    primaryModel,
    fallbackModel,
    fallbackUsed: true,
    reason: {
      upstreamStatus: info.upstreamStatus,
      upstreamStatusText: info.upstreamStatusText,
      errorCode: info.code,
    },
  });
}

function isTransientUpstreamFailure(info: GeminiErrorInfo) {
  return (
    typeof info.upstreamStatus === "number" &&
    TRANSIENT_GEMINI_STATUSES.has(info.upstreamStatus)
  );
}

function mapGeminiFailureStatus(info: GeminiErrorInfo) {
  if (info.isAbort) return 504;
  switch (info.upstreamStatus) {
    case 401:
      return 401;
    case 403:
      return 403;
    case 429:
      return 429;
    case 500:
    case 502:
    case 503:
    case 504:
      return 503;
    default:
      return 502;
  }
}

async function generateGeminiContent(
  ai: GoogleGenAI,
  model: string,
  sourceText: string,
  language: LanguageCode,
  options: GeminiAttemptOptions,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    return await ai.models.generateContent({
      model,
      contents: buildPrompt(sourceText, language),
      config: {
        abortSignal: controller.signal,
        responseMimeType: "application/json",
        responseJsonSchema: analysisJsonSchema,
        temperature: 0.1,
      },
    });
  } catch (error) {
    const info = extractGeminiErrorInfo(error);
    logGeminiError(info, model, options.modelRole);
    throw new GeminiRequestError(info);
  } finally {
    clearTimeout(timeout);
  }
}

export async function handleAnalyzeRequest(body: unknown): Promise<{
  status: number;
  data: unknown;
}> {
  const parsedRequest = analyzeRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    const firstIssue = parsedRequest.error.issues[0];
    if (firstIssue?.path[0] === "language") {
      return {
        status: 400,
        data: { error: "Choose Simple English, Pidgin, or Hausa." },
      };
    }
    return {
      status: 400,
      data: {
        error:
          firstIssue?.message || "Paste some text first so YarnMe can explain it.",
      },
    };
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return {
      status: 500,
      data: {
        error: "Gemini is not configured",
        details: "Missing GEMINI_API_KEY on the server.",
      },
    };
  }

  const models = getGeminiModelConfig();
  const { sourceText, language } = parsedRequest.data;
  const ai = new GoogleGenAI({ apiKey });

  try {
    let model = models.primary;
    let geminiResponse: GenerateContentResponse;

    try {
      geminiResponse = await generateGeminiContent(
        ai,
        models.primary,
        sourceText,
        language,
        {
          modelRole: "primary",
        },
      );
    } catch (error) {
      if (
        error instanceof GeminiRequestError &&
        models.primary !== models.fallback &&
        isTransientUpstreamFailure(error.info)
      ) {
        logGeminiFallback(models.primary, models.fallback, error.info);
        model = models.fallback;
        geminiResponse = await generateGeminiContent(
          ai,
          models.fallback,
          sourceText,
          language,
          {
            modelRole: "fallback",
          },
        );
      } else {
        throw error;
      }
    }

    const outputText = geminiResponse.text;
    if (!outputText) {
      return {
        status: 502,
        data: { error: "YarnMe received an unclear AI response. Please try again." },
      };
    }

    let aiJson: unknown;
    try {
      aiJson = parseJsonText(outputText);
    } catch {
      return {
        status: 502,
        data: { error: "YarnMe could not read the AI response clearly. Please try again." },
      };
    }

    const analysis = analysisResultSchema.safeParse(aiJson);
    if (!analysis.success) {
      return {
        status: 502,
        data: { error: "YarnMe could not read the AI response clearly. Please try again." },
      };
    }

    const groundedAnalysis = applyIncompleteSourceSafeguards(
      analysis.data,
      sourceText,
      language,
    );

    const response = analyzeResponseSchema.parse({
      analysis: groundedAnalysis,
      language,
      sourceText,
      model,
    });

    return {
      status: 200,
      data: response,
    };
  } catch (error) {
    if (error instanceof GeminiRequestError) {
      const details = limitDetail(
        [
          `${error.info.name}: ${error.info.message}`,
          error.info.upstreamStatusText
            ? `statusText=${error.info.upstreamStatusText}`
            : "",
          typeof error.info.code !== "undefined"
            ? `code=${String(error.info.code)}`
            : "",
        ]
          .filter(Boolean)
          .join(" | "),
      );

      return {
        status: mapGeminiFailureStatus(error.info),
        data: {
          error: "YarnMe could not explain this right now. Please try again.",
          upstreamStatus: error.info.upstreamStatus ?? null,
          details,
        },
      };
    }

    return {
      status: 502,
      data: {
        error: "YarnMe could not explain this right now. Please try again.",
      },
    };
  }
}

export async function handleAskRequest(body: unknown): Promise<{
  status: number;
  data: unknown;
}> {
  const parsedRequest = askRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    const firstIssue = parsedRequest.error.issues[0];
    return {
      status: 400,
      data: { error: firstIssue?.message || "Invalid question request." },
    };
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return {
      status: 500,
      data: {
        error: "Gemini is not configured",
        details: "Missing GEMINI_API_KEY on the server.",
      },
    };
  }

  const models = getGeminiModelConfig();
  const { sourceText, language, question, meaning } = parsedRequest.data;
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: models.primary,
      contents: buildAskPrompt(sourceText, question, language, meaning),
      config: {
        temperature: 0.2,
      },
    });

    const answer = response.text?.trim();
    if (!answer) {
      return {
        status: 502,
        data: { error: "Could not generate an answer right now." },
      };
    }

    return {
      status: 200,
      data: { answer },
    };
  } catch (error) {
    console.error("[YarnMe] Follow-up question error:", error);
    return {
      status: 500,
      data: { error: "Failed to answer the question right now." },
    };
  }
}
