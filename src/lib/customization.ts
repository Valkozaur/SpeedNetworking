import type { CSSProperties } from "react";

export const ROOM_THEMES = [
  {
    id: "emerald",
    label: "Emerald Salon",
    accent: "#059669",
    background:
      "radial-gradient(circle at 20% 15%, rgba(16,185,129,0.20), transparent 32%), linear-gradient(135deg, #f8fafc 0%, #eefdf7 48%, #f8fafc 100%)",
  },
  {
    id: "midnight",
    label: "Midnight Club",
    accent: "#38bdf8",
    background:
      "radial-gradient(circle at 80% 15%, rgba(56,189,248,0.26), transparent 30%), linear-gradient(135deg, #020617 0%, #0f172a 45%, #111827 100%)",
  },
  {
    id: "sunrise",
    label: "Sunrise Mixer",
    accent: "#f97316",
    background:
      "radial-gradient(circle at 18% 18%, rgba(249,115,22,0.20), transparent 31%), linear-gradient(135deg, #fff7ed 0%, #fef3c7 45%, #f8fafc 100%)",
  },
  {
    id: "atelier",
    label: "Atelier Paper",
    accent: "#be123c",
    background:
      "radial-gradient(circle at 85% 12%, rgba(190,18,60,0.16), transparent 28%), linear-gradient(135deg, #fff1f2 0%, #f8fafc 50%, #f1f5f9 100%)",
  },
] as const;

type RoomTheme = {
  themePreset?: string;
  accentColor?: string;
};

const themeIds: Set<string> = new Set(ROOM_THEMES.map((theme) => theme.id));
const DATA_LOGO_PATTERN = /^data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/=]+$/i;
const MAX_DATA_LOGO_LENGTH = 250_000;

export function getThemePreset(value: unknown) {
  return typeof value === "string" && themeIds.has(value)
    ? value
    : ROOM_THEMES[0].id;
}

export function sanitizeAccentColor(
  value: unknown,
  fallback: string = ROOM_THEMES[0].accent,
) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();

  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized : fallback;
}

export function cleanRoomText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

export function sanitizeLogoUrl(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.trim();

  if (!normalized) {
    return "";
  }

  if (
    normalized.length <= MAX_DATA_LOGO_LENGTH &&
    DATA_LOGO_PATTERN.test(normalized)
  ) {
    return normalized;
  }

  try {
    const url = new URL(normalized);

    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return "";
  }

  return "";
}

export function getThemeById(themePreset: string | undefined) {
  return (
    ROOM_THEMES.find((theme) => theme.id === themePreset) ??
    ROOM_THEMES[0]
  );
}

export function roomThemeStyle(room: RoomTheme): CSSProperties {
  const preset = getThemeById(getThemePreset(room.themePreset));
  const accent = sanitizeAccentColor(room.accentColor, preset.accent);

  return {
    "--room-accent": accent,
    backgroundColor: "#f8fafc",
    backgroundImage: preset.background,
    backgroundPosition: "center",
    backgroundSize: "cover",
    backgroundAttachment: "fixed",
  } as CSSProperties;
}
