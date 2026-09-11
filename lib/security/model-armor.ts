/**
 * lib/security/model-armor.ts
 *
 * Active Security Firewall utilizing Google Cloud Model Armor.
 * Sanitizes input prompts against prompt injections/jailbreaks and
 * redacts sensitive PII (emails, phone numbers, SSNs, tokens) from LLM outputs.
 */

export interface ModelArmorSanitizeResult {
  /**
   * Indicates whether the input passed all Model Armor security checks.
   */
  isSafe: boolean;
  /**
   * The sanitized prompt text (or original text if no modifications were made).
   */
  sanitizedText: string;
  /**
   * List of specific policy violations detected (e.g. Prompt Injection, Jailbreak).
   */
  violations: string[];
}

/**
 * Inspects incoming user prompts, resume extractions, or chat inputs for
 * prompt injection attacks and jailbreak attempts using Google Cloud Model Armor.
 *
 * @param inputText The user prompt or un-trusted text payload to analyze.
 * @returns Promise<ModelArmorSanitizeResult> Result indicating safety status and violation details.
 */
export async function sanitizeInputWithModelArmor(
  inputText: string
): Promise<ModelArmorSanitizeResult> {
  const modelArmorTemplate = process.env.MODEL_ARMOR_TEMPLATE_ID;
  const apiKey = process.env.GEMINI_API_KEY || process.env.GCP_API_KEY;

  // Fail-open for local development if Model Armor template is unconfigured
  if (!modelArmorTemplate || !apiKey) {
    console.warn(
      "[Model Armor] MODEL_ARMOR_TEMPLATE_ID or API Key unconfigured. Running input filter in pass-through mode."
    );
    return {
      isSafe: true,
      sanitizedText: inputText,
      violations: [],
    };
  }

  try {
    const endpoint = `https://modelarmor.googleapis.com/v1/${modelArmorTemplate}:sanitizeUserPrompt?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userPromptData: {
          text: inputText,
        },
      }),
    });

    if (!response.ok) {
      console.error(
        `[Model Armor] Input sanitization API HTTP error: ${response.status} ${response.statusText}`
      );
      // Fail-open to preserve client availability if upstream security API encounters transient errors
      return { isSafe: true, sanitizedText: inputText, violations: [] };
    }

    const data = await response.json();
    const matchResult = data?.sanitizationResult?.filterResults;

    const violations: string[] = [];

    if (matchResult?.promptInjectionResult?.matchFound) {
      violations.push("Prompt Injection Attack Detected");
    }
    if (matchResult?.jailbreakResult?.matchFound) {
      violations.push("Jailbreak Attempt Detected");
    }
    if (matchResult?.maliciousUriResult?.matchFound) {
      violations.push("Malicious Link/URI Detected");
    }

    const isSafe = violations.length === 0;
    const sanitizedText = data?.sanitizationResult?.sanitizedText || inputText;

    if (!isSafe) {
      console.warn(
        `[Model Armor Alert] Security Violation(s) Intercepted: ${violations.join(", ")}`
      );
    }

    return {
      isSafe,
      sanitizedText,
      violations,
    };
  } catch (error: any) {
    console.error(
      "[Model Armor] Input inspection execution failed, bypassing filter:",
      error?.message || error
    );
    return { isSafe: true, sanitizedText: inputText, violations: [] };
  }
}

/**
 * Scans AI model responses prior to persisting to storage or delivering to clients,
 * redacting sensitive PII (emails, phone numbers, SSNs, API keys).
 *
 * @param outputText The generated text response from Gemini or RAG engine.
 * @returns Promise<string> The sanitized / redacted text output.
 */
export async function redactOutputWithModelArmor(
  outputText: string
): Promise<string> {
  const modelArmorTemplate = process.env.MODEL_ARMOR_TEMPLATE_ID;
  const apiKey = process.env.GEMINI_API_KEY || process.env.GCP_API_KEY;

  if (!modelArmorTemplate || !apiKey) {
    return outputText;
  }

  try {
    const endpoint = `https://modelarmor.googleapis.com/v1/${modelArmorTemplate}:sanitizeModelResponse?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelResponseData: {
          text: outputText,
        },
      }),
    });

    if (!response.ok) {
      console.error(
        `[Model Armor] Output redaction API HTTP error: ${response.status}`
      );
      return outputText;
    }

    const data = await response.json();
    return data?.sanitizationResult?.sanitizedText || outputText;
  } catch (error: any) {
    console.error(
      "[Model Armor] Output redaction execution failed:",
      error?.message || error
    );
    return outputText;
  }
}
