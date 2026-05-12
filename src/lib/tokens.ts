import { randomBytes } from "crypto";

const FALLBACK_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeToken(prefix: string, bytes = 18) {
  return `${prefix}_${randomBytes(bytes).toString("base64url")}`;
}

export function makeShortCode(length = 6) {
  let code = "";

  for (let index = 0; index < length; index += 1) {
    code += FALLBACK_ALPHABET[randomBytes(1)[0] % FALLBACK_ALPHABET.length];
  }

  return code;
}

export function makeJoinCode() {
  return makeShortCode(5);
}

export function parseBulkList(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [];
  }

  const seen = new Set<string>();

  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLocaleLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

export function parseQuestions(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function extractTargetCredential(scanValue: string) {
  const rawValue = scanValue.trim();

  if (!rawValue) {
    return "";
  }

  try {
    const url = new URL(rawValue);
    const match = url.pathname.match(/\/target\/([^/]+)/);

    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  } catch {
    const match = rawValue.match(/\/target\/([^/?#\s]+)/);

    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  return rawValue.replace(/^target:/i, "").trim();
}
