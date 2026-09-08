import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const REQUIRED_KEYS = [
  "explanation",
  "predicted_next_move",
  "remediation_script",
] as const;

const SYSTEM_PROMPT = `You are an elite SOC (Security Operations Center) Analyst with deep expertise in the MITRE ATT&CK framework, intrusion detection, and incident response.

Your task:
1. Read the server log text provided by the user.
2. Identify the attack pattern, source IP / actor, and the most likely MITRE ATT&CK technique.
3. Predict the attacker's probable next move using MITRE tactics.
4. Suggest a precise remediation command (bash — e.g. ufw, iptables) to block or mitigate the threat.

CRITICAL OUTPUT RULES — you MUST follow every one:
• Respond with **ONLY** a single, valid JSON object.
• Do NOT wrap the JSON in markdown code fences (\`\`\`json … \`\`\` or \`\`\` … \`\`\`).
• Do NOT include any text before or after the JSON object — no greetings, no explanations, no commentary.
• The JSON object must contain EXACTLY these three keys (no more, no fewer):
  - "explanation"          → A plain-English, 2-sentence summary of the attack.
  - "predicted_next_move"  → The MITRE tactic/technique the attacker will likely try next.
  - "remediation_script"   → The exact bash command to block/mitigate the threat.
• All three values must be non-empty strings.`;

const RETRY_PROMPT =
  "Your previous response was not valid JSON. Return ONLY the JSON object with exactly three keys: explanation, predicted_next_move, remediation_script. No markdown, no commentary, nothing else.";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strip markdown code fences that Gemini sometimes wraps around JSON output.
 */
function stripCodeFences(raw: string): string {
  let text = raw.trim();
  // Remove ```json ... ``` or ``` ... ```
  if (text.startsWith("```")) {
    // Remove opening fence (with optional language tag)
    text = text.replace(/^```(?:json)?\s*\n?/, "");
    // Remove closing fence
    text = text.replace(/\n?```\s*$/, "");
  }
  return text.trim();
}

/**
 * Validate that the parsed object has all required keys as non-empty strings.
 */
function validateSchema(
  obj: unknown
): obj is Record<(typeof REQUIRED_KEYS)[number], string> {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return false;
  }
  const record = obj as Record<string, unknown>;
  return REQUIRED_KEYS.every(
    (key) => typeof record[key] === "string" && record[key] !== ""
  );
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    // 1. Parse & validate request body -----------------------------------------
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    const { log_text } = body as { log_text?: unknown };

    if (!log_text || typeof log_text !== "string" || log_text.trim() === "") {
      return NextResponse.json(
        { error: "log_text is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    // 2. Validate API key ------------------------------------------------------
    const apiKey = process.env.GEMINI_API_KEY;
    if (
      !apiKey ||
      apiKey === "your_placeholder_key_here" ||
      apiKey.trim() === ""
    ) {
      console.error(
        "[investigate] GEMINI_API_KEY is missing or still set to the placeholder value."
      );
      return NextResponse.json(
        {
          error:
            "Server misconfiguration: GEMINI_API_KEY is not set. Please configure a valid API key in .env.local.",
        },
        { status: 500 }
      );
    }

    // 3. Initialise Gemini client & model --------------------------------------
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_PROMPT,
    });

    // 4. First attempt ---------------------------------------------------------
    let rawText: string;
    try {
      const result = await model.generateContent(log_text.trim());
      rawText = result.response.text();
    } catch (sdkError) {
      console.error("[investigate] Gemini SDK error:", sdkError);
      return NextResponse.json(
        { error: "Internal server error." },
        { status: 500 }
      );
    }

    let cleaned = stripCodeFences(rawText);
    let parsed: unknown;

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // 5. Retry once with stricter prompt -------------------------------------
      console.warn(
        "[investigate] First Gemini response was not valid JSON. Retrying…"
      );
      try {
        const retryResult = await model.generateContent(
          `${RETRY_PROMPT}\n\nOriginal log:\n${log_text.trim()}`
        );
        const retryRaw = retryResult.response.text();
        cleaned = stripCodeFences(retryRaw);
        parsed = JSON.parse(cleaned);
      } catch (retryError) {
        console.error("[investigate] Retry also failed:", retryError);
        return NextResponse.json(
          {
            error: "Model did not return valid JSON.",
            raw: rawText,
          },
          { status: 502 }
        );
      }
    }

    // 6. Schema validation -----------------------------------------------------
    if (!validateSchema(parsed)) {
      console.warn(
        "[investigate] Parsed JSON does not match expected schema:",
        parsed
      );
      return NextResponse.json(
        {
          error: "Model did not return valid JSON.",
          raw: rawText,
        },
        { status: 502 }
      );
    }

    // 7. Success ---------------------------------------------------------------
    return NextResponse.json(parsed, { status: 200 });
  } catch (err) {
    console.error("[investigate] Unhandled error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
